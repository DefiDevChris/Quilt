'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { PRO_PRICE_MONTHLY, PRO_PRICE_YEARLY, PRO_YEARLY_SAVINGS_PERCENT } from '@/lib/constants';
import { startStripeCheckout } from '@/lib/stripe-checkout';
import { useToast } from '@/components/ui/ToastProvider';
import { COLORS, COLORS_HOVER, SHADOW, MOTION } from '@/lib/design-system';

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
        <p className="text-[14px] leading-[20px] mb-2" style={{ color: COLORS.primary }}>
          Studio Access
        </p>
        <h2 className="text-[24px] leading-[32px] text-[var(--color-text)]">Licensing & Plans</h2>
      </div>

      {successMessage && (
        <div
          className="rounded-lg p-5"
          style={{ borderColor: `${COLORS.secondary}4d`, backgroundColor: `${COLORS.secondary}1a` }}
        >
          <p className="text-[16px] leading-[24px] text-[var(--color-text)]">{successMessage}</p>
        </div>
      )}

      {isPastDue && (
        <div
          className="rounded-lg p-6 space-y-4"
          style={{ borderColor: `${COLORS.primary}4d`, backgroundColor: `${COLORS.primary}0d` }}
        >
          <div>
            <h3 className="text-[16px] leading-[24px] mb-1" style={{ color: COLORS.primary }}>
              Payment Failed
            </h3>
            <p className="text-[16px] leading-[24px] text-[var(--color-text-dim)]">
              Your last payment was unsuccessful. Please update your payment method within 7 days to
              maintain Pro status.
            </p>
          </div>
          <button
            type="button"
            onClick={handleManageSubscription}
            disabled={isPortalLoading}
            className="rounded-full text-[var(--color-text)] px-6 py-2.5 text-[16px] leading-[24px] transition-colors duration-150 disabled:opacity-50"
            style={{ backgroundColor: COLORS.primary }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = COLORS_HOVER.primary)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = COLORS.primary)}
          >
            {isPortalLoading ? 'Updating...' : 'Update Payment Method'}
          </button>
        </div>
      )}

      {/* Current plan status */}
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-8 space-y-6 shadow-[0_1px_2px_rgba(26,26,26,0.08)]">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[14px] leading-[20px] text-[var(--color-text-dim)]">
              Current Membership
            </p>
            <div className="flex items-center gap-3">
              <span
                className={`text-[24px] leading-[32px]`}
                style={isPro ? { color: COLORS.primary } : {}}
              >
                {isPro ? 'Pro Member' : 'Free Member'}
              </span>
              {isLoading ? (
                <div
                  className="w-4 h-4 rounded-lg animate-pulse"
                  style={{ backgroundColor: COLORS.secondary }}
                />
              ) : (
                <div
                  className={`w-2 h-2 rounded-full ${isPro ? 'animate-pulse' : 'bg-[var(--color-text-dim)]'}`}
                  style={isPro ? { backgroundColor: COLORS.primary } : {}}
                />
              )}
            </div>
          </div>

          {isPro && (
            <button
              type="button"
              onClick={handleManageSubscription}
              disabled={isPortalLoading}
              className="rounded-full border border-[var(--color-border)] px-6 py-3 text-[16px] leading-[24px] text-[var(--color-text)] transition-colors duration-150"
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = `${COLORS.primary}1a`)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              {isPortalLoading ? 'Opening...' : 'Manage Subscription'}
            </button>
          )}
        </div>

        {isPro && subscription && (
          <div className="pt-6 border-t border-[var(--color-border)] flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[14px] leading-[20px] text-[var(--color-text-dim)]">
                {isCanceling ? 'Access Expiration' : 'Next Billing Cycle'}
              </p>
              <p className="text-[16px] leading-[24px] text-[var(--color-text)]">
                {new Date(subscription.currentPeriodEnd ?? '').toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
            <div
              className={`px-3 py-1 rounded-full text-[14px] leading-[20px] ${
                subscription.status === 'active'
                  ? ''
                  : 'bg-[var(--color-bg)] text-[var(--color-text-dim)]'
              }`}
              style={
                subscription.status === 'active'
                  ? { backgroundColor: `${COLORS.secondary}33`, color: COLORS.primary }
                  : {}
              }
            >
              {subscription.status}
            </div>
          </div>
        )}
      </div>

      {/* Upgrade section (free only) */}
      {!isPro && (
        <div className="rounded-lg bg-[var(--color-text)] text-[var(--color-surface)] p-10 space-y-8 shadow-[0_1px_2px_rgba(26,26,26,0.08)] relative overflow-hidden">
          <div
            className="absolute top-0 left-0 right-0 h-1"
            style={{ backgroundColor: COLORS.primary }}
          />

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 relative z-10">
            <div className="space-y-4">
              <p className="text-[14px] leading-[20px]" style={{ color: COLORS.primary }}>
                Upgrade to Pro
              </p>
              <h3 className="text-[32px] leading-[40px] text-[var(--color-surface)]">
                Unlock the Full Studio.
              </h3>
              <p className="text-[16px] leading-[24px] text-[var(--color-text-dim)] max-w-sm">
                Unlock professional-grade exports, unlimited projects, and the complete material
                library.
              </p>
            </div>

            <div className="text-right space-y-4">
              {/* Billing toggle */}
              <div
                className="flex items-center gap-1 bg-[var(--color-text)] border border-[var(--color-border)] rounded-full p-1 w-fit ml-auto"
                role="radiogroup"
                aria-label="Billing interval"
              >
                <button
                  type="button"
                  role="radio"
                  aria-checked={billingInterval === 'monthly'}
                  onClick={() => setBillingInterval('monthly')}
                  className={`px-4 py-2 rounded-full text-[14px] leading-[20px] transition-colors duration-150 ${
                    billingInterval === 'monthly'
                      ? 'text-[var(--color-text)]'
                      : 'text-[var(--color-text-dim)] hover:text-[var(--color-surface)]'
                  }`}
                  style={billingInterval === 'monthly' ? { backgroundColor: COLORS.primary } : {}}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={billingInterval === 'yearly'}
                  onClick={() => setBillingInterval('yearly')}
                  className={`px-4 py-2 rounded-full text-[14px] leading-[20px] transition-colors duration-150 ${
                    billingInterval === 'yearly'
                      ? 'text-[var(--color-text)]'
                      : 'text-[var(--color-text-dim)] hover:text-[var(--color-surface)]'
                  }`}
                  style={billingInterval === 'yearly' ? { backgroundColor: COLORS.primary } : {}}
                >
                  Yearly
                  <span
                    className="ml-2 text-[14px] leading-[20px]"
                    style={{ color: COLORS.primary }}
                  >
                    -{PRO_YEARLY_SAVINGS_PERCENT}%
                  </span>
                </button>
              </div>

              <div className="space-y-1">
                <div className="flex items-end justify-end gap-1">
                  <span className="text-[40px] leading-[52px] text-[var(--color-surface)]">
                    ${billingInterval === 'monthly' ? PRO_PRICE_MONTHLY : PRO_PRICE_YEARLY}
                  </span>
                  <span className="text-[14px] leading-[20px] text-[var(--color-text-dim)] mb-2">
                    /{billingInterval === 'monthly' ? 'mo' : 'yr'}
                  </span>
                </div>
                {billingInterval === 'yearly' && (
                  <p className="text-[14px] leading-[20px] text-[var(--color-text-dim)]">
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
            className="w-full h-16 rounded-full text-[var(--color-text)] text-[16px] leading-[24px] transition-colors duration-150 disabled:opacity-50 relative z-10"
            style={{ backgroundColor: COLORS.primary, boxShadow: SHADOW.brand }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = COLORS_HOVER.primary)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = COLORS.primary)}
          >
            {isCheckoutLoading ? 'Processing...' : 'Upgrade to Pro'}
          </button>
        </div>
      )}

      {/* Plan comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <p className="text-[14px] leading-[20px] text-[var(--color-text-dim)]">Free Plan</p>
            <h4 className="text-[16px] leading-[24px] text-[var(--color-text)]">Standard Access</h4>
          </div>
          <ul className="space-y-4">
            {[
              'Design Studio with core tools',
              '20 essential layout blocks',
              '10 curated fabric swatches',
              'Community thread access',
              'Local project storage',
            ].map((item) => (
              <li
                key={item}
                className="flex items-center gap-3 text-[16px] leading-[24px] text-[var(--color-text-dim)]"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-dim)]" />
                {item}
              </li>
            ))}
            {['Unlimited projects', 'High-resolution exports', 'Full 2,700+ fabric library'].map(
              (item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 text-[16px] leading-[24px] text-[var(--color-text-dim)] opacity-40"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-dim)] opacity-40" />
                  <span className="line-through">{item}</span>
                </li>
              )
            )}
          </ul>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <p className="text-[14px] leading-[20px]" style={{ color: COLORS.primary }}>
              Pro Plan
            </p>
            <h4 className="text-[16px] leading-[24px]" style={{ color: COLORS.primary }}>
              Pro Collective
            </h4>
          </div>
          <ul className="space-y-4">
            <li className="text-[16px] leading-[24px] text-[var(--color-text)]">
              Everything in Free, plus:
            </li>
            {[
              'Unlimited project storage',
              'Complete 50-block library + custom blocks',
              'Full 2,700+ fabric library + custom uploads',
              'SVG, PDF, & high-resolution PNG exports',
              'Photo-to-Design pipeline',
              'Print-ready 1:1 scale PDF patterns',
              'Server-side project sync',
            ].map((item) => (
              <li
                key={item}
                className="flex items-center gap-3 text-[16px] leading-[24px] text-[var(--color-text)]"
              >
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: COLORS.primary }}
                />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
