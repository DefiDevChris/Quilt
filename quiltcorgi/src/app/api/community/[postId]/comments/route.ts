import { NextRequest } from 'next/server';
import { eq, and, isNull, desc, count, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { comments, communityPosts, users, userProfiles } from '@/db/schema';
import { createCommentSchema, commentsPaginationSchema } from '@/lib/validation';
import {
  getRequiredSession,
  unauthorizedResponse,
  notFoundResponse,
  validationErrorResponse,
  errorResponse,
} from '@/lib/auth-helpers';
import { checkTrustLevel, checkPrivacyPermission, checkRateLimit } from '@/middleware/trust-guard';
import { createNotification } from '@/lib/create-notification';
import { NOTIFICATION_TYPES } from '@/lib/notification-types';

export const dynamic = 'force-dynamic';

const HIDDEN_CONTENT_PLACEHOLDER = '[This comment has been hidden by a moderator.]';
const DELETED_CONTENT_PLACEHOLDER = '[This comment has been deleted.]';
const MAX_INLINE_REPLIES = 3;

interface CommentRow {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  replyToId: string | null;
  likeCount: number;
  status: 'visible' | 'hidden' | 'deleted';
  createdAt: Date;
  authorName: string | null;
  authorUsername: string | null;
  authorAvatarUrl: string | null;
}

function formatComment(row: CommentRow, isLikedByUser: boolean) {
  const displayContent =
    row.status === 'hidden'
      ? HIDDEN_CONTENT_PLACEHOLDER
      : row.status === 'deleted'
        ? DELETED_CONTENT_PLACEHOLDER
        : row.content;

  return {
    id: row.id,
    postId: row.postId,
    authorId: row.authorId,
    content: displayContent,
    replyToId: row.replyToId,
    likeCount: row.likeCount,
    status: row.status,
    createdAt: row.createdAt,
    authorName: row.authorName ?? 'Anonymous',
    authorUsername: row.authorUsername ?? null,
    authorAvatarUrl: row.authorAvatarUrl ?? null,
    isLikedByUser,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  await getRequiredSession();
  const { postId } = await params;

  const url = request.nextUrl;
  const parsed = commentsPaginationSchema.safeParse({
    page: url.searchParams.get('page') ?? undefined,
    limit: url.searchParams.get('limit') ?? undefined,
  });

  if (!parsed.success) {
    return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid parameters');
  }

  const { page, limit } = parsed.data;
  const offset = (page - 1) * limit;

  try {
    const [post] = await db
      .select({ id: communityPosts.id })
      .from(communityPosts)
      .where(eq(communityPosts.id, postId))
      .limit(1);

    if (!post) {
      return notFoundResponse('Community post not found.');
    }

    const [topLevelRows, [totalRow]] = await Promise.all([
      db
        .select({
          id: comments.id,
          postId: comments.postId,
          authorId: comments.authorId,
          content: comments.content,
          replyToId: comments.replyToId,
          likeCount: sql<number>`0`.as('likeCount'),
          status: comments.status,
          createdAt: comments.createdAt,
          authorName: users.name,
          authorUsername: userProfiles.username,
          authorAvatarUrl: userProfiles.avatarUrl,
        })
        .from(comments)
        .leftJoin(users, eq(comments.authorId, users.id))
        .leftJoin(userProfiles, eq(comments.authorId, userProfiles.userId))
        .where(and(eq(comments.postId, postId), isNull(comments.replyToId)))
        .orderBy(desc(comments.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: count() })
        .from(comments)
        .where(and(eq(comments.postId, postId), isNull(comments.replyToId))),
    ]);

    const total = totalRow?.count ?? 0;

    const topLevelIds = topLevelRows.map((c) => c.id);

    let replyRows: CommentRow[] = [];
    let replyCountRows: { replyToId: string | null; count: number }[] = [];

    if (topLevelIds.length > 0) {
      const [replies, replyCounts] = await Promise.all([
        db
          .select({
            id: comments.id,
            postId: comments.postId,
            authorId: comments.authorId,
            content: comments.content,
            replyToId: comments.replyToId,
            likeCount: sql<number>`0`.as('likeCount'),
            status: comments.status,
            createdAt: comments.createdAt,
            authorName: users.name,
            authorUsername: userProfiles.username,
            authorAvatarUrl: userProfiles.avatarUrl,
          })
          .from(comments)
          .leftJoin(users, eq(comments.authorId, users.id))
          .leftJoin(userProfiles, eq(comments.authorId, userProfiles.userId))
          .where(sql`${comments.replyToId} = ANY(${topLevelIds})`)
          .orderBy(desc(comments.createdAt))
          .limit(topLevelIds.length * MAX_INLINE_REPLIES * 2),
        db
          .select({
            replyToId: comments.replyToId,
            count: count(),
          })
          .from(comments)
          .where(sql`${comments.replyToId} = ANY(${topLevelIds})`)
          .groupBy(comments.replyToId),
      ]);

      replyRows = replies as CommentRow[];
      replyCountRows = replyCounts;
    }

    const likedCommentIds = new Set<string>();

    const replyCountMap = new Map(replyCountRows.map((r) => [r.replyToId, r.count]));

    const repliesByParent = new Map<string, CommentRow[]>();
    for (const reply of replyRows) {
      const parentId = reply.replyToId!;
      const existing = repliesByParent.get(parentId) ?? [];
      repliesByParent.set(parentId, [...existing, reply]);
    }

    const commentsWithReplies = topLevelRows.map((topComment) => {
      const parentReplies = repliesByParent.get(topComment.id) ?? [];
      const sortedReplies = [...parentReplies]
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        .slice(0, MAX_INLINE_REPLIES);

      return {
        ...formatComment(topComment as CommentRow, likedCommentIds.has(topComment.id)),
        replies: sortedReplies.map((r) => formatComment(r, likedCommentIds.has(r.id))),
        totalReplyCount: replyCountMap.get(topComment.id) ?? 0,
      };
    });

    return Response.json({
      success: true,
      data: {
        comments: commentsWithReplies,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch {
    return errorResponse('Failed to fetch comments', 'INTERNAL_ERROR', 500);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const { postId } = await params;

  const trustCheck = await checkTrustLevel(session.user.id, 'canComment');
  if (!trustCheck.allowed) return trustCheck.response!;

  const privacyCheck = await checkPrivacyPermission(session.user.id, 'canComment');
  if (!privacyCheck.allowed) return privacyCheck.response!;

  const rateCheck = await checkRateLimit(session.user.id, trustCheck.role, 'comments');
  if (!rateCheck.allowed) return rateCheck.response!;

  try {
    const body = await request.json();
    const parsed = createCommentSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid comment data');
    }

    const { content, replyToId } = parsed.data;

    const [post] = await db
      .select({ id: communityPosts.id, userId: communityPosts.userId, title: communityPosts.title })
      .from(communityPosts)
      .where(eq(communityPosts.id, postId))
      .limit(1);

    if (!post) {
      return notFoundResponse('Community post not found.');
    }

    let effectiveReplyToId: string | null = null;
    let parentComment: { id: string; authorId: string; replyToId: string | null } | undefined;

    if (replyToId) {
      const [parent] = await db
        .select({
          id: comments.id,
          authorId: comments.authorId,
          replyToId: comments.replyToId,
          postId: comments.postId,
        })
        .from(comments)
        .where(eq(comments.id, replyToId))
        .limit(1);

      if (!parent) {
        return notFoundResponse('Parent comment not found.');
      }

      if (parent.postId !== postId) {
        return validationErrorResponse('Parent comment does not belong to this post.');
      }

      effectiveReplyToId = parent.replyToId ? parent.replyToId : parent.id;
      parentComment = { id: parent.id, authorId: parent.authorId, replyToId: parent.replyToId };
    }

    const [created] = await db.transaction(async (tx) => {
      const [comment] = await tx
        .insert(comments)
        .values({
          postId,
          authorId: session.user.id,
          content,
          replyToId: effectiveReplyToId,
          status: 'visible',
        })
        .returning();

      await tx
        .update(communityPosts)
        .set({ commentCount: sql`${communityPosts.commentCount} + 1` })
        .where(eq(communityPosts.id, postId));

      return [comment];
    });

    const authorName = session.user.name ?? 'Someone';

    if (post.userId !== session.user.id) {
      await createNotification({
        userId: post.userId,
        type: NOTIFICATION_TYPES.COMMENT_ON_POST,
        title: 'New comment',
        message: `${authorName} commented on your post "${post.title}"`,
        metadata: { postId, commentId: created!.id },
      });
    }

    if (parentComment && parentComment.authorId !== session.user.id) {
      if (parentComment.authorId !== post.userId) {
        await createNotification({
          userId: parentComment.authorId,
          type: NOTIFICATION_TYPES.REPLY_TO_COMMENT,
          title: 'New reply',
          message: `${authorName} replied to your comment`,
          metadata: { postId, commentId: created!.id, parentCommentId: parentComment.id },
        });
      }
    }

    return Response.json(
      {
        success: true,
        data: created,
      },
      { status: 201 }
    );
  } catch {
    return errorResponse('Failed to create comment', 'INTERNAL_ERROR', 500);
  }
}
