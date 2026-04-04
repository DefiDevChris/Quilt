import { NextRequest } from 'next/server';
import { eq, and, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { socialPosts, likes } from '@/db/schema';
import {
  getRequiredSession,
  unauthorizedResponse,
  notFoundResponse,
  errorResponse,
} from '@/lib/auth-helpers';
import { checkTrustLevel } from '@/middleware/trust-guard';
import { checkRateLimit, API_RATE_LIMITS, rateLimitResponse } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const { postId } = await params;

  const rl = await checkRateLimit(`like:${session.user.id}`, API_RATE_LIMITS.like);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs);

  const trustCheck = await checkTrustLevel(session.user.id, 'canLike');
  if (!trustCheck.allowed) return trustCheck.response!;

  try {
    const [post] = await db
      .select({ id: socialPosts.id })
      .from(socialPosts)
      .where(eq(socialPosts.id, postId))
      .limit(1);

    if (!post) {
      return notFoundResponse('Community post not found.');
    }

    try {
      await db.transaction(async (tx) => {
        await tx.insert(likes).values({
          userId: session.user.id,
          communityPostId: postId,
        });
        await tx
          .update(socialPosts)
          .set({
            likeCount: sql`${socialPosts.likeCount} + 1`,
          })
          .where(eq(socialPosts.id, postId));
      });
    } catch {
      return errorResponse('Already liked', 'CONFLICT', 409);
    }

    const [updated] = await db
      .select({ likeCount: socialPosts.likeCount })
      .from(socialPosts)
      .where(eq(socialPosts.id, postId))
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
    let deletedCount = 0;

    await db.transaction(async (tx) => {
      const deleted = await tx
        .delete(likes)
        .where(and(eq(likes.userId, session.user.id), eq(likes.communityPostId, postId)))
        .returning();

      deletedCount = deleted.length;

      if (deleted.length > 0) {
        await tx
          .update(socialPosts)
          .set({
            likeCount: sql`GREATEST(${socialPosts.likeCount} - 1, 0)`,
          })
          .where(eq(socialPosts.id, postId));
      }
    });

    if (deletedCount === 0) {
      return notFoundResponse('Like not found.');
    }

    const [updated] = await db
      .select({ likeCount: socialPosts.likeCount })
      .from(socialPosts)
      .where(eq(socialPosts.id, postId))
      .limit(1);

    return Response.json({
      success: true,
      data: { liked: false, likeCount: updated?.likeCount ?? 0 },
    });
  } catch {
    return errorResponse('Failed to unlike post', 'INTERNAL_ERROR', 500);
  }
}
