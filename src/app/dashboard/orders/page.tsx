'use client';

import { useState } from 'react';
import Link from 'next/link';
import OrderList from '@/components/orders/OrderList';
import { BrandedPage } from '@/components/layout/BrandedPage';
import { PageHeader } from '@/components/ui/PageHeader';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Orders' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'fulfilled', label: 'Fulfilled' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refunded', label: 'Refunded' },
];

export default function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState('all');

  return (
    <BrandedPage>
      <PageHeader
        label="Dashboard"
        title="Order History"
        description="View and manage your fabric purchases"
        action={
          <Link
            href="/dashboard"
            className="text-[#7CB9E8] hover:text-[#5AA0D5] transition-colors duration-150 ease-out font-['Montserrat'] text-sm"
          >
            Back to Dashboard
          </Link>
        }
      />

      {/* Status Filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {STATUS_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => setStatusFilter(option.value)}
            className={`px-4 py-2 rounded-full font-['Montserrat'] text-sm whitespace-nowrap transition-colors duration-150 ease-out ${
              statusFilter === option.value
                ? 'bg-[#7CB9E8] text-[#1a1a1a]'
                : 'bg-[#ffffff] text-[#4a4a4a] border border-[#d4d4d4] hover:bg-[#F7F9FC]'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Order List */}
      <OrderList statusFilter={statusFilter === 'all' ? undefined : statusFilter} />
    </BrandedPage>
  );
}
