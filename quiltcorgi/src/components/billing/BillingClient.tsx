'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { PRO_PRICE_MONTHLY, PRO_PRICE_YEARLY, PRO_YEARLY_SAVINGS_PERCENT } from '@/lib/constants';

type SubscriptionInfo = {
  plan: 'free' | 'pro';
  status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing';
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
};

export function BillingClient() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const searchParams = useSearchParams();
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('yearly');

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
      window.history.replaceState({}, '', '/profile/billing');
    }
  }, [searchParams, user, setUser]);

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
      // Checkout session creation failed
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
      // Portal session creation failed
    } finally {
      setIsPortalLoading(false);
    }
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-surface-container-high rounded w-1/3" />
          <div className="h-4 bg-surface-container-high rounded w-1/2" />
        </div>
      </div>
    );
  }

  const isPro = user.role === 'pro' || user.role === 'admin';
  const isPastDue = subscription?.status === 'past_due';
  const isCanceling = subscription?.cancelAtPeriodEnd && subscription?.status === 'active';

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-on-surface mb-6">Billing</h1>

      {successMessage && (
        <div className="mb-6 rounded-xl border border-success/30 bg-success/5 p-4">
          <p className="text-sm font-medium text-success">{successMessage}</p>
        </div>
      )}

      {isPastDue && (
        <div className="mb-6 rounded-xl border border-warning/30 bg-warning/5 p-4">
          <h3 className="text-sm font-semibold text-warning mb-1">Payment Past Due</h3>
          <p className="text-xs text-secondary">
            Your last payment failed. Please update your payment method within 7 days to keep your
            Pro access.
          </p>
          <button
            type="button"
            onClick={handleManageSubscription}
            disabled={isPortalLoading}
            className="mt-3 rounded-md bg-warning px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isPortalLoading ? 'Loading...' : 'Update Payment Method'}
          </button>
        </div>
      )}

      <div className="rounded-xl glass-elevated p-6 mb-6">
        <h2 className="text-lg font-semibold text-on-surface mb-4">Current Plan</h2>

        <div className="flex items-center gap-3 mb-4">
          <span
            className={`inline-block text-sm font-medium border rounded-full px-3 py-1 ${
              isPro
                ? 'text-primary bg-primary-container border-primary/30'
                : 'text-secondary border-outline-variant'
            }`}
          >
            {isPro ? 'Pro' : 'Free'}
          </span>
          {isLoading ? (
            <span className="text-xs text-secondary animate-pulse">Checking status...</span>
          ) : isPro && subscription && subscription.plan === 'pro' ? (
            <span className="text-xs text-secondary">
              {isCanceling
                ? `Cancels ${new Date(subscription.currentPeriodEnd ?? '').toLocaleDateString()}`
                : subscription.status === 'active'
                  ? 'Active'
                  : subscription.status.replace('_', ' ')}
            </span>
          ) : isPro ? (
            <span className="text-xs text-secondary">Active</span>
          ) : null}
        </div>

        {isPro && subscription?.currentPeriodEnd && (
          <p className="text-sm text-secondary mb-4">
            {isCanceling ? 'Access until' : 'Next billing date'}:{' '}
            <span className="font-medium">
              {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
            </span>
          </p>
        )}

        {isPro ? (
          <button
            type="button"
            onClick={handleManageSubscription}
            disabled={isPortalLoading}
            className="rounded-lg glass-inset text-on-surface px-4 py-2 text-sm font-medium hover:bg-white/50 transition-colors disabled:opacity-50"
          >
            {isPortalLoading ? 'Loading...' : 'Manage Subscription'}
          </button>
        ) : (
          <div className="rounded-xl bg-primary-container/80 backdrop-blur-sm p-5 border border-primary/15">
            <h3 className="text-base font-semibold text-on-surface mb-3">Upgrade to Pro</h3>

            {/* Billing toggle */}
            <div className="flex items-center gap-2 mb-4 bg-surface-container rounded-full p-1 w-fit">
              <button
                type="button"
                onClick={() => setBillingInterval('monthly')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  billingInterval === 'monthly'
                    ? 'bg-surface text-on-surface shadow-sm'
                    : 'text-secondary hover:text-on-surface'
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingInterval('yearly')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  billingInterval === 'yearly'
                    ? 'bg-surface text-on-surface shadow-sm'
                    : 'text-secondary hover:text-on-surface'
                }`}
              >
                Yearly
                <span className="ml-1 text-xs text-primary font-semibold">
                  Save {PRO_YEARLY_SAVINGS_PERCENT}%
                </span>
              </button>
            </div>

            {/* Price */}
            <div className="mb-4">
              <span className="text-3xl font-bold text-on-surface">
                ${billingInterval === 'monthly' ? PRO_PRICE_MONTHLY : PRO_PRICE_YEARLY}
              </span>
              <span className="text-sm text-secondary">
                /{billingInterval === 'monthly' ? 'month' : 'year'}
              </span>
              {billingInterval === 'yearly' && (
                <span className="block text-xs text-secondary mt-1">
                  ${(PRO_PRICE_YEARLY / 12).toFixed(0)}/month, billed annually
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleUpgrade}
              disabled={isCheckoutLoading}
              className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-on hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isCheckoutLoading ? 'Loading...' : 'Start Pro'}
            </button>
          </div>
        )}
      </div>

      {/* Plan comparison */}
      <div className="rounded-xl glass-elevated p-6">
        <h2 className="text-lg font-semibold text-on-surface mb-4">Plan Comparison</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-semibold text-on-surface mb-3">Free</h3>
            <ul className="space-y-2 text-xs text-secondary">
              <li>All design tools</li>
              <li>20 starter blocks</li>
              <li>10 basic fabrics</li>
              <li>Browse community</li>
              <li>All tutorials</li>
              <li className="text-secondary/50 line-through">Save projects</li>
              <li className="text-secondary/50 line-through">Export (PDF, PNG, SVG)</li>
              <li className="text-secondary/50 line-through">Full block library</li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-primary mb-3">Pro</h3>
            <ul className="space-y-2 text-xs text-secondary">
              <li>Everything in Free, plus:</li>
              <li>Save unlimited projects</li>
              <li>Full 659+ block library</li>
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
