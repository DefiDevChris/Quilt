'use client';

import Link from 'next/link';
import OrderStatusBadge from './OrderStatusBadge';
import { formatCents, formatOrderDate } from '@/lib/order-utils';
import type { Order } from '@/hooks/useOrders';

interface OrderCardProps {
  order: Order;
}

export default function OrderCard({ order }: OrderCardProps) {
  const lineItems = order.lineItems as Array<{
    fabricId: string;
    fabricName: string;
    quantityInYards: number;
    pricePerYard: number;
    imageUrl: string | null;
  }>;

  const firstItem = lineItems?.[0];

  return (
    <div className="bg-[#ffffff] rounded-lg shadow-[0_1px_2px_rgba(26,26,26,0.08)] p-6 transition-colors duration-150 ease-out hover:bg-[#faf9f7]/50">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-[#4a4a4a] font-['Inter']">
            {formatOrderDate(order.createdAt)}
          </p>
          <p className="text-lg font-['Spline_Sans'] font-semibold text-[#1a1a1a] mt-1">
            Order #{order.shopifyOrderId.slice(-6)}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {/* Fabric thumbnails */}
      {lineItems && lineItems.length > 0 && (
        <div className="flex gap-2 mb-4">
          {lineItems.slice(0, 4).map((item, index) => (
            <div
              key={index}
              className="w-12 h-12 rounded-lg overflow-hidden bg-[#faf9f7] flex-shrink-0"
            >
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
          ))}
          {lineItems.length > 4 && (
            <div className="w-12 h-12 rounded-lg bg-[#faf9f7] flex items-center justify-center text-sm text-[#4a4a4a] font-['Inter']">
              +{lineItems.length - 4}
            </div>
          )}
        </div>
      )}

      {/* Order summary */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[#4a4a4a] font-['Inter']">
            {lineItems?.length || 0} fabric{lineItems?.length !== 1 ? 's' : ''}
          </p>
          {firstItem && (
            <p className="text-sm text-[#4a4a4a] font-['Inter'] truncate max-w-[200px]">
              {firstItem.fabricName}
              {lineItems.length > 1 ? ` +${lineItems.length - 1} more` : ''}
            </p>
          )}
        </div>

        <div className="text-right">
          <p className="text-xl font-['Spline_Sans'] font-semibold text-[#1a1a1a]">
            {formatCents(order.totalCents, order.currency)}
          </p>
          <Link
            href={`/dashboard/orders/${order.id}`}
            className="text-sm text-[#ff8d49] font-['Inter'] hover:text-[#e67d3f] transition-colors duration-150 ease-out"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}
