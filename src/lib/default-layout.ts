/**
 * Default layout configuration for empty projects.
 * Applied automatically when a user opens a new/empty project.
 */
import type { LayoutType, SashingConfig, BorderConfig } from '@/lib/layout-utils';

export interface DefaultLayoutConfig {
  layoutType: LayoutType;
  rows: number;
  cols: number;
  blockSize: number;
  sashing: SashingConfig;
  borders: BorderConfig[];
  hasCornerstones: boolean;
  bindingWidth: number;
  canvasWidth: number;
  canvasHeight: number;
}

/**
 * Default 4x4 grid layout configuration.
 * Used when a user opens the studio for a new or empty project.
 */
export const DEFAULT_QUILT_LAYOUT: DefaultLayoutConfig = {
  layoutType: 'grid',
  rows: 4,
  cols: 4,
  blockSize: 12,
  sashing: {
    width: 0,
    color: '#d4d4d4',
    fabricId: null,
  },
  borders: [],
  hasCornerstones: false,
  bindingWidth: 0.25,
  // Throw-size canvas: 72x72 inches (4x4 grid of 12" blocks)
  canvasWidth: 72,
  canvasHeight: 72,
};

/**
 * Get the default layout configuration.
 * Extracted for easy unit testing.
 */
export function getDefaultLayoutConfig(): DefaultLayoutConfig {
  return { ...DEFAULT_QUILT_LAYOUT };
}
