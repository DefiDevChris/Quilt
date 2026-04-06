import { NextRequest } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { socialPosts, bookmarks } from '@/db/schema';
import {
  getRequiredSession,
  unauthorizedResponse,
  notFoundResponse,
  errorResponse,
} from '@/lib/auth-helpers';
import { checkRateLimit, API_RATE_LIMITS, rateLimitResponse } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

/** POST /api/social/[postId]/bookmark — toggle bookmark (insert if absent, delete if present) */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const { postId } = await params;

  const rl = await checkRateLimit(`bookmark:${session.user.id}`, API_RATE_LIMITS.like);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs);

  try {
    const [post] = await db
      .select({ id: socialPosts.id })
      .from(socialPosts)
      .where(eq(socialPosts.id, postId))
      .limit(1);

    if (!post) {
      return notFoundResponse('Post not found.');
    }

    // Check if already bookmarked
    const [existing] = await db
      .select({ userId: bookmarks.userId })
      .from(bookmarks)
      .where(and(eq(bookmarks.userId, session.user.id), eq(bookmarks.postId, postId)))
      .limit(1);

    if (existing) {
      // Remove bookmark
      await db
        .delete(bookmarks)
        .where(and(eq(bookmarks.userId, session.user.id), eq(bookmarks.postId, postId)));

      return Response.json({ success: true, data: { bookmarked: false } });
    }

    // Add bookmark
    await db.insert(bookmarks).values({
      userId: session.user.id,
      postId,
    });

    return Response.json({ success: true, data: { bookmarked: true } });
  } catch {
    return errorResponse('Failed to toggle bookmark', 'INTERNAL_ERROR', 500);
  }
}
