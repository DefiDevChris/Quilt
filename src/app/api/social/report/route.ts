import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { reports } from '@/db/schema';
import {
  getRequiredSession,
  unauthorizedResponse,
  validationErrorResponse,
  errorResponse,
} from '@/lib/auth-helpers';
import { and, eq, gt } from 'drizzle-orm';
import { z } from 'zod/v4';

export const dynamic = 'force-dynamic';

const reportSchema = z
  .object({
    postId: z.string().uuid().optional(),
    commentId: z.string().uuid().optional(),
    reason: z.string().min(1).max(500),
  })
  .refine((data) => data.postId || data.commentId, {
    message: 'Must provide postId or commentId',
  });

export async function POST(request: NextRequest) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  try {
    const body = await request.json();
    const parsed = reportSchema.safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Invalid report data';
      return validationErrorResponse(message);
    }

    const { postId, commentId, reason } = parsed.data;
    const reporterId = session.user.id;
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Rate-limit: one report per target per user per 24 h
    const conditions = [eq(reports.reporterId, reporterId), gt(reports.createdAt, since)];

    if (postId) {
      conditions.push(eq(reports.postId, postId));
    } else if (commentId) {
      conditions.push(eq(reports.commentId, commentId));
    }

    const [existing] = await db
      .select({ id: reports.id })
      .from(reports)
      .where(and(...conditions))
      .limit(1);

    if (existing) {
      return Response.json(
        { success: false, error: 'Already reported', code: 'RATE_LIMITED' },
        { status: 429 }
      );
    }

    await db.insert(reports).values({
      reporterId,
      postId: postId ?? null,
      commentId: commentId ?? null,
      reason,
    });

    return Response.json({ success: true }, { status: 201 });
  } catch {
    return errorResponse('Failed to submit report', 'INTERNAL_ERROR', 500);
  }
}
