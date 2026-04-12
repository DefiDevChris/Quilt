/**
 * Color Quantize — K-Means clustering in CIELAB space for photo segmentation.
 *
 * Given a warped quilt photo and a target fabric count, this runs k-means++
 * on the pixels' LAB coordinates and returns:
 *
 *   - `clusters`  — one record per cluster with LAB/RGB/hex + pixel count
 *   - `labelMap`  — one cluster index per pixel (row-major), feeds the
 *                   downstream connected-components step
 *
 * Pure computation — zero DOM, zero Fabric.js, zero React. Deterministic
 * under a fixed seed so unit tests are stable. Reuses `color-math.ts` for
 * the sRGB → LAB conversion (D65 illuminant, proper sRGB linearization).
 *
 * Design notes:
 *   - Clustering runs on a strided subsample of the image to keep k-means
 *     cheap. The final `labelMap` is still full-resolution — each pixel gets
 *     assigned to the nearest finished centroid regardless of stride.
 *   - Clusters are sorted by pixel count descending before return, and the
 *     `labelMap` is remapped to match, so callers can rely on `clusters[0]`
 *     being the dominant fabric.
 *   - `k` is clamped to the available sample count to handle degenerate
 *     inputs (very small or monochrome images) gracefully.
 */

import { rgbToLab, rgbToHex, type LAB, type RGB } from './color-math';

// ─── Public types ──────────────────────────────────────────────────────────

/**
 * A minimal subset of the DOM `ImageData` interface. Accepting this instead
 * of the real `ImageData` lets us drive the engine from both the browser
 * (`canvas.getImageData(...)`) and from unit tests that just build a
 * `Uint8ClampedArray` by hand.
 */
export interface ImageDataLike {
  readonly data: Uint8ClampedArray;
  readonly width: number;
  readonly height: number;
}

export interface QuantizeOptions {
  /** Max Lloyd iterations before giving up. Converges in ~4-8 on real quilts. */
  readonly maxIter?: number;
  /**
   * Only every Nth pixel on each axis is used for clustering, so
   * `stride=2` clusters 1/4 as many samples. Assignment is still full-res.
   */
  readonly sampleStride?: number;
  /**
   * Seed for the k-means++ init RNG. Tests pass a fixed seed for
   * deterministic output; production can omit this.
   */
  readonly seed?: number;
}

export interface QuantizeCluster {
  /** Index into the `clusters` array; also the value stored in `labelMap`. */
  readonly index: number;
  /** LAB centroid of the cluster after the final Lloyd iteration. */
  readonly lab: LAB;
  /** Centroid re-projected into sRGB (clamped to 0-255). */
  readonly rgb: RGB;
  /** 6-digit lowercase hex — what the review UI draws on swatches. */
  readonly hex: string;
  /** Number of pixels assigned to this cluster in the full-resolution pass. */
  readonly pixelCount: number;
}

export interface QuantizeResult {
  /** Clusters sorted by pixel count descending. Length ≤ requested k. */
  readonly clusters: readonly QuantizeCluster[];
  /** Per-pixel cluster index (row-major). Values reference `clusters[i].index`. */
  readonly labelMap: Uint16Array;
  readonly width: number;
  readonly height: number;
}

// ─── Defaults ──────────────────────────────────────────────────────────────

const DEFAULT_MAX_ITER = 12;
const DEFAULT_STRIDE = 2;
const DEFAULT_SEED = 0xdeadbeef;

// ─── Top-level API ─────────────────────────────────────────────────────────

/**
 * Quantize an image into `k` color clusters using k-means++ in LAB space.
 *
 * Throws on `k < 1`. Returns an empty result for a zero-pixel image.
 * Returns fewer than `k` clusters when the image has fewer usable samples
 * than requested (e.g. asking k=6 on a 1x1 image).
 */
export function quantizeImage(
  image: ImageDataLike,
  k: number,
  options: QuantizeOptions = {}
): QuantizeResult {
  if (k < 1) throw new Error('quantizeImage: k must be >= 1');

  const { data, width, height } = image;
  const totalPixels = width * height;
  if (totalPixels === 0) {
    return { clusters: [], labelMap: new Uint16Array(0), width, height };
  }

  const maxIter = options.maxIter ?? DEFAULT_MAX_ITER;
  const stride = Math.max(1, options.sampleStride ?? DEFAULT_STRIDE);
  const seed = options.seed ?? DEFAULT_SEED;

  // 1) Convert every Nth pixel to LAB and stash as a packed Float32Array.
  //    Packed layout is faster than an array of {l,a,b} objects in the
  //    inner Lloyd loop (typed-array reads stay in cache).
  const sampleCols = Math.ceil(width / stride);
  const sampleRows = Math.ceil(height / stride);
  const samples = new Float32Array(sampleCols * sampleRows * 3);
  let sampleCount = 0;
  for (let y = 0; y < height; y += stride) {
    for (let x = 0; x < width; x += stride) {
      const i = (y * width + x) * 4;
      const lab = rgbToLab({ r: data[i], g: data[i + 1], b: data[i + 2] });
      samples[sampleCount * 3] = lab.l;
      samples[sampleCount * 3 + 1] = lab.a;
      samples[sampleCount * 3 + 2] = lab.b;
      sampleCount++;
    }
  }

  // 2) k-means++ seeding. Clamp k so degenerate inputs don't loop forever.
  const effectiveK = Math.min(k, sampleCount);
  const centers = kMeansPlusPlusSeed(samples, sampleCount, effectiveK, seed);

  // 3) Lloyd iteration on the sampled subset.
  const assignments = new Uint16Array(sampleCount);
  const sums = new Float64Array(effectiveK * 3);
  const counts = new Uint32Array(effectiveK);

  for (let iter = 0; iter < maxIter; iter++) {
    let moved = 0;
    for (let i = 0; i < sampleCount; i++) {
      const L = samples[i * 3];
      const a = samples[i * 3 + 1];
      const b = samples[i * 3 + 2];
      let best = 0;
      let bestDist = Infinity;
      for (let c = 0; c < effectiveK; c++) {
        const dL = L - centers[c * 3];
        const da = a - centers[c * 3 + 1];
        const db = b - centers[c * 3 + 2];
        const d = dL * dL + da * da + db * db;
        if (d < bestDist) {
          bestDist = d;
          best = c;
        }
      }
      if (iter === 0 || assignments[i] !== best) {
        assignments[i] = best;
        moved++;
      }
    }
    if (iter > 0 && moved === 0) break;

    sums.fill(0);
    counts.fill(0);
    for (let i = 0; i < sampleCount; i++) {
      const c = assignments[i];
      sums[c * 3] += samples[i * 3];
      sums[c * 3 + 1] += samples[i * 3 + 1];
      sums[c * 3 + 2] += samples[i * 3 + 2];
      counts[c]++;
    }
    for (let c = 0; c < effectiveK; c++) {
      if (counts[c] === 0) continue;
      centers[c * 3] = sums[c * 3] / counts[c];
      centers[c * 3 + 1] = sums[c * 3 + 1] / counts[c];
      centers[c * 3 + 2] = sums[c * 3 + 2] / counts[c];
    }
  }

  // 4) Full-resolution assignment → labelMap. Every pixel gets its nearest
  //    finished center, regardless of the stride used for clustering.
  const rawLabelMap = new Uint16Array(totalPixels);
  const fullCounts = new Uint32Array(effectiveK);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const lab = rgbToLab({ r: data[i], g: data[i + 1], b: data[i + 2] });
      let best = 0;
      let bestDist = Infinity;
      for (let c = 0; c < effectiveK; c++) {
        const dL = lab.l - centers[c * 3];
        const da = lab.a - centers[c * 3 + 1];
        const db = lab.b - centers[c * 3 + 2];
        const d = dL * dL + da * da + db * db;
        if (d < bestDist) {
          bestDist = d;
          best = c;
        }
      }
      rawLabelMap[y * width + x] = best;
      fullCounts[best]++;
    }
  }

  // 5) Build cluster records in the raw order, then sort by pixel count
  //    descending so callers can rely on `clusters[0]` being dominant.
  const rawClusters: QuantizeCluster[] = [];
  for (let c = 0; c < effectiveK; c++) {
    const lab: LAB = {
      l: centers[c * 3],
      a: centers[c * 3 + 1],
      b: centers[c * 3 + 2],
    };
    const rgb = labToRgb(lab);
    rawClusters.push({
      index: c,
      lab,
      rgb,
      hex: rgbToHex(rgb),
      pixelCount: fullCounts[c],
    });
  }
  rawClusters.sort((a, b) => b.pixelCount - a.pixelCount);

  // 6) Remap labelMap so values match the post-sort cluster order.
  const oldToNew = new Uint16Array(effectiveK);
  const clusters: QuantizeCluster[] = rawClusters.map((cluster, newIdx) => {
    oldToNew[cluster.index] = newIdx;
    return { ...cluster, index: newIdx };
  });
  const labelMap = new Uint16Array(totalPixels);
  for (let i = 0; i < totalPixels; i++) {
    labelMap[i] = oldToNew[rawLabelMap[i]];
  }

  return { clusters, labelMap, width, height };
}

// ─── k-means++ seeding ─────────────────────────────────────────────────────

/**
 * K-means++ picks initial centers that are far apart, which drastically
 * reduces the chance of landing in a bad local minimum. Each new center is
 * sampled with probability proportional to its squared distance from the
 * nearest already-picked center.
 *
 * When all remaining candidates coincide with existing centers (total
 * distance = 0), we fall back to deterministic evenly-spaced indices so
 * the function stays productive instead of spinning on zero-weight
 * samples.
 */
function kMeansPlusPlusSeed(
  samples: Float32Array,
  n: number,
  k: number,
  seed: number
): Float32Array {
  const rng = mulberry32(seed);
  const centers = new Float32Array(k * 3);

  // Pick the first center uniformly.
  const first = Math.min(n - 1, Math.floor(rng() * n));
  centers[0] = samples[first * 3];
  centers[1] = samples[first * 3 + 1];
  centers[2] = samples[first * 3 + 2];

  // distSq[i] = squared distance from samples[i] to its nearest current center.
  const distSq = new Float64Array(n);
  let total = 0;
  for (let i = 0; i < n; i++) {
    const dL = samples[i * 3] - centers[0];
    const da = samples[i * 3 + 1] - centers[1];
    const db = samples[i * 3 + 2] - centers[2];
    distSq[i] = dL * dL + da * da + db * db;
    total += distSq[i];
  }

  for (let c = 1; c < k; c++) {
    let chosen: number;
    if (total <= 0) {
      // All samples coincident with existing centers — fall back to even spacing.
      chosen = Math.min(n - 1, Math.floor((c * n) / k));
    } else {
      const target = rng() * total;
      let acc = 0;
      chosen = n - 1;
      for (let i = 0; i < n; i++) {
        acc += distSq[i];
        if (acc >= target) {
          chosen = i;
          break;
        }
      }
    }
    centers[c * 3] = samples[chosen * 3];
    centers[c * 3 + 1] = samples[chosen * 3 + 1];
    centers[c * 3 + 2] = samples[chosen * 3 + 2];

    // Refresh distSq against the newly added center.
    total = 0;
    for (let i = 0; i < n; i++) {
      const dL = samples[i * 3] - centers[c * 3];
      const da = samples[i * 3 + 1] - centers[c * 3 + 1];
      const db = samples[i * 3 + 2] - centers[c * 3 + 2];
      const d = dL * dL + da * da + db * db;
      if (d < distSq[i]) distSq[i] = d;
      total += distSq[i];
    }
  }

  return centers;
}

// ─── LAB → sRGB (inverse of rgbToLab in color-math.ts) ─────────────────────

/**
 * Convert a LAB centroid back to sRGB so we can show a swatch. Uses the
 * same D65 reference white and sRGB companding curves as `color-math.ts`
 * so round-tripping `rgb → lab → rgb` on in-gamut colors returns the input
 * (within integer rounding).
 */
function labToRgb(lab: LAB): RGB {
  const D65_X = 0.95047;
  const D65_Y = 1.0;
  const D65_Z = 1.08883;

  const fy = (lab.l + 16) / 116;
  const fx = lab.a / 500 + fy;
  const fz = fy - lab.b / 200;

  const labFInv = (t: number): number => {
    const delta = 6 / 29;
    return t > delta ? t * t * t : 3 * delta * delta * (t - 4 / 29);
  };

  const x = labFInv(fx) * D65_X;
  const y = labFInv(fy) * D65_Y;
  const z = labFInv(fz) * D65_Z;

  // XYZ → linear sRGB (inverse sRGB D65 matrix).
  const rLin = 3.2404542 * x + -1.5371385 * y + -0.4985314 * z;
  const gLin = -0.969266 * x + 1.8760108 * y + 0.041556 * z;
  const bLin = 0.0556434 * x + -0.2040259 * y + 1.0572252 * z;

  // Linear → sRGB companding + clamp to [0, 255].
  const compand = (c: number): number => {
    if (c <= 0) return 0;
    if (c >= 1) return 1;
    return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  };

  return {
    r: Math.round(compand(rLin) * 255),
    g: Math.round(compand(gLin) * 255),
    b: Math.round(compand(bLin) * 255),
  };
}

// ─── Deterministic PRNG ────────────────────────────────────────────────────

/**
 * Mulberry32 — a 32-bit seed PRNG that's fast, dependency-free, and good
 * enough for k-means++ seeding. Gives tests stable outputs without pulling
 * in a random library.
 */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
