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
        <div className="text-[var(--color-text-dim)] font-['Montserrat'] animate-pulse">Loading orders...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[var(--color-accent-blush)] rounded-lg p-4 text-[var(--color-error)] font-['Montserrat']">
        Failed to load orders: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-['Noto_Sans'] font-semibold text-[var(--color-text)]">
          Order Management
        </h1>
        <p className="text-sm text-[var(--color-text-dim)] font-['Montserrat'] mt-1">
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
            className={`px-4 py-2 rounded-full font-['Montserrat'] text-sm whitespace-nowrap transition-colors duration-150 ease-out ${
              statusFilter === option.value
                ? 'bg-[var(--color-primary)] text-[var(--color-text)]'
                : 'bg-[var(--color-surface)] text-[var(--color-text-dim)] border border-[var(--color-border)] hover:bg-[var(--color-bg)]'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="bg-[var(--color-surface)] rounded-lg shadow-[0_1px_2px_rgba(54,49,45,0.08)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-bg)] border-b border-[var(--color-border)]">
              <tr>
                <th className="text-left py-3 px-4 font-['Montserrat'] font-medium text-[var(--color-text-dim)]">
                  Order ID
                </th>
                <th className="text-left py-3 px-4 font-['Montserrat'] font-medium text-[var(--color-text-dim)]">
                  Customer
                </th>
                <th className="text-left py-3 px-4 font-['Montserrat'] font-medium text-[var(--color-text-dim)]">
                  Date
                </th>
                <th className="text-left py-3 px-4 font-['Montserrat'] font-medium text-[var(--color-text-dim)]">
                  Status
                </th>
                <th className="text-left py-3 px-4 font-['Montserrat'] font-medium text-[var(--color-text-dim)]">
                  Total
                </th>
                <th className="text-left py-3 px-4 font-['Montserrat'] font-medium text-[var(--color-text-dim)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-bg)]/50 transition-colors duration-150 ease-out"
                >
                  <td className="py-3 px-4 font-['Montserrat'] text-[var(--color-text)]">
                    #{order.shopifyOrderId.slice(-6)}
                  </td>
                  <td className="py-3 px-4 font-['Montserrat'] text-[var(--color-text-dim)]">
                    {order.userName || order.userEmail || 'Guest'}
                  </td>
                  <td className="py-3 px-4 font-['Montserrat'] text-[var(--color-text-dim)]">
                    {formatOrderDate(order.createdAt)}
                  </td>
                  <td className="py-3 px-4">
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td className="py-3 px-4 font-['Noto_Sans'] font-semibold text-[var(--color-text)]">
                    {formatCents(order.totalCents, order.currency)}
                  </td>
                  <td className="py-3 px-4">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] transition-colors duration-150 ease-out font-['Montserrat']"
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
          <div className="py-12 text-center text-[var(--color-text-dim)] font-['Montserrat']">No orders found</div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-dim)] font-['Montserrat'] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--color-bg)] transition-colors duration-150 ease-out"
          >
            Previous
          </button>
          <span className="text-sm text-[var(--color-text-dim)] font-['Montserrat']">
            Page {page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page === pagination.totalPages}
            className="px-4 py-2 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-dim)] font-['Montserrat'] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--color-bg)] transition-colors duration-150 ease-out"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
