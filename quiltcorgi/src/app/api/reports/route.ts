import { NextRequest } from 'next/server';
import { eq, and, count } from 'drizzle-orm';
import { db } from '@/lib/db';
import { reports, communityPosts, comments, users } from '@/db/schema';
import { createReportSchema } from '@/lib/validation';
import { AUTO_HIDE_REPORT_THRESHOLD } from '@/lib/constants';
import { createNotification } from '@/lib/create-notification';
import type { ReportTargetType } from '@/types/community';
import {
  getRequiredSession,
  unauthorizedResponse,
  validationErrorResponse,
  errorResponse,
} from '@/lib/auth-helpers';
import { checkTrustLevel, checkRateLimit } from '@/middleware/trust-guard';

export const dynamic = 'force-dynamic';

async function notifyAdminsOfAutoHide(
  targetType: ReportTargetType,
  targetId: string
): Promise<void> {
  const adminUsers = await db.select({ id: users.id }).from(users).where(eq(users.role, 'admin'));

  const notifications = adminUsers.map((admin) =>
    createNotification({
      userId: admin.id,
      type: 'auto_hide',
      title: 'Content auto-hidden',
      message: `A ${targetType} (${targetId}) was auto-hidden due to ${AUTO_HIDE_REPORT_THRESHOLD} or more pending reports.`,
      metadata: { targetType, targetId },
    })
  );

  await Promise.all(notifications);
}

async function autoModerateIfNeeded(targetType: ReportTargetType, targetId: string): Promise<void> {
  const [pendingRow] = await db
    .select({ count: count() })
    .from(reports)
    .where(
      and(
        eq(reports.targetType, targetType),
        eq(reports.targetId, targetId),
        eq(reports.status, 'pending')
      )
    );

  const pendingCount = pendingRow?.count ?? 0;

  if (pendingCount < AUTO_HIDE_REPORT_THRESHOLD) return;

  if (targetType === 'post') {
    await db
      .update(communityPosts)
      .set({ status: 'rejected' })
      .where(eq(communityPosts.id, targetId));
  } else if (targetType === 'comment') {
    await db.update(comments).set({ status: 'hidden' }).where(eq(comments.id, targetId));
  }

  await notifyAdminsOfAutoHide(targetType, targetId);
}

export async function POST(request: NextRequest) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const userId = session.user.id;

  const trustCheck = await checkTrustLevel(userId, 'canReport');
  if (!trustCheck.allowed) return trustCheck.response!;

  const rateCheck = await checkRateLimit(userId, trustCheck.trustLevel, 'reports');
  if (!rateCheck.allowed) return rateCheck.response!;

  try {
    const body = await request.json();
    const parsed = createReportSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid report data');
    }

    const { targetType, targetId, reason, details } = parsed.data;

    // Verify the target actually exists before creating a report
    if (targetType === 'post') {
      const [post] = await db
        .select({ id: communityPosts.id })
        .from(communityPosts)
        .where(eq(communityPosts.id, targetId))
        .limit(1);
      if (!post) {
        return errorResponse('The reported content does not exist.', 'NOT_FOUND' as never, 404);
      }
    } else if (targetType === 'comment') {
      const [comment] = await db
        .select({ id: comments.id })
        .from(comments)
        .where(eq(comments.id, targetId))
        .limit(1);
      if (!comment) {
        return errorResponse('The reported content does not exist.', 'NOT_FOUND' as never, 404);
      }
    }

    const [existingReport] = await db
      .select({ id: reports.id })
      .from(reports)
      .where(
        and(
          eq(reports.reporterId, userId),
          eq(reports.targetType, targetType),
          eq(reports.targetId, targetId)
        )
      )
      .limit(1);

    if (existingReport) {
      return errorResponse(
        'You have already reported this content.',
        'DUPLICATE_REPORT' as never,
        409
      );
    }

    await db.insert(reports).values({
      reporterId: userId,
      targetType,
      targetId,
      reason,
      details: details ?? null,
    });

    await autoModerateIfNeeded(targetType, targetId);

    return Response.json({ success: true, data: { reported: true } }, { status: 201 });
  } catch {
    return errorResponse('Failed to create report', 'INTERNAL_ERROR', 500);
  }
}
