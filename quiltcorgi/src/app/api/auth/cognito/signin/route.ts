import { NextRequest } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { cognitoSignIn } from '@/lib/cognito';
import { setAuthCookies, setRoleCookie } from '@/lib/cognito-session';
import { db } from '@/lib/db';
import { users } from '@/db/schema';
import { checkRateLimit, AUTH_RATE_LIMITS, getClientIp, rateLimitResponse } from '@/lib/rate-limit';

const signinSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`signin:${ip}`, AUTH_RATE_LIMITS.signin);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs);

  try {
    const body = await request.json();
    const parsed = signinSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { success: false, error: 'Invalid email or password', code: 'VALIDATION_ERROR' },
        { status: 422 }
      );
    }

    const { email, password } = parsed.data;

    const tokens = await cognitoSignIn(email, password);
    await setAuthCookies(tokens);

    // Ensure user exists in our DB (sync from Cognito on first sign-in)
    const [existing] = await db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!existing) {
      // First sign-in: create user record synced from Cognito
      // Use onConflictDoNothing to handle race conditions from concurrent logins
      const { cognitoGetUser } = await import('@/lib/cognito');
      const cognitoUser = await cognitoGetUser(tokens.accessToken);

      await db
        .insert(users)
        .values({
          email: cognitoUser.email,
          name: cognitoUser.name || email.split('@')[0],
          role: 'free',
          emailVerified: cognitoUser.emailVerified ? new Date() : null,
        })
        .onConflictDoNothing({ target: users.email });

      await setRoleCookie('free');
    } else {
      await setRoleCookie(existing.role);
    }

    return Response.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Sign in failed';

    if (message.includes('NotAuthorizedException')) {
      return Response.json(
        { success: false, error: 'Invalid email or password', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    if (message.includes('UserNotConfirmedException')) {
      return Response.json(
        { success: false, error: 'Please verify your email first', code: 'UNVERIFIED' },
        { status: 403 }
      );
    }

    return Response.json(
      { success: false, error: 'Sign in failed', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
