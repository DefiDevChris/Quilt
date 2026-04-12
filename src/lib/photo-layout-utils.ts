/**
 * Photo → Design Utilities — Perspective warp layer.
 *
 * In the fabric-first pipeline this file owns only the homography step:
 * take the calibrated four corners and rasterize a flat, front-facing
 * block bitmap using the pure-TS perspective engine. Everything
 * downstream (quantize, component labelling, contour, simplify) lives in
 * `quilt-segmentation-engine.ts`.
 *
 * Kept as a thin wrapper because the wizard also needs a Blob URL for the
 * `<img>` preview in the Review step, while the segmentation engine wants
 * the raw `ImageData`. Producing both in one place keeps the canvas
 * lifecycle (creation + cleanup) localized.
 */

import type { QuadCorners, WarpedImageRef } from './photo-layout-types';
import {
  computeHomography,
  rectCorners,
  sortCornersClockwise,
  warpPerspective,
} from './perspective-engine';

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
   * detailed enough image for reliable segmentation while staying well
   * under the memory budget for a typical 12×12 block (~2 MB).
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
