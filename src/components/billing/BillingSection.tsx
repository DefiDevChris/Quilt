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
        <div className="rounded-2xl border border-success/30 bg-success/5 p-5 animate-in fade-in slide-in-from-top-2">
          <p className="text-sm font-black text-success uppercase tracking-widest">{successMessage}</p>
        </div>
      )}

      {isPastDue && (
        <div className="rounded-2xl border border-error/30 bg-error/5 p-6 space-y-4">
          <div>
            <h3 className="text-xs font-black text-error uppercase tracking-widest mb-1">Administrative Alert: Payment Failed</h3>
            <p className="text-[11px] font-bold text-secondary leading-relaxed uppercase tracking-wider opacity-70">
              Your last synchronization with our payment gateway was unsuccessful. Please update your studio record within 7 business days to maintain Pro status.
            </p>
          </div>
          <button
            type="button"
            onClick={handleManageSubscription}
            disabled={isPortalLoading}
            className="rounded-xl bg-error text-white px-6 py-2.5 text-[10px] font-black uppercase tracking-widest hover:bg-error/90 transition-all disabled:opacity-50"
          >
            {isPortalLoading ? 'Synchronizing...' : 'Update Records'}
          </button>
        </div>
      )}

      {/* Current plan status */}
      <div className="rounded-3xl border border-outline-variant/30 bg-white p-8 space-y-6 shadow-elevation-1">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-secondary opacity-60">Current Membership</p>
            <div className="flex items-center gap-3">
              <span className={`text-2xl font-black uppercase tracking-tighter ${isPro ? 'text-primary' : 'text-on-surface'}`}>
                {isPro ? 'Pro Member' : 'Standard Member'}
              </span>
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <div className={`w-2 h-2 rounded-full ${isPro ? 'bg-success animate-pulse' : 'bg-secondary/30'}`} />
              )}
            </div>
          </div>

          {isPro && (
            <button
              type="button"
              onClick={handleManageSubscription}
              disabled={isPortalLoading}
              className="rounded-xl border border-outline-variant/50 px-6 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-surface-container transition-all"
            >
              {isPortalLoading ? 'Opening Portal...' : 'Manage Subscription'}
            </button>
          )}
        </div>

        {isPro && subscription && (
          <div className="pt-6 border-t border-outline-variant/10 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-secondary opacity-60">
                {isCanceling ? 'Access Expiration' : 'Next Billing Cycle'}
              </p>
              <p className="text-sm font-black text-on-surface">
                {new Date(subscription.currentPeriodEnd ?? '').toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
            </div>
            <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
              subscription.status === 'active' ? 'bg-success/10 text-success' : 'bg-secondary/10 text-secondary'
            }`}>
              {subscription.status}
            </div>
          </div>
        )}
      </div>

      {/* Upgrade section (free only) */}
      {!isPro && (
        <div className="rounded-[40px] bg-on-surface text-surface p-10 space-y-8 shadow-elevation-4 relative overflow-hidden group">
          {/* Subtle accent line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 relative z-10">
            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Upgrade Required</p>
              <h3 className="text-4xl font-black uppercase tracking-tighter leading-none italic">Unveil the Full Studio.</h3>
              <p className="text-sm font-bold opacity-60 max-w-sm uppercase tracking-wider leading-relaxed">
                Unlock professional-grade export formats, unlimited archiving, and the complete material library.
              </p>
            </div>

            <div className="text-right space-y-4">
               {/* Billing toggle */}
              <div className="flex items-center gap-1 bg-surface/10 rounded-xl p-1 w-fit ml-auto border border-surface/5">
                <button
                  type="button"
                  onClick={() => setBillingInterval('monthly')}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                    billingInterval === 'monthly' ? 'bg-surface text-on-surface' : 'text-surface/60 hover:text-surface'
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setBillingInterval('yearly')}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                    billingInterval === 'yearly' ? 'bg-surface text-on-surface' : 'text-surface/60 hover:text-surface'
                  }`}
                >
                  Yearly
                  <span className="ml-2 text-[8px] text-primary">-{PRO_YEARLY_SAVINGS_PERCENT}%</span>
                </button>
              </div>

              <div className="space-y-1">
                <div className="flex items-end justify-end gap-1">
                  <span className="text-4xl font-black">
                    ${billingInterval === 'monthly' ? PRO_PRICE_MONTHLY : PRO_PRICE_YEARLY}
                  </span>
                  <span className="text-[10px] font-black opacity-40 uppercase tracking-widest mb-2">
                    /{billingInterval === 'monthly' ? 'mo' : 'yr'}
                  </span>
                </div>
                {billingInterval === 'yearly' && (
                  <p className="text-[9px] font-black opacity-30 uppercase tracking-[0.2em]">
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
            className="w-full h-16 rounded-2xl bg-primary text-on-surface font-black uppercase tracking-[0.3em] text-sm hover:brightness-110 transition-all disabled:opacity-50 shadow-elevation-2 active:scale-[0.98] relative z-10"
          >
            {isCheckoutLoading ? 'Initializing Secure Payment...' : 'Authorize Pro Access'}
          </button>
        </div>
      )}

      {/* Plan comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-secondary/40">Tier 01</p>
            <h4 className="text-sm font-black uppercase tracking-widest text-on-surface">Standard Archive</h4>
          </div>
          <ul className="space-y-4">
            {[
              'Comprehensive Studio Toolset',
              '20 Essential Layout Blocks',
              '10 Curated Textures',
              'Global Studio Feed Access',
              'Standard Documentation'
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-[11px] font-bold text-secondary uppercase tracking-widest opacity-60">
                <div className="w-1.5 h-1.5 rounded-full bg-outline-variant" />
                {item}
              </li>
            ))}
            {[
              'Unlimited Project Persistence',
              'High-Resolution Exports',
              'Full Material Library'
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-[11px] font-bold text-secondary/20 uppercase tracking-widest line-through decoration-1">
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">Tier 02</p>
            <h4 className="text-sm font-black uppercase tracking-widest text-primary">Pro Collective</h4>
          </div>
          <ul className="space-y-4">
             <li className="text-[11px] font-black text-on-surface uppercase tracking-widest">Everything in Standard, plus:</li>
            {[
              'Unlimited Project persistence',
              'Complete 500+ Block Library',
              'Full Material Library + Custom Uploads',
              'SVG, PDF, & High-Res PNG Exports',
              'Advanced Photo-to-Quilt Vision AI',
              'Interactive FPP & Cutting Charts',
              'Studio Material Estimator'
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-[11px] font-black text-on-surface uppercase tracking-widest">
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
