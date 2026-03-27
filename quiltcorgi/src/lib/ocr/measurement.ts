/**
 * Measurement calculation for quilt OCR reconstruction.
 * Given grid dimensions and an optional reference measurement,
 * computes all real-unit dimensions and seam allowances.
 */

import type { DetectedGrid, QuiltMeasurements } from '@/types/quilt-ocr';

/**
 * Compute a scale factor (inches per pixel) from a known reference.
 * If the user says "the quilt is X inches wide" and we know the
 * pixel width, we can derive the scale.
 */
export function computeScaleFactor(referenceInches: number, referencePixels: number): number {
  if (referencePixels <= 0) return 0;
  return referenceInches / referencePixels;
}

/**
 * Compute all quilt measurements from detected grid and a scale factor.
 */
export function computeMeasurements(
  grid: DetectedGrid,
  referenceWidthInches: number,
  imageWidthPixels: number,
  seamAllowanceInches: number = 0.25
): QuiltMeasurements {
  const scale = computeScaleFactor(referenceWidthInches, imageWidthPixels);

  const blockSizeInches = roundToQuarter(grid.cellWidth * scale);

  // Simple approach: total width is the reference, compute height proportionally
  const aspectRatio =
    grid.rows > 0 && grid.cols > 0
      ? (grid.rows * grid.cellHeight) / (grid.cols * grid.cellWidth)
      : 1;
  const totalHeightInches = roundToQuarter(referenceWidthInches * aspectRatio);

  // Estimate sashing width: if grid has sashing layout, assume alternating
  // narrow strips. Use the difference between total and block-only widths.
  const blocksOnlyWidth = grid.cols * blockSizeInches;
  const remainingWidth = Math.max(0, referenceWidthInches - blocksOnlyWidth);
  const sashingWidthInches = grid.cols > 1 ? roundToQuarter(remainingWidth / (grid.cols - 1)) : 0;

  // Border width: estimated from any border area beyond the grid
  const borderWidthInches = 0; // Default, user can adjust

  return {
    blockSizeInches,
    sashingWidthInches,
    borderWidthInches,
    totalWidthInches: roundToQuarter(referenceWidthInches),
    totalHeightInches,
    seamAllowanceInches,
  };
}

/**
 * Compute cutting dimensions for a single piece, adding seam allowance
 * to all sides.
 */
export function computeCutDimension(finishedSize: number, seamAllowance: number): number {
  return roundToEighth(finishedSize + 2 * seamAllowance);
}

/**
 * Round to nearest 1/4 inch.
 */
function roundToQuarter(value: number): number {
  return Math.round(value * 4) / 4;
}

/**
 * Round up to nearest 1/8 inch.
 */
function roundToEighth(value: number): number {
  return Math.ceil(value * 8) / 8;
}

/**
 * Compute measurements without a reference (pixel-only dimensions).
 * Returns dimensions in pixels for overlay display purposes.
 */
export function computePixelMeasurements(grid: DetectedGrid): {
  readonly blockWidthPx: number;
  readonly blockHeightPx: number;
  readonly gridWidthPx: number;
  readonly gridHeightPx: number;
} {
  return {
    blockWidthPx: Math.round(grid.cellWidth),
    blockHeightPx: Math.round(grid.cellHeight),
    gridWidthPx: Math.round(grid.cols * grid.cellWidth),
    gridHeightPx: Math.round(grid.rows * grid.cellHeight),
  };
}
