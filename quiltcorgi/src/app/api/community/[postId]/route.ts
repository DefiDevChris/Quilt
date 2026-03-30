import { NextRequest } from 'next/server';
import { eq, and, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { communityPosts, likes, users, projects, userProfiles, savedPosts } from '@/db/schema';
import { getRequiredSession, errorResponse } from '@/lib/auth-helpers';
import { formatCreatorName } from '@/lib/format-utils';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params;
  const session = await getRequiredSession();

  try {
    const [row] = await db
      .select({
        id: communityPosts.id,
        title: communityPosts.title,
        description: communityPosts.description,
        thumbnailUrl: communityPosts.thumbnailUrl,
        likeCount: communityPosts.likeCount,
        commentCount: communityPosts.commentCount,
        category: communityPosts.category,
        createdAt: communityPosts.createdAt,
        creatorId: communityPosts.userId,
        creatorName: users.name,
        creatorUsername: userProfiles.username,
        creatorAvatarUrl: userProfiles.avatarUrl,
        creatorRole: users.role,
        projectId: communityPosts.projectId,
        projectName: projects.name,
        projectThumbnailUrl: projects.thumbnailUrl,
      })
      .from(communityPosts)
      .leftJoin(users, eq(communityPosts.userId, users.id))
      .leftJoin(userProfiles, eq(communityPosts.userId, userProfiles.userId))
      .leftJoin(projects, eq(communityPosts.projectId, projects.id))
      .where(and(eq(communityPosts.id, postId), eq(communityPosts.status, 'approved')))
      .limit(1);

    if (!row) {
      return errorResponse('Post not found', 'NOT_FOUND', 404);
    }

    let isLikedByUser = false;
    let isSavedByUser = false;

    if (session) {
      const [userLike, userSave] = await Promise.all([
        db
          .select({ communityPostId: likes.communityPostId })
          .from(likes)
          .where(and(eq(likes.userId, session.user.id), sql`${likes.communityPostId} = ${postId}`))
          .limit(1),
        db
          .select({ postId: savedPosts.postId })
          .from(savedPosts)
          .where(and(eq(savedPosts.userId, session.user.id), sql`${savedPosts.postId} = ${postId}`))
          .limit(1),
      ]);
      isLikedByUser = userLike.length > 0;
      isSavedByUser = userSave.length > 0;
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
      isPro: row.creatorRole === 'pro' || row.creatorRole === 'admin',
      projectId: row.projectId,
      projectName: row.projectName ?? null,
      projectThumbnailUrl: row.projectThumbnailUrl ?? null,
      createdAt: row.createdAt,
      isLikedByUser,
      isSavedByUser,
    };

    return Response.json({ success: true, data: post });
  } catch {
    return errorResponse('Failed to fetch post', 'INTERNAL_ERROR', 500);
  }
}
