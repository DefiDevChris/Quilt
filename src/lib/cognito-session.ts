import { cookies } from 'next/headers';
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import {
  COGNITO_USER_POOL_ID,
  COGNITO_REGION,
  COGNITO_CLIENT_ID,
  cognitoRefreshTokens,
} from './cognito';

const COOKIE_ID_TOKEN = 'qc_id_token';
const COOKIE_ACCESS_TOKEN = 'qc_access_token';
const COOKIE_REFRESH_TOKEN = 'qc_refresh_token';

// Lazy initialization of JWKS to avoid race with instrumentation.ts secrets loading.
// COGNITO_USER_POOL_ID and COGNITO_REGION are read at call time, not module-load time,
// so secrets loaded by instrumentation.ts are available.
let jwksInstance: ReturnType<typeof createRemoteJWKSet> | null = null;
let jwksCachedPoolId: string | null = null;

function getJwks() {
  const currentPoolId = COGNITO_USER_POOL_ID;
  if (!jwksInstance || jwksCachedPoolId !== currentPoolId) {
    const jwksUrl = `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${currentPoolId}/.well-known/jwks.json`;
    jwksInstance = createRemoteJWKSet(new URL(jwksUrl));
    jwksCachedPoolId = currentPoolId;
  }
  return jwksInstance;
}

export interface CognitoSession {
  user: {
    id: string;
    email: string;
    name: string;
    role: 'free' | 'pro' | 'admin';
    emailVerified: boolean;
  };
  accessToken: string;
}

/** Verify a Cognito JWT and return its payload. */
async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwks(), {
      issuer: `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}`,
      audience: COGNITO_CLIENT_ID,
    });
    return payload;
  } catch {
    return null;
  }
}

/**
 * Set auth cookies after successful sign-in.
 * Must be called from a Server Action or Route Handler (not middleware).
 */
export async function setAuthCookies(tokens: {
  idToken: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}): Promise<void> {
  const cookieStore = await cookies();
  const secure = process.env.NODE_ENV === 'production';
  const baseCookieOptions = {
    httpOnly: true,
    secure,
    sameSite: 'strict' as const,
    path: '/',
  };

  cookieStore.set(COOKIE_ID_TOKEN, tokens.idToken, {
    ...baseCookieOptions,
    maxAge: tokens.expiresIn,
  });

  cookieStore.set(COOKIE_ACCESS_TOKEN, tokens.accessToken, {
    ...baseCookieOptions,
    maxAge: tokens.expiresIn,
  });

  cookieStore.set(COOKIE_REFRESH_TOKEN, tokens.refreshToken, {
    ...baseCookieOptions,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });
}

/**
 * Set role cookie for proxy-level admin route gating.
 * Only read server-side (proxy.ts) — no client JS needs access, so httpOnly is safe.
 * This is NOT security-critical — API routes still enforce DB-based role checks.
 */
export async function setRoleCookie(role: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set('qc_user_role', role, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60, // 1 hour — refreshed on each sign-in
  });
}

/** Clear all auth cookies (sign out). */
export async function clearAuthCookies(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_ID_TOKEN);
  cookieStore.delete(COOKIE_ACCESS_TOKEN);
  cookieStore.delete(COOKIE_REFRESH_TOKEN);
  cookieStore.delete('qc_user_role');
  cookieStore.delete('qc_dev_user_id');
}

/**
 * Get the current session from cookies. Verifies JWT, attempts refresh if expired.
 * Requires a DB lookup to get the user's role (stored in our DB, not Cognito).
 */
export async function getSession(): Promise<CognitoSession | null> {
  if (process.env.DEV_AUTH_BYPASS === 'true' && process.env.NODE_ENV !== 'production') {
    const cookieStore = await cookies();
    const devUserId = cookieStore.get('qc_dev_user_id')?.value;

    const { db } = await import('./db');
    const { users } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');
    const { desc } = await import('drizzle-orm');

    // Use cookie-specified user, or fall back to most recently created DB user
    const [user] = devUserId
      ? await db.select().from(users).where(eq(users.id, devUserId)).limit(1)
      : await db.select().from(users).orderBy(desc(users.createdAt)).limit(1);

    if (user) {
      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name ?? user.email.split('@')[0],
          role: user.role as 'free' | 'pro' | 'admin',
          emailVerified: !!user.emailVerified,
        },
        accessToken: 'dev-access-token',
      };
    }

    // No users in DB — sign up first
    return null;
  }
  const cookieStore = await cookies();
  const idToken = cookieStore.get(COOKIE_ID_TOKEN)?.value;
  const accessToken = cookieStore.get(COOKIE_ACCESS_TOKEN)?.value;
  const refreshToken = cookieStore.get(COOKIE_REFRESH_TOKEN)?.value;

  if (!idToken || !accessToken) {
    // Try refresh if we have a refresh token
    if (refreshToken) {
      return tryRefreshSession(refreshToken);
    }
    return null;
  }

  const payload = await verifyToken(idToken);
  if (!payload) {
    // Token expired, try refresh
    if (refreshToken) {
      return tryRefreshSession(refreshToken);
    }
    return null;
  }

  const sessionUser = await resolveUserFromPayload(payload);

  return {
    user: sessionUser,
    accessToken,
  };
}

/**
 * Shared user-lookup logic: finds user by cognitoSub (with email fallback),
 * backfills cognitoSub for pre-migration users, and returns session user data.
 */
async function resolveUserFromPayload(
  payload: Record<string, unknown>
): Promise<CognitoSession['user']> {
  const { db } = await import('./db');
  const { users } = await import('@/db/schema');
  const { eq } = await import('drizzle-orm');

  const cognitoSub = payload.sub as string;
  const email = (payload.email as string) ?? '';
  const name = (payload.name as string) ?? '';
  const emailVerified = (payload.email_verified as boolean) ?? false;

  // Look up by cognitoSub first, fall back to email for pre-migration users
  let [dbUser] = await db
    .select({ id: users.id, role: users.role, cognitoSub: users.cognitoSub })
    .from(users)
    .where(eq(users.cognitoSub, cognitoSub))
    .limit(1);

  if (!dbUser) {
    [dbUser] = await db
      .select({ id: users.id, role: users.role, cognitoSub: users.cognitoSub })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    // Backfill cognitoSub for pre-migration users
    if (dbUser && !dbUser.cognitoSub) {
      await db.update(users).set({ cognitoSub }).where(eq(users.id, dbUser.id));
    }
  }

  const role = (dbUser?.role as 'free' | 'pro' | 'admin') ?? 'free';
  const userId = dbUser?.id ?? cognitoSub;

  return { id: userId, email, name, role, emailVerified };
}

async function tryRefreshSession(refreshToken: string): Promise<CognitoSession | null> {
  try {
    const newTokens = await cognitoRefreshTokens(refreshToken);

    // Try to persist refreshed tokens to cookies.
    // This will silently fail in RSC context (cookies are read-only there),
    // but we still return the session so the user isn't incorrectly logged out.
    try {
      await setAuthCookies({
        idToken: newTokens.idToken,
        accessToken: newTokens.accessToken,
        refreshToken,
        expiresIn: newTokens.expiresIn,
      });
    } catch {
      // Cookie write failed (likely RSC context) — silently continue
    }

    // Re-parse the new id token
    const payload = await verifyToken(newTokens.idToken);
    if (!payload) return null;

    const sessionUser = await resolveUserFromPayload(payload);

    return {
      user: sessionUser,
      accessToken: newTokens.accessToken,
    };
  } catch {
    return null;
  }
}

/**
 * Lightweight token check for middleware (no DB lookup, no cookie writes).
 * Only verifies the JWT signature and expiry.
 */
export async function verifySessionToken(
  idToken: string
): Promise<{ sub: string; email: string } | null> {
  const payload = await verifyToken(idToken);
  if (!payload) return null;

  return {
    sub: payload.sub as string,
    email: (payload.email as string) ?? '',
  };
}

/** Cookie names exported for middleware access. */
export const AUTH_COOKIE_NAMES = {
  idToken: COOKIE_ID_TOKEN,
  accessToken: COOKIE_ACCESS_TOKEN,
  refreshToken: COOKIE_REFRESH_TOKEN,
} as const;

/**
 * Reusable auth check for layout files. Returns session or redirects to signin.
 * Supports DEV_AUTH_BYPASS for local development.
 */
export async function requireAuth(options?: {
  redirectTo?: string;
  requireAdmin?: boolean;
}): Promise<CognitoSession> {
  const { redirectTo = '/auth/signin', requireAdmin = false } = options ?? {};

  const session = await getSession();

  if (!session) {
    redirect(redirectTo);
  }

  if (requireAdmin && session.user.role !== 'admin') {
    redirect('/dashboard');
  }

  return session;
}

// Import redirect at the end to avoid circular dependencies
import { redirect } from 'next/navigation';
