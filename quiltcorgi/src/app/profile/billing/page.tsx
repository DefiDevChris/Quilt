import { Suspense } from 'react';
import { BillingClient } from '@/components/billing/BillingClient';

export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-2xl mx-auto py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-surface-container-high rounded w-1/3" />
            <div className="h-4 bg-surface-container-high rounded w-1/2" />
          </div>
        </div>
      }
    >
      <BillingClient />
    </Suspense>
  );
}
