/**
 * EasyDraw Engine Tests
 *
 * Tests for segment creation and bend-to-curve algorithm.
 */

import { describe, it, expect } from 'vitest';
import {
  createSegment,
  distance,
  projectPointToSegment,
  closestPointOnSegment,
  calculateBendControlPoint,
  createBentSegment,
  reBendSegment,
  makeStraight,
  evaluateQuadraticBezier,
  segmentToSvgPath,
  subdivideSegment,
  hitTestSegment,
  findSegmentAtPoint,
} from '@/lib/easydraw-engine';
import type { Point } from '@/lib/easydraw-engine';

describe('easydraw-engine', () => {
  describe('createSegment', () => {
    it('should create a straight segment with given endpoints', () => {
      const start: Point = { x: 0, y: 0 };
      const end: Point = { x: 100, y: 100 };
      const segment = createSegment(start, end);

      expect(segment.type).toBe('straight');
      expect(segment.start).toEqual(start);
      expect(segment.end).toEqual(end);
    });
  });

  describe('distance', () => {
    it('should calculate Euclidean distance between two points', () => {
      expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
      expect(distance({ x: 0, y: 0 }, { x: 10, y: 0 })).toBe(10);
      expect(distance({ x: 5, y: 5 }, { x: 5, y: 5 })).toBe(0);
    });
  });

  describe('projectPointToSegment', () => {
    it('should project a point onto a segment', () => {
      const a: Point = { x: 0, y: 0 };
      const b: Point = { x: 100, y: 0 };

      // Point above midpoint
      const result = projectPointToSegment({ x: 50, y: 50 }, a, b);
      expect(result.point.x).toBe(50);
      expect(result.point.y).toBe(0);
      expect(result.t).toBe(0.5);
    });

    it('should clamp t to [0, 1]', () => {
      const a: Point = { x: 0, y: 0 };
      const b: Point = { x: 100, y: 0 };

      // Point before A
      const before = projectPointToSegment({ x: -50, y: 0 }, a, b);
      expect(before.t).toBe(0);
      expect(before.point).toEqual(a);

      // Point after B
      const after = projectPointToSegment({ x: 150, y: 0 }, a, b);
      expect(after.t).toBe(1);
      expect(after.point).toEqual(b);
    });

    it('should handle zero-length segment', () => {
      const a: Point = { x: 50, y: 50 };
      const result = projectPointToSegment({ x: 100, y: 100 }, a, a);
      expect(result.t).toBe(0);
      expect(result.point).toEqual(a);
    });
  });

  describe('closestPointOnSegment', () => {
    it('should return closest point and distance', () => {
      const a: Point = { x: 0, y: 0 };
      const b: Point = { x: 100, y: 0 };

      const result = closestPointOnSegment({ x: 50, y: 30 }, a, b);
      expect(result.point).toEqual({ x: 50, y: 0 });
      expect(result.distance).toBe(30);
      expect(result.t).toBe(0.5);
    });
  });

  describe('calculateBendControlPoint', () => {
    it('should calculate control point for quadratic bezier', () => {
      const a: Point = { x: 0, y: 0 };
      const b: Point = { x: 100, y: 0 };
      const p2: Point = { x: 50, y: 50 }; // Curve bulges up to y=50 at midpoint

      const controlPoint = calculateBendControlPoint(a, b, 0.5, p2);

      // For t=0.5: C = 2*P2 - 0.5*A - 0.5*B
      expect(controlPoint.x).toBe(50);
      expect(controlPoint.y).toBe(100);
    });

    it('should handle t near 0 with epsilon fallback', () => {
      const a: Point = { x: 0, y: 0 };
      const b: Point = { x: 100, y: 0 };
      const p2: Point = { x: 50, y: 50 };

      const controlPoint = calculateBendControlPoint(a, b, 0.0001, p2);

      // Should use midpoint fallback
      expect(controlPoint.x).toBeGreaterThan(0);
      expect(controlPoint.y).toBeGreaterThan(0);
    });

    it('should handle t near 1 with epsilon fallback', () => {
      const a: Point = { x: 0, y: 0 };
      const b: Point = { x: 100, y: 0 };
      const p2: Point = { x: 50, y: 50 };

      const controlPoint = calculateBendControlPoint(a, b, 0.9999, p2);

      // Should use midpoint fallback
      expect(controlPoint.x).toBeGreaterThan(0);
      expect(controlPoint.y).toBeGreaterThan(0);
    });
  });

  describe('createBentSegment', () => {
    it('should create a bent segment from straight endpoints', () => {
      const a: Point = { x: 0, y: 0 };
      const b: Point = { x: 100, y: 0 };
      const clickPoint: Point = { x: 50, y: 0 }; // Click at midpoint
      const dragPoint: Point = { x: 50, y: 50 }; // Drag up

      const bent = createBentSegment(a, b, clickPoint, dragPoint);

      expect(bent.type).toBe('bent');
      expect(bent.a).toEqual(a);
      expect(bent.b).toEqual(b);
      expect(bent.t).toBe(0.5);
      expect(bent.p2).toEqual(dragPoint);
      expect(bent.controlPoint).toBeDefined();
    });

    it('should calculate t from click point projection', () => {
      const a: Point = { x: 0, y: 0 };
      const b: Point = { x: 100, y: 0 };
      const clickPoint: Point = { x: 75, y: 0 }; // Click at 75% along
      const dragPoint: Point = { x: 50, y: 50 };

      const bent = createBentSegment(a, b, clickPoint, dragPoint);

      expect(bent.t).toBe(0.75);
    });
  });

  describe('reBendSegment', () => {
    it('should create new bent segment with new drag point', () => {
      const original: Point = { x: 0, y: 0 };
      const end: Point = { x: 100, y: 0 };
      const bent = createBentSegment(
        original,
        end,
        { x: 50, y: 0 },
        { x: 50, y: 50 }
      );

      const reBent = reBendSegment(
        bent,
        { x: 50, y: 0 }, // Click at midpoint again
        { x: 50, y: -30 } // Drag down instead
      );

      expect(reBent.type).toBe('bent');
      expect(reBent.a).toEqual(original);
      expect(reBent.b).toEqual(end);
      expect(reBent.p2).toEqual({ x: 50, y: -30 });
      // Control point should be different
      expect(reBent.controlPoint.y).toBeLessThan(0);
    });
  });

  describe('makeStraight', () => {
    it('should convert bent segment back to straight', () => {
      const bent = createBentSegment(
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 50, y: 0 },
        { x: 50, y: 50 }
      );

      const straight = makeStraight(bent);

      expect(straight.type).toBe('straight');
      expect(straight.start).toEqual({ x: 0, y: 0 });
      expect(straight.end).toEqual({ x: 100, y: 0 });
    });
  });

  describe('evaluateQuadraticBezier', () => {
    it('should evaluate curve at t=0 as start point', () => {
      const a: Point = { x: 0, y: 0 };
      const c: Point = { x: 50, y: 100 };
      const b: Point = { x: 100, y: 0 };

      const result = evaluateQuadraticBezier(a, c, b, 0);
      expect(result).toEqual(a);
    });

    it('should evaluate curve at t=1 as end point', () => {
      const a: Point = { x: 0, y: 0 };
      const c: Point = { x: 50, y: 100 };
      const b: Point = { x: 100, y: 0 };

      const result = evaluateQuadraticBezier(a, c, b, 1);
      expect(result).toEqual(b);
    });

    it('should evaluate curve at t=0.5 at correct position', () => {
      const a: Point = { x: 0, y: 0 };
      const c: Point = { x: 50, y: 100 };
      const b: Point = { x: 100, y: 0 };

      const result = evaluateQuadraticBezier(a, c, b, 0.5);
      // B(0.5) = 0.25*A + 0.5*C + 0.25*B
      expect(result.x).toBe(50);
      expect(result.y).toBe(50);
    });
  });

  describe('segmentToSvgPath', () => {
    it('should generate correct path for straight segment', () => {
      const segment = createSegment({ x: 0, y: 0 }, { x: 100, y: 100 });
      const path = segmentToSvgPath(segment);

      expect(path).toBe('M 0 0 L 100 100');
    });

    it('should generate correct path for bent segment', () => {
      const bent = createBentSegment(
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 50, y: 0 },
        { x: 50, y: 50 }
      );
      const path = segmentToSvgPath(bent);

      expect(path).toMatch(/^M 0 0 Q [\d.]+ [\d.]+ 100 0$/);
    });
  });

  describe('subdivideSegment', () => {
    it('should return endpoints for straight segment', () => {
      const segment = createSegment({ x: 0, y: 0 }, { x: 100, y: 0 });
      const points = subdivideSegment(segment);

      expect(points).toHaveLength(2);
      expect(points[0]).toEqual({ x: 0, y: 0 });
      expect(points[1]).toEqual({ x: 100, y: 0 });
    });

    it('should subdivide bent segment with specified subdivisions', () => {
      const bent = createBentSegment(
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 50, y: 0 },
        { x: 50, y: 50 }
      );
      const points = subdivideSegment(bent, 4);

      expect(points).toHaveLength(5); // start + 3 intermediate + end
      expect(points[0]).toEqual({ x: 0, y: 0 });
      expect(points[4]).toEqual({ x: 100, y: 0 });
      // Middle points should be on the curve
      expect(points[2].x).toBe(50);
      expect(points[2].y).toBeGreaterThan(0);
    });
  });

  describe('hitTestSegment', () => {
    it('should detect hit on straight segment within threshold', () => {
      const segment = createSegment({ x: 0, y: 0 }, { x: 100, y: 0 });

      expect(hitTestSegment({ x: 50, y: 5 }, segment, 10)).toBe(true);
      expect(hitTestSegment({ x: 50, y: 20 }, segment, 10)).toBe(false);
    });

    it('should detect hit on bent segment within threshold', () => {
      const bent = createBentSegment(
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 50, y: 0 },
        { x: 50, y: 50 }
      );

      expect(hitTestSegment({ x: 50, y: 45 }, bent, 10)).toBe(true);
      expect(hitTestSegment({ x: 50, y: 100 }, bent, 10)).toBe(false);
    });
  });

  describe('findSegmentAtPoint', () => {
    it('should return index of segment under point', () => {
      const segments = [
        createSegment({ x: 0, y: 0 }, { x: 100, y: 0 }),
        createSegment({ x: 100, y: 0 }, { x: 100, y: 100 }),
      ];

      const index = findSegmentAtPoint({ x: 50, y: 5 }, segments, 10);
      expect(index).toBe(0);

      const index2 = findSegmentAtPoint({ x: 105, y: 50 }, segments, 10);
      expect(index2).toBe(1);
    });

    it('should return -1 when no segment is under point', () => {
      const segments = [createSegment({ x: 0, y: 0 }, { x: 100, y: 0 })];

      const index = findSegmentAtPoint({ x: 50, y: 100 }, segments, 10);
      expect(index).toBe(-1);
    });
  });
});
