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
    const role = (session.user as { role?: string }).role ?? 'free';
    const isAdmin = role === 'admin';

    let validationError: Response | null = null;

    await db.transaction(async (tx) => {
      const [comment] = await tx
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
        validationError = notFoundResponse('Comment not found.');
        return;
      }

      if (comment.status === 'deleted') {
        validationError = notFoundResponse('Comment already deleted.');
        return;
      }

      const isAuthor = comment.authorId === session.user.id;

      if (!isAuthor && !isAdmin) {
        validationError = errorResponse('You can only delete your own comments.', 'FORBIDDEN', 403);
        return;
      }

      await tx.update(comments).set({ status: 'deleted' }).where(eq(comments.id, commentId));

      await tx
        .update(communityPosts)
        .set({ commentCount: sql`GREATEST(${communityPosts.commentCount} - 1, 0)` })
        .where(eq(communityPosts.id, postId));
    });

    if (validationError) {
      return validationError;
    }

    return Response.json({
      success: true,
      data: { deleted: true },
    });
  } catch {
    return errorResponse('Failed to delete comment', 'INTERNAL_ERROR', 500);
  }
}
