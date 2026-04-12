/**
 * Quilt Segmentation Engine — Fabric-first photo → pattern orchestrator.
 *
 * Chains the Phase-1 and Phase-2 primitives into one top-level call:
 *
 *   quantizeImage → per-cluster mask → labelComponents → traceBorder
 *     → douglasPeucker → snapAnglesTo45 → DetectedPatch[]
 *
 * Given a warped (perspective-corrected) quilt photo and a target fabric
 * count, returns a palette of `FabricCluster`s + a list of `DetectedPatch`
 * polygons in the warped image's pixel space. The Review UI consumes these
 * directly; the studio-handoff hook maps them through an inches-per-pixel
 * factor onto the Fabric.js canvas.
 *
 * Pure computation — zero DOM, zero Fabric.js, zero React. Deterministic
 * under a fixed seed. Reuses `color-math.ts` for RGB→LAB and
 * `fabric-match.ts` for library lookups.
 *
 * Design notes:
 *   - Clustering runs on a downsampled copy of the warped image (long edge
 *     capped at 512 px by default). Contour coordinates are scaled back
 *     into the original warped-image pixel space before the caller sees
 *     them, so Fabric.js always gets "real" coordinates.
 *   - `minPatchAreaPx` is compared in *warped-image space*, so a 0.15%
 *     threshold behaves the same regardless of the downsample ratio.
 *   - Polygons are closed: the first and last vertex coincide. Patch area
 *     is computed from the raw component, not the simplified polygon, so
 *     simplification loss doesn't leak into the filter or the output.
 */

import type { Point2D } from '@/lib/photo-layout-types';
import type { LAB, RGB } from '@/lib/color-math';
import { quantizeImage, type ImageDataLike, type QuantizeCluster } from '@/lib/color-quantize';
import { labelComponents, maskFromLabelMap, type Component } from '@/lib/connected-components';
import { traceBorder } from '@/lib/contour-trace';
import { douglasPeucker, snapAnglesTo45 } from '@/lib/polygon-simplify';
import { matchFabricToColor, type FabricMatchCandidate } from '@/lib/fabric-match';

// ── Public types ─────────────────────────────────────────────────────────

export interface FabricCluster {
  /** Index into `SegmentationResult.palette`; also referenced by patches. */
  readonly index: number;
  /** LAB centroid of the cluster. */
  readonly lab: LAB;
  /** sRGB projection of the centroid (clamped to 0-255). */
  readonly rgb: RGB;
  /** 6-digit lowercase hex — fed to the swatch UI. */
  readonly hex: string;
  /** Pixel count in the full-resolution pass of the quantizer. */
  readonly pixelCount: number;
  /** Nearest match in the user's fabric library. `null` if no candidates. */
  readonly libraryFabricId: string | null;
  /** LAB distance to the nearest library fabric, or `Infinity`. */
  readonly libraryFabricDistance: number;
}

export interface DetectedPatch {
  /** Stable id (`patch-${n}`) assigned in emission order. */
  readonly id: string;
  /** References into `SegmentationResult.palette`. */
  readonly clusterIndex: number;
  /** Simplified polygon in the warped-image pixel space. */
  readonly polygonPx: readonly Point2D[];
  /** Centroid of the polygon (arithmetic mean of vertices). */
  readonly centroidPx: Point2D;
  /** Area of the source component in warped-image pixel-squared. */
  readonly areaPx: number;
  /** Axis-aligned bounding box of the source component. */
  readonly bboxPx: {
    readonly minX: number;
    readonly minY: number;
    readonly maxX: number;
    readonly maxY: number;
  };
}

export interface SegmentationResult {
  readonly palette: readonly FabricCluster[];
  readonly patches: readonly DetectedPatch[];
  readonly width: number;
  readonly height: number;
}

export interface SegmentOptions {
  /** k — from the Fabrics slider. */
  readonly fabricCount: number;
  /** Minimum patch area in warped-image pixels². Default: 0.15% of image area. */
  readonly minPatchAreaPx?: number;
  /** 45°-multiple snap tolerance in degrees. Default: 5. */
  readonly angleSnapDeg?: number;
  /** DP epsilon in warped-image pixels. Default: 0.8% of max(w, h). */
  readonly simplifyEpsilonPx?: number;
  /** User's fabric library, for optional nearest-neighbour matching. */
  readonly libraryCandidates?: ReadonlyArray<{ id: string; hex: string }>;
  /** RNG seed for the quantizer (for deterministic tests). */
  readonly seed?: number;
  /**
   * Max long-edge of the working image used for clustering and component
   * labelling. Shorter = faster. Default: 512 px.
   */
  readonly maxWorkingDim?: number;
  /**
   * Number of 3×3 majority-filter passes to run on the quantizer label map
   * before connected-components labelling. Each pass reassigns any pixel
   * whose current label doesn't match a strict majority of its neighbours
   * to the dominant neighbour label. This collapses jpeg noise, seam
   * shadows, and other single-pixel speckle back into the surrounding
   * fabric so a single visual square doesn't fragment into a dozen tiny
   * CCL components. Default: 2.
   */
  readonly majorityFilterIterations?: number;
}

// ── Defaults ─────────────────────────────────────────────────────────────

const DEFAULT_MAX_WORKING_DIM = 512;
const DEFAULT_ANGLE_SNAP_DEG = 5;
const DEFAULT_MAJORITY_FILTER_ITERATIONS = 2;

// ── Top-level API ────────────────────────────────────────────────────────

/**
 * Run the full segmentation pipeline on a warped quilt image.
 *
 * `warped` is typically the perspective-corrected bitmap produced by
 * `warpSourceImage` in `photo-layout-utils.ts`. Throws on
 * `fabricCount < 1`. Returns an empty result on a zero-pixel image.
 */
export function segmentQuilt(warped: ImageDataLike, options: SegmentOptions): SegmentationResult {
  if (options.fabricCount < 1) {
    throw new Error('segmentQuilt: fabricCount must be >= 1');
  }

  if (warped.width === 0 || warped.height === 0) {
    return { palette: [], patches: [], width: warped.width, height: warped.height };
  }

  const maxWorkingDim = options.maxWorkingDim ?? DEFAULT_MAX_WORKING_DIM;
  const minPatchAreaPx =
    options.minPatchAreaPx ?? Math.round(warped.width * warped.height * 0.0015);
  const longestEdge = Math.max(warped.width, warped.height);
  const simplifyEpsilonPx = options.simplifyEpsilonPx ?? longestEdge * 0.008;
  const angleSnapDeg = options.angleSnapDeg ?? DEFAULT_ANGLE_SNAP_DEG;
  const majorityFilterIterations =
    options.majorityFilterIterations ?? DEFAULT_MAJORITY_FILTER_ITERATIONS;

  // ─── 1. Downsample for clustering ───────────────────────────────────
  const work = resizeImageDataLike(warped, maxWorkingDim);
  const scaleBack = warped.width / work.width; // work px → warped px

  // ─── 2. K-means in LAB on the downsampled copy ──────────────────────
  const quant = quantizeImage(work, options.fabricCount, { seed: options.seed });
  if (quant.clusters.length === 0) {
    return { palette: [], patches: [], width: warped.width, height: warped.height };
  }

  // ─── 2b. Majority-filter the label map so jpeg noise and seam shadows
  //         don't shred a single visual square into a dozen CCL components.
  const cleanedLabelMap = majorityFilterLabelMap(
    quant.labelMap,
    work.width,
    work.height,
    majorityFilterIterations
  );

  // ─── 3. Per-cluster connected components + contour + simplify ───────
  const patches: DetectedPatch[] = [];
  let nextPatchId = 0;
  for (const cluster of quant.clusters) {
    const mask = maskFromLabelMap(cleanedLabelMap, cluster.index);
    const ccl = labelComponents(mask, work.width, work.height);

    for (const component of ccl.components) {
      const areaWarped = component.area * scaleBack * scaleBack;
      if (areaWarped < minPatchAreaPx) continue;

      const rawContour = traceBorder(ccl.labels, work.width, work.height, component.id);
      if (rawContour.length < 3) continue;

      // DP epsilon is in warped-image pixels; we're simplifying in
      // work-image pixels, so scale it down by the same factor.
      const epsilonWork = simplifyEpsilonPx / scaleBack;
      const simplified = douglasPeucker(rawContour, epsilonWork);
      if (simplified.length < 3) continue;
      const snapped = snapAnglesTo45(simplified, angleSnapDeg);
      if (snapped.length < 3) continue;

      const polygonPx = snapped.map((p) => ({
        x: p.x * scaleBack,
        y: p.y * scaleBack,
      }));

      patches.push({
        id: `patch-${nextPatchId++}`,
        clusterIndex: cluster.index,
        polygonPx,
        centroidPx: centroidOf(polygonPx),
        areaPx: areaWarped,
        bboxPx: scaleBbox(component.bbox, scaleBack),
      });
    }
  }

  // ─── 4. Build palette, attaching library matches ────────────────────
  const libraryCandidates: readonly FabricMatchCandidate[] = options.libraryCandidates ?? [];
  const palette: FabricCluster[] = quant.clusters.map((cluster: QuantizeCluster) =>
    toFabricCluster(cluster, libraryCandidates)
  );

  return { palette, patches, width: warped.width, height: warped.height };
}

// ── Helpers ──────────────────────────────────────────────────────────────

function toFabricCluster(
  cluster: QuantizeCluster,
  candidates: readonly FabricMatchCandidate[]
): FabricCluster {
  const match = matchFabricToColor(cluster.hex, candidates);
  return {
    index: cluster.index,
    lab: cluster.lab,
    rgb: cluster.rgb,
    hex: cluster.hex,
    pixelCount: cluster.pixelCount,
    libraryFabricId: match.fabricId,
    libraryFabricDistance: match.distance,
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

function scaleBbox(bbox: Component['bbox'], scale: number): DetectedPatch['bboxPx'] {
  return {
    minX: bbox.minX * scale,
    minY: bbox.minY * scale,
    maxX: bbox.maxX * scale,
    maxY: bbox.maxY * scale,
  };
}

/**
 * Run `iterations` passes of a 3×3 majority filter on a quantizer label
 * map. Each pass walks every pixel, tallies the labels of its 8-neighbours
 * plus itself, and reassigns the pixel to whichever label has the highest
 * tally. Ties break toward the pixel's current label so stable regions
 * don't drift under repeated passes.
 *
 * Pure. Returns a fresh `Uint16Array`; `labelMap` is never mutated. A
 * value of `iterations <= 0` returns a defensive copy of the input.
 *
 * Collapses jpeg noise, seam shadows, and single-pixel speckle that would
 * otherwise shred a visually uniform fabric patch into many tiny CCL
 * components downstream. Two passes is usually enough to stabilize real
 * photos; three is effectively a no-op beyond that point.
 */
export function majorityFilterLabelMap(
  labelMap: Uint16Array,
  width: number,
  height: number,
  iterations: number
): Uint16Array {
  let current = new Uint16Array(labelMap);
  if (iterations <= 0 || width === 0 || height === 0) return current;

  // Scratch buffer we alternate into — avoids allocating a new array per
  // iteration inside the loop.
  let next = new Uint16Array(current.length);

  // Small fixed-size tally array. In practice k ≤ 12 (MAX_FABRICS on the
  // Review slider), so 64 entries is generous and keeps the inner loop
  // free of Map/Object allocations.
  const tally = new Int32Array(64);

  for (let iter = 0; iter < iterations; iter++) {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        tally.fill(0);

        // Tally every 8-neighbour that's inside the image, plus the
        // center pixel. Edge pixels see fewer neighbours — that's fine;
        // the majority still resolves deterministically.
        for (let dy = -1; dy <= 1; dy++) {
          const ny = y + dy;
          if (ny < 0 || ny >= height) continue;
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx;
            if (nx < 0 || nx >= width) continue;
            const label = current[ny * width + nx];
            if (label < tally.length) tally[label]++;
          }
        }

        // Pick the label with the highest tally. Ties break toward the
        // pixel's current label so stable regions don't drift.
        const currentLabel = current[idx];
        let bestLabel = currentLabel;
        let bestCount = tally[currentLabel] ?? 0;
        for (let k = 0; k < tally.length; k++) {
          if (tally[k] > bestCount) {
            bestCount = tally[k];
            bestLabel = k;
          }
        }
        next[idx] = bestLabel;
      }
    }

    // Swap buffers for the next iteration.
    const tmp = current;
    current = next;
    next = tmp;
  }

  return current;
}

/**
 * Nearest-neighbour downsample of an `ImageDataLike` to fit within
 * `maxDim` on the long edge. Produces a fresh, row-major RGBA buffer.
 * Passes the image through unchanged if it already fits.
 */
export function resizeImageDataLike(image: ImageDataLike, maxDim: number): ImageDataLike {
  const longest = Math.max(image.width, image.height);
  if (longest <= maxDim) {
    return {
      data: new Uint8ClampedArray(image.data),
      width: image.width,
      height: image.height,
    };
  }

  const scale = maxDim / longest;
  const newWidth = Math.max(1, Math.round(image.width * scale));
  const newHeight = Math.max(1, Math.round(image.height * scale));
  const out = new Uint8ClampedArray(newWidth * newHeight * 4);
  for (let y = 0; y < newHeight; y++) {
    const srcY = Math.min(image.height - 1, Math.floor((y + 0.5) / scale));
    for (let x = 0; x < newWidth; x++) {
      const srcX = Math.min(image.width - 1, Math.floor((x + 0.5) / scale));
      const srcIdx = (srcY * image.width + srcX) * 4;
      const dstIdx = (y * newWidth + x) * 4;
      out[dstIdx] = image.data[srcIdx];
      out[dstIdx + 1] = image.data[srcIdx + 1];
      out[dstIdx + 2] = image.data[srcIdx + 2];
      out[dstIdx + 3] = image.data[srcIdx + 3];
    }
  }
  return { data: out, width: newWidth, height: newHeight };
}
