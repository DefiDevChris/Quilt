/**
 * Perspective Engine — pure-TypeScript analog of OpenCV's
 * `getPerspectiveTransform` + `warpPerspective`.
 *
 * The photo→pattern pipeline now starts with a human calibration step where
 * the user pins four corners onto the outline of a real quilt block. This
 * module takes those four corners plus a real-world size in inches and
 * produces:
 *
 *   1. A 3×3 homography matrix mapping source pixels → flattened block.
 *   2. A flattened `ImageData` bitmap of the block, ready for K-Means color
 *      sampling per grid cell.
 *
 * We deliberately avoid loading `@techstark/opencv-js` for a ~10 MB WASM
 * binary when the entire operation is a closed-form 8×8 linear solve plus
 * a bilinear-interpolated resample. Zero DOM / React / Fabric.js deps, so
 * the engine is fully unit-testable with Vitest.
 */

import type { Point2D } from '@/types/geometry';
import type { QuadCorners } from './photo-layout-types';

// ── Homography Solve ──────────────────────────────────────────────────────

/**
 * Solve an 8×8 linear system via Gauss-Jordan elimination with partial
 * pivoting. Mutates `A` and `b` in place; returns the solution vector `x`
 * such that `A·x = b`. Returns null if the system is singular.
 */
function solve8x8(A: number[][], b: number[]): number[] | null {
  const n = 8;
  for (let i = 0; i < n; i++) {
    // Partial pivoting — move the row with the largest |A[i][i]| to row i.
    let maxRow = i;
    let maxVal = Math.abs(A[i][i]);
    for (let r = i + 1; r < n; r++) {
      const v = Math.abs(A[r][i]);
      if (v > maxVal) {
        maxVal = v;
        maxRow = r;
      }
    }
    if (maxVal < 1e-12) return null; // singular
    if (maxRow !== i) {
      const tmpA = A[i];
      A[i] = A[maxRow];
      A[maxRow] = tmpA;
      const tmpB = b[i];
      b[i] = b[maxRow];
      b[maxRow] = tmpB;
    }

    // Eliminate column i below row i.
    for (let r = i + 1; r < n; r++) {
      const f = A[r][i] / A[i][i];
      for (let c = i; c < n; c++) A[r][c] -= f * A[i][c];
      b[r] -= f * b[i];
    }
  }

  // Back-substitute.
  const x = new Array<number>(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = b[i];
    for (let c = i + 1; c < n; c++) sum -= A[i][c] * x[c];
    x[i] = sum / A[i][i];
  }
  return x;
}

/**
 * Compute the 3×3 homography matrix H that maps the four source corners
 * (in the original photo's pixel space) to the four destination corners
 * of a flattened rectangle.
 *
 * Standard formulation — for each point pair (x, y) → (X, Y):
 *   X = (h0·x + h1·y + h2) / (h6·x + h7·y + 1)
 *   Y = (h3·x + h4·y + h5) / (h6·x + h7·y + 1)
 * Rearranges to two linear equations in h0..h7 and gives an 8×8 system
 * when we supply four correspondences.
 *
 * Returns the homography as a flat 9-element array in row-major order.
 */
export function computeHomography(
  src: QuadCorners,
  dst: QuadCorners
): number[] | null {
  const A: number[][] = [];
  const b: number[] = [];

  for (let i = 0; i < 4; i++) {
    const { x, y } = src[i];
    const { x: X, y: Y } = dst[i];
    A.push([x, y, 1, 0, 0, 0, -X * x, -X * y]);
    b.push(X);
    A.push([0, 0, 0, x, y, 1, -Y * x, -Y * y]);
    b.push(Y);
  }

  const h = solve8x8(A, b);
  if (!h) return null;
  return [h[0], h[1], h[2], h[3], h[4], h[5], h[6], h[7], 1];
}

/**
 * Invert a 3×3 matrix via the cofactor/adjugate formula. Returns null when
 * the determinant is zero.
 */
function invert3x3(m: number[]): number[] | null {
  const a = m[0];
  const b = m[1];
  const c = m[2];
  const d = m[3];
  const e = m[4];
  const f = m[5];
  const g = m[6];
  const h = m[7];
  const i = m[8];

  const A = e * i - f * h;
  const B = -(d * i - f * g);
  const C = d * h - e * g;
  const D = -(b * i - c * h);
  const E = a * i - c * g;
  const F = -(a * h - b * g);
  const G = b * f - c * e;
  const H = -(a * f - c * d);
  const I = a * e - b * d;

  const det = a * A + b * B + c * C;
  if (Math.abs(det) < 1e-12) return null;
  const invDet = 1 / det;

  return [
    A * invDet,
    D * invDet,
    G * invDet,
    B * invDet,
    E * invDet,
    H * invDet,
    C * invDet,
    F * invDet,
    I * invDet,
  ];
}

/**
 * Apply a 3×3 homography to a single point. Returns null if the point is
 * projected behind the camera plane (w ≈ 0).
 */
export function projectPoint(h: number[], x: number, y: number): Point2D | null {
  const w = h[6] * x + h[7] * y + h[8];
  if (Math.abs(w) < 1e-12) return null;
  return {
    x: (h[0] * x + h[1] * y + h[2]) / w,
    y: (h[3] * x + h[4] * y + h[5]) / w,
  };
}

// ── Warp ──────────────────────────────────────────────────────────────────

/**
 * Resample the source ImageData through the inverse homography, producing
 * a flattened `destWidth × destHeight` RGBA bitmap. Uses bilinear
 * interpolation for smoother K-Means color samples.
 *
 * @param source — Original photo pixels
 * @param h — Forward homography (source → destination) from {@link computeHomography}
 * @param destWidth — Output width in pixels
 * @param destHeight — Output height in pixels
 * @returns ImageData sized `destWidth × destHeight`, or null if the
 *          homography is singular (unrecoverable).
 */
export function warpPerspective(
  source: ImageData,
  h: number[],
  destWidth: number,
  destHeight: number
): ImageData | null {
  const hInv = invert3x3(h);
  if (!hInv) return null;

  const out = new ImageData(destWidth, destHeight);
  const dst = out.data;
  const src = source.data;
  const sw = source.width;
  const sh = source.height;

  const h0 = hInv[0];
  const h1 = hInv[1];
  const h2 = hInv[2];
  const h3 = hInv[3];
  const h4 = hInv[4];
  const h5 = hInv[5];
  const h6 = hInv[6];
  const h7 = hInv[7];
  const h8 = hInv[8];

  for (let y = 0; y < destHeight; y++) {
    for (let x = 0; x < destWidth; x++) {
      // Back-project the destination pixel into source space.
      const w = h6 * x + h7 * y + h8;
      if (Math.abs(w) < 1e-12) continue;
      const sx = (h0 * x + h1 * y + h2) / w;
      const sy = (h3 * x + h4 * y + h5) / w;

      // Bilinear sample. Edge pixels clamp to border — avoids black fringe.
      if (sx < 0 || sy < 0 || sx >= sw - 1 || sy >= sh - 1) continue;

      const x0 = Math.floor(sx);
      const y0 = Math.floor(sy);
      const fx = sx - x0;
      const fy = sy - y0;

      const p00 = (y0 * sw + x0) * 4;
      const p10 = p00 + 4;
      const p01 = p00 + sw * 4;
      const p11 = p01 + 4;

      const w00 = (1 - fx) * (1 - fy);
      const w10 = fx * (1 - fy);
      const w01 = (1 - fx) * fy;
      const w11 = fx * fy;

      const di = (y * destWidth + x) * 4;
      dst[di + 0] =
        src[p00 + 0] * w00 + src[p10 + 0] * w10 + src[p01 + 0] * w01 + src[p11 + 0] * w11;
      dst[di + 1] =
        src[p00 + 1] * w00 + src[p10 + 1] * w10 + src[p01 + 1] * w01 + src[p11 + 1] * w11;
      dst[di + 2] =
        src[p00 + 2] * w00 + src[p10 + 2] * w10 + src[p01 + 2] * w01 + src[p11 + 2] * w11;
      dst[di + 3] = 255;
    }
  }

  return out;
}

// ── Corner Helpers ────────────────────────────────────────────────────────

/**
 * Sort four corner points into clockwise order: TL, TR, BR, BL.
 *
 * Uses `x + y` to identify TL (min) and BR (max), and `x − y` to identify
 * TR (max) and BL (min). Returns null when two corners collide on the same
 * diagonal (the quilt was rotated exactly 45°, pathological case).
 */
export function sortCornersClockwise(corners: QuadCorners): QuadCorners | null {
  let tlIdx = 0;
  let trIdx = 0;
  let brIdx = 0;
  let blIdx = 0;

  let minSum = Infinity;
  let maxSum = -Infinity;
  let maxDiff = -Infinity;
  let minDiff = Infinity;

  for (let i = 0; i < 4; i++) {
    const sum = corners[i].x + corners[i].y;
    const diff = corners[i].x - corners[i].y;
    if (sum < minSum) {
      minSum = sum;
      tlIdx = i;
    }
    if (sum > maxSum) {
      maxSum = sum;
      brIdx = i;
    }
    if (diff > maxDiff) {
      maxDiff = diff;
      trIdx = i;
    }
    if (diff < minDiff) {
      minDiff = diff;
      blIdx = i;
    }
  }

  const indices = new Set([tlIdx, trIdx, brIdx, blIdx]);
  if (indices.size !== 4) return null;

  return [corners[tlIdx], corners[trIdx], corners[brIdx], corners[blIdx]];
}

/**
 * Build the destination corners for a flat `destWidth × destHeight`
 * rectangle in clockwise order starting from the top-left.
 */
export function rectCorners(destWidth: number, destHeight: number): QuadCorners {
  return [
    { x: 0, y: 0 },
    { x: destWidth, y: 0 },
    { x: destWidth, y: destHeight },
    { x: 0, y: destHeight },
  ];
}
