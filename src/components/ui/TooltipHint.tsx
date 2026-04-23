'use client';

import { useState, useRef, useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { TOOLTIP_DELAY_MS } from '@/lib/constants';

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
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  function handleMouseEnter() {
    timeoutRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setTooltipPos({
          top: rect.top + rect.height / 2,
          left: rect.right + 8,
        });
      }
      setShowTooltip(true);
    }, TOOLTIP_DELAY_MS);
  }

  function handleMouseLeave() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setShowTooltip(false);
    setTooltipPos(null);
  }

  return (
    <div
      ref={triggerRef}
      className="relative flex items-center justify-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {showTooltip && tooltipPos
        ? createPortal(
            <div
              className="fixed bg-[var(--color-border)] text-[var(--color-text)] rounded-lg shadow-[0_1px_2px_rgba(54,49,45,0.08)] p-4 z-[9999] pointer-events-none min-w-[280px] max-w-[320px]"
              style={{
                top: `${tooltipPos.top}px`,
                left: `${tooltipPos.left}px`,
                transform: 'translateY(-50%)',
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-body-md font-semibold">{name}</span>
                {shortcut && (
                  <span className="font-mono text-sm text-[var(--color-text-dim)] bg-[var(--color-bg)] px-1.5 py-0.5 rounded">
                    {shortcut}
                  </span>
                )}
              </div>
              <p className="text-body-md text-[var(--color-text-dim)] leading-relaxed">
                {description}
              </p>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
