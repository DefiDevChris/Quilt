import { getSession } from '@/lib/cognito-session';
import { db } from '@/lib/db';
import { orders, orderStatusHistory } from '@/db/schema/orders';
import { eq } from 'drizzle-orm';

/**
 * PATCH /api/admin/orders/[id] - Admin order status override
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, reason } = body;

    if (!status) {
      return Response.json({ error: 'Status is required' }, { status: 400 });
    }

    const validStatuses = ['pending', 'confirmed', 'fulfilled', 'cancelled', 'refunded'];
    if (!validStatuses.includes(status)) {
      return Response.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Get current order status
    const [existingOrder] = await db
      .select({ status: orders.status })
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);

    if (!existingOrder) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    // Update order status
    await db
      .update(orders)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id));

    // Log status change
    await db.insert(orderStatusHistory).values({
      orderId: id,
      fromStatus: existingOrder.status,
      toStatus: status,
      reason: reason || 'Admin manual override',
    });

    return Response.json({
      success: true,
      data: { id, status },
    });
  } catch (error) {
    console.error('Failed to update order:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
