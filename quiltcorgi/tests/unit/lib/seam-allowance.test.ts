import { describe, it, expect } from 'vitest';
import {
  svgPathToPolyline,
  extractPathFromSvg,
  computeSeamOffset,
  computeSeamAllowance,
} from '@/lib/seam-allowance';

describe('seam-allowance', () => {
  describe('extractPathFromSvg', () => {
    it('extracts d attribute from SVG path element', () => {
      const svg = '<path d="M 0 0 L 100 0 L 100 100 L 0 100 Z"/>';
      expect(extractPathFromSvg(svg)).toBe('M 0 0 L 100 0 L 100 100 L 0 100 Z');
    });

    it('extracts d attribute from full SVG', () => {
      const svg = '<svg viewBox="0 0 100 100"><path d="M 0 0 L 50 50"/></svg>';
      expect(extractPathFromSvg(svg)).toBe('M 0 0 L 50 50');
    });

    it('returns null when no path found', () => {
      expect(extractPathFromSvg('<rect width="100"/>')).toBeNull();
    });
  });

  describe('svgPathToPolyline', () => {
    it('converts M L path to polyline', () => {
      const points = svgPathToPolyline('M 0 0 L 100 0 L 100 100 L 0 100 Z');
      expect(points.length).toBe(4);
      expect(points[0]).toEqual({ x: 0, y: 0 });
      expect(points[1]).toEqual({ x: 100, y: 0 });
      expect(points[2]).toEqual({ x: 100, y: 100 });
      expect(points[3]).toEqual({ x: 0, y: 100 });
    });

    it('handles H and V commands', () => {
      const points = svgPathToPolyline('M 0 0 H 50 V 50 H 0 Z');
      expect(points.length).toBe(4);
      expect(points[0]).toEqual({ x: 0, y: 0 });
      expect(points[1]).toEqual({ x: 50, y: 0 });
      expect(points[2]).toEqual({ x: 50, y: 50 });
      expect(points[3]).toEqual({ x: 0, y: 50 });
    });

    it('handles relative commands', () => {
      const points = svgPathToPolyline('M 0 0 l 100 0 l 0 100 z');
      expect(points.length).toBe(3);
      expect(points[0]).toEqual({ x: 0, y: 0 });
      expect(points[1]).toEqual({ x: 100, y: 0 });
      expect(points[2]).toEqual({ x: 100, y: 100 });
    });

    it('approximates cubic bezier curves', () => {
      const points = svgPathToPolyline('M 0 0 C 50 0 100 50 100 100');
      // 1 start point + 16 curve samples
      expect(points.length).toBe(17);
      // First point is the start
      expect(points[0]).toEqual({ x: 0, y: 0 });
      // Last point is the end
      expect(points[16].x).toBeCloseTo(100, 1);
      expect(points[16].y).toBeCloseTo(100, 1);
    });

    it('approximates quadratic bezier curves', () => {
      const points = svgPathToPolyline('M 0 0 Q 50 50 100 0');
      // 1 start point + 16 curve samples
      expect(points.length).toBe(17);
      expect(points[0]).toEqual({ x: 0, y: 0 });
      expect(points[16].x).toBeCloseTo(100, 1);
      expect(points[16].y).toBeCloseTo(0, 1);
    });

    it('handles triangle path', () => {
      const points = svgPathToPolyline('M 50 0 L 100 100 L 0 100 Z');
      expect(points.length).toBe(3);
      expect(points[0]).toEqual({ x: 50, y: 0 });
      expect(points[1]).toEqual({ x: 100, y: 100 });
      expect(points[2]).toEqual({ x: 0, y: 100 });
    });
  });

  describe('computeSeamOffset', () => {
    it('offsets a square outward', () => {
      const square = [
        { x: 0, y: 0 },
        { x: 2, y: 0 },
        { x: 2, y: 2 },
        { x: 0, y: 2 },
      ];
      const offset = computeSeamOffset(square, 0.25);
      // Offset square should be larger
      const minX = Math.min(...offset.map((p) => p.x));
      const maxX = Math.max(...offset.map((p) => p.x));
      const minY = Math.min(...offset.map((p) => p.y));
      const maxY = Math.max(...offset.map((p) => p.y));

      // Width should increase by roughly 2 * seamAllowance
      expect(maxX - minX).toBeGreaterThan(2);
      expect(maxY - minY).toBeGreaterThan(2);
      expect(maxX - minX).toBeCloseTo(2.5, 0);
      expect(maxY - minY).toBeCloseTo(2.5, 0);
    });

    it('returns original points for zero seam allowance', () => {
      const square = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 1, y: 1 },
        { x: 0, y: 1 },
      ];
      const result = computeSeamOffset(square, 0);
      expect(result).toEqual(square);
    });

    it('returns original points for fewer than 3 points', () => {
      const line = [{ x: 0, y: 0 }, { x: 1, y: 0 }];
      const result = computeSeamOffset(line, 0.25);
      expect(result).toEqual(line);
    });

    it('offsets a triangle outward', () => {
      const triangle = [
        { x: 1, y: 0 },
        { x: 2, y: 2 },
        { x: 0, y: 2 },
      ];
      const offset = computeSeamOffset(triangle, 0.25);
      const minY = Math.min(...offset.map((p) => p.y));
      // Top vertex should be higher (lower y) than original
      expect(minY).toBeLessThan(0);
    });
  });

  describe('computeSeamAllowance', () => {
    it('returns null for SVG without path', () => {
      expect(computeSeamAllowance('<rect/>', 0.25)).toBeNull();
    });

    it('returns cut and seam lines for a square SVG', () => {
      const svg = '<path d="M 0 0 L 96 0 L 96 96 L 0 96 Z"/>';
      const result = computeSeamAllowance(svg, 0.25, 1 / 96);
      expect(result).not.toBeNull();
      expect(result!.cutLine.length).toBe(4);
      expect(result!.seamLine.length).toBeGreaterThan(0);
    });

    it('applies scale factor to convert SVG units to inches', () => {
      const svg = '<path d="M 0 0 L 96 0 L 96 96 L 0 96 Z"/>';
      const result = computeSeamAllowance(svg, 0.25, 1 / 96);
      // At scale 1/96, 96 SVG units = 1 inch
      expect(result!.cutLine[1].x).toBeCloseTo(1, 5);
    });
  });
});
