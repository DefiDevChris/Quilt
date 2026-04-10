'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { PRO_PRICE_MONTHLY, PRO_PRICE_YEARLY, PRO_YEARLY_SAVINGS_PERCENT } from '@/lib/constants';
import { startStripeCheckout } from '@/lib/stripe-checkout';
import { useToast } from '@/components/ui/ToastProvider';

type SubscriptionInfo = {
  plan: 'free' | 'pro';
  status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing';
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
};

export function BillingSection() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const searchParams = useSearchParams();
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('yearly');
  const { toast } = useToast();

  const fetchSubscription = useCallback(async () => {
    try {
      const res = await fetch('/api/stripe/subscription');
      if (res.ok) {
        const data = await res.json();
        setSubscription(data.data);
      }
    } catch {
      // No subscription yet
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      setSuccessMessage('Welcome to Pro! Your subscription is now active.');
      if (user) setUser({ ...user, role: 'pro' });
      window.history.replaceState({}, '', '/settings');
    }
  }, [searchParams, user, setUser]);

  async function handleUpgrade() {
    setIsCheckoutLoading(true);
    await startStripeCheckout({ interval: billingInterval });
    setIsCheckoutLoading(false);
  }

  async function handleManageSubscription() {
    setIsPortalLoading(true);
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.data.portalUrl) {
        window.location.href = data.data.portalUrl;
      }
    } catch {
      toast({
        type: 'error',
        title: 'Portal error',
        description: 'Unable to open billing portal. Please try again.',
      });
    } finally {
      setIsPortalLoading(false);
    }
  }

  if (!user) return null;

  const isPro = user.role === 'pro' || user.role === 'admin';
  const isPastDue = subscription?.status === 'past_due';
  const isCanceling = subscription?.cancelAtPeriodEnd && subscription?.status === 'active';

  return (
    <div id="billing" className="space-y-12 py-8">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-2">Studio Access</p>
        <h2 className="text-xl font-black text-on-surface uppercase tracking-tight">Licensing & Plans</h2>
      </div>

      {successMessage && (
        <div className="rounded-full border border-success/30 bg-success/5 p-5 animate-in fade-in slide-in-from-top-2">
          <p className="text-sm font-semibold text-success">{successMessage}</p>
        </div>
      )}

      {isPastDue && (
        <div className="rounded-full border border-error/30 bg-error/5 p-6 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-error mb-1">Payment Failed</h3>
            <p className="text-sm text-neutral-700 leading-relaxed">
              Your last payment was unsuccessful. Please update your payment method within 7 days to maintain Pro status.
            </p>
          </div>
          <button
            type="button"
            onClick={handleManageSubscription}
            disabled={isPortalLoading}
            className="rounded-full bg-error text-white px-6 py-2.5 text-sm font-semibold hover:bg-error/90 transition-all disabled:opacity-50"
          >
            {isPortalLoading ? 'Updating...' : 'Update Payment Method'}
          </button>
        </div>
      )}

      {/* Current plan status */}
      <div className="rounded-full border border-neutral-200 bg-neutral p-8 space-y-6 shadow-elevation-1">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-neutral-600">Current Membership</p>
            <div className="flex items-center gap-3">
              <span className={`text-2xl font-semibold ${isPro ? 'text-primary' : 'text-neutral-900'}`}>
                {isPro ? 'Pro Member' : 'Free Member'}
              </span>
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <div className={`w-2 h-2 rounded-full ${isPro ? 'bg-success animate-pulse' : 'bg-neutral-400'}`} />
              )}
            </div>
          </div>

          {isPro && (
            <button
              type="button"
              onClick={handleManageSubscription}
              disabled={isPortalLoading}
              className="rounded-full border border-neutral-300 px-6 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-100 transition-all"
            >
              {isPortalLoading ? 'Opening...' : 'Manage Subscription'}
            </button>
          )}
        </div>

        {isPro && subscription && (
          <div className="pt-6 border-t border-neutral-200 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-neutral-600">
                {isCanceling ? 'Access Expiration' : 'Next Billing Cycle'}
              </p>
              <p className="text-sm font-semibold text-neutral-900">
                {new Date(subscription.currentPeriodEnd ?? '').toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${subscription.status === 'active' ? 'bg-success/10 text-success' : 'bg-neutral-100 text-neutral-600'
              }`}>
              {subscription.status}
            </div>
          </div>
        )}
      </div>

      {/* Upgrade section (free only) */}
      {!isPro && (
        <div className="rounded-full bg-neutral-900 text-neutral p-10 space-y-8 shadow-elevation-4 relative overflow-hidden">
          {/* Subtle accent line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 relative z-10">
            <div className="space-y-4">
              <p className="text-xs font-semibold tracking-wide text-primary">Upgrade to Pro</p>
              <h3 className="text-4xl font-bold leading-tight">Unlock the Full Studio.</h3>
              <p className="text-sm text-neutral-300 max-w-sm leading-relaxed">
                Unlock professional-grade exports, unlimited projects, and the complete material library.
              </p>
            </div>

            <div className="text-right space-y-4">
              {/* Billing toggle */}
              <div className="flex items-center gap-1 bg-neutral-800 rounded-full p-1 w-fit ml-auto border border-neutral-700">
                <button
                  type="button"
                  onClick={() => setBillingInterval('monthly')}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${billingInterval === 'monthly' ? 'bg-neutral text-neutral-900' : 'text-neutral-400 hover:text-neutral'
                    }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setBillingInterval('yearly')}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${billingInterval === 'yearly' ? 'bg-neutral text-neutral-900' : 'text-neutral-400 hover:text-neutral'
                    }`}
                >
                  Yearly
                  <span className="ml-2 text-[10px] text-primary">-{PRO_YEARLY_SAVINGS_PERCENT}%</span>
                </button>
              </div>

              <div className="space-y-1">
                <div className="flex items-end justify-end gap-1">
                  <span className="text-4xl font-bold">
                    ${billingInterval === 'monthly' ? PRO_PRICE_MONTHLY : PRO_PRICE_YEARLY}
                  </span>
                  <span className="text-xs text-neutral-400 mb-2">
                    /{billingInterval === 'monthly' ? 'mo' : 'yr'}
                  </span>
                </div>
                {billingInterval === 'yearly' && (
                  <p className="text-xs text-neutral-500">
                    ${(PRO_PRICE_YEARLY / 12).toFixed(2)} / month billed annually
                  </p>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleUpgrade}
            disabled={isCheckoutLoading}
            className="w-full h-16 rounded-full bg-primary text-neutral-900 font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-50 shadow-elevation-2 active:scale-[0.98] relative z-10"
          >
            {isCheckoutLoading ? 'Processing...' : 'Upgrade to Pro'}
          </button>
        </div>
      )}

      {/* Plan comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <p className="text-xs font-medium text-neutral-500">Free Plan</p>
            <h4 className="text-sm font-semibold text-neutral-900">Standard Access</h4>
          </div>
          <ul className="space-y-4">
            {[
              'Design Studio with core tools',
              '20 essential layout blocks',
              '10 curated fabric swatches',
              'Community feed access',
              'Local project storage'
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm text-neutral-700">
                <div className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
                {item}
              </li>
            ))}
            {[
              'Unlimited projects',
              'High-resolution exports',
              'Full 2,700+ fabric library'
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm text-neutral-400 line-through">
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <p className="text-xs font-medium text-primary">Pro Plan</p>
            <h4 className="text-sm font-semibold text-primary">Pro Collective</h4>
          </div>
          <ul className="space-y-4">
            <li className="text-sm font-semibold text-neutral-900">Everything in Free, plus:</li>
            {[
              'Unlimited project storage',
              'Complete 50-block library + custom blocks',
              'Full 2,700+ fabric library + custom uploads',
              'SVG, PDF, & high-resolution PNG exports',
              'Photo-to-Design pipeline',
              'Print-ready 1:1 scale PDF patterns',
              'Server-side project sync'
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm font-medium text-neutral-900">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
