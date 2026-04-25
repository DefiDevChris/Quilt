'use client';

import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import { X, Check } from 'lucide-react';
import { useStripeCheckout } from '@/lib/stripe-checkout';

interface ProUpgradeModalProps {
  onClose: () => void;
}

export function ProUpgradeModal({ onClose }: ProUpgradeModalProps) {
  const { handleCheckout } = useStripeCheckout();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    dialogRef.current?.focus();
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--color-text)]/60 p-4 overflow-y-auto">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pro-upgrade-title"
        tabIndex={-1}
        className="relative w-full max-w-4xl bg-surface rounded-lg overflow-hidden shadow-[0_1px_2px_rgba(54,49,45,0.08)] my-8 border border-default outline-none"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-6 right-6 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-default text-default hover:bg-primary/10 transition-colors duration-150"
        >
          <X size={24} />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left Column: Brand statement */}
          <div className="bg-default text-default p-12 flex flex-col justify-center relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-[14px] leading-[20px] text-primary mb-6">Professional Tier</p>
              <h2 id="pro-upgrade-title" className="text-[40px] leading-[52px] text-default mb-8">
                The Full <br /> Studio <br /> Experience
              </h2>
              <div className="h-1 w-20 bg-primary mb-8" />
              <p className="text-dim text-[16px] leading-[24px] max-w-xs">
                Unlock professional access to advanced pattern generation, high-resolution exports,
                and complete fabric calibration tools.
              </p>
            </div>
          </div>

          {/* Right Column: Pricing & Benefits */}
          <div className="bg-surface p-12 flex flex-col justify-between">
            <div>
              <p className="text-[14px] leading-[20px] text-dim mb-8">Pro Features</p>

              <ul className="space-y-6 mb-12">
                {[
                  '50 traditional quilt blocks + custom block builder',
                  'Unlimited projects and archives',
                  'Print-ready 1:1 scale PDF export',
                  '2,700+ solid fabric swatches',
                  'Custom fabric image uploads',
                ].map((benefit, i) => (
                  <li key={i} className="flex items-center gap-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span className="text-[16px] leading-[24px] text-default">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Yearly Plan */}
                <button
                  onClick={() => handleCheckout({ plan: 'yearly' })}
                  className="group relative flex flex-col p-6 border-2 border-primary bg-primary text-default rounded-full hover:bg-primary-dark transition-colors duration-150"
                >
                  <span className="text-[14px] leading-[20px] mb-1">Annual Archive</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[32px] leading-[40px]">$60</span>
                    <span className="text-[14px] leading-[20px] opacity-60">/yr</span>
                  </div>
                  <div className="mt-4 text-[14px] leading-[20px] opacity-80">Best Value</div>
                </button>

                {/* Monthly Plan */}
                <button
                  onClick={() => handleCheckout({ plan: 'monthly' })}
                  className="flex flex-col p-6 border-2 border-default bg-surface text-default rounded-full hover:bg-primary/10 transition-colors duration-150"
                >
                  <span className="text-[14px] leading-[20px] mb-1">Monthly Access</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[32px] leading-[40px]">$8</span>
                    <span className="text-[14px] leading-[20px] opacity-60">/mo</span>
                  </div>
                  <div className="mt-4 text-[14px] leading-[20px]">Standard Access</div>
                </button>
              </div>

              <p className="text-[14px] leading-[20px] text-dim text-center">
                Payment processed securely via Stripe. <br />
                Manage your subscription in Settings.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
