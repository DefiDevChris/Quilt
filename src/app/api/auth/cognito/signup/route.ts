import { NextRequest } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { cognitoSignUp } from '@/lib/cognito';
import { db } from '@/lib/db';
import { users } from '@/db/schema';
import { checkRateLimit, AUTH_RATE_LIMITS, getClientIp, rateLimitResponse } from '@/lib/rate-limit';
import { validationErrorResponse, errorResponse } from '@/lib/auth-helpers';

const signupSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  email: z.string().email().max(255),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = await checkRateLimit(`signup:${ip}`, AUTH_RATE_LIMITS.signup);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs);

  try {
    const body = await request.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? 'Invalid input';
      return validationErrorResponse(firstError);
    }

    const { name, email, password } = parsed.data;

    // Dev bypass: skip Cognito, create verified pro user directly in DB
    if (process.env.DEV_AUTH_BYPASS === 'true') {
      await db
        .insert(users)
        .values({ name, email, role: 'free', emailVerified: new Date() })
        .onConflictDoNothing({ target: users.email });

      const [user] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (user) {
        const cookieStore = await cookies();
        cookieStore.set('qc_dev_user_id', user.id, { httpOnly: true, path: '/', maxAge: 86400 });
        cookieStore.set('qc_user_role', 'free', { httpOnly: true, path: '/', maxAge: 86400 });
      }

      return Response.json(
        { success: true, data: { message: 'Dev account created.', devMode: true } },
        { status: 201 }
      );
    }

    // Register with Cognito first — let Cognito be the source of truth for
    // duplicate detection. This avoids a TOCTOU race where the DB check passes
    // but another request creates the Cognito user between check and sign-up.
    // Cognito will throw UsernameExistsException if the email is already taken.
    await cognitoSignUp(email, password, name);

    // Create user in our DB (unverified, no password hash needed).
    // Use onConflictDoNothing to handle the rare case where the DB row already
    // exists (e.g., concurrent signup attempts that both passed Cognito).
    await db
      .insert(users)
      .values({
        name,
        email,
        role: 'free',
        emailVerified: null,
      })
      .onConflictDoNothing({ target: users.email });

    return Response.json(
      { success: true, data: { message: 'Please check your email to verify your account.' } },
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Registration failed';

    if (message.includes('UsernameExistsException')) {
      return errorResponse('An account with this email already exists', 'CONFLICT', 409);
    }

    if (message.includes('InvalidPasswordException')) {
      return validationErrorResponse('Password must include uppercase, lowercase, and numbers');
    }

    return errorResponse('Registration failed', 'INTERNAL_ERROR', 500);
  }
}
