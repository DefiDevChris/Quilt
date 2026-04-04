'use client';

import { useState, useEffect, useCallback } from 'react';
import { ONBOARDING_STORAGE_KEY } from '@/lib/constants';
import { getStorageFlag, setStorageFlag } from '@/lib/onboarding-utils';

export function useOnboardingTour() {
  const [shouldShowTour, setShouldShowTour] = useState(false);
  const [tourActive, setTourActive] = useState(false);

  useEffect(() => {
    // Delay check so the Studio has time to mount its elements
    const timer = setTimeout(() => {
      const completed = getStorageFlag(ONBOARDING_STORAGE_KEY);
      if (!completed) {
        setShouldShowTour(true);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const startTour = useCallback(() => {
    setTourActive(true);
  }, []);

  const dismissTour = useCallback(() => {
    setTourActive(false);
    setShouldShowTour(false);
    setStorageFlag(ONBOARDING_STORAGE_KEY, true);
  }, []);

  const completeTour = useCallback(() => {
    setTourActive(false);
    setShouldShowTour(false);
    setStorageFlag(ONBOARDING_STORAGE_KEY, true);
  }, []);

  return {
    shouldShowTour,
    tourActive,
    startTour,
    dismissTour,
    completeTour,
  };
}
