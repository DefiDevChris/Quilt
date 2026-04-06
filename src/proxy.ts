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
    service: 'proxy',
    event,
    ...details,
  };
  // Use console.log for structured logging (JSON) instead of console.warn
  // This allows log aggregation systems to parse the structured data
  console.log(JSON.stringify(logEntry));
}

const protectedRoutes = [
  '/dashboard',
  '/studio',
  '/profile',
  '/settings',
  '/admin',
  '/photo-to-design',
];
const authRoutes = ['/auth/signin', '/auth/signup', '/auth/forgot-password', '/auth/verify-email'];

// Lazy initialization of JWKS to avoid race with instrumentation.ts secrets loading
function getJwks() {
  const userPoolId = getUserPoolId();
  if (!userPoolId) return null;
  const jwksUrl = `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${userPoolId}/.well-known/jwks.json`;
  return createRemoteJWKSet(new URL(jwksUrl));
}

async function verifyIdToken(token: string): Promise<{ sub: string; email: string } | null> {
  const jwks = getJwks();
  if (!jwks) return null;
  const userPoolId = getUserPoolId();
  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer: `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${userPoolId}`,
      audience: COGNITO_CLIENT_ID,
    });
    return {
      sub: payload.sub as string,
      email: (payload.email as string) ?? '',
    };
  } catch {
    return null;
  }
}

export async function proxy(req: NextRequest) {
  // Dev auth bypass — allows testing all pages without Cognito credentials
  if (process.env.DEV_AUTH_BYPASS === 'true' && process.env.NODE_ENV !== 'production') {
    return NextResponse.next();
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
    const signInUrl = new URL('/auth/signin', req.url);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Admin route protection: check role cookie set during sign-in.
  // This is UI gating only — API routes still enforce DB-based role checks.
  if (pathname.startsWith('/admin')) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/auth/signin', req.url));
    }
    const role = req.cookies.get('qc_user_role')?.value;
    if (role !== 'admin') {
      logAudit('UNAUTHORIZED_ADMIN_ACCESS', { path: pathname });
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
    '/photo-to-design/:path*',
    '/admin/:path*',
    '/auth/:path*',
    '/onboarding/:path*',
  ],
};
