import { cookies } from 'next/headers';
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import { COGNITO_USER_POOL_ID, COGNITO_REGION, cognitoRefreshTokens } from './cognito';

const COOKIE_ID_TOKEN = 'qc_id_token';
const COOKIE_ACCESS_TOKEN = 'qc_access_token';
const COOKIE_REFRESH_TOKEN = 'qc_refresh_token';

const JWKS_URL = `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}/.well-known/jwks.json`;

const jwks = createRemoteJWKSet(new URL(JWKS_URL));

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
    const { payload } = await jwtVerify(token, jwks, {
      issuer: `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}`,
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
    sameSite: 'lax' as const,
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

/** Clear all auth cookies (sign out). */
export async function clearAuthCookies(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_ID_TOKEN);
  cookieStore.delete(COOKIE_ACCESS_TOKEN);
  cookieStore.delete(COOKIE_REFRESH_TOKEN);
}

/**
 * Get the current session from cookies. Verifies JWT, attempts refresh if expired.
 * Requires a DB lookup to get the user's role (stored in our DB, not Cognito).
 */
export async function getSession(): Promise<CognitoSession | null> {
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

  // Import DB lazily to avoid circular deps
  const { db } = await import('./db');
  const { users } = await import('@/db/schema');
  const { eq } = await import('drizzle-orm');

  const cognitoSub = payload.sub as string;
  const email = (payload.email as string) ?? '';
  const name = (payload.name as string) ?? '';
  const emailVerified = (payload.email_verified as boolean) ?? false;

  // Look up user in our DB by email (Cognito sub might not match our user ID)
  const [dbUser] = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  const role = (dbUser?.role as 'free' | 'pro' | 'admin') ?? 'free';
  const userId = dbUser?.id ?? cognitoSub;

  return {
    user: {
      id: userId,
      email,
      name,
      role,
      emailVerified,
    },
    accessToken,
  };
}

async function tryRefreshSession(refreshToken: string): Promise<CognitoSession | null> {
  try {
    const newTokens = await cognitoRefreshTokens(refreshToken);

    // Set updated cookies
    await setAuthCookies({
      idToken: newTokens.idToken,
      accessToken: newTokens.accessToken,
      refreshToken,
      expiresIn: newTokens.expiresIn,
    });

    // Re-parse the new id token
    const payload = await verifyToken(newTokens.idToken);
    if (!payload) return null;

    const { db } = await import('./db');
    const { users } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');

    const email = (payload.email as string) ?? '';
    const name = (payload.name as string) ?? '';
    const emailVerified = (payload.email_verified as boolean) ?? false;

    const [dbUser] = await db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    const role = (dbUser?.role as 'free' | 'pro' | 'admin') ?? 'free';
    const userId = dbUser?.id ?? (payload.sub as string);

    return {
      user: {
        id: userId,
        email,
        name,
        role,
        emailVerified,
      },
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
): Promise<{ sub: string; email: string; role?: string } | null> {
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
