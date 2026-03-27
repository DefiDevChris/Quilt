import { describe, it, expect } from 'vitest';
import { isValidImageType, clampOpacity } from '@/lib/image-tracing-utils';

describe('image-tracing-utils', () => {
  describe('isValidImageType', () => {
    it('accepts image/jpeg', () => {
      expect(isValidImageType('image/jpeg')).toBe(true);
    });

    it('accepts image/png', () => {
      expect(isValidImageType('image/png')).toBe(true);
    });

    it('accepts image/webp', () => {
      expect(isValidImageType('image/webp')).toBe(true);
    });

    it('rejects image/gif', () => {
      expect(isValidImageType('image/gif')).toBe(false);
    });

    it('rejects image/svg+xml', () => {
      expect(isValidImageType('image/svg+xml')).toBe(false);
    });

    it('rejects image/bmp', () => {
      expect(isValidImageType('image/bmp')).toBe(false);
    });

    it('rejects application/pdf', () => {
      expect(isValidImageType('application/pdf')).toBe(false);
    });

    it('rejects empty string', () => {
      expect(isValidImageType('')).toBe(false);
    });

    it('rejects text/plain', () => {
      expect(isValidImageType('text/plain')).toBe(false);
    });
  });

  describe('clampOpacity', () => {
    it('returns 0 for value 0', () => {
      expect(clampOpacity(0)).toBe(0);
    });

    it('returns 1 for value 1', () => {
      expect(clampOpacity(1)).toBe(1);
    });

    it('returns value unchanged for 0.5', () => {
      expect(clampOpacity(0.5)).toBe(0.5);
    });

    it('returns value unchanged for 0.1', () => {
      expect(clampOpacity(0.1)).toBeCloseTo(0.1);
    });

    it('clamps negative values to 0', () => {
      expect(clampOpacity(-0.5)).toBe(0);
    });

    it('clamps large negative to 0', () => {
      expect(clampOpacity(-100)).toBe(0);
    });

    it('clamps values above 1 to 1', () => {
      expect(clampOpacity(1.5)).toBe(1);
    });

    it('clamps large positive to 1', () => {
      expect(clampOpacity(100)).toBe(1);
    });

    it('preserves precision for small values', () => {
      expect(clampOpacity(0.01)).toBeCloseTo(0.01);
    });

    it('preserves precision for values near 1', () => {
      expect(clampOpacity(0.99)).toBeCloseTo(0.99);
    });
  });
});
