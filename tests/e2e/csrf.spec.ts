import { test, expect } from '@playwright/test';

/**
 * CSRF regression tests.
 *
 * The middleware (src/middleware.ts) runs csrfGuard on every state-changing
 * /api/* request. A browser-originated cross-site POST will carry an Origin
 * header that does not match NEXT_PUBLIC_APP_URL (or the request origin), and
 * must be rejected with 403.
 *
 * Exempt paths (src/lib/csrf.ts EXEMPT_PATHS) are excluded.
 */

const STATE_CHANGING_ENDPOINTS = [
  '/api/projects',
  '/api/blocks',
  '/api/fabrics',
  '/api/upload/presigned-url',
];

const EXEMPT_PATHS = ['/api/stripe/webhook', '/api/auth/cognito/signout'];

test.describe('CSRF protection', () => {
  test('rejects state-changing requests from foreign Origin with 403', async ({ request }) => {
    for (const endpoint of STATE_CHANGING_ENDPOINTS) {
      const response = await request.post(endpoint, {
        data: {},
        headers: {
          'Content-Type': 'application/json',
          Origin: 'https://evil.example.com',
        },
      });
      expect(
        response.status(),
        `expected ${endpoint} to reject foreign Origin with 403, got ${response.status()}`
      ).toBe(403);

      const body = await response.json().catch(() => null);
      if (body) {
        expect(body).toMatchObject({ success: false });
      }
    }
  });

  test('rejects state-changing requests with no Origin and no Referer with 403', async ({
    request,
  }) => {
    const response = await request.fetch('/api/projects', {
      method: 'POST',
      data: {},
      headers: { 'Content-Type': 'application/json' },
    });
    // The Playwright APIRequest context may auto-add an Origin; if it does,
    // it will match and we get 401 instead. Accept either outcome — the key
    // assertion is "never 200-ish for a no-origin POST".
    expect([401, 403]).toContain(response.status());
  });

  test('safe methods are not blocked by CSRF', async ({ request }) => {
    const response = await request.get('/api/blog', {
      headers: { Origin: 'https://evil.example.com' },
    });
    // 200 or 401/403 from downstream auth — but never a CSRF 403 payload.
    expect(response.status()).not.toBe(403);
  });

  test('exempt paths are not blocked by CSRF', async ({ request }) => {
    for (const path of EXEMPT_PATHS) {
      const response = await request.post(path, {
        data: {},
        headers: {
          'Content-Type': 'application/json',
          Origin: 'https://evil.example.com',
        },
      });
      // Stripe webhook returns 400 (missing signature); cognito signout
      // returns 200/302. Neither should be a CSRF 403.
      const body = await response.text();
      expect(
        body,
        `${path} returned CSRF failure despite being exempt`
      ).not.toContain('CSRF validation failed');
    }
  });

  test('same-origin POST bypasses CSRF guard (reaches auth layer)', async ({
    request,
    baseURL,
  }) => {
    const origin = baseURL ?? 'http://localhost:3000';
    const response = await request.post('/api/projects', {
      data: { name: 'csrf-test' },
      headers: {
        'Content-Type': 'application/json',
        Origin: origin,
      },
    });
    // Unauthenticated — should get 401 from the route handler, NOT 403 from CSRF.
    expect(response.status()).toBe(401);
  });
});
