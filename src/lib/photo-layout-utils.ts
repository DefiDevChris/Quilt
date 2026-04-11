/**
 * Photo Pattern Orchestrator — Perspective-First Pipeline
 *
 * Rebuilt after the 15-step OpenCV pipeline was deleted. Flow:
 *
 *   1. The user drops a photo in `PhotoToDesignWizard`.
 *   2. In the Calibration step they pin the four corners of one quilt block
 *      and enter its real-world size (e.g., 12×12 inches).
 *   3. `warpSourceImage()` uses the pure-TS `perspective-engine` to produce
 *      a flat, front-facing bitmap of just that block.
 *   4. In the Layout step the user picks a `BlockGridPreset` (4-Patch,
 *      9-Patch, HST, etc.).
 *   5. `buildBlockPattern()` overlays the preset's cells on the flattened
 *      image and K-Means-samples a dominant color per patch.
 *   6. The review step presents the pattern for validation / color swap.
 *
 * No polygon cleanup downstream — every emitted polygon is axis-aligned
 * or a right triangle on an inch grid.
 */

import type {
  BlockGridPreset,
  GridCell,
  QuadCorners,
  WarpedImageRef,
} from './photo-layout-types';
import {
  computeHomography,
  rectCorners,
  sortCornersClockwise,
  warpPerspective,
} from './perspective-engine';
import { buildGridCells } from './grid-sampling-engine';

// ── Calibration → Warped Image ────────────────────────────────────────────

export interface WarpSourceImageOptions {
  /** Four corners in source-image pixel space (order does not matter). */
  readonly corners: QuadCorners;
  /** Real-world block width in inches. */
  readonly widthInches: number;
  /** Real-world block height in inches. */
  readonly heightInches: number;
  /**
   * Pixels per inch used for the warped bitmap. Default 120 gives a
   * detailed enough image for reliable K-Means while staying well under
   * the memory budget for a typical 12×12 block (~2 MB).
   */
  readonly pixelsPerInch?: number;
}

export interface WarpSourceImageResult {
  readonly warped: ImageData;
  readonly warpedRef: WarpedImageRef;
  readonly pixelsPerInch: number;
  readonly sortedCorners: QuadCorners;
}

/**
 * Perspective-warp the user's photo into a flat block bitmap using the
 * pure-TypeScript perspective engine.
 *
 * Runs on the main thread — the image is already downscaled by the
 * browser's Image decoder, and warping a ~1500×1500 block is ~50 ms.
 */
export async function warpSourceImage(
  image: HTMLImageElement,
  options: WarpSourceImageOptions
): Promise<WarpSourceImageResult | null> {
  const { corners, widthInches, heightInches } = options;
  const pixelsPerInch = options.pixelsPerInch ?? 120;

  const sorted = sortCornersClockwise(corners);
  if (!sorted) return null;

  const destW = Math.max(1, Math.round(widthInches * pixelsPerInch));
  const destH = Math.max(1, Math.round(heightInches * pixelsPerInch));
  const dst = rectCorners(destW, destH);

  const h = computeHomography(sorted, dst);
  if (!h) return null;

  // Rasterize the source image into an ImageData. A fresh canvas is
  // created per call so we never leak canvas memory into the Zustand store.
  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = image.naturalWidth;
  srcCanvas.height = image.naturalHeight;
  const srcCtx = srcCanvas.getContext('2d', { alpha: false });
  if (!srcCtx) return null;
  srcCtx.drawImage(image, 0, 0);
  const source = srcCtx.getImageData(0, 0, image.naturalWidth, image.naturalHeight);

  const warped = warpPerspective(source, h, destW, destH);
  srcCanvas.width = 0;
  srcCanvas.height = 0;
  if (!warped) return null;

  // Convert to a Blob URL for lightweight Zustand storage.
  const outCanvas = document.createElement('canvas');
  outCanvas.width = destW;
  outCanvas.height = destH;
  const outCtx = outCanvas.getContext('2d', { alpha: false });
  if (!outCtx) return null;
  outCtx.putImageData(warped, 0, 0);

  const blob: Blob | null = await new Promise((resolve) =>
    outCanvas.toBlob((b) => resolve(b), 'image/png')
  );
  outCanvas.width = 0;
  outCanvas.height = 0;
  if (!blob) return null;

  return {
    warped,
    warpedRef: {
      url: URL.createObjectURL(blob),
      width: destW,
      height: destH,
    },
    pixelsPerInch,
    sortedCorners: sorted,
  };
}

// ── Layout → Pattern ──────────────────────────────────────────────────────

export interface BuildBlockPatternResult {
  readonly cells: readonly GridCell[];
}

/**
 * Apply a block grid preset to the warped image and produce the final
 * list of `GridCell`s with sampled fabric colors.
 */
export function buildBlockPattern(
  preset: BlockGridPreset,
  widthInches: number,
  heightInches: number,
  warped: ImageData | null
): BuildBlockPatternResult {
  const { cells } = buildGridCells(preset, widthInches, heightInches, warped);
  return { cells };
}
