import { describe, it, expect } from 'vitest';
import { quantizeImage, type ImageDataLike } from '@/lib/color-quantize';
import { hexToRgb, rgbToLab, labDistance } from '@/lib/color-math';

/**
 * Build a synthetic 4-quadrant solid-color image. Top-left, top-right,
 * bottom-left, bottom-right get the four colors from `colors` in that
 * order. Used as the ground-truth fixture for the quantizer tests — if the
 * engine can't find these 4 clusters cleanly, nothing downstream will work.
 */
function makeQuadrantImage(
  size: number,
  colors: readonly [string, string, string, string]
): ImageDataLike {
  const data = new Uint8ClampedArray(size * size * 4);
  const rgbs = colors.map((h) => hexToRgb(h));
  const half = size / 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const quadrant = y < half ? (x < half ? 0 : 1) : x < half ? 2 : 3;
      const { r, g, b } = rgbs[quadrant];
      const i = (y * size + x) * 4;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255;
    }
  }
  return { data, width: size, height: size };
}

describe('quantizeImage', () => {
  it('finds 4 distinct clusters in a 4-quadrant image', () => {
    const img = makeQuadrantImage(32, ['#ff0000', '#00ff00', '#0000ff', '#ffff00']);
    const result = quantizeImage(img, 4, { seed: 42 });

    expect(result.clusters).toHaveLength(4);

    // Every cluster should hold exactly 1/4 of the image (32*32 / 4 = 256).
    for (const c of result.clusters) {
      expect(c.pixelCount).toBe(256);
    }

    // Each ground-truth color should be matched by some cluster within a
    // small LAB distance — cluster ordering is by size and all 4 tie here,
    // so we accept any permutation.
    const targets = ['#ff0000', '#00ff00', '#0000ff', '#ffff00'].map((h) =>
      rgbToLab(hexToRgb(h))
    );
    for (const target of targets) {
      let bestDist = Infinity;
      for (const c of result.clusters) {
        const d = labDistance(target, c.lab);
        if (d < bestDist) bestDist = d;
      }
      expect(bestDist).toBeLessThan(3);
    }
  });

  it('labelMap partitions the image along the quadrant boundaries', () => {
    const img = makeQuadrantImage(32, ['#ff0000', '#00ff00', '#0000ff', '#ffff00']);
    const result = quantizeImage(img, 4, { seed: 42 });

    // Read the label at the center of each quadrant.
    const topLeft = result.labelMap[8 * 32 + 8];
    const topRight = result.labelMap[8 * 32 + 24];
    const bottomLeft = result.labelMap[24 * 32 + 8];
    const bottomRight = result.labelMap[24 * 32 + 24];

    expect(new Set([topLeft, topRight, bottomLeft, bottomRight]).size).toBe(4);

    // Every pixel in the top-left quadrant should carry topLeft's label.
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        expect(result.labelMap[y * 32 + x]).toBe(topLeft);
      }
    }
    // And the same for the bottom-right — verifies the whole partition.
    for (let y = 16; y < 32; y++) {
      for (let x = 16; x < 32; x++) {
        expect(result.labelMap[y * 32 + x]).toBe(bottomRight);
      }
    }
  });

  it('handles a single-color image with k=1', () => {
    const img = makeQuadrantImage(16, ['#808080', '#808080', '#808080', '#808080']);
    const result = quantizeImage(img, 1, { seed: 42 });

    expect(result.clusters).toHaveLength(1);
    expect(result.clusters[0].pixelCount).toBe(256);

    // Gray should round-trip to near #808080 — allow ±2 per channel for
    // the sRGB ↔ LAB companding drift.
    const c = result.clusters[0];
    expect(Math.abs(c.rgb.r - 128)).toBeLessThanOrEqual(2);
    expect(Math.abs(c.rgb.g - 128)).toBeLessThanOrEqual(2);
    expect(Math.abs(c.rgb.b - 128)).toBeLessThanOrEqual(2);
  });

  it('degrades gracefully when k exceeds the number of distinct colors', () => {
    const img = makeQuadrantImage(8, ['#ff0000', '#ff0000', '#ff0000', '#ff0000']);
    // Ask for 6 clusters on a solid-red image.
    const result = quantizeImage(img, 6, { seed: 42 });

    // We may return fewer than 6, but every returned cluster must be red.
    expect(result.clusters.length).toBeGreaterThan(0);
    const red = rgbToLab(hexToRgb('#ff0000'));
    for (const c of result.clusters) {
      expect(labDistance(red, c.lab)).toBeLessThan(5);
    }
    // And every pixel total across all clusters must equal the image area.
    const totalAssigned = result.clusters.reduce((acc, c) => acc + c.pixelCount, 0);
    expect(totalAssigned).toBe(8 * 8);
  });

  it('sorts clusters by pixel count descending', () => {
    // 75% red (top 12 rows of 16), 25% blue (bottom 4 rows) on a 16×16 canvas.
    const size = 16;
    const data = new Uint8ClampedArray(size * size * 4);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = (y * size + x) * 4;
        const isBlue = y >= 12;
        data[i] = isBlue ? 0 : 255;
        data[i + 1] = 0;
        data[i + 2] = isBlue ? 255 : 0;
        data[i + 3] = 255;
      }
    }
    const result = quantizeImage({ data, width: size, height: size }, 2, { seed: 42 });

    expect(result.clusters).toHaveLength(2);
    expect(result.clusters[0].pixelCount).toBeGreaterThan(result.clusters[1].pixelCount);
    expect(result.clusters[0].pixelCount).toBe(192); // 12 rows * 16 cols
    expect(result.clusters[1].pixelCount).toBe(64);  //  4 rows * 16 cols

    const red = rgbToLab(hexToRgb('#ff0000'));
    const blue = rgbToLab(hexToRgb('#0000ff'));
    expect(labDistance(red, result.clusters[0].lab)).toBeLessThan(3);
    expect(labDistance(blue, result.clusters[1].lab)).toBeLessThan(3);
  });

  it('remaps labelMap indices to match the post-sort cluster order', () => {
    // Same 75/25 fixture as above — the dominant red cluster should carry
    // labelMap value 0, the minority blue cluster should carry 1.
    const size = 16;
    const data = new Uint8ClampedArray(size * size * 4);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = (y * size + x) * 4;
        const isBlue = y >= 12;
        data[i] = isBlue ? 0 : 255;
        data[i + 1] = 0;
        data[i + 2] = isBlue ? 255 : 0;
        data[i + 3] = 255;
      }
    }
    const result = quantizeImage({ data, width: size, height: size }, 2, { seed: 42 });

    expect(result.clusters[0].index).toBe(0);
    expect(result.clusters[1].index).toBe(1);
    // Red (row 0) should be labelled 0; blue (row 14) should be labelled 1.
    expect(result.labelMap[0]).toBe(0);
    expect(result.labelMap[14 * size]).toBe(1);
  });

  it('is deterministic under a fixed seed', () => {
    const img = makeQuadrantImage(16, ['#ff0000', '#00ff00', '#0000ff', '#ffff00']);
    const a = quantizeImage(img, 4, { seed: 12345 });
    const b = quantizeImage(img, 4, { seed: 12345 });
    expect(a.clusters.map((c) => c.hex)).toEqual(b.clusters.map((c) => c.hex));
    expect(Array.from(a.labelMap)).toEqual(Array.from(b.labelMap));
  });

  it('throws on k < 1', () => {
    const img = makeQuadrantImage(8, ['#ff0000', '#00ff00', '#0000ff', '#ffff00']);
    expect(() => quantizeImage(img, 0)).toThrow(/k must be >= 1/);
    expect(() => quantizeImage(img, -1)).toThrow(/k must be >= 1/);
  });

  it('returns empty result for a zero-pixel image', () => {
    const result = quantizeImage({ data: new Uint8ClampedArray(0), width: 0, height: 0 }, 3);
    expect(result.clusters).toHaveLength(0);
    expect(result.labelMap.length).toBe(0);
  });
});
