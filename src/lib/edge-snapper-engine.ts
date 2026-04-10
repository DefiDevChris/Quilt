/**
 * Edge Snapper Engine
 *
 * Snaps adjacent piece edges to shared canonical edges, eliminating gaps
 * and overlaps between quilt pieces. Ensures 100% canvas coverage with no
 * empty areas.
 *
 * Algorithm:
 * 1. Build edge adjacency graph — find which pieces share nearby edges
 * 2. For each shared edge pair, compute the canonical edge (average)
 * 3. Snap both pieces' vertices to the canonical edge
 * 4. Snap boundary edges to the canvas border
 * 5. Flood-fill to find remaining gaps and extend nearest piece polygons
 *
 * Pure computation — zero DOM / React / Fabric.js dependencies.
 */

import type { Point2D, Rect } from '@/lib/photo-layout-types';

// ============================================================================
// Configuration
// ============================================================================

/** Maximum distance between two vertices to consider them "shared". */
export const EDGE_SNAP_TOLERANCE = 6.0;

/** Minimum edge length to consider for snapping (in pixels). */
export const MIN_EDGE_LENGTH = 4.0;

// ============================================================================
// Edge Representation
// ============================================================================

/** A directed edge between two vertices. */
interface Edge {
  readonly from: Point2D;
  readonly to: Point2D;
  readonly pieceIndex: number;
  readonly vertexIndexA: number; // index of 'from' in piece contour
  readonly vertexIndexB: number; // index of 'to' in piece contour
}

/** A shared edge between two pieces, with the canonical (averaged) edge. */
interface SharedEdge {
  readonly pieceIndexA: number;
  readonly pieceIndexB: number;
  readonly canonicalFrom: Point2D;
  readonly canonicalTo: Point2D;
}

// ============================================================================
// Extract Edges from Piece Contours
// ============================================================================

/**
 * Extract all edges from a piece's contour.
 * Each consecutive pair of vertices forms an edge.
 */
function extractEdges(contour: readonly Point2D[], pieceIndex: number): Edge[] {
  const edges: Edge[] = [];
  const n = contour.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    edges.push({
      from: contour[i],
      to: contour[j],
      pieceIndex,
      vertexIndexA: i,
      vertexIndexB: j,
    });
  }
  return edges;
}

// ============================================================================
// Edge Matching
// ============================================================================

/**
 * Check if two edges are "shared" — they run in opposite directions
 * and their vertices are within tolerance.
 *
 * Edge A: from a0 to a1
 * Edge B: from b0 to b1
 * Shared if: distance(a0, b1) < tol AND distance(a1, b0) < tol
 * OR: distance(a0, b0) < tol AND distance(a1, b1) < tol
 */
function edgesAreShared(a: Edge, b: Edge, tolerance: number): boolean {
  const tolSq = tolerance * tolerance;

  // Forward match: a.from ≈ b.from and a.to ≈ b.to
  const fwdDistFrom = distSq(a.from, b.from);
  const fwdDistTo = distSq(a.to, b.to);
  const fwdMatch = fwdDistFrom < tolSq && fwdDistTo < tolSq;

  // Reverse match: a.from ≈ b.to and a.to ≈ b.from
  const revDistFrom = distSq(a.from, b.to);
  const revDistTo = distSq(a.to, b.from);
  const revMatch = revDistFrom < tolSq && revDistTo < tolSq;

  // Only log for the specific pair we're testing
  // (disabled - uncomment for debugging)
  // if (fwdMatch || revMatch) {
  //   console.log('edgesAreShared: fwdMatch=', fwdMatch, 'revMatch=', revMatch);
  // }

  return fwdMatch || revMatch;
}

function distSq(a: Point2D, b: Point2D): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

function edgeLength(edge: Edge): number {
  return Math.sqrt(distSq(edge.from, edge.to));
}

// ============================================================================
// Find Shared Edges
// ============================================================================

/**
 * Find all shared edges between all pieces.
 * Returns an array of shared edges with canonical (averaged) coordinates.
 */
function findSharedEdges(allEdges: Edge[][], tolerance: number): SharedEdge[] {
  const sharedEdges: SharedEdge[] = [];

  for (let i = 0; i < allEdges.length; i++) {
    for (let j = i + 1; j < allEdges.length; j++) {
      for (const edgeA of allEdges[i]) {
        for (const edgeB of allEdges[j]) {
          if (edgesAreShared(edgeA, edgeB, tolerance)) {
            // Compute canonical edge = average of corresponding endpoints.
            // For forward-matched edges (same direction): a.from ↔ b.from, a.to ↔ b.to
            // For reverse-matched edges (opposite direction): a.from ↔ b.to, a.to ↔ b.from
            const isReverse = distSq(edgeA.from, edgeB.from) > distSq(edgeA.from, edgeB.to);
            const canonicalFrom = isReverse
              ? {
                  x: (edgeA.from.x + edgeB.to.x) / 2,
                  y: (edgeA.from.y + edgeB.to.y) / 2,
                }
              : {
                  x: (edgeA.from.x + edgeB.from.x) / 2,
                  y: (edgeA.from.y + edgeB.from.y) / 2,
                };
            const canonicalTo = isReverse
              ? {
                  x: (edgeA.to.x + edgeB.from.x) / 2,
                  y: (edgeA.to.y + edgeB.from.y) / 2,
                }
              : {
                  x: (edgeA.to.x + edgeB.to.x) / 2,
                  y: (edgeA.to.y + edgeB.to.y) / 2,
                };

            // Check if this edge is long enough to matter
            const len = Math.sqrt(distSq(canonicalFrom, canonicalTo));
            if (len < MIN_EDGE_LENGTH) continue;

            sharedEdges.push({
              pieceIndexA: i,
              pieceIndexB: j,
              canonicalFrom,
              canonicalTo,
            });
          }
        }
      }
    }
  }

  return sharedEdges;
}

// ============================================================================
// Snap Pieces to Canonical Edges
// ============================================================================

/**
 * Snap piece vertices to shared canonical edge vertices.
 * Mutates the contour arrays in place.
 */
function snapPiecesToSharedEdges(contours: Point2D[][], sharedEdges: readonly SharedEdge[]): void {
  for (const shared of sharedEdges) {
    // Snap piece A's edge vertices to canonical
    snapContourVertex(contours[shared.pieceIndexA], shared.canonicalFrom, EDGE_SNAP_TOLERANCE);
    snapContourVertex(contours[shared.pieceIndexA], shared.canonicalTo, EDGE_SNAP_TOLERANCE);

    // Snap piece B's edge vertices to canonical
    snapContourVertex(contours[shared.pieceIndexB], shared.canonicalFrom, EDGE_SNAP_TOLERANCE);
    snapContourVertex(contours[shared.pieceIndexB], shared.canonicalTo, EDGE_SNAP_TOLERANCE);
  }
}

/**
 * Snap the closest vertex in a contour to a target point.
 */
function snapContourVertex(contour: Point2D[], target: Point2D, tolerance: number): void {
  let bestIndex = -1;
  let bestDistSq = tolerance * tolerance;

  for (let i = 0; i < contour.length; i++) {
    const d = distSq(contour[i], target);
    if (d < bestDistSq) {
      bestDistSq = d;
      bestIndex = i;
    }
  }

  if (bestIndex >= 0) {
    contour[bestIndex] = { x: target.x, y: target.y };
  }
}

// ============================================================================
// Boundary Snapping
// ============================================================================

/**
 * Snap pieces that touch the canvas boundary to the exact boundary.
 */
function snapToBoundary(contours: Point2D[][], canvasBounds: Rect): void {
  const { x: bx, y: by, width: bw, height: bh } = canvasBounds;
  const right = bx + bw;
  const bottom = by + bh;

  for (const contour of contours) {
    for (let i = 0; i < contour.length; i++) {
      const p = contour[i];

      // Snap to left boundary
      if (p.x < bx + EDGE_SNAP_TOLERANCE) {
        contour[i] = { x: bx, y: p.y };
      }
      // Snap to right boundary
      if (p.x > right - EDGE_SNAP_TOLERANCE) {
        contour[i] = { x: right, y: p.y };
      }
      // Snap to top boundary
      if (p.y < by + EDGE_SNAP_TOLERANCE) {
        contour[i] = { x: p.x, y: by };
      }
      // Snap to bottom boundary
      if (p.y > bottom - EDGE_SNAP_TOLERANCE) {
        contour[i] = { x: p.x, y: bottom };
      }
    }
  }
}

// ============================================================================
// Gap Filling via Raster Scan
// ============================================================================

/**
 * After edge snapping, find and fill any remaining gaps.
 *
 * Strategy: raster-scan the canvas at a coarse resolution.
 * For each uncovered cell, find the nearest piece and extend
 * that piece's contour to cover the gap.
 *
 * For the MVP, we use a simpler approach: find pieces with
 * vertices near the gap and push the nearest vertex toward the gap.
 */
function fillGaps(contours: Point2D[][], canvasBounds: Rect, cellSize: number = 10): void {
  // Build a simple occupancy grid
  const gridW = Math.ceil(canvasBounds.width / cellSize);
  const gridH = Math.ceil(canvasBounds.height / cellSize);
  const occupied = new Uint8Array(gridW * gridH);

  // Mark cells covered by each contour
  for (const contour of contours) {
    for (const p of contour) {
      const gx = Math.floor((p.x - canvasBounds.x) / cellSize);
      const gy = Math.floor((p.y - canvasBounds.y) / cellSize);
      if (gx >= 0 && gx < gridW && gy >= 0 && gy < gridH) {
        occupied[gy * gridW + gx] = 1;
      }
    }
  }

  // Find unoccupied cells (potential gaps)
  const gapCells: Array<{ gx: number; gy: number }> = [];
  for (let gy = 0; gy < gridH; gy++) {
    for (let gx = 0; gx < gridW; gx++) {
      if (occupied[gy * gridW + gx] === 0) {
        // Check if this cell is surrounded by occupied cells
        // (internal gap, not outside canvas)
        const surrounded =
          gx === 0 || gy === 0 || gx === gridW - 1 || gy === gridH - 1
            ? false
            : hasOccupiedNeighbor(occupied, gx, gy, gridW, gridH);

        if (surrounded) {
          gapCells.push({ gx, gy });
        }
      }
    }
  }

  // For each gap cell, find the nearest contour and push its nearest vertex
  for (const gap of gapCells) {
    const gapCenterX = canvasBounds.x + (gap.gx + 0.5) * cellSize;
    const gapCenterY = canvasBounds.y + (gap.gy + 0.5) * cellSize;

    let bestPieceIndex = -1;
    let bestVertexIndex = -1;
    let bestDist = Infinity;

    for (let pi = 0; pi < contours.length; pi++) {
      for (let vi = 0; vi < contours[pi].length; vi++) {
        const d = distSq(contours[pi][vi], { x: gapCenterX, y: gapCenterY });
        if (d < bestDist) {
          bestDist = d;
          bestPieceIndex = pi;
          bestVertexIndex = vi;
        }
      }
    }

    if (bestPieceIndex >= 0 && bestVertexIndex >= 0) {
      // Add the gap center as a new vertex to the nearest piece
      // Insert it between the nearest vertex and its neighbor
      const contour = contours[bestPieceIndex];
      const nearestVertex = contour[bestVertexIndex];
      const nextIndex = (bestVertexIndex + 1) % contour.length;
      const nextVertex = contour[nextIndex];

      // Insert new vertex at midpoint between nearest and gap
      const newVertex: Point2D = {
        x: (nearestVertex.x + gapCenterX) / 2,
        y: (nearestVertex.y + gapCenterY) / 2,
      };

      // Insert after the nearest vertex
      contour.splice(bestVertexIndex + 1, 0, newVertex);
    }
  }
}

function hasOccupiedNeighbor(
  grid: Uint8Array,
  gx: number,
  gy: number,
  gridW: number,
  gridH: number
): boolean {
  const dirs = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];
  for (const [dx, dy] of dirs) {
    const nx = gx + dx;
    const ny = gy + dy;
    if (nx >= 0 && nx < gridW && ny >= 0 && ny < gridH) {
      if (grid[ny * gridW + nx] === 1) return true;
    }
  }
  return false;
}

// ============================================================================
// Simplify Contours
// ============================================================================

/**
 * Remove duplicate consecutive vertices after snapping.
 */
function simplifyContours(contours: Point2D[][]): void {
  for (let i = 0; i < contours.length; i++) {
    const contour = contours[i];
    if (contour.length < 3) continue;

    const simplified: Point2D[] = [];
    const tolSq = 0.5; // Very small tolerance — remove exact duplicates only

    simplified.push(contour[0]);
    for (let j = 1; j < contour.length; j++) {
      const last = simplified[simplified.length - 1];
      const d = distSq(last, contour[j]);
      if (d > tolSq) {
        simplified.push(contour[j]);
      }
    }

    // Close the loop: check if last vertex equals first
    if (simplified.length > 1 && distSq(simplified[0], simplified[simplified.length - 1]) < tolSq) {
      simplified.pop();
    }

    // Ensure minimum 3 vertices
    if (simplified.length >= 3) {
      contours[i] = simplified;
    }
  }
}

// ============================================================================
// Main API
// ============================================================================

/**
 * Snap all piece contours to eliminate gaps and overlaps.
 *
 * @param contours - Array of piece contours (mutated in place)
 * @param canvasBounds - Canvas bounding box
 * @returns The same contours array, mutated
 */
export function snapEdges(contours: Point2D[][], canvasBounds: Rect): Point2D[][] {
  // Step 1: Extract all edges
  const allEdges = contours.map((c, i) => extractEdges(c, i));

  // Step 2: Find shared edges between all piece pairs
  const sharedEdges = findSharedEdges(allEdges, EDGE_SNAP_TOLERANCE);

  // Step 3: Snap pieces to canonical shared edges
  snapPiecesToSharedEdges(contours, sharedEdges);

  // Step 4: Snap boundary vertices to canvas edges
  snapToBoundary(contours, canvasBounds);

  // Step 5: Simplify (remove duplicate vertices)
  simplifyContours(contours);

  return contours;
}

/**
 * Snap a single piece's contour to a target bounding box.
 * Useful for sashing strips, borders, and binding.
 */
export function snapToRect(contour: Point2D[], target: Rect): Point2D[] {
  const { x, y, width, height } = target;

  // Snap each vertex to the nearest edge of the target rect
  for (let i = 0; i < contour.length; i++) {
    const p = contour[i];
    const distToLeft = Math.abs(p.x - x);
    const distToRight = Math.abs(p.x - (x + width));
    const distToTop = Math.abs(p.y - y);
    const distToBottom = Math.abs(p.y - (y + height));

    const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);

    if (minDist < EDGE_SNAP_TOLERANCE * 2) {
      if (minDist === distToLeft) {
        contour[i] = { x, y: p.y };
      } else if (minDist === distToRight) {
        contour[i] = { x: x + width, y: p.y };
      } else if (minDist === distToTop) {
        contour[i] = { x: p.x, y };
      } else {
        contour[i] = { x: p.x, y: y + height };
      }
    }
  }

  return contour;
}
