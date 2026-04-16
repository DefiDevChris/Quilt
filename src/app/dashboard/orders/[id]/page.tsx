'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import OrderDetail from '@/components/orders/OrderDetail';
import { BrandedPage } from '@/components/layout/BrandedPage';
import { PageHeader } from '@/components/ui/PageHeader';

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;

  return (
    <BrandedPage>
      <PageHeader
        label="Orders"
        title="Order Details"
        description="View your order breakdown and status"
        action={
          <Link
            href="/dashboard/orders"
            className="text-[#f08060] hover:text-[#d97054] transition-colors duration-150 ease-out font-['Inter'] text-sm"
          >
            Back to Orders
          </Link>
        }
      />
      <OrderDetail orderId={orderId} />
    </BrandedPage>
  );
}
