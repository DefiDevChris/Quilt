import type { WizardStep, WizardNavigationResult } from '@/types/wizard';

export function computeNavigation<TData>(
  steps: readonly WizardStep<TData>[],
  currentStepIndex: number
): WizardNavigationResult {
  const clamped = Math.max(0, Math.min(currentStepIndex, steps.length - 1));
  return {
    canGoNext: clamped < steps.length - 1,
    canGoBack: clamped > 0,
    isFirstStep: clamped === 0,
    isLastStep: clamped === steps.length - 1,
    progress: steps.length > 1 ? clamped / (steps.length - 1) : 1,
    currentStepIndex: clamped,
  };
}

export function computeProgress(currentIndex: number, totalSteps: number): number {
  if (totalSteps <= 1) return 1;
  return currentIndex / (totalSteps - 1);
}

export function getStepLabel<TData>(steps: readonly WizardStep<TData>[], index: number): string {
  return steps[index]?.title ?? '';
}

export function isStepOptional<TData>(steps: readonly WizardStep<TData>[], index: number): boolean {
  return steps[index]?.optional === true;
}

export function validateStep<TData>(step: WizardStep<TData>, data: TData): true | string {
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

export function goBack(currentStepIndex: number): { readonly newIndex: number } {
  return { newIndex: Math.max(0, currentStepIndex - 1) };
}
