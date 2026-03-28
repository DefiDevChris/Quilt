'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

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
      const res = await fetch('/api/stripe/checkout', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.data.checkoutUrl) {
        window.location.href = data.data.checkoutUrl;
      }
    } catch {
      console.error('Failed to create checkout session');
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
      console.error('Failed to create portal session');
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
        <div className="mb-6 rounded-lg border border-success/30 bg-success/5 p-4">
          <p className="text-sm font-medium text-success">{successMessage}</p>
        </div>
      )}

      {isPastDue && (
        <div className="mb-6 rounded-lg border border-warning/30 bg-warning/5 p-4">
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

      <div className="rounded-lg bg-surface-container p-6 mb-6">
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
            <span className="text-xs text-secondary">Loading...</span>
          ) : isPro && subscription ? (
            <span className="text-xs text-secondary">
              {isCanceling
                ? `Cancels ${new Date(subscription.currentPeriodEnd ?? '').toLocaleDateString()}`
                : subscription.status === 'active'
                  ? 'Active'
                  : subscription.status.replace('_', ' ')}
            </span>
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
            className="rounded-md bg-surface-container text-on-surface px-4 py-2 text-sm font-medium hover:bg-surface-container-high transition-colors disabled:opacity-50"
          >
            {isPortalLoading ? 'Loading...' : 'Manage Subscription'}
          </button>
        ) : (
          <div className="rounded-lg bg-primary-container p-4">
            <h3 className="text-sm font-semibold text-primary mb-1">Upgrade to Pro</h3>
            <p className="text-xs text-secondary mb-3">
              Unlock unlimited projects, full block library, fabric system, layout engine,
              generators, yardage estimator, pattern export, and community posting.
            </p>
            <button
              type="button"
              onClick={handleUpgrade}
              disabled={isCheckoutLoading}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-on hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isCheckoutLoading ? 'Loading...' : 'Upgrade Now'}
            </button>
          </div>
        )}
      </div>

      <div className="rounded-lg bg-surface-container p-6">
        <h2 className="text-lg font-semibold text-on-surface mb-4">Plan Comparison</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-semibold text-on-surface mb-2">Free</h3>
            <ul className="space-y-1 text-xs text-secondary">
              <li>Up to 3 projects</li>
              <li>100 quilt blocks</li>
              <li>Basic shape tools</li>
              <li>Grid & snap-to-grid</li>
              <li>Undo/redo</li>
              <li>Fraction calculator</li>
              <li>Browse community</li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-primary mb-2">Pro</h3>
            <ul className="space-y-1 text-xs text-secondary">
              <li>Unlimited projects</li>
              <li>6,000+ quilt blocks</li>
              <li>Bezier curves & context menu</li>
              <li>Fabric library & uploads</li>
              <li>Layout engine & borders</li>
              <li>Symmetry & serendipity</li>
              <li>Yardage estimator</li>
              <li>PDF & image export</li>
              <li>Post to community</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
