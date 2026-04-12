import { getSession } from '@/lib/cognito-session';
import { db } from '@/lib/db';
import { orders, orderStatusHistory } from '@/db/schema/orders';
import { eq } from 'drizzle-orm';

/**
 * GET /api/orders/[id] - Returns single order with full details
 * Requires auth, validates userId matches
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Fetch order
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);

    if (!order) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    // Validate ownership (admins can view any order)
    if (order.userId !== session.user.id && session.user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch status history
    const statusHistory = await db
      .select()
      .from(orderStatusHistory)
      .where(eq(orderStatusHistory.orderId, order.id))
      .orderBy(orderStatusHistory.createdAt);

    return Response.json({
      success: true,
      data: {
        ...order,
        statusHistory,
      },
    });
  } catch (error) {
    console.error('Failed to fetch order:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
