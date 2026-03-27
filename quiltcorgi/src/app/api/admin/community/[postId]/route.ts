import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { communityPosts, notifications } from '@/db/schema';
import { adminModerationSchema } from '@/lib/validation';
import {
  getRequiredSession,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  validationErrorResponse,
  errorResponse,
} from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const role = (session.user as { role?: string }).role ?? 'free';
  if (role !== 'admin') {
    return forbiddenResponse('Admin access required.');
  }

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
      await db.insert(notifications).values({
        userId: existingPost.userId,
        type: 'post_approved',
        title: 'Design approved!',
        message: `Your design "${existingPost.title}" has been approved and is now visible on the community board.`,
        metadata: { postId },
      });
    } else {
      await db.insert(notifications).values({
        userId: existingPost.userId,
        type: 'post_rejected',
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
