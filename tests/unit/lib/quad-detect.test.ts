import { describe, expect, it } from 'vitest';
import { detectQuiltQuad } from '@/lib/quad-detect';
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

describe('detectQuiltQuad', () => {
  it('detects an axis-aligned white rectangle on a black background', () => {
    const img = solidImage(300, 300, [0, 0, 0]);
    // 200×200 rectangle centered in the 300×300 image (66% area).
    fillRect(img, 50, 50, 250, 250, [255, 255, 255]);

    const result = detectQuiltQuad(img);
    expect(result).not.toBeNull();
    if (!result) return;

    // Each corner should land within ~10 px of the true coordinates
    // (Hough step + quantization gives a few px of slack).
    const [tl, tr, br, bl] = result.corners;
    expect(tl.x).toBeLessThan(60);
    expect(tl.y).toBeLessThan(60);
    expect(tr.x).toBeGreaterThan(240);
    expect(tr.y).toBeLessThan(60);
    expect(br.x).toBeGreaterThan(240);
    expect(br.y).toBeGreaterThan(240);
    expect(bl.x).toBeLessThan(60);
    expect(bl.y).toBeGreaterThan(240);

    expect(result.confidence).toBeGreaterThan(0.3);
  });

  it('returns null for a noise-only image with no dominant shape', () => {
    const W = 128;
    const H = 128;
    const data = new Uint8ClampedArray(W * H * 4);
    // Deterministic speckle pattern — seeded by pixel index, not
    // Math.random, so tests stay stable.
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const v = ((x * 131 + y * 277) ^ (x * y)) & 0xff;
        const i = (y * W + x) * 4;
        data[i] = v;
        data[i + 1] = v;
        data[i + 2] = v;
        data[i + 3] = 255;
      }
    }
    const img: ImageDataLike = { data, width: W, height: H };
    const result = detectQuiltQuad(img);
    // Noise may or may not produce *some* quad, but if it does it should
    // not have high confidence.
    if (result) {
      expect(result.confidence).toBeLessThan(0.7);
    }
  });

  it('rejects a rectangle that is too small (< 20% of image area)', () => {
    const img = solidImage(200, 200, [0, 0, 0]);
    // 40×40 rectangle = 1,600 px² = 4% of the 40,000 px² image.
    fillRect(img, 80, 80, 120, 120, [255, 255, 255]);
    const result = detectQuiltQuad(img);
    // With the 20% area floor this must be rejected.
    expect(result).toBeNull();
  });

  it('returns null when the image is too small to run Hough on', () => {
    const img = solidImage(16, 16, [128, 128, 128]);
    expect(detectQuiltQuad(img)).toBeNull();
  });
});
