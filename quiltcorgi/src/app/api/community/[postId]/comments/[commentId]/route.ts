import { NextRequest } from 'next/server';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { comments, communityPosts } from '@/db/schema';
import {
  getRequiredSession,
  unauthorizedResponse,
  notFoundResponse,
  errorResponse,
} from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ postId: string; commentId: string }> }
) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const { postId, commentId } = await params;

  try {
    const [comment] = await db
      .select({
        id: comments.id,
        postId: comments.postId,
        authorId: comments.authorId,
        status: comments.status,
      })
      .from(comments)
      .where(eq(comments.id, commentId))
      .limit(1);

    if (!comment || comment.postId !== postId) {
      return notFoundResponse('Comment not found.');
    }

    if (comment.status === 'deleted') {
      return notFoundResponse('Comment already deleted.');
    }

    const role = (session.user as { role?: string }).role ?? 'free';
    const isAdmin = role === 'admin';
    const isAuthor = comment.authorId === session.user.id;

    if (!isAuthor && !isAdmin) {
      return errorResponse('You can only delete your own comments.', 'FORBIDDEN', 403);
    }

    await db.update(comments).set({ status: 'deleted' }).where(eq(comments.id, commentId));

    await db
      .update(communityPosts)
      .set({ commentCount: sql`GREATEST(${communityPosts.commentCount} - 1, 0)` })
      .where(eq(communityPosts.id, postId));

    return Response.json({
      success: true,
      data: { deleted: true },
    });
  } catch {
    return errorResponse('Failed to delete comment', 'INTERNAL_ERROR', 500);
  }
}
