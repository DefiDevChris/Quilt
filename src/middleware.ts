import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect / to /shop
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/shop', request.url));
  }

  // Redirect /profile to /settings
  if (pathname === '/profile') {
    return NextResponse.redirect(new URL('/settings', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/profile'],
};
