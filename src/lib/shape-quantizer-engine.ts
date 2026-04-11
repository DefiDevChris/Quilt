/**
 * Shape Quantizer Engine
 *
 * Framework decision: Evaluated clipper-lib (already a dep, but only does boolean
 * ops / offsets — not classification or grid inference), turf.js (wrong domain —
 * geographic), OpenCV primitives already used in the worker (minAreaRect +
 * approxPolyDP don't produce grid-aligned output), and simplify-js (just RDP).
 * None solve the real problem: "raw contours → canonicalized tessellation on an
 * inferred integer grid". Grid inference is domain-specific — we need to find
 * the modal edge length that divides most edges evenly, which is a custom
 * histogram + refinement pass. So this engine is built from scratch as a pure
 * pipeline: infer rotation → infer base unit → classify & canonicalize each
 * piece → snap to integer grid → cluster by (class, dims, orientation).
 *
 * Takes raw DetectedPiece[] (post orphan-filter, from the OpenCV worker) and
 * returns canonical polygons whose vertices all sit on a single inferred
 * integer grid, classified into a small vocabulary per quilt. The vocabulary
 * is DISCOVERED per image, never hardcoded.
 *
 * Pure computation — zero DOM / React / Fabric.js dependencies.
 */

import type { DetectedPiece, Point2D } from '@/lib/photo-layout-types';

// ============================================================================
// Types
// ============================================================================

export type CanonicalShapeClass = 'square' | 'rectangle' | 'right-triangle' | 'polygon';

/**
 * Result of quantizing a single DetectedPiece.
 * `contour` is the final canonical polygon in image-space pixels (un-rotated
 * back to the photo's orientation). `classKey` is a stable string that groups
 * identical pieces together — use it for print-list clustering.
 */
export interface QuantizedPiece {
  readonly id: string;
  readonly contour: readonly Point2D[];
  readonly shapeClass: CanonicalShapeClass;
  /** Integer dimensions in units of `u`. For triangles: bbox of the legs. */
  readonly unitsW: number;
  readonly unitsH: number;
  /** 0/90/180/270 for triangles, 0 for axis-aligned rects. */
  readonly orientationDeg: number;
  /** Stable cluster key like "square-1x1" or "right-triangle-2x2-r90". */
  readonly classKey: string;
  /** Human label for print list: "1×1 Square", "1×4 Rectangle", "2u Right Triangle". */
  readonly classLabel: string;
}

export interface QuantizerConfig {
  /** Minimum candidate base unit in pixels — filters detection noise. */
  readonly minUnitPx: number;
  /** Simplification tolerance as fraction of u. Vertices closer than this collapse. */
  readonly simplifyFrac: number;
  /** Angle tolerance (deg) for classifying a quad as a rectangle. */
  readonly rectAngleTolDeg: number;
  /** Angle tolerance (deg) for classifying a triangle as right-angled. */
  readonly rightTriAngleTolDeg: number;
  /** Manual override for base unit in pixels (null = auto-infer). */
  readonly unitOverridePx: number | null;
  /** Manual rotation offset in degrees (added to auto-inferred θ). */
  readonly rotationOffsetDeg: number;
  /** Minimum area (in px²) a piece must have to survive quantization. */
  readonly minAreaPx: number;
}

export const DEFAULT_QUANTIZER_CONFIG: QuantizerConfig = {
  minUnitPx: 6,
  simplifyFrac: 0.25,
  rectAngleTolDeg: 15,
  rightTriAngleTolDeg: 15,
  unitOverridePx: null,
  rotationOffsetDeg: 0,
  minAreaPx: 25,
};

export interface QuantizerResult {
  readonly pieces: readonly QuantizedPiece[];
  /** Inferred base unit in pixels. */
  readonly unitPx: number;
  /** Inferred global rotation in degrees (positive = counterclockwise). */
  readonly rotationDeg: number;
  /** Number of canonical classes discovered. */
  readonly classCount: number;
  /** Counts per class key. */
  readonly classCounts: ReadonlyMap<string, number>;
  /** Pieces dropped during quantization (below minAreaPx, degenerate, etc.). */
  readonly droppedIds: readonly string[];
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Quantize detected pieces onto an inferred integer grid.
 *
 * @param pieces - Detected pieces from the orphan filter
 * @param config - Optional partial config (merged with defaults)
 */
export function quantizeShapes(
  pieces: readonly DetectedPiece[],
  config?: Partial<QuantizerConfig>
): QuantizerResult {
  const cfg: QuantizerConfig = { ...DEFAULT_QUANTIZER_CONFIG, ...config };

  if (pieces.length === 0) {
    return {
      pieces: [],
      unitPx: 0,
      rotationDeg: 0,
      classCount: 0,
      classCounts: new Map(),
      droppedIds: [],
    };
  }

  // Stage 1: Infer global rotation θ (degrees) from edge-angle histogram.
  const inferredRotation = inferGlobalRotationDeg(pieces);
  const rotationDeg = inferredRotation + cfg.rotationOffsetDeg;
  const thetaRad = (rotationDeg * Math.PI) / 180;

  // De-rotate every contour once, pre-compute world-space centroids for
  // re-rotation at the end.
  const rotatedContours = pieces.map((p) =>
    rotateContour(p.contour as readonly Point2D[], -thetaRad, ORIGIN)
  );

  // Stage 2: Infer base unit `u` in pixels from de-rotated edge lengths.
  const unitPx =
    cfg.unitOverridePx && cfg.unitOverridePx >= cfg.minUnitPx
      ? cfg.unitOverridePx
      : inferBaseUnitPx(rotatedContours, cfg.minUnitPx);

  // Safety: if inference fails entirely, fall back to a reasonable default
  // so we still produce something renderable.
  const u = unitPx > 0 ? unitPx : 16;

  // Stage 3+4: Per-piece canonicalization + grid snapping.
  const quantized: QuantizedPiece[] = [];
  const dropped: string[] = [];

  for (let i = 0; i < pieces.length; i++) {
    const piece = pieces[i];
    const rotated = rotatedContours[i];

    // Drop degenerate / tiny pieces.
    const rotatedArea = Math.abs(polygonArea(rotated));
    if (rotatedArea < cfg.minAreaPx) {
      dropped.push(piece.id);
      continue;
    }

    const simplified = simplifyContour(rotated, u * cfg.simplifyFrac);
    if (simplified.length < 3) {
      dropped.push(piece.id);
      continue;
    }

    const canonical = canonicalizeAndSnap(simplified, u, cfg);
    if (!canonical) {
      dropped.push(piece.id);
      continue;
    }

    // Re-rotate canonical contour back into the source image's frame.
    const finalContour = rotateContour(canonical.contour, thetaRad, ORIGIN);

    quantized.push({
      id: piece.id,
      contour: finalContour,
      shapeClass: canonical.shapeClass,
      unitsW: canonical.unitsW,
      unitsH: canonical.unitsH,
      orientationDeg: canonical.orientationDeg,
      classKey: canonical.classKey,
      classLabel: canonical.classLabel,
    });
  }

  // Stage 5: Cluster counts.
  const classCounts = new Map<string, number>();
  for (const q of quantized) {
    classCounts.set(q.classKey, (classCounts.get(q.classKey) ?? 0) + 1);
  }

  return {
    pieces: quantized,
    unitPx: u,
    rotationDeg,
    classCount: classCounts.size,
    classCounts,
    droppedIds: dropped,
  };
}

// ============================================================================
// Stage 1: Global Rotation Inference
// ============================================================================

/**
 * Estimate the global rotation of the quilt by histogramming edge angles
 * folded into [0°, 90°). Quilt edges strongly cluster near 0°/90°, so the
 * dominant mode (offset from 0°) is the global tilt.
 */
function inferGlobalRotationDeg(pieces: readonly DetectedPiece[]): number {
  const BIN_SIZE_DEG = 0.5;
  const NUM_BINS = Math.ceil(90 / BIN_SIZE_DEG);
  const bins = new Float64Array(NUM_BINS);

  for (const piece of pieces) {
    const contour = piece.contour;
    const n = contour.length;
    if (n < 2) continue;

    for (let i = 0; i < n; i++) {
      const a = contour[i];
      const b = contour[(i + 1) % n];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len < 4) continue; // skip tiny noise edges

      // atan2 in [-pi, pi]; convert to degrees in [0, 90)
      let deg = (Math.atan2(dy, dx) * 180) / Math.PI;
      deg = ((deg % 90) + 90) % 90; // fold into [0, 90)

      const binIndex = Math.min(NUM_BINS - 1, Math.floor(deg / BIN_SIZE_DEG));
      // Weight by edge length so strong long edges dominate.
      bins[binIndex] += len;
    }
  }

  // Find peak bin
  let peakIndex = 0;
  let peakWeight = 0;
  for (let i = 0; i < NUM_BINS; i++) {
    if (bins[i] > peakWeight) {
      peakWeight = bins[i];
      peakIndex = i;
    }
  }

  // Pick the representative angle within [0, 90). If the peak is closer to
  // 90 than 0, treat it as a negative tilt (i.e., −5° is equivalent to 85°).
  let peakDeg = (peakIndex + 0.5) * BIN_SIZE_DEG;
  if (peakDeg > 45) peakDeg -= 90;

  return peakDeg;
}

// ============================================================================
// Stage 2: Base Unit Inference
// ============================================================================

/**
 * Infer the base pixel unit `u` so that most edge lengths are near integer
 * multiples of u. Two-phase:
 *
 * 1. Collect all edge lengths, take the 10th percentile as a coarse estimate.
 * 2. Refine by grid-searching a window around it. Fit score is the mean
 *    "rounded error" — how far each edge is from its nearest k·u.
 */
function inferBaseUnitPx(contours: readonly (readonly Point2D[])[], minUnit: number): number {
  const edgeLengths: number[] = [];
  for (const contour of contours) {
    const n = contour.length;
    for (let i = 0; i < n; i++) {
      const a = contour[i];
      const b = contour[(i + 1) % n];
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      if (len >= minUnit) edgeLengths.push(len);
    }
  }

  if (edgeLengths.length === 0) return 0;

  edgeLengths.sort((a, b) => a - b);
  // 10th percentile as coarse base-unit estimate.
  const p10Index = Math.max(0, Math.floor(edgeLengths.length * 0.1));
  const p10 = edgeLengths[p10Index];

  // Refine: sweep u in [0.6·p10, 1.6·p10] at 0.25 px resolution,
  // also sweep p10/2 and p10*2 and take the best score.
  const candidates: number[] = [];
  for (let f = 0.6; f <= 1.65; f += 0.025) {
    candidates.push(Math.max(minUnit, p10 * f));
  }
  candidates.push(Math.max(minUnit, p10 / 2));
  candidates.push(Math.max(minUnit, p10 * 2));

  let bestU = p10;
  let bestScore = Infinity;
  for (const u of candidates) {
    const score = gridFitScore(edgeLengths, u);
    if (score < bestScore) {
      bestScore = score;
      bestU = u;
    }
  }

  return bestU;
}

/**
 * Mean fractional error for fitting edge lengths to integer multiples of u.
 * Lower is better. Each edge contributes |len - round(len/u)·u| / u, clamped
 * to [0, 0.5].
 */
function gridFitScore(edgeLengths: readonly number[], u: number): number {
  if (u <= 0) return Infinity;
  let total = 0;
  for (const len of edgeLengths) {
    const k = Math.max(1, Math.round(len / u));
    const err = Math.abs(len - k * u) / u;
    total += Math.min(err, 0.5);
  }
  return total / edgeLengths.length;
}

// ============================================================================
// Stage 3: Canonicalization (per piece)
// ============================================================================

interface CanonicalResult {
  contour: Point2D[];
  shapeClass: CanonicalShapeClass;
  unitsW: number;
  unitsH: number;
  orientationDeg: number;
  classKey: string;
  classLabel: string;
}

function canonicalizeAndSnap(
  contour: readonly Point2D[],
  u: number,
  cfg: QuantizerConfig
): CanonicalResult | null {
  // Compute axis-aligned bounding box in the de-rotated frame.
  const bb = boundingBox(contour);
  if (bb.width <= 0 || bb.height <= 0) return null;

  // Snap bbox origin and dimensions to integer multiples of u.
  const x0 = Math.round(bb.x / u) * u;
  const y0 = Math.round(bb.y / u) * u;
  const unitsW = Math.max(1, Math.round(bb.width / u));
  const unitsH = Math.max(1, Math.round(bb.height / u));
  const w = unitsW * u;
  const h = unitsH * u;

  // Classify: look at the simplified vertex count + angles.
  const n = contour.length;

  if (n === 3) {
    const rightIdx = findRightAngleVertex(contour, cfg.rightTriAngleTolDeg);
    if (rightIdx >= 0) {
      return emitRightTriangle(contour, rightIdx, x0, y0, w, h, unitsW, unitsH);
    }
    return emitGeneralPolygon(contour, u, x0, y0, bb);
  }

  if (n === 4) {
    if (allAnglesNearRight(contour, cfg.rectAngleTolDeg)) {
      return emitRectangle(x0, y0, w, h, unitsW, unitsH);
    }
    // Could be a rotated square-on-point (diamond) — detect by checking if
    // opposite sides are equal and diagonals are perpendicular. For now treat
    // as a general polygon but still grid-snap.
    return emitGeneralPolygon(contour, u, x0, y0, bb);
  }

  // 5+ vertices: general polygon with grid-snapped vertices.
  return emitGeneralPolygon(contour, u, x0, y0, bb);
}

function emitRectangle(
  x0: number,
  y0: number,
  w: number,
  h: number,
  unitsW: number,
  unitsH: number
): CanonicalResult {
  const contour: Point2D[] = [
    { x: x0, y: y0 },
    { x: x0 + w, y: y0 },
    { x: x0 + w, y: y0 + h },
    { x: x0, y: y0 + h },
  ];
  const isSquare = unitsW === unitsH;
  const minU = Math.min(unitsW, unitsH);
  const maxU = Math.max(unitsW, unitsH);
  const classKey = isSquare ? `square-${unitsW}x${unitsW}` : `rectangle-${minU}x${maxU}`;
  const classLabel = isSquare ? `${unitsW}×${unitsW} Square` : `${minU}×${maxU} Rectangle`;
  return {
    contour,
    shapeClass: isSquare ? 'square' : 'rectangle',
    unitsW,
    unitsH,
    orientationDeg: 0,
    classKey,
    classLabel,
  };
}

function emitRightTriangle(
  contour: readonly Point2D[],
  rightIdx: number,
  x0: number,
  y0: number,
  w: number,
  h: number,
  unitsW: number,
  unitsH: number
): CanonicalResult {
  // Figure out which corner of the bbox holds the right angle.
  const right = contour[rightIdx];
  const cx = x0 + w / 2;
  const cy = y0 + h / 2;
  const onRight = right.x > cx;
  const onBottom = right.y > cy;

  // Build the triangle with the right angle at that bbox corner, legs along
  // the bbox edges. The three vertices are the right corner + the two
  // adjacent bbox corners.
  const rightCorner: Point2D = {
    x: onRight ? x0 + w : x0,
    y: onBottom ? y0 + h : y0,
  };
  const horizontalLeg: Point2D = {
    x: onRight ? x0 : x0 + w,
    y: rightCorner.y,
  };
  const verticalLeg: Point2D = {
    x: rightCorner.x,
    y: onBottom ? y0 : y0 + h,
  };

  // CCW order matters for Fabric.js rendering.
  const triContour: Point2D[] = [rightCorner, horizontalLeg, verticalLeg];
  if (polygonArea(triContour) < 0) {
    triContour.reverse();
  }

  // Orientation code: 0 = right-angle top-left, 1 = top-right, 2 = bottom-right, 3 = bottom-left
  const orientationCode =
    (onRight ? (onBottom ? 2 : 1) : onBottom ? 3 : 0);
  const orientationDeg = orientationCode * 90;

  const minU = Math.min(unitsW, unitsH);
  const maxU = Math.max(unitsW, unitsH);
  const classKey = `right-triangle-${minU}x${maxU}-r${orientationDeg}`;
  const classLabel = `${minU}×${maxU} Right Triangle`;

  return {
    contour: triContour,
    shapeClass: 'right-triangle',
    unitsW,
    unitsH,
    orientationDeg,
    classKey,
    classLabel,
  };
}

function emitGeneralPolygon(
  contour: readonly Point2D[],
  u: number,
  x0: number,
  y0: number,
  bb: { x: number; y: number; width: number; height: number }
): CanonicalResult {
  // Snap each vertex to the nearest integer grid point.
  const snapped: Point2D[] = contour.map((p) => ({
    x: Math.round(p.x / u) * u,
    y: Math.round(p.y / u) * u,
  }));

  // Drop consecutive duplicates after snapping.
  const deduped: Point2D[] = [];
  for (const p of snapped) {
    const last = deduped[deduped.length - 1];
    if (!last || last.x !== p.x || last.y !== p.y) {
      deduped.push(p);
    }
  }
  // Close-loop dedupe
  if (deduped.length > 1) {
    const first = deduped[0];
    const last = deduped[deduped.length - 1];
    if (first.x === last.x && first.y === last.y) deduped.pop();
  }

  const n = deduped.length >= 3 ? deduped.length : contour.length;
  const unitsW = Math.max(1, Math.round(bb.width / u));
  const unitsH = Math.max(1, Math.round(bb.height / u));
  void x0;
  void y0;

  const classKey = `polygon-${n}v-${unitsW}x${unitsH}`;
  const classLabel = `${n}-sided Polygon`;

  return {
    contour: deduped.length >= 3 ? deduped : contour.map((p) => ({ x: p.x, y: p.y })),
    shapeClass: 'polygon',
    unitsW,
    unitsH,
    orientationDeg: 0,
    classKey,
    classLabel,
  };
}

// ============================================================================
// Geometry Helpers
// ============================================================================

const ORIGIN: Point2D = { x: 0, y: 0 };

function polygonArea(contour: readonly Point2D[]): number {
  let area = 0;
  const n = contour.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += contour[i].x * contour[j].y;
    area -= contour[j].x * contour[i].y;
  }
  return area / 2;
}

function boundingBox(
  contour: readonly Point2D[]
): { x: number; y: number; width: number; height: number } {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of contour) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function rotateContour(
  contour: readonly Point2D[],
  angleRad: number,
  pivot: Point2D
): Point2D[] {
  if (angleRad === 0) return contour.map((p) => ({ x: p.x, y: p.y }));
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  return contour.map((p) => {
    const dx = p.x - pivot.x;
    const dy = p.y - pivot.y;
    return {
      x: pivot.x + dx * cos - dy * sin,
      y: pivot.y + dx * sin + dy * cos,
    };
  });
}

/**
 * Classic Ramer–Douglas–Peucker with explicit closed-polygon handling. Also
 * collapses near-collinear interior vertices using the same ε.
 */
function simplifyContour(contour: readonly Point2D[], epsilon: number): Point2D[] {
  if (contour.length < 4 || epsilon <= 0) return contour.map((p) => ({ x: p.x, y: p.y }));

  // Work on an open polyline by picking the two most distant vertices as endpoints.
  let i0 = 0;
  let i1 = 1;
  let maxDistSq = -1;
  for (let a = 0; a < contour.length; a++) {
    for (let b = a + 1; b < contour.length; b++) {
      const d = (contour[a].x - contour[b].x) ** 2 + (contour[a].y - contour[b].y) ** 2;
      if (d > maxDistSq) {
        maxDistSq = d;
        i0 = a;
        i1 = b;
      }
    }
  }

  // Split the closed polygon into two arcs between i0..i1 and simplify each.
  const arc1 = contour.slice(i0, i1 + 1);
  const arc2 = [...contour.slice(i1), ...contour.slice(0, i0 + 1)];
  const s1 = rdp(arc1, epsilon);
  const s2 = rdp(arc2, epsilon);

  // Re-stitch: s1 ends at i1, s2 starts at i1 and ends at i0. Skip duplicates.
  const result: Point2D[] = [];
  for (const p of s1) result.push({ x: p.x, y: p.y });
  for (let k = 1; k < s2.length - 1; k++) result.push({ x: s2[k].x, y: s2[k].y });
  return result;
}

function rdp(points: readonly Point2D[], epsilon: number): Point2D[] {
  if (points.length < 3) return points.map((p) => ({ x: p.x, y: p.y }));
  let maxDist = 0;
  let index = 0;
  const end = points.length - 1;
  for (let i = 1; i < end; i++) {
    const d = perpendicularDistance(points[i], points[0], points[end]);
    if (d > maxDist) {
      maxDist = d;
      index = i;
    }
  }
  if (maxDist > epsilon) {
    const left = rdp(points.slice(0, index + 1), epsilon);
    const right = rdp(points.slice(index), epsilon);
    return [...left.slice(0, -1), ...right];
  }
  return [points[0], points[end]].map((p) => ({ x: p.x, y: p.y }));
}

function perpendicularDistance(p: Point2D, a: Point2D, b: Point2D): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  if (len === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  return Math.abs(dy * p.x - dx * p.y + b.x * a.y - b.y * a.x) / len;
}

/**
 * Returns the index of a near-right-angle vertex in a triangle, or -1 if none.
 */
function findRightAngleVertex(contour: readonly Point2D[], tolDeg: number): number {
  if (contour.length !== 3) return -1;
  const tolRad = (tolDeg * Math.PI) / 180;
  let bestIdx = -1;
  let bestDiff = tolRad;
  for (let i = 0; i < 3; i++) {
    const prev = contour[(i + 2) % 3];
    const curr = contour[i];
    const next = contour[(i + 1) % 3];
    const angle = interiorAngle(prev, curr, next);
    const diff = Math.abs(angle - Math.PI / 2);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestIdx = i;
    }
  }
  return bestIdx;
}

function allAnglesNearRight(contour: readonly Point2D[], tolDeg: number): boolean {
  const tolRad = (tolDeg * Math.PI) / 180;
  const n = contour.length;
  for (let i = 0; i < n; i++) {
    const prev = contour[(i - 1 + n) % n];
    const curr = contour[i];
    const next = contour[(i + 1) % n];
    const angle = interiorAngle(prev, curr, next);
    if (Math.abs(angle - Math.PI / 2) > tolRad) return false;
  }
  return true;
}

function interiorAngle(prev: Point2D, curr: Point2D, next: Point2D): number {
  const v1x = prev.x - curr.x;
  const v1y = prev.y - curr.y;
  const v2x = next.x - curr.x;
  const v2y = next.y - curr.y;
  const dot = v1x * v2x + v1y * v2y;
  const cross = v1x * v2y - v1y * v2x;
  return Math.abs(Math.atan2(cross, dot));
}
