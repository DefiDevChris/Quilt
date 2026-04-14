'use client';

import Image from 'next/image';
import { OnboardingForm } from './OnboardingForm';
import { BrandedSplitPaneModal } from '@/lib/branded-modal';
import { COLORS, withAlpha, TYPOGRAPHY } from '@/lib/design-system';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal wrapper for onboarding flow.
 * Uses the BrandedSplitPaneModal with the onboarding form in the right panel.
 */
export function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const leftPanel = (
    <>
      <div className="relative z-10">
        {/* Logo */}
        <div className="mb-6">
          <div className="w-16 h-16 relative">
            <Image src="/logo.png" alt="QuiltCorgi" fill className="object-contain" priority />
          </div>
        </div>

        <h1
          className="font-bold mb-4 leading-tight"
          style={{
            fontSize: TYPOGRAPHY.h2.fontSize,
            lineHeight: TYPOGRAPHY.h2.lineHeight,
            fontFamily: TYPOGRAPHY.h2.fontFamily,
            color: COLORS.text,
          }}
        >
          Welcome to Quilt!
        </h1>
        <p
          className="text-[18px] leading-7"
          style={{
            fontFamily: TYPOGRAPHY.body.fontFamily,
            color: COLORS.textDim,
          }}
        >
          Set up your profile to get started.
        </p>
      </div>

      <div className="relative z-10 mt-16 md:mt-24">
        <p
          className="text-[14px] leading-[20px] border-t pt-6"
          style={{
            fontFamily: TYPOGRAPHY.small.fontFamily,
            color: COLORS.textDim,
            borderColor: withAlpha(COLORS.text, 0.05),
          }}
        >
          You can always change these settings later in your profile.
        </p>
      </div>
    </>
  );

  const rightPanel = (
    <div className="w-full max-w-md">
      <OnboardingForm compact />
    </div>
  );

  return (
    <BrandedSplitPaneModal
      isOpen={isOpen}
      onClose={onClose}
      leftPanel={leftPanel}
      rightPanel={rightPanel}
      containerWidth="max-w-5xl"
    />
  );
}
