'use client';

import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/components/ui/ToastProvider';
import { PRO_PRICE_MONTHLY } from '@/lib/constants';

interface ProGateProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  featureName?: string;
}

function DefaultFallback({ featureName }: { featureName?: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  async function handleUpgrade() {
    setIsLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.data.checkoutUrl) {
        window.location.href = data.data.checkoutUrl;
      } else {
        toast({
          type: 'error',
          title: 'Checkout failed',
          description: data.error ?? 'Unable to start checkout. Please try again.',
        });
      }
    } catch {
      toast({
        type: 'error',
        title: 'Connection error',
        description: 'Unable to connect. Please check your connection and try again.',
      });
    } finally {
      setIsLoading(false);
    }
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
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-on hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Upgrade to Pro'}
          </button>
          <div className="mt-3">
            <a href="/profile/billing" className="text-sm text-primary hover:underline">
              Learn more
            </a>
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
