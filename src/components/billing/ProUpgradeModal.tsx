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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-on-surface/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-surface rounded-sm overflow-hidden shadow-elevation-5 animate-expandIn my-8 border border-on-surface/10">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-on-surface text-surface hover:scale-105 transition-all"
        >
          <X size={24} />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left Column: Editorial Statement */}
          <div className="bg-on-surface text-surface p-12 flex flex-col justify-center relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-6 opacity-60">Professional Tier</p>
              <h2 className="text-5xl font-black tracking-tighter uppercase leading-[0.9] mb-8">
                The Full <br /> Studio <br /> Experience
              </h2>
              <div className="h-1 w-20 bg-surface mb-8" />
              <p className="text-surface/70 font-bold text-sm leading-relaxed max-w-xs">
                Authorize professional access to unlock advanced pattern generation, 
                high-resolution exports, and complete fabric calibration tools.
              </p>
            </div>
          </div>

          {/* Right Column: Pricing & Benefits */}
          <div className="bg-surface p-12 flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-secondary mb-8">Studio Capabilities</p>

              <ul className="space-y-6 mb-12">
                {[
                  'Advanced Block Library (650+ Geometries)',
                  'AI-Driven Photo-to-Design Engine',
                  'Unlimited Studio Archives & Projects',
                  'Print-Ready 1:1 Scale PDF Export',
                  'FPP Template Generation Systems',
                  'Digital Fabric Calibration (OpenCV)',
                ].map((benefit, i) => (
                  <li key={i} className="flex items-center gap-4 group">
                    <div className="w-1.5 h-1.5 rounded-full bg-on-surface group-hover:scale-150 transition-transform" />
                    <span className="text-[11px] font-black uppercase tracking-widest text-on-surface">{benefit}</span>
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
