// ============================================================================
// Perspective Correction
// Heckbert direct formula for 4-point-to-rectangle homography
// ~85 lines of pure TypeScript. Zero dependencies. Zero DOM deps.
// ============================================================================

import type { Point } from './types';

type Matrix3x3 = [number, number, number, number, number, number, number, number, number];

/**
 * Compute 3×3 homography mapping srcQuad → dstRect.
 * Uses the Heckbert direct formula (same as OpenCV/Skia internally).
 *
 * srcQuad: 4 corners [topLeft, topRight, bottomRight, bottomLeft]
 * dstRect: {x, y, width, height}
 */
export function computeHomography(
  srcQuad: [Point, Point, Point, Point],
  dstRect: { x: number; y: number; width: number; height: number }
): Matrix3x3 {
  const [s0, s1, s2, s3] = srcQuad;
  const d0 = { x: dstRect.x, y: dstRect.y };
  const d1 = { x: dstRect.x + dstRect.width, y: dstRect.y };
  const d2 = { x: dstRect.x + dstRect.width, y: dstRect.y + dstRect.height };
  const d3 = { x: dstRect.x, y: dstRect.y + dstRect.height };

  // Build 8×8 system: Ah = b
  // For each point pair (src_i, dst_i):
  //   dst_x = (h0*src_x + h1*src_y + h2) / (h6*src_x + h7*src_y + 1)
  //   dst_y = (h3*src_x + h4*src_y + h5) / (h6*src_x + h7*src_y + 1)
  // Rearranged to linear:
  //   h0*sx + h1*sy + h2 - h6*sx*dx - h7*sy*dx = dx
  //   h3*sx + h4*sy + h5 - h6*sx*dy - h7*sy*dy = dy

  const src = [s0, s1, s2, s3];
  const dst = [d0, d1, d2, d3];

  const A: number[][] = [];
  const b: number[] = [];

  for (let i = 0; i < 4; i++) {
    const sx = src[i].x, sy = src[i].y;
    const dx = dst[i].x, dy = dst[i].y;

    A.push([sx, sy, 1, 0, 0, 0, -sx * dx, -sy * dx]);
    b.push(dx);
    A.push([0, 0, 0, sx, sy, 1, -sx * dy, -sy * dy]);
    b.push(dy);
  }

  const h = solveLinearSystem8x8(A, b);

  return [h[0], h[1], h[2], h[3], h[4], h[5], h[6], h[7], 1];
}

/** Solve 8×8 linear system via Gaussian elimination with partial pivoting */
function solveLinearSystem8x8(A: number[][], b: number[]): number[] {
  const n = 8;
  // Augmented matrix
  const M = A.map((row, i) => [...row, b[i]]);

  for (let col = 0; col < n; col++) {
    // Partial pivoting
    let maxRow = col;
    let maxVal = Math.abs(M[col][col]);
    for (let row = col + 1; row < n; row++) {
      const val = Math.abs(M[row][col]);
      if (val > maxVal) { maxVal = val; maxRow = row; }
    }
    if (maxRow !== col) {
      [M[col], M[maxRow]] = [M[maxRow], M[col]];
    }

    const pivot = M[col][col];
    if (Math.abs(pivot) < 1e-12) {
      throw new Error('Singular matrix in homography computation');
    }

    // Eliminate below
    for (let row = col + 1; row < n; row++) {
      const factor = M[row][col] / pivot;
      for (let j = col; j <= n; j++) {
        M[row][j] -= factor * M[col][j];
      }
    }
  }

  // Back substitution
  const x = new Array<number>(n);
  for (let row = n - 1; row >= 0; row--) {
    let sum = M[row][n];
    for (let j = row + 1; j < n; j++) {
      sum -= M[row][j] * x[j];
    }
    x[row] = sum / M[row][row];
  }

  return x;
}

/** Invert a 3×3 matrix via adjugate formula */
export function invertMatrix3x3(m: Matrix3x3): Matrix3x3 {
  const [a, b, c, d, e, f, g, h, i] = m;

  const det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
  if (Math.abs(det) < 1e-12) {
    throw new Error('Singular matrix — cannot invert');
  }

  const invDet = 1 / det;
  return [
    (e * i - f * h) * invDet,
    (c * h - b * i) * invDet,
    (b * f - c * e) * invDet,
    (f * g - d * i) * invDet,
    (a * i - c * g) * invDet,
    (c * d - a * f) * invDet,
    (d * h - e * g) * invDet,
    (b * g - a * h) * invDet,
    (a * e - b * d) * invDet,
  ];
}

/**
 * Warp source ImageData using a 3×3 homography matrix.
 * Uses bilinear interpolation. Operates on raw pixel buffers — no DOM deps.
 *
 * The matrix maps DESTINATION coords → SOURCE coords (inverse mapping).
 * Pass the inverted homography from computeHomography.
 */
export function warpImageData(
  srcPixels: Uint8ClampedArray,
  srcWidth: number,
  srcHeight: number,
  invMatrix: Matrix3x3,
  outWidth: number,
  outHeight: number
): Uint8ClampedArray {
  const out = new Uint8ClampedArray(outWidth * outHeight * 4);
  const [m0, m1, m2, m3, m4, m5, m6, m7, m8] = invMatrix;

  for (let dy = 0; dy < outHeight; dy++) {
    for (let dx = 0; dx < outWidth; dx++) {
      // Map destination pixel to source coordinates
      const w = m6 * dx + m7 * dy + m8;
      if (Math.abs(w) < 1e-12) continue;

      const sx = (m0 * dx + m1 * dy + m2) / w;
      const sy = (m3 * dx + m4 * dy + m5) / w;

      // Bounds check
      if (sx < 0 || sx >= srcWidth - 1 || sy < 0 || sy >= srcHeight - 1) continue;

      // Bilinear interpolation
      const x0 = Math.floor(sx);
      const y0 = Math.floor(sy);
      const fx = sx - x0;
      const fy = sy - y0;

      const i00 = (y0 * srcWidth + x0) * 4;
      const i10 = i00 + 4;
      const i01 = ((y0 + 1) * srcWidth + x0) * 4;
      const i11 = i01 + 4;

      const w00 = (1 - fx) * (1 - fy);
      const w10 = fx * (1 - fy);
      const w01 = (1 - fx) * fy;
      const w11 = fx * fy;

      const outIdx = (dy * outWidth + dx) * 4;
      out[outIdx] = srcPixels[i00] * w00 + srcPixels[i10] * w10 + srcPixels[i01] * w01 + srcPixels[i11] * w11;
      out[outIdx + 1] = srcPixels[i00 + 1] * w00 + srcPixels[i10 + 1] * w10 + srcPixels[i01 + 1] * w01 + srcPixels[i11 + 1] * w11;
      out[outIdx + 2] = srcPixels[i00 + 2] * w00 + srcPixels[i10 + 2] * w10 + srcPixels[i01 + 2] * w01 + srcPixels[i11 + 2] * w11;
      out[outIdx + 3] = srcPixels[i00 + 3] * w00 + srcPixels[i10 + 3] * w10 + srcPixels[i01 + 3] * w01 + srcPixels[i11 + 3] * w11;
    }
  }

  return out;
}
