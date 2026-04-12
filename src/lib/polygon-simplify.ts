/**
 * Polygon Simplify — Douglas-Peucker + 45°-multiple angle snap.
 *
 * Quilts are built on a 0°/45°/90°/135° angle grid, so once a raw contour
 * has been traced off a jpeg photo we can cheaply tidy it up:
 *
 *   1. `douglasPeucker` drops intermediate vertices that lie within
 *      `epsilon` of the line through their retained neighbours — turns
 *      100-point wobbly edges into clean 2-point segments.
 *   2. `snapAnglesTo45` rotates each edge to the nearest 0/45/90/…
 *      multiple when it's already within `toleranceDeg` — cleans up
 *      camera tilt and jpeg noise without destroying intentionally
 *      off-grid angles (e.g. 30° kite blocks).
 *
 * Pure computation — zero DOM, zero Fabric.js, zero React. Deterministic
 * and non-mutating: every function returns a fresh array and never
 * touches its inputs.
 *
 * Design notes:
 *   - DP special-cases `epsilon ≤ 0` to "return a copy unchanged" so
 *     callers can opt out of simplification without branching at the
 *     call site.
 *   - `snapAnglesTo45` always preserves `points[0]`. Intermediate edges
 *     are snapped based on the *original* input angles, so cumulative
 *     per-edge snapping doesn't cascade — each edge decision is made
 *     against the unmodified polyline. The polyline is then rebuilt
 *     sequentially from the snapped edge directions and original edge
 *     lengths, which means the last endpoint can drift by a sub-pixel
 *     amount when earlier edges were snapped. The colinear-midpoint
 *     sweep at the end catches the common case where a whole run of
 *     edges snapped to the same angle.
 *   - Colinear detection uses the 2D cross product on three consecutive
 *     vertices with a small absolute tolerance so snapped near-zero
 *     residuals from floating-point trig still count as colinear.
 */

import type { Point2D } from '@/lib/photo-layout-types';

// ─── Douglas-Peucker ───────────────────────────────────────────────────────

/**
 * Recursive Douglas-Peucker simplification.
 *
 * `epsilon` is the maximum perpendicular distance a vertex may fall from
 * the straight line between its retained neighbours before it becomes a
 * kept vertex of its own. Returns a fresh array; `points` is never
 * mutated.
 *
 * Short-inputs (0, 1 or 2 points) pass through unchanged. Negative or
 * zero `epsilon` also pass through unchanged so callers can disable
 * simplification without a conditional.
 */
export function douglasPeucker(
  points: readonly Point2D[],
  epsilon: number
): Point2D[] {
  if (points.length <= 2) return points.map((p) => ({ x: p.x, y: p.y }));
  if (epsilon <= 0) return points.map((p) => ({ x: p.x, y: p.y }));

  const n = points.length;
  const keep = new Uint8Array(n);
  keep[0] = 1;
  keep[n - 1] = 1;

  // Iterative recursion via an explicit stack — avoids blowing the JS
  // call stack on huge contours.
  const stack: Array<readonly [number, number]> = [[0, n - 1]];
  while (stack.length > 0) {
    const pair = stack.pop();
    if (!pair) break;
    const [start, end] = pair;
    if (end - start < 2) continue;

    const ax = points[start].x;
    const ay = points[start].y;
    const bx = points[end].x;
    const by = points[end].y;
    const dx = bx - ax;
    const dy = by - ay;
    const segLenSq = dx * dx + dy * dy;

    let maxDist = 0;
    let maxIdx = -1;
    for (let i = start + 1; i < end; i++) {
      const px = points[i].x;
      const py = points[i].y;
      let dist: number;
      if (segLenSq === 0) {
        // Degenerate segment — the two endpoints coincide, so fall back
        // to plain point-to-point distance from either endpoint.
        const ddx = px - ax;
        const ddy = py - ay;
        dist = Math.sqrt(ddx * ddx + ddy * ddy);
      } else {
        // Perpendicular distance via projection onto the segment.
        const t = ((px - ax) * dx + (py - ay) * dy) / segLenSq;
        const cx = ax + t * dx;
        const cy = ay + t * dy;
        const ddx = px - cx;
        const ddy = py - cy;
        dist = Math.sqrt(ddx * ddx + ddy * ddy);
      }
      if (dist > maxDist) {
        maxDist = dist;
        maxIdx = i;
      }
    }

    if (maxDist > epsilon && maxIdx !== -1) {
      keep[maxIdx] = 1;
      stack.push([start, maxIdx]);
      stack.push([maxIdx, end]);
    }
  }

  const result: Point2D[] = [];
  for (let i = 0; i < n; i++) {
    if (keep[i]) result.push({ x: points[i].x, y: points[i].y });
  }
  return result;
}

// ─── 45° angle snap ────────────────────────────────────────────────────────

interface SnapDir {
  readonly dx: number;
  readonly dy: number;
}

/**
 * Snap edge directions to the nearest multiple of 45° when they're
 * within `toleranceDeg` of one.
 *
 * The polyline is rebuilt from `points[0]` by laying down each edge
 * with:
 *   - the snapped unit direction, when the edge's original angle is
 *     within tolerance of a 0°/45°/90°/… multiple, and
 *   - the original displacement otherwise.
 *
 * Edge lengths are preserved in both cases so the rough scale of the
 * polyline stays intact. Finally, any colinear midpoint runs left over
 * (the common case where several edges all snapped to the same angle)
 * are collapsed. Inputs shorter than three points pass through with a
 * defensive copy.
 */
export function snapAnglesTo45(
  points: readonly Point2D[],
  toleranceDeg: number
): Point2D[] {
  if (points.length < 3) return points.map((p) => ({ x: p.x, y: p.y }));

  const n = points.length;

  // Compute each edge's snap direction (or `null`) from the ORIGINAL
  // polyline — decisions don't cascade.
  const snapDirs: Array<SnapDir | null> = new Array(n - 1);
  for (let i = 0; i < n - 1; i++) {
    const ex = points[i + 1].x - points[i].x;
    const ey = points[i + 1].y - points[i].y;
    const lenSq = ex * ex + ey * ey;
    if (lenSq === 0) {
      snapDirs[i] = null;
      continue;
    }

    const angleDeg = (Math.atan2(ey, ex) * 180) / Math.PI;
    const nearest = Math.round(angleDeg / 45) * 45;

    // Normalize the residual to (-180, 180] to handle the wrap at ±180°.
    let diff = angleDeg - nearest;
    while (diff > 180) diff -= 360;
    while (diff <= -180) diff += 360;

    if (Math.abs(diff) < toleranceDeg) {
      const rad = (nearest * Math.PI) / 180;
      snapDirs[i] = { dx: Math.cos(rad), dy: Math.sin(rad) };
    } else {
      snapDirs[i] = null;
    }
  }

  // Rebuild sequentially, anchored at points[0]. Original edge lengths
  // are preserved so the scale of the polyline doesn't collapse.
  const rebuilt: Point2D[] = [{ x: points[0].x, y: points[0].y }];
  for (let i = 0; i < n - 1; i++) {
    const ex = points[i + 1].x - points[i].x;
    const ey = points[i + 1].y - points[i].y;
    const len = Math.sqrt(ex * ex + ey * ey);
    const prev = rebuilt[rebuilt.length - 1];
    const dir = snapDirs[i];
    if (dir) {
      rebuilt.push({ x: prev.x + dir.dx * len, y: prev.y + dir.dy * len });
    } else {
      // No snap: copy the original displacement onto the (possibly
      // drifted) previous rebuilt point.
      rebuilt.push({ x: prev.x + ex, y: prev.y + ey });
    }
  }

  return removeColinearMidpoints(rebuilt);
}

// ─── Colinear midpoint removal ─────────────────────────────────────────────

/**
 * Drop any vertex that lies on the straight line through its neighbours.
 *
 * Uses the 2D cross product of `(b - a)` and `(c - a)` with a small
 * absolute tolerance so sub-pixel residuals from the snap rebuild still
 * count as colinear. The result keeps the first and last vertices
 * verbatim, so the overall endpoints of the polyline survive.
 */
function removeColinearMidpoints(points: readonly Point2D[]): Point2D[] {
  if (points.length <= 2) return points.map((p) => ({ x: p.x, y: p.y }));

  const EPSILON = 1e-6;
  const out: Point2D[] = [{ x: points[0].x, y: points[0].y }];
  for (let i = 1; i < points.length - 1; i++) {
    const a = out[out.length - 1];
    const b = points[i];
    const c = points[i + 1];
    const cross = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
    if (Math.abs(cross) > EPSILON) {
      out.push({ x: b.x, y: b.y });
    }
  }
  const last = points[points.length - 1];
  out.push({ x: last.x, y: last.y });
  return out;
}
