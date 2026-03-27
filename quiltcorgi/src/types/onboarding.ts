export interface TourStep {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly targetSelector: string; // CSS selector for spotlight target
  readonly placement: 'top' | 'bottom' | 'left' | 'right';
  readonly showPointer?: boolean;
}

export interface TourConfig {
  readonly steps: readonly TourStep[];
  readonly storageKey: string;
}

export interface TooltipHintData {
  readonly name: string;
  readonly shortcut?: string;
  readonly description: string;
  readonly isProFeature?: boolean;
}
