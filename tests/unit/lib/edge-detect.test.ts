import { describe, expect, it } from 'vitest';
import { cannyEdges } from '@/lib/edge-detect';
import type { ImageDataLike } from '@/lib/color-quantize';

function solidImage(
  width: number,
  height: number,
  rgb: readonly [number, number, number]
): ImageDataLike {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    data[i * 4] = rgb[0];
    data[i * 4 + 1] = rgb[1];
    data[i * 4 + 2] = rgb[2];
    data[i * 4 + 3] = 255;
  }
  return { data, width, height };
}

function fillRect(
  image: ImageDataLike,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  rgb: readonly [number, number, number]
): void {
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * image.width + x) * 4;
      image.data[i] = rgb[0];
      image.data[i + 1] = rgb[1];
      image.data[i + 2] = rgb[2];
      image.data[i + 3] = 255;
    }
  }
}

describe('cannyEdges', () => {
  it('returns zero edges on a solid-color image', () => {
    const img = solidImage(64, 64, [128, 128, 128]);
    const edges = cannyEdges(img, { lowThreshold: 20, highThreshold: 40 });
    let count = 0;
    for (let i = 0; i < edges.length; i++) count += edges[i];
    expect(count).toBe(0);
  });

  it('finds sharp edges at the boundary of a bright rectangle on black', () => {
    const img = solidImage(64, 64, [0, 0, 0]);
    fillRect(img, 16, 16, 48, 48, [255, 255, 255]);
    const edges = cannyEdges(img, { lowThreshold: 30, highThreshold: 60 });

    // A 32×32 rectangle has ~128 perimeter pixels. Canny typically recovers
    // most of them — we set a loose lower bound so noise from blurring
    // doesn't break the test.
    let count = 0;
    for (let i = 0; i < edges.length; i++) count += edges[i];
    expect(count).toBeGreaterThan(60);

    // Edges should cluster on the rectangle perimeter. A dead-center
    // pixel should not be flagged as an edge.
    expect(edges[32 * 64 + 32]).toBe(0);
    // The top edge of the rectangle (row 16, columns 20–40) should be hit.
    let topHits = 0;
    for (let x = 20; x < 40; x++) {
      if (edges[16 * 64 + x] === 1) topHits++;
    }
    expect(topHits).toBeGreaterThan(4);
  });

  it('does not produce spurious edges from a smooth gradient', () => {
    // Smooth horizontal gradient from 0 → 255 across the image. With
    // default adaptive thresholds this should stay under control — weak
    // edges throughout, but we don't want a dense wall of strong ones.
    const W = 64;
    const H = 64;
    const data = new Uint8ClampedArray(W * H * 4);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const v = Math.round((x / (W - 1)) * 255);
        const i = (y * W + x) * 4;
        data[i] = v;
        data[i + 1] = v;
        data[i + 2] = v;
        data[i + 3] = 255;
      }
    }
    const img: ImageDataLike = { data, width: W, height: H };

    // Force a high-ish threshold so the gradient's ~4-unit-per-pixel slope
    // can't slip through.
    const edges = cannyEdges(img, { lowThreshold: 30, highThreshold: 60 });
    let count = 0;
    for (let i = 0; i < edges.length; i++) count += edges[i];
    expect(count).toBeLessThan(20);
  });

  it('returns the same shape as the input', () => {
    const img = solidImage(32, 48, [255, 255, 255]);
    const edges = cannyEdges(img);
    expect(edges.length).toBe(32 * 48);
  });
});
