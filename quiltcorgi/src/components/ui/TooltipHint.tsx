'use client';

import { useState, useRef, useEffect, type ReactNode } from 'react';
import { TOOLTIP_DELAY_MS } from '@/lib/onboarding-engine';

interface TooltipHintProps {
  readonly name: string;
  readonly shortcut?: string;
  readonly description: string;
  readonly isProFeature?: boolean;
  readonly children: ReactNode;
}

export function TooltipHint({
  name,
  shortcut,
  description,
  isProFeature,
  children,
}: TooltipHintProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  function handleMouseEnter() {
    timeoutRef.current = setTimeout(() => setShowTooltip(true), TOOLTIP_DELAY_MS);
  }

  function handleMouseLeave() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setShowTooltip(false);
  }

  return (
    <div
      className="relative flex items-center justify-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {showTooltip && (
        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-surface-container-highest text-on-surface rounded-sm shadow-elevation-4 px-3 py-2 z-50 pointer-events-none min-w-[180px] max-w-[240px]">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-body-sm font-semibold">{name}</span>
            {shortcut && (
              <span className="font-mono text-body-sm text-secondary bg-surface-container px-1.5 py-0.5 rounded-sm">
                {shortcut}
              </span>
            )}
            {isProFeature && (
              <span className="text-body-sm font-medium text-primary bg-primary-container/40 px-1.5 py-0.5 rounded-sm">
                Pro
              </span>
            )}
          </div>
          <p className="text-body-sm text-secondary leading-snug">{description}</p>
        </div>
      )}
    </div>
  );
}
