/**
 * Quilt Segmentation Engine — Fabric-first photo → pattern orchestrator.
 *
 * Pipeline:
 *   quantizeImage → majorityFilterLabelMap → gridDecompose → DetectedPatch[]
 *
 * Given a warped (perspective-corrected) quilt photo and a target fabric
 * count, returns a palette of `FabricCluster`s + a list of `DetectedPatch`
 * polygons in the warped image's pixel space. The Review UI consumes these
 * directly; the studio-handoff hook maps them through an inches-per-pixel
 * factor onto the Fabric.js canvas.
 *
 * The grid decomposition overlays an NxN grid on the working image, finds
 * each cell's dominant cluster, detects 2×2 checkerboard patterns for
 * half-square-triangle splits, then greedily merges adjacent same-cluster
 * solid cells into maximal axis-aligned rectangles. This produces clean
 * rects and right triangles by construction and prevents same-color
 * regions in adjacent quilt blocks from merging into L-shaped blobs.
 *
 * Pure computation — zero DOM, zero Fabric.js, zero React. Deterministic
 * under a fixed seed. Reuses `color-math.ts` for RGB→LAB and
 * `fabric-match.ts` for library lookups.
 */

import type { Point2D } from '@/lib/photo-layout-types';
import type { LAB, RGB } from '@/lib/color-math';
import { quantizeImage, type ImageDataLike, type QuantizeCluster } from '@/lib/color-quantize';
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
   * before grid decomposition. Default: 2.
   */
  readonly majorityFilterIterations?: number;
  /**
   * Pixels per inch in the warped image, derived from calibration (e.g.
   * `warpedBitmap.width / blockWidthInches`). When provided, the grid
   * cell size is computed as exactly 1/8" (0.125") in physical units,
   * so every detected shape's dimensions are exact multiples of 1/8".
   * This ensures correct size ratios between all pieces regardless of
   * the absolute scale the quilt is later rendered at.
   *
   * When omitted, falls back to `gridCellPx`.
   */
  readonly pxPerInch?: number;
  /**
   * Grid-cell size in working-image pixels. Only used when `pxPerInch`
   * is not provided (e.g. in unit tests with synthetic images). When
   * `pxPerInch` is set, this is ignored. Default: 6 px.
   */
  readonly gridCellPx?: number;
}

// ── Defaults ─────────────────────────────────────────────────────────────

const DEFAULT_MAX_WORKING_DIM = 512;
const DEFAULT_MAJORITY_FILTER_ITERATIONS = 2;
const DEFAULT_GRID_CELL_PX = 6;

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
  const majorityFilterIterations =
    options.majorityFilterIterations ?? DEFAULT_MAJORITY_FILTER_ITERATIONS;

  // ─── 1. Downsample for clustering ───────────────────────────────────
  const work = resizeImageDataLike(warped, maxWorkingDim);
  const scaleBack = warped.width / work.width; // work px → warped px

  // ─── 1b. Compute grid cell size ────────────────────────────────────
  // When pxPerInch is provided (from calibration), grid cells are exactly
  // 1/8" (0.125") so every shape dimension is a multiple of 1/8" and
  // ratios between pieces are always exact. When omitted, fall back to
  // a fixed pixel size (for unit tests with synthetic images).
  let gridCellPx: number;
  if (options.pxPerInch && options.pxPerInch > 0) {
    const workPxPerInch = options.pxPerInch / scaleBack;
    gridCellPx = Math.max(1, Math.round(workPxPerInch * 0.125));
  } else {
    gridCellPx = options.gridCellPx ?? DEFAULT_GRID_CELL_PX;
  }

  // ─── 2. K-means in LAB on the downsampled copy ──────────────────────
  const quant = quantizeImage(work, options.fabricCount, { seed: options.seed });
  if (quant.clusters.length === 0) {
    return { palette: [], patches: [], width: warped.width, height: warped.height };
  }

  // ─── 2b. Majority-filter the label map ─────────────────────────────
  const cleanedLabelMap = majorityFilterLabelMap(
    quant.labelMap,
    work.width,
    work.height,
    majorityFilterIterations
  );

  // ─── 3. Grid decomposition → clean rects + right triangles ─────────
  const patches = gridDecompose(
    cleanedLabelMap,
    work.width,
    work.height,
    gridCellPx,
    quant.clusters.length,
    scaleBack,
    minPatchAreaPx
  );

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

// ── Grid decomposition ─────────────────────────────────────────────────

/**
 * Per-cell classification result. A cell is either a solid single-color
 * rectangle or a diagonal split into two right triangles (HST detection).
 */
interface CellInfo {
  /** Primary (dominant) cluster label. */
  label: number;
  /** True when the cell has two roughly-equal clusters on a diagonal. */
  isSplit: boolean;
  /** Which diagonal the split follows. 1 = NW→SE, 2 = NE→SW. */
  splitDiag: number;
  /** Secondary cluster label for split cells. */
  label2: number;
}

/**
 * Overlay a grid on the working-image label map, classify each cell as
 * a solid rectangle or a diagonal-split (two right triangles), then
 * greedily merge adjacent same-cluster solid cells into maximal
 * axis-aligned rectangles. Split cells emit two right-triangle patches.
 *
 * Returns patches in warped-image pixel space (coordinates multiplied
 * by `scaleBack`).
 *
 * This replaces the CCL → contour → simplify pipeline. Same-color
 * regions that span grid-cell boundaries stay separate, preventing
 * sashing from merging with same-color triangles in adjacent blocks.
 * Diagonal-split detection preserves half-square-triangle geometry
 * instead of collapsing it into a dominant-color rectangle.
 */
function gridDecompose(
  labelMap: Uint16Array,
  width: number,
  height: number,
  cellSize: number,
  clusterCount: number,
  scaleBack: number,
  minPatchAreaPx: number
): DetectedPatch[] {
  const cols = Math.ceil(width / cellSize);
  const rows = Math.ceil(height / cellSize);
  const totalCells = rows * cols;

  // Reusable tally buffer — avoids allocating per cell.
  const tally = new Uint32Array(clusterCount);

  // ─── Phase 1a: Find each cell's dominant cluster from filtered map ──
  const cellLabels = new Uint16Array(totalCells);

  for (let r = 0; r < rows; r++) {
    const py0 = r * cellSize;
    const py1 = Math.min(py0 + cellSize, height);
    for (let c = 0; c < cols; c++) {
      const px0 = c * cellSize;
      const px1 = Math.min(px0 + cellSize, width);
      tally.fill(0);
      for (let y = py0; y < py1; y++) {
        for (let x = px0; x < px1; x++) {
          const label = labelMap[y * width + x];
          if (label < clusterCount) tally[label]++;
        }
      }
      let best = 0;
      let bestCount = 0;
      for (let k = 0; k < clusterCount; k++) {
        if (tally[k] > bestCount) {
          bestCount = tally[k];
          best = k;
        }
      }
      cellLabels[r * cols + c] = best;
    }
  }

  // ─── Phase 1b: Detect 2×2 checkerboard patterns → triangle splits ──
  // To suppress false positives on sashing borders and color-gradient
  // edges, we require each cell to appear in ≥2 checkerboard windows
  // before marking it as a split. A real HST diagonal produces a chain
  // of overlapping windows so cells along it easily hit the threshold;
  // isolated noise does not.
  const cells: CellInfo[] = new Array(totalCells);
  for (let i = 0; i < totalCells; i++) {
    cells[i] = { label: cellLabels[i], isSplit: false, splitDiag: 0, label2: 0 };
  }

  // Pass 1: count how many checkerboard windows each cell participates in.
  const checkerHits = new Uint8Array(totalCells);
  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < cols - 1; c++) {
      const tl = cellLabels[r * cols + c];
      const tr = cellLabels[r * cols + c + 1];
      const bl = cellLabels[(r + 1) * cols + c];
      const br = cellLabels[(r + 1) * cols + c + 1];
      if (tl === br && tr === bl && tl !== tr) {
        checkerHits[r * cols + c]++;
        checkerHits[r * cols + c + 1]++;
        checkerHits[(r + 1) * cols + c]++;
        checkerHits[(r + 1) * cols + c + 1]++;
      }
    }
  }

  // Pass 2: only mark cells as split if they appear in ≥2 windows.
  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < cols - 1; c++) {
      const tl = cellLabels[r * cols + c];
      const tr = cellLabels[r * cols + c + 1];
      const bl = cellLabels[(r + 1) * cols + c];
      const br = cellLabels[(r + 1) * cols + c + 1];
      if (!(tl === br && tr === bl && tl !== tr)) continue;

      const i00 = r * cols + c;
      const i01 = r * cols + c + 1;
      const i10 = (r + 1) * cols + c;
      const i11 = (r + 1) * cols + c + 1;

      if (!cells[i00].isSplit && checkerHits[i00] >= 2) {
        cells[i00] = { label: tl, isSplit: true, splitDiag: 1, label2: tr };
      }
      if (!cells[i01].isSplit && checkerHits[i01] >= 2) {
        cells[i01] = { label: tr, isSplit: true, splitDiag: 2, label2: tl };
      }
      if (!cells[i10].isSplit && checkerHits[i10] >= 2) {
        cells[i10] = { label: bl, isSplit: true, splitDiag: 2, label2: br };
      }
      if (!cells[i11].isSplit && checkerHits[i11] >= 2) {
        cells[i11] = { label: br, isSplit: true, splitDiag: 1, label2: bl };
      }
    }
  }

  // ─── Phase 2: Greedy maximal-rectangle merge (solid cells only) ────
  const visited = new Uint8Array(totalCells);
  const patches: DetectedPatch[] = [];
  let nextPatchId = 0;

  // Mark split cells as visited so the rect merge skips them.
  for (let i = 0; i < totalCells; i++) {
    if (cells[i].isSplit) visited[i] = 1;
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      if (visited[idx]) continue;
      const label = cells[idx].label;

      // Expand right
      let maxC = c;
      while (
        maxC + 1 < cols &&
        !visited[r * cols + maxC + 1] &&
        cells[r * cols + maxC + 1].label === label
      ) {
        maxC++;
      }

      // Expand down — every column must match and be unvisited
      let maxR = r;
      let canExpand = true;
      while (canExpand && maxR + 1 < rows) {
        for (let cc = c; cc <= maxC; cc++) {
          const ni = (maxR + 1) * cols + cc;
          if (visited[ni] || cells[ni].label !== label) {
            canExpand = false;
            break;
          }
        }
        if (canExpand) maxR++;
      }

      // Mark visited
      for (let rr = r; rr <= maxR; rr++) {
        for (let cc = c; cc <= maxC; cc++) {
          visited[rr * cols + cc] = 1;
        }
      }

      // Warped-space rectangle
      const wx0 = c * cellSize * scaleBack;
      const wy0 = r * cellSize * scaleBack;
      const wx1 = Math.min((maxC + 1) * cellSize, width) * scaleBack;
      const wy1 = Math.min((maxR + 1) * cellSize, height) * scaleBack;
      const wArea = (wx1 - wx0) * (wy1 - wy0);
      if (wArea < minPatchAreaPx) continue;

      patches.push({
        id: `patch-${nextPatchId++}`,
        clusterIndex: label,
        polygonPx: [
          { x: wx0, y: wy0 },
          { x: wx1, y: wy0 },
          { x: wx1, y: wy1 },
          { x: wx0, y: wy1 },
        ],
        centroidPx: { x: (wx0 + wx1) / 2, y: (wy0 + wy1) / 2 },
        areaPx: wArea,
        bboxPx: { minX: wx0, minY: wy0, maxX: wx1, maxY: wy1 },
      });
    }
  }

  // ─── Phase 3: Emit triangles for split cells ──────────────────────
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = cells[r * cols + c];
      if (!cell.isSplit) continue;

      const wx0 = c * cellSize * scaleBack;
      const wy0 = r * cellSize * scaleBack;
      const wx1 = Math.min((c + 1) * cellSize, width) * scaleBack;
      const wy1 = Math.min((r + 1) * cellSize, height) * scaleBack;
      const halfArea = ((wx1 - wx0) * (wy1 - wy0)) / 2;

      if (halfArea <= 0) continue;

      const tl: Point2D = { x: wx0, y: wy0 };
      const tr: Point2D = { x: wx1, y: wy0 };
      const br: Point2D = { x: wx1, y: wy1 };
      const bl: Point2D = { x: wx0, y: wy1 };

      if (cell.splitDiag === 1) {
        // NW-SE diagonal: TL→BR line divides cell
        // NW triangle (TL corner = right angle): TL, TR, BL
        patches.push({
          id: `patch-${nextPatchId++}`,
          clusterIndex: cell.label,
          polygonPx: [tl, tr, bl],
          centroidPx: { x: (tl.x + tr.x + bl.x) / 3, y: (tl.y + tr.y + bl.y) / 3 },
          areaPx: halfArea,
          bboxPx: { minX: wx0, minY: wy0, maxX: wx1, maxY: wy1 },
        });
        // SE triangle (BR corner = right angle): TR, BR, BL
        patches.push({
          id: `patch-${nextPatchId++}`,
          clusterIndex: cell.label2,
          polygonPx: [tr, br, bl],
          centroidPx: { x: (tr.x + br.x + bl.x) / 3, y: (tr.y + br.y + bl.y) / 3 },
          areaPx: halfArea,
          bboxPx: { minX: wx0, minY: wy0, maxX: wx1, maxY: wy1 },
        });
      } else {
        // NE-SW diagonal: TR→BL line divides cell
        // NE triangle (TR corner = right angle): TL, TR, BR
        patches.push({
          id: `patch-${nextPatchId++}`,
          clusterIndex: cell.label,
          polygonPx: [tl, tr, br],
          centroidPx: { x: (tl.x + tr.x + br.x) / 3, y: (tl.y + tr.y + br.y) / 3 },
          areaPx: halfArea,
          bboxPx: { minX: wx0, minY: wy0, maxX: wx1, maxY: wy1 },
        });
        // SW triangle (BL corner = right angle): TL, BR, BL
        patches.push({
          id: `patch-${nextPatchId++}`,
          clusterIndex: cell.label2,
          polygonPx: [tl, br, bl],
          centroidPx: { x: (tl.x + br.x + bl.x) / 3, y: (tl.y + br.y + bl.y) / 3 },
          areaPx: halfArea,
          bboxPx: { minX: wx0, minY: wy0, maxX: wx1, maxY: wy1 },
        });
      }
    }
  }

  return patches;
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
