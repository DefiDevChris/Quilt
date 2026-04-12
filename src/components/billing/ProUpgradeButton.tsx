'use client';

import { useState } from 'react';
import { ProUpgradeModal } from '@/components/billing/ProUpgradeModal';

interface ProUpgradeButtonProps {
  /** Extra className for the button element */
  className?: string;
  /** Visual variant: nav = compact pill, dashboard = card, studio = compact pill */
  variant?: 'nav' | 'dashboard' | 'studio';
}

/**
 * Shared "Upgrade to Pro" button used across AppShell, DashboardPage, and StudioTopBar.
 * Opens the ProUpgradeModal on click.
 */
export function ProUpgradeButton({ className = '', variant = 'nav' }: ProUpgradeButtonProps) {
  const [showUpgrade, setShowUpgrade] = useState(false);

  if (variant === 'dashboard') {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowUpgrade(true)}
          className={`group flex flex-col justify-between border-2 border-primary bg-surface p-5 hover:bg-primary/10 transition-colors duration-150 ${className}`}
        >
          <div className="flex flex-col gap-2 text-left">
            <span className="text-[14px] leading-[20px] text-default">Studio Pro</span>
            <p className="text-[14px] leading-[24px] opacity-80 decoration-2 underline-offset-4 group-hover:underline text-dim">
              Unlock full library, precise exports, and custom layouts.
            </p>
          </div>
        </button>
        {showUpgrade && <ProUpgradeModal onClose={() => setShowUpgrade(false)} />}
      </>
    );
  }

  // Nav and studio variants: compact pill
  return (
    <>
      <button
        type="button"
        onClick={() => setShowUpgrade(true)}
        className={`flex items-center border border-primary px-4 py-2 text-[14px] leading-[20px] text-primary hover:bg-primary hover:text-surface transition-colors duration-150 rounded-full ${variant === 'nav' ? 'mr-4' : ''
          } ${className}`}
      >
        Go Pro
      </button>
      {showUpgrade && <ProUpgradeModal onClose={() => setShowUpgrade(false)} />}
    </>
  );
}
