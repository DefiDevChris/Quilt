/**
 * Border Detection Engine — Detects border layers and binding around the quilt.
 *
 * Pure computation — zero DOM / React / Fabric.js dependencies.
 * Called by structure-detection-engine after grid and sashing detection.
 *
 * Algorithm:
 * 1. Find pieces along image edges that aren't assigned to blocks or sashing
 * 2. Group edge pieces into concentric layers by distance from image edge
 * 3. Innermost layer is closest to block grid, outermost closest to image edge
 * 4. Detect binding as the thinnest outermost strip
 */

import type {
  DetectedPiece,
  QuiltGrid,
  BorderInfo,
  BorderLayer,
  BindingInfo,
} from './photo-layout-types';

// ── Configuration ─────────────────────────────────────────────────────────

/** Piece must be within this fraction of image dimension from an edge to be "edge piece" */
const EDGE_PROXIMITY_FRACTION = 0.12;

/** Minimum aspect ratio for binding strips (very thin) */
const MIN_BINDING_ASPECT_RATIO = 6;

/** Maximum binding width as fraction of image shortest dimension */
const MAX_BINDING_WIDTH_FRACTION = 0.03;

/** Distance tolerance for grouping pieces into the same border layer */
const LAYER_MERGE_TOLERANCE_FRACTION = 0.06;

// ── Helpers ───────────────────────────────────────────────────────────────

interface EdgeDistances {
  readonly top: number;
  readonly bottom: number;
  readonly left: number;
  readonly right: number;
  readonly minEdgeDist: number;
}

function computeEdgeDistances(
  piece: DetectedPiece,
  imageWidth: number,
  imageHeight: number
): EdgeDistances {
  const { x, y, width, height } = piece.boundingRect;
  const top = y;
  const bottom = imageHeight - (y + height);
  const left = x;
  const right = imageWidth - (x + width);
  return {
    top,
    bottom,
    left,
    right,
    minEdgeDist: Math.min(top, bottom, left, right),
  };
}

function aspectRatio(piece: DetectedPiece): number {
  const { width, height } = piece.boundingRect;
  if (width === 0 || height === 0) return 0;
  return Math.max(width, height) / Math.min(width, height);
}

// ── Main Export ────────────────────────────────────────────────────────────

export interface BorderDetectionResult {
  readonly borderInfo: BorderInfo;
  readonly bindingInfo: BindingInfo;
  readonly borderPieceIds: readonly string[];
  readonly bindingPieceIds: readonly string[];
}

/**
 * Detects border layers and binding from edge pieces.
 *
 * @param pieces - All detected pieces
 * @param imageWidth - Width of the source image in pixels
 * @param imageHeight - Height of the source image in pixels
 * @param grid - Previously detected grid (may be null)
 * @param assignedIds - IDs already claimed by grid or sashing detection
 * @param colorSampler - Samples average color from a region of the image
 */
export function detectBorders(
  pieces: readonly DetectedPiece[],
  imageWidth: number,
  imageHeight: number,
  grid: QuiltGrid | null,
  assignedIds: ReadonlySet<string>,
  colorSampler: (x: number, y: number, w: number, h: number) => string
): BorderDetectionResult {
  const noBorders: BorderDetectionResult = {
    borderInfo: { detected: false, layers: [] },
    bindingInfo: { detected: false, color: '', widthInches: 0, perimeterInches: 0 },
    borderPieceIds: [],
    bindingPieceIds: [],
  };

  // Get unassigned pieces
  const unassigned = pieces.filter((p) => !assignedIds.has(p.id));
  if (unassigned.length === 0) return noBorders;

  const edgeThreshold = Math.min(imageWidth, imageHeight) * EDGE_PROXIMITY_FRACTION;

  // Find pieces near the image edges
  const edgePieces: Array<{ piece: DetectedPiece; distances: EdgeDistances }> = [];
  for (const piece of unassigned) {
    const distances = computeEdgeDistances(piece, imageWidth, imageHeight);
    if (distances.minEdgeDist < edgeThreshold) {
      edgePieces.push({ piece, distances });
    }
  }

  if (edgePieces.length === 0) return noBorders;

  // If we have a grid, also include pieces outside the grid bounding box
  if (grid) {
    const gridRight = grid.gridOrigin.x + grid.cols * grid.blockWidthPx;
    const gridBottom = grid.gridOrigin.y + grid.rows * grid.blockHeightPx;

    for (const piece of unassigned) {
      const alreadyIncluded = edgePieces.some((ep) => ep.piece.id === piece.id);
      if (alreadyIncluded) continue;

      const isOutsideGrid =
        piece.centroid.x < grid.gridOrigin.x ||
        piece.centroid.x > gridRight ||
        piece.centroid.y < grid.gridOrigin.y ||
        piece.centroid.y > gridBottom;

      if (isOutsideGrid) {
        const distances = computeEdgeDistances(piece, imageWidth, imageHeight);
        edgePieces.push({ piece, distances });
      }
    }
  }

  // Separate binding candidates from border candidates
  const shortDim = Math.min(imageWidth, imageHeight);
  const maxBindingWidth = shortDim * MAX_BINDING_WIDTH_FRACTION;

  const bindingPieceIds: string[] = [];
  const borderCandidates: Array<{ piece: DetectedPiece; minEdgeDist: number }> = [];

  for (const { piece, distances } of edgePieces) {
    const ar = aspectRatio(piece);
    const narrowDim = Math.min(piece.boundingRect.width, piece.boundingRect.height);

    if (ar >= MIN_BINDING_ASPECT_RATIO && narrowDim <= maxBindingWidth) {
      bindingPieceIds.push(piece.id);
    } else {
      borderCandidates.push({ piece, minEdgeDist: distances.minEdgeDist });
    }
  }

  // Group border candidates into layers by distance from edge
  const layerTolerance = shortDim * LAYER_MERGE_TOLERANCE_FRACTION;
  const sorted = [...borderCandidates].sort((a, b) => a.minEdgeDist - b.minEdgeDist);

  const layerGroups: Array<{ pieces: DetectedPiece[]; avgDist: number }> = [];
  for (const { piece, minEdgeDist } of sorted) {
    let merged = false;
    for (const group of layerGroups) {
      if (Math.abs(minEdgeDist - group.avgDist) < layerTolerance) {
        group.pieces.push(piece);
        // Update average
        group.avgDist =
          (group.avgDist * (group.pieces.length - 1) + minEdgeDist) / group.pieces.length;
        merged = true;
        break;
      }
    }
    if (!merged) {
      layerGroups.push({ pieces: [piece], avgDist: minEdgeDist });
    }
  }

  // Sort layers: outermost (smallest distance) first
  layerGroups.sort((a, b) => a.avgDist - b.avgDist);

  // Build border layers
  const layers: BorderLayer[] = layerGroups.map((group) => {
    const firstPiece = group.pieces[0];
    const color = colorSampler(
      firstPiece.boundingRect.x,
      firstPiece.boundingRect.y,
      firstPiece.boundingRect.width,
      firstPiece.boundingRect.height
    );

    return {
      widthInches: 0, // Converted by caller after scaling
      color,
      cornerStyle: 'butted' as const,
    };
  });

  const borderPieceIds = borderCandidates.map((c) => c.piece.id);

  // Build binding info
  let bindingInfo: BindingInfo = {
    detected: false,
    color: '',
    widthInches: 0,
    perimeterInches: 0,
  };

  if (bindingPieceIds.length > 0) {
    const bindingPiece = pieces.find((p) => p.id === bindingPieceIds[0]);
    if (bindingPiece) {
      const bindingColor = colorSampler(
        bindingPiece.boundingRect.x,
        bindingPiece.boundingRect.y,
        bindingPiece.boundingRect.width,
        bindingPiece.boundingRect.height
      );

      bindingInfo = {
        detected: true,
        color: bindingColor,
        widthInches: 0, // Converted by caller
        perimeterInches: 0,
      };
    }
  }

  return {
    borderInfo: { detected: layers.length > 0, layers },
    bindingInfo,
    borderPieceIds,
    bindingPieceIds,
  };
}
