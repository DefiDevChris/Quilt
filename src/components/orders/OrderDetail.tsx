'use client';

import OrderStatusBadge from './OrderStatusBadge';
import OrderTimeline from './OrderTimeline';
import ReorderButton from './ReorderButton';
import { formatCents, formatOrderDate, formatAddress } from '@/lib/order-utils';
import { useOrder } from '@/hooks/useOrders';
import Link from 'next/link';

interface OrderDetailProps {
  orderId: string;
}

export default function OrderDetail({ orderId }: OrderDetailProps) {
  const { order, loading, error } = useOrder(orderId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-[#4a4a4a] font-['Montserrat'] animate-pulse">Loading order details...</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="bg-[#fee2e2] rounded-lg p-4 text-[#ef4444] font-['Montserrat']">
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
    shopifyVariantId?: string;
  }>;

  const shippingAddress = order.shippingAddress as {
    name?: string;
    address1?: string;
    address2?: string;
    city?: string;
    province?: string;
    country?: string;
    zip?: string;
    phone?: string;
  } | null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#ffffff] rounded-lg shadow-[0_1px_2px_rgba(26,26,26,0.08)] p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <Link
              href="/dashboard/orders"
              className="text-sm text-[#7CB9E8] font-['Montserrat'] hover:text-[#5AA0D5] transition-colors duration-150 ease-out mb-2 inline-block"
            >
              Back to Orders
            </Link>
            <h1 className="text-2xl font-['Noto_Serif'] font-semibold text-[#1a1a1a]">
              Order #{order.shopifyOrderId.slice(-6)}
            </h1>
            <p className="text-sm text-[#4a4a4a] font-['Montserrat'] mt-1">
              Placed on {formatOrderDate(order.createdAt)}
            </p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#d4d4d4]">
          <div>
            <p className="text-sm text-[#4a4a4a] font-['Montserrat']">Total</p>
            <p className="text-3xl font-['Noto_Serif'] font-semibold text-[#1a1a1a]">
              {formatCents(order.totalCents, order.currency)}
            </p>
          </div>
          <ReorderButton lineItems={lineItems} />
        </div>
      </div>

      {/* Line Items */}
      <div className="bg-[#ffffff] rounded-lg shadow-[0_1px_2px_rgba(26,26,26,0.08)] p-6">
        <h2 className="text-lg font-['Noto_Serif'] font-semibold text-[#1a1a1a] mb-4">
          Fabrics Ordered
        </h2>
        <div className="space-y-4">
          {lineItems.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-4 pb-4 border-b border-[#d4d4d4] last:border-0"
            >
              {/* Fabric image */}
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-[#F7F9FC] flex-shrink-0">
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

              {/* Item details */}
              <div className="flex-1">
                <p className="font-['Montserrat'] font-medium text-[#1a1a1a]">{item.fabricName}</p>
                <p className="text-sm text-[#4a4a4a] font-['Montserrat']">
                  {item.quantityInYards} yards @ {formatCents(item.pricePerYard, order.currency)}
                  /yard
                </p>
              </div>

              {/* Item total */}
              <p className="font-['Noto_Serif'] font-semibold text-[#1a1a1a]">
                {formatCents(item.quantityInYards * item.pricePerYard, order.currency)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Order Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Shipping Address */}
        {shippingAddress && (
          <div className="bg-[#ffffff] rounded-lg shadow-[0_1px_2px_rgba(26,26,26,0.08)] p-6">
            <h2 className="text-lg font-['Noto_Serif'] font-semibold text-[#1a1a1a] mb-4">
              Shipping Address
            </h2>
            <pre className="text-sm text-[#4a4a4a] font-['Montserrat'] whitespace-pre-wrap">
              {formatAddress(shippingAddress)}
            </pre>
          </div>
        )}

        {/* Order Timeline */}
        <div className="bg-[#ffffff] rounded-lg shadow-[0_1px_2px_rgba(26,26,26,0.08)] p-6">
          <h2 className="text-lg font-['Noto_Serif'] font-semibold text-[#1a1a1a] mb-4">
            Order Timeline
          </h2>
          <OrderTimeline statusHistory={order.statusHistory || []} />
        </div>
      </div>

      {/* Order Summary */}
      <div className="bg-[#ffffff] rounded-lg shadow-[0_1px_2px_rgba(26,26,26,0.08)] p-6">
        <h2 className="text-lg font-['Noto_Serif'] font-semibold text-[#1a1a1a] mb-4">
          Order Summary
        </h2>
        <div className="space-y-2 text-sm font-['Montserrat']">
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
