'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import OrderStatusBadge from '@/components/orders/OrderStatusBadge';
import { formatCents, formatOrderDate } from '@/lib/order-utils';

interface AdminOrder {
  id: string;
  userId: string | null;
  shopifyOrderId: string;
  status: string;
  totalCents: number;
  currency: string;
  lineItems: unknown[];
  createdAt: string;
  userEmail: string | null;
  userName: string | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'fulfilled', label: 'Fulfilled' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refunded', label: 'Refunded' },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: '50',
        });

        if (statusFilter !== 'all') {
          params.set('status', statusFilter);
        }

        const response = await fetch(`/api/admin/orders?${params}`);
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch orders');
        }

        setOrders(result.data.orders);
        setPagination(result.data.pagination);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [page, statusFilter]);

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-['Spline_Sans'] font-semibold text-[#1a1a1a]">
          Order Management
        </h1>
        <p className="text-sm text-[#4a4a4a] font-['Inter'] mt-1">
          View and manage all customer orders
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {STATUS_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => {
              setStatusFilter(option.value);
              setPage(1);
            }}
            className={`px-4 py-2 rounded-full font-['Inter'] text-sm whitespace-nowrap transition-colors duration-150 ease-out ${
              statusFilter === option.value
                ? 'bg-[#f08060] text-[#1a1a1a]'
                : 'bg-[#ffffff] text-[#4a4a4a] border border-[#d4d4d4] hover:bg-[#faf9f7]'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="bg-[#ffffff] rounded-lg shadow-[0_1px_2px_rgba(26,26,26,0.08)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#faf9f7] border-b border-[#d4d4d4]">
              <tr>
                <th className="text-left py-3 px-4 font-['Inter'] font-medium text-[#4a4a4a]">
                  Order ID
                </th>
                <th className="text-left py-3 px-4 font-['Inter'] font-medium text-[#4a4a4a]">
                  Customer
                </th>
                <th className="text-left py-3 px-4 font-['Inter'] font-medium text-[#4a4a4a]">
                  Date
                </th>
                <th className="text-left py-3 px-4 font-['Inter'] font-medium text-[#4a4a4a]">
                  Status
                </th>
                <th className="text-left py-3 px-4 font-['Inter'] font-medium text-[#4a4a4a]">
                  Total
                </th>
                <th className="text-left py-3 px-4 font-['Inter'] font-medium text-[#4a4a4a]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-[#d4d4d4] last:border-0 hover:bg-[#faf9f7]/50 transition-colors duration-150 ease-out"
                >
                  <td className="py-3 px-4 font-['Inter'] text-[#1a1a1a]">
                    #{order.shopifyOrderId.slice(-6)}
                  </td>
                  <td className="py-3 px-4 font-['Inter'] text-[#4a4a4a]">
                    {order.userName || order.userEmail || 'Guest'}
                  </td>
                  <td className="py-3 px-4 font-['Inter'] text-[#4a4a4a]">
                    {formatOrderDate(order.createdAt)}
                  </td>
                  <td className="py-3 px-4">
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td className="py-3 px-4 font-['Spline_Sans'] font-semibold text-[#1a1a1a]">
                    {formatCents(order.totalCents, order.currency)}
                  </td>
                  <td className="py-3 px-4">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="text-[#f08060] hover:text-[#d97054] transition-colors duration-150 ease-out font-['Inter']"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {orders.length === 0 && (
          <div className="py-12 text-center text-[#4a4a4a] font-['Inter']">No orders found</div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-full bg-[#ffffff] border border-[#d4d4d4] text-[#4a4a4a] font-['Inter'] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#faf9f7] transition-colors duration-150 ease-out"
          >
            Previous
          </button>
          <span className="text-sm text-[#4a4a4a] font-['Inter']">
            Page {page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page === pagination.totalPages}
            className="px-4 py-2 rounded-full bg-[#ffffff] border border-[#d4d4d4] text-[#4a4a4a] font-['Inter'] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#faf9f7] transition-colors duration-150 ease-out"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
