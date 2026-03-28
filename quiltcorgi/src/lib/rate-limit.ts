/**
 * In-memory sliding-window rate limiter for auth endpoints.
 * For multi-instance deployments, replace with Redis-backed implementation.
 */

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

const CLEANUP_INTERVAL_MS = 60_000;
let lastCleanup = Date.now();

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  const cutoff = now - windowMs;
  for (const [key, entry] of store) {
    const filtered = entry.timestamps.filter((t) => t > cutoff);
    if (filtered.length === 0) {
      store.delete(key);
    } else {
      entry.timestamps = filtered;
    }
  }
}

interface RateLimitOptions {
  /** Max requests allowed in the window. */
  limit: number;
  /** Window size in milliseconds. */
  windowMs: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

export function checkRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const { limit, windowMs } = options;
  const now = Date.now();
  const cutoff = now - windowMs;

  cleanup(windowMs);

  const entry = store.get(key);
  if (!entry) {
    store.set(key, { timestamps: [now] });
    return { allowed: true, remaining: limit - 1, retryAfterMs: 0 };
  }

  entry.timestamps = entry.timestamps.filter((t) => t > cutoff);

  if (entry.timestamps.length >= limit) {
    const oldestInWindow = entry.timestamps[0] ?? now;
    const retryAfterMs = oldestInWindow + windowMs - now;
    return { allowed: false, remaining: 0, retryAfterMs };
  }

  entry.timestamps.push(now);
  return { allowed: true, remaining: limit - entry.timestamps.length, retryAfterMs: 0 };
}

/** Rate limit presets for auth endpoints. */
export const AUTH_RATE_LIMITS = {
  /** Sign-in: 5 attempts per 15 minutes per IP. */
  signin: { limit: 5, windowMs: 15 * 60 * 1000 },
  /** Sign-up: 3 attempts per 15 minutes per IP. */
  signup: { limit: 3, windowMs: 15 * 60 * 1000 },
  /** Forgot password initiate: 3 per 15 minutes per IP. */
  forgotPassword: { limit: 3, windowMs: 15 * 60 * 1000 },
  /** Password reset confirm: 5 per 15 minutes per IP. */
  forgotPasswordConfirm: { limit: 5, windowMs: 15 * 60 * 1000 },
  /** Verify code: 5 per 15 minutes per IP. */
  verify: { limit: 5, windowMs: 15 * 60 * 1000 },
  /** Resend verification: 3 per 15 minutes per IP. */
  resendVerification: { limit: 3, windowMs: 15 * 60 * 1000 },
} as const;

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() ?? 'unknown';
  }
  return request.headers.get('x-real-ip') ?? 'unknown';
}

export function rateLimitResponse(retryAfterMs: number): Response {
  return Response.json(
    { success: false, error: 'Too many requests. Please try again later.', code: 'RATE_LIMITED' },
    {
      status: 429,
      headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) },
    }
  );
}
