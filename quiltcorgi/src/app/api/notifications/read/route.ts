import { NextRequest } from 'next/server';
import { eq, and, inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { notifications } from '@/db/schema/notifications';
import { markNotificationsReadSchema } from '@/lib/validation';
import {
  getRequiredSession,
  unauthorizedResponse,
  validationErrorResponse,
  errorResponse,
} from '@/lib/auth-helpers';
import { checkRateLimit, API_RATE_LIMITS, rateLimitResponse } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const rl = await checkRateLimit(`notifications-read:${session.user.id}`, API_RATE_LIMITS.profile);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs);

  try {
    const body = await request.json();
    const parsed = markNotificationsReadSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid request body');
    }

    const { notificationIds } = parsed.data;

    let result: { rowCount: number };

    if (notificationIds === 'all') {
      const updateResult = await db
        .update(notifications)
        .set({ isRead: true })
        .where(and(eq(notifications.userId, session.user.id), eq(notifications.isRead, false)));
      result = { rowCount: updateResult.rowCount ?? 0 };
    } else {
      if (notificationIds.length === 0) {
        return Response.json({ success: true, data: { marked: 0 } });
      }

      const updateResult = await db
        .update(notifications)
        .set({ isRead: true })
        .where(
          and(eq(notifications.userId, session.user.id), inArray(notifications.id, notificationIds))
        );
      result = { rowCount: updateResult.rowCount ?? 0 };
    }

    return Response.json({
      success: true,
      data: { marked: result.rowCount },
    });
  } catch {
    return errorResponse('Failed to mark notifications as read', 'INTERNAL_ERROR', 500);
  }
}
