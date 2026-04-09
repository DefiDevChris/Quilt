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
          className={`group relative overflow-hidden rounded-xl bg-gradient-to-r from-primary to-primary-dark p-[2px] transition-all duration-300 hover:shadow-elevation-3 hover:scale-[1.02] ${className}`}
        >
          <div className="relative flex items-center gap-3 rounded-[10px] bg-white/90 px-6 py-3 backdrop-blur-sm transition-all group-hover:bg-white/80">
            <Sparkles size={20} className="text-primary-dark" />
            <div className="text-left">
              <p className="text-sm font-extrabold text-on-surface leading-none mb-1">
                Upgrade to Pro
              </p>
              <p className="text-xs font-medium text-secondary leading-none">
                Unlock AI & Exports
              </p>
            </div>
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
        className={`flex items-center gap-1.5 rounded-full bg-gradient-to-r from-primary to-primary-dark px-3 py-1 text-xs font-extrabold text-white shadow-elevation-1 hover:shadow-elevation-2 transition-all hover:scale-105 ${variant === 'nav' ? 'mr-2' : ''
          } ${className}`}
      >
        <Sparkles size={14} className="text-white" />
        Upgrade
      </button>
      {showUpgrade && <ProUpgradeModal onClose={() => setShowUpgrade(false)} />}
    </>
  );
}
