import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { userProfiles } from '@/db/schema';
import { getSession } from '@/lib/cognito-session';
import { checkRateLimit, API_RATE_LIMITS, getClientIp, rateLimitResponse } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return Response.json(
      { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  const ip = getClientIp(request);
  const rl = await checkRateLimit(`check-username:${ip}`, API_RATE_LIMITS.profile);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs);

  const username = request.nextUrl.searchParams.get('username');

  if (!username) {
    return Response.json({ available: false, message: 'Username is required.' });
  }

  const normalized = username
    .toLowerCase()
    .replace(/[^a-z0-9\-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);

  if (normalized.length < 3) {
    return Response.json({ available: false, message: 'Username must be at least 3 characters.' });
  }

  if (!/^[a-z0-9\-]+$/.test(normalized)) {
    return Response.json({
      available: false,
      message: 'Only lowercase letters, numbers, and hyphens.',
    });
  }

  try {
    const [existing] = await db
      .select({ id: userProfiles.id })
      .from(userProfiles)
      .where(eq(userProfiles.username, normalized))
      .limit(1);

    if (existing) {
      return Response.json({ available: false, message: 'Username is not available.' });
    }

    return Response.json({ available: true, normalized });
  } catch {
    return Response.json({ available: false, message: 'Username is not available.' });
  }
}
