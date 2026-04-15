import { NextRequest } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { cognitoSignIn } from '@/lib/cognito';
import { setAuthCookies, setRoleCookie } from '@/lib/cognito-session';
import { db } from '@/lib/db';
import { users, userProfiles } from '@/db/schema';
import { checkRateLimit, AUTH_RATE_LIMITS, getClientIp, rateLimitResponse } from '@/lib/rate-limit';
import { validationErrorResponse, errorResponse } from '@/lib/auth-helpers';

const signinSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1),
});

async function ensureUserProfile(userId: string, email: string): Promise<void> {
  const [existing] = await db
    .select({ id: userProfiles.id })
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);
  if (existing) return;

  const displayName = email.split('@')[0].slice(0, 60) || 'Quilter';
  await db
    .insert(userProfiles)
    .values({ userId, displayName })
    .onConflictDoNothing({ target: userProfiles.userId });
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = await checkRateLimit(`signin:${ip}`, AUTH_RATE_LIMITS.signin);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs);

  try {
    const body = await request.json();
    const parsed = signinSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(
        parsed.error.issues[0]?.message ?? 'Invalid email or password'
      );
    }

    const { email, password } = parsed.data;

    // Dev bypass: skip Cognito, look up by email with no password check
    if (process.env.DEV_AUTH_BYPASS === 'true' && process.env.NODE_ENV !== 'production') {
      const [existing] = await db
        .select({ id: users.id, role: users.role })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!existing) {
        return errorResponse('No dev account with this email. Sign up first.', 'NOT_FOUND', 404);
      }

      const cookieStore = await cookies();
      cookieStore.set('qc_dev_user_id', existing.id, { httpOnly: true, path: '/', maxAge: 86400 });
      cookieStore.set('qc_user_role', existing.role, { httpOnly: true, path: '/', maxAge: 86400 });

      await ensureUserProfile(existing.id, email);

      return Response.json({ success: true });
    }

    const tokens = await cognitoSignIn(email, password);
    await setAuthCookies(tokens);

    // Ensure user exists in our DB (sync from Cognito on first sign-in)
    const [existing] = await db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    let userId: string;

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
          cognitoSub: cognitoUser.sub,
        })
        .onConflictDoNothing({ target: users.email });

      // Re-query to get the user ID (insert may have been a no-op on conflict)
      const [created] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      userId = created!.id;
      await setRoleCookie('free');
    } else {
      userId = existing.id;
      await setRoleCookie(existing.role);
    }

    await ensureUserProfile(userId, email);

    return Response.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Sign in failed';

    if (message.includes('NotAuthorizedException')) {
      return errorResponse('Invalid email or password', 'UNAUTHORIZED', 401);
    }

    if (message.includes('UserNotConfirmedException')) {
      return validationErrorResponse('Please verify your email first');
    }

    return errorResponse('Sign in failed', 'INTERNAL_ERROR', 500);
  }
}
