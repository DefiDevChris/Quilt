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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#2d2a26]/60 p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#ffffff] rounded-lg overflow-hidden shadow-[0_1px_2px_rgba(45,42,38,0.08)] my-8 border border-[#e8e1da]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-10 w-12 h-12 flex items-center justify-center rounded-lg bg-[#fdfaf7] text-[#2d2a26] hover:bg-[#ff8d49]/10 transition-colors duration-150"
        >
          <X size={24} />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left Column: Brand statement */}
          <div className="bg-[#fdfaf7] text-[#2d2a26] p-12 flex flex-col justify-center relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-[14px] leading-[20px] text-[#ff8d49] mb-6">Professional Tier</p>
              <h2 className="text-[40px] leading-[52px] text-[#2d2a26] mb-8">
                The Full <br /> Studio <br /> Experience
              </h2>
              <div className="h-1 w-20 bg-[#ff8d49] mb-8" />
              <p className="text-[#6b655e] text-[16px] leading-[24px] max-w-xs">
                Unlock professional access to advanced pattern generation,
                high-resolution exports, and complete fabric calibration tools.
              </p>
            </div>
          </div>

          {/* Right Column: Pricing & Benefits */}
          <div className="bg-[#ffffff] p-12 flex flex-col justify-between">
            <div>
              <p className="text-[14px] leading-[20px] text-[#6b655e] mb-8">Pro Features</p>

              <ul className="space-y-6 mb-12">
                {[
                  '50 traditional quilt blocks + custom block builder',
                  'Photo-to-Design extraction pipeline',
                  'Unlimited projects and archives',
                  'Print-ready 1:1 scale PDF export',
                  '2,700+ solid fabric swatches',
                  'Custom fabric image uploads',
                ].map((benefit, i) => (
                  <li key={i} className="flex items-center gap-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#ff8d49]" />
                    <span className="text-[16px] leading-[24px] text-[#2d2a26]">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Yearly Plan */}
                <button
                  onClick={() => handleCheckout({ plan: 'yearly' })}
                  className="group relative flex flex-col p-6 border-2 border-[#ff8d49] bg-[#ff8d49] text-[#2d2a26] rounded-lg hover:bg-[#e67d3f] transition-colors duration-150"
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
                  className="flex flex-col p-6 border-2 border-[#e8e1da] bg-[#ffffff] text-[#2d2a26] rounded-lg hover:bg-[#ff8d49]/10 transition-colors duration-150"
                >
                  <span className="text-[14px] leading-[20px] mb-1">Monthly Access</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[32px] leading-[40px]">$8</span>
                    <span className="text-[14px] leading-[20px] opacity-60">/mo</span>
                  </div>
                  <div className="mt-4 text-[14px] leading-[20px]">Standard Access</div>
                </button>
              </div>

              <p className="text-[14px] leading-[20px] text-[#6b655e] text-center">
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
