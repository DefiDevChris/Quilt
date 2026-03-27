import { NextRequest } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { communityPosts, savedPosts } from '@/db/schema';
import {
  getRequiredSession,
  unauthorizedResponse,
  notFoundResponse,
  errorResponse,
} from '@/lib/auth-helpers';
import { checkTrustLevel } from '@/middleware/trust-guard';

export const dynamic = 'force-dynamic';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const trustCheck = await checkTrustLevel(session.user.id, 'canSave');
  if (!trustCheck.allowed) {
    return trustCheck.response!;
  }

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

    const [existing] = await db
      .select({ postId: savedPosts.postId })
      .from(savedPosts)
      .where(
        and(
          eq(savedPosts.userId, session.user.id),
          eq(savedPosts.postId, postId)
        )
      )
      .limit(1);

    if (existing) {
      await db
        .delete(savedPosts)
        .where(
          and(
            eq(savedPosts.userId, session.user.id),
            eq(savedPosts.postId, postId)
          )
        );

      return Response.json({
        success: true,
        data: { saved: false },
      });
    }

    await db.insert(savedPosts).values({
      userId: session.user.id,
      postId,
    });

    return Response.json({
      success: true,
      data: { saved: true },
    });
  } catch {
    return errorResponse('Failed to toggle saved post', 'INTERNAL_ERROR', 500);
  }
}
