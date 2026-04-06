import { NextRequest } from 'next/server';
import { eq, and, isNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import { socialPosts, likes, users, projects, userProfiles } from '@/db/schema';
import { errorResponse } from '@/lib/auth-helpers';
import { getSession } from '@/lib/cognito-session';
import { formatCreatorName } from '@/lib/format-utils';
import { isPro } from '@/lib/role-utils';
import type { UserRole } from '@/lib/role-utils';
import { checkRateLimit, API_RATE_LIMITS, getClientIp, rateLimitResponse } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const ip = getClientIp(request);
  const rl = await checkRateLimit(`community-post:${ip}`, API_RATE_LIMITS.blocks);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs);

  const { postId } = await params;
  const session = await getSession();

  try {
    const [row] = await db
      .select({
        id: socialPosts.id,
        title: socialPosts.title,
        description: socialPosts.description,
        thumbnailUrl: socialPosts.thumbnailUrl,
        likeCount: socialPosts.likeCount,
        commentCount: socialPosts.commentCount,
        category: socialPosts.category,
        createdAt: socialPosts.createdAt,
        creatorId: socialPosts.userId,
        creatorName: users.name,
        creatorUsername: userProfiles.username,
        creatorAvatarUrl: userProfiles.avatarUrl,
        creatorRole: users.role,
        projectId: socialPosts.projectId,
        projectName: projects.name,
        projectThumbnailUrl: projects.thumbnailUrl,
      })
      .from(socialPosts)
      .leftJoin(users, eq(socialPosts.userId, users.id))
      .leftJoin(userProfiles, eq(socialPosts.userId, userProfiles.userId))
      .leftJoin(projects, eq(socialPosts.projectId, projects.id))
      .where(and(eq(socialPosts.id, postId), isNull(socialPosts.deletedAt)))
      .limit(1);

    if (!row) {
      return errorResponse('Post not found', 'NOT_FOUND', 404);
    }

    let isLikedByUser = false;

    if (session) {
      const userLike = await db
        .select({ communityPostId: likes.communityPostId })
        .from(likes)
        .where(and(eq(likes.userId, session.user.id), eq(likes.communityPostId, postId)))
        .limit(1);
      isLikedByUser = userLike.length > 0;
    }

    const post = {
      id: row.id,
      title: row.title,
      description: row.description,
      thumbnailUrl: row.thumbnailUrl,
      likeCount: row.likeCount,
      commentCount: row.commentCount,
      category: row.category,
      creatorId: row.creatorId,
      creatorName: row.creatorName ? formatCreatorName(row.creatorName) : 'Anonymous',
      creatorUsername: row.creatorUsername ?? null,
      creatorAvatarUrl: row.creatorAvatarUrl ?? null,
      isPro: isPro((row.creatorRole ?? 'free') as UserRole),
      projectId: row.projectId,
      projectName: row.projectName ?? null,
      projectThumbnailUrl: row.projectThumbnailUrl ?? null,
      createdAt: row.createdAt,
      isLikedByUser,
    };

    return Response.json({ success: true, data: post });
  } catch {
    return errorResponse('Failed to fetch post', 'INTERNAL_ERROR', 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);
  }

  const { postId } = await params;

  try {
    // Check if post exists and user owns it (or is admin)
    const [post] = await db
      .select({ id: socialPosts.id, userId: socialPosts.userId })
      .from(socialPosts)
      .where(eq(socialPosts.id, postId))
      .limit(1);

    if (!post) {
      return errorResponse('Post not found', 'NOT_FOUND', 404);
    }

    if (post.userId !== session.user.id && session.user.role !== 'admin') {
      return errorResponse('Forbidden', 'FORBIDDEN', 403);
    }

    // Soft delete: set deletedAt timestamp
    await db
      .update(socialPosts)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(socialPosts.id, postId));

    return Response.json({ success: true });
  } catch {
    return errorResponse('Failed to delete post', 'INTERNAL_ERROR', 500);
  }
}
