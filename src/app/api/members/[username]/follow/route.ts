import { NextRequest } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { follows, userProfiles } from '@/db/schema';
import {
  getRequiredSession,
  unauthorizedResponse,
  notFoundResponse,
  errorResponse,
} from '@/lib/auth-helpers';
import { checkRateLimit, API_RATE_LIMITS, getClientIp, rateLimitResponse } from '@/lib/rate-limit';

async function resolveUserId(username: string): Promise<string | null> {
  const [profile] = await db
    .select({ userId: userProfiles.userId })
    .from(userProfiles)
    .where(eq(userProfiles.username, username))
    .limit(1);
  return profile?.userId ?? null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const ip = getClientIp(request);
  const rl = await checkRateLimit(`follow:${ip}`, API_RATE_LIMITS.like);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs);

  const { username } = await params;
  const targetUserId = await resolveUserId(username);

  if (!targetUserId) {
    return notFoundResponse('User not found.');
  }

  if (targetUserId === session.user.id) {
    return errorResponse('You cannot follow yourself.', 'VALIDATION_ERROR', 422);
  }

  try {
    await db
      .insert(follows)
      .values({
        followerId: session.user.id,
        followingId: targetUserId,
      })
      .onConflictDoNothing();

    return Response.json({ success: true, data: { following: true } });
  } catch {
    return errorResponse('Failed to follow user.', 'INTERNAL_ERROR', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const ip = getClientIp(request);
  const rl = await checkRateLimit(`follow:${ip}`, API_RATE_LIMITS.like);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs);

  const { username } = await params;
  const targetUserId = await resolveUserId(username);

  if (!targetUserId) {
    return notFoundResponse('User not found.');
  }

  try {
    await db
      .delete(follows)
      .where(and(eq(follows.followerId, session.user.id), eq(follows.followingId, targetUserId)));

    return Response.json({ success: true, data: { following: false } });
  } catch {
    return errorResponse('Failed to unfollow user.', 'INTERNAL_ERROR', 500);
  }
}
