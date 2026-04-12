import { NextRequest } from 'next/server';
import { getSession } from '@/lib/cognito-session';
import { db } from '@/lib/db';
import { orders } from '@/db/schema/orders';
import { users } from '@/db/schema/users';
import { eq, desc, and, count as drizzleCount, gte, lte } from 'drizzle-orm';

/**
 * GET /api/admin/orders - Returns paginated orders for admin (all users)
 * Query params:
 *  - page: number (default 1)
 *  - limit: number (default 50)
 *  - status: string (optional filter)
 *  - userId: string (optional filter by user)
 *  - startDate: ISO date string (optional)
 *  - endDate: ISO date string (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [];

    if (status && status !== 'all') {
      conditions.push(eq(orders.status, status));
    }

    if (userId) {
      conditions.push(eq(orders.userId, userId));
    }

    if (startDate) {
      conditions.push(gte(orders.createdAt, new Date(startDate)));
    }

    if (endDate) {
      conditions.push(lte(orders.createdAt, new Date(endDate)));
    }

    // Get total count
    const [{ total }] = await db
      .select({ total: drizzleCount() })
      .from(orders)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    // Get orders with user info
    const adminOrders = await db
      .select({
        id: orders.id,
        userId: orders.userId,
        shopifyOrderId: orders.shopifyOrderId,
        status: orders.status,
        totalCents: orders.totalCents,
        currency: orders.currency,
        lineItems: orders.lineItems,
        createdAt: orders.createdAt,
        userEmail: users.email,
        userName: users.name,
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);

    return Response.json({
      success: true,
      data: {
        orders: adminOrders,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Failed to fetch admin orders:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
