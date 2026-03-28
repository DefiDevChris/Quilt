import type React from 'react';

export interface WizardStep<TData = unknown> {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly component: React.ComponentType<StepProps<TData>>;
  readonly validate?: (data: TData) => true | string;
  readonly optional?: boolean;
}

export interface StepProps<TData = unknown> {
  readonly data: TData;
  readonly onUpdate: (updates: Partial<TData>) => void;
}

export interface WizardState {
  readonly currentStepIndex: number;
  readonly totalSteps: number;
  readonly direction: 'forward' | 'backward';
  readonly validationError: string | null;
}

export interface WizardConfig {
  readonly title: string;
  readonly subtitle?: string;
  readonly width?: number;
  readonly finishLabel?: string;
  readonly showProgress?: boolean;
  readonly allowSkip?: boolean;
}

export interface WizardNavigationResult {
  readonly canGoNext: boolean;
  readonly canGoBack: boolean;
  readonly isFirstStep: boolean;
  readonly isLastStep: boolean;
  readonly progress: number;
  readonly currentStepIndex: number;
}
