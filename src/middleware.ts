import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify, createRemoteJWKSet } from 'jose';
import { COGNITO_CLIENT_ID } from './lib/cognito';
import { csrfGuard } from './lib/csrf';

const COGNITO_REGION = process.env.COGNITO_REGION ?? process.env.AWS_REGION ?? 'us-east-1';

// Lazy initialization to avoid race with instrumentation.ts secrets loading
function getUserPoolId(): string {
  const id = process.env.COGNITO_USER_POOL_ID ?? '';
  if (!id && process.env.NODE_ENV === 'production') {
    throw new Error('COGNITO_USER_POOL_ID must be set in production');
  }
  return id;
}

function logAudit(event: string, details: Record<string, string>) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level: 'WARN',
    service: 'middleware',
    event,
    ...details,
  };
  console.log(JSON.stringify(logEntry));
}

const protectedRoutes = ['/dashboard', '/studio', '/profile', '/settings', '/admin'];
const authRoutes = ['/auth/signin', '/auth/signup', '/auth/forgot-password', '/auth/verify-email'];

// Lazy initialization of JWKS to avoid race with instrumentation.ts secrets loading
function getJwks() {
  const userPoolId = getUserPoolId();
  if (!userPoolId) return null;
  const jwksUrl = `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${userPoolId}/.well-known/jwks.json`;
  return createRemoteJWKSet(new URL(jwksUrl));
}

async function verifyIdToken(
  token: string,
): Promise<{ sub: string; email: string; groups: string[] } | null> {
  const jwks = getJwks();
  if (!jwks) return null;
  const userPoolId = getUserPoolId();
  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer: `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${userPoolId}`,
      audience: COGNITO_CLIENT_ID,
    });
    // Cognito puts group memberships in the `cognito:groups` claim of the ID token.
    // This is cryptographically signed by the user pool and cannot be tampered with
    // by the client, unlike a plain cookie.
    const rawGroups = (payload as Record<string, unknown>)['cognito:groups'];
    const groups = Array.isArray(rawGroups)
      ? rawGroups.filter((g): g is string => typeof g === 'string')
      : [];
    return {
      sub: payload.sub as string,
      email: (payload.email as string) ?? '',
      groups,
    };
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  // Dev auth bypass — allows testing all pages without Cognito credentials.
  // Require the host to be localhost/127.0.0.1 in addition to the env flag so
  // a misconfigured staging server (missing NODE_ENV=production) cannot
  // silently open every route.
  if (process.env.DEV_AUTH_BYPASS === 'true' && process.env.NODE_ENV !== 'production') {
    const host = req.nextUrl.hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host === '::1') {
      return NextResponse.next();
    }
  }

  const { pathname } = req.nextUrl;

  // CSRF protection for state-changing API requests
  if (pathname.startsWith('/api/')) {
    const csrfResponse = csrfGuard(req);
    if (csrfResponse) {
      logAudit('CSRF_REJECTED', { path: pathname, method: req.method });
      return csrfResponse;
    }
  }

  const idToken = req.cookies.get('qc_id_token')?.value;

  const user = idToken ? await verifyIdToken(idToken) : null;
  const isAuthenticated = !!user;

  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
  if (isProtectedRoute && !isAuthenticated) {
    if (pathname.startsWith('/studio')) {
      return NextResponse.redirect(new URL('/design-studio', req.url));
    }
    const signInUrl = new URL('/auth/signin', req.url);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Admin route protection: verify role from the signed Cognito ID token claims.
  //
  // Previously this gated on the `qc_user_role` cookie, which is client-writeable
  // (anyone could set `document.cookie = 'qc_user_role=admin'` in DevTools and
  // access /admin). The Cognito ID token is signed by the user pool's JWKS and
  // has already been verified above, so `user.groups` is authoritative.
  if (pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/auth/signin', req.url));
    }
    if (!user.groups.includes('admin')) {
      logAudit('UNAUTHORIZED_ADMIN_ACCESS', { path: pathname, sub: user.sub });
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*',
    '/dashboard/:path*',
    '/studio/:path*',
    '/profile/:path*',
    '/settings/:path*',
    '/admin/:path*',
    '/auth/:path*',
  ],
};
