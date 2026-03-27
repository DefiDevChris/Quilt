import { describe, it, expect } from 'vitest';
import {
  computeNavigation,
  validateStep,
  goNext,
  goBack,
  computeProgress,
  getStepLabel,
  isStepOptional,
} from '@/lib/wizard-engine';
import type { WizardStep } from '@/types/wizard';

function makeStep(
  id: string,
  overrides?: Partial<WizardStep<{ value: string }>>
): WizardStep<{ value: string }> {
  return {
    id,
    title: `Step ${id}`,
    component: () => null,
    ...overrides,
  };
}

const threeSteps: readonly WizardStep<{ value: string }>[] = [
  makeStep('1'),
  makeStep('2'),
  makeStep('3'),
];

describe('wizard-engine', () => {
  describe('computeNavigation', () => {
    it('returns correct state for first step', () => {
      const nav = computeNavigation(threeSteps, 0);
      expect(nav.isFirstStep).toBe(true);
      expect(nav.isLastStep).toBe(false);
      expect(nav.canGoBack).toBe(false);
      expect(nav.canGoNext).toBe(true);
      expect(nav.progress).toBe(0);
      expect(nav.currentStepIndex).toBe(0);
    });

    it('returns correct state for middle step', () => {
      const nav = computeNavigation(threeSteps, 1);
      expect(nav.isFirstStep).toBe(false);
      expect(nav.isLastStep).toBe(false);
      expect(nav.canGoBack).toBe(true);
      expect(nav.canGoNext).toBe(true);
      expect(nav.progress).toBeCloseTo(0.5);
    });

    it('returns correct state for last step', () => {
      const nav = computeNavigation(threeSteps, 2);
      expect(nav.isFirstStep).toBe(false);
      expect(nav.isLastStep).toBe(true);
      expect(nav.canGoBack).toBe(true);
      expect(nav.canGoNext).toBe(false);
      expect(nav.progress).toBe(1);
    });

    it('clamps negative index to 0', () => {
      const nav = computeNavigation(threeSteps, -5);
      expect(nav.currentStepIndex).toBe(0);
      expect(nav.isFirstStep).toBe(true);
    });

    it('clamps index beyond length to last step', () => {
      const nav = computeNavigation(threeSteps, 100);
      expect(nav.currentStepIndex).toBe(2);
      expect(nav.isLastStep).toBe(true);
    });

    it('handles single step', () => {
      const nav = computeNavigation([makeStep('only')], 0);
      expect(nav.isFirstStep).toBe(true);
      expect(nav.isLastStep).toBe(true);
      expect(nav.canGoBack).toBe(false);
      expect(nav.canGoNext).toBe(false);
      expect(nav.progress).toBe(1);
    });
  });

  describe('validateStep', () => {
    it('returns true when no validation function', () => {
      const step = makeStep('1');
      expect(validateStep(step, { value: '' })).toBe(true);
    });

    it('returns true when validation passes', () => {
      const step = makeStep('1', {
        validate: (data) => (data.value.length > 0 ? true : 'Required'),
      });
      expect(validateStep(step, { value: 'hello' })).toBe(true);
    });

    it('returns error message when validation fails', () => {
      const step = makeStep('1', {
        validate: (data) => (data.value.length > 0 ? true : 'Required'),
      });
      expect(validateStep(step, { value: '' })).toBe('Required');
    });
  });

  describe('goNext', () => {
    it('advances to next step when validation passes', () => {
      const result = goNext(threeSteps, 0, { value: 'ok' });
      expect(result.newIndex).toBe(1);
      expect(result.error).toBeNull();
    });

    it('does not advance past last step', () => {
      const result = goNext(threeSteps, 2, { value: 'ok' });
      expect(result.newIndex).toBe(2);
      expect(result.error).toBeNull();
    });

    it('blocks advancement when validation fails', () => {
      const steps: readonly WizardStep<{ value: string }>[] = [
        makeStep('1', {
          validate: (data) => (data.value ? true : 'Required'),
        }),
        makeStep('2'),
      ];
      const result = goNext(steps, 0, { value: '' });
      expect(result.newIndex).toBe(0);
      expect(result.error).toBe('Required');
    });

    it('returns error for invalid step index', () => {
      const result = goNext(threeSteps, 99, { value: 'ok' });
      expect(result.error).toBe('Invalid step index');
    });
  });

  describe('goBack', () => {
    it('decrements index', () => {
      expect(goBack(2).newIndex).toBe(1);
    });

    it('does not go below 0', () => {
      expect(goBack(0).newIndex).toBe(0);
    });
  });

  describe('computeProgress', () => {
    it('returns 0 for first of many steps', () => {
      expect(computeProgress(0, 5)).toBe(0);
    });

    it('returns 1 for last step', () => {
      expect(computeProgress(4, 5)).toBe(1);
    });

    it('returns 1 for single step', () => {
      expect(computeProgress(0, 1)).toBe(1);
    });

    it('returns 0.5 for middle of 3 steps', () => {
      expect(computeProgress(1, 3)).toBeCloseTo(0.5);
    });
  });

  describe('getStepLabel', () => {
    it('returns step title', () => {
      expect(getStepLabel(threeSteps, 0)).toBe('Step 1');
    });

    it('returns empty string for invalid index', () => {
      expect(getStepLabel(threeSteps, 99)).toBe('');
    });
  });

  describe('isStepOptional', () => {
    it('returns false by default', () => {
      expect(isStepOptional(threeSteps, 0)).toBe(false);
    });

    it('returns true when step is marked optional', () => {
      const steps = [makeStep('1', { optional: true })];
      expect(isStepOptional(steps, 0)).toBe(true);
    });
  });
});
