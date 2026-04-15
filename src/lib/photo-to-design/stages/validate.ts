// ============================================================================
// Stage: Polygon Invariant Gate (U7)
//
// Last line of defence before an `EngineOutput` leaves the worker. Every
// downstream consumer — the Clipper.js seam-allowance pipeline, the PDF
// pattern exporter, the review canvas — assumes each `Patch.vertices` is a
// simple (non-self-intersecting) closed polygon with nonzero area and a
// well-defined winding. This gate enforces exactly that.
//
// Per-polygon invariants:
//
//   1. **Vertex count ≥ 3** — anything less can't enclose area.
//   2. **Nonzero signed area** — rules out collinear, duplicated, or
//      zero-thickness polygons that sneak past the vertex-count check.
//   3. **No non-adjacent edge contact** — strict simple-polygon invariant.
//      Uses the CLRS orientation test, and treats *any* contact (proper
//      crossing or shared endpoint or collinear overlap) between
//      non-adjacent edges as a violation. This catches bowties, figure-8s,
//      and "pinched" polygons whose non-neighbouring edges share a vertex.
//
// Set-level invariant:
//
//   4. **Consistent winding** — every patch in a single engine output must
//      wind the same direction. Clipper.js treats CCW as outer boundary and
//      CW as a hole; a mixed set would silently corrupt seam-allowance output.
//
// Pure TS, zero allocations per edge pair beyond small-integer arithmetic —
// cheap enough to run on every `EngineOutput`.
// ============================================================================

import type { Patch, Point } from '../types';

const MIN_VERTICES = 3;

export type PolygonInvariantReason =
  | 'too-few-vertices'
  | 'zero-area'
  | 'self-intersecting'
  | 'inconsistent-winding';

export class PolygonInvariantError extends Error {
  readonly reason: PolygonInvariantReason;
  readonly patchId?: number;

  constructor(reason: PolygonInvariantReason, message: string, patchId?: number) {
    super(message);
    this.name = 'PolygonInvariantError';
    this.reason = reason;
    this.patchId = patchId;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Validate a full set of canonicalized patches. Throws the first violation
 * encountered so the worker can surface it with a specific patch id.
 */
export function validatePatches(patches: Patch[]): void {
  if (patches.length === 0) return;

  let referenceSign = 0;
  for (const patch of patches) {
    validatePolygon(patch.vertices, patch.id);

    const sign = Math.sign(signedArea(patch.vertices));
    if (referenceSign === 0) {
      referenceSign = sign;
    } else if (sign !== referenceSign) {
      throw new PolygonInvariantError(
        'inconsistent-winding',
        `Patch ${patch.id} winds opposite to earlier patches in the same output`,
        patch.id
      );
    }
  }
}

/**
 * Validate one polygon. Throws `PolygonInvariantError` on first violation.
 *
 * Check order matters: a bowtie or figure-8 sums to zero signed area because
 * its opposite-winding lobes cancel, so self-intersection is reported ahead
 * of zero-area. Only strictly simple polygons fall through to the area check.
 */
export function validatePolygon(verts: Point[], patchId?: number): void {
  if (verts.length < MIN_VERTICES) {
    throw new PolygonInvariantError(
      'too-few-vertices',
      `Polygon has ${verts.length} vertices (minimum ${MIN_VERTICES})`,
      patchId
    );
  }

  if (hasNonAdjacentEdgeContact(verts)) {
    throw new PolygonInvariantError(
      'self-intersecting',
      `Polygon has non-adjacent edges that touch or cross`,
      patchId
    );
  }

  if (signedArea(verts) === 0) {
    throw new PolygonInvariantError(
      'zero-area',
      `Polygon has zero signed area (collinear or degenerate)`,
      patchId
    );
  }
}

// ---------------------------------------------------------------------------
// Pure helpers — exported for unit tests
// ---------------------------------------------------------------------------

/** Shoelace signed area. Sign encodes winding: >0 = CW (screen coords), <0 = CCW. */
export function signedArea(verts: Point[]): number {
  let sum = 0;
  for (let i = 0; i < verts.length; i++) {
    const a = verts[i];
    const b = verts[(i + 1) % verts.length];
    sum += (b.x - a.x) * (b.y + a.y);
  }
  return sum / 2;
}

/**
 * Sign of the cross product `(b-a) × (c-a)`:
 *   +1 if (a, b, c) turns left (CCW), -1 if right (CW), 0 if collinear.
 */
export function orient(a: Point, b: Point, c: Point): number {
  const v = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  if (v > 0) return 1;
  if (v < 0) return -1;
  return 0;
}

/** True iff `p` lies inside the axis-aligned bounding box of segment `ab`. */
export function onSegmentBbox(a: Point, p: Point, b: Point): boolean {
  return (
    p.x <= Math.max(a.x, b.x) &&
    p.x >= Math.min(a.x, b.x) &&
    p.y <= Math.max(a.y, b.y) &&
    p.y >= Math.min(a.y, b.y)
  );
}

/**
 * True if segments (a,b) and (c,d) share any point — proper crossing,
 * shared endpoint, or collinear overlap. This is the strict test the
 * polygon invariant wants for *non-adjacent* edges.
 */
export function segmentsTouch(a: Point, b: Point, c: Point, d: Point): boolean {
  const o1 = orient(a, b, c);
  const o2 = orient(a, b, d);
  const o3 = orient(c, d, a);
  const o4 = orient(c, d, b);

  if (o1 !== o2 && o3 !== o4) return true;

  if (o1 === 0 && onSegmentBbox(a, c, b)) return true;
  if (o2 === 0 && onSegmentBbox(a, d, b)) return true;
  if (o3 === 0 && onSegmentBbox(c, a, d)) return true;
  if (o4 === 0 && onSegmentBbox(c, b, d)) return true;

  return false;
}

/**
 * O(n²) sweep over non-adjacent edge pairs in an implicitly-closed polygon.
 * Non-adjacent = edges that don't share a vertex index — i.e. skip (i, i+1)
 * and the wrap-around pair (0, n-1).
 */
export function hasNonAdjacentEdgeContact(verts: Point[]): boolean {
  const n = verts.length;
  if (n < 4) return false; // triangles have only adjacent edge pairs

  for (let i = 0; i < n; i++) {
    const a = verts[i];
    const b = verts[(i + 1) % n];
    // j starts at i+2 (skip the adjacent pair). Upper bound excludes the
    // wrap-around neighbour of edge i — for i=0 that's edge n-1.
    const jEnd = i === 0 ? n - 1 : n;
    for (let j = i + 2; j < jEnd; j++) {
      const c = verts[j];
      const d = verts[(j + 1) % n];
      if (segmentsTouch(a, b, c, d)) return true;
    }
  }
  return false;
}
