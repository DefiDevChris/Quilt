/**
 * Shape Regularize — post-processing for `segmentQuilt` output.
 *
 * The segmentation engine emits raw pixel-accurate polygons. Quilts are
 * axis-aligned grids of clean rectangles and right triangles, so faithful
 * tracing is the wrong default: the review UI shows jagged slivers, and
 * the studio handoff produces Fabric.js polygons that don't line up on
 * the inch grid.
 *
 * This module post-processes the segmentation in four stages:
 *
 *   A. Classify each `DetectedPatch` as `'rect' | 'rightTriangle' | 'other'`
 *      via an AABB fill-ratio test. Rects fill ~100% of their bbox, right
 *      triangles fill ~50% and have three of the four bbox corners occupied.
 *   B. Per-patch regularize — replace the raw polygon with a canonical
 *      axis-aligned rect or right-triangle sitting inside the patch's
 *      bbox. Free-form `'other'` polygons pass through unchanged.
 *   C. Group similar shapes — bucket rects and triangles by `(class, wIn,
 *      hIn)` rounded to the snap increment, average the real dimensions
 *      within each bucket, round to the snap increment again, and replace
 *      every group member with a canonical shape of those averaged
 *      dimensions. This is the "every detected piece gets grouped with
 *      the other similar shapes, then averaged to the nearest even size"
 *      behaviour.
 *   D. Grid-snap — round every final vertex to the nearest inch-grid
 *      intersection in warped-image pixel space so the studio canvas
 *      receives shapes whose corners land exactly on shared grid lines.
 *
 * Pure computation — zero DOM, zero Fabric.js, zero React. Deterministic
 * under a fixed input. Returns a fresh `SegmentationResult` with the same
 * palette and width/height; only `patches` are rewritten.
 *
 * Design notes:
 *   - We regularize INSIDE the patch's existing bbox rather than at its
 *     centroid so neighbouring patches keep the same relative positions
 *     as the raw trace. Two adjacent 2" squares that started side-by-side
 *     stay side-by-side after regularization because their bbox top-left
 *     corners snap to adjacent grid intersections.
 *   - Right-triangle classification finds the AABB corner with NO
 *     polygon vertex — its diagonal opposite is the right-angle corner.
 *     This trick avoids explicit angle arithmetic and handles the 4
 *     possible orientations uniformly.
 *   - Grouping is a flat bucket on `(shapeClass, roundedW, roundedH)`.
 *     Patches whose real dimensions straddle the rounding boundary can
 *     land in adjacent buckets and be averaged separately, but for the
 *     default 0.5" snap increment on typical quilt block sizes this is
 *     rarely visible. A future iteration could iteratively merge
 *     neighbouring buckets if they're within half an increment of each
 *     other.
 */

import type { Point2D } from '@/lib/photo-layout-types';
import type { DetectedPatch, SegmentationResult } from '@/lib/quilt-segmentation-engine';

// ── Public types ─────────────────────────────────────────────────────────

export type ShapeClass = 'rect' | 'rightTriangle' | 'other';

export type TriangleCorner = 'tl' | 'tr' | 'br' | 'bl';

export interface RegularizeOptions {
  /** Pixels per inch in the warped-image coordinate system. Required. */
  readonly pxPerInch: number;
  /**
   * Snap increment in inches. Canonical shape dimensions and every final
   * vertex are rounded to multiples of this value. Default: 0.5.
   */
  readonly snapIncrementInches?: number;
  /**
   * Minimum `(component area / bbox area)` ratio for a patch to be
   * classified as a rectangle. Default: 0.8.
   */
  readonly rectFillRatio?: number;
  /**
   * Minimum fill ratio for a right-triangle candidate. Default: 0.35.
   */
  readonly triangleFillMin?: number;
  /**
   * Maximum fill ratio for a right-triangle candidate. Default: 0.65.
   */
  readonly triangleFillMax?: number;
  /**
   * How close (as a fraction of min(bboxW, bboxH)) a polygon vertex must
   * be to an AABB corner for that corner to count as "occupied" during
   * right-triangle classification. Default: 0.25.
   */
  readonly cornerProximityFrac?: number;
}

// ── Internals ────────────────────────────────────────────────────────────

interface ClassifiedPatch {
  readonly patch: DetectedPatch;
  readonly shapeClass: ShapeClass;
  /** Width of the raw bbox in warped-image pixels. */
  readonly widthPx: number;
  /** Height of the raw bbox in warped-image pixels. */
  readonly heightPx: number;
  /** Right-angle corner for right triangles; unset for rects and others. */
  readonly triangleCorner?: TriangleCorner;
}

interface ShapeGroup {
  readonly shapeClass: 'rect' | 'rightTriangle';
  /** Rounded bucket dims, used as the map key. */
  readonly bucketWidthInches: number;
  readonly bucketHeightInches: number;
  readonly members: ClassifiedPatch[];
}

interface CanonicalDims {
  readonly widthPx: number;
  readonly heightPx: number;
}

const DEFAULT_SNAP_INCREMENT_INCHES = 0.5;
const DEFAULT_RECT_FILL_RATIO = 0.8;
const DEFAULT_TRIANGLE_FILL_MIN = 0.35;
const DEFAULT_TRIANGLE_FILL_MAX = 0.65;
const DEFAULT_CORNER_PROXIMITY_FRAC = 0.25;

// ── Top-level API ────────────────────────────────────────────────────────

/**
 * Post-process a raw segmentation result into grid-aligned, shape-clean
 * patches. See the module header for the full pipeline description.
 *
 * Passes the input through unchanged when `pxPerInch <= 0` or when the
 * input has no patches, so callers can safely call this on any
 * `SegmentationResult` without branching.
 */
export function regularizeSegmentation(
  result: SegmentationResult,
  options: RegularizeOptions
): SegmentationResult {
  const pxPerInch = options.pxPerInch;
  if (pxPerInch <= 0 || result.patches.length === 0) {
    return result;
  }

  const snapIncrementInches = options.snapIncrementInches ?? DEFAULT_SNAP_INCREMENT_INCHES;
  const rectFillRatio = options.rectFillRatio ?? DEFAULT_RECT_FILL_RATIO;
  const triangleFillMin = options.triangleFillMin ?? DEFAULT_TRIANGLE_FILL_MIN;
  const triangleFillMax = options.triangleFillMax ?? DEFAULT_TRIANGLE_FILL_MAX;
  const cornerProximityFrac = options.cornerProximityFrac ?? DEFAULT_CORNER_PROXIMITY_FRAC;

  const pxToInches = 1 / pxPerInch;
  const pxPerIncrement = pxPerInch * snapIncrementInches;

  // ─── A. Classify ─────────────────────────────────────────────────────
  const classified: ClassifiedPatch[] = result.patches.map((p) =>
    classifyPatch(p, {
      rectFillRatio,
      triangleFillMin,
      triangleFillMax,
      cornerProximityFrac,
    })
  );

  // ─── C. Group + compute canonical dims per group ────────────────────
  const groups = groupByShape(classified, pxToInches, snapIncrementInches);
  const canonicalDims = new Map<string, CanonicalDims>();
  for (const [key, group] of groups) {
    canonicalDims.set(key, canonicalizeGroup(group, pxPerInch, snapIncrementInches));
  }

  // ─── B + D. Rebuild patches ──────────────────────────────────────────
  const newPatches: DetectedPatch[] = [];
  for (const c of classified) {
    if (c.shapeClass === 'other') {
      // Free-form polygons pass through, but their vertices still snap
      // to the grid so they share intersections with neighbouring shapes.
      const snappedPoly = c.patch.polygonPx.map((p) => snapPointToGrid(p, pxPerIncrement));
      newPatches.push({
        ...c.patch,
        polygonPx: snappedPoly,
        centroidPx: centroidOf(snappedPoly),
        bboxPx: bboxOf(snappedPoly),
      });
      continue;
    }

    const canon = canonicalDims.get(groupKeyFor(c, pxToInches, snapIncrementInches));
    if (!canon) {
      // Defensive fallback — classify-but-no-group should never happen
      // because every classified rect/triangle goes into a group. If it
      // does, pass the patch through unchanged.
      newPatches.push(c.patch);
      continue;
    }

    // Snap the original bbox top-left to the grid, then place the
    // canonical shape at that snapped position. Every vertex of the
    // canonical shape automatically lands on a grid intersection because
    // its dimensions are already multiples of the snap increment.
    const rawTL: Point2D = { x: c.patch.bboxPx.minX, y: c.patch.bboxPx.minY };
    const snappedTL = snapPointToGrid(rawTL, pxPerIncrement);

    let polygonPx: Point2D[];
    if (c.shapeClass === 'rect') {
      polygonPx = buildAxisAlignedRect(snappedTL, canon.widthPx, canon.heightPx);
    } else {
      const corner = c.triangleCorner ?? 'tl';
      polygonPx = buildRightTriangle(snappedTL, canon.widthPx, canon.heightPx, corner);
    }

    newPatches.push({
      ...c.patch,
      polygonPx,
      centroidPx: centroidOf(polygonPx),
      bboxPx: {
        minX: snappedTL.x,
        minY: snappedTL.y,
        maxX: snappedTL.x + canon.widthPx,
        maxY: snappedTL.y + canon.heightPx,
      },
    });
  }

  return {
    palette: result.palette,
    patches: newPatches,
    width: result.width,
    height: result.height,
  };
}

// ── Classification ───────────────────────────────────────────────────────

interface ClassifyThresholds {
  readonly rectFillRatio: number;
  readonly triangleFillMin: number;
  readonly triangleFillMax: number;
  readonly cornerProximityFrac: number;
}

function classifyPatch(patch: DetectedPatch, thresholds: ClassifyThresholds): ClassifiedPatch {
  const widthPx = patch.bboxPx.maxX - patch.bboxPx.minX;
  const heightPx = patch.bboxPx.maxY - patch.bboxPx.minY;
  if (widthPx <= 0 || heightPx <= 0) {
    return { patch, shapeClass: 'other', widthPx, heightPx };
  }

  const bboxArea = widthPx * heightPx;
  const fillRatio = patch.areaPx / bboxArea;

  if (fillRatio >= thresholds.rectFillRatio) {
    return { patch, shapeClass: 'rect', widthPx, heightPx };
  }

  if (fillRatio >= thresholds.triangleFillMin && fillRatio <= thresholds.triangleFillMax) {
    const corner = findRightAngleCorner(patch, thresholds.cornerProximityFrac);
    if (corner) {
      return { patch, shapeClass: 'rightTriangle', widthPx, heightPx, triangleCorner: corner };
    }
  }

  return { patch, shapeClass: 'other', widthPx, heightPx };
}

/**
 * Find which AABB corner holds a right-triangle's right angle.
 *
 * A right triangle has three vertices, one per AABB corner, with the
 * fourth AABB corner empty. The empty corner is diagonally opposite the
 * right angle — e.g. a triangle with vertices at TL/TR/BL has an empty
 * BR corner, and its right angle is at TL.
 *
 * Returns `null` when the test is ambiguous — zero or more than one
 * empty corners — so callers fall through to the free-form `'other'`
 * branch.
 */
function findRightAngleCorner(
  patch: DetectedPatch,
  proximityFrac: number
): TriangleCorner | null {
  const { minX, minY, maxX, maxY } = patch.bboxPx;
  const w = maxX - minX;
  const h = maxY - minY;
  const tol = Math.min(w, h) * proximityFrac;
  const tolSq = tol * tol;

  const corners: Record<TriangleCorner, Point2D> = {
    tl: { x: minX, y: minY },
    tr: { x: maxX, y: minY },
    br: { x: maxX, y: maxY },
    bl: { x: minX, y: maxY },
  };
  const opposites: Record<TriangleCorner, TriangleCorner> = {
    tl: 'br',
    tr: 'bl',
    br: 'tl',
    bl: 'tr',
  };

  const hasVertexNear = (target: Point2D): boolean => {
    for (const v of patch.polygonPx) {
      const dx = v.x - target.x;
      const dy = v.y - target.y;
      if (dx * dx + dy * dy <= tolSq) return true;
    }
    return false;
  };

  const empty: TriangleCorner[] = [];
  (Object.keys(corners) as TriangleCorner[]).forEach((key) => {
    if (!hasVertexNear(corners[key])) empty.push(key);
  });

  if (empty.length !== 1) return null;
  return opposites[empty[0]];
}

// ── Grouping ─────────────────────────────────────────────────────────────

function groupByShape(
  classified: readonly ClassifiedPatch[],
  pxToInches: number,
  snapIncrementInches: number
): Map<string, ShapeGroup> {
  const groups = new Map<string, ShapeGroup>();
  for (const c of classified) {
    if (c.shapeClass === 'other') continue;
    const key = groupKeyFor(c, pxToInches, snapIncrementInches);
    const widthInches = roundToIncrement(c.widthPx * pxToInches, snapIncrementInches);
    const heightInches = roundToIncrement(c.heightPx * pxToInches, snapIncrementInches);
    let group = groups.get(key);
    if (!group) {
      group = {
        shapeClass: c.shapeClass,
        bucketWidthInches: widthInches,
        bucketHeightInches: heightInches,
        members: [],
      };
      groups.set(key, group);
    }
    group.members.push(c);
  }
  return groups;
}

function groupKeyFor(
  c: ClassifiedPatch,
  pxToInches: number,
  snapIncrementInches: number
): string {
  const wIn = roundToIncrement(c.widthPx * pxToInches, snapIncrementInches);
  const hIn = roundToIncrement(c.heightPx * pxToInches, snapIncrementInches);
  return `${c.shapeClass}|${wIn.toFixed(3)}|${hIn.toFixed(3)}`;
}

/**
 * Compute canonical dimensions for a group by averaging its members'
 * actual pixel dimensions and rounding the result to the snap increment.
 * The minimum is clamped to the snap increment so a degenerate 0-sized
 * group still produces a renderable shape.
 */
function canonicalizeGroup(
  group: ShapeGroup,
  pxPerInch: number,
  snapIncrementInches: number
): CanonicalDims {
  let sumW = 0;
  let sumH = 0;
  for (const m of group.members) {
    sumW += m.widthPx;
    sumH += m.heightPx;
  }
  const pxToInches = 1 / pxPerInch;
  const avgWInches = (sumW / group.members.length) * pxToInches;
  const avgHInches = (sumH / group.members.length) * pxToInches;
  const roundedWInches = Math.max(
    snapIncrementInches,
    roundToIncrement(avgWInches, snapIncrementInches)
  );
  const roundedHInches = Math.max(
    snapIncrementInches,
    roundToIncrement(avgHInches, snapIncrementInches)
  );
  return {
    widthPx: roundedWInches * pxPerInch,
    heightPx: roundedHInches * pxPerInch,
  };
}

// ── Shape builders ───────────────────────────────────────────────────────

function buildAxisAlignedRect(tl: Point2D, wPx: number, hPx: number): Point2D[] {
  return [
    { x: tl.x, y: tl.y },
    { x: tl.x + wPx, y: tl.y },
    { x: tl.x + wPx, y: tl.y + hPx },
    { x: tl.x, y: tl.y + hPx },
  ];
}

/**
 * Build a canonical axis-aligned right triangle inside the bbox
 * `[tl, tl + (wPx, hPx)]` with its right angle at `corner`. The returned
 * polygon is clockwise-ordered starting from the top-most-leftmost
 * vertex in the triangle.
 */
function buildRightTriangle(
  tl: Point2D,
  wPx: number,
  hPx: number,
  corner: TriangleCorner
): Point2D[] {
  const tlPt: Point2D = { x: tl.x, y: tl.y };
  const trPt: Point2D = { x: tl.x + wPx, y: tl.y };
  const brPt: Point2D = { x: tl.x + wPx, y: tl.y + hPx };
  const blPt: Point2D = { x: tl.x, y: tl.y + hPx };
  switch (corner) {
    // Right angle at TL: legs along top and left edges, hypotenuse TR→BL.
    case 'tl':
      return [tlPt, trPt, blPt];
    // Right angle at TR: legs along top and right edges, hypotenuse TL→BR.
    case 'tr':
      return [tlPt, trPt, brPt];
    // Right angle at BR: legs along right and bottom edges, hypotenuse TR→BL.
    case 'br':
      return [trPt, brPt, blPt];
    // Right angle at BL: legs along bottom and left edges, hypotenuse TL→BR.
    case 'bl':
      return [tlPt, brPt, blPt];
  }
}

// ── Utilities ────────────────────────────────────────────────────────────

function roundToIncrement(value: number, increment: number): number {
  if (increment <= 0) return value;
  return Math.round(value / increment) * increment;
}

function snapPointToGrid(p: Point2D, pxPerIncrement: number): Point2D {
  if (pxPerIncrement <= 0) return { x: p.x, y: p.y };
  return {
    x: Math.round(p.x / pxPerIncrement) * pxPerIncrement,
    y: Math.round(p.y / pxPerIncrement) * pxPerIncrement,
  };
}

function centroidOf(polygon: readonly Point2D[]): Point2D {
  if (polygon.length === 0) return { x: 0, y: 0 };
  let sx = 0;
  let sy = 0;
  for (const p of polygon) {
    sx += p.x;
    sy += p.y;
  }
  return { x: sx / polygon.length, y: sy / polygon.length };
}

function bboxOf(polygon: readonly Point2D[]): DetectedPatch['bboxPx'] {
  if (polygon.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of polygon) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  return { minX, minY, maxX, maxY };
}
