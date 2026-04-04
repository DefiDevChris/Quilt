import { describe, it, expect } from 'vitest';
import { boundingBoxFromPoints, boundingBoxWithMinMax } from '@/lib/geometry-utils';

describe('geometry-utils', () => {
  describe('boundingBoxFromPoints', () => {
    it('returns empty bbox for empty array', () => {
      expect(boundingBoxFromPoints([])).toEqual({ x: 0, y: 0, width: 0, height: 0 });
    });

    it('calculates bbox for single point', () => {
      expect(boundingBoxFromPoints([{ x: 5, y: 10 }])).toEqual({ x: 5, y: 10, width: 0, height: 0 });
    });

    it('calculates bbox for multiple points', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 10, y: 5 },
        { x: 5, y: 15 },
      ];
      expect(boundingBoxFromPoints(points)).toEqual({ x: 0, y: 0, width: 10, height: 15 });
    });
  });

  describe('boundingBoxWithMinMax', () => {
    it('includes minX and minY fields', () => {
      const points = [
        { x: 5, y: 10 },
        { x: 15, y: 20 },
      ];
      const bbox = boundingBoxWithMinMax(points);
      expect(bbox).toEqual({ x: 5, y: 10, width: 10, height: 10, minX: 5, minY: 10 });
    });

    it('handles empty array', () => {
      expect(boundingBoxWithMinMax([])).toEqual({ x: 0, y: 0, width: 0, height: 0, minX: 0, minY: 0 });
    });
  });
});
