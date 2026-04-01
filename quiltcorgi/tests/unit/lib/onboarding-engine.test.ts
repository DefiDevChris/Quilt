import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  TOUR_STEPS,
  ONBOARDING_STORAGE_KEY,
  TOOLTIP_DELAY_MS,
  computeTooltipPosition,
  getStorageFlag,
  setStorageFlag,
} from '@/lib/onboarding-utils';

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
Object.defineProperty(globalThis, 'window', {
  value: { ...globalThis, innerWidth: 1280, innerHeight: 800 },
  writable: true,
  configurable: true,
});

describe('onboarding-utils', () => {
  describe('TOUR_STEPS', () => {
    it('has 9 steps', () => {
      expect(TOUR_STEPS).toHaveLength(9);
    });

    it('first step is Welcome with empty targetSelector', () => {
      expect(TOUR_STEPS[0].id).toBe('welcome');
      expect(TOUR_STEPS[0].targetSelector).toBe('');
    });

    it('last step is ready with empty targetSelector', () => {
      const last = TOUR_STEPS[TOUR_STEPS.length - 1];
      expect(last.id).toBe('ready');
      expect(last.targetSelector).toBe('');
    });

    it('middle steps have data-tour selectors', () => {
      const middleSteps = TOUR_STEPS.slice(1, -1);
      for (const step of middleSteps) {
        expect(step.targetSelector).toMatch(/^\[data-tour="[a-z-]+"\]$/);
      }
    });

    it('all steps have required fields', () => {
      for (const step of TOUR_STEPS) {
        expect(step.id).toBeTruthy();
        expect(step.title).toBeTruthy();
        expect(step.description).toBeTruthy();
        expect(typeof step.targetSelector).toBe('string');
        expect(['top', 'bottom', 'left', 'right']).toContain(step.placement);
      }
    });

    it('all step ids are unique', () => {
      const ids = TOUR_STEPS.map((s) => s.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe('constants', () => {
    it('exports correct storage key', () => {
      expect(ONBOARDING_STORAGE_KEY).toBe('quiltcorgi-onboarding-completed');
    });

    it('exports correct tooltip delay', () => {
      expect(TOOLTIP_DELAY_MS).toBe(400);
    });
  });

  describe('computeTooltipPosition', () => {
    const targetRect = {
      left: 100,
      top: 200,
      right: 200,
      bottom: 250,
      width: 100,
      height: 50,
      x: 100,
      y: 200,
      toJSON: () => ({}),
    } as DOMRect;

    const tooltipSize = { w: 300, h: 120 };

    it('positions above for top placement', () => {
      const pos = computeTooltipPosition(targetRect, 'top', tooltipSize);
      // x would be 0 (overflows left), so flip logic moves it to right
      expect(pos.y).toBe(targetRect.top - tooltipSize.h - 12);
      expect(pos.x).toBe(targetRect.right + 12);
    });

    it('positions below for bottom placement', () => {
      const pos = computeTooltipPosition(targetRect, 'bottom', tooltipSize);
      // x would be 0 (overflows left), so flip logic moves it to right
      expect(pos.y).toBe(targetRect.bottom + 12);
      expect(pos.x).toBe(targetRect.right + 12);
    });

    it('positions to the left for left placement', () => {
      const pos = computeTooltipPosition(targetRect, 'left', tooltipSize);
      // x would be -212 (overflows left), so flip logic moves it to right
      expect(pos.x).toBe(targetRect.right + 12);
      expect(pos.y).toBe(targetRect.top + targetRect.height / 2 - tooltipSize.h / 2);
    });

    it('positions to the right for right placement', () => {
      const pos = computeTooltipPosition(targetRect, 'right', tooltipSize);
      expect(pos.x).toBe(targetRect.right + 12);
      expect(pos.y).toBe(targetRect.top + targetRect.height / 2 - tooltipSize.h / 2);
    });

    it('defaults to bottom placement for unknown value', () => {
      const pos = computeTooltipPosition(targetRect, 'unknown', tooltipSize);
      // x would be 0, but flip only applies to left/top/bottom, so clamped to padding
      expect(pos.y).toBe(targetRect.bottom + 12);
      expect(pos.x).toBe(16);
    });
  });

  describe('getStorageFlag', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('returns false when key does not exist', () => {
      expect(getStorageFlag('nonexistent')).toBe(false);
    });

    it('returns true when key is set to "true"', () => {
      localStorage.setItem('test-key', 'true');
      expect(getStorageFlag('test-key')).toBe(true);
    });

    it('returns false when key is set to "false"', () => {
      localStorage.setItem('test-key', 'false');
      expect(getStorageFlag('test-key')).toBe(false);
    });

    it('returns false when localStorage throws', () => {
      const original = localStorageMock.getItem;
      localStorageMock.getItem = () => {
        throw new Error('SecurityError');
      };
      expect(getStorageFlag('test-key')).toBe(false);
      localStorageMock.getItem = original;
    });

    it('returns false when localStorage is undefined', () => {
      const original = globalThis.localStorage;
      Object.defineProperty(globalThis, 'localStorage', { value: undefined, writable: true });
      expect(getStorageFlag('test-key')).toBe(false);
      Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });
    });
  });

  describe('setStorageFlag', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('sets value to "true"', () => {
      setStorageFlag('test-key', true);
      expect(localStorage.getItem('test-key')).toBe('true');
    });

    it('sets value to "false"', () => {
      setStorageFlag('test-key', false);
      expect(localStorage.getItem('test-key')).toBe('false');
    });

    it('does not throw when localStorage is unavailable', () => {
      const original = localStorageMock.setItem;
      localStorageMock.setItem = () => {
        throw new Error('QuotaExceededError');
      };
      expect(() => setStorageFlag('test-key', true)).not.toThrow();
      localStorageMock.setItem = original;
    });

    it('does not throw when localStorage is undefined', () => {
      const original = globalThis.localStorage;
      Object.defineProperty(globalThis, 'localStorage', { value: undefined, writable: true });
      expect(() => setStorageFlag('test-key', true)).not.toThrow();
      Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });
    });
  });
});
