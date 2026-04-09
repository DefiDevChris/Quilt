/**
 * Coverage Validator
 *
 * Validates that piece contours fully cover the canvas area with no gaps
 * and no overlaps. Uses raster-scan sampling for efficient approximate validation.
 *
 * Pure computation — zero DOM / React / Fabric.js dependencies.
 */

import type { Point2D, Rect } from '@/lib/photo-layout-types';

// ============================================================================
// Configuration
// ============================================================================

/** Cell size for raster validation. Smaller = more accurate, slower. */
export const COVERAGE_CELL_SIZE = 4;

/** Minimum coverage ratio to pass validation (0.0–1.0). */
export const MIN_COVERAGE_RATIO = 0.97;

/** Maximum overlap ratio allowed (0.0–1.0). */
export const MAX_OVERLAP_RATIO = 0.03;

// ============================================================================
// Polygon Rasterization
// ============================================================================

/**
 * Rasterize a polygon onto a boolean grid.
 * Marks all cells whose center falls inside the polygon.
 */
function rasterizePolygon(
  contour: readonly Point2D[],
  canvasBounds: Rect,
  gridW: number,
  gridH: number,
  cellSize: number,
  grid: Uint8Array
): void {
  const minX = canvasBounds.x;
  const minY = canvasBounds.y;

  // Bounding box of the polygon in grid coordinates
  let gridMinX = gridW;
  let gridMinY = gridH;
  let gridMaxX = 0;
  let gridMaxY = 0;

  for (const p of contour) {
    const gx = Math.floor((p.x - minX) / cellSize);
    const gy = Math.floor((p.y - minY) / cellSize);
    gridMinX = Math.min(gridMinX, Math.max(0, gx));
    gridMinY = Math.min(gridMinY, Math.max(0, gy));
    gridMaxX = Math.max(gridMaxX, Math.min(gridW - 1, gx));
    gridMaxY = Math.max(gridMaxY, Math.min(gridH - 1, gy));
  }

  // Scan each cell in the bounding box
  for (let gy = gridMinY; gy <= gridMaxY; gy++) {
    for (let gx = gridMinX; gx <= gridMaxX; gx++) {
      const cx = minX + (gx + 0.5) * cellSize;
      const cy = minY + (gy + 0.5) * cellSize;

      if (pointInPolygon({ x: cx, y: cy }, contour)) {
        grid[gy * gridW + gx] = 1;
      }
    }
  }
}

/**
 * Ray casting algorithm for point-in-polygon test.
 */
function pointInPolygon(point: Point2D, contour: readonly Point2D[]): boolean {
  let inside = false;
  const { x, y } = point;
  const n = contour.length;

  for (let i = 0, j = n - 1; i < n; j = i++) {
    const pi = contour[i];
    const pj = contour[j];

    const intersect =
      pi.y > y !== pj.y > y &&
      x < ((pj.x - pi.x) * (y - pi.y)) / (pj.y - pi.y + 0.0001) + pi.x;

    if (intersect) inside = !inside;
  }

  return inside;
}

// ============================================================================
// Coverage Analysis
// ============================================================================

/**
 * Compute coverage metrics for a set of piece contours.
 *
 * Returns:
 * - coverageRatio: fraction of canvas area covered by at least one piece
 * - overlapRatio: fraction of canvas area covered by more than one piece
 * - uncoveredCells: number of uncovered cells
 * - totalCells: total canvas cells
 */
export function analyzeCoverage(
  contours: readonly Point2D[][],
  canvasBounds: Rect,
  cellSize: number = COVERAGE_CELL_SIZE
): {
  coverageRatio: number;
  overlapRatio: number;
  uncoveredCells: number;
  totalCells: number;
  overcoveredCells: number;
} {
  const gridW = Math.ceil(canvasBounds.width / cellSize);
  const gridH = Math.ceil(canvasBounds.height / cellSize);
  const totalCells = gridW * gridH;

  if (totalCells === 0) {
    return { coverageRatio: 0, overlapRatio: 0, uncoveredCells: 0, totalCells: 0, overcoveredCells: 0 };
  }

  // Coverage count grid: how many pieces cover each cell
  const coverageCounts = new Uint8Array(totalCells);

  // Rasterize each contour
  for (const contour of contours) {
    const singleGrid = new Uint8Array(totalCells);
    rasterizePolygon(contour, canvasBounds, gridW, gridH, cellSize, singleGrid);

    for (let i = 0; i < totalCells; i++) {
      if (singleGrid[i]) {
        coverageCounts[i] = Math.min(coverageCounts[i] + 1, 255);
      }
    }
  }

  // Count coverage and overlap
  let coveredCells = 0;
  let overcoveredCells = 0;

  for (let i = 0; i < totalCells; i++) {
    if (coverageCounts[i] >= 1) coveredCells++;
    if (coverageCounts[i] >= 2) overcoveredCells++;
  }

  const uncoveredCells = totalCells - coveredCells;

  return {
    coverageRatio: coveredCells / totalCells,
    overlapRatio: overcoveredCells / totalCells,
    uncoveredCells,
    totalCells,
    overcoveredCells,
  };
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate that piece contours provide adequate canvas coverage.
 *
 * @returns true if coverage passes thresholds, false otherwise
 */
export function validateCoverage(
  contours: readonly Point2D[][],
  canvasBounds: Rect,
  options?: {
    cellSize?: number;
    minCoverage?: number;
    maxOverlap?: number;
  }
): { valid: boolean; message: string; coverageRatio: number; overlapRatio: number } {
  const cellSize = options?.cellSize ?? COVERAGE_CELL_SIZE;
  const minCoverage = options?.minCoverage ?? MIN_COVERAGE_RATIO;
  const maxOverlap = options?.maxOverlap ?? MAX_OVERLAP_RATIO;

  const result = analyzeCoverage(contours, canvasBounds, cellSize);

  if (result.totalCells === 0) {
    return { valid: false, message: 'Canvas has zero area', coverageRatio: 0, overlapRatio: 0 };
  }

  if (result.coverageRatio < minCoverage) {
    const pct = (result.coverageRatio * 100).toFixed(1);
    return {
      valid: false,
      message: `Coverage too low: ${pct}% (need ${(minCoverage * 100).toFixed(0)}%). ${result.uncoveredCells} uncovered cells.`,
      coverageRatio: result.coverageRatio,
      overlapRatio: result.overlapRatio,
    };
  }

  if (result.overlapRatio > maxOverlap) {
    const pct = (result.overlapRatio * 100).toFixed(1);
    return {
      valid: false,
      message: `Overlap too high: ${pct}% (max ${(maxOverlap * 100).toFixed(0)}%). ${result.overcoveredCells} overlapping cells.`,
      coverageRatio: result.coverageRatio,
      overlapRatio: result.overlapRatio,
    };
  }

  return {
    valid: true,
    message: `Coverage OK: ${(result.coverageRatio * 100).toFixed(1)}%, overlap ${(result.overlapRatio * 100).toFixed(1)}%`,
    coverageRatio: result.coverageRatio,
    overlapRatio: result.overlapRatio,
  };
}

/**
 * Find the locations of uncovered areas on the canvas.
 * Useful for debugging or visualizing gaps.
 */
export function findUncoveredAreas(
  contours: readonly Point2D[][],
  canvasBounds: Rect,
  cellSize: number = COVERAGE_CELL_SIZE
): Array<{ x: number; y: number; width: number; height: number }> {
  const gridW = Math.ceil(canvasBounds.width / cellSize);
  const gridH = Math.ceil(canvasBounds.height / cellSize);
  const totalCells = gridW * gridH;

  const coverageGrid = new Uint8Array(totalCells);

  for (const contour of contours) {
    const singleGrid = new Uint8Array(totalCells);
    rasterizePolygon(contour, canvasBounds, gridW, gridH, cellSize, singleGrid);
    for (let i = 0; i < totalCells; i++) {
      if (singleGrid[i]) coverageGrid[i] = 1;
    }
  }

  const areas: Array<{ x: number; y: number; width: number; height: number }> = [];

  for (let gy = 0; gy < gridH; gy++) {
    for (let gx = 0; gx < gridW; gx++) {
      if (coverageGrid[gy * gridW + gx] === 0) {
        areas.push({
          x: canvasBounds.x + gx * cellSize,
          y: canvasBounds.y + gy * cellSize,
          width: cellSize,
          height: cellSize,
        });
      }
    }
  }

  return areas;
}
