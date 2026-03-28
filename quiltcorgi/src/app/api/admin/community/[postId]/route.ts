import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { communityPosts } from '@/db/schema';
import { adminModerationSchema } from '@/lib/validation';
import {
  getRequiredSession,
  unauthorizedResponse,
  notFoundResponse,
  validationErrorResponse,
  errorResponse,
} from '@/lib/auth-helpers';
import { checkTrustLevel } from '@/middleware/trust-guard';
import { createNotification } from '@/lib/create-notification';
import { NOTIFICATION_TYPES } from '@/lib/notification-types';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const trustCheck = await checkTrustLevel(session.user.id, 'canModerate');
  if (!trustCheck.allowed) return trustCheck.response!;

  const { postId } = await params;

  try {
    const body = await request.json();
    const parsed = adminModerationSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid moderation data');
    }

    const { status } = parsed.data;

    const [existingPost] = await db
      .select({ id: communityPosts.id, userId: communityPosts.userId, title: communityPosts.title })
      .from(communityPosts)
      .where(eq(communityPosts.id, postId))
      .limit(1);

    if (!existingPost) {
      return notFoundResponse('Community post not found.');
    }

    const [updatedPost] = await db
      .update(communityPosts)
      .set({ status })
      .where(eq(communityPosts.id, postId))
      .returning();

    if (status === 'approved') {
      await createNotification({
        userId: existingPost.userId,
        type: NOTIFICATION_TYPES.POST_APPROVED,
        title: 'Design approved!',
        message: `Your design "${existingPost.title}" has been approved and is now visible on the community board.`,
        metadata: { postId },
      });
    } else {
      await createNotification({
        userId: existingPost.userId,
        type: NOTIFICATION_TYPES.POST_REJECTED,
        title: 'Design not approved',
        message: `Your design "${existingPost.title}" was not approved for the community board.`,
        metadata: { postId },
      });
    }

    return Response.json({
      success: true,
      data: updatedPost,
    });
  } catch {
    return errorResponse('Failed to moderate community post', 'INTERNAL_ERROR', 500);
  }
}
