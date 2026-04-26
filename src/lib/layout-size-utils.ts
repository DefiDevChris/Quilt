/**
 * Layout size computation — shared utility.
 *
 * Computes finished quilt dimensions from layout configuration.
 * Used by the SelectionShell config panels and the StudioDropZone
 * drag-drop handler to ensure consistent sizing across all code paths.
 */

import type { BorderConfig, SashingConfig } from '@/lib/layout-utils';

export interface LayoutSizeOptions {
  type: string;
  rows: number;
  cols: number;
  blockSize: number;
  sashingWidth: number;
  borders: BorderConfig[];
  bindingWidth: number;
  /** Only used by sashing layouts with cornerstones */
  hasCornerstones?: boolean;
}

export interface LayoutSizeResult {
  width: number;
  height: number;
  perimeter: number;
  bindingYardage: number;
}

/**
 * Compute the total quilt size (in inches) from a layout config.
 * Returns width, height, perimeter, and binding yardage (rounded up to nearest 0.5 yd).
 */
export function computeLayoutSize(opts: LayoutSizeOptions): LayoutSizeResult {
  const { type, rows, cols, blockSize, sashingWidth, borders, bindingWidth } = opts;

  let innerW: number;
  let innerH: number;

  if (type === 'on-point') {
    const diagonal = blockSize * Math.SQRT2;
    innerW = cols * diagonal;
    innerH = rows * diagonal;
  } else if (type === 'sashing') {
    innerW = cols * blockSize + Math.max(0, cols - 1) * sashingWidth;
    innerH = rows * blockSize + Math.max(0, rows - 1) * sashingWidth;
  } else if (type === 'strippy') {
    const blockCols = Math.ceil(cols / 2);
    const stripCols = Math.floor(cols / 2);
    innerW = blockCols * blockSize + stripCols * sashingWidth;
    innerH = rows * blockSize;
  } else if (type === 'medallion') {
    innerW = blockSize;
    innerH = blockSize;
  } else {
    // grid, free-form, and fallback
    innerW = cols * blockSize;
    innerH = rows * blockSize;
  }

  let borderTotal = 0;
  for (const b of borders) borderTotal += b.width * 2;

  const totalW = innerW + borderTotal + bindingWidth * 2;
  const totalH = innerH + borderTotal + bindingWidth * 2;
  const perimeter = 2 * (totalW + totalH);
  // Binding yardage: perimeter / 36 rounded up to nearest 0.5 yard
  const bindingYardage = Math.ceil((perimeter / 36) * 2) / 2;

  return {
    width: Math.round(totalW * 100) / 100,
    height: Math.round(totalH * 100) / 100,
    perimeter: Math.round(perimeter * 100) / 100,
    bindingYardage,
  };
}

/**
 * Compute size from a SashingConfig (used when sashing is an object, not just width).
 */
export function computeLayoutSizeWithSashing(opts: {
  type: string;
  rows: number;
  cols: number;
  blockSize: number;
  sashing: SashingConfig;
  borders: BorderConfig[];
  bindingWidth: number;
}): LayoutSizeResult {
  const { sashing, ...rest } = opts;
  return computeLayoutSize({ ...rest, sashingWidth: sashing.width });
}
