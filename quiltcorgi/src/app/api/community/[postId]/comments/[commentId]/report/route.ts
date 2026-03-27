import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { comments, reports } from '@/db/schema';
import { createReportSchema } from '@/lib/validation';
import {
  getRequiredSession,
  unauthorizedResponse,
  notFoundResponse,
  validationErrorResponse,
  errorResponse,
} from '@/lib/auth-helpers';
import { checkTrustLevel, checkRateLimit } from '@/middleware/trust-guard';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string; commentId: string }> }
) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const { postId, commentId } = await params;

  const trustCheck = await checkTrustLevel(session.user.id, 'canReport');
  if (!trustCheck.allowed) return trustCheck.response!;

  const rateCheck = await checkRateLimit(session.user.id, trustCheck.trustLevel, 'reports');
  if (!rateCheck.allowed) return rateCheck.response!;

  try {
    const [comment] = await db
      .select({ id: comments.id, postId: comments.postId })
      .from(comments)
      .where(eq(comments.id, commentId))
      .limit(1);

    if (!comment || comment.postId !== postId) {
      return notFoundResponse('Comment not found.');
    }

    const body = await request.json();
    const parsed = createReportSchema.safeParse({
      ...body,
      targetType: 'comment',
      targetId: commentId,
    });

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid report data');
    }

    const { reason, details } = parsed.data;

    await db.insert(reports).values({
      reporterId: session.user.id,
      targetType: 'comment',
      targetId: commentId,
      reason,
      details: details ?? null,
    });

    return Response.json(
      {
        success: true,
        data: { reported: true },
      },
      { status: 201 }
    );
  } catch {
    return errorResponse('Failed to report comment', 'INTERNAL_ERROR', 500);
  }
}
