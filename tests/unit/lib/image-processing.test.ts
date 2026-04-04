import { describe, it, expect } from 'vitest';
import { loadImage, processImage } from '@/lib/image-processing';

describe('image-processing', () => {
  describe('loadImage', () => {
    it('should reject invalid URLs', async () => {
      await expect(loadImage('')).rejects.toThrow();
      await expect(loadImage('invalid-url')).rejects.toThrow();
    });
  });

  describe('processImage', () => {
    it('should handle invalid inputs', () => {
      expect(() => (processImage as (img: unknown) => unknown)(null)).toThrow();
    });
  });
});
