'use client';

import { create } from 'zustand';
import { TOUR_STEPS, ONBOARDING_STORAGE_KEY, setStorageFlag } from '@/lib/onboarding-utils';

interface OnboardingState {
  currentStepIndex: number;
  isActive: boolean;
  dontShowAgain: boolean;
  // Actions
  startTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  completeTour: () => void;
  setDontShowAgain: (value: boolean) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  currentStepIndex: 0,
  isActive: false,
  dontShowAgain: false,

  startTour: () => {
    set({ isActive: true, currentStepIndex: 0 });
  },

  nextStep: () => {
    const { currentStepIndex } = get();
    const maxIndex = TOUR_STEPS.length - 1;
    if (currentStepIndex < maxIndex) {
      set({ currentStepIndex: currentStepIndex + 1 });
    } else {
      get().completeTour();
    }
  },

  prevStep: () => {
    const { currentStepIndex } = get();
    if (currentStepIndex > 0) {
      set({ currentStepIndex: currentStepIndex - 1 });
    }
  },

  skipTour: () => {
    setStorageFlag(ONBOARDING_STORAGE_KEY, true);
    set({ isActive: false, currentStepIndex: 0 });
  },

  completeTour: () => {
    const { dontShowAgain } = get();
    if (dontShowAgain) {
      setStorageFlag(ONBOARDING_STORAGE_KEY, true);
    }
    set({ isActive: false, currentStepIndex: 0 });
  },

  setDontShowAgain: (value: boolean) => {
    set({ dontShowAgain: value });
  },

  reset: () => {
    set({
      currentStepIndex: 0,
      isActive: false,
      dontShowAgain: false,
    });
  },
}));
