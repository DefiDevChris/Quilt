import { describe, it, expect } from 'vitest';
import { addBoundarySegments, detectPatches } from '@/lib/easydraw-utils';

describe('easydraw-utils', () => {
  describe('addBoundarySegments', () => {
    it('throws for non-finite grid dimensions', () => {
      expect(() => addBoundarySegments(Infinity, 5)).toThrow('must be finite numbers');
      expect(() => addBoundarySegments(5, NaN)).toThrow('must be finite numbers');
    });

    it('returns empty array for non-positive grid dimensions', () => {
      expect(addBoundarySegments(0, 5)).toEqual([]);
      expect(addBoundarySegments(5, 0)).toEqual([]);
    });

    it('generates boundary segments for valid grid', () => {
      const segments = addBoundarySegments(2, 2);
      expect(segments.length).toBeGreaterThan(0);
    });
  });

  describe('detectPatches', () => {
    it('handles arc segments', () => {
      const segments = [
        {
          from: { row: 0, col: 0 },
          to: { row: 1, col: 1 },
          center: { row: 0.5, col: 0.5 },
          radius: 0.5,
          startAngle: 0,
          endAngle: Math.PI / 2,
        },
      ];
      const patches = detectPatches(segments as never, 2, 2);
      expect(patches).toBeDefined();
    });
  });
});