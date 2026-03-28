import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { reports, communityPosts, comments } from '@/db/schema';
import { reviewReportSchema } from '@/lib/validation';
import { createNotification } from '@/lib/create-notification';
import { NOTIFICATION_TYPES } from '@/lib/notification-types';
import {
  getRequiredSession,
  unauthorizedResponse,
  notFoundResponse,
  validationErrorResponse,
  errorResponse,
} from '@/lib/auth-helpers';
import { checkTrustLevel } from '@/middleware/trust-guard';

export const dynamic = 'force-dynamic';

async function hideTargetContent(targetType: string, targetId: string): Promise<void> {
  if (targetType === 'post') {
    await db
      .update(communityPosts)
      .set({ status: 'rejected' })
      .where(eq(communityPosts.id, targetId));
  } else if (targetType === 'comment') {
    await db.update(comments).set({ status: 'hidden' }).where(eq(comments.id, targetId));
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

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const trustCheck = await checkTrustLevel(session.user.id, 'canModerate');
  if (!trustCheck.allowed) {
    return trustCheck.response!;
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
          type: NOTIFICATION_TYPES.REPORT_REVIEWED,
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
