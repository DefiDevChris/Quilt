/**
 * Sashing Detection Engine — Detects sashing strips and cornerstones between blocks.
 *
 * Pure computation — zero DOM / React / Fabric.js dependencies.
 * Called by structure-detection-engine after grid detection.
 *
 * Algorithm:
 * 1. Identify pieces NOT assigned to any grid cell
 * 2. Among unassigned pieces, find elongated rectangles (high aspect ratio)
 *    that align with gaps between grid rows/columns → sashing
 * 3. Find small squares at sashing intersections → cornerstones
 */

import type { DetectedPiece, QuiltGrid, SashingInfo } from './photo-layout-types';

// ── Configuration ─────────────────────────────────────────────────────────

/** Minimum aspect ratio to qualify as a sashing strip */
const MIN_SASHING_ASPECT_RATIO = 2.5;

/** Maximum aspect ratio for a cornerstone (should be roughly square) */
const MAX_CORNERSTONE_ASPECT_RATIO = 1.6;

/** Cornerstone area must be smaller than this fraction of average block area */
const MAX_CORNERSTONE_AREA_FRACTION = 0.15;

/** Sashing piece centroid must be within this fraction of cell spacing from a gap line */
const MAX_GAP_DISTANCE_FRACTION = 0.4;

// ── Helpers ───────────────────────────────────────────────────────────────

function aspectRatio(piece: DetectedPiece): number {
  const { width, height } = piece.boundingRect;
  if (width === 0 || height === 0) return 0;
  return Math.max(width, height) / Math.min(width, height);
}

/**
 * Returns the set of piece IDs already assigned to grid cells.
 */
function getGridAssignedIds(grid: QuiltGrid): Set<string> {
  const assigned = new Set<string>();
  for (const cell of grid.cells) {
    for (const id of cell.pieceIds) {
      assigned.add(id);
    }
  }
  return assigned;
}

/**
 * Checks whether a piece's centroid lies between two adjacent grid lines
 * on a given axis (row centers or col centers).
 */
function isBetweenGridLines(
  centroidValue: number,
  centers: readonly number[],
  spacing: number
): boolean {
  for (let i = 0; i < centers.length - 1; i++) {
    const gapCenter = (centers[i] + centers[i + 1]) / 2;
    if (Math.abs(centroidValue - gapCenter) < spacing * MAX_GAP_DISTANCE_FRACTION) {
      return true;
    }
  }
  return false;
}

// ── Main Export ────────────────────────────────────────────────────────────

export interface SashingDetectionResult {
  readonly sashingInfo: SashingInfo;
  readonly sashingPieceIds: readonly string[];
  readonly cornerstonePieceIds: readonly string[];
}

/**
 * Detects sashing strips and cornerstones from unassigned pieces.
 *
 * @param pieces - All detected pieces
 * @param grid - Previously detected grid (required)
 * @param colorSampler - Samples average color from a region of the image
 */
export function detectSashing(
  pieces: readonly DetectedPiece[],
  grid: QuiltGrid,
  colorSampler: (x: number, y: number, w: number, h: number) => string
): SashingDetectionResult {
  const noSashing: SashingDetectionResult = {
    sashingInfo: {
      detected: false,
      widthInches: 0,
      color: '',
      hasCornerStones: false,
      totalSashingLength: 0,
    },
    sashingPieceIds: [],
    cornerstonePieceIds: [],
  };

  if (grid.rows < 2 && grid.cols < 2) return noSashing;

  const assignedIds = getGridAssignedIds(grid);
  const unassigned = pieces.filter((p) => !assignedIds.has(p.id));

  if (unassigned.length === 0) return noSashing;

  // Extract row/col centers from grid cells
  const rowCenters = Array.from(new Set(grid.cells.map((c) => c.centerPx.y))).sort((a, b) => a - b);
  const colCenters = Array.from(new Set(grid.cells.map((c) => c.centerPx.x))).sort((a, b) => a - b);

  // Identify sashing candidates: elongated pieces between grid lines
  const sashingPieceIds: string[] = [];
  const cornerstonePieceIds: string[] = [];
  const avgBlockArea = grid.blockWidthPx * grid.blockHeightPx;

  for (const piece of unassigned) {
    const ar = aspectRatio(piece);
    const area = piece.areaPx;

    if (ar >= MIN_SASHING_ASPECT_RATIO) {
      // Check if oriented along a gap
      const isHorizontal = piece.boundingRect.width > piece.boundingRect.height;
      const betweenRows = isBetweenGridLines(piece.centroid.y, rowCenters, grid.blockHeightPx);
      const betweenCols = isBetweenGridLines(piece.centroid.x, colCenters, grid.blockWidthPx);

      if ((isHorizontal && betweenRows) || (!isHorizontal && betweenCols)) {
        sashingPieceIds.push(piece.id);
      }
    } else if (
      ar <= MAX_CORNERSTONE_ASPECT_RATIO &&
      area < avgBlockArea * MAX_CORNERSTONE_AREA_FRACTION
    ) {
      // Small square-ish piece between grid lines on both axes
      const betweenRows = isBetweenGridLines(piece.centroid.y, rowCenters, grid.blockHeightPx);
      const betweenCols = isBetweenGridLines(piece.centroid.x, colCenters, grid.blockWidthPx);

      if (betweenRows && betweenCols) {
        cornerstonePieceIds.push(piece.id);
      }
    }
  }

  if (sashingPieceIds.length === 0) return noSashing;

  // Compute average sashing width from the narrow dimension of sashing pieces
  const sashingPieces = pieces.filter((p) => sashingPieceIds.includes(p.id));
  const sashingWidths = sashingPieces.map((p) =>
    Math.min(p.boundingRect.width, p.boundingRect.height)
  );
  const _avgSashingWidthPx = sashingWidths.reduce((s, v) => s + v, 0) / sashingWidths.length;

  // Sample color from the first sashing piece
  const firstSashing = sashingPieces[0];
  const sashingColor = colorSampler(
    firstSashing.boundingRect.x,
    firstSashing.boundingRect.y,
    firstSashing.boundingRect.width,
    firstSashing.boundingRect.height
  );

  // Total sashing length (sum of long dimensions)
  const totalSashingLength = sashingPieces.reduce(
    (s, p) => s + Math.max(p.boundingRect.width, p.boundingRect.height),
    0
  );

  // Cornerstone color
  let cornerStoneColor: string | undefined;
  if (cornerstonePieceIds.length > 0) {
    const firstCornerstone = pieces.find((p) => p.id === cornerstonePieceIds[0]);
    if (firstCornerstone) {
      cornerStoneColor = colorSampler(
        firstCornerstone.boundingRect.x,
        firstCornerstone.boundingRect.y,
        firstCornerstone.boundingRect.width,
        firstCornerstone.boundingRect.height
      );
    }
  }

  return {
    sashingInfo: {
      detected: true,
      widthInches: 0, // Converted by caller after scaling
      color: sashingColor,
      hasCornerStones: cornerstonePieceIds.length > 0,
      cornerStoneColor,
      totalSashingLength,
    },
    sashingPieceIds,
    cornerstonePieceIds,
  };
}
