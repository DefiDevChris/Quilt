/**
 * Edge Detect — Pure-TS Canny edge detector for quilt-quad auto-detection.
 *
 * Used by `quad-detect.ts` to seed the four-corner pins on the calibration
 * step. This is *not* used by the downstream segmentation engine — once
 * the quilt has been warped, segmentation works from flat color clusters,
 * not edges.
 *
 * Pipeline:
 *   1. Grayscale (luma from sRGB)
 *   2. 5×5 Gaussian blur, σ ≈ 1.4
 *   3. Sobel 3×3 gradients (magnitude + angle)
 *   4. Non-maximum suppression along the gradient direction
 *   5. Double-threshold hysteresis (low + high thresholds)
 *
 * Thresholds default to an adaptive (median × 0.66 / 1.33) pair that
 * handles both high-contrast quilts on plain backgrounds and low-contrast
 * dim indoor shots without tuning. Callers can override them for tests.
 *
 * Pure computation — zero DOM, zero Fabric.js, zero React. Deterministic.
 */

import type { ImageDataLike } from '@/lib/color-quantize';

// ── Public types ─────────────────────────────────────────────────────────

export interface CannyOptions {
  /** Hysteresis low threshold. Falls back to 0.66 × median gradient. */
  readonly lowThreshold?: number;
  /** Hysteresis high threshold. Falls back to 1.33 × median gradient. */
  readonly highThreshold?: number;
}

// ── Top-level API ────────────────────────────────────────────────────────

/**
 * Canny edge detection. Returns a `Uint8Array` the same dimensions as the
 * input, with `1` at edge pixels and `0` everywhere else.
 */
export function cannyEdges(image: ImageDataLike, options: CannyOptions = {}): Uint8Array {
  const { width, height } = image;
  const total = width * height;
  if (total === 0) return new Uint8Array(0);

  // 1) Grayscale via BT.601 luma.
  const gray = new Float32Array(total);
  for (let i = 0; i < total; i++) {
    const idx = i * 4;
    gray[i] = 0.299 * image.data[idx] + 0.587 * image.data[idx + 1] + 0.114 * image.data[idx + 2];
  }

  // 2) 5×5 Gaussian blur, σ ≈ 1.4. Separable horizontal/vertical pass.
  const blurred = gaussianBlur5(gray, width, height);

  // 3) Sobel gradients.
  const mag = new Float32Array(total);
  const angle = new Float32Array(total);
  sobel(blurred, width, height, mag, angle);

  // 4) Non-maximum suppression.
  const thinned = new Float32Array(total);
  nonMaxSuppress(mag, angle, width, height, thinned);

  // 5) Hysteresis thresholds — derived from the gradient distribution
  // if not provided. We use a percentile-based heuristic instead of the
  // classic median × 0.66/1.33 pair because synthetic images (solid
  // shapes on a flat background) have almost no gradient variance: the
  // non-zero pixels are all near-max and the median = max, which would
  // push `high` above every real value and discard every edge.
  // The 90th percentile of the thinned magnitude gives us a ceiling that
  // survives uniform-edge inputs while still scaling down for gradual
  // photos.
  let low = options.lowThreshold;
  let high = options.highThreshold;
  if (low === undefined || high === undefined) {
    const p = percentiles(thinned, [0.75, 0.9]);
    high = high ?? Math.max(1, p[1]);
    low = low ?? Math.max(0.5, p[0] * 0.5);
  }
  return hysteresis(thinned, width, height, low, high);
}

// ── Internal: Gaussian blur (5×5, σ ≈ 1.4) ───────────────────────────────

/**
 * 5×1 Gaussian kernel for σ = 1.4. Sum = 159 so we divide once per pass.
 * Using the integer kernel from Canny's original paper keeps this
 * deterministic and cache-friendly compared to an FP recomputation.
 */
const GAUSSIAN_1D = [2, 4, 5, 4, 2] as const;
const GAUSSIAN_SUM = 17; // 2 + 4 + 5 + 4 + 2

function gaussianBlur5(input: Float32Array, width: number, height: number): Float32Array {
  const tmp = new Float32Array(width * height);
  const out = new Float32Array(width * height);

  // Horizontal pass.
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      for (let k = -2; k <= 2; k++) {
        const sx = clamp(x + k, 0, width - 1);
        sum += input[y * width + sx] * GAUSSIAN_1D[k + 2];
      }
      tmp[y * width + x] = sum / GAUSSIAN_SUM;
    }
  }

  // Vertical pass.
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      for (let k = -2; k <= 2; k++) {
        const sy = clamp(y + k, 0, height - 1);
        sum += tmp[sy * width + x] * GAUSSIAN_1D[k + 2];
      }
      out[y * width + x] = sum / GAUSSIAN_SUM;
    }
  }

  return out;
}

// ── Internal: Sobel gradients ────────────────────────────────────────────

function sobel(
  input: Float32Array,
  width: number,
  height: number,
  magOut: Float32Array,
  angleOut: Float32Array
): void {
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Reflect-clamp the neighbours so borders still produce a finite
      // gradient instead of a hard zero that creates false edges.
      const x0 = clamp(x - 1, 0, width - 1);
      const x2 = clamp(x + 1, 0, width - 1);
      const y0 = clamp(y - 1, 0, height - 1);
      const y2 = clamp(y + 1, 0, height - 1);

      const a = input[y0 * width + x0];
      const b = input[y0 * width + x];
      const c = input[y0 * width + x2];
      const d = input[y * width + x0];
      const f = input[y * width + x2];
      const g = input[y2 * width + x0];
      const h = input[y2 * width + x];
      const i = input[y2 * width + x2];

      const gx = -a + c - 2 * d + 2 * f - g + i;
      const gy = -a - 2 * b - c + g + 2 * h + i;

      const m = Math.sqrt(gx * gx + gy * gy);
      magOut[y * width + x] = m;
      angleOut[y * width + x] = Math.atan2(gy, gx);
    }
  }
}

// ── Internal: non-maximum suppression ────────────────────────────────────

function nonMaxSuppress(
  mag: Float32Array,
  angle: Float32Array,
  width: number,
  height: number,
  out: Float32Array
): void {
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      const m = mag[i];
      if (m === 0) {
        out[i] = 0;
        continue;
      }

      // Snap angle to the nearest of the four cardinal directions.
      let a = ((angle[i] * 180) / Math.PI + 180) % 180;
      let a1: number;
      let a2: number;
      if (a < 22.5 || a >= 157.5) {
        // Horizontal edge → compare east / west neighbours.
        a1 = mag[i - 1];
        a2 = mag[i + 1];
      } else if (a < 67.5) {
        // NE / SW diagonal.
        a1 = mag[i - width + 1];
        a2 = mag[i + width - 1];
      } else if (a < 112.5) {
        // Vertical edge → compare north / south neighbours.
        a1 = mag[i - width];
        a2 = mag[i + width];
      } else {
        // NW / SE diagonal.
        a1 = mag[i - width - 1];
        a2 = mag[i + width + 1];
      }
      // Silence unused-var lint when the angle snap falls into the
      // first branch and `a` is referenced only by the comparison.
      void a;

      out[i] = m >= a1 && m >= a2 ? m : 0;
    }
  }
}

// ── Internal: double-threshold hysteresis ────────────────────────────────

function hysteresis(
  thinned: Float32Array,
  width: number,
  height: number,
  low: number,
  high: number
): Uint8Array {
  const out = new Uint8Array(width * height);

  // First pass: mark strong pixels as definite edges (2) and weak pixels
  // as candidates (1). Everything else is 0.
  for (let i = 0; i < thinned.length; i++) {
    const v = thinned[i];
    if (v >= high) out[i] = 2;
    else if (v >= low) out[i] = 1;
  }

  // Propagate strong edges through weak candidates using a stack-based
  // flood fill. Any 8-connected weak pixel reachable from a strong one
  // becomes an edge; the rest get dropped.
  const stack: number[] = [];
  for (let i = 0; i < out.length; i++) {
    if (out[i] === 2) stack.push(i);
  }
  while (stack.length > 0) {
    const idx = stack.pop()!;
    const x = idx % width;
    const y = Math.floor(idx / width);
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
        const nidx = ny * width + nx;
        if (out[nidx] === 1) {
          out[nidx] = 2;
          stack.push(nidx);
        }
      }
    }
  }

  // Collapse to binary: strong (2) → 1, weak leftovers → 0.
  for (let i = 0; i < out.length; i++) {
    out[i] = out[i] === 2 ? 1 : 0;
  }

  return out;
}

// ── Internal: percentile of non-zero values ─────────────────────────────

/**
 * Histogram-based approximate percentiles of the non-zero entries, given
 * as a sorted list of fractions in [0,1]. 256 buckets keeps the
 * histogram coarse enough to be cheap but fine enough to pin down Canny
 * thresholds within ~1% of the true value.
 */
function percentiles(values: Float32Array, fractions: readonly number[]): number[] {
  let max = 0;
  let nonZero = 0;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (v > 0) {
      nonZero++;
      if (v > max) max = v;
    }
  }
  if (nonZero === 0 || max === 0) return fractions.map(() => 0);

  const bins = 256;
  const buckets = new Uint32Array(bins);
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (v <= 0) continue;
    let b = Math.floor((v / max) * (bins - 1));
    if (b < 0) b = 0;
    if (b >= bins) b = bins - 1;
    buckets[b]++;
  }

  const out = new Array(fractions.length).fill(max);
  let acc = 0;
  let fIdx = 0;
  const targets = fractions.map((f) => f * nonZero);
  for (let b = 0; b < bins && fIdx < fractions.length; b++) {
    acc += buckets[b];
    while (fIdx < fractions.length && acc >= targets[fIdx]) {
      out[fIdx] = ((b + 0.5) / bins) * max;
      fIdx++;
    }
  }
  return out;
}

function clamp(v: number, lo: number, hi: number): number {
  if (v < lo) return lo;
  if (v > hi) return hi;
  return v;
}
