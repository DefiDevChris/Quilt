import { describe, it, expect } from 'vitest';
import {
  buildBezierPathString,
  quadraticBezierPoint,
  subdivideBezier,
  snapPathPoints,
} from '@/lib/bezier-utils';

describe('quadraticBezierPoint', () => {
  it('returns start point at t=0', () => {
    const result = quadraticBezierPoint({ x: 0, y: 0 }, { x: 50, y: 100 }, { x: 100, y: 0 }, 0);
    expect(result.x).toBeCloseTo(0);
    expect(result.y).toBeCloseTo(0);
  });

  it('returns end point at t=1', () => {
    const result = quadraticBezierPoint({ x: 0, y: 0 }, { x: 50, y: 100 }, { x: 100, y: 0 }, 1);
    expect(result.x).toBeCloseTo(100);
    expect(result.y).toBeCloseTo(0);
  });

  it('returns midpoint correctly at t=0.5', () => {
    // P(0.5) = 0.25*A + 0.5*C + 0.25*B
    const A = { x: 0, y: 0 };
    const C = { x: 50, y: 100 };
    const B = { x: 100, y: 0 };
    const result = quadraticBezierPoint(A, C, B, 0.5);
    expect(result.x).toBeCloseTo(50);
    expect(result.y).toBeCloseTo(50);
  });
});

describe('subdivideBezier', () => {
  it('returns correct number of intermediate points', () => {
    const A = { x: 0, y: 0 };
    const C = { x: 50, y: 100 };
    const B = { x: 100, y: 0 };
    const points = subdivideBezier(A, C, B, 12);
    expect(points).toHaveLength(11); // excludes start and end
  });

  it('returns empty array for subdivisions=1', () => {
    const points = subdivideBezier({ x: 0, y: 0 }, { x: 50, y: 50 }, { x: 100, y: 0 }, 1);
    expect(points).toHaveLength(0);
  });

  it('points are between start and end', () => {
    const A = { x: 0, y: 0 };
    const C = { x: 50, y: 100 };
    const B = { x: 100, y: 0 };
    const points = subdivideBezier(A, C, B, 10);
    for (const p of points) {
      expect(p.x).toBeGreaterThan(0);
      expect(p.x).toBeLessThan(100);
    }
  });
});

describe('buildBezierPathString', () => {
  it('generates valid SVG path with Q command', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ];
    const control = { x: 50, y: -50 };
    const path = buildBezierPathString(points, 0, control);
    expect(path).toContain('M 0 0');
    expect(path).toContain('Q 50 -50 100 0');
    expect(path).toContain('Z');
  });

  it('replaces only the specified edge', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
    ];
    const control = { x: 50, y: 50 };
    const path = buildBezierPathString(points, 1, control);
    // Edge 1 is from point[1] to point[2], should have Q command
    expect(path).toContain('Q 50 50 100 100');
    // Edge 0 is a regular line
    expect(path).toContain('L 100 0');
  });

  it('returns empty string for less than 2 points', () => {
    expect(buildBezierPathString([{ x: 0, y: 0 }], 0, { x: 50, y: 50 })).toBe('');
  });
});

describe('snapPathPoints', () => {
  it('snaps numeric values using the provided function', () => {
    const pathData = [
      ['M', 10.3, 20.7],
      ['L', 50.1, 60.9],
    ];
    const snapFn = (val: number) => Math.round(val);
    const result = snapPathPoints(pathData, snapFn);
    expect(result[0]).toEqual(['M', 10, 21]);
    expect(result[1]).toEqual(['L', 50, 61]);
  });

  it('preserves string command values', () => {
    const pathData = [['M', 10, 20], ['Q', 30, 40, 50, 60]];
    const snapFn = (val: number) => Math.round(val / 10) * 10;
    const result = snapPathPoints(pathData, snapFn);
    expect(result[0][0]).toBe('M');
    expect(result[1][0]).toBe('Q');
  });

  it('handles empty path data', () => {
    expect(snapPathPoints([], (v) => v)).toEqual([]);
  });
});
