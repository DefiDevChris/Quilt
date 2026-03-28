import { NextRequest } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { cognitoConfirmSignUp, cognitoResendVerification } from '@/lib/cognito';
import { db } from '@/lib/db';
import { users } from '@/db/schema';

const verifySchema = z.object({
  email: z.string().email(),
  code: z.string().min(1, 'Verification code is required'),
});

const resendSchema = z.object({
  email: z.string().email(),
});

/** Confirm email verification with code. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = verifySchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { success: false, error: 'Invalid verification code', code: 'VALIDATION_ERROR' },
        { status: 422 }
      );
    }

    const { email, code } = parsed.data;

    await cognitoConfirmSignUp(email, code);

    // Update emailVerified in our DB
    await db
      .update(users)
      .set({ emailVerified: new Date() })
      .where(eq(users.email, email));

    return Response.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Verification failed';

    if (message.includes('CodeMismatchException')) {
      return Response.json(
        { success: false, error: 'Invalid verification code', code: 'INVALID_CODE' },
        { status: 400 }
      );
    }

    if (message.includes('ExpiredCodeException')) {
      return Response.json(
        { success: false, error: 'Verification code has expired. Please request a new one.', code: 'EXPIRED_CODE' },
        { status: 400 }
      );
    }

    return Response.json(
      { success: false, error: 'Verification failed', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/** Resend verification code. */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = resendSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { success: false, error: 'Invalid email', code: 'VALIDATION_ERROR' },
        { status: 422 }
      );
    }

    await cognitoResendVerification(parsed.data.email);

    return Response.json({ success: true });
  } catch {
    return Response.json(
      { success: false, error: 'Failed to resend code', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
