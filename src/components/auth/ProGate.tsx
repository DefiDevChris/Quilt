'use client';

import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { PRO_PRICE_MONTHLY } from '@/lib/constants';
import { startStripeCheckout } from '@/lib/stripe-checkout';

interface ProGateProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  featureName?: string;
}

function DefaultFallback({ featureName }: { featureName?: string }) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleUpgrade() {
    setIsLoading(true);
    await startStripeCheckout();
    setIsLoading(false);
  }

  return (
    <div className="relative rounded-xl p-6 text-center">
      <div className="absolute inset-0 flex items-center justify-center bg-surface/85 backdrop-blur-[8px] rounded-xl">
        <div className="bg-surface shadow-elevation-3 rounded-xl p-[2.75rem] text-center max-w-sm">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            className="text-secondary mx-auto mb-3"
            aria-hidden="true"
          >
            <rect
              x="5"
              y="11"
              width="14"
              height="10"
              rx="2"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M8 11V7a4 4 0 0 1 8 0v4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          {featureName && (
            <p className="text-headline-sm text-on-surface font-semibold mb-1">{featureName}</p>
          )}
          <p className="text-body-md text-secondary mb-4">
            Upgrade to Pro to unlock this feature. Starting at ${PRO_PRICE_MONTHLY}/month.
          </p>
          <button
            type="button"
            onClick={handleUpgrade}
            disabled={isLoading}
            className="btn-primary-xs disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Upgrade to Pro'}
          </button>
          <div className="mt-3">
            <span className="text-sm text-secondary">Cancel anytime. No commitment.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProGate({ children, fallback, featureName }: ProGateProps) {
  const isPro = useAuthStore((s) => s.isPro);

  if (isPro) {
    return <>{children}</>;
  }

  return <>{fallback ?? <DefaultFallback featureName={featureName} />}</>;
}
