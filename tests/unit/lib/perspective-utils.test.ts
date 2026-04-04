import { describe, it, expect } from 'vitest';
import { sortCornersClockwise } from '@/lib/perspective-utils';
import type { Point2D } from '@/lib/photo-pattern-types';

describe('sortCornersClockwise', () => {
  it('sorts corners into clockwise order: TL, TR, BR, BL', () => {
    const corners: [Point2D, Point2D, Point2D, Point2D] = [
      { x: 100, y: 300 },
      { x: 300, y: 300 },
      { x: 300, y: 100 },
      { x: 100, y: 100 },
    ];
    const sorted = sortCornersClockwise(corners);
    expect(sorted).not.toBeNull();
    if (sorted) {
      expect(sorted[0]).toEqual({ x: 100, y: 100 });
      expect(sorted[1]).toEqual({ x: 300, y: 100 });
      expect(sorted[2]).toEqual({ x: 300, y: 300 });
      expect(sorted[3]).toEqual({ x: 100, y: 300 });
    }
  });

  it('handles shuffled corners correctly', () => {
    const corners: [Point2D, Point2D, Point2D, Point2D] = [
      { x: 300, y: 300 },
      { x: 100, y: 100 },
      { x: 100, y: 300 },
      { x: 300, y: 100 },
    ];
    const sorted = sortCornersClockwise(corners);
    expect(sorted).not.toBeNull();
    if (sorted) {
      expect(sorted[0]).toEqual({ x: 100, y: 100 });
      expect(sorted[1]).toEqual({ x: 300, y: 100 });
      expect(sorted[2]).toEqual({ x: 300, y: 300 });
      expect(sorted[3]).toEqual({ x: 100, y: 300 });
    }
  });

  it('returns null for degenerate corners (45 degree rotation)', () => {
    const corners: [Point2D, Point2D, Point2D, Point2D] = [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 1, y: 1 },
      { x: 0, y: 0 },
    ];
    expect(sortCornersClockwise(corners)).toBeNull();
  });

  it('handles corners at origin', () => {
    const corners: [Point2D, Point2D, Point2D, Point2D] = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ];
    const sorted = sortCornersClockwise(corners);
    expect(sorted).not.toBeNull();
    if (sorted) {
      expect(sorted[0]).toEqual({ x: 0, y: 0 });
      expect(sorted[1]).toEqual({ x: 100, y: 0 });
      expect(sorted[2]).toEqual({ x: 100, y: 100 });
      expect(sorted[3]).toEqual({ x: 0, y: 100 });
    }
  });

  it('handles floating point coordinates', () => {
    const corners: [Point2D, Point2D, Point2D, Point2D] = [
      { x: 10.5, y: 20.3 },
      { x: 100.7, y: 20.1 },
      { x: 100.2, y: 99.8 },
      { x: 10.9, y: 100.1 },
    ];
    const sorted = sortCornersClockwise(corners);
    expect(sorted).not.toBeNull();
    if (sorted) {
      expect(sorted[0].x).toBeCloseTo(10.5);
      expect(sorted[0].y).toBeCloseTo(20.3);
    }
  });
});
