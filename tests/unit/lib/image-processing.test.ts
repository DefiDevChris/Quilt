import { describe, it, expect } from 'vitest';
import { loadImage, processImage } from '@/lib/image-processing';

describe('image-processing', () => {
  describe('loadImage', () => {
    it('should reject invalid URLs', async () => {
      const originalImage = global.Image;
      global.Image = class {
        onload: () => void = () => {};
        onerror: () => void = () => {};
        set src(value: string) {
          setTimeout(() => this.onerror(), 0);
        }
      } as any;

      try {
        await expect(loadImage('')).rejects.toThrow();
        await expect(loadImage('invalid-url')).rejects.toThrow();
      } finally {
        global.Image = originalImage;
      }
    });
  });

  describe('processImage', () => {
    it('should handle invalid inputs', () => {
      expect(() => (processImage as (img: unknown) => unknown)(null)).toThrow();
    });
  });
});
