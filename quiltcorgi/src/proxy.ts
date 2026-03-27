import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

const protectedRoutes = ['/dashboard', '/studio', '/profile', '/admin'];
const authRoutes = ['/auth/signin', '/auth/signup'];

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;
  const isAuthenticated = !!req.auth?.user;

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

  if (pathname.startsWith('/admin') && isAuthenticated) {
    const role = req.auth?.user?.role;
    if (role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/studio/:path*',
    '/profile/:path*',
    '/admin/:path*',
    '/auth/:path*',
  ],
};
