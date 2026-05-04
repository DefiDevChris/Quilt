/**
 * EasyDraw Engine — Pure math for segment creation, bend-to-curve, and
 * cubic Bezier editing algorithms.
 *
 * No DOM or Fabric.js dependencies. All coordinates are in pixels.
 *
 * Segment types:
 * - Straight: simple line between two endpoints
 * - Bent (quadratic): single-click-drag arc with one control point
 * - Cubic: full cubic Bezier with two independent control-point handles
 */

export type Point = { x: number; y: number };

export interface EasyDrawSegment {
  type: 'straight';
  start: Point;
  end: Point;
}

export interface BentSegment {
  type: 'bent';
  a: Point;
  b: Point;
  t: number;
  p2: Point;
  controlPoint: Point;
}

export interface CubicSegment {
  type: 'cubic';
  a: Point;
  cp1: Point;
  cp2: Point;
  b: Point;
}

export type Segment = EasyDrawSegment | BentSegment | CubicSegment;

export function createSegment(start: Point, end: Point): EasyDrawSegment {
  return { type: 'straight', start, end };
}

export function distance(p1: Point, p2: Point): number {
  return Math.hypot(p2.x - p1.x, p2.y - p1.y);
}

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

  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const proj = {
    x: a.x + t * dx,
    y: a.y + t * dy,
  };

  return { point: proj, t };
}

export function closestPointOnSegment(
  p: Point,
  a: Point,
  b: Point
): { point: Point; t: number; distance: number } {
  const { point, t } = projectPointToSegment(p, a, b);
  const dist = distance(p, point);
  return { point, t, distance: dist };
}

export function calculateBendControlPoint(
  a: Point,
  b: Point,
  t: number,
  p2: Point
): Point {
  const EPSILON = 0.001;

  if (t < EPSILON || t > 1 - EPSILON) {
    const midX = (a.x + b.x) / 2;
    const midY = (a.y + b.y) / 2;
    return {
      x: midX + (p2.x - midX) * 2,
      y: midY + (p2.y - midY) * 2,
    };
  }

  const u = 1 - t;
  const u2 = u * u;
  const t2 = t * t;
  const twoUT = 2 * u * t;

  const cx = (p2.x - u2 * a.x - t2 * b.x) / twoUT;
  const cy = (p2.y - u2 * a.y - t2 * b.y) / twoUT;

  return { x: cx, y: cy };
}

export function createBentSegment(
  a: Point,
  b: Point,
  clickPoint: Point,
  dragPoint: Point
): BentSegment {
  const { t } = projectPointToSegment(clickPoint, a, b);
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

export function reBendSegment(
  segment: BentSegment,
  clickPoint: Point,
  dragPoint: Point
): BentSegment {
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

export function makeStraight(segment: BentSegment | CubicSegment): EasyDrawSegment {
  return {
    type: 'straight',
    start: segment.a,
    end: segment.b,
  };
}

// ── Cubic Bezier segment ──────────────────────────────────────────

export function createCubicSegment(
  a: Point,
  cp1: Point,
  cp2: Point,
  b: Point
): CubicSegment {
  return { type: 'cubic', a, cp1, cp2, b };
}

export function convertBentToCubic(segment: BentSegment): CubicSegment {
  return {
    type: 'cubic',
    a: segment.a,
    cp1: {
      x: segment.a.x + (2 / 3) * (segment.controlPoint.x - segment.a.x),
      y: segment.a.y + (2 / 3) * (segment.controlPoint.y - segment.a.y),
    },
    cp2: {
      x: segment.b.x + (2 / 3) * (segment.controlPoint.x - segment.b.x),
      y: segment.b.y + (2 / 3) * (segment.controlPoint.y - segment.b.y),
    },
    b: segment.b,
  };
}

export function convertStraightToCubic(segment: EasyDrawSegment): CubicSegment {
  const cp = {
    x: (segment.start.x + segment.end.x) / 2,
    y: (segment.start.y + segment.end.y) / 2,
  };
  return {
    type: 'cubic',
    a: segment.start,
    cp1: { x: segment.start.x + (cp.x - segment.start.x) * 0.33, y: segment.start.y + (cp.y - segment.start.y) * 0.33 },
    cp2: { x: segment.end.x + (cp.x - segment.end.x) * 0.33, y: segment.end.y + (cp.y - segment.end.y) * 0.33 },
    b: segment.end,
  };
}

export function updateCubicHandle(
  segment: CubicSegment,
  handle: 'cp1' | 'cp2',
  newPoint: Point
): CubicSegment {
  return {
    ...segment,
    [handle]: newPoint,
  };
}

// ── Bezier evaluation ──────────────────────────────────────────────

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

export function evaluateCubicBezier(
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
  t: number
): Point {
  const u = 1 - t;
  const u3 = u * u * u;
  const u2t3 = 3 * u * u * t;
  const ut23 = 3 * u * t * t;
  const t3 = t * t * t;

  return {
    x: u3 * p0.x + u2t3 * p1.x + ut23 * p2.x + t3 * p3.x,
    y: u3 * p0.y + u2t3 * p1.y + ut23 * p2.y + t3 * p3.y,
  };
}

export function evaluateCubicBezierDerivative(
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
  t: number
): Point {
  const u = 1 - t;
  return {
    x: 3 * u * u * (p1.x - p0.x) + 6 * u * t * (p2.x - p1.x) + 3 * t * t * (p3.x - p2.x),
    y: 3 * u * u * (p1.y - p0.y) + 6 * u * t * (p2.y - p1.y) + 3 * t * t * (p3.y - p2.y),
  };
}

// ── SVG path generation ────────────────────────────────────────────

export function segmentToSvgPath(segment: Segment): string {
  if (segment.type === 'straight') {
    return `M ${segment.start.x} ${segment.start.y} L ${segment.end.x} ${segment.end.y}`;
  } else if (segment.type === 'bent') {
    const { a, b, controlPoint } = segment;
    return `M ${a.x} ${a.y} Q ${controlPoint.x} ${controlPoint.y} ${b.x} ${b.y}`;
  } else {
    const { a, cp1, cp2, b } = segment;
    return `M ${a.x} ${a.y} C ${cp1.x} ${cp1.y} ${cp2.x} ${cp2.y} ${b.x} ${b.y}`;
  }
}

// ── Subdivision for rendering ──────────────────────────────────────

export function subdivideSegment(
  segment: Segment,
  subdivisions: number = 32
): Point[] {
  if (segment.type === 'straight') {
    return [segment.start, segment.end];
  } else if (segment.type === 'bent') {
    const points: Point[] = [segment.a];
    const { a, b, controlPoint } = segment;

    for (let i = 1; i < subdivisions; i++) {
      const t = i / subdivisions;
      points.push(evaluateQuadraticBezier(a, controlPoint, b, t));
    }

    points.push(b);
    return points;
  } else {
    const points: Point[] = [segment.a];
    const { a, cp1, cp2, b } = segment;

    for (let i = 1; i < subdivisions; i++) {
      const t = i / subdivisions;
      points.push(evaluateCubicBezier(a, cp1, cp2, b, t));
    }

    points.push(b);
    return points;
  }
}

// ── Hit testing ────────────────────────────────────────────────────

export function hitTestSegment(
  point: Point,
  segment: Segment,
  threshold: number
): boolean {
  if (segment.type === 'straight') {
    const { distance } = closestPointOnSegment(point, segment.start, segment.end);
    return distance <= threshold;
  } else if (segment.type === 'bent') {
    const points = subdivideSegment(segment, 32);

    for (let i = 0; i < points.length - 1; i++) {
      const { distance } = closestPointOnSegment(point, points[i], points[i + 1]);
      if (distance <= threshold) return true;
    }

    return false;
  } else {
    const points = subdivideSegment(segment, 32);

    for (let i = 0; i < points.length - 1; i++) {
      const { distance } = closestPointOnSegment(point, points[i], points[i + 1]);
      if (distance <= threshold) return true;
    }

    return false;
  }
}

export function hitTestCubicHandle(
  point: Point,
  segment: CubicSegment,
  threshold: number
): 'cp1' | 'cp2' | 'a' | 'b' | null {
  if (distance(point, segment.cp1) <= threshold) return 'cp1';
  if (distance(point, segment.cp2) <= threshold) return 'cp2';
  if (distance(point, segment.a) <= threshold) return 'a';
  if (distance(point, segment.b) <= threshold) return 'b';
  return null;
}

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

// ── Cubic Bezier nearest-point search (iterative Newton-Raphson) ──

export function nearestPointOnCubic(
  point: Point,
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
  iterations: number = 8
): { t: number; point: Point; distance: number } {
  let bestT = 0.5;
  let bestDist = Infinity;
  let bestPt = p0;

  const steps = 16;
  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    const pt = evaluateCubicBezier(p0, p1, p2, p3, t);
    const d = distance(point, pt);
    if (d < bestDist) {
      bestDist = d;
      bestT = t;
      bestPt = pt;
    }
  }

  let t = bestT;
  for (let i = 0; i < iterations; i++) {
    const pt = evaluateCubicBezier(p0, p1, p2, p3, t);
    const deriv = evaluateCubicBezierDerivative(p0, p1, p2, p3, t);
    const dx = pt.x - point.x;
    const dy = pt.y - point.y;
    const numerator = dx * deriv.x + dy * deriv.y;
    const denominator = deriv.x * deriv.x + deriv.y * deriv.y + dx * deriv.x + dy * deriv.y;

    if (Math.abs(denominator) < 1e-10) break;

    const step = numerator / denominator;
    const newT = t - step;

    if (newT < 0 || newT > 1) break;
    t = newT;
  }

  t = Math.max(0, Math.min(1, t));
  const finalPt = evaluateCubicBezier(p0, p1, p2, p3, t);
  const finalDist = distance(point, finalPt);

  return { t, point: finalPt, distance: finalDist };
}
