import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { reports, communityPosts, comments } from '@/db/schema';
import { reviewReportSchema } from '@/lib/validation';
import { createNotification } from '@/lib/create-notification';
import {
  getRequiredSession,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  validationErrorResponse,
  errorResponse,
} from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

async function hideTargetContent(targetType: string, targetId: string): Promise<void> {
  if (targetType === 'post') {
    await db
      .update(communityPosts)
      .set({ status: 'rejected' })
      .where(eq(communityPosts.id, targetId));
  } else if (targetType === 'comment') {
    await db
      .update(comments)
      .set({ status: 'hidden' })
      .where(eq(comments.id, targetId));
  }
}

async function getReportedUserId(targetType: string, targetId: string): Promise<string | null> {
  if (targetType === 'post') {
    const [post] = await db
      .select({ userId: communityPosts.userId })
      .from(communityPosts)
      .where(eq(communityPosts.id, targetId))
      .limit(1);
    return post?.userId ?? null;
  }

  if (targetType === 'comment') {
    const [comment] = await db
      .select({ authorId: comments.authorId })
      .from(comments)
      .where(eq(comments.id, targetId))
      .limit(1);
    return comment?.authorId ?? null;
  }

  return null;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const role = (session.user as { role?: string }).role ?? 'free';
  if (role !== 'admin') {
    return forbiddenResponse('Admin access required.');
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = reviewReportSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid review data');
    }

    const { action } = parsed.data;

    const [existingReport] = await db
      .select({
        id: reports.id,
        targetType: reports.targetType,
        targetId: reports.targetId,
        status: reports.status,
      })
      .from(reports)
      .where(eq(reports.id, id))
      .limit(1);

    if (!existingReport) {
      return notFoundResponse('Report not found.');
    }

    if (existingReport.status !== 'pending') {
      return errorResponse('Report has already been reviewed.', 'ALREADY_REVIEWED' as never, 409);
    }

    const newStatus = action === 'dismiss' ? 'dismissed' : 'reviewed';

    const [updatedReport] = await db
      .update(reports)
      .set({
        status: newStatus,
        reviewedBy: session.user.id,
      })
      .where(eq(reports.id, id))
      .returning();

    if (action === 'hide_content') {
      await hideTargetContent(existingReport.targetType, existingReport.targetId);
    }

    if (action === 'warn_user') {
      const reportedUserId = await getReportedUserId(
        existingReport.targetType,
        existingReport.targetId
      );

      if (reportedUserId) {
        await createNotification({
          userId: reportedUserId,
          type: 'content_warning',
          title: 'Content warning',
          message:
            'Your content was reported and reviewed by a moderator. Please review the community guidelines.',
          metadata: {
            reportId: id,
            targetType: existingReport.targetType,
            targetId: existingReport.targetId,
          },
        });
      }
    }

    return Response.json({
      success: true,
      data: updatedReport,
    });
  } catch {
    return errorResponse('Failed to review report', 'INTERNAL_ERROR', 500);
  }
}
