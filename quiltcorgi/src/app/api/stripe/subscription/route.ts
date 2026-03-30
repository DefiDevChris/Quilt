import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { subscriptions } from '@/db/schema';
import { getRequiredSession, unauthorizedResponse } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getRequiredSession();
    if (!session) return unauthorizedResponse();

    const [sub] = await db
      .select({
        plan: subscriptions.plan,
        status: subscriptions.status,
        currentPeriodEnd: subscriptions.currentPeriodEnd,
        cancelAtPeriodEnd: subscriptions.cancelAtPeriodEnd,
      })
      .from(subscriptions)
      .where(eq(subscriptions.userId, session.user.id))
      .limit(1);

    if (!sub) {
      return Response.json({
        success: true,
        data: {
          plan: 'free',
          status: 'active',
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
        },
      });
    }

    return Response.json({ success: true, data: sub });
  } catch {
    return Response.json(
      { success: false, error: 'Failed to fetch subscription', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
