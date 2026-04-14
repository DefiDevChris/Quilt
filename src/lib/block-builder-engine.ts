/**
 * Block Builder Engine — Shape generation for grid-based quilt block construction.
 *
 * Pure functions that generate grid-snapped segments for block drawing tools:
 * Triangle, Rectangle, Bend, and grid utilities.
 * Zero React/Fabric.js/DOM dependencies — fully testable.
 */

import type { Segment, GridPoint, ArcSegment } from './blockbuilder-utils';

// ─── Grid unit presets ─────────────────────────────────────────────────────

export interface GridUnitPreset {
  readonly label: string;
  readonly cols: number;
  readonly rows: number;
}

export const GRID_UNIT_PRESETS: readonly GridUnitPreset[] = [
  { label: '4-unit', cols: 4, rows: 4 },
  { label: '5-unit', cols: 5, rows: 5 },
  { label: '9-unit', cols: 3, rows: 3 },
  { label: '12-unit', cols: 12, rows: 12 },
] as const;

// ─── Cell outline helper ───────────────────────────────────────────────────

function cellOutline(row: number, col: number, width: number, height: number): Segment[] {
  return [
    { from: { row, col }, to: { row, col: col + width } },
    { from: { row, col: col + width }, to: { row: row + height, col: col + width } },
    { from: { row: row + height, col: col + width }, to: { row: row + height, col } },
    { from: { row: row + height, col }, to: { row, col } },
  ];
}

// ─── Shape generators ──────────────────────────────────────────────────────

/**
 * Triangle: one grid cell split diagonally (top-left to bottom-right).
 * Returns cell outline + diagonal.
 */
export function generateTriangle(row: number, col: number): Segment[] {
  return [
    ...cellOutline(row, col, 1, 1),
    { from: { row, col }, to: { row: row + 1, col: col + 1 } },
  ];
}

/**
 * Freeform triangle: 3 arbitrary grid points connected as a triangle.
 * Returns 3 segments connecting the points.
 */
export function generateFreeformTriangle(p1: GridPoint, p2: GridPoint, p3: GridPoint): Segment[] {
  return [
    { from: p1, to: p2 },
    { from: p2, to: p3 },
    { from: p3, to: p1 },
  ];
}

/**
 * Circle: approximate a circle centered at (centerRow, centerCol) with given radius.
 * Returns segments forming a circle approximation using grid points.
 */
export function generateCircle(centerRow: number, centerCol: number, radius: number): Segment[] {
  const segments: Segment[] = [];
  const steps = Math.max(8, Math.round(2 * Math.PI * radius));

  const points: GridPoint[] = [];
  for (let i = 0; i < steps; i++) {
    const angle = (2 * Math.PI * i) / steps;
    const row = Math.round(centerRow + radius * Math.cos(angle));
    const col = Math.round(centerCol + radius * Math.sin(angle));
    points.push({ row, col });
  }

  for (let i = 0; i < points.length; i++) {
    segments.push({ from: points[i], to: points[(i + 1) % points.length] });
  }

  return segments;
}

/**
 * Rectangle: outline from (r1,c1) to (r2,c2), snapped to grid.
 * Normalizes so r1 <= r2, c1 <= c2.
 */
export function generateRectangle(r1: number, c1: number, r2: number, c2: number): Segment[] {
  const minR = Math.min(r1, r2);
  const maxR = Math.max(r1, r2);
  const minC = Math.min(c1, c2);
  const maxC = Math.max(c1, c2);

  if (minR === maxR || minC === maxC) return [];

  return cellOutline(minR, minC, maxC - minC, maxR - minR);
}

/**
 * Bend: convert a straight segment into an arc by specifying a control point.
 *
 * The arc passes through the segment's endpoints with the given center point
 * determining the curvature. The center should be offset perpendicular to the
 * segment — the direction and distance determine the arc's bulge.
 *
 * Returns a single ArcSegment replacing the original straight segment.
 */
export function generateBend(seg: Segment, center: GridPoint): ArcSegment {
  // Determine clockwise direction based on center position relative to segment
  // Cross product of (to-from) × (center-from) determines which side the center is on
  const dr = seg.to.row - seg.from.row;
  const dc = seg.to.col - seg.from.col;
  const cr = center.row - seg.from.row;
  const cc = center.col - seg.from.col;
  const crossProduct = dr * cc - dc * cr;
  const clockwise = crossProduct < 0;

  return {
    from: { row: seg.from.row, col: seg.from.col },
    to: { row: seg.to.row, col: seg.to.col },
    center: { row: center.row, col: center.col },
    clockwise,
  };
}

// ─── Grid cell from pixel ──────────────────────────────────────────────────

/**
 * Given a pixel position, return the grid cell (row, col) it falls in.
 * Returns null if outside the grid bounds.
 */
export function pixelToGridCell(
  x: number,
  y: number,
  gridSize: number,
  gridCols: number,
  gridRows: number
): GridPoint | null {
  const col = Math.floor(x / gridSize);
  const row = Math.floor(y / gridSize);

  if (row < 0 || row >= gridRows || col < 0 || col >= gridCols) return null;
  return { row, col };
}

// ─── Bounds checking ───────────────────────────────────────────────────────

/**
 * Check if a cell is within grid bounds.
 */
export function isValidCell(row: number, col: number, gridCols: number, gridRows: number): boolean {
  return row >= 0 && row < gridRows && col >= 0 && col < gridCols;
}

// ─── Nearest segment hit-test ──────────────────────────────────────────────

/**
 * Find the segment closest to a pixel point, within a tolerance.
 * Used by the Curve tool to select a segment to bend.
 */
export function findNearestSegment(
  x: number,
  y: number,
  segments: readonly Segment[],
  gridSize: number,
  tolerance: number
): number {
  let bestIdx = -1;
  let bestDist = tolerance;

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const ax = seg.from.col * gridSize;
    const ay = seg.from.row * gridSize;
    const bx = seg.to.col * gridSize;
    const by = seg.to.row * gridSize;

    const dist = pointToSegmentDist(x, y, ax, ay, bx, by);
    if (dist < bestDist) {
      bestDist = dist;
      bestIdx = i;
    }
  }

  return bestIdx;
}

function pointToSegmentDist(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number
): number {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.sqrt((px - ax) ** 2 + (py - ay) ** 2);

  let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const projX = ax + t * dx;
  const projY = ay + t * dy;
  return Math.sqrt((px - projX) ** 2 + (py - projY) ** 2);
}
