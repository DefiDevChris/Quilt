import { NextRequest } from 'next/server';
import { z } from 'zod';
import { cognitoForgotPassword, cognitoConfirmForgotPassword } from '@/lib/cognito';
import { checkRateLimit, AUTH_RATE_LIMITS, getClientIp, rateLimitResponse } from '@/lib/rate-limit';

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
  const rl = checkRateLimit(`forgot:${ip}`, AUTH_RATE_LIMITS.forgotPassword);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs);

  try {
    const body = await request.json();
    const parsed = initiateSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { success: false, error: 'Invalid email', code: 'VALIDATION_ERROR' },
        { status: 422 }
      );
    }

    await cognitoForgotPassword(parsed.data.email);

    // Always return success to prevent email enumeration
    return Response.json({ success: true });
  } catch {
    // Still return success to prevent email enumeration
    return Response.json({ success: true });
  }
}

/** Confirm password reset with code and new password. */
export async function PUT(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`forgot-confirm:${ip}`, AUTH_RATE_LIMITS.forgotPasswordConfirm);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs);

  try {
    const body = await request.json();
    const parsed = confirmSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? 'Invalid input';
      return Response.json(
        { success: false, error: firstError, code: 'VALIDATION_ERROR' },
        { status: 422 }
      );
    }

    const { email, code, newPassword } = parsed.data;

    await cognitoConfirmForgotPassword(email, code, newPassword);

    return Response.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Reset failed';

    if (message.includes('CodeMismatchException')) {
      return Response.json(
        { success: false, error: 'Invalid reset code', code: 'INVALID_CODE' },
        { status: 400 }
      );
    }

    if (message.includes('ExpiredCodeException')) {
      return Response.json(
        {
          success: false,
          error: 'Reset code has expired. Please request a new one.',
          code: 'EXPIRED_CODE',
        },
        { status: 400 }
      );
    }

    if (message.includes('InvalidPasswordException')) {
      return Response.json(
        {
          success: false,
          error: 'Password must include uppercase, lowercase, and numbers',
          code: 'VALIDATION_ERROR',
        },
        { status: 422 }
      );
    }

    return Response.json(
      { success: false, error: 'Password reset failed', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
