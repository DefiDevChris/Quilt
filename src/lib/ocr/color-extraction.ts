/**
 * Color/fabric extraction for each block in a recognized quilt.
 * Samples dominant colors per block and maps them to fabrics.
 */

import type { BlockRegion, ExtractedColor, BlockColorInfo } from '@/types/quilt-ocr';
import { rgbToHex, type RGB } from '@/lib/color-math';

/**
 * Extract top-k dominant colors from RGBA pixel data using a simple
 * color histogram approach with quantized color buckets.
 */
export function extractDominantColors(
  pixelData: Uint8ClampedArray,
  topK: number = 5,
  bucketSize: number = 32
): readonly ExtractedColor[] {
  const bucketCount = Math.ceil(256 / bucketSize);
  const totalBuckets = bucketCount * bucketCount * bucketCount;
  const histogram = new Uint32Array(totalBuckets);
  const bucketSums: { r: number; g: number; b: number; count: number }[] = Array.from(
    { length: totalBuckets },
    () => ({ r: 0, g: 0, b: 0, count: 0 })
  );

  const pixelCount = pixelData.length / 4;

  for (let i = 0; i < pixelCount; i++) {
    const offset = i * 4;
    const r = pixelData[offset];
    const g = pixelData[offset + 1];
    const b = pixelData[offset + 2];
    const a = pixelData[offset + 3];

    // Skip transparent pixels
    if (a < 128) continue;

    const rBucket = Math.floor(r / bucketSize);
    const gBucket = Math.floor(g / bucketSize);
    const bBucket = Math.floor(b / bucketSize);
    const bucketIdx = rBucket * bucketCount * bucketCount + gBucket * bucketCount + bBucket;

    histogram[bucketIdx]++;
    const entry = bucketSums[bucketIdx];
    entry.r += r;
    entry.g += g;
    entry.b += b;
    entry.count++;
  }

  // Find top-K buckets by count
  const indices = Array.from({ length: totalBuckets }, (_, i) => i);
  indices.sort((a, b) => histogram[b] - histogram[a]);

  const topBuckets = indices.slice(0, topK).filter((i) => histogram[i] > 0);
  const totalOpaquePixels = topBuckets.reduce((sum, i) => sum + histogram[i], 0);

  return topBuckets.map((bucketIdx) => {
    const entry = bucketSums[bucketIdx];
    const count = entry.count;
    const avgRgb: RGB = {
      r: count > 0 ? entry.r / count : 0,
      g: count > 0 ? entry.g / count : 0,
      b: count > 0 ? entry.b / count : 0,
    };

    return {
      hex: rgbToHex(avgRgb),
      percentage:
        totalOpaquePixels > 0 ? Math.round((histogram[bucketIdx] / totalOpaquePixels) * 100) : 0,
    };
  });
}

/**
 * Extract color information for all block regions.
 */
export function extractBlockColors(
  regions: readonly BlockRegion[],
  colorsPerBlock: number = 5
): readonly BlockColorInfo[] {
  return regions.map((region) => ({
    row: region.row,
    col: region.col,
    dominantColors: extractDominantColors(region.pixelData, colorsPerBlock),
  }));
}
