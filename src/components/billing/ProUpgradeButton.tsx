'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { ProUpgradeModal } from '@/components/billing/ProUpgradeModal';

interface ProUpgradeButtonProps {
  /** Extra className for the button element */
  className?: string;
  /** Visual variant: nav = compact pill, dashboard = gradient-border card, studio = compact pill */
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
          className={`group flex flex-col justify-between border-2 border-on-surface bg-surface p-5 transition-all hover:bg-on-surface hover:text-surface ${className}`}
        >
          <div className="flex flex-col gap-2 text-left">
            <span className="text-[11px] font-black uppercase tracking-[0.2em]">Studio Pro</span>
            <p className="text-xs font-bold leading-relaxed opacity-80 decoration-2 underline-offset-4 group-hover:underline">
              Unlock full library, precise exports, and custom layouts.
            </p>
          </div>
        </button>
        {showUpgrade && <ProUpgradeModal onClose={() => setShowUpgrade(false)} />}
      </>
    );
  }

  // Nav and studio variants: text or stark borders
  return (
    <>
      <button
        type="button"
        onClick={() => setShowUpgrade(true)}
        className={`flex items-center border border-on-surface px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-on-surface transition-colors hover:bg-on-surface hover:text-surface ${variant === 'nav' ? 'mr-4' : ''
          } ${className}`}
      >
        Elevate to Pro
      </button>
      {showUpgrade && <ProUpgradeModal onClose={() => setShowUpgrade(false)} />}
    </>
  );
}
