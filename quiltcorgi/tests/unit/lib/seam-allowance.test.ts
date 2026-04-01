import { describe, it, expect, vi } from 'vitest';
import ClipperLib from 'clipper-lib';
import { svgPathToPolyline, computeSeamOffset } from '@/lib/seam-allowance';

describe('seam-allowance', () => {
  describe('svgPathToPolyline', () => {
    it('handles arc commands', () => {
      const path = 'M 0 0 A 10 10 0 0 0 10 0';
      const points = svgPathToPolyline(path);
      expect(points.length).toBeGreaterThan(1);
      expect(points[points.length - 1]).toEqual({ x: 10, y: 0 });
    });
  });

  describe('computeSeamOffset', () => {
    it('returns original points when no solution', () => {
      const points = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }];
      vi.spyOn(ClipperLib.ClipperOffset.prototype, 'Execute').mockImplementation((solution) => {
        solution.length = 0;
      });
      const result = computeSeamOffset(points, 0.5);
      expect(result).toEqual(points);
    });

    it('returns largest offset polygon by area', () => {
      const points = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 0, y: 10 }];
      vi.spyOn(ClipperLib.ClipperOffset.prototype, 'Execute').mockImplementation((solution) => {
        solution.push([{ X: 0, Y: 0 }, { X: 10000, Y: 0 }, { X: 0, Y: 10000 }]); // small area
        solution.push([{ X: -5000, Y: -5000 }, { X: 15000, Y: -5000 }, { X: -5000, Y: 15000 }]); // large area
      });
      vi.spyOn(ClipperLib.JS, 'AreaOfPolygon').mockImplementation((path) => {
        if (path[0].X === 0) return 50000000; // small
        return 225000000; // large
      });
      const result = computeSeamOffset(points, 0.5);
      expect(result).toEqual([{ x: -5, y: -5 }, { x: 15, y: -5 }, { x: -5, y: 15 }]);
    });
  });
});
