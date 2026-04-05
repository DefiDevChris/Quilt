import { NextRequest } from 'next/server';
import { desc, eq, count } from 'drizzle-orm';
import { db } from '@/lib/db';
import { comments, users, socialPosts, reports } from '@/db/schema';
import {
  getRequiredSession,
  unauthorizedResponse,
  validationErrorResponse,
  errorResponse,
} from '@/lib/auth-helpers';
import { checkTrustLevel } from '@/middleware/trust-guard';
import { z } from 'zod';
import { formatCreatorName } from '@/lib/format-utils';

export const dynamic = 'force-dynamic';

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  reported: z.coerce.boolean().optional(),
});

export async function GET(request: NextRequest) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const trustCheck = await checkTrustLevel(session.user.id, 'canModerate');
  if (!trustCheck.allowed) return trustCheck.response!;

  const url = request.nextUrl;
  const parsed = paginationSchema.safeParse({
    page: url.searchParams.get('page') ?? undefined,
    limit: url.searchParams.get('limit') ?? undefined,
    reported: url.searchParams.get('reported') ?? undefined,
  });

  if (!parsed.success) {
    return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid parameters');
  }

  const { page, limit, reported } = parsed.data;
  const offset = (page - 1) * limit;

  try {
    if (reported) {
      // Get comments that have been reported
      const [commentRows, [totalRow]] = await Promise.all([
        db
          .select({
            id: comments.id,
            content: comments.content,
            status: comments.status,
            createdAt: comments.createdAt,
            authorId: comments.authorId,
            authorName: users.name,
            postId: comments.postId,
            postTitle: socialPosts.title,
          })
          .from(comments)
          .leftJoin(users, eq(comments.authorId, users.id))
          .leftJoin(socialPosts, eq(comments.postId, socialPosts.id))
          .innerJoin(reports, eq(reports.commentId, comments.id))
          .orderBy(desc(comments.createdAt))
          .limit(limit)
          .offset(offset),
        db
          .select({ count: count() })
          .from(comments)
          .innerJoin(reports, eq(reports.commentId, comments.id)),
      ]);

      const total = totalRow?.count ?? 0;

      const commentList = commentRows.map((comment) => ({
        id: comment.id,
        content: comment.content,
        status: comment.status,
        createdAt: comment.createdAt,
        authorId: comment.authorId,
        authorName: comment.authorName ? formatCreatorName(comment.authorName) : 'Anonymous',
        postId: comment.postId,
        postTitle: comment.postTitle,
      }));

      return Response.json({
        success: true,
        data: {
          comments: commentList,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } else {
      // Get all comments
      const [commentRows, [totalRow]] = await Promise.all([
        db
          .select({
            id: comments.id,
            content: comments.content,
            status: comments.status,
            createdAt: comments.createdAt,
            authorId: comments.authorId,
            authorName: users.name,
            postId: comments.postId,
            postTitle: socialPosts.title,
          })
          .from(comments)
          .leftJoin(users, eq(comments.authorId, users.id))
          .leftJoin(socialPosts, eq(comments.postId, socialPosts.id))
          .orderBy(desc(comments.createdAt))
          .limit(limit)
          .offset(offset),
        db.select({ count: count() }).from(comments),
      ]);

      const total = totalRow?.count ?? 0;

      const commentList = commentRows.map((comment) => ({
        id: comment.id,
        content: comment.content,
        status: comment.status,
        createdAt: comment.createdAt,
        authorId: comment.authorId,
        authorName: comment.authorName ? formatCreatorName(comment.authorName) : 'Anonymous',
        postId: comment.postId,
        postTitle: comment.postTitle,
      }));

      return Response.json({
        success: true,
        data: {
          comments: commentList,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    }
  } catch {
    return errorResponse('Failed to fetch comments for moderation', 'INTERNAL_ERROR', 500);
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const trustCheck = await checkTrustLevel(session.user.id, 'canModerate');
  if (!trustCheck.allowed) return trustCheck.response!;

  const id = request.nextUrl.searchParams.get('id');

  if (!id) {
    return validationErrorResponse('Missing comment id');
  }

  try {
    const [existingComment] = await db
      .select({ id: comments.id })
      .from(comments)
      .where(eq(comments.id, id))
      .limit(1);

    if (!existingComment) {
      return errorResponse('Comment not found', 'NOT_FOUND', 404);
    }

    // Soft delete by setting status to deleted
    await db
      .update(comments)
      .set({ status: 'deleted', updatedAt: new Date() })
      .where(eq(comments.id, id));

    return Response.json({
      success: true,
      data: { deleted: true },
    });
  } catch {
    return errorResponse('Failed to delete comment', 'INTERNAL_ERROR', 500);
  }
}
