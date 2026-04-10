'use client';

import React from 'react';
import Image from 'next/image';
import { X, Check } from 'lucide-react';
import { useStripeCheckout } from '@/lib/stripe-checkout';

interface ProUpgradeModalProps {
  onClose: () => void;
}

export function ProUpgradeModal({ onClose }: ProUpgradeModalProps) {
  const { handleCheckout } = useStripeCheckout();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-900/80 p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-neutral rounded-lg overflow-hidden shadow-elevation-4 my-8 border border-neutral-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-10 w-12 h-12 flex items-center justify-center rounded-lg bg-neutral-900 text-neutral transition-all"
        >
          <X size={24} />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left Column: Editorial Statement */}
          <div className="bg-neutral-900 text-neutral p-12 flex flex-col justify-center relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-xs font-semibold tracking-wide mb-6 text-primary">Professional Tier</p>
              <h2 className="text-5xl font-bold tracking-tight leading-tight mb-8">
                The Full <br /> Studio <br /> Experience
              </h2>
              <div className="h-1 w-20 bg-neutral mb-8" />
              <p className="text-neutral-300 font-medium text-sm leading-relaxed max-w-xs">
                Unlock professional access to advanced pattern generation,
                high-resolution exports, and complete fabric calibration tools.
              </p>
            </div>
          </div>

          {/* Right Column: Pricing & Benefits */}
          <div className="bg-neutral p-12 flex flex-col justify-between">
            <div>
              <p className="text-xs font-semibold tracking-wide text-neutral-600 mb-8">Pro Features</p>

              <ul className="space-y-6 mb-12">
                {[
                  '50 traditional quilt blocks + custom block builder',
                  'Photo-to-Design extraction pipeline',
                  'Unlimited projects and archives',
                  'Print-ready 1:1 scale PDF export',
                  '2,700+ solid fabric swatches',
                  'Custom fabric image uploads',
                ].map((benefit, i) => (
                  <li key={i} className="flex items-center gap-4 group">
                    <div className="w-1.5 h-1.5 rounded-full bg-neutral-900 group-hover:scale-150 transition-transform" />
                    <span className="text-sm font-medium text-neutral-900">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Yearly Plan */}
                <button
                  onClick={() => handleCheckout({ plan: 'yearly' })}
                  className="group relative flex flex-col p-6 border-2 border-on-surface bg-on-surface text-surface transition-all hover:brightness-110"
                >
                  <span className="text-[10px] font-black uppercase tracking-widest mb-1">Annual Archive</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black tracking-tighter">$60</span>
                    <span className="text-[10px] font-bold opacity-60">/YR</span>
                  </div>
                  <div className="mt-4 text-[9px] font-black uppercase tracking-widest opacity-80 group-hover:translate-x-1 transition-transform">Best Value →</div>
                </button>

                {/* Monthly Plan */}
                <button
                  onClick={() => handleCheckout({ plan: 'monthly' })}
                  className="flex flex-col p-6 border-2 border-on-surface bg-surface text-on-surface transition-all hover:bg-on-surface hover:text-surface"
                >
                  <span className="text-[10px] font-black uppercase tracking-widest mb-1">Monthly Access</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black tracking-tighter">$8</span>
                    <span className="text-[10px] font-bold opacity-60">/MO</span>
                  </div>
                  <div className="mt-4 text-[9px] font-black uppercase tracking-widest">Standard Access</div>
                </button>
              </div>

              <p className="text-[10px] font-bold text-secondary/60 leading-relaxed uppercase tracking-wider text-center">
                Payment processed securely via Stripe infrastructure. <br />
                Subscriptions can be managed via the Studio Settings panel.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
