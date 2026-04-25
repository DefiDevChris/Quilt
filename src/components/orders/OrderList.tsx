'use client';

import OrderCard from './OrderCard';
import { useOrders } from '@/hooks/useOrders';

interface OrderListProps {
  statusFilter?: string;
}

export default function OrderList({ statusFilter }: OrderListProps) {
  const { orders, loading, error, pagination } = useOrders({
    status: statusFilter,
    page: 1,
    limit: 20,
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-[var(--color-text-dim)] font-['Inter'] animate-pulse">Loading orders...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[var(--color-accent-blush)] rounded-lg p-4 text-[var(--color-error)] font-['Inter']">
        Failed to load orders: {error}
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="bg-[var(--color-surface)] rounded-lg shadow-[0_1px_2px_rgba(54,49,45,0.08)] p-12 text-center">
        <p className="text-lg font-['Montserrat'] font-semibold text-[var(--color-text)] mb-2">
          No orders yet
        </p>
        <p className="text-[var(--color-text-dim)] font-['Inter']">
          Your order history will appear here after your first purchase.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <p className="text-sm text-[var(--color-text-dim)] font-['Inter']">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} orders)
          </p>
        </div>
      )}
    </div>
  );
}
