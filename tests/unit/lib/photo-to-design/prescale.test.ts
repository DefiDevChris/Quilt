import { beforeAll, describe, expect, it } from 'vitest';
import { prescaleImage, MAX_SCALED_DIMENSION } from '@/lib/photo-to-design/stages/prescale';

/**
 * Prescale's downscale path uses OffscreenCanvas, which jsdom does not
 * implement. We only cover the passthrough branch here; the resize quality
 * is verified by U8's Playwright sweep against real fixtures.
 *
 * jsdom 29 also omits `ImageData` unless the `canvas` peer dep is installed.
 * We shim the constructor for the passthrough tests — the shim records just
 * what prescale reads back (data, width, height).
 */

beforeAll(() => {
  if (typeof (globalThis as { ImageData?: unknown }).ImageData === 'undefined') {
    class ShimImageData {
      readonly data: Uint8ClampedArray;
      readonly width: number;
      readonly height: number;
      constructor(data: Uint8ClampedArray, width: number, height: number) {
        this.data = data;
        this.width = width;
        this.height = height;
      }
    }
    (globalThis as { ImageData: typeof ShimImageData }).ImageData = ShimImageData;
  }
});

function rgbaBuffer(w: number, h: number): Uint8ClampedArray {
  const buf = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < buf.length; i += 4) {
    buf[i] = 128;
    buf[i + 1] = 64;
    buf[i + 2] = 32;
    buf[i + 3] = 255;
  }
  return buf;
}

describe('prescaleImage', () => {
  it('passes through images already within budget unchanged', () => {
    const w = MAX_SCALED_DIMENSION;
    const h = MAX_SCALED_DIMENSION / 2;
    const pixels = rgbaBuffer(w, h);

    const result = prescaleImage(pixels, w, h);

    expect(result.scale).toBe(1);
    expect(result.originalWidth).toBe(w);
    expect(result.originalHeight).toBe(h);
    expect(result.imageData.width).toBe(w);
    expect(result.imageData.height).toBe(h);
    expect(result.imageData.data.length).toBe(pixels.length);
  });

  it('returns a fresh buffer — does not alias the input', () => {
    const pixels = rgbaBuffer(4, 4);
    const result = prescaleImage(pixels, 4, 4);

    expect(result.imageData.data).not.toBe(pixels);
    result.imageData.data[0] = 7;
    expect(pixels[0]).toBe(128);
  });

  it('reports the original dimensions for the passthrough case', () => {
    const result = prescaleImage(rgbaBuffer(100, 50), 100, 50);
    expect(result.originalWidth).toBe(100);
    expect(result.originalHeight).toBe(50);
  });
});
