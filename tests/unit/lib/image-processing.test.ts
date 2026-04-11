import { describe, it, expect } from 'vitest';
import { loadImage, processImage } from '@/lib/image-processing';

describe('image-processing', () => {
  describe('loadImage', () => {
    it('should reject invalid URLs', async () => {
      // Create a mock Image that fails to load
      const originalImage = global.Image;
      global.Image = class {
        onerror: (() => void) | null = null;
        set src(value: string) {
          setTimeout(() => {
            if (this.onerror) this.onerror();
          }, 10);
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
