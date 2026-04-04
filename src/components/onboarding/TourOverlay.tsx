'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { TOUR_STEPS, computeTooltipPosition, type TourStep } from '@/lib/onboarding-utils';

interface TourOverlayProps {
  readonly onComplete: () => void;
  readonly onDismiss: () => void;
}

const TOOLTIP_WIDTH = 320;
const TOOLTIP_HEIGHT = 200;

function getTargetRect(step: TourStep): DOMRect | null {
  if (!step.targetSelector) return null;
  const el = document.querySelector(step.targetSelector);
  return el?.getBoundingClientRect() ?? null;
}

export function TourOverlay({ onComplete, onDismiss }: TourOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const step = TOUR_STEPS[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === TOUR_STEPS.length - 1;
  const isCentered = !step.targetSelector;

  // Measure target element position
  const measureTarget = useCallback(() => {
    const rect = getTargetRect(step);
    setTargetRect(rect);
  }, [step]);

  useEffect(() => {
    measureTarget();

    // Reposition on resize/scroll
    window.addEventListener('resize', measureTarget);
    window.addEventListener('scroll', measureTarget, true);
    return () => {
      window.removeEventListener('resize', measureTarget);
      window.removeEventListener('scroll', measureTarget, true);
    };
  }, [measureTarget]);

  const handleNext = useCallback(() => {
    if (isLast) {
      onComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  }, [isLast, onComplete]);

  const handlePrev = useCallback(() => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  }, []);

  // Compute tooltip position
  const tooltipPos = isCentered
    ? {
        x: (typeof window !== 'undefined' ? window.innerWidth : 1280) / 2 - TOOLTIP_WIDTH / 2,
        y: (typeof window !== 'undefined' ? window.innerHeight : 800) / 2 - TOOLTIP_HEIGHT / 2,
      }
    : targetRect
      ? computeTooltipPosition(targetRect, step.placement, {
          w: TOOLTIP_WIDTH,
          h: TOOLTIP_HEIGHT,
        })
      : { x: 100, y: 100 };

  // Spotlight cutout dimensions
  const spotlightPadding = 8;
  const spotlight = targetRect
    ? {
        x: targetRect.left - spotlightPadding,
        y: targetRect.top - spotlightPadding,
        width: targetRect.width + spotlightPadding * 2,
        height: targetRect.height + spotlightPadding * 2,
      }
    : null;

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="Studio tour">
      {/* Dark overlay with spotlight cutout */}
      <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
        <defs>
          <mask id="tour-spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            {spotlight && (
              <rect
                x={spotlight.x}
                y={spotlight.y}
                width={spotlight.width}
                height={spotlight.height}
                rx={8}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(56, 56, 49, 0.6)"
          mask="url(#tour-spotlight-mask)"
        />
      </svg>

      {/* Click-blocker (allows clicks on the spotlight area) */}
      <div
        className="absolute inset-0"
        onClick={(e) => {
          // Don't block clicks on the tooltip
          if (tooltipRef.current?.contains(e.target as Node)) return;
          e.stopPropagation();
        }}
      />

      {/* Tooltip */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          ref={tooltipRef}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="absolute z-[101] bg-surface rounded-xl shadow-elevation-4 p-5"
          style={{
            left: tooltipPos.x,
            top: tooltipPos.y,
            width: TOOLTIP_WIDTH,
          }}
        >
          <div className="flex gap-3">
            {/* Mascot */}
            <div className="flex-shrink-0 w-14 h-14 relative">
              <Image
                src={step.mascot}
                alt=""
                width={56}
                height={56}
                className="rounded-full object-cover"
              />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-on-surface mb-1">{step.title}</h3>
              <p className="text-xs text-secondary leading-relaxed">{step.description}</p>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-4">
            <button
              type="button"
              onClick={onDismiss}
              className="text-xs text-secondary hover:text-on-surface transition-colors"
            >
              Skip Tour
            </button>

            <div className="flex items-center gap-2">
              {/* Step indicators */}
              <div className="flex gap-1 mr-2">
                {TOUR_STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${
                      i === currentStep ? 'bg-primary' : 'bg-outline-variant'
                    }`}
                  />
                ))}
              </div>

              {!isFirst && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="px-3 py-1.5 text-xs font-medium text-secondary hover:text-on-surface rounded-md hover:bg-surface-container transition-colors"
                >
                  Back
                </button>
              )}

              <button
                type="button"
                onClick={handleNext}
                className="px-4 py-1.5 text-xs font-semibold rounded-md transition-opacity hover:opacity-90"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: 'var(--color-primary-on)',
                }}
              >
                {isLast ? 'Get Started' : 'Next'}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
