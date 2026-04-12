/**
 * Contour Trace — Moore-neighbor border follower for a single component.
 *
 * Given a label buffer from `labelComponents` and a target component id,
 * walks the outer border clockwise starting from the top-most, left-most
 * pixel of the component. Returns the ordered list of pixel coordinates
 * the walker visited — one vertex per border pixel, ready to hand off to
 * `douglasPeucker` for simplification.
 *
 * Pure computation — zero DOM, zero Fabric.js, zero React. Classic
 * 8-neighbor Moore tracer: at every step we scan the eight neighbors
 * clockwise starting one position past the neighbor we just came from,
 * and take the first foreground hit. Terminates when we return to the
 * start pixel.
 *
 * Design notes:
 *   - Simply-connected 4-connected regions produce a single closed loop
 *     that matches exactly how the quilt patches from `labelComponents`
 *     look, so the "revisit start" termination condition is sufficient.
 *     Holes aren't possible because upstream masks come from solid color
 *     cluster membership.
 *   - Single-pixel components bail out early with a one-element array —
 *     Moore would spin on them otherwise.
 *   - A hard safety cap (`width * height * 4`) prevents runaway loops if
 *     a pathological shape ever reaches this function.
 */

import type { Point2D } from '@/lib/photo-layout-types';

// ─── Neighbor tables ───────────────────────────────────────────────────────

// Moore-neighbor offsets in clockwise order starting from NW. Paired arrays
// are cheaper to index than an array of [dx, dy] tuples and keep the hot
// inner loop branch-free.
const NBR_DX = [-1, 0, 1, 1, 1, 0, -1, -1] as const;
const NBR_DY = [-1, -1, -1, 0, 1, 1, 1, 0] as const;

// ─── Top-level API ─────────────────────────────────────────────────────────

/**
 * Trace the outer border of one connected component as a list of pixel
 * coordinates in clockwise order.
 *
 * Returns an empty array if `targetId` is 0 (the background sentinel) or
 * doesn't appear anywhere in `labels`. Returns a one-element array for an
 * isolated single pixel. For normal components, the returned list is a
 * closed loop: walking point N back to point 0 completes the border.
 */
export function traceBorder(
  labels: Uint32Array,
  width: number,
  height: number,
  targetId: number
): Point2D[] {
  if (targetId === 0) return [];
  if (width === 0 || height === 0) return [];

  // 1) Find the top-most, then left-most pixel of the target. This is
  //    guaranteed to be on the border: nothing foreground can lie above
  //    it (we'd have found that first) or to its left on the same row.
  let sx = -1;
  let sy = -1;
  outer: for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (labels[y * width + x] === targetId) {
        sx = x;
        sy = y;
        break outer;
      }
    }
  }
  if (sx === -1) return [];

  // 2) If the start pixel has no foreground neighbors at all, the
  //    component is a single pixel — return it and bail.
  let hasNeighbor = false;
  for (let d = 0; d < 8; d++) {
    const nx = sx + NBR_DX[d];
    const ny = sy + NBR_DY[d];
    if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
    if (labels[ny * width + nx] === targetId) {
      hasNeighbor = true;
      break;
    }
  }
  if (!hasNeighbor) return [{ x: sx, y: sy }];

  // 3) Moore-neighbor walk. `backDir` is the index (in NBR_DX/DY) that
  //    points from the current pixel back to the previous pixel. We
  //    always start the neighbor scan one step clockwise of backDir so
  //    we never re-check the pixel we came from.
  //
  //    For the initial step, the raster scan approached `s` from its
  //    west neighbor, so we pretend we arrived via direction 7 (W).
  const result: Point2D[] = [{ x: sx, y: sy }];
  let px = sx;
  let py = sy;
  let backDir = 7;

  const maxSteps = width * height * 4;
  for (let step = 0; step < maxSteps; step++) {
    let foundDir = -1;
    for (let i = 1; i <= 8; i++) {
      const d = (backDir + i) % 8;
      const nx = px + NBR_DX[d];
      const ny = py + NBR_DY[d];
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      if (labels[ny * width + nx] === targetId) {
        foundDir = d;
        break;
      }
    }
    if (foundDir === -1) break;

    const nx = px + NBR_DX[foundDir];
    const ny = py + NBR_DY[foundDir];

    // Closed the loop — we're back at the start, border complete.
    if (nx === sx && ny === sy) break;

    result.push({ x: nx, y: ny });
    px = nx;
    py = ny;
    // From the new pixel, the previous one sits in the opposite direction.
    backDir = (foundDir + 4) % 8;
  }

  return result;
}
