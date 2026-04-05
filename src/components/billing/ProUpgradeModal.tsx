'use client';

import React from 'react';
import Image from 'next/image';
import { X, Check } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';
import { PRO_PRICE_MONTHLY, PRO_PRICE_YEARLY } from '@/lib/constants';

interface ProUpgradeModalProps {
  onClose: () => void;
}

export function ProUpgradeModal({ onClose }: ProUpgradeModalProps) {
  const { toast } = useToast();

  const handleCheckout = async (priceId?: string) => {
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(priceId ? { interval: priceId } : {}),
      });
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
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-on-surface/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl glass-elevated rounded-3xl overflow-hidden shadow-elevation-4 animate-expandIn my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-surface-container hover:bg-surface-container-high transition-colors text-on-surface"
        >
          <X size={20} />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left Column: Mascots & Visuals */}
          <div className="bg-primary/10 p-10 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute top-[-20%] left-[-20%] w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
            <div className="absolute bottom-[-20%] right-[-20%] w-64 h-64 bg-primary-golden/20 rounded-full blur-3xl" />

            <div className="relative z-10 text-center mb-8">
              <span className="inline-block px-4 py-1.5 bg-primary/20 text-primary-dark text-sm font-extrabold uppercase tracking-widest rounded-full mb-6">
                QuiltCorgi Pro
              </span>
              <h2 className="text-4xl font-extrabold text-on-surface leading-tight mb-4">
                Unlock Your <br /> Quilt Magic
              </h2>
              <p className="text-secondary font-medium text-lg">
                Join our pro quilters and access every tool you need to design, calculate, and
                create.
              </p>
            </div>

            <div className="relative w-64 h-64">
              <Image
                src="/mascots&avatars/corgi3.png"
                alt="QuiltCorgi Mascot"
                fill
                className="object-contain"
                priority
              />
            </div>

            <div className="mt-8 bg-white/60 backdrop-blur-md rounded-xl p-4 shadow-elevation-1 border border-white/50 text-center w-full max-w-sm">
              <p className="text-on-surface font-bold">Save More, Quilt More!</p>
              <p className="text-secondary text-sm mt-1">
                At ${PRO_PRICE_YEARLY}/year, QuiltCorgi Pro is cheaper than buying just 4 standalone
                quilt patterns!
              </p>
            </div>
          </div>

          {/* Right Column: Pricing & Benefits */}
          <div className="bg-surface p-10 flex flex-col">
            <h3 className="text-2xl font-extrabold text-on-surface mb-6">Everything you get:</h3>

            <ul className="space-y-4 mb-8 flex-1">
              {[
                'Full Library of Quilt Blocks (always growing)',
                'AI Photo-to-Pattern Generator',
                'Save unlimited projects & worktables',
                'Export Print-Ready PDF Patterns (1:1 Scale)',
                'Yardage Estimator & Cutting Charts',
                'FPP Templates with seam allowances',
                'Fabric Calibration & Pattern Adjustments',
                'Post designs to Social',
              ].map((benefit, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="mt-0.5 w-5 h-5 rounded-full bg-primary/20 text-primary-dark flex items-center justify-center shrink-0">
                    <Check size={14} strokeWidth={3} />
                  </div>
                  <span className="text-on-surface font-medium">{benefit}</span>
                </li>
              ))}
            </ul>

            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Yearly Plan - Best Value */}
                <button
                  onClick={() => handleCheckout('yearly')}
                  className="flex-1 rounded-2xl border-2 border-primary bg-primary/5 p-4 text-left transition-all hover:bg-primary/10 hover:shadow-elevation-2 group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 bg-primary text-primary-on text-[10px] font-extrabold px-2 py-1 rounded-bl-lg uppercase tracking-wider">
                    Best Value
                  </div>
                  <div className="font-bold text-lg text-on-surface">Yearly</div>
                  <div className="text-3xl font-extrabold text-on-surface my-1">
                    ${PRO_PRICE_YEARLY}
                    <span className="text-base font-medium text-secondary">/yr</span>
                  </div>
                  <div className="text-sm font-medium text-secondary">
                    Just ${Math.round(PRO_PRICE_YEARLY / 12)}/month
                  </div>
                </button>

                {/* Monthly Plan */}
                <button
                  onClick={() => handleCheckout('monthly')}
                  className="flex-1 rounded-2xl border-2 border-outline-variant bg-surface p-4 text-left transition-all hover:border-primary/50 hover:bg-surface-container hover:shadow-elevation-2"
                >
                  <div className="font-bold text-lg text-on-surface">Monthly</div>
                  <div className="text-3xl font-extrabold text-on-surface my-1">
                    ${PRO_PRICE_MONTHLY}
                    <span className="text-base font-medium text-secondary">/mo</span>
                  </div>
                  <div className="text-sm font-medium text-secondary">Cancel anytime</div>
                </button>
              </div>

              <p className="text-center text-xs font-medium text-secondary/70 mt-4">
                Secure checkout powered by Stripe. You can cancel your subscription at any time from
                your profile.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
