'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import OrderStatusBadge from '@/components/orders/OrderStatusBadge';
import OrderTimeline from '@/components/orders/OrderTimeline';
import { formatCents, formatOrderDate, formatAddress } from '@/lib/order-utils';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'fulfilled', label: 'Fulfilled' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refunded', label: 'Refunded' },
];

interface AdminOrderDetail {
  id: string;
  userId: string | null;
  shopifyOrderId: string;
  status: string;
  totalCents: number;
  currency: string;
  subtotalCents: number | null;
  taxCents: number | null;
  shippingCents: number | null;
  lineItems: any;
  shippingAddress: any;
  createdAt: string;
  statusHistory: Array<{
    id: string;
    fromStatus: string | null;
    toStatus: string;
    reason: string | null;
    createdAt: string;
  }>;
}

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<AdminOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/orders/${orderId}`);
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch order');
        }

        setOrder(result.data);
        setNewStatus(result.data.status);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const handleStatusUpdate = async () => {
    if (!order || !newStatus) return;

    setUpdating(true);

    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          reason: reason || 'Admin manual override',
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update order');
      }

      // Refresh order data
      const refreshResponse = await fetch(`/api/orders/${orderId}`);
      const refreshResult = await refreshResponse.json();

      if (refreshResult.success) {
        setOrder(refreshResult.data);
      }

      setReason('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update order');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-[#4a4a4a] font-['Inter'] animate-pulse">Loading order details...</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="bg-[#fee2e2] rounded-lg p-4 text-[#ef4444] font-['Inter']">
        Failed to load order details: {error || 'Order not found'}
      </div>
    );
  }

  const lineItems = order.lineItems as Array<{
    fabricId: string;
    fabricName: string;
    quantityInYards: number;
    pricePerYard: number;
    imageUrl: string | null;
  }>;

  const shippingAddress = order.shippingAddress as {
    name?: string;
    address1?: string;
    address2?: string;
    city?: string;
    province?: string;
    country?: string;
    zip?: string;
  } | null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={() => router.back()}
            className="text-sm text-[#ff8d49] font-['Inter'] hover:text-[#e67d3f] transition-colors duration-150 ease-out mb-2"
          >
            Back to Orders
          </button>
          <h1 className="text-2xl font-['Spline_Sans'] font-semibold text-[#1a1a1a]">
            Order #{order.shopifyOrderId.slice(-6)}
          </h1>
          <p className="text-sm text-[#4a4a4a] font-['Inter'] mt-1">
            Placed on {formatOrderDate(order.createdAt)}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {/* Status Override */}
      <div className="bg-[#ffffff] rounded-lg shadow-[0_1px_2px_rgba(26,26,26,0.08)] p-6">
        <h2 className="text-lg font-['Spline_Sans'] font-semibold text-[#1a1a1a] mb-4">
          Update Status
        </h2>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm text-[#4a4a4a] font-['Inter'] mb-2">Status</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-[#d4d4d4] font-['Inter'] text-[#1a1a1a] bg-[#ffffff]"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-[2]">
            <label className="block text-sm text-[#4a4a4a] font-['Inter'] mb-2">Reason (optional)</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why is the status changing?"
              className="w-full px-4 py-2 rounded-lg border border-[#d4d4d4] font-['Inter'] text-[#1a1a1a]"
            />
          </div>
          <button
            onClick={handleStatusUpdate}
            disabled={updating || newStatus === order.status}
            className="bg-[#ff8d49] text-[#1a1a1a] px-6 py-2 rounded-full font-['Inter'] transition-colors duration-150 ease-out hover:bg-[#e67d3f] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updating ? 'Updating...' : 'Update Status'}
          </button>
        </div>
      </div>

      {/* Line Items */}
      <div className="bg-[#ffffff] rounded-lg shadow-[0_1px_2px_rgba(26,26,26,0.08)] p-6">
        <h2 className="text-lg font-['Spline_Sans'] font-semibold text-[#1a1a1a] mb-4">
          Fabrics Ordered
        </h2>
        <div className="space-y-4">
          {lineItems.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-4 pb-4 border-b border-[#d4d4d4] last:border-0"
            >
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-[#faf9f7] flex-shrink-0">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.fabricName}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-[#d4d4d4]" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-['Inter'] font-medium text-[#1a1a1a]">{item.fabricName}</p>
                <p className="text-sm text-[#4a4a4a] font-['Inter']">
                  {item.quantityInYards} yards @ {formatCents(item.pricePerYard, order.currency)}
                  /yard
                </p>
              </div>
              <p className="font-['Spline_Sans'] font-semibold text-[#1a1a1a]">
                {formatCents(item.quantityInYards * item.pricePerYard, order.currency)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Order Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {shippingAddress && (
          <div className="bg-[#ffffff] rounded-lg shadow-[0_1px_2px_rgba(26,26,26,0.08)] p-6">
            <h2 className="text-lg font-['Spline_Sans'] font-semibold text-[#1a1a1a] mb-4">
              Shipping Address
            </h2>
            <pre className="text-sm text-[#4a4a4a] font-['Inter'] whitespace-pre-wrap">
              {formatAddress(shippingAddress)}
            </pre>
          </div>
        )}

        <div className="bg-[#ffffff] rounded-lg shadow-[0_1px_2px_rgba(26,26,26,0.08)] p-6">
          <h2 className="text-lg font-['Spline_Sans'] font-semibold text-[#1a1a1a] mb-4">
            Order Timeline
          </h2>
          <OrderTimeline statusHistory={order.statusHistory || []} />
        </div>
      </div>

      {/* Order Summary */}
      <div className="bg-[#ffffff] rounded-lg shadow-[0_1px_2px_rgba(26,26,26,0.08)] p-6">
        <h2 className="text-lg font-['Spline_Sans'] font-semibold text-[#1a1a1a] mb-4">
          Order Summary
        </h2>
        <div className="space-y-2 text-sm font-['Inter']">
          <div className="flex justify-between">
            <span className="text-[#4a4a4a]">Subtotal</span>
            <span className="text-[#1a1a1a]">
              {formatCents(order.subtotalCents || order.totalCents, order.currency)}
            </span>
          </div>
          {order.taxCents && order.taxCents > 0 && (
            <div className="flex justify-between">
              <span className="text-[#4a4a4a]">Tax</span>
              <span className="text-[#1a1a1a]">{formatCents(order.taxCents, order.currency)}</span>
            </div>
          )}
          {order.shippingCents && order.shippingCents > 0 && (
            <div className="flex justify-between">
              <span className="text-[#4a4a4a]">Shipping</span>
              <span className="text-[#1a1a1a]">
                {formatCents(order.shippingCents, order.currency)}
              </span>
            </div>
          )}
          <div className="flex justify-between pt-2 border-t border-[#d4d4d4] font-semibold">
            <span className="text-[#1a1a1a]">Total</span>
            <span className="text-[#1a1a1a]">{formatCents(order.totalCents, order.currency)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
