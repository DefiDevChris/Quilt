'use client';

import { motion } from 'framer-motion';
import { TOUR_STEPS } from '@/lib/onboarding-utils';

interface OnboardingTooltipProps {
  readonly stepIndex: number;
  readonly position: { readonly x: number; readonly y: number };
  readonly onNext: () => void;
  readonly onPrev: () => void;
  readonly onSkip: () => void;
  readonly dontShowAgain: boolean;
  readonly onDontShowAgainChange: (value: boolean) => void;
}

export function OnboardingTooltip({
  stepIndex,
  position,
  onNext,
  onPrev,
  onSkip,
  dontShowAgain,
  onDontShowAgainChange,
}: OnboardingTooltipProps) {
  const totalSteps = TOUR_STEPS.length;
  const step = TOUR_STEPS[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === totalSteps - 1;

  return (
    <motion.div
      key={step.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ type: 'tween', duration: 0.2 }}
      className="fixed z-[61] w-[320px] bg-surface rounded-lg shadow-elevation-3 p-5"
      style={{ left: position.x, top: position.y }}
      role="dialog"
      aria-label={step.title}
    >
      {/* Step counter */}
      <div className="text-body-sm text-secondary mb-1">
        {stepIndex + 1} of {totalSteps}
      </div>

      {/* Title */}
      <h2 className="text-title-md font-semibold text-on-surface mb-2">{step.title}</h2>

      {/* Description */}
      <p className="text-body-md text-secondary mb-5 leading-relaxed">{step.description}</p>

      {/* Don't show again checkbox (last step only) */}
      {isLast && (
        <label className="flex items-center gap-2 mb-4 cursor-pointer text-body-sm text-secondary">
          <input
            type="checkbox"
            checked={dontShowAgain}
            onChange={(e) => onDontShowAgainChange(e.target.checked)}
            className="w-4 h-4 rounded border-outline-variant accent-primary"
          />
          Don&apos;t show this again
        </label>
      )}

      {/* Buttons */}
      <div className="flex items-center justify-between">
        <div>
          {!isLast && (
            <button
              type="button"
              onClick={onSkip}
              className="text-body-sm text-secondary hover:text-on-surface transition-colors px-2 py-1"
            >
              Skip Tour
            </button>
          )}
          {isLast && !isFirst && (
            <button
              type="button"
              onClick={onPrev}
              className="text-body-sm text-secondary hover:text-on-surface transition-colors px-2 py-1"
            >
              Back
            </button>
          )}
        </div>

        <div className="flex gap-2">
          {!isFirst && !isLast && (
            <button
              type="button"
              onClick={onPrev}
              className="text-body-sm text-secondary hover:text-on-surface transition-colors px-3 py-1.5 rounded-md"
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={onNext}
            className="text-body-sm font-medium text-on-primary bg-primary hover:bg-primary/90 transition-colors px-4 py-1.5 rounded-md"
          >
            {isLast ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
