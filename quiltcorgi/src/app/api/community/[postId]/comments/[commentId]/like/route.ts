import { NextRequest } from 'next/server';
import { eq, and, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { comments, commentLikes } from '@/db/schema';
import {
  getRequiredSession,
  unauthorizedResponse,
  notFoundResponse,
  errorResponse,
} from '@/lib/auth-helpers';
import { checkTrustLevel } from '@/middleware/trust-guard';
import { createNotification } from '@/lib/create-notification';

export const dynamic = 'force-dynamic';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ postId: string; commentId: string }> }
) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const { postId, commentId } = await params;

  const trustCheck = await checkTrustLevel(session.user.id, 'canLike');
  if (!trustCheck.allowed) return trustCheck.response!;

  try {
    const [comment] = await db
      .select({ id: comments.id, postId: comments.postId, authorId: comments.authorId })
      .from(comments)
      .where(eq(comments.id, commentId))
      .limit(1);

    if (!comment || comment.postId !== postId) {
      return notFoundResponse('Comment not found.');
    }

    const [existingLike] = await db
      .select({ userId: commentLikes.userId })
      .from(commentLikes)
      .where(
        and(eq(commentLikes.userId, session.user.id), eq(commentLikes.commentId, commentId))
      )
      .limit(1);

    if (existingLike) {
      await db
        .delete(commentLikes)
        .where(
          and(eq(commentLikes.userId, session.user.id), eq(commentLikes.commentId, commentId))
        );

      await db
        .update(comments)
        .set({ likeCount: sql`GREATEST(${comments.likeCount} - 1, 0)` })
        .where(eq(comments.id, commentId));

      const [updated] = await db
        .select({ likeCount: comments.likeCount })
        .from(comments)
        .where(eq(comments.id, commentId))
        .limit(1);

      return Response.json({
        success: true,
        data: { liked: false, likeCount: updated?.likeCount ?? 0 },
      });
    }

    await db.insert(commentLikes).values({
      userId: session.user.id,
      commentId,
    });

    await db
      .update(comments)
      .set({ likeCount: sql`${comments.likeCount} + 1` })
      .where(eq(comments.id, commentId));

    const [updated] = await db
      .select({ likeCount: comments.likeCount })
      .from(comments)
      .where(eq(comments.id, commentId))
      .limit(1);

    if (comment.authorId !== session.user.id) {
      const authorName = session.user.name ?? 'Someone';
      await createNotification({
        userId: comment.authorId,
        type: 'comment_like',
        title: 'Comment liked',
        message: `${authorName} liked your comment`,
        metadata: { postId, commentId },
      });
    }

    return Response.json({
      success: true,
      data: { liked: true, likeCount: updated?.likeCount ?? 0 },
    });
  } catch {
    return errorResponse('Failed to toggle comment like', 'INTERNAL_ERROR', 500);
  }
}
