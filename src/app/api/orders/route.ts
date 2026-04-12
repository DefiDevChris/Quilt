import { NextRequest } from 'next/server';
import { getSession } from '@/lib/cognito-session';
import { db } from '@/lib/db';
import { orders } from '@/db/schema/orders';
import { eq, desc, and, gte, lte, count } from 'drizzle-orm';

/**
 * GET /api/orders - Returns paginated orders for current user
 * Query params:
 *  - page: number (default 1)
 *  - limit: number (default 20)
 *  - status: string (optional filter)
 *  - startDate: ISO date string (optional)
 *  - endDate: ISO date string (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [eq(orders.userId, session.user.id)];

    if (status && status !== 'all') {
      conditions.push(eq(orders.status, status));
    }

    if (startDate) {
      conditions.push(gte(orders.createdAt, new Date(startDate)));
    }

    if (endDate) {
      conditions.push(lte(orders.createdAt, new Date(endDate)));
    }

    // Get total count
    const [{ total }] = await db
      .select({ total: count() })
      .from(orders)
      .where(and(...conditions));

    // Get orders
    const userOrders = await db
      .select()
      .from(orders)
      .where(and(...conditions))
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);

    return Response.json({
      success: true,
      data: {
        orders: userOrders,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
