/**
 * Block segmentation — isolate individual blocks from a detected grid.
 * Extracts sub-images for each grid cell, normalized to 100x100 pixel space.
 */

import type { ImageBuffer } from '@/lib/ocr/image-preprocess';
import type { DetectedGrid, BlockRegion } from '@/types/quilt-ocr';

const NORMALIZED_SIZE = 100;

/**
 * Extract pixel data for a rectangular region from the source image.
 */
export function extractRegion(
  source: ImageBuffer,
  x: number,
  y: number,
  width: number,
  height: number
): Uint8ClampedArray {
  const clampedX = Math.max(0, Math.round(x));
  const clampedY = Math.max(0, Math.round(y));
  const clampedW = Math.min(Math.round(width), source.width - clampedX);
  const clampedH = Math.min(Math.round(height), source.height - clampedY);

  const regionData = new Uint8ClampedArray(clampedW * clampedH * 4);

  for (let ry = 0; ry < clampedH; ry++) {
    for (let rx = 0; rx < clampedW; rx++) {
      const srcIndex = ((clampedY + ry) * source.width + (clampedX + rx)) * 4;
      const dstIndex = (ry * clampedW + rx) * 4;
      regionData[dstIndex] = source.data[srcIndex];
      regionData[dstIndex + 1] = source.data[srcIndex + 1];
      regionData[dstIndex + 2] = source.data[srcIndex + 2];
      regionData[dstIndex + 3] = source.data[srcIndex + 3];
    }
  }

  return regionData;
}

/**
 * Downsample a rectangular region to a normalized square size using
 * nearest-neighbor sampling. Returns RGBA pixel data.
 */
export function normalizeRegion(
  regionData: Uint8ClampedArray,
  regionWidth: number,
  regionHeight: number,
  targetSize: number = NORMALIZED_SIZE
): Uint8ClampedArray {
  const output = new Uint8ClampedArray(targetSize * targetSize * 4);

  for (let ty = 0; ty < targetSize; ty++) {
    for (let tx = 0; tx < targetSize; tx++) {
      const sx = Math.floor((tx / targetSize) * regionWidth);
      const sy = Math.floor((ty / targetSize) * regionHeight);
      const srcIdx = (sy * regionWidth + sx) * 4;
      const dstIdx = (ty * targetSize + tx) * 4;

      output[dstIdx] = regionData[srcIdx] ?? 0;
      output[dstIdx + 1] = regionData[srcIdx + 1] ?? 0;
      output[dstIdx + 2] = regionData[srcIdx + 2] ?? 0;
      output[dstIdx + 3] = regionData[srcIdx + 3] ?? 255;
    }
  }

  return output;
}

/**
 * Extract all block regions from the source image based on the detected grid.
 * Each region is normalized to NORMALIZED_SIZE x NORMALIZED_SIZE pixels.
 */
export function extractBlockRegions(
  source: ImageBuffer,
  grid: DetectedGrid
): readonly BlockRegion[] {
  const { rows, cols, horizontalLines, verticalLines } = grid;

  if (rows === 0 || cols === 0) return [];

  const regions: BlockRegion[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = verticalLines[col];
      const y = horizontalLines[row];
      const width = (verticalLines[col + 1] ?? source.width) - x;
      const height = (horizontalLines[row + 1] ?? source.height) - y;

      if (width <= 0 || height <= 0) continue;

      const rawPixels = extractRegion(source, x, y, width, height);
      const normalizedPixels = normalizeRegion(
        rawPixels,
        Math.round(width),
        Math.round(height),
        NORMALIZED_SIZE
      );

      regions.push({
        row,
        col,
        x: Math.round(x),
        y: Math.round(y),
        width: Math.round(width),
        height: Math.round(height),
        pixelData: normalizedPixels,
      });
    }
  }

  return regions;
}

/**
 * Get the normalized size used for block regions.
 */
export function getNormalizedSize(): number {
  return NORMALIZED_SIZE;
}
