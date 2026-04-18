/**
 * EasyDraw Engine — Pure math for segment creation and bend-to-curve algorithm.
 *
 * No DOM or Fabric.js dependencies. All coordinates are in pixels.
 *
 * Phase 8: Simplified EasyDraw + Bend (no bezier handles).
 * - Straight segments between grid corners
 * - Bend via click-drag on segment → single quadratic arc
 */

export type Point = { x: number; y: number };

/**
 * Represents a straight line segment.
 */
export interface EasyDrawSegment {
  type: 'straight';
  start: Point;
  end: Point;
}

/**
 * Represents a bent segment (quadratic arc).
 * Retains original endpoints A, B, parameter t, and drag point P2
 * for re-editing capability.
 */
export interface BentSegment {
  type: 'bent';
  a: Point; // Original start
  b: Point; // Original end
  t: number; // Parameter where click happened on original segment
  p2: Point; // Drag endpoint (curve passes through/bulges toward this)
  controlPoint: Point; // Calculated quadratic bezier control point
}

/**
 * Union type for segment states.
 */
export type Segment = EasyDrawSegment | BentSegment;

/**
 * Create a straight segment between two points.
 */
export function createSegment(start: Point, end: Point): EasyDrawSegment {
  return { type: 'straight', start, end };
}

/**
 * Calculate the distance between two points.
 */
export function distance(p1: Point, p2: Point): number {
  return Math.hypot(p2.x - p1.x, p2.y - p1.y);
}

/**
 * Project point P onto line AB, returning the closest point on the segment
 * and the parameter t [0,1] along the segment.
 */
export function projectPointToSegment(
  p: Point,
  a: Point,
  b: Point
): { point: Point; t: number } {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) {
    return { point: { ...a }, t: 0 };
  }

  // t = ((P - A) · (B - A)) / ||B-A||²
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const proj = {
    x: a.x + t * dx,
    y: a.y + t * dy,
  };

  return { point: proj, t };
}

/**
 * Find the closest point on a segment to a given point.
 * Returns the projected point and parameter t.
 */
export function closestPointOnSegment(
  p: Point,
  a: Point,
  b: Point
): { point: Point; t: number; distance: number } {
  const { point, t } = projectPointToSegment(p, a, b);
  const dist = distance(p, point);
  return { point, t, distance: dist };
}

/**
 * Calculate the quadratic Bezier control point that makes the curve
 * pass through point P2 at parameter t.
 *
 * For a quadratic Bezier from A to B with control point C:
 *   B(t) = (1-t)²·A + 2(1-t)t·C + t²·B
 *
 * Solving for C when B(t) = P2:
 *   C = (P2 - (1-t)²·A - t²·B) / (2·t·(1-t))
 *
 * @param a - Start point of segment
 * @param b - End point of segment
 * @param t - Parameter [0,1] where the curve should pass through p2
 * @param p2 - Target point the curve should pass through/bulge toward
 * @returns Control point for the quadratic Bezier
 */
export function calculateBendControlPoint(
  a: Point,
  b: Point,
  t: number,
  p2: Point
): Point {
  const EPSILON = 0.001;

  // Guard against degenerate cases (t near 0 or 1)
  if (t < EPSILON || t > 1 - EPSILON) {
    // Fall back to midpoint control
    const midX = (a.x + b.x) / 2;
    const midY = (a.y + b.y) / 2;
    // Push the control point toward p2 from the midpoint
    return {
      x: midX + (p2.x - midX) * 2,
      y: midY + (p2.y - midY) * 2,
    };
  }

  const u = 1 - t;
  const u2 = u * u;
  const t2 = t * t;
  const twoUT = 2 * u * t;

  // C = (P2 - (1-t)²·A - t²·B) / (2·t·(1-t))
  const cx = (p2.x - u2 * a.x - t2 * b.x) / twoUT;
  const cy = (p2.y - u2 * a.y - t2 * b.y) / twoUT;

  return { x: cx, y: cy };
}

/**
 * Create a bent segment from a straight segment by applying a bend drag.
 *
 * @param a - Start point of original segment
 * @param b - End point of original segment
 * @param clickPoint - Point where the user clicked down on the segment (P1)
 * @param dragPoint - Point where the user released (P2, snapped to grid)
 * @returns BentSegment with calculated control point
 */
export function createBentSegment(
  a: Point,
  b: Point,
  clickPoint: Point,
  dragPoint: Point
): BentSegment {
  // Calculate t from clickPoint's projection onto AB
  const { t } = projectPointToSegment(clickPoint, a, b);

  // Calculate control point
  const controlPoint = calculateBendControlPoint(a, b, t, dragPoint);

  return {
    type: 'bent',
    a,
    b,
    t,
    p2: dragPoint,
    controlPoint,
  };
}

/**
 * Re-bend an existing bent segment with a new drag point.
 * Uses the original A, B, and calculates new t from click position.
 */
export function reBendSegment(
  segment: BentSegment,
  clickPoint: Point,
  dragPoint: Point
): BentSegment {
  // Recalculate t based on new click position
  const { t } = projectPointToSegment(clickPoint, segment.a, segment.b);
  const controlPoint = calculateBendControlPoint(segment.a, segment.b, t, dragPoint);

  return {
    type: 'bent',
    a: segment.a,
    b: segment.b,
    t,
    p2: dragPoint,
    controlPoint,
  };
}

/**
 * Convert a bent segment back to straight.
 */
export function makeStraight(segment: BentSegment): EasyDrawSegment {
  return {
    type: 'straight',
    start: segment.a,
    end: segment.b,
  };
}

/**
 * Evaluate a quadratic Bezier curve at parameter t.
 * B(t) = (1-t)²·A + 2(1-t)t·C + t²·B
 */
export function evaluateQuadraticBezier(
  a: Point,
  c: Point,
  b: Point,
  t: number
): Point {
  const u = 1 - t;
  const u2 = u * u;
  const t2 = t * t;
  const twoUT = 2 * u * t;

  return {
    x: u2 * a.x + twoUT * c.x + t2 * b.x,
    y: u2 * a.y + twoUT * c.y + t2 * b.y,
  };
}

/**
 * Generate SVG path data for a segment.
 */
export function segmentToSvgPath(segment: Segment): string {
  if (segment.type === 'straight') {
    return `M ${segment.start.x} ${segment.start.y} L ${segment.end.x} ${segment.end.y}`;
  } else {
    // Bent segment - quadratic bezier
    const { a, b, controlPoint } = segment;
    return `M ${a.x} ${a.y} Q ${controlPoint.x} ${controlPoint.y} ${b.x} ${b.y}`;
  }
}

/**
 * Generate an array of points along a segment for rendering.
 * For bent segments, subdivides the curve.
 *
 * @param segment - The segment to subdivide
 * @param subdivisions - Number of subdivisions (default 32, higher = smoother)
 * @returns Array of points along the segment
 */
export function subdivideSegment(
  segment: Segment,
  subdivisions: number = 32
): Point[] {
  if (segment.type === 'straight') {
    return [segment.start, segment.end];
  }

  // For bent segment, generate points along the quadratic curve
  const points: Point[] = [segment.a];
  const { a, b, controlPoint } = segment;

  for (let i = 1; i < subdivisions; i++) {
    const t = i / subdivisions;
    points.push(evaluateQuadraticBezier(a, controlPoint, b, t));
  }

  points.push(b);
  return points;
}

/**
 * Check if a point is within hit distance of a segment.
 *
 * @param point - The point to test
 * @param segment - The segment to test against
 * @param threshold - Hit threshold in pixels
 * @returns true if point is within threshold of the segment
 */
export function hitTestSegment(
  point: Point,
  segment: Segment,
  threshold: number
): boolean {
  if (segment.type === 'straight') {
    const { distance } = closestPointOnSegment(point, segment.start, segment.end);
    return distance <= threshold;
  } else {
    // For bent segments, sample points along the curve
    const points = subdivideSegment(segment, 32);

    for (let i = 0; i < points.length - 1; i++) {
      const { distance } = closestPointOnSegment(point, points[i], points[i + 1]);
      if (distance <= threshold) return true;
    }

    return false;
  }
}

/**
 * Find which segment (if any) is under the given point.
 *
 * @param point - The point to test
 * @param segments - Array of segments to test against
 * @param threshold - Hit threshold in pixels
 * @returns The index of the hit segment, or -1 if none
 */
export function findSegmentAtPoint(
  point: Point,
  segments: Segment[],
  threshold: number
): number {
  for (let i = 0; i < segments.length; i++) {
    if (hitTestSegment(point, segments[i], threshold)) {
      return i;
    }
  }
  return -1;
}
