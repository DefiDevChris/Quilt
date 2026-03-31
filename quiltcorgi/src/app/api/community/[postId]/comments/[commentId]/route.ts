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
import { checkRateLimit, API_RATE_LIMITS, rateLimitResponse } from '@/lib/rate-limit';
import { z } from 'zod';

const commentModerationSchema = z.object({
  status: z.enum(['visible', 'hidden']),
});

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

/** PATCH /api/community/[postId]/comments/[commentId] - Moderate a comment (admin only) */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string; commentId: string }> }
) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  // Only admins can moderate comments
  if (session.user.role !== 'admin') {
    return errorResponse('Admin access required.', 'FORBIDDEN', 403);
  }

  const rl = await checkRateLimit(`comment-mod:${session.user.id}`, API_RATE_LIMITS.admin);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs);

  const { postId, commentId } = await params;

  try {
    const body = await request.json();
    const parsed = commentModerationSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse('Invalid status. Must be "visible" or "hidden".', 'VALIDATION_ERROR', 400);
    }

    const { status } = parsed.data;

    const [comment] = await db
      .select({
        id: comments.id,
        postId: comments.postId,
        status: comments.status,
      })
      .from(comments)
      .where(eq(comments.id, commentId))
      .limit(1);

    if (!comment || comment.postId !== postId) {
      return notFoundResponse('Comment not found.');
    }

    if (comment.status === 'deleted') {
      return errorResponse('Cannot moderate a deleted comment.', 'BAD_REQUEST', 400);
    }

    const [updated] = await db
      .update(comments)
      .set({ status })
      .where(eq(comments.id, commentId))
      .returning();

    return Response.json({
      success: true,
      data: updated,
    });
  } catch {
    return errorResponse('Failed to moderate comment', 'INTERNAL_ERROR', 500);
  }
}
