import { getSession } from '@/lib/cognito-session';
import { checkRateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit';

const SESSION_RATE_LIMIT = { limit: 30, windowMs: 60 * 1000 };

/** Return current session info (for client-side session sync). */
export async function GET(request: Request) {
  const ip = getClientIp(request);
  const rl = await checkRateLimit(`session:${ip}`, SESSION_RATE_LIMIT);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs);

  const session = await getSession();

  if (!session) {
    return Response.json({ success: true, data: null });
  }

  return Response.json({
    success: true,
    data: {
      user: session.user,
    },
  });
}
