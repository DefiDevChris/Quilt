import { afterEach, describe, it, expect, vi } from 'vitest';
import ClipperLib from 'clipper-lib';
import { svgPathToPolyline, computeSeamOffset } from '@/lib/seam-allowance';

describe('seam-allowance', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('svgPathToPolyline', () => {
    it('handles arc commands', () => {
      const path = 'M 0 0 A 10 10 0 0 0 10 0';
      const points = svgPathToPolyline(path);
      expect(points.length).toBeGreaterThan(1);
      expect(points[points.length - 1]).toEqual({ x: 10, y: 0 });
    });
  });

  describe('computeSeamOffset', () => {
    it('produces miter (sharp) corners for square shapes', () => {
      // 1" square in inches
      const square = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 1, y: 1 },
        { x: 0, y: 1 },
      ];
      const result = computeSeamOffset(square, 0.25);

      // With jtMiter, the offset of a square should produce another rectangle
      // with sharp corners (4 vertices), not rounded corners (many vertices)
      expect(result.length).toBe(4);

      // Each corner should extend exactly by the seam allowance in both directions
      // The bounding box should be 1.5" x 1.5" (1" + 0.25*2)
      const xs = result.map((p) => p.x);
      const ys = result.map((p) => p.y);
      const width = Math.max(...xs) - Math.min(...xs);
      const height = Math.max(...ys) - Math.min(...ys);
      expect(width).toBeCloseTo(1.5, 1);
      expect(height).toBeCloseTo(1.5, 1);
    });

    it('produces sharp corners for right triangles (HST)', () => {
      // Right triangle with 1" legs
      const triangle = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 0, y: 1 },
      ];
      const result = computeSeamOffset(triangle, 0.25);

      // With jtMiter, right-angle corners stay sharp (1 vertex each)
      // while the acute hypotenuse angle gets miter-clipped into 2 vertices
      // (the "dog ear" trim quilters expect). Total: 3 + 2 = 5 vertices.
      expect(result.length).toBe(5);
      // Still far fewer than jtRound which would produce many interpolated vertices
    });

    it('returns original points when no solution', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 0, y: 1 },
      ];
      vi.spyOn(ClipperLib.ClipperOffset.prototype, 'Execute').mockImplementation((solution) => {
        solution.length = 0;
      });
      const result = computeSeamOffset(points, 0.5);
      expect(result).toEqual(points);
    });

    it('returns largest offset polygon by area', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 0, y: 10 },
      ];
      vi.spyOn(ClipperLib.ClipperOffset.prototype, 'Execute').mockImplementation((solution) => {
        solution.push([
          { X: 0, Y: 0 },
          { X: 10000, Y: 0 },
          { X: 0, Y: 10000 },
        ]); // small area
        solution.push([
          { X: -5000, Y: -5000 },
          { X: 15000, Y: -5000 },
          { X: -5000, Y: 15000 },
        ]); // large area
      });
      vi.spyOn(ClipperLib.JS, 'AreaOfPolygon').mockImplementation((path) => {
        if (path[0].X === 0) return 50000000; // small
        return 225000000; // large
      });
      const result = computeSeamOffset(points, 0.5);
      expect(result).toEqual([
        { x: -5, y: -5 },
        { x: 15, y: -5 },
        { x: -5, y: 15 },
      ]);
    });
  });
});
