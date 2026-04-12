import { describe, it, expect } from 'vitest';
import { douglasPeucker, snapAnglesTo45 } from '@/lib/polygon-simplify';
import type { Point2D } from '@/lib/photo-layout-types';

describe('douglasPeucker', () => {
  it('collapses a pixel-stepped straight diagonal to its endpoints', () => {
    // 11 colinear points along y = x. With any positive epsilon, all
    // intermediate points have a perpendicular distance of exactly 0,
    // so they're all dropped — only the two endpoints survive.
    const pts: Point2D[] = [];
    for (let i = 0; i <= 10; i++) pts.push({ x: i, y: i });
    const result = douglasPeucker(pts, 0.5);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ x: 0, y: 0 });
    expect(result[1]).toEqual({ x: 10, y: 10 });
  });

  it('collapses a 40-point square perimeter to its 4 corners + start', () => {
    // Walk the perimeter of a 10×10 square clockwise starting at (0,0)
    // and ending back at (0,0). 41 input points, 5 kept (start, each
    // corner, start repeated).
    const pts: Point2D[] = [];
    for (let i = 0; i <= 10; i++) pts.push({ x: i, y: 0 });      // top
    for (let i = 1; i <= 10; i++) pts.push({ x: 10, y: i });     // right
    for (let i = 1; i <= 10; i++) pts.push({ x: 10 - i, y: 10 }); // bottom
    for (let i = 1; i <= 10; i++) pts.push({ x: 0, y: 10 - i }); // left → (0,0)

    const result = douglasPeucker(pts, 0.5);

    expect(result).toHaveLength(5);
    expect(result[0]).toEqual({ x: 0, y: 0 });
    expect(result[1]).toEqual({ x: 10, y: 0 });
    expect(result[2]).toEqual({ x: 10, y: 10 });
    expect(result[3]).toEqual({ x: 0, y: 10 });
    expect(result[4]).toEqual({ x: 0, y: 0 });
  });

  it('returns the input unchanged when epsilon is 0', () => {
    // Non-colinear input — at epsilon=0 every intermediate point has a
    // non-trivial distance that would normally be kept, but the "no-op
    // short-circuit" path means the function returns a structural copy.
    const pts: Point2D[] = [
      { x: 0, y: 0 },
      { x: 5, y: 3 },
      { x: 10, y: 10 },
      { x: 15, y: 12 },
    ];
    const result = douglasPeucker(pts, 0);
    expect(result).toEqual(pts);
    // And it must be a copy, not the same array reference.
    expect(result).not.toBe(pts);
  });

  it('passes single-point and two-point inputs through unchanged', () => {
    const one: Point2D[] = [{ x: 3, y: 4 }];
    expect(douglasPeucker(one, 1)).toEqual(one);

    const two: Point2D[] = [{ x: 0, y: 0 }, { x: 10, y: 5 }];
    expect(douglasPeucker(two, 1)).toEqual(two);
  });

  it('drops one-off spikes that fall within epsilon', () => {
    // Straight horizontal line with a tiny 0.3px blip at index 2. A
    // small epsilon (0.5) should smooth it out; a tighter one (0.1)
    // should keep it.
    const pts: Point2D[] = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 20, y: 0.3 },
      { x: 30, y: 0 },
      { x: 40, y: 0 },
    ];
    const loose = douglasPeucker(pts, 0.5);
    expect(loose).toHaveLength(2);

    const tight = douglasPeucker(pts, 0.1);
    expect(tight.length).toBeGreaterThan(2);
    expect(tight.some((p) => p.y > 0)).toBe(true);
  });
});

describe('snapAnglesTo45', () => {
  it('snaps a 3°-tilted polyline to horizontal within 5° tolerance', () => {
    // Three points along a 3° slope above the x-axis. After snap every
    // edge is at 0°, and the colinear midpoint is dropped — leaving a
    // clean two-point horizontal segment.
    const slope = Math.tan((3 * Math.PI) / 180);
    const pts: Point2D[] = [
      { x: 0, y: 0 },
      { x: 50, y: 50 * slope },
      { x: 100, y: 100 * slope },
    ];
    const result = snapAnglesTo45(pts, 5);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ x: 0, y: 0 });
    // Last point should have y ≈ 0 (fully axis-aligned).
    expect(Math.abs(result[result.length - 1].y)).toBeLessThan(1e-9);
    // And the polyline length should still roughly match the input
    // (allow 1% drift from floating-point trig).
    const expectedLen = 100 / Math.cos((3 * Math.PI) / 180);
    const actualLen = result[1].x - result[0].x;
    expect(Math.abs(actualLen - expectedLen)).toBeLessThan(expectedLen * 0.01);
  });

  it('leaves a 30° edge untouched when tolerance is only 5°', () => {
    // Zigzag with two 30° edges — 30° is 15° away from the nearest 45°
    // multiple, well outside the 5° snap window. Non-colinear, so no
    // midpoint gets dropped either.
    const pts: Point2D[] = [
      { x: 0, y: 0 },
      { x: 100, y: 57.735 },
      { x: 200, y: 0 },
    ];
    const result = snapAnglesTo45(pts, 5);

    expect(result).toHaveLength(3);
    for (let i = 0; i < pts.length; i++) {
      expect(result[i].x).toBeCloseTo(pts[i].x, 9);
      expect(result[i].y).toBeCloseTo(pts[i].y, 9);
    }
  });

  it('returns a copy for short inputs (<3 points)', () => {
    const one: Point2D[] = [{ x: 1, y: 2 }];
    expect(snapAnglesTo45(one, 5)).toEqual(one);

    const two: Point2D[] = [{ x: 0, y: 0 }, { x: 10, y: 0.5 }];
    const result = snapAnglesTo45(two, 5);
    expect(result).toEqual(two);
    expect(result).not.toBe(two);
  });

  it('snaps a nearly-axis-aligned rectangle to a clean axis-aligned one', () => {
    // Closed near-rectangle with ~1° tilt on every edge. Within a 5°
    // tolerance every edge snaps, the walk reconstructs a rectangle,
    // and colinear-midpoint removal leaves exactly the 4 corners + the
    // repeated start.
    const pts: Point2D[] = [
      { x: 0, y: 0 },
      { x: 100, y: 1 },     // ~0.57° above horizontal
      { x: 101, y: 101 },   // ~89.4° from horizontal
      { x: 1, y: 102 },     // ~-179° (pointing left, near 180°)
      { x: 0, y: 2 },       // ~-90° (pointing up)
    ];
    const result = snapAnglesTo45(pts, 5);

    // All five vertices survive (no colinear runs in a rectangle).
    expect(result).toHaveLength(5);

    // Every edge should be axis-aligned (dx or dy is zero up to tiny
    // floating-point residuals).
    for (let i = 0; i < result.length - 1; i++) {
      const dx = Math.abs(result[i + 1].x - result[i].x);
      const dy = Math.abs(result[i + 1].y - result[i].y);
      const axisAligned = dx < 1e-6 || dy < 1e-6;
      expect(axisAligned).toBe(true);
    }
  });

  it('leaves existing 45°-aligned edges exactly untouched', () => {
    // Perfect 45° edge — snap should be a no-op (it's already on the
    // grid). Verifies the algorithm doesn't drift already-clean data.
    const pts: Point2D[] = [
      { x: 0, y: 0 },
      { x: 10, y: 10 },
      { x: 20, y: 0 },
    ];
    const result = snapAnglesTo45(pts, 5);
    expect(result).toHaveLength(3);
    for (let i = 0; i < pts.length; i++) {
      expect(result[i].x).toBeCloseTo(pts[i].x, 9);
      expect(result[i].y).toBeCloseTo(pts[i].y, 9);
    }
  });
});
