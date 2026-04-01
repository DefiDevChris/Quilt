import { NextRequest } from 'next/server';
import { eq, and, desc, count } from 'drizzle-orm';
import { db } from '@/lib/db';
import { notifications } from '@/db/schema/notifications';
import { notificationQuerySchema } from '@/lib/validation';
import {
  getRequiredSession,
  unauthorizedResponse,
  validationErrorResponse,
  errorResponse,
} from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const url = request.nextUrl;
  const parsed = notificationQuerySchema.safeParse({
    unreadOnly: url.searchParams.get('unreadOnly') ?? undefined,
    limit: url.searchParams.get('limit') ?? undefined,
  });

  if (!parsed.success) {
    return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid parameters');
  }

  const { unreadOnly, limit } = parsed.data;

  try {
    const conditions = [eq(notifications.userId, session.user.id)];

    if (unreadOnly) {
      conditions.push(eq(notifications.isRead, false));
    }

    const whereClause = and(...conditions);

    const [notificationRows, [unreadRow]] = await Promise.all([
      db
        .select({
          id: notifications.id,
          type: notifications.type,
          title: notifications.title,
          message: notifications.message,
          isRead: notifications.isRead,
          metadata: notifications.metadata,
          createdAt: notifications.createdAt,
        })
        .from(notifications)
        .where(whereClause)
        .orderBy(desc(notifications.createdAt))
        .limit(limit),
      db
        .select({ count: count() })
        .from(notifications)
        .where(and(eq(notifications.userId, session.user.id), eq(notifications.isRead, false))),
    ]);

    return Response.json({
      success: true,
      data: {
        notifications: notificationRows,
        unreadCount: unreadRow?.count ?? 0,
      },
    });
  } catch {
    return errorResponse('Failed to fetch notifications', 'INTERNAL_ERROR', 500);
  }
}
