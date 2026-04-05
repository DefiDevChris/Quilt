'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { PRO_PRICE_MONTHLY, PRO_PRICE_YEARLY, PRO_YEARLY_SAVINGS_PERCENT } from '@/lib/constants';
import { useToast } from '@/components/ui/ToastProvider';

type SubscriptionInfo = {
  plan: 'free' | 'pro';
  status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing';
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
};

export function BillingSection() {
  const user = useAuthStore((s) => s.user);
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
      // Refetch subscription to get actual server-side role instead of optimistic promotion
      fetchSubscription();
      window.history.replaceState({}, '', '/settings');
    }
  }, [searchParams, fetchSubscription]);

  async function handleUpgrade() {
    setIsCheckoutLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interval: billingInterval }),
      });
      const data = await res.json();
      if (data.success && data.data.checkoutUrl) {
        window.location.href = data.data.checkoutUrl;
      }
    } catch {
      toast({
        type: 'error',
        title: 'Checkout failed',
        description: 'Unable to start checkout. Please try again.',
      });
    } finally {
      setIsCheckoutLoading(false);
    }
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
    <div id="billing">
      <h2 className="text-lg font-bold text-on-surface mb-4">Billing & Plan</h2>

      {successMessage && (
        <div className="mb-4 rounded-xl border border-success/30 bg-success/5 p-3.5">
          <p className="text-sm font-medium text-success">{successMessage}</p>
        </div>
      )}

      {isPastDue && (
        <div className="mb-4 rounded-xl border border-warning/30 bg-warning/5 p-3.5">
          <h3 className="text-sm font-semibold text-warning mb-1">Payment Past Due</h3>
          <p className="text-xs text-slate-600">
            Your last payment failed. Please update your payment method within 7 days to keep your
            Pro access.
          </p>
          <button
            type="button"
            onClick={handleManageSubscription}
            disabled={isPortalLoading}
            className="mt-2.5 rounded-lg bg-warning px-3.5 py-1.5 text-xs font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isPortalLoading ? 'Loading...' : 'Update Payment Method'}
          </button>
        </div>
      )}

      {/* Current plan status */}
      <div className="rounded-xl glass-elevated p-5 mb-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <span
              className={`inline-block text-xs font-medium border rounded-full px-2.5 py-0.5 ${
                isPro
                  ? 'text-primary-dark bg-primary-container border-primary/30'
                  : 'text-slate-500 border-slate-200'
              }`}
            >
              {isPro ? 'Pro' : 'Free'}
            </span>
            {isLoading ? (
              <span className="text-[10px] text-slate-400 animate-pulse">Checking...</span>
            ) : isPro && subscription && subscription.plan === 'pro' ? (
              <span className="text-[10px] text-secondary/80">
                {isCanceling
                  ? `Cancels ${new Date(subscription.currentPeriodEnd ?? '').toLocaleDateString()}`
                  : subscription.status === 'active'
                    ? 'Active'
                    : subscription.status.replace('_', ' ')}
              </span>
            ) : isPro ? (
              <span className="text-[10px] text-secondary/80">Active</span>
            ) : null}
          </div>

          {isPro ? (
            <button
              type="button"
              onClick={handleManageSubscription}
              disabled={isPortalLoading}
              className="rounded-lg glass-inset text-slate-700 px-3 py-1.5 text-xs font-medium hover:bg-white/50 transition-colors disabled:opacity-50"
            >
              {isPortalLoading ? 'Loading...' : 'Manage'}
            </button>
          ) : null}
        </div>

        {isPro && subscription?.currentPeriodEnd && (
          <p className="text-xs text-secondary/80">
            {isCanceling ? 'Access until' : 'Next billing date'}:{' '}
            <span className="font-medium text-slate-700">
              {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
            </span>
          </p>
        )}
      </div>

      {/* Upgrade section (free only) */}
      {!isPro && (
        <div className="rounded-xl bg-primary-container/60 backdrop-blur-sm p-5 border border-primary/15 mb-3">
          <h3 className="text-sm font-semibold text-slate-800 mb-2.5">Upgrade to Pro</h3>

          {/* Billing toggle */}
          <div className="flex items-center gap-1.5 mb-3 bg-white/60 rounded-full p-0.5 w-fit">
            <button
              type="button"
              onClick={() => setBillingInterval('monthly')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                billingInterval === 'monthly'
                  ? 'bg-surface-canvas text-on-surface'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingInterval('yearly')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                billingInterval === 'yearly'
                  ? 'bg-surface-canvas text-on-surface'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Yearly
              <span className="ml-1 text-[10px] text-primary-dark font-semibold">
                Save {PRO_YEARLY_SAVINGS_PERCENT}%
              </span>
            </button>
          </div>

          {/* Price */}
          <div className="mb-3">
            <span className="text-2xl font-bold text-on-surface">
              ${billingInterval === 'monthly' ? PRO_PRICE_MONTHLY : PRO_PRICE_YEARLY}
            </span>
            <span className="text-xs text-secondary/80">
              /{billingInterval === 'monthly' ? 'month' : 'year'}
            </span>
            {billingInterval === 'yearly' && (
              <span className="block text-[10px] text-secondary/80 mt-0.5">
                ${(PRO_PRICE_YEARLY / 12).toFixed(0)}/month, billed annually
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleUpgrade}
            disabled={isCheckoutLoading}
            className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-on hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isCheckoutLoading ? 'Loading...' : 'Start Pro'}
          </button>
        </div>
      )}

      {/* Plan comparison */}
      <div className="rounded-xl glass-elevated p-5">
        <h3 className="text-sm font-semibold text-on-surface mb-3">Plan Comparison</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-xs font-semibold text-on-surface mb-2">Free</h4>
            <ul className="space-y-1.5 text-[11px] text-secondary/80">
              <li>All design tools</li>
              <li>20 starter blocks</li>
              <li>10 basic fabrics</li>
              <li>Browse community</li>
              <li>All tutorials</li>
              <li className="text-slate-300 line-through">Save projects</li>
              <li className="text-slate-300 line-through">Export (PDF, PNG, SVG)</li>
              <li className="text-slate-300 line-through">Full block library</li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-primary-dark mb-2">Pro</h4>
            <ul className="space-y-1.5 text-[11px] text-slate-500">
              <li>Everything in Free, plus:</li>
              <li>Save unlimited projects</li>
              <li>Full block library (always growing)</li>
              <li>Full fabric library + upload</li>
              <li>Export all formats</li>
              <li>Photo-to-quilt OCR</li>
              <li>FPP templates & cutting charts</li>
              <li>Yardage estimator & printlist</li>
              <li>Post to community</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
