import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import { follows, userProfiles, users } from '@/db/schema';
import { errorResponse, validationErrorResponse } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;

  const uuidResult = z.string().uuid().safeParse(userId);
  if (!uuidResult.success) {
    return validationErrorResponse('Invalid user ID format.');
  }

  const url = request.nextUrl;
  const type = url.searchParams.get('type');

  if (type !== 'followers' && type !== 'following') {
    return validationErrorResponse('Query parameter "type" must be "followers" or "following".');
  }

  try {
    if (type === 'followers') {
      const followerRows = await db
        .select({
          displayName: userProfiles.displayName,
          username: userProfiles.username,
          avatarUrl: userProfiles.avatarUrl,
          role: users.role,
        })
        .from(follows)
        .innerJoin(userProfiles, eq(follows.followerId, userProfiles.userId))
        .innerJoin(users, eq(follows.followerId, users.id))
        .where(eq(follows.followingId, userId));

      const data = followerRows.map((row) => ({
        displayName: row.displayName,
        username: row.username,
        avatarUrl: row.avatarUrl,
        isPro: row.role === 'pro' || row.role === 'admin',
      }));

      return Response.json({
        success: true,
        data,
      });
    }

    const followingRows = await db
      .select({
        displayName: userProfiles.displayName,
        username: userProfiles.username,
        avatarUrl: userProfiles.avatarUrl,
        role: users.role,
      })
      .from(follows)
      .innerJoin(userProfiles, eq(follows.followingId, userProfiles.userId))
      .innerJoin(users, eq(follows.followingId, users.id))
      .where(eq(follows.followerId, userId));

    const data = followingRows.map((row) => ({
      displayName: row.displayName,
      username: row.username,
      avatarUrl: row.avatarUrl,
      isPro: row.role === 'pro' || row.role === 'admin',
    }));

    return Response.json({
      success: true,
      data,
    });
  } catch {
    return errorResponse('Failed to fetch follow list', 'INTERNAL_ERROR', 500);
  }
}
