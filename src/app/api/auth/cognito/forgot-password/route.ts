import { NextRequest } from 'next/server';
import { z } from 'zod';
import { cognitoForgotPassword, cognitoConfirmForgotPassword } from '@/lib/cognito';
import { checkRateLimit, AUTH_RATE_LIMITS, getClientIp, rateLimitResponse } from '@/lib/rate-limit';
import { validationErrorResponse, errorResponse } from '@/lib/auth-helpers';

const initiateSchema = z.object({
  email: z.string().email(),
});

const confirmSchema = z.object({
  email: z.string().email(),
  code: z.string().min(1),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

/** Initiate forgot password — sends code to email. */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = await checkRateLimit(`forgot:${ip}`, AUTH_RATE_LIMITS.forgotPassword);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs);

  try {
    const body = await request.json();
    const parsed = initiateSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid email');
    }

    await cognitoForgotPassword(parsed.data.email);

    // Always return success to prevent email enumeration
    return Response.json({ success: true });
  } catch (err) { console.error('[auth/cognito/forgot-password]', err);
    // Still return success to prevent email enumeration
    return Response.json({ success: true });
  }
}

/** Confirm password reset with code and new password. */
export async function PUT(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = await checkRateLimit(`forgot-confirm:${ip}`, AUTH_RATE_LIMITS.forgotPasswordConfirm);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs);

  try {
    const body = await request.json();
    const parsed = confirmSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? 'Invalid input';
      return validationErrorResponse(firstError);
    }

    const { email, code, newPassword } = parsed.data;

    await cognitoConfirmForgotPassword(email, code, newPassword);

    return Response.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Reset failed';

    if (message.includes('CodeMismatchException')) {
      return validationErrorResponse('Invalid reset code');
    }

    if (message.includes('ExpiredCodeException')) {
      return validationErrorResponse('Reset code has expired. Please request a new one.');
    }

    if (message.includes('InvalidPasswordException')) {
      return validationErrorResponse('Password must include uppercase, lowercase, and numbers');
    }

    return errorResponse('Password reset failed', 'INTERNAL_ERROR', 500);
  }
}
