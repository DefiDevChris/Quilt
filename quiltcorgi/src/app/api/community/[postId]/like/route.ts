import { NextRequest } from 'next/server';
import { eq, and, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { communityPosts, likes } from '@/db/schema';
import {
  getRequiredSession,
  unauthorizedResponse,
  notFoundResponse,
  errorResponse,
} from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const { postId } = await params;

  try {
    const [post] = await db
      .select({ id: communityPosts.id })
      .from(communityPosts)
      .where(eq(communityPosts.id, postId))
      .limit(1);

    if (!post) {
      return notFoundResponse('Community post not found.');
    }

    try {
      await db.insert(likes).values({
        userId: session.user.id,
        communityPostId: postId,
      });
    } catch {
      return errorResponse('Already liked', 'CONFLICT', 409);
    }

    await db
      .update(communityPosts)
      .set({
        likeCount: sql`${communityPosts.likeCount} + 1`,
      })
      .where(eq(communityPosts.id, postId));

    const [updated] = await db
      .select({ likeCount: communityPosts.likeCount })
      .from(communityPosts)
      .where(eq(communityPosts.id, postId))
      .limit(1);

    return Response.json({
      success: true,
      data: { liked: true, likeCount: updated?.likeCount ?? 0 },
    });
  } catch {
    return errorResponse('Failed to like post', 'INTERNAL_ERROR', 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const { postId } = await params;

  try {
    const deleted = await db
      .delete(likes)
      .where(and(eq(likes.userId, session.user.id), eq(likes.communityPostId, postId)))
      .returning();

    if (deleted.length === 0) {
      return notFoundResponse('Like not found.');
    }

    await db
      .update(communityPosts)
      .set({
        likeCount: sql`GREATEST(${communityPosts.likeCount} - 1, 0)`,
      })
      .where(eq(communityPosts.id, postId));

    const [updated] = await db
      .select({ likeCount: communityPosts.likeCount })
      .from(communityPosts)
      .where(eq(communityPosts.id, postId))
      .limit(1);

    return Response.json({
      success: true,
      data: { liked: false, likeCount: updated?.likeCount ?? 0 },
    });
  } catch {
    return errorResponse('Failed to unlike post', 'INTERNAL_ERROR', 500);
  }
}
