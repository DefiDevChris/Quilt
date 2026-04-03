import { describe, it, expect } from 'vitest';
import {
  boundingBoxFromPoints,
  boundingBoxFromPaths,
  extractObjectGeometry,
} from '@/lib/geometry-extraction';

describe('geometry-extraction', () => {
  describe('boundingBoxFromPoints', () => {
    it('returns empty bbox for empty array', () => {
      const result = boundingBoxFromPoints([]);
      expect(result).toEqual({ x: 0, y: 0, width: 0, height: 0 });
    });

    it('calculates bbox from single point', () => {
      const result = boundingBoxFromPoints([{ x: 10, y: 20 }]);
      expect(result).toEqual({ x: 10, y: 20, width: 0, height: 0 });
    });

    it('calculates bbox from multiple points', () => {
      const result = boundingBoxFromPoints([
        { x: 10, y: 20 },
        { x: 50, y: 80 },
        { x: 30, y: 40 },
      ]);
      expect(result).toEqual({ x: 10, y: 20, width: 40, height: 60 });
    });
  });

  describe('boundingBoxFromPaths', () => {
    it('returns empty bbox for empty array', () => {
      const result = boundingBoxFromPaths([]);
      expect(result).toEqual({ x: 0, y: 0, width: 0, height: 0 });
    });

    it('returns empty bbox for all empty paths', () => {
      const result = boundingBoxFromPaths([[], []]);
      expect(result).toEqual({ x: 0, y: 0, width: 0, height: 0 });
    });

    it('calculates bbox spanning multiple paths', () => {
      const result = boundingBoxFromPaths([
        [{ x: 0, y: 0 }, { x: 10, y: 0 }],
        [{ x: 50, y: 50 }, { x: 60, y: 60 }],
      ]);
      expect(result).toEqual({ x: 0, y: 0, width: 60, height: 60 });
    });
  });

  describe('extractObjectGeometry', () => {
    it('extracts polygon geometry', () => {
      const obj = {
        type: 'polygon',
        points: [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }],
        left: 5,
        top: 5,
      };
      const result = extractObjectGeometry(obj);
      expect(result[0]).toHaveLength(3);
      expect(result[0][0].x).toBe(5);
    });

    it('extracts rect geometry', () => {
      const obj = { type: 'rect', left: 10, top: 20, width: 100, height: 50, scaleX: 1, scaleY: 1 };
      const result = extractObjectGeometry(obj);
      expect(result[0]).toHaveLength(4);
      expect(result[0][0]).toEqual({ x: 10, y: 20 });
      expect(result[0][2]).toEqual({ x: 110, y: 70 });
    });

    it('extracts triangle geometry', () => {
      const obj = { type: 'triangle', left: 0, top: 0, width: 100, height: 100, scaleX: 1, scaleY: 1 };
      const result = extractObjectGeometry(obj);
      expect(result[0]).toHaveLength(3);
    });

    it('uses getBoundingRect for path/group/circle', () => {
      const obj = { type: 'path', getBoundingRect: () => ({ left: 10, top: 20, width: 100, height: 50 }) };
      const result = extractObjectGeometry(obj);
      expect(result[0]).toHaveLength(4);
    });

    it('returns empty array for unknown type', () => {
      const result = extractObjectGeometry({ type: 'unknown' });
      expect(result).toHaveLength(0);
    });

    it('handles missing properties with defaults', () => {
      const obj = { type: 'rect' };
      const result = extractObjectGeometry(obj);
      expect(result[0]).toHaveLength(4);
    });
  });
});