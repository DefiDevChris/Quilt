/**
 * Grid Detection Engine — Detects block repeat grids from piece centroids.
 *
 * Pure computation — zero DOM / React / Fabric.js dependencies.
 * Used by the structure-detection-engine orchestrator after OpenCV piece extraction.
 *
 * Algorithm:
 * 1. Project all centroids onto X and Y axes
 * 2. Histogram-bin each axis to find cluster centers (row/col lines)
 * 3. Validate that grid spacing is consistent
 * 4. Assign each piece to its nearest grid cell
 * 5. Return null if no clear grid (art quilts, crazy quilts, etc.)
 */

import type { DetectedPiece, QuiltGrid, BlockCell } from './photo-layout-types';
import type { Point2D } from '@/types/geometry';

// ── Configuration ─────────────────────────────────────────────────────────

/** Minimum number of rows or cols to consider it a grid */
const MIN_GRID_SIZE = 2;

/** Maximum coefficient of variation for spacing to accept the grid */
const MAX_SPACING_CV = 0.35;

/** Minimum fraction of pieces that must fall within a grid cell */
const MIN_PIECE_COVERAGE = 0.4;

/** Bin width as a fraction of average piece bounding box size */
const BIN_WIDTH_FACTOR = 0.5;

/** Maximum distance (in multiples of cell size) for a piece to be assigned to a cell */
const MAX_CELL_ASSIGNMENT_DISTANCE = 0.6;

// ── Helpers ───────────────────────────────────────────────────────────────

/**
 * Finds cluster centers from a sorted list of 1D values using histogram binning.
 * Returns the centers of non-empty bins after merging nearby bins.
 */
function findClusterCenters(values: readonly number[], binWidth: number): number[] {
  if (values.length === 0 || binWidth <= 0) return [];

  const sorted = [...values].sort((a, b) => a - b);
  const clusters: number[][] = [[sorted[0]]];

  for (let i = 1; i < sorted.length; i++) {
    const lastCluster = clusters[clusters.length - 1];
    const lastMean = lastCluster.reduce((s, v) => s + v, 0) / lastCluster.length;

    if (sorted[i] - lastMean < binWidth) {
      lastCluster.push(sorted[i]);
    } else {
      clusters.push([sorted[i]]);
    }
  }

  return clusters.map((c) => c.reduce((s, v) => s + v, 0) / c.length);
}

/**
 * Computes the coefficient of variation (stddev / mean) for a list of spacings.
 * Returns Infinity for empty or single-element arrays.
 */
function coefficientOfVariation(spacings: readonly number[]): number {
  if (spacings.length < 2) return Infinity;

  const mean = spacings.reduce((s, v) => s + v, 0) / spacings.length;
  if (mean === 0) return Infinity;

  const variance = spacings.reduce((s, v) => s + (v - mean) ** 2, 0) / spacings.length;
  return Math.sqrt(variance) / mean;
}

/**
 * Computes consecutive spacings from sorted cluster centers.
 */
function computeSpacings(centers: readonly number[]): number[] {
  const spacings: number[] = [];
  for (let i = 1; i < centers.length; i++) {
    spacings.push(centers[i] - centers[i - 1]);
  }
  return spacings;
}

/**
 * Finds the index of the nearest center to a given value.
 */
function nearestIndex(value: number, centers: readonly number[]): number {
  let best = 0;
  let bestDist = Math.abs(value - centers[0]);
  for (let i = 1; i < centers.length; i++) {
    const dist = Math.abs(value - centers[i]);
    if (dist < bestDist) {
      best = i;
      bestDist = dist;
    }
  }
  return best;
}

// ── Main Export ────────────────────────────────────────────────────────────

/**
 * Detects a block repeat grid from piece centroids.
 *
 * @param pieces - Detected pieces with centroids and bounding rects
 * @param imageWidth - Width of the source image in pixels
 * @param imageHeight - Height of the source image in pixels
 * @returns QuiltGrid if a consistent grid is found, null otherwise
 */
export function detectBlockGrid(
  pieces: readonly DetectedPiece[],
  _imageWidth: number,
  _imageHeight: number
): QuiltGrid | null {
  if (pieces.length < MIN_GRID_SIZE * MIN_GRID_SIZE) return null;

  // Compute average bounding box dimensions across all pieces
  const avgWidth = pieces.reduce((s, p) => s + p.boundingRect.width, 0) / pieces.length;
  const avgHeight = pieces.reduce((s, p) => s + p.boundingRect.height, 0) / pieces.length;
  const avgSize = (avgWidth + avgHeight) / 2;

  if (avgSize <= 0) return null;

  const binWidth = avgSize * BIN_WIDTH_FACTOR;

  // Extract centroids
  const xs = pieces.map((p) => p.centroid.x);
  const ys = pieces.map((p) => p.centroid.y);

  // Find row and column cluster centers
  const colCenters = findClusterCenters(xs, binWidth);
  const rowCenters = findClusterCenters(ys, binWidth);

  if (colCenters.length < MIN_GRID_SIZE || rowCenters.length < MIN_GRID_SIZE) {
    return null;
  }

  // Validate spacing consistency
  const colSpacings = computeSpacings(colCenters);
  const rowSpacings = computeSpacings(rowCenters);

  const colCV = coefficientOfVariation(colSpacings);
  const rowCV = coefficientOfVariation(rowSpacings);

  if (colCV > MAX_SPACING_CV || rowCV > MAX_SPACING_CV) {
    return null;
  }

  // Average block dimensions from spacing
  const blockWidthPx =
    colSpacings.length > 0 ? colSpacings.reduce((s, v) => s + v, 0) / colSpacings.length : avgWidth;
  const blockHeightPx =
    rowSpacings.length > 0
      ? rowSpacings.reduce((s, v) => s + v, 0) / rowSpacings.length
      : avgHeight;

  const rows = rowCenters.length;
  const cols = colCenters.length;

  // Assign pieces to grid cells
  const cellMap = new Map<string, string[]>();
  let assignedCount = 0;

  for (const piece of pieces) {
    const colIdx = nearestIndex(piece.centroid.x, colCenters);
    const rowIdx = nearestIndex(piece.centroid.y, rowCenters);

    // Check distance is within threshold
    const dx = Math.abs(piece.centroid.x - colCenters[colIdx]) / blockWidthPx;
    const dy = Math.abs(piece.centroid.y - rowCenters[rowIdx]) / blockHeightPx;

    if (dx <= MAX_CELL_ASSIGNMENT_DISTANCE && dy <= MAX_CELL_ASSIGNMENT_DISTANCE) {
      const key = `${rowIdx},${colIdx}`;
      const existing = cellMap.get(key);
      if (existing) {
        existing.push(piece.id);
      } else {
        cellMap.set(key, [piece.id]);
      }
      assignedCount++;
    }
  }

  // Validate coverage — enough pieces must fall within cells
  if (assignedCount / pieces.length < MIN_PIECE_COVERAGE) {
    return null;
  }

  // Build cells
  const cells: BlockCell[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const key = `${r},${c}`;
      const pieceIds = cellMap.get(key) ?? [];
      cells.push({
        row: r,
        col: c,
        centerPx: { x: colCenters[c], y: rowCenters[r] } as Point2D,
        pieceIds,
        rotation: 0,
        mirrored: false,
      });
    }
  }

  // Grid origin = top-left cell center minus half block size
  const gridOrigin: Point2D = {
    x: Math.max(0, colCenters[0] - blockWidthPx / 2),
    y: Math.max(0, rowCenters[0] - blockHeightPx / 2),
  };

  return {
    rows,
    cols,
    blockWidthPx,
    blockHeightPx,
    isOnPoint: false,
    cells,
    gridOrigin,
  };
}
