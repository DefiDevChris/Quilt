import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify, createRemoteJWKSet } from 'jose';

const COGNITO_REGION = process.env.COGNITO_REGION ?? process.env.AWS_REGION ?? 'us-east-1';
const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID ?? '';

if (!COGNITO_USER_POOL_ID && process.env.NODE_ENV === 'production') {
  throw new Error('COGNITO_USER_POOL_ID must be set in production');
}

const JWKS_URL = `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}/.well-known/jwks.json`;

const jwks = COGNITO_USER_POOL_ID ? createRemoteJWKSet(new URL(JWKS_URL)) : null;

const protectedRoutes = ['/studio', '/profile', '/admin'];
const authRoutes = ['/auth/signin', '/auth/signup', '/auth/forgot-password', '/auth/verify-email'];

async function verifyIdToken(token: string): Promise<{ sub: string; email: string } | null> {
  if (!jwks) return null;
  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer: `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}`,
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
  // DEV BYPASS — skip all auth checks in development
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.next();
  }

  const { pathname } = req.nextUrl;
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
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/studio/:path*',
    '/profile/:path*',
    '/admin/:path*',
    '/auth/:path*',
  ],
};
