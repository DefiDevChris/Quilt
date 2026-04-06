import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { socialPosts } from '@/db/schema';
import { requireAdminSession, notFoundResponse, errorResponse } from '@/lib/auth-helpers';
import { checkRateLimit, API_RATE_LIMITS, rateLimitResponse } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const result = await requireAdminSession();
  if (result instanceof Response) return result;
  const { session } = result;

  const rl = await checkRateLimit(`admin:${session.user.id}`, API_RATE_LIMITS.admin);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs);

  const { postId } = await params;

  try {
    const [existingPost] = await db
      .select({ id: socialPosts.id, userId: socialPosts.userId })
      .from(socialPosts)
      .where(eq(socialPosts.id, postId))
      .limit(1);

    if (!existingPost) {
      return notFoundResponse('Community post not found.');
    }

    await db
      .update(socialPosts)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(socialPosts.id, postId));

    return Response.json({
      success: true,
      data: { deleted: true },
    });
  } catch {
    return errorResponse('Failed to delete community post', 'INTERNAL_ERROR', 500);
  }
}
