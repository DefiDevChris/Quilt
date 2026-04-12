'use client';

import { formatOrderStatus } from '@/lib/order-utils';

interface OrderStatusBadgeProps {
  status: string;
}

export default function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const { label, color, bgLight } = formatOrderStatus(status);

  return (
    <span
      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
      style={{ backgroundColor: bgLight, color }}
    >
      {label}
    </span>
  );
}
