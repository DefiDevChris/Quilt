'use client';

import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { WizardStep, WizardConfig, WizardState } from '@/types/wizard';
import {
  computeNavigation,
  goNext,
  goBack,
  validateStep,
} from '@/lib/wizard-engine';

interface WizardDialogProps<TData> {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onFinish: (data: TData) => void;
  readonly steps: readonly WizardStep<TData>[];
  readonly config: WizardConfig;
  readonly initialData: TData;
}

export function WizardDialog<TData>({
  isOpen,
  onClose,
  onFinish,
  steps,
  config,
  initialData,
}: WizardDialogProps<TData>) {
  const [data, setData] = useState<TData>(initialData);
  const [state, setState] = useState<WizardState>({
    currentStepIndex: 0,
    totalSteps: steps.length,
    direction: 'forward',
    validationError: null,
  });

  const nav = computeNavigation(steps, state.currentStepIndex);
  const currentStep = steps[state.currentStepIndex];

  const handleUpdate = useCallback(
    (updates: Partial<TData>) => {
      setData((prev) => ({ ...prev, ...updates }));
      setState((prev) => ({ ...prev, validationError: null }));
    },
    []
  );

  function handleNext() {
    const result = goNext(steps, state.currentStepIndex, data);
    if (result.error) {
      setState((prev) => ({ ...prev, validationError: result.error }));
      return;
    }
    setState((prev) => ({
      ...prev,
      currentStepIndex: result.newIndex,
      direction: 'forward',
      validationError: null,
    }));
  }

  function handleBack() {
    const result = goBack(state.currentStepIndex);
    setState((prev) => ({
      ...prev,
      currentStepIndex: result.newIndex,
      direction: 'backward',
      validationError: null,
    }));
  }

  function handleFinish() {
    if (!currentStep) return;
    const validation = validateStep(currentStep, data);
    if (validation !== true) {
      setState((prev) => ({ ...prev, validationError: validation }));
      return;
    }
    onFinish(data);
    handleReset();
  }

  function handleReset() {
    setData(initialData);
    setState({
      currentStepIndex: 0,
      totalSteps: steps.length,
      direction: 'forward',
      validationError: null,
    });
  }

  function handleClose() {
    handleReset();
    onClose();
  }

  if (!isOpen || !currentStep) return null;

  const width = config.width ?? 560;
  const StepComponent = currentStep.component;

  const slideVariants = {
    enter: (direction: 'forward' | 'backward') => ({
      x: direction === 'forward' ? 300 : -300,
      opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (direction: 'forward' | 'backward') => ({
      x: direction === 'forward' ? -300 : 300,
      opacity: 0,
    }),
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label={config.title}
    >
      <div
        className="rounded-xl bg-surface shadow-elevation-4 flex flex-col max-h-[90vh]"
        style={{ width }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <div>
            <h2 className="text-headline-sm font-semibold text-on-surface">
              {config.title}
            </h2>
            {config.subtitle && (
              <p className="text-body-sm text-secondary mt-0.5">
                {config.subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-secondary hover:text-on-surface hover:bg-surface-container transition-colors"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M4 4L12 12M12 4L4 12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Progress dots */}
        {config.showProgress !== false && (
          <div className="flex items-center justify-center gap-2 px-6 pb-3">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`h-2 rounded-full transition-all duration-200 ${
                  index === state.currentStepIndex
                    ? 'w-6 bg-primary'
                    : index < state.currentStepIndex
                      ? 'w-2 bg-primary/50'
                      : 'w-2 bg-outline-variant/30'
                }`}
              />
            ))}
            <span className="ml-2 text-label-sm text-secondary">
              {state.currentStepIndex + 1}/{steps.length}
            </span>
          </div>
        )}

        {/* Step title */}
        <div className="px-6 pb-2">
          <h3 className="text-title-md font-medium text-on-surface">
            {currentStep.title}
          </h3>
          {currentStep.description && (
            <p className="text-body-sm text-secondary mt-0.5">
              {currentStep.description}
            </p>
          )}
        </div>

        {/* Validation error */}
        {state.validationError && (
          <div className="mx-6 mb-2 bg-error/10 px-3 py-2 text-sm text-error rounded-sm">
            {state.validationError}
          </div>
        )}

        {/* Step content with animation */}
        <div className="flex-1 overflow-y-auto px-6 pb-4 min-h-[200px]">
          <AnimatePresence mode="wait" custom={state.direction}>
            <motion.div
              key={currentStep.id}
              custom={state.direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
            >
              <StepComponent data={data} onUpdate={handleUpdate} />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer buttons */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-outline-variant/10">
          <div>
            {nav.canGoBack && (
              <button
                type="button"
                onClick={handleBack}
                className="px-4 py-2 text-sm font-medium text-secondary hover:text-on-surface transition-colors rounded-md hover:bg-surface-container"
              >
                Back
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {config.allowSkip && currentStep.optional && nav.canGoNext && (
              <button
                type="button"
                onClick={() =>
                  setState((prev) => ({
                    ...prev,
                    currentStepIndex: prev.currentStepIndex + 1,
                    direction: 'forward',
                    validationError: null,
                  }))
                }
                className="px-4 py-2 text-sm font-medium text-secondary hover:text-on-surface transition-colors rounded-md"
              >
                Skip
              </button>
            )}
            {nav.isLastStep ? (
              <button
                type="button"
                onClick={handleFinish}
                className="px-5 py-2 text-sm font-medium bg-primary text-primary-on rounded-md hover:bg-primary-dark transition-colors"
              >
                {config.finishLabel ?? 'Finish'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2 text-sm font-medium bg-primary text-primary-on rounded-md hover:bg-primary-dark transition-colors"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
