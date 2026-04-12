// ============================================================================
// Geometric Utilities
// Point operations, polygon math, grid snapping, SVG paths
// Douglas-Peucker removed — use simplify-js instead
// ============================================================================

import type { Point, BoundingBox, Segment } from './types';

// -----------------------------------------------------------------------------
// Point Operations
// -----------------------------------------------------------------------------

export function distance(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function distanceSq(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return dx * dx + dy * dy;
}

export function subtract(p1: Point, p2: Point): Point {
  return { x: p1.x - p2.x, y: p1.y - p2.y };
}

export function dot(p1: Point, p2: Point): number {
  return p1.x * p2.x + p1.y * p2.y;
}

export function cross2D(p1: Point, p2: Point): number {
  return p1.x * p2.y - p1.y * p2.x;
}

// -----------------------------------------------------------------------------
// Bounding Box
// -----------------------------------------------------------------------------

export function computeBoundingBox(points: Point[]): BoundingBox {
  if (points.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  }

  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;

  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }

  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

export function boundingBoxesOverlap(bb1: BoundingBox, bb2: BoundingBox): boolean {
  return !(bb1.maxX < bb2.minX || bb1.minX > bb2.maxX ||
           bb1.maxY < bb2.minY || bb1.minY > bb2.maxY);
}

// -----------------------------------------------------------------------------
// Polygon Area (Shoelace Formula)
// -----------------------------------------------------------------------------

export function polygonArea(vertices: Point[]): number {
  if (vertices.length < 3) return 0;

  let area = 0;
  const n = vertices.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += vertices[i].x * vertices[j].y;
    area -= vertices[j].x * vertices[i].y;
  }

  return Math.abs(area) / 2;
}

export function polygonCentroid(vertices: Point[]): Point {
  if (vertices.length === 0) return { x: 0, y: 0 };
  if (vertices.length < 3) {
    let cx = 0, cy = 0;
    for (const v of vertices) { cx += v.x; cy += v.y; }
    return { x: cx / vertices.length, y: cy / vertices.length };
  }

  const area = polygonArea(vertices);
  if (area < 1e-10) {
    let cx = 0, cy = 0;
    for (const v of vertices) { cx += v.x; cy += v.y; }
    return { x: cx / vertices.length, y: cy / vertices.length };
  }

  let cx = 0, cy = 0;
  const n = vertices.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const cross = vertices[i].x * vertices[j].y - vertices[j].x * vertices[i].y;
    cx += (vertices[i].x + vertices[j].x) * cross;
    cy += (vertices[i].y + vertices[j].y) * cross;
  }

  return { x: cx / (6 * area), y: cy / (6 * area) };
}

export function polygonPerimeter(vertices: Point[]): number {
  if (vertices.length < 2) return 0;
  let perimeter = 0;
  const n = vertices.length;
  for (let i = 0; i < n; i++) {
    perimeter += distance(vertices[i], vertices[(i + 1) % n]);
  }
  return perimeter;
}

// -----------------------------------------------------------------------------
// Angle Calculations
// -----------------------------------------------------------------------------

export function angleAtVertex(prev: Point, current: Point, next: Point): number {
  const v1 = subtract(prev, current);
  const v2 = subtract(next, current);

  const len1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
  const len2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

  if (len1 < 1e-10 || len2 < 1e-10) return 0;

  const cosAngle = dot(v1, v2) / (len1 * len2);
  return Math.acos(Math.max(-1, Math.min(1, cosAngle))) * (180 / Math.PI);
}

// -----------------------------------------------------------------------------
// Collinear Point Removal
// -----------------------------------------------------------------------------

/**
 * Remove near-collinear points from a closed polygon.
 * Points where the angle is close to 180° are removed.
 */
export function removeCollinearPoints(points: Point[], angleThreshold: number = 15): Point[] {
  if (points.length <= 3) return [...points];

  const threshold = 180 - angleThreshold;
  const result: Point[] = [];
  const n = points.length;

  for (let i = 0; i < n; i++) {
    const prev = points[(i - 1 + n) % n];
    const curr = points[i];
    const next = points[(i + 1) % n];
    const angle = angleAtVertex(prev, curr, next);

    if (angle < threshold) {
      result.push(curr);
    }
  }

  return result.length >= 3 ? result : [...points];
}

// -----------------------------------------------------------------------------
// Segment Intersection
// -----------------------------------------------------------------------------

function ccw(A: Point, B: Point, C: Point): boolean {
  return (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x);
}

export function segmentsIntersect(s1: Segment, s2: Segment): boolean {
  const { p1: A, p2: B } = s1;
  const { p1: C, p2: D } = s2;

  if (Math.max(A.x, B.x) < Math.min(C.x, D.x) ||
      Math.max(C.x, D.x) < Math.min(A.x, B.x) ||
      Math.max(A.y, B.y) < Math.min(C.y, D.y) ||
      Math.max(C.y, D.y) < Math.min(A.y, B.y)) {
    return false;
  }

  return ccw(A, C, D) !== ccw(B, C, D) && ccw(A, B, C) !== ccw(A, B, D);
}

// -----------------------------------------------------------------------------
// SVG Path Generation
// -----------------------------------------------------------------------------

export function polygonToSvgPath(vertices: Point[]): string {
  if (vertices.length === 0) return '';

  const parts: string[] = [`M ${vertices[0].x.toFixed(4)} ${vertices[0].y.toFixed(4)}`];

  for (let i = 1; i < vertices.length; i++) {
    parts.push(`L ${vertices[i].x.toFixed(4)} ${vertices[i].y.toFixed(4)}`);
  }

  parts.push('Z');
  return parts.join(' ');
}

// -----------------------------------------------------------------------------
// Point in Polygon (Ray Casting)
// -----------------------------------------------------------------------------

export function pointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false;
  const n = polygon.length;

  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;

    if (((yi > point.y) !== (yj > point.y)) &&
        (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }

  return inside;
}

// -----------------------------------------------------------------------------
// Grid Snapping
// -----------------------------------------------------------------------------

export function snapToGrid(point: Point, gridSpacing: number, offsetX: number, offsetY: number): Point {
  return {
    x: Math.round((point.x - offsetX) / gridSpacing) * gridSpacing + offsetX,
    y: Math.round((point.y - offsetY) / gridSpacing) * gridSpacing + offsetY,
  };
}

/** Remove consecutive duplicate points (within tolerance) */
export function deduplicatePoints(points: Point[], tolerance: number = 0.01): Point[] {
  if (points.length <= 1) return [...points];

  const result: Point[] = [points[0]];
  for (let i = 1; i < points.length; i++) {
    if (distance(points[i], result[result.length - 1]) > tolerance) {
      result.push(points[i]);
    }
  }

  // Check wrap-around
  if (result.length > 1 && distance(result[0], result[result.length - 1]) <= tolerance) {
    result.pop();
  }

  return result;
}
