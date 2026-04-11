/**
 * Orphan Piece Filter
 *
 * Removes detected pieces that share no edges with any other piece.
 * In a real quilt every patch is sewn to at least one neighbor —
 * isolated detections are always CV artifacts (dust, shadows, noise).
 *
 * Pure computation — zero DOM / React / Fabric.js dependencies.
 */

import type { DetectedPiece, Point2D } from '@/lib/photo-layout-types';

// ============================================================================
// Configuration
// ============================================================================

/**
 * Vertex proximity tolerance for determining shared edges.
 * Two pieces share an edge if ≥2 vertices fall within this distance.
 *
 * Phase 0: raised from 8 → 18 px. After approxPolyDP polygon approximation,
 * vertices on opposite sides of a shared seam routinely drift 5–15 px apart
 * even when the underlying pieces clearly share that edge in the source image.
 * The 8 px tolerance was dropping ~73% of legitimate pieces as false orphans
 * on the Fairgrounds test quilt.
 */
const SHARED_EDGE_TOLERANCE = 18.0;

// ============================================================================
// Result
// ============================================================================

/**
 * Result of orphan filtering.
 */
export interface OrphanFilterResult {
  /** Pieces with at least one neighbor (safe to pass to structure detection). */
  readonly pieces: readonly DetectedPiece[];
  /** IDs of pieces that were removed as orphans. */
  readonly orphanIds: readonly string[];
  /** How many pieces were removed. */
  readonly orphanCount: number;
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Filter out pieces that share no edges with any other piece.
 *
 * A piece is considered an **orphan** when none of its contour vertices
 * fall within `SHARED_EDGE_TOLERANCE` of any vertex from any other piece.
 * Real quilt pieces are always sewn to at least one neighbor, so orphans
 * are CV detection artifacts (dust, fabric texture shadows, noise).
 *
 * @param pieces - All detected pieces from the CV pipeline
 * @param options - Optional tolerance override
 * @returns Filtered pieces plus orphan metadata for logging
 */
export function filterOrphanPieces(
  pieces: readonly DetectedPiece[],
  options?: { tolerance?: number }
): OrphanFilterResult {
  if (pieces.length === 0) {
    return { pieces: [], orphanIds: [], orphanCount: 0 };
  }

  const tolerance = options?.tolerance ?? SHARED_EDGE_TOLERANCE;
  const tolSq = tolerance * tolerance;

  // Build adjacency: for each piece, track whether it shares ≥2 vertices
  // with any other piece (within tolerance).
  const hasNeighbor = new Uint8Array(pieces.length);

  for (let i = 0; i < pieces.length; i++) {
    const contourA = pieces[i].contour;

    for (let j = i + 1; j < pieces.length; j++) {
      const contourB = pieces[j].contour;

      if (piecesShareEdge(contourA, contourB, tolSq)) {
        hasNeighbor[i] = 1;
        hasNeighbor[j] = 1;
      }
    }
  }

  // Separate kept pieces from orphans
  const kept: DetectedPiece[] = [];
  const orphanIds: string[] = [];

  for (let i = 0; i < pieces.length; i++) {
    if (hasNeighbor[i]) {
      kept.push(pieces[i] as DetectedPiece);
    } else {
      orphanIds.push(pieces[i].id);
    }
  }

  return {
    pieces: Object.freeze(kept),
    orphanIds: Object.freeze(orphanIds),
    orphanCount: orphanIds.length,
  };
}

// ============================================================================
// Internal Helpers
// ============================================================================

/**
 * Check if two contours share at least 2 vertices within squared tolerance.
 *
 * Shared vertices indicate the pieces are sewn together along a common edge.
 */
function piecesShareEdge(a: readonly Point2D[], b: readonly Point2D[], tolSq: number): boolean {
  let sharedCount = 0;

  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) {
      const dx = a[i].x - b[j].x;
      const dy = a[i].y - b[j].y;
      if (dx * dx + dy * dy < tolSq) {
        sharedCount++;
        if (sharedCount >= 2) return true;
        break;
      }
    }
  }

  return false;
}
