import { NextRequest, NextResponse } from 'next/server';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const EXEMPT_PATHS = ['/api/stripe/webhook', '/api/auth/cognito/signout'];

/**
 * Verify CSRF by checking the Origin (or Referer fallback) header
 * against the expected host. Browsers always send Origin on
 * state-changing cross-origin requests, so a missing or mismatched
 * Origin on POST/PUT/PATCH/DELETE indicates a cross-site attack.
 */
export function verifyCsrf(request: NextRequest): boolean {
  if (SAFE_METHODS.has(request.method)) {
    return true;
  }

  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  const source = origin ?? (referer ? new URL(referer).origin : null);

  if (!source) {
    // No Origin or Referer — reject. Legitimate browsers always send
    // at least one on state-changing requests to same-origin APIs.
    return false;
  }

  const expectedOrigin = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;

  return source === expectedOrigin;
}

/**
 * Middleware guard: returns a 403 Response if CSRF validation fails,
 * or null if the request is safe to proceed.
 */
export function csrfGuard(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;

  // Skip exempt paths (webhook signature-verified, cookie-clearing endpoints)
  if (EXEMPT_PATHS.some((path) => pathname.startsWith(path))) {
    return null;
  }

  if (verifyCsrf(request)) {
    return null;
  }

  return NextResponse.json({ success: false, error: 'CSRF validation failed' }, { status: 403 });
}
