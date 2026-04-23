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
    <div className="bg-[var(--color-surface)] rounded-lg shadow-[0_1px_2px_rgba(54,49,45,0.08)] p-6 transition-colors duration-150 ease-out hover:bg-[var(--color-bg)]/50">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-[var(--color-text-dim)] font-['Montserrat']">
            {formatOrderDate(order.createdAt)}
          </p>
          <p className="text-lg font-['Noto_Sans'] font-semibold text-[var(--color-text)] mt-1">
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
              className="w-12 h-12 rounded-lg overflow-hidden bg-[var(--color-bg)] flex-shrink-0"
            >
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.fabricName}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full bg-[var(--color-border)]" />
              )}
            </div>
          ))}
          {lineItems.length > 4 && (
            <div className="w-12 h-12 rounded-lg bg-[var(--color-bg)] flex items-center justify-center text-sm text-[var(--color-text-dim)] font-['Montserrat']">
              +{lineItems.length - 4}
            </div>
          )}
        </div>
      )}

      {/* Order summary */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[var(--color-text-dim)] font-['Montserrat']">
            {lineItems?.length || 0} fabric{lineItems?.length !== 1 ? 's' : ''}
          </p>
          {firstItem && (
            <p className="text-sm text-[var(--color-text-dim)] font-['Montserrat'] truncate max-w-[200px]">
              {firstItem.fabricName}
              {lineItems.length > 1 ? ` +${lineItems.length - 1} more` : ''}
            </p>
          )}
        </div>

        <div className="text-right">
          <p className="text-xl font-['Noto_Sans'] font-semibold text-[var(--color-text)]">
            {formatCents(order.totalCents, order.currency)}
          </p>
          <Link
            href={`/dashboard/orders/${order.id}`}
            className="text-sm text-[var(--color-primary)] font-['Montserrat'] hover:text-[var(--color-primary-hover)] transition-colors duration-150 ease-out"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}
