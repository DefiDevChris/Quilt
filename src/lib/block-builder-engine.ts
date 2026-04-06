/**
 * Block Builder Engine — Shape generation for grid-based quilt block construction.
 *
 * Pure functions that generate grid-snapped segments for block drawing tools:
 * Triangle, Rectangle, and grid utilities.
 * Zero React/Fabric.js/DOM dependencies — fully testable.
 */

import type { Segment, GridPoint } from './blockbuilder-utils';

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
 * Rectangle: outline from (r1,c1) to (r2,c2), snapped to grid.
 * Normalizes so r1 <= r2, c1 <= c2.
 */
export function generateRectangle(
  r1: number,
  c1: number,
  r2: number,
  c2: number
): Segment[] {
  const minR = Math.min(r1, r2);
  const maxR = Math.max(r1, r2);
  const minC = Math.min(c1, c2);
  const maxC = Math.max(c1, c2);

  if (minR === maxR || minC === maxC) return [];

  return cellOutline(minR, minC, maxC - minC, maxR - minR);
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
export function isValidCell(
  row: number,
  col: number,
  gridCols: number,
  gridRows: number
): boolean {
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
