import type { WizardStep, WizardNavigationResult } from '@/types/wizard';

export function computeNavigation<TData>(
  steps: readonly WizardStep<TData>[],
  currentStepIndex: number
): WizardNavigationResult {
  const totalSteps = steps.length;
  const clampedIndex = Math.max(0, Math.min(currentStepIndex, totalSteps - 1));

  return {
    canGoNext: clampedIndex < totalSteps - 1,
    canGoBack: clampedIndex > 0,
    isFirstStep: clampedIndex === 0,
    isLastStep: clampedIndex === totalSteps - 1,
    progress: totalSteps > 1 ? clampedIndex / (totalSteps - 1) : 1,
    currentStepIndex: clampedIndex,
  };
}

export function validateStep<TData>(
  step: WizardStep<TData>,
  data: TData
): true | string {
  if (!step.validate) {
    return true;
  }
  return step.validate(data);
}

export function goNext<TData>(
  steps: readonly WizardStep<TData>[],
  currentStepIndex: number,
  data: TData
): { readonly newIndex: number; readonly error: string | null } {
  const step = steps[currentStepIndex];
  if (!step) {
    return { newIndex: currentStepIndex, error: 'Invalid step index' };
  }

  const validation = validateStep(step, data);
  if (validation !== true) {
    return { newIndex: currentStepIndex, error: validation };
  }

  const nextIndex = Math.min(currentStepIndex + 1, steps.length - 1);
  return { newIndex: nextIndex, error: null };
}

export function goBack(
  currentStepIndex: number
): { readonly newIndex: number } {
  return { newIndex: Math.max(0, currentStepIndex - 1) };
}

export function computeProgress(
  currentStepIndex: number,
  totalSteps: number
): number {
  if (totalSteps <= 1) return 1;
  return currentStepIndex / (totalSteps - 1);
}

export function getStepLabel<TData>(
  steps: readonly WizardStep<TData>[],
  currentStepIndex: number
): string {
  const step = steps[currentStepIndex];
  return step ? step.title : '';
}

export function isStepOptional<TData>(
  steps: readonly WizardStep<TData>[],
  stepIndex: number
): boolean {
  const step = steps[stepIndex];
  return step?.optional === true;
}
