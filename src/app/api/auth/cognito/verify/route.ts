import { NextRequest } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { cognitoConfirmSignUp, cognitoResendVerification } from '@/lib/cognito';
import { db } from '@/lib/db';
import { users } from '@/db/schema';
import { checkRateLimit, AUTH_RATE_LIMITS, getClientIp, rateLimitResponse } from '@/lib/rate-limit';
import { validationErrorResponse, errorResponse } from '@/lib/auth-helpers';

const verifySchema = z.object({
  email: z.string().email(),
  code: z.string().min(1, 'Verification code is required'),
});

const resendSchema = z.object({
  email: z.string().email(),
});

/** Confirm email verification with code. */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = await checkRateLimit(`verify:${ip}`, AUTH_RATE_LIMITS.verify);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs);

  try {
    const body = await request.json();
    const parsed = verifySchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(
        parsed.error.issues[0]?.message ?? 'Invalid verification code'
      );
    }

    const { email, code } = parsed.data;

    await cognitoConfirmSignUp(email, code);

    // Update emailVerified in our DB
    await db.update(users).set({ emailVerified: new Date() }).where(eq(users.email, email));

    return Response.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Verification failed';

    if (message.includes('CodeMismatchException')) {
      return validationErrorResponse('Invalid verification code');
    }

    if (message.includes('ExpiredCodeException')) {
      return validationErrorResponse('Verification code has expired. Please request a new one.');
    }

    return errorResponse('Verification failed', 'INTERNAL_ERROR', 500);
  }
}

/** Resend verification code. */
export async function PUT(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = await checkRateLimit(`resend:${ip}`, AUTH_RATE_LIMITS.resendVerification);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs);

  try {
    const body = await request.json();
    const parsed = resendSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid email');
    }

    await cognitoResendVerification(parsed.data.email);

    return Response.json({ success: true });
  } catch (err) { console.error('[auth/cognito/verify]', err);
    return errorResponse('Failed to resend code', 'INTERNAL_ERROR', 500);
  }
}
