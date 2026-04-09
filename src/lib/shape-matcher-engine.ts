/**
 * Shape Matcher Engine
 *
 * Matches detected block cells (groups of OpenCV-extracted pieces) against
 * the 50 known block SVG signatures. Returns a confidence score and piece-to-patch
 * mapping for each cell.
 *
 * Matching strategy (multi-stage cascade for performance):
 * 1. Patch count filter (fast reject — eliminate blocks with very different counts)
 * 2. Vertex distribution similarity (do pieces have the right shape types?)
 * 3. Adjacency graph similarity (do pieces touch the same neighbors?)
 * 4. Relative area similarity (are patch proportions similar?)
 * 5. Curve presence check (curved blocks vs straight blocks)
 *
 * Pure computation — zero DOM / React / Fabric.js dependencies.
 */

import type {
  BlockSignature,
  BlockMatchResult,
  DetectedBlockCell,
  DetectedPiece,
  Point2D,
  ShapeCorrectionResult,
  CorrectedPiece,
  PieceRole,
} from '@/lib/photo-layout-types';
import { polygonArea } from '@/lib/block-signature-registry';

// ============================================================================
// Configuration
// ============================================================================

/** Minimum confidence to consider a match valid. */
export const DEFAULT_CONFIDENCE_THRESHOLD = 0.65;

/** Maximum allowed patch count difference for stage 1 filter. */
export const MAX_PATCH_COUNT_DIFF = 3;

/** Weights for each matching stage. */
const WEIGHTS = {
  vertexDistribution: 0.25,
  adjacency: 0.35,
  relativeAreas: 0.25,
  curvePenalty: 0.15,
} as const;

// ============================================================================
// Stage 1: Patch Count Filter
// ============================================================================

/**
 * Fast reject: if detected patch count differs too much from a block's patch count,
 * skip the expensive comparison.
 */
function passesPatchCountFilter(
  detectedPatchCount: number,
  signature: BlockSignature
): boolean {
  return Math.abs(detectedPatchCount - signature.patchCount) <= MAX_PATCH_COUNT_DIFF;
}

// ============================================================================
// Stage 2: Vertex Distribution Similarity
// ============================================================================

/**
 * Compare the vertex count distributions of detected pieces vs block signature.
 * Returns a score 0.0–1.0.
 *
 * E.g., if detected has 9 quads and block has 9 quads → 1.0
 * If detected has 6 triangles + 3 quads and block has 4 triangles + 5 quads → partial
 */
function compareVertexDistribution(
  detectedVertexCounts: readonly number[],
  signature: BlockSignature
): number {
  // Build frequency maps
  const detectedFreq = new Map<number, number>();
  for (const vc of detectedVertexCounts) {
    detectedFreq.set(vc, (detectedFreq.get(vc) ?? 0) + 1);
  }

  // Compute overlap score
  let totalDetected = detectedVertexCounts.length;
  if (totalDetected === 0) return 0;

  let matchedCount = 0;

  for (const [vertexCount, detectedCount] of detectedFreq) {
    const sigCount = signature.vertexDistribution.get(vertexCount) ?? 0;
    matchedCount += Math.min(detectedCount, sigCount);
  }

  // Normalize by the max possible (average of both distributions' sizes)
  const sigTotal = signature.patchCount;
  const maxPossible = (totalDetected + sigTotal) / 2;

  return maxPossible > 0 ? matchedCount / maxPossible : 0;
}

// ============================================================================
// Stage 3: Adjacency Graph Similarity
// ============================================================================

/**
 * Compare adjacency graphs using edge count and structure similarity.
 * Returns a score 0.0–1.0.
 */
function compareAdjacency(
  detectedAdjacency: Array<[number, number]>,
  signature: BlockSignature
): number {
  const detCount = detectedAdjacency.length;
  const sigCount = signature.adjacencyPairs.length;

  if (detCount === 0 && sigCount === 0) return 1.0;
  if (detCount === 0 || sigCount === 0) return 0;

  // Simple edge count similarity (normalized)
  const countSimilarity = 1 - Math.abs(detCount - sigCount) / Math.max(detCount, sigCount);

  // For a more detailed comparison, we'd need to match detected patches to
  // signature patches first (a bipartite matching problem). For the MVP,
  // edge count similarity + degree distribution is a good approximation.

  // Degree distribution similarity
  const detDegrees = computeDegreeDistribution(detectedAdjacency);
  const sigDegrees = computeDegreeDistribution(signature.adjacencyPairs);

  const degreeSimilarity = compareDegreeDistributions(detDegrees, sigDegrees);

  // Weighted combination
  return countSimilarity * 0.4 + degreeSimilarity * 0.6;
}

function computeDegreeDistribution(
  edges: readonly (readonly [number, number])[]
): Map<number, number> {
  const degrees = new Map<number, number>();

  for (const [a, b] of edges) {
    degrees.set(a, (degrees.get(a) ?? 0) + 1);
    degrees.set(b, (degrees.get(b) ?? 0) + 1);
  }

  // Return degree value distribution
  const dist = new Map<number, number>();
  for (const degree of degrees.values()) {
    dist.set(degree, (dist.get(degree) ?? 0) + 1);
  }

  return dist;
}

function compareDegreeDistributions(
  a: Map<number, number>,
  b: Map<number, number>
): number {
  const allDegrees = new Set([...a.keys(), ...b.keys()]);
  if (allDegrees.size === 0) return 1.0;

  const aTotal = sumValues(a);
  const bTotal = sumValues(b);
  if (aTotal === 0 || bTotal === 0) return 0;

  let similarity = 0;
  for (const degree of allDegrees) {
    const aPct = (a.get(degree) ?? 0) / aTotal;
    const bPct = (b.get(degree) ?? 0) / bTotal;
    similarity += 1 - Math.abs(aPct - bPct);
  }

  return similarity / allDegrees.size;
}

function sumValues(map: Map<number, number>): number {
  let sum = 0;
  for (const v of map.values()) sum += v;
  return sum;
}

// ============================================================================
// Stage 4: Relative Area Similarity
// ============================================================================

/**
 * Compare relative area distributions.
 * Sorts both arrays and compares element-wise.
 * Returns a score 0.0–1.0.
 */
function compareRelativeAreas(
  detectedAreas: readonly number[],
  signature: BlockSignature
): number {
  const detSorted = [...detectedAreas].sort((a, b) => b - a);
  const sigSorted = [...signature.relativeAreas].sort((a, b) => b - a);

  // Normalize to same length (pad shorter with zeros)
  const maxLen = Math.max(detSorted.length, sigSorted.length);
  if (maxLen === 0) return 1.0;

  const detNorm = normalizeArray(detSorted, maxLen);
  const sigNorm = normalizeArray(sigSorted, maxLen);

  // Earth mover's distance approximation: sum of absolute differences
  let totalDiff = 0;
  for (let i = 0; i < maxLen; i++) {
    totalDiff += Math.abs(detNorm[i] - sigNorm[i]);
  }

  // Max possible difference is 2.0 (completely disjoint distributions)
  // So similarity = 1 - diff/2
  return Math.max(0, 1 - totalDiff / 2);
}

function normalizeArray(arr: readonly number[], targetLen: number): number[] {
  const sum = arr.reduce((a, b) => a + b, 0);
  if (sum === 0) return new Array(targetLen).fill(0);

  const result = arr.map((v) => v / sum);
  while (result.length < targetLen) result.push(0);
  return result.slice(0, targetLen);
}

// ============================================================================
// Stage 5: Curve Presence Penalty
// ============================================================================

/**
 * If the signature has curves but detected pieces are all straight polygons,
 * or vice versa, penalize the score.
 */
function curveScore(detectedHasCurves: boolean, signature: BlockSignature): number {
  if (signature.hasCurves && !detectedHasCurves) return 0.3; // Strong penalty
  if (!signature.hasCurves && detectedHasCurves) return 0.5; // Moderate penalty
  return 1.0; // No penalty
}

// ============================================================================
// Main Matching
// ============================================================================

/**
 * Compute the vertex count for a detected piece.
 * For polygons, this is the contour length.
 */
function getVertexCount(piece: DetectedPiece): number {
  return piece.contour.length;
}

/**
 * Build adjacency from detected pieces by checking if two pieces share
 * nearby vertices (within tolerance).
 */
function buildDetectedAdjacency(
  pieces: readonly DetectedPiece[],
  tolerance: number = 8.0
): Array<[number, number]> {
  const pairs: Array<[number, number]> = [];

  for (let i = 0; i < pieces.length; i++) {
    for (let j = i + 1; j < pieces.length; j++) {
      if (piecesShareVertex(pieces[i].contour, pieces[j].contour, tolerance)) {
        pairs.push([i, j]);
      }
    }
  }

  return pairs;
}

/**
 * Check if two contours share at least 2 vertices within tolerance.
 */
function piecesShareVertex(
  a: readonly Point2D[],
  b: readonly Point2D[],
  tolerance: number
): boolean {
  let sharedCount = 0;
  const tolSq = tolerance * tolerance;

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

/**
 * Match a single detected block cell against all block signatures.
 * Returns the best match or null if no match exceeds the threshold.
 */
export function matchBlockCell(
  pieces: readonly DetectedPiece[],
  signatures: ReadonlyMap<string, BlockSignature>,
  options?: {
    confidenceThreshold?: number;
  }
): BlockMatchResult | null {
  const threshold = options?.confidenceThreshold ?? DEFAULT_CONFIDENCE_THRESHOLD;

  // Compute cell signature
  const patchCount = pieces.length;
  const vertexCounts = pieces.map(getVertexCount);
  const adjacency = buildDetectedAdjacency(pieces);
  const areas = pieces.map((p) => p.areaPx);
  const totalArea = areas.reduce((sum, a) => sum + a, 0);
  const relativeAreas = totalArea > 0 ? areas.map((a) => a / totalArea) : areas;
  const hasCurves = pieces.some((p) => p.contour.length > 12);
  // Heuristic: many vertices suggests a curved piece

  let bestMatch: BlockMatchResult | null = null;
  let bestScore = 0;

  for (const [, sig] of signatures) {
    // Stage 1: Patch count filter (fast reject)
    if (!passesPatchCountFilter(patchCount, sig)) continue;

    // Stage 2: Vertex distribution
    const vertexScore = compareVertexDistribution(vertexCounts, sig);

    // Stage 3: Adjacency graph
    const adjacencyScore = compareAdjacency(adjacency, sig);

    // Stage 4: Relative areas
    const areaScore = compareRelativeAreas(relativeAreas, sig);

    // Stage 5: Curve check
    const curveScoreVal = curveScore(hasCurves, sig);

    // Weighted combination
    const totalScore =
      vertexScore * WEIGHTS.vertexDistribution +
      adjacencyScore * WEIGHTS.adjacency +
      areaScore * WEIGHTS.relativeAreas +
      curveScoreVal * WEIGHTS.curvePenalty;

    if (totalScore > bestScore && totalScore >= threshold) {
      bestScore = totalScore;
      bestMatch = {
        blockId: sig.blockId,
        displayName: sig.displayName,
        confidence: Math.round(totalScore * 1000) / 1000,
        pieceToPatchMapping: greedyPatchMapping(pieces, sig),
      };
    }
  }

  return bestMatch;
}

/**
 * Greedily map detected pieces to signature patches by relative position.
 * Returns an array where index i = detected piece index, value = signature patch index.
 */
function greedyPatchMapping(
  pieces: readonly DetectedPiece[],
  signature: BlockSignature
): number[] {
  // Normalize piece centroids to 0-1 range
  const cellMinX = Math.min(...pieces.map((p) => p.boundingRect.x));
  const cellMinY = Math.min(...pieces.map((p) => p.boundingRect.y));
  const cellMaxX = Math.max(...pieces.map((p) => p.boundingRect.x + p.boundingRect.width));
  const cellMaxY = Math.max(...pieces.map((p) => p.boundingRect.y + p.boundingRect.height));
  const cellW = cellMaxX - cellMinX || 1;
  const cellH = cellMaxY - cellMinY || 1;

  const normalizedCentroids = pieces.map((p) => ({
    x: (p.centroid.x - cellMinX) / cellW,
    y: (p.centroid.y - cellMinY) / cellH,
    area: p.areaPx,
  }));

  // Signature patches are in 300x300 space, normalize to 0-1
  const sigPatchCentroids: Array<{ x: number; y: number; area: number }> = [];
  // We don't have raw patch data in the signature, so use relative areas as a proxy
  for (let i = 0; i < signature.relativeAreas.length; i++) {
    // For a proper implementation, we'd store patch centroids in the signature.
    // For the MVP, we assign by sorting both arrays by area and matching in order.
    sigPatchCentroids.push({ x: 0, y: 0, area: signature.relativeAreas[i] });
  }

  // Sort detected pieces by area
  const detByArea = normalizedCentroids
    .map((c, i) => ({ ...c, origIndex: i }))
    .sort((a, b) => b.area - a.area);

  const sigByArea = sigPatchCentroids
    .map((c, i) => ({ ...c, origIndex: i }))
    .sort((a, b) => b.area - a.area);

  // Map by rank order (largest piece to largest patch)
  const mapping = new Array(pieces.length).fill(0);
  for (let i = 0; i < Math.min(detByArea.length, sigByArea.length); i++) {
    mapping[detByArea[i].origIndex] = sigByArea[i].origIndex;
  }

  return mapping;
}

// ============================================================================
// Cell Extraction & Full Correction
// ============================================================================

/**
 * Extract block cells from the quilt structure grid and detected pieces.
 */
export function extractBlockCells(
  grid: {
    readonly cells: readonly {
      readonly row: number;
      readonly col: number;
      readonly pieceIds: readonly string[];
    }[];
  },
  pieceMap: Map<string, DetectedPiece>
): DetectedBlockCell[] {
  const cells: DetectedBlockCell[] = [];

  for (const cell of grid.cells) {
    const cellPieces = cell.pieceIds
      .map((id) => pieceMap.get(id))
      .filter((p): p is DetectedPiece => p !== undefined);

    if (cellPieces.length === 0) continue;

    // Compute cell bounding box from piece bounding rects
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const p of cellPieces) {
      minX = Math.min(minX, p.boundingRect.x);
      minY = Math.min(minY, p.boundingRect.y);
      maxX = Math.max(maxX, p.boundingRect.x + p.boundingRect.width);
      maxY = Math.max(maxY, p.boundingRect.y + p.boundingRect.height);
    }

    cells.push({
      cellKey: `${cell.row},${cell.col}`,
      row: cell.row,
      col: cell.col,
      pieceIds: cell.pieceIds,
      boundsPx: { x: minX, y: minY, width: maxX - minX, height: maxY - minY },
    });
  }

  return cells;
}

/**
 * Run shape correction on all detected block cells.
 *
 * @param blockCells - Extracted block cells from the grid
 * @param pieceMap - Map of piece ID → detected piece
 * @param signatures - Precomputed block signatures
 * @param options - Matching options
 * @returns ShapeCorrectionResult with matches and corrected pieces
 */
export function runShapeCorrection(
  blockCells: readonly DetectedBlockCell[],
  pieceMap: Map<string, DetectedPiece>,
  signatures: ReadonlyMap<string, BlockSignature>,
  options?: {
    confidenceThreshold?: number;
  }
): ShapeCorrectionResult {
  const blockMatches = new Map<string, BlockMatchResult>();
  const unmatchedCellKeys: string[] = [];
  const correctedPieces: CorrectedPiece[] = [];

  for (const cell of blockCells) {
    const cellPieces = cell.pieceIds
      .map((id) => pieceMap.get(id))
      .filter((p): p is DetectedPiece => p !== undefined);

    if (cellPieces.length === 0) continue;

    const match = matchBlockCell(cellPieces, signatures, options);

    if (match) {
      blockMatches.set(cell.cellKey, match);

      // For matched cells, we'll use the SVG patches directly (handled by the loader).
      // Create placeholder corrected pieces that reference the block SVG.
      const sig = signatures.get(match.blockId);
      if (sig) {
        for (let i = 0; i < sig.patchCount; i++) {
          correctedPieces.push({
            id: `${cell.cellKey}-patch-${i}`,
            contourPx: [], // Will be filled by block-svg-loader
            source: 'block-svg',
            blockRef: { blockId: match.blockId, patchIndex: i },
            role: 'block',
            dominantColor: '#D0D0D0',
          });
        }
      }
    } else {
      unmatchedCellKeys.push(cell.cellKey);

      // Keep raw detected pieces as corrected pieces
      for (const piece of cellPieces) {
        correctedPieces.push({
          id: piece.id,
          contourPx: piece.contour,
          source: 'detected',
          role: 'block',
          dominantColor: piece.dominantColor,
        });
      }
    }
  }

  return Object.freeze({
    blockMatches: Object.freeze(blockMatches),
    correctedPieces: Object.freeze(correctedPieces),
    unmatchedCellKeys: Object.freeze(unmatchedCellKeys),
  });
}
