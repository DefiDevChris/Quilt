'use client';

import { useState, useRef, useEffect, type ReactNode } from 'react';
import { TOOLTIP_DELAY_MS } from '@/lib/onboarding-utils';

interface TooltipHintProps {
  readonly name: string;
  readonly shortcut?: string;
  readonly description: string;
  readonly isProFeature?: boolean;
  readonly mascot?: string;
  readonly children: ReactNode;
}

export function TooltipHint({
  name,
  shortcut,
  description,
  isProFeature,
  mascot,
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
        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-surface-container-highest text-on-surface rounded-lg shadow-elevation-4 p-4 z-50 pointer-events-none min-w-[280px] max-w-[320px]">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-body-md font-semibold">{name}</span>
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
          <p className="text-body-md text-secondary leading-relaxed mb-3">{description}</p>
          {mascot && (
            <div className="flex justify-center">
              <img src={mascot} alt="" className="w-16 h-16 object-contain" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
