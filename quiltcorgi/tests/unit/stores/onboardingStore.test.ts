import { describe, it, expect, beforeEach } from 'vitest';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { TOUR_STEPS, ONBOARDING_STORAGE_KEY } from '@/lib/onboarding-engine';

// Mock localStorage for node test environment
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });

describe('onboardingStore', () => {
  beforeEach(() => {
    useOnboardingStore.setState({
      currentStepIndex: 0,
      isActive: false,
      dontShowAgain: false,
    });
    localStorage.clear();
  });

  it('initializes with default state', () => {
    const state = useOnboardingStore.getState();
    expect(state.currentStepIndex).toBe(0);
    expect(state.isActive).toBe(false);
    expect(state.dontShowAgain).toBe(false);
  });

  describe('startTour', () => {
    it('sets isActive to true and resets step index', () => {
      useOnboardingStore.setState({ currentStepIndex: 5 });
      useOnboardingStore.getState().startTour();

      const state = useOnboardingStore.getState();
      expect(state.isActive).toBe(true);
      expect(state.currentStepIndex).toBe(0);
    });
  });

  describe('nextStep', () => {
    it('increments step index when not at the end', () => {
      useOnboardingStore.setState({ isActive: true, currentStepIndex: 0 });
      useOnboardingStore.getState().nextStep();
      expect(useOnboardingStore.getState().currentStepIndex).toBe(1);
    });

    it('calls completeTour when at last step', () => {
      useOnboardingStore.setState({
        isActive: true,
        currentStepIndex: TOUR_STEPS.length - 1,
      });
      useOnboardingStore.getState().nextStep();

      const state = useOnboardingStore.getState();
      expect(state.isActive).toBe(false);
      expect(state.currentStepIndex).toBe(0);
    });

    it('increments through multiple steps correctly', () => {
      useOnboardingStore.setState({ isActive: true, currentStepIndex: 0 });
      useOnboardingStore.getState().nextStep();
      useOnboardingStore.getState().nextStep();
      useOnboardingStore.getState().nextStep();
      expect(useOnboardingStore.getState().currentStepIndex).toBe(3);
    });
  });

  describe('prevStep', () => {
    it('decrements step index when not at beginning', () => {
      useOnboardingStore.setState({ isActive: true, currentStepIndex: 3 });
      useOnboardingStore.getState().prevStep();
      expect(useOnboardingStore.getState().currentStepIndex).toBe(2);
    });

    it('does not go below 0', () => {
      useOnboardingStore.setState({ isActive: true, currentStepIndex: 0 });
      useOnboardingStore.getState().prevStep();
      expect(useOnboardingStore.getState().currentStepIndex).toBe(0);
    });
  });

  describe('skipTour', () => {
    it('deactivates tour and resets index', () => {
      useOnboardingStore.setState({ isActive: true, currentStepIndex: 4 });
      useOnboardingStore.getState().skipTour();

      const state = useOnboardingStore.getState();
      expect(state.isActive).toBe(false);
      expect(state.currentStepIndex).toBe(0);
    });
  });

  describe('completeTour', () => {
    it('deactivates tour', () => {
      useOnboardingStore.setState({ isActive: true, currentStepIndex: 8 });
      useOnboardingStore.getState().completeTour();

      const state = useOnboardingStore.getState();
      expect(state.isActive).toBe(false);
      expect(state.currentStepIndex).toBe(0);
    });

    it('persists to localStorage when dontShowAgain is true', () => {
      useOnboardingStore.setState({ isActive: true, dontShowAgain: true });
      useOnboardingStore.getState().completeTour();
      expect(localStorage.getItem(ONBOARDING_STORAGE_KEY)).toBe('true');
    });

    it('does not persist when dontShowAgain is false', () => {
      useOnboardingStore.setState({ isActive: true, dontShowAgain: false });
      useOnboardingStore.getState().completeTour();
      expect(localStorage.getItem(ONBOARDING_STORAGE_KEY)).toBeNull();
    });
  });

  describe('setDontShowAgain', () => {
    it('sets the flag to true', () => {
      useOnboardingStore.getState().setDontShowAgain(true);
      expect(useOnboardingStore.getState().dontShowAgain).toBe(true);
    });

    it('sets the flag to false', () => {
      useOnboardingStore.setState({ dontShowAgain: true });
      useOnboardingStore.getState().setDontShowAgain(false);
      expect(useOnboardingStore.getState().dontShowAgain).toBe(false);
    });
  });

  describe('reset', () => {
    it('resets all state to defaults', () => {
      useOnboardingStore.setState({
        currentStepIndex: 5,
        isActive: true,
        dontShowAgain: true,
      });
      useOnboardingStore.getState().reset();

      const state = useOnboardingStore.getState();
      expect(state.currentStepIndex).toBe(0);
      expect(state.isActive).toBe(false);
      expect(state.dontShowAgain).toBe(false);
    });
  });
});
