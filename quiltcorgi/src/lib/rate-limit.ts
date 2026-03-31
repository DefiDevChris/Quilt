import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/**
 * Hybrid rate limiter for auth endpoints.
 *
 * Uses Upstash Redis for distributed rate limiting across serverless instances
 * if UPSTASH_REDIS_REST_URL is configured.
 *
 * Falls back to an in-memory Map for local development or when Redis is absent.
 */

// --- Redis Implementation ---
const useRedis = !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

// Warn if Redis is not configured in production
if (!useRedis && process.env.NODE_ENV === 'production') {
  console.warn('[RATE_LIMIT] Redis not configured - falling back to in-memory rate limiter. This is not recommended for production as rate limits will not be shared across serverless instances.');
}

const redisLimiterCache = new Map<string, Ratelimit>();
function getRedisRatelimiter(limit: number, windowMs: number): Ratelimit {
  const cacheKey = `${limit}:${windowMs}`;
  if (!redisLimiterCache.has(cacheKey)) {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
    // Convert ms to seconds for Upstash
    const windowSecs = Math.max(1, Math.floor(windowMs / 1000));
    redisLimiterCache.set(cacheKey, new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${windowSecs} s`),
      analytics: false,
    }));
  }
  return redisLimiterCache.get(cacheKey)!;
}


// --- In-Memory Fallback Implementation ---
interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();
const MAX_STORE_SIZE = 10_000;
const CLEANUP_INTERVAL_MS = 60_000;
let lastCleanup = Date.now();

function evictOldestEntries() {
  if (store.size <= MAX_STORE_SIZE) return;
  const excess = store.size - MAX_STORE_SIZE;
  let evicted = 0;
  for (const key of store.keys()) {
    store.delete(key);
    evicted++;
    if (evicted >= excess) break;
  }
}

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
  limit: number;
  windowMs: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

export async function checkRateLimit(key: string, options: RateLimitOptions): Promise<RateLimitResult> {
  const { limit, windowMs } = options;

  if (useRedis) {
    const ratelimit = getRedisRatelimiter(limit, windowMs);
    const result = await ratelimit.limit(key);
    return {
      allowed: result.success,
      remaining: result.remaining,
      retryAfterMs: result.success ? 0 : result.reset - Date.now(),
    };
  }

  // --- Fallback Memory Mode ---
  const now = Date.now();
  const cutoff = now - windowMs;

  cleanup(windowMs);

  const entry = store.get(key);
  if (!entry) {
    evictOldestEntries();
    store.set(key, { timestamps: [now] });
    return { allowed: true, remaining: limit - 1, retryAfterMs: 0 };
  }

  const inWindow = entry.timestamps.filter((t) => t > cutoff);
  entry.timestamps = inWindow.length > limit ? inWindow.slice(-limit) : inWindow;

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
  signin: { limit: 5, windowMs: 15 * 60 * 1000 },
  signup: { limit: 3, windowMs: 15 * 60 * 1000 },
  forgotPassword: { limit: 3, windowMs: 15 * 60 * 1000 },
  forgotPasswordConfirm: { limit: 5, windowMs: 15 * 60 * 1000 },
  verify: { limit: 5, windowMs: 15 * 60 * 1000 },
  resendVerification: { limit: 3, windowMs: 15 * 60 * 1000 },
} as const;

export const API_RATE_LIMITS = {
  blocks: { limit: 30, windowMs: 60 * 1000 },
  fabrics: { limit: 30, windowMs: 60 * 1000 },
  projects: { limit: 20, windowMs: 60 * 1000 },
  like: { limit: 30, windowMs: 60 * 1000 },
  save: { limit: 30, windowMs: 60 * 1000 },
  stripe: { limit: 10, windowMs: 60 * 1000 },
  upload: { limit: 20, windowMs: 60 * 1000 },
  profile: { limit: 10, windowMs: 60 * 1000 },
  admin: { limit: 30, windowMs: 60 * 1000 },
} as const;

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const ips = forwarded.split(',').map(ip => ip.trim()).filter(ip => ip);
    // Behind a proxy/load balancer, the rightmost IP is the most trusted (closest to server).
    // Take the last untrusted entry (rightmost), not the first which can be spoofed.
    // If there's only one IP, use it (direct connection).
    return ips.length > 1 ? ips[ips.length - 1] ?? 'unknown' : ips[0] ?? 'unknown';
  }
  // x-real-ip is set by the trusted proxy - use it if available
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
