'use client';

import { useEffect, useCallback, useState, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useOnboardingStore } from '@/stores/onboardingStore';
import {
  TOUR_STEPS,
  ONBOARDING_STORAGE_KEY,
  getStorageFlag,
  computeTooltipPosition,
} from '@/lib/onboarding-utils';
import { OnboardingSpotlight } from './OnboardingSpotlight';
import { OnboardingTooltip } from './OnboardingTooltip';

const TOOLTIP_SIZE = { w: 320, h: 240 };
const AUTO_START_DELAY_MS = 1000;

export function OnboardingTour() {
  const {
    isActive,
    currentStepIndex,
    dontShowAgain,
    startTour,
    nextStep,
    prevStep,
    skipTour,
    completeTour,
    setDontShowAgain,
  } = useOnboardingStore();

  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);

  // Find and track the target element
  const updateTargetRect = useCallback(() => {
    if (!isActive) return;

    const step = TOUR_STEPS[currentStepIndex];
    if (!step.targetSelector) {
      setTargetRect(null);
      return;
    }

    const el = document.querySelector(step.targetSelector);
    if (el) {
      setTargetRect(el.getBoundingClientRect());
    } else {
      // Target not found — skip to next step
      setTargetRect(null);
    }
  }, [isActive, currentStepIndex]);

  // Set up ResizeObserver and window resize listener
  useEffect(() => {
    if (!isActive) return;

    updateTargetRect();

    const handleResize = () => updateTargetRect();
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);

    // ResizeObserver for the target element
    const step = TOUR_STEPS[currentStepIndex];
    if (step.targetSelector) {
      const el = document.querySelector(step.targetSelector);
      if (el) {
        const observer = new ResizeObserver(() => updateTargetRect());
        observer.observe(el);
        observerRef.current = observer;
      }
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [isActive, currentStepIndex, updateTargetRect]);

  // Auto-start tour if not previously completed
  useEffect(() => {
    const alreadyCompleted = getStorageFlag(ONBOARDING_STORAGE_KEY);
    if (alreadyCompleted) return;

    const timer = setTimeout(() => {
      const store = useOnboardingStore.getState();
      if (!store.isActive) {
        startTour();
      }
    }, AUTO_START_DELAY_MS);

    return () => clearTimeout(timer);
  // Auto-start timer only - no dependencies needed
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle Escape key to skip tour
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        skipTour();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isActive, skipTour]);

  // Compute tooltip position
  const step = TOUR_STEPS[currentStepIndex];
  const tooltipPosition = targetRect
    ? computeTooltipPosition(targetRect, step.placement, TOOLTIP_SIZE)
    : {
        // Center on screen for welcome/done steps
        x: window.innerWidth / 2 - TOOLTIP_SIZE.w / 2,
        y: window.innerHeight / 2 - TOOLTIP_SIZE.h / 2,
      };

  return (
    <AnimatePresence>
      {isActive && (
        <>
          {/* Click-blocking overlay */}
          <div
            className="fixed inset-0 z-[59]"
            onClick={skipTour}
            aria-hidden="true"
          />

          <OnboardingSpotlight targetRect={targetRect} />

          <OnboardingTooltip
            stepIndex={currentStepIndex}
            position={tooltipPosition}
            onNext={currentStepIndex === TOUR_STEPS.length - 1 ? completeTour : nextStep}
            onPrev={prevStep}
            onSkip={skipTour}
            dontShowAgain={dontShowAgain}
            onDontShowAgainChange={setDontShowAgain}
          />
        </>
      )}
    </AnimatePresence>
  );
}
