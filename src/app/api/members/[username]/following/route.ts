import { NextRequest } from 'next/server';
import { eq, count } from 'drizzle-orm';
import { db } from '@/lib/db';
import { follows, userProfiles } from '@/db/schema';
import { notFoundResponse, errorResponse } from '@/lib/auth-helpers';
import { checkRateLimit, API_RATE_LIMITS, getClientIp, rateLimitResponse } from '@/lib/rate-limit';

async function resolveUserId(username: string): Promise<string | null> {
  const [profile] = await db
    .select({ userId: userProfiles.userId })
    .from(userProfiles)
    .where(eq(userProfiles.username, username))
    .limit(1);
  return profile?.userId ?? null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const ip = getClientIp(request);
  const rl = await checkRateLimit(`following:${ip}`, API_RATE_LIMITS.like);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs);

  const { username } = await params;
  const targetUserId = await resolveUserId(username);

  if (!targetUserId) {
    return notFoundResponse('User not found.');
  }

  const url = request.nextUrl;
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10));
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') ?? '20', 10)));
  const offset = (page - 1) * limit;

  try {
    const [followingRows, [totalRow]] = await Promise.all([
      db
        .select({
          displayName: userProfiles.displayName,
          username: userProfiles.username,
          avatarUrl: userProfiles.avatarUrl,
          followedAt: follows.createdAt,
        })
        .from(follows)
        .innerJoin(userProfiles, eq(follows.followingId, userProfiles.userId))
        .where(eq(follows.followerId, targetUserId))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: count() })
        .from(follows)
        .where(eq(follows.followerId, targetUserId)),
    ]);

    const total = totalRow?.count ?? 0;

    return Response.json({
      success: true,
      data: {
        following: followingRows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch {
    return errorResponse('Failed to load following.', 'INTERNAL_ERROR', 500);
  }
}
