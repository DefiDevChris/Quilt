// ============================================================================
// Stage: Grid Canonicalization + Template Dedup
//
// Turns wobbly, free-form polygons into mathematically exact patches snapped
// to the user-calibrated grid. Two jobs:
//
//   1. **Snap** every vertex to the nearest `cellSize / snapDivisor`
//      intersection (default ¼-cell, i.e. ¼″ when cellSize = 1″).
//      Collapse consecutive duplicates the snap produced, drop degenerate
//      results (< 3 vertices, zero area).
//
//   2. **Dedup** identically-shaped patches. Fifty slightly-rotated squares
//      that all snapped to a 2×2 cell become fifty patch instances that
//      share a single `templateId` — the downstream printer only needs to
//      cut one cardstock template and use it 50 times.
//
// Shape dedup is translation-invariant (by subtracting minX/minY), starting-
// vertex-invariant (by rotating the vertex list to start at the lex-min
// vertex), and winding-invariant (by forcing CCW orientation). It is
// intentionally NOT rotation- or reflection-invariant — a 45°-rotated
// square and an axis-aligned square are genuinely different templates from
// a quilter's cutting perspective.
// ============================================================================

import type { BoundingBox, GridSpec, Patch, Point, VectorizedPatch } from '../types';

/** ¼ of a cell = standard quilting quarter-inch snap. */
export const DEFAULT_SNAP_DIVISOR = 4;
const MIN_VERTICES = 3;

export interface CanonicalizeOptions {
  /** How many snap steps fit in one grid cell. Default 4 → ¼-cell snap. */
  snapDivisor?: number;
}

export function canonicalizePatches(
  vectorized: VectorizedPatch[],
  gridSpec: GridSpec,
  opts: CanonicalizeOptions = {}
): Patch[] {
  const snapDivisor = opts.snapDivisor ?? DEFAULT_SNAP_DIVISOR;
  const snapStep = gridSpec.cellSize / snapDivisor;

  const templateIdByShape = new Map<string, string>();
  const patches: Patch[] = [];
  let nextId = 1;

  for (const vp of vectorized) {
    const snapped = snapPolygon(vp.vertices, gridSpec, snapStep);
    if (snapped.length < MIN_VERTICES) continue;
    if (Math.abs(signedArea(snapped)) < snapStep * snapStep * 0.5) continue;

    const shapeKey = buildShapeKey(snapped);
    let templateId = templateIdByShape.get(shapeKey);
    if (!templateId) {
      templateId = `t${templateIdByShape.size + 1}`;
      templateIdByShape.set(shapeKey, templateId);
    }

    patches.push({
      id: nextId++,
      templateId,
      vertices: snapped,
      svgPath: buildSvgPath(snapped),
    });
  }

  return patches;
}

// ---------------------------------------------------------------------------
// Snap
// ---------------------------------------------------------------------------

/** Snap one vertex to the nearest (offsetX + k*step, offsetY + k*step) intersection. */
export function snapPointToGrid(p: Point, grid: GridSpec, step: number): Point {
  return {
    x: Math.round((p.x - grid.offsetX) / step) * step + grid.offsetX,
    y: Math.round((p.y - grid.offsetY) / step) * step + grid.offsetY,
  };
}

/**
 * Snap every vertex then collapse runs of identical vertices. Also drops the
 * closing duplicate (first === last) since our Patch convention is implicit
 * closure.
 */
export function snapPolygon(verts: Point[], grid: GridSpec, step: number): Point[] {
  const out: Point[] = [];
  for (const v of verts) {
    const s = snapPointToGrid(v, grid, step);
    const prev = out[out.length - 1];
    if (prev && prev.x === s.x && prev.y === s.y) continue;
    out.push(s);
  }
  // Drop closing duplicate
  if (out.length > 1) {
    const first = out[0];
    const last = out[out.length - 1];
    if (first.x === last.x && first.y === last.y) out.pop();
  }
  return out;
}

// ---------------------------------------------------------------------------
// Shape key (for template dedup)
// ---------------------------------------------------------------------------

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
 * Canonical shape key: translate to origin, force CCW winding, rotate the
 * vertex list so it starts at the lex-smallest vertex. Two polygons with the
 * same shape but any translation / starting vertex / winding return the same
 * string.
 */
export function buildShapeKey(verts: Point[]): string {
  if (verts.length < MIN_VERTICES) return '';

  const bbox = computeVertBbox(verts);
  const translated = verts.map((p) => ({ x: p.x - bbox.minX, y: p.y - bbox.minY }));

  const oriented = signedArea(translated) < 0 ? translated.slice().reverse() : translated;

  let startIdx = 0;
  let minKey = pointKey(oriented[0]);
  for (let i = 1; i < oriented.length; i++) {
    const k = pointKey(oriented[i]);
    if (k < minKey) {
      minKey = k;
      startIdx = i;
    }
  }

  const rotated: string[] = [];
  for (let i = 0; i < oriented.length; i++) {
    rotated.push(pointKey(oriented[(startIdx + i) % oriented.length]));
  }
  return rotated.join('|');
}

function pointKey(p: Point): string {
  // Round to avoid cross-platform float variance for snapped coords that
  // should be integer multiples of `snapStep`.
  return `${round6(p.x)},${round6(p.y)}`;
}

function round6(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}

function computeVertBbox(verts: Point[]): BoundingBox {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of verts) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

// ---------------------------------------------------------------------------
// SVG path
// ---------------------------------------------------------------------------

export function buildSvgPath(verts: Point[]): string {
  if (verts.length === 0) return '';
  const parts: string[] = [`M${verts[0].x} ${verts[0].y}`];
  for (let i = 1; i < verts.length; i++) {
    parts.push(`L${verts[i].x} ${verts[i].y}`);
  }
  parts.push('Z');
  return parts.join(' ');
}
