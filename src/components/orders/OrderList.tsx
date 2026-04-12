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
        <div className="text-[#4a4a4a] font-['Inter'] animate-pulse">Loading orders...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#fee2e2] rounded-lg p-4 text-[#ef4444] font-['Inter']">
        Failed to load orders: {error}
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="bg-[#ffffff] rounded-lg shadow-[0_1px_2px_rgba(26,26,26,0.08)] p-12 text-center">
        <p className="text-lg font-['Spline_Sans'] font-semibold text-[#1a1a1a] mb-2">
          No orders yet
        </p>
        <p className="text-[#4a4a4a] font-['Inter']">
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
          <p className="text-sm text-[#4a4a4a] font-['Inter']">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} orders)
          </p>
        </div>
      )}
    </div>
  );
}
