import { describe, it, expect, vi } from 'vitest';
import {
  filterContoursByArea,
  extractDominantColor,
  roundToEighthNearest,
  formatFraction,
  offsetPolygon,
} from '@/lib/piece-detection-utils';

describe('piece-detection-utils', () => {
  describe('filterContoursByArea', () => {
    it('filters by area ratio', () => {
      const areas = [100, 5000, 10000];
      const result = filterContoursByArea(areas, 10000, 0.05, 0.5);
      expect(result).toEqual([false, true, false]);
    });
  });

  describe('extractDominantColor', () => {
    it('returns hex color from pixel array', () => {
      const pixels = new Uint8ClampedArray([200, 100, 50, 255, 200, 100, 50, 255]);
      const result = extractDominantColor(pixels, 2, 1);
      expect(result).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it('returns black for empty region', () => {
      const pixels = new Uint8ClampedArray(0);
      expect(extractDominantColor(pixels, 0, 0)).toBe('#000000');
    });
  });

  describe('roundToEighthNearest', () => {
    it('rounds to nearest eighth', () => {
      expect(roundToEighthNearest(0.12)).toBe(0.125);
      expect(roundToEighthNearest(0.124)).toBe(0.125);
      expect(roundToEighthNearest(0.13)).toBe(0.125);
    });
  });

  describe('formatFraction', () => {
    it('formats whole numbers', () => {
      expect(formatFraction(3)).toBe('3');
    });

    it('formats fractions', () => {
      expect(formatFraction(0.125)).toBe('1/8');
    });

    it('formats mixed numbers', () => {
      expect(formatFraction(2.125)).toBe('2 1/8');
    });

    it('uses custom separator', () => {
      expect(formatFraction(2.125, '-')).toBe('2-1/8');
    });

    it('simplifies fractions', () => {
      expect(formatFraction(0.25)).toBe('1/4');
    });
  });

  describe('offsetPolygon', () => {
    it('returns same polygon for zero offset', () => {
      const contour = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 }];
      const result = offsetPolygon(contour, 0);
      expect(result).toHaveLength(4);
    });

    it('returns original for less than 3 points', () => {
      expect(offsetPolygon([{ x: 0, y: 0 }], 1)).toHaveLength(1);
      expect(offsetPolygon([], 1)).toHaveLength(0);
    });

    it('returns empty for empty solution', () => {
      const contour = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 50, y: 100 }];
      const result = offsetPolygon(contour, 1000);
      expect(result).toHaveLength(4);
    });
  });
});