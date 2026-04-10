/**
 * Shape Normalizer Engine
 *
 * Takes raw DetectedPiece[] (post-orphan-filter from the OpenCV worker) and
 * produces normalized, regularized contours ready for edge-snapping.
 *
 * Pipeline:
 * 1. Cluster similar shapes by vertex count + normalized area ratio
 * 2. Regularize each cluster's master contour (grid snap, edge straighten,
 *    shape-specific cleanup)
 * 3. Equalize sizes within each cluster to the median area
 * 4. Straighten rotation to nearest cardinal orientation
 *
 * Pure computation — zero DOM / React / Fabric.js dependencies.
 */

import type { Point2D, DetectedPiece, ShapeCluster, ShapeType } from '@/lib/photo-layout-types';

// ============================================================================
// Configuration
// ============================================================================

export interface NormalizerConfig {
  /** 0.0-1.0 — how similar shapes must be to cluster together. */
  readonly clusterTolerance: number;
  /** Vertex snapping unit in pixels. */
  readonly gridSnap: number;
  /** Max rotation correction in degrees. */
  readonly straightenAngleDeg: number;
}

export const DEFAULT_NORMALIZER_CONFIG: NormalizerConfig = {
  clusterTolerance: 0.15,
  gridSnap: 2.0,
  straightenAngleDeg: 5.0,
};

// ============================================================================
// Result
// ============================================================================

export interface NormalizerResult {
  /** Normalized contours, same order as input pieces. */
  readonly normalizedContours: readonly Point2D[][];
  /** Shape clusters with master contour and metadata. */
  readonly clusters: readonly ShapeCluster[];
  /** pieceId -> clusterId mapping. */
  readonly pieceToClusterMap: ReadonlyMap<string, string>;
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Normalize detected piece contours: cluster, regularize, equalize, straighten.
 *
 * @param pieces - Detected pieces from the orphan filter
 * @param config - Optional partial config (merged with defaults)
 * @returns Normalized contours and cluster metadata
 */
export function normalizeShapes(
  pieces: readonly DetectedPiece[],
  config?: Partial<NormalizerConfig>
): NormalizerResult {
  if (pieces.length === 0) {
    return {
      normalizedContours: [],
      clusters: [],
      pieceToClusterMap: new Map(),
    };
  }

  const cfg: NormalizerConfig = { ...DEFAULT_NORMALIZER_CONFIG, ...config };

  // Step 1: Cluster similar shapes
  const clusterAssignments = clusterPieces(pieces, cfg.clusterTolerance);

  // Step 2: Build master contours and regularize them
  const clusters = buildClusters(pieces, clusterAssignments, cfg);

  // Step 3: Produce normalized contours per piece (equalized + straightened)
  const normalizedContours = buildNormalizedContours(pieces, clusters, clusterAssignments, cfg);

  // Step 4: Build pieceId -> clusterId map
  const pieceToClusterMap = new Map<string, string>();
  for (let i = 0; i < pieces.length; i++) {
    pieceToClusterMap.set(pieces[i].id, clusters[clusterAssignments[i]].id);
  }

  return {
    normalizedContours,
    clusters,
    pieceToClusterMap,
  };
}

// ============================================================================
// Step 1: Clustering
// ============================================================================

/**
 * Assign each piece to a cluster index based on vertex count and
 * normalized area ratio similarity.
 *
 * Returns an array of cluster indices (same length as pieces).
 */
function clusterPieces(pieces: readonly DetectedPiece[], tolerance: number): number[] {
  const assignments: number[] = new Array(pieces.length).fill(-1);
  let nextCluster = 0;

  for (let i = 0; i < pieces.length; i++) {
    if (assignments[i] >= 0) continue;

    assignments[i] = nextCluster;

    for (let j = i + 1; j < pieces.length; j++) {
      if (assignments[j] >= 0) continue;

      if (shapesAreSimilar(pieces[i], pieces[j], tolerance)) {
        assignments[j] = nextCluster;
      }
    }

    nextCluster++;
  }

  return assignments;
}

/**
 * Compare two pieces for shape similarity using vertex count and
 * normalized area ratio.
 */
function shapesAreSimilar(a: DetectedPiece, b: DetectedPiece, tolerance: number): boolean {
  if (a.contour.length !== b.contour.length) return false;

  const areaA = Math.abs(computePolygonArea(a.contour));
  const areaB = Math.abs(computePolygonArea(b.contour));

  if (areaA === 0 || areaB === 0) return false;

  const areaRatio = Math.min(areaA, areaB) / Math.max(areaA, areaB);

  // Area ratio must be within (1 - tolerance)
  return areaRatio >= 1.0 - tolerance;
}

// ============================================================================
// Step 2: Build Clusters with Master Contours
// ============================================================================

/**
 * Build ShapeCluster objects with regularized master contours.
 */
function buildClusters(
  pieces: readonly DetectedPiece[],
  assignments: readonly number[],
  cfg: NormalizerConfig
): ShapeCluster[] {
  const clusterCount = Math.max(...assignments) + 1;
  const clusters: ShapeCluster[] = [];

  for (let c = 0; c < clusterCount; c++) {
    const memberIndices = assignments.map((a, i) => (a === c ? i : -1)).filter((i) => i >= 0);

    const pieceIds = memberIndices.map((i) => pieces[i].id);
    const representativeContour = pieces[memberIndices[0]].contour;
    const vertexCount = representativeContour.length;
    const shapeType = classifyShape(vertexCount);

    // Build master contour from the representative, then regularize
    const masterContour = regularizeContour(
      representativeContour.map((p) => ({ x: p.x, y: p.y })),
      shapeType,
      cfg
    );

    const masterArea = Math.abs(computePolygonArea(masterContour));

    clusters.push({
      id: `cluster-${c}`,
      pieceIds,
      masterContour,
      vertexCount,
      shapeType,
      masterArea,
    });
  }

  return clusters;
}

/**
 * Classify a polygon by its vertex count.
 */
function classifyShape(vertexCount: number): ShapeType {
  switch (vertexCount) {
    case 3:
      return 'triangle';
    case 4:
      return 'quadrilateral';
    case 5:
      return 'pentagon';
    case 6:
      return 'hexagon';
    default:
      return 'other';
  }
}

// ============================================================================
// Step 2b: Contour Regularization
// ============================================================================

/**
 * Regularize a contour: grid-snap vertices, straighten edges, and
 * apply shape-specific cleanup.
 */
function regularizeContour(
  contour: Point2D[],
  shapeType: ShapeType,
  cfg: NormalizerConfig
): Point2D[] {
  let result = snapVerticesToGrid(contour, cfg.gridSnap);
  result = straightenEdges(result);

  if (shapeType === 'triangle') {
    result = regularizeTriangle(result);
  } else if (shapeType === 'quadrilateral') {
    result = regularizeQuadrilateral(result);
  }

  return result;
}

/**
 * Snap all vertices to the nearest grid point.
 */
function snapVerticesToGrid(contour: readonly Point2D[], gridSnap: number): Point2D[] {
  return contour.map((p) => ({
    x: Math.round(p.x / gridSnap) * gridSnap,
    y: Math.round(p.y / gridSnap) * gridSnap,
  }));
}

/**
 * Straighten edges that are nearly horizontal or vertical.
 * If an edge deviates by less than ~5 degrees from axis-aligned,
 * force it straight.
 */
function straightenEdges(contour: Point2D[]): Point2D[] {
  const threshold = Math.tan((5 * Math.PI) / 180); // ~0.0875
  const result = contour.map((p) => ({ ...p }));

  for (let i = 0; i < result.length; i++) {
    const j = (i + 1) % result.length;
    const dx = Math.abs(result[j].x - result[i].x);
    const dy = Math.abs(result[j].y - result[i].y);

    if (dx === 0 && dy === 0) continue;

    // Nearly horizontal: dy/dx < threshold
    if (dx > 0 && dy / dx < threshold) {
      const avgY = (result[i].y + result[j].y) / 2;
      result[i] = { x: result[i].x, y: avgY };
      result[j] = { x: result[j].x, y: avgY };
    }
    // Nearly vertical: dx/dy < threshold
    else if (dy > 0 && dx / dy < threshold) {
      const avgX = (result[i].x + result[j].x) / 2;
      result[i] = { x: avgX, y: result[i].y };
      result[j] = { x: avgX, y: result[j].y };
    }
  }

  return result;
}

/**
 * Regularize a triangle into a clean equilateral, right, or isosceles form.
 *
 * Strategy: measure side lengths. If two sides are within 10% of each other,
 * equalize them (isosceles). If all three are within 10%, equalize all
 * (equilateral). If one angle is close to 90 degrees, enforce it.
 */
function regularizeTriangle(contour: Point2D[]): Point2D[] {
  if (contour.length !== 3) return contour;

  const sides = triangleSideLengths(contour);
  const result = contour.map((p) => ({ ...p }));
  const ctr = computeCentroid(result);

  // Check for right angle (within 5 degrees of 90)
  const rightIndex = findRightAngle(result);
  if (rightIndex >= 0) {
    return enforceRightAngle(result, rightIndex);
  }

  // Check for equilateral (all sides within 10%)
  const maxSide = Math.max(...sides);
  const minSide = Math.min(...sides);
  if (maxSide > 0 && minSide / maxSide > 0.9) {
    return makeEquilateral(result, ctr);
  }

  // Check for isosceles (two sides within 10%)
  return makeIsosceles(result, sides);
}

/**
 * Get the three side lengths of a triangle.
 */
function triangleSideLengths(contour: readonly Point2D[]): [number, number, number] {
  return [dist(contour[0], contour[1]), dist(contour[1], contour[2]), dist(contour[2], contour[0])];
}

/**
 * Find the vertex index that forms a near-right angle (within 5 deg of 90).
 * Returns -1 if none found.
 */
function findRightAngle(contour: readonly Point2D[]): number {
  const toleranceRad = (5 * Math.PI) / 180;

  for (let i = 0; i < 3; i++) {
    const prev = contour[(i + 2) % 3];
    const curr = contour[i];
    const next = contour[(i + 1) % 3];
    const angle = angleBetween(prev, curr, next);

    if (Math.abs(angle - Math.PI / 2) < toleranceRad) {
      return i;
    }
  }

  return -1;
}

/**
 * Enforce a 90-degree angle at the given vertex.
 * Projects the two adjacent legs onto perpendicular axes through the vertex.
 */
function enforceRightAngle(contour: Point2D[], vertexIndex: number): Point2D[] {
  const result = contour.map((p) => ({ ...p }));
  const curr = result[vertexIndex];
  const prevIdx = (vertexIndex + 2) % 3;
  const nextIdx = (vertexIndex + 1) % 3;

  const legA = { x: result[prevIdx].x - curr.x, y: result[prevIdx].y - curr.y };
  const lenA = Math.sqrt(legA.x * legA.x + legA.y * legA.y);

  if (lenA === 0) return result;

  // Normalize legA direction
  const dirA = { x: legA.x / lenA, y: legA.y / lenA };
  // Perpendicular direction for legB
  const dirB = { x: -dirA.y, y: dirA.x };

  const legBLen = dist(curr, result[nextIdx]);

  result[prevIdx] = {
    x: curr.x + dirA.x * lenA,
    y: curr.y + dirA.y * lenA,
  };
  result[nextIdx] = {
    x: curr.x + dirB.x * legBLen,
    y: curr.y + dirB.y * legBLen,
  };

  return result;
}

/**
 * Make a triangle equilateral by placing vertices at equal angular intervals
 * around the centroid, using the average radius.
 */
function makeEquilateral(contour: Point2D[], ctr: Point2D): Point2D[] {
  const avgRadius = contour.reduce((sum, p) => sum + dist(p, ctr), 0) / 3;

  // Preserve the orientation of the first vertex
  const startAngle = Math.atan2(contour[0].y - ctr.y, contour[0].x - ctr.x);

  return [0, 1, 2].map((i) => {
    const angle = startAngle + (i * 2 * Math.PI) / 3;
    return {
      x: ctr.x + avgRadius * Math.cos(angle),
      y: ctr.y + avgRadius * Math.sin(angle),
    };
  });
}

/**
 * Make a triangle isosceles by equalizing the two most similar sides.
 */
function makeIsosceles(contour: Point2D[], sides: [number, number, number]): Point2D[] {
  const result = contour.map((p) => ({ ...p }));

  // Find the pair of sides closest in length
  const diffs = [
    { i: 0, j: 1, diff: Math.abs(sides[0] - sides[1]) },
    { i: 1, j: 2, diff: Math.abs(sides[1] - sides[2]) },
    { i: 0, j: 2, diff: Math.abs(sides[0] - sides[2]) },
  ];
  diffs.sort((a, b) => a.diff - b.diff);

  const pair = diffs[0];
  const avgLen = (sides[pair.i] + sides[pair.j]) / 2;

  // Side 0 = v0-v1, Side 1 = v1-v2, Side 2 = v2-v0
  const sideVertices: Array<[number, number]> = [
    [0, 1],
    [1, 2],
    [2, 0],
  ];

  // The shared vertex between the two equal sides is the apex
  const sharedVertex = sideVertices[pair.i].filter((v) => sideVertices[pair.j].includes(v))[0];

  if (sharedVertex === undefined) return result;

  // Scale the two legs from the apex to avgLen
  const apex = result[sharedVertex];
  const otherVertices = [0, 1, 2].filter((v) => v !== sharedVertex);

  for (const vi of otherVertices) {
    const d = dist(apex, result[vi]);
    if (d === 0) continue;
    const scale = avgLen / d;
    result[vi] = {
      x: apex.x + (result[vi].x - apex.x) * scale,
      y: apex.y + (result[vi].y - apex.y) * scale,
    };
  }

  return result;
}

/**
 * Regularize a quadrilateral into a rectangle, square, or parallelogram.
 *
 * Strategy: if all angles are near 90 degrees, make it a rectangle.
 * If it's also nearly square (sides within 10%), make it a square.
 * Otherwise, preserve the parallelogram shape.
 */
function regularizeQuadrilateral(contour: Point2D[]): Point2D[] {
  if (contour.length !== 4) return contour;

  const angles = quadAngles(contour);
  const rightAngleTol = (10 * Math.PI) / 180;
  const allNearRight = angles.every((a) => Math.abs(a - Math.PI / 2) < rightAngleTol);

  if (!allNearRight) return contour;

  return rectifyQuad(contour);
}

/**
 * Compute interior angles of a quadrilateral.
 */
function quadAngles(contour: readonly Point2D[]): [number, number, number, number] {
  return [0, 1, 2, 3].map((i) => {
    const prev = contour[(i + 3) % 4];
    const curr = contour[i];
    const next = contour[(i + 1) % 4];
    return angleBetween(prev, curr, next);
  }) as [number, number, number, number];
}

/**
 * Rectify a near-rectangular quad: force all angles to 90 degrees.
 * If sides are within 10%, make it a square.
 */
function rectifyQuad(contour: Point2D[]): Point2D[] {
  const w1 = dist(contour[0], contour[1]);
  const h1 = dist(contour[1], contour[2]);
  const w2 = dist(contour[2], contour[3]);
  const h2 = dist(contour[3], contour[0]);

  const avgW = (w1 + w2) / 2;
  const avgH = (h1 + h2) / 2;

  // If nearly square (within 10%), equalize
  const finalW = isWithinRatio(avgW, avgH, 0.9) ? (avgW + avgH) / 2 : avgW;
  const finalH = isWithinRatio(avgW, avgH, 0.9) ? (avgW + avgH) / 2 : avgH;

  // Rebuild from centroid + orientation
  const ctr = computeCentroid(contour);

  // Preserve the orientation of the first edge
  const edgeAngle = Math.atan2(contour[1].y - contour[0].y, contour[1].x - contour[0].x);

  const cos = Math.cos(edgeAngle);
  const sin = Math.sin(edgeAngle);
  const hw = finalW / 2;
  const hh = finalH / 2;

  // Build axis-aligned rect then rotate
  const corners: Array<[number, number]> = [
    [-hw, -hh],
    [hw, -hh],
    [hw, hh],
    [-hw, hh],
  ];

  return corners.map(([lx, ly]) => ({
    x: ctr.x + lx * cos - ly * sin,
    y: ctr.y + lx * sin + ly * cos,
  }));
}

// ============================================================================
// Step 3: Build Normalized Contours (Equalize + Straighten)
// ============================================================================

/**
 * Produce final normalized contours for each piece.
 * Scales each piece's contour to match the cluster median area,
 * then straightens rotation.
 */
function buildNormalizedContours(
  pieces: readonly DetectedPiece[],
  clusters: readonly ShapeCluster[],
  assignments: readonly number[],
  cfg: NormalizerConfig
): Point2D[][] {
  // Compute median area per cluster
  const clusterMedianAreas = clusters.map((cluster) => {
    const memberAreas = cluster.pieceIds
      .map((id) => pieces.find((p) => p.id === id))
      .filter((p): p is DetectedPiece => p !== undefined)
      .map((p) => Math.abs(computePolygonArea(p.contour)));

    return computeMedian(memberAreas);
  });

  return pieces.map((piece, i) => {
    const clusterIndex = assignments[i];
    const cluster = clusters[clusterIndex];
    const medianArea = clusterMedianAreas[clusterIndex];

    // Start from the regularized master contour, positioned at piece centroid
    const pieceCentroid = computeCentroid(piece.contour as Point2D[]);
    let contour = repositionContour(cluster.masterContour, pieceCentroid);

    // Scale to median area
    contour = scaleToArea(contour, medianArea);

    // Straighten rotation
    contour = straightenRotation(contour, cfg.straightenAngleDeg);

    return contour;
  });
}

/**
 * Reposition a contour so its centroid is at the given target point.
 */
function repositionContour(contour: readonly Point2D[], target: Point2D): Point2D[] {
  const current = computeCentroid(contour as Point2D[]);
  const dx = target.x - current.x;
  const dy = target.y - current.y;
  return contour.map((p) => ({ x: p.x + dx, y: p.y + dy }));
}

/**
 * Scale a contour uniformly so its area equals the target area.
 */
function scaleToArea(contour: Point2D[], targetArea: number): Point2D[] {
  const currentArea = Math.abs(computePolygonArea(contour));
  if (currentArea === 0 || targetArea === 0) return contour;

  const scaleFactor = Math.sqrt(targetArea / currentArea);
  const ctr = computeCentroid(contour);

  return contour.map((p) => ({
    x: ctr.x + (p.x - ctr.x) * scaleFactor,
    y: ctr.y + (p.y - ctr.y) * scaleFactor,
  }));
}

/**
 * Straighten rotation to nearest cardinal orientation (0, 90, 180, 270).
 * Only applies correction if the dominant angle is within the given tolerance.
 */
function straightenRotation(contour: Point2D[], maxAngleDeg: number): Point2D[] {
  const dominantAngle = computeDominantAngle(contour);
  const toleranceRad = (maxAngleDeg * Math.PI) / 180;

  // Find nearest cardinal angle (0, 90, 180, 270 degrees)
  const cardinals = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2, 2 * Math.PI];
  let nearestCardinal = 0;
  let minDiff = Infinity;

  for (const cardinal of cardinals) {
    const diff = Math.abs(normalizeAngle(dominantAngle - cardinal));
    if (diff < minDiff) {
      minDiff = diff;
      nearestCardinal = cardinal;
    }
  }

  // Only correct if within tolerance
  if (minDiff > toleranceRad) return contour;

  const correction = nearestCardinal - dominantAngle;
  if (Math.abs(correction) < 1e-10) return contour;

  return rotateContour(contour, correction);
}

/**
 * Compute the dominant orientation angle of a contour.
 * Uses the longest edge as the orientation reference.
 */
function computeDominantAngle(contour: readonly Point2D[]): number {
  let maxLen = 0;
  let angle = 0;

  for (let i = 0; i < contour.length; i++) {
    const j = (i + 1) % contour.length;
    const len = dist(contour[i], contour[j]);
    if (len > maxLen) {
      maxLen = len;
      angle = Math.atan2(contour[j].y - contour[i].y, contour[j].x - contour[i].x);
    }
  }

  // Normalize to [0, 2*PI)
  return ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
}

/**
 * Rotate a contour around its centroid.
 */
function rotateContour(contour: Point2D[], angleRad: number): Point2D[] {
  const ctr = computeCentroid(contour);
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);

  return contour.map((p) => {
    const dx = p.x - ctr.x;
    const dy = p.y - ctr.y;
    return {
      x: ctr.x + dx * cos - dy * sin,
      y: ctr.y + dx * sin + dy * cos,
    };
  });
}

// ============================================================================
// Geometry Helpers
// ============================================================================

/** Euclidean distance between two points. */
function dist(a: Point2D, b: Point2D): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Compute the angle at vertex `curr` formed by edges curr->prev and curr->next.
 * Returns the angle in radians [0, PI].
 */
function angleBetween(prev: Point2D, curr: Point2D, next: Point2D): number {
  const v1 = { x: prev.x - curr.x, y: prev.y - curr.y };
  const v2 = { x: next.x - curr.x, y: next.y - curr.y };

  const dot = v1.x * v2.x + v1.y * v2.y;
  const cross = v1.x * v2.y - v1.y * v2.x;

  return Math.abs(Math.atan2(cross, dot));
}

/**
 * Compute the signed area of a polygon using the shoelace formula.
 */
function computePolygonArea(contour: readonly Point2D[]): number {
  let area = 0;
  const n = contour.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += contour[i].x * contour[j].y;
    area -= contour[j].x * contour[i].y;
  }

  return area / 2;
}

/**
 * Compute the centroid of a polygon.
 */
function computeCentroid(contour: Point2D[]): Point2D {
  const n = contour.length;
  if (n === 0) return { x: 0, y: 0 };

  let cx = 0;
  let cy = 0;

  for (const p of contour) {
    cx += p.x;
    cy += p.y;
  }

  return { x: cx / n, y: cy / n };
}

/** Compute the median of a numeric array. */
function computeMedian(values: number[]): number {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/** Normalize an angle to [-PI, PI]. */
function normalizeAngle(angle: number): number {
  let a = angle % (2 * Math.PI);
  if (a > Math.PI) a -= 2 * Math.PI;
  if (a < -Math.PI) a += 2 * Math.PI;
  return a;
}

/** Check if two values are within a given ratio of each other. */
function isWithinRatio(a: number, b: number, minRatio: number): boolean {
  if (a === 0 || b === 0) return false;
  return Math.min(a, b) / Math.max(a, b) >= minRatio;
}
