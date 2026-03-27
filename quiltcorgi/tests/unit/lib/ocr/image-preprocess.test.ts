import { describe, it, expect } from 'vitest';
import {
  toGrayscale,
  gaussianBlur,
  enhanceContrast,
  sobelEdgeDetect,
  preprocessImage,
  type ImageBuffer,
  type GrayscaleBuffer,
} from '@/lib/ocr/image-preprocess';

function makeRgbaImage(width: number, height: number, fill: [number, number, number, number]): ImageBuffer {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    data[i * 4] = fill[0];
    data[i * 4 + 1] = fill[1];
    data[i * 4 + 2] = fill[2];
    data[i * 4 + 3] = fill[3];
  }
  return { width, height, data };
}

function makeGrayImage(width: number, height: number, fill: number): GrayscaleBuffer {
  const data = new Uint8ClampedArray(width * height);
  data.fill(fill);
  return { width, height, data };
}

describe('image-preprocess', () => {
  describe('toGrayscale', () => {
    it('converts white image to grayscale 255', () => {
      const image = makeRgbaImage(4, 4, [255, 255, 255, 255]);
      const gray = toGrayscale(image);
      expect(gray.width).toBe(4);
      expect(gray.height).toBe(4);
      expect(gray.data[0]).toBe(255);
    });

    it('converts black image to grayscale 0', () => {
      const image = makeRgbaImage(4, 4, [0, 0, 0, 255]);
      const gray = toGrayscale(image);
      expect(gray.data[0]).toBe(0);
    });

    it('uses ITU-R BT.601 luma coefficients', () => {
      const image = makeRgbaImage(1, 1, [100, 150, 200, 255]);
      const gray = toGrayscale(image);
      const expected = Math.round(0.299 * 100 + 0.587 * 150 + 0.114 * 200);
      expect(gray.data[0]).toBe(expected);
    });

    it('preserves dimensions', () => {
      const image = makeRgbaImage(10, 20, [128, 128, 128, 255]);
      const gray = toGrayscale(image);
      expect(gray.width).toBe(10);
      expect(gray.height).toBe(20);
      expect(gray.data.length).toBe(200);
    });
  });

  describe('gaussianBlur', () => {
    it('preserves uniform image', () => {
      const image = makeGrayImage(10, 10, 128);
      const blurred = gaussianBlur(image, 3);
      expect(blurred.data[55]).toBe(128);
    });

    it('returns correct dimensions', () => {
      const image = makeGrayImage(8, 6, 100);
      const blurred = gaussianBlur(image);
      expect(blurred.width).toBe(8);
      expect(blurred.height).toBe(6);
    });

    it('accepts kernel size 5', () => {
      const image = makeGrayImage(10, 10, 128);
      const blurred = gaussianBlur(image, 5);
      expect(blurred.data[55]).toBe(128);
    });
  });

  describe('enhanceContrast', () => {
    it('preserves uniform image (all same value)', () => {
      const image = makeGrayImage(4, 4, 100);
      const enhanced = enhanceContrast(image);
      // Uniform image → all values map to same output
      const uniqueValues = new Set(enhanced.data);
      expect(uniqueValues.size).toBe(1);
    });

    it('stretches contrast range', () => {
      // Create image with only values 100 and 200
      const data = new Uint8ClampedArray(100);
      for (let i = 0; i < 50; i++) data[i] = 100;
      for (let i = 50; i < 100; i++) data[i] = 200;
      const image: GrayscaleBuffer = { width: 10, height: 10, data };
      const enhanced = enhanceContrast(image);

      // After equalization, values should span 0-255 range
      const min = Math.min(...enhanced.data);
      const max = Math.max(...enhanced.data);
      expect(max - min).toBeGreaterThan(100);
    });
  });

  describe('sobelEdgeDetect', () => {
    it('detects no edges in uniform image', () => {
      const image = makeGrayImage(10, 10, 128);
      const edges = sobelEdgeDetect(image, 50);
      const edgePixels = Array.from(edges.data).filter((v) => v > 0);
      expect(edgePixels.length).toBe(0);
    });

    it('detects edges at sharp boundary', () => {
      // Left half black, right half white
      const data = new Uint8ClampedArray(100);
      for (let y = 0; y < 10; y++) {
        for (let x = 0; x < 10; x++) {
          data[y * 10 + x] = x < 5 ? 0 : 255;
        }
      }
      const image: GrayscaleBuffer = { width: 10, height: 10, data };
      const edges = sobelEdgeDetect(image, 50);
      const edgePixels = Array.from(edges.data).filter((v) => v > 0);
      expect(edgePixels.length).toBeGreaterThan(0);
    });
  });

  describe('preprocessImage', () => {
    it('returns all 4 pipeline stages', () => {
      const image = makeRgbaImage(10, 10, [128, 128, 128, 255]);
      const result = preprocessImage(image);
      expect(result.grayscale).toBeDefined();
      expect(result.blurred).toBeDefined();
      expect(result.enhanced).toBeDefined();
      expect(result.edges).toBeDefined();
    });

    it('all stages have correct dimensions', () => {
      const image = makeRgbaImage(20, 15, [100, 100, 100, 255]);
      const result = preprocessImage(image);
      expect(result.grayscale.width).toBe(20);
      expect(result.edges.height).toBe(15);
    });
  });
});
