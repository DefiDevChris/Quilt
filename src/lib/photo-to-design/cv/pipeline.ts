/**
 * 10-stage CV pipeline for Photo-to-Design.
 *
 * Runs classical OpenCV operations on a perspective-corrected image to
 * identify fabric patches, extract contours, and optionally produce full
 * Patch[] / ShapeTemplate[] / DetectedGrid results.
 *
 * Pipeline stages:
 *   1. Resize (preview ≤1024px, full ≤4096px)
 *   2. CLAHE (lighting normalization)
 *   3. Optional Gaussian blur (heavy prints)
 *   4. Bilateral filter (smooth within patches, preserve edges)
 *   5. K-means clustering (color quantization)
 *   6. Connected components (label map)
 *   7. Merge small components
 *   8. Optional edge enhancement (same-color adjacent patches)
 *   9. Contour extraction
 *  10. Return results (preview or full)
 *
 * Post-processing (full only):
 *   A. Grid detection
 *   B. Grid snapping
 *   C. Coordinate conversion
 *   D. Shape classification
 *   E. Color extraction
 *   F. Neighbor detection
 *   G. Assemble results
 *
 * All mats go through MatRegistry. Every handler uses try/finally with deleteAll().
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type {
  ProcessParams,
  Patch,
  ShapeTemplate,
  DetectedGrid,
  Point,
} from '@/types/photo-to-design';
import type { MatRegistry } from './mat-registry';
import { detectGrid } from './grid-detect';
import { snapToGrid } from './grid-snap';
import { classifyShapes } from './shape-classify';
import { extractColors } from './color-extract';
import { detectNeighbors } from './neighbor-detect';

// Type alias for OpenCV Mat
type Mat = any;

// ── Types ───────────────────────────────────────────────────────────────────

export interface PreviewResult {
  outlines: Float32Array;
  colors: string[];
  patchCount: number;
}

export interface FullResult {
  patches: Patch[];
  templates: ShapeTemplate[];
  grid: DetectedGrid;
  /** Raw label map still owned by the pipeline's MatRegistry. The worker
   * should copy its data (labelMat.data32S) into a persistent Mat before
   * the caller's `deleteAll()` runs — this reference is not transferable. */
  labelMat: any;
  /** Scale factor used in stage 1 (scaledSize / originalSize). */
  scale: number;
  scaledWidth: number;
  scaledHeight: number;
}

export type PipelineResult = PreviewResult | FullResult;

// ── Progress callback ───────────────────────────────────────────────────────

export type ProgressFn = (stage: string, percent: number) => void;

// ── Main entry point ────────────────────────────────────────────────────────

/**
 * Run the full 10-stage CV pipeline.
 *
 * @param cv       — the OpenCV.js runtime
 * @param reg      — MatRegistry for memory management
 * @param srcImage — source ImageData (perspective-corrected)
 * @param params   — process parameters from sliders
 * @param quality  — 'preview' or 'full'
 * @param progress — callback for progress messages
 * @returns PreviewResult or FullResult depending on quality
 */
export function runPipeline(
  cv: any,
  reg: MatRegistry,
  srcImage: ImageData,
  params: ProcessParams,
  quality: 'preview' | 'full',
  progress: ProgressFn
): PipelineResult {
  // Stage 1: Resolution scaling
  progress('resize', 0);
  const { scaledMat, scale, scaledWidth, scaledHeight } = runStage('resize', () =>
    stage1Resize(cv, reg, srcImage, quality)
  );
  progress('resize', 10);

  // Stage 2: CLAHE
  const claheResult = runStage('clahe', () => stage2CLAHE(cv, reg, scaledMat, params));
  progress('clahe', 20);

  // Stage 3: Optional Gaussian blur
  const blurResult = runStage('blur', () => stage3GaussianBlur(cv, reg, claheResult, params));
  progress('blur', 30);

  // Stage 4: Bilateral filter
  const bilateralResult = runStage('bilateral', () => stage4Bilateral(cv, reg, blurResult, params));
  progress('bilateral', 40);

  // Stage 5: K-means clustering — with silent fallback to K=8 if it fails.
  const kmeansResult = runKMeansWithFallback(cv, reg, bilateralResult, params, progress);
  progress('kmeans', 55);

  // Stage 6: Connected components
  const { labelMat, numPatches } = runStage('connected-components', () =>
    stage6ConnectedComponents(cv, reg, kmeansResult, scaledWidth, scaledHeight)
  );
  progress('connected-components', 65);

  if (numPatches <= 1) {
    throw new PipelineError(
      'No patches detected. Try increasing Colors or adjusting Min Patch Size.',
      true
    );
  }

  // Stage 7: Merge small components
  const mergedLabelMat = runStage('merge-small', () =>
    stage7MergeSmall(cv, reg, labelMat, params, numPatches, scaledWidth, scaledHeight)
  );
  progress('merge-small', 75);

  // Stage 8: Optional edge enhancement
  const finalLabelMat = params.edgeEnhance
    ? runStage('edge-enhance', () =>
        stage8EdgeEnhance(cv, reg, mergedLabelMat, scaledMat, params, scaledWidth, scaledHeight)
      )
    : mergedLabelMat;
  progress('edge-enhance', 82);

  // Stage 9: Contour extraction
  const contours = runStage('contours', () =>
    stage9Contours(cv, reg, finalLabelMat, params, scaledWidth, scaledHeight)
  );
  progress('contours', 90);

  if (contours.length === 0) {
    throw new PipelineError('No contours found. Try adjusting Smoothing or Min Patch Size.', true);
  }

  // Stage 10: Return results
  if (quality === 'preview') {
    return stage10Preview(finalLabelMat, contours, kmeansResult.centers, scale, params);
  }

  return stage10Full(
    cv,
    reg,
    finalLabelMat,
    contours,
    kmeansResult,
    scaledMat,
    srcImage,
    params,
    scale,
    progress
  );
}

// ── Stage 1: Resolution scaling ─────────────────────────────────────────────

interface ResizeResult {
  scaledMat: any;
  scale: number;
  scaledWidth: number;
  scaledHeight: number;
}

function stage1Resize(
  cv: any,
  reg: MatRegistry,
  srcImage: ImageData,
  quality: 'preview' | 'full'
): ResizeResult {
  const src = reg.adopt('src', cv.matFromImageData(srcImage)) as any;
  const srcWidth = src.cols as number;
  const srcHeight = src.rows as number;

  const maxDim = quality === 'preview' ? 1024 : 4096;
  const scale = Math.min(1, maxDim / Math.max(srcWidth, srcHeight));

  if (scale >= 1) {
    return { scaledMat: src, scale: 1, scaledWidth: srcWidth, scaledHeight: srcHeight };
  }

  const scaledWidth = Math.round(srcWidth * scale);
  const scaledHeight = Math.round(srcHeight * scale);
  const scaledMat = reg.create('scaled', scaledHeight, scaledWidth, cv.CV_8UC4) as any;

  cv.resize(src, scaledMat, new cv.Size(scaledWidth, scaledHeight), 0, 0, cv.INTER_AREA);

  return { scaledMat, scale, scaledWidth, scaledHeight };
}

// ── Stage 2: CLAHE ──────────────────────────────────────────────────────────

function stage2CLAHE(cv: any, reg: MatRegistry, src: any, params: ProcessParams): any {
  // Some OpenCV.js builds omit RGBA↔Lab direct codes; route through RGB.
  const rgb = reg.create('clahe-rgb') as any;
  cv.cvtColor(src, rgb, cv.COLOR_RGBA2RGB);

  const lab = reg.create('lab') as any;
  cv.cvtColor(rgb, lab, cv.COLOR_RGB2Lab);

  const channels = new cv.MatVector() as any;
  cv.split(lab, channels);

  const lChannel = channels.get(0) as any;
  const clahe = new cv.CLAHE(
    params.claheClipLimit,
    new cv.Size(params.claheGridSize, params.claheGridSize)
  );
  clahe.apply(lChannel, lChannel);

  channels.set(0, lChannel);
  cv.merge(channels, lab);

  const rgbOut = reg.create('clahe-rgb-out') as any;
  cv.cvtColor(lab, rgbOut, cv.COLOR_Lab2RGB);
  const result = reg.create('clahe-bgr') as any;
  cv.cvtColor(rgbOut, result, cv.COLOR_RGB2RGBA);

  clahe.delete();
  lChannel.delete();
  channels.delete();

  return result;
}

// ── Stage 3: Optional Gaussian blur ─────────────────────────────────────────

function stage3GaussianBlur(cv: any, reg: MatRegistry, src: any, params: ProcessParams): any {
  if (params.gaussianBlurSize <= 0) {
    return src;
  }

  const result = reg.create('gaussian-blur') as any;
  cv.GaussianBlur(src, result, new cv.Size(params.gaussianBlurSize, params.gaussianBlurSize), 0, 0);
  return result;
}

// ── Stage 4: Bilateral filter ───────────────────────────────────────────────

function stage4Bilateral(cv: any, reg: MatRegistry, src: any, params: ProcessParams): any {
  // bilateralFilter requires 8UC1 or 8UC3 — strip alpha first.
  const rgb = reg.create('bilateral-rgb') as any;
  cv.cvtColor(src, rgb, cv.COLOR_RGBA2RGB);

  const filtered = reg.create('bilateral-filtered') as any;
  cv.bilateralFilter(
    rgb,
    filtered,
    params.bilateralD,
    params.bilateralSigmaColor,
    params.bilateralSigmaSpace
  );

  const result = reg.create('bilateral') as any;
  cv.cvtColor(filtered, result, cv.COLOR_RGB2RGBA);
  return result;
}

// ── Stage 5: K-means clustering ─────────────────────────────────────────────

interface KMeansResult {
  labels: any; // Int32 labels, shaped h×w
  centers: any; // Float32 centers, K×3 (LAB)
  k: number;
}

function stage5KMeans(
  cv: any,
  reg: MatRegistry,
  src: any,
  params: ProcessParams,
  progress: ProgressFn
): KMeansResult {
  const height = src.rows;
  const width = src.cols;

  // Convert BGR (RGBA) to LAB via RGB intermediate.
  const rgb = reg.create('kmeans-rgb') as any;
  cv.cvtColor(src, rgb, cv.COLOR_RGBA2RGB);
  const lab = reg.create('kmeans-lab') as any;
  cv.cvtColor(rgb, lab, cv.COLOR_RGB2Lab);

  // Build (h*w rows × 3 cols × 1 channel) Float32 directly — OpenCV.js
  // bindings in this build don't expose Mat.reshape reliably.
  const n = height * width;
  const samplesMat = reg.create('samples-mat', n, 3, cv.CV_32F) as any;
  const labData = lab.data as Uint8Array;
  const target = samplesMat.data32F as Float32Array;
  for (let i = 0; i < n; i++) {
    target[i * 3] = labData[i * 3];
    target[i * 3 + 1] = labData[i * 3 + 1];
    target[i * 3 + 2] = labData[i * 3 + 2];
  }

  // Determine K
  let k = params.kColors;
  if (k === 0) {
    k = autoDetectK(cv, reg, samplesMat, width, height);
  }
  k = Math.max(2, Math.min(30, k));

  // K-means criteria — tuned for WASM throughput on mid-range hardware.
  const criteria = new cv.TermCriteria(cv.TermCriteria_EPS + cv.TermCriteria_MAX_ITER, 30, 1.0);
  const attempts = 1;
  const flags = cv.KMEANS_RANDOM_CENTERS;

  const labels = reg.create('labels') as any;
  const centers = reg.create('centers') as any;

  cv.kmeans(samplesMat, k, labels, criteria, attempts, flags, centers);

  // cv.TermCriteria in OpenCV.js is a plain JS struct, not a wrapped C++
  // object — no delete() needed.

  return { labels, centers, k };
}

/**
 * Elbow method for auto-detecting K.
 * Subsample ~50,000 pixels, run k-means for K = 3..20, find the elbow.
 */
function autoDetectK(
  cv: any,
  reg: MatRegistry,
  samples: any,
  width: number,
  height: number
): number {
  const totalPixels = width * height;
  // Tight subsample: elbow doesn't need more than ~8k points, and WASM
  // k-means is slow. 50k × 8 k-values × 3 attempts burns tens of seconds.
  const maxSample = Math.min(8000, totalPixels);
  const step = Math.max(1, Math.floor(totalPixels / maxSample));

  // Build subsample matrix
  const subsampleData: number[] = [];
  for (let i = 0; i < totalPixels; i += step) {
    subsampleData.push(
      samples.data32F[i * 3],
      samples.data32F[i * 3 + 1],
      samples.data32F[i * 3 + 2]
    );
  }

  const nSamples = subsampleData.length / 3;
  const subsampleMat = new cv.Mat(nSamples, 3, cv.CV_32F);
  subsampleMat.data32F.set(new Float32Array(subsampleData));

  const criteria = new cv.TermCriteria(cv.TermCriteria_EPS + cv.TermCriteria_MAX_ITER, 20, 1.0);
  const attempts = 1;
  const flags = cv.KMEANS_RANDOM_CENTERS;

  const variances: number[] = [];
  const kRange = [3, 5, 8, 12, 18];

  for (const k of kRange) {
    const labels = new cv.Mat();
    const centers = new cv.Mat();
    cv.kmeans(subsampleMat, k, labels, criteria, attempts, flags, centers);

    // Compute variance (within-cluster sum of squares)
    let variance = 0;
    for (let i = 0; i < nSamples; i++) {
      const clusterId = labels.intAt(i, 0);
      const dx = subsampleMat.data32F[i * 3] - centers.data32F[clusterId * 3];
      const dy = subsampleMat.data32F[i * 3 + 1] - centers.data32F[clusterId * 3 + 1];
      const dz = subsampleMat.data32F[i * 3 + 2] - centers.data32F[clusterId * 3 + 2];
      variance += dx * dx + dy * dy + dz * dz;
    }
    variances.push(variance);

    labels.delete();
    centers.delete();
  }

  subsampleMat.delete();

  // Find the elbow — where the second derivative is maximized
  // (the point of maximum curvature)
  if (variances.length < 3) return 6;

  const diffs: number[] = [];
  for (let i = 1; i < variances.length; i++) {
    diffs.push(variances[i - 1] - variances[i]);
  }

  // Find where the drop decelerates most (second derivative)
  let maxDecel = -Infinity;
  let bestIdx = 2;
  for (let i = 1; i < diffs.length; i++) {
    const decel = diffs[i - 1] - diffs[i];
    if (decel > maxDecel) {
      maxDecel = decel;
      bestIdx = i;
    }
  }

  return kRange[Math.min(bestIdx + 1, kRange.length - 1)];
}

// ── Stage 6: Connected components ───────────────────────────────────────────

interface CCResult {
  labelMat: any;
  numPatches: number;
}

function stage6ConnectedComponents(
  cv: any,
  reg: MatRegistry,
  kmeansResult: KMeansResult,
  width: number,
  height: number
): CCResult {
  const { labels, centers, k } = kmeansResult;

  // labelMat stores the global patch ID for each pixel
  // Start IDs from 1 (0 = background in connectedComponents)
  const labelMat = reg.create('label-map', height, width, cv.CV_32S) as any;
  (labelMat.data32S as Int32Array).fill(0);

  let globalId = 1;

  // For each cluster, extract binary mask and run connectedComponents
  for (let c = 0; c < k; c++) {
    // Create binary mask for cluster c
    const mask = reg.create(`mask-${c}`, height, width, cv.CV_8U) as any;

    for (let i = 0; i < height * width; i++) {
      const clusterId = labels.intAt(i, 0);
      mask.data[i] = clusterId === c ? 255 : 0;
    }

    // Run connected components on this mask
    const ccLabels = reg.create(`cc-labels-${c}`) as any;
    const numLabels = cv.connectedComponents(mask, ccLabels, 8, cv.CV_32S);

    // ccLabels(0,0) = background, (1..numLabels-1) = actual components
    for (let label = 1; label < numLabels; label++) {
      // Write global ID into labelMat where ccLabels === label
      for (let i = 0; i < height * width; i++) {
        if (ccLabels.data32S[i] === label) {
          labelMat.data32S[i] = globalId;
        }
      }
      globalId++;
    }

    mask.delete();
    ccLabels.delete();
  }

  return { labelMat, numPatches: globalId - 1 };
}

// ── Stage 7: Merge small components ─────────────────────────────────────────

function stage7MergeSmall(
  cv: any,
  reg: MatRegistry,
  labelMat: any,
  params: ProcessParams,
  numPatches: number,
  width: number,
  height: number
): any {
  const minArea = params.minPatchArea;
  let currentNumPatches = numPatches;
  let maxIterations = 10;

  while (maxIterations-- > 0) {
    // Count pixel area per patch ID
    const areaMap = new Map<number, number>();
    const colorSumMap = new Map<number, number[]>();

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const id = labelMat.data32S[idx];
        if (id === 0) continue; // background

        areaMap.set(id, (areaMap.get(id) || 0) + 1);
        if (!colorSumMap.has(id)) {
          colorSumMap.set(id, [0, 0, 0]);
        }
      }
    }

    // Find small patches
    const smallIds: number[] = [];
    for (const [id, area] of areaMap) {
      if (area < minArea) {
        smallIds.push(id);
      }
    }

    if (smallIds.length === 0) break;

    // Merge each small patch into closest-color neighbor
    for (const smallId of smallIds) {
      const neighbors = findNeighborIds(labelMat, smallId, width, height);
      if (neighbors.length === 0) continue;

      // Pick the neighbor with the most shared boundary (simple heuristic)
      const boundaryCount = new Map<number, number>();
      for (const nId of neighbors) {
        boundaryCount.set(nId, (boundaryCount.get(nId) || 0) + 1);
      }

      let bestNeighbor = neighbors[0];
      let bestCount = 0;
      for (const [nId, count] of boundaryCount) {
        if (count > bestCount) {
          bestCount = count;
          bestNeighbor = nId;
        }
      }

      // Relabel small patch to best neighbor
      for (let i = 0; i < height * width; i++) {
        if (labelMat.data32S[i] === smallId) {
          labelMat.data32S[i] = bestNeighbor;
        }
      }

      currentNumPatches--;
    }

    if (currentNumPatches <= 1) break;
  }

  return labelMat;
}

/**
 * Find unique neighbor IDs around a given patch ID in the label map.
 */
function findNeighborIds(labelMat: any, targetId: number, width: number, height: number): number[] {
  const neighborSet = new Set<number>();
  const offsets = [-1, 1, -width, width]; // left, right, up, down

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (labelMat.data32S[idx] !== targetId) continue;

      for (const offset of offsets) {
        const ni = idx + offset;
        const nx = x + (offset === 1 ? 1 : offset === -1 ? -1 : 0);
        const ny = y + (offset === width ? 1 : offset === -width ? -1 : 0);
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const nId = labelMat.data32S[ni];
          if (nId !== targetId && nId !== 0) {
            neighborSet.add(nId);
          }
        }
      }
    }
  }

  return Array.from(neighborSet);
}

// ── Stage 8: Edge enhancement ───────────────────────────────────────────────

function stage8EdgeEnhance(
  cv: any,
  reg: MatRegistry,
  labelMat: any,
  originalSrc: any,
  params: ProcessParams,
  width: number,
  height: number
): any {
  // Run Canny on the original (unfiltered) image
  const gray = reg.create('ee-gray') as any;
  cv.cvtColor(originalSrc, gray, cv.COLOR_RGBA2GRAY);

  const blurred = reg.create('ee-blurred') as any;
  cv.GaussianBlur(gray, blurred, new cv.Size(3, 3), 0, 0);

  const edges = reg.create('ee-edges') as any;
  cv.Canny(blurred, edges, params.cannyLow, params.cannyHigh);

  // Morphological close to join fragmented edges
  const kernel = reg.create('ee-kernel', 3, 3, cv.CV_8U) as any;
  cv.morphologyEx(edges, edges, cv.MORPH_CLOSE, kernel);

  // Find "suspiciously large" patches (area > 4× median)
  const areaMap = new Map<number, number>();
  for (let i = 0; i < height * width; i++) {
    const id = labelMat.data32S[i];
    if (id === 0) continue;
    areaMap.set(id, (areaMap.get(id) || 0) + 1);
  }

  const areas = Array.from(areaMap.values()).sort((a, b) => a - b);
  if (areas.length === 0) return labelMat;

  const medianArea = areas[Math.floor(areas.length / 2)];
  const threshold = medianArea * 4;

  let newId = Math.max(...areaMap.keys()) + 1;

  for (const [id, area] of areaMap) {
    if (area <= threshold) continue;

    // Extract edges inside this patch's region
    const patchMask = reg.create(`ee-mask-${id}`, height, width, cv.CV_8U) as any;
    patchMask.data.fill(0);
    for (let i = 0; i < height * width; i++) {
      if (labelMat.data32S[i] === id) {
        patchMask.data[i] = 255;
      }
    }

    const patchEdges = reg.create(`ee-edges-${id}`, height, width, cv.CV_8U) as any;
    cv.bitwise_and(edges, patchMask, patchEdges);

    // Count connected components in the edge-masked region
    const subLabels = reg.create(`ee-sub-${id}`) as any;
    const numComponents = cv.connectedComponents(patchEdges, subLabels, 8, cv.CV_32S);

    // If it splits into ≥ 2 meaningful regions, accept the split
    if (numComponents >= 3) {
      // Check that each component has reasonable size
      const compAreas = new Map<number, number>();
      for (let i = 0; i < height * width; i++) {
        const cid = subLabels.data32S[i];
        if (cid === 0) continue;
        compAreas.set(cid, (compAreas.get(cid) || 0) + 1);
      }

      const validSplits = Array.from(compAreas.values()).filter((a) => a > minComponentArea(area));
      if (validSplits.length >= 2) {
        // Assign new IDs to each component
        let componentOffset = 1;
        for (const [cid] of compAreas) {
          if (componentOffset === 1) {
            // First component keeps the original ID
            componentOffset++;
            continue;
          }
          const newPatchId = newId++;
          for (let i = 0; i < height * width; i++) {
            if (subLabels.data32S[i] === cid && patchMask.data[i] > 0) {
              labelMat.data32S[i] = newPatchId;
            }
          }
          componentOffset++;
        }
      }
    }

    patchMask.delete();
    patchEdges.delete();
    subLabels.delete();
  }

  gray.delete();
  blurred.delete();
  edges.delete();
  kernel.delete();

  return labelMat;
}

function minComponentArea(totalArea: number): number {
  return Math.max(50, totalArea * 0.05);
}

// ── Stage 9: Contour extraction ─────────────────────────────────────────────

interface ContourData {
  patchId: number;
  points: Point[];
  pixelPoints: Point[];
  centroid: Point;
  area: number;
}

function stage9Contours(
  cv: any,
  reg: MatRegistry,
  labelMat: any,
  params: ProcessParams,
  width: number,
  height: number
): ContourData[] {
  // Collect unique patch IDs
  const idSet = new Set<number>();
  for (let i = 0; i < height * width; i++) {
    const id = labelMat.data32S[i];
    if (id !== 0) idSet.add(id);
  }

  const contours: ContourData[] = [];

  for (const patchId of idSet) {
    // Create binary mask for this patch
    const mask = reg.create(`contour-mask-${patchId}`, height, width, cv.CV_8U) as any;
    mask.data.fill(0);
    for (let i = 0; i < height * width; i++) {
      if (labelMat.data32S[i] === patchId) {
        mask.data[i] = 255;
      }
    }

    // Find external contours only
    const contoursVec = new cv.MatVector() as any;
    const hierarchy = new cv.Mat() as any;
    cv.findContours(mask, contoursVec, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    // Pick the largest contour
    let largestIdx = -1;
    let largestLen = 0;
    for (let i = 0; i < (contoursVec as any).size(); i++) {
      const contourMat = (contoursVec as any).get(i) as any;
      const len = cv.arcLength(contourMat, true);
      if (len > largestLen) {
        largestLen = len;
        largestIdx = i;
      }
      contourMat.delete();
    }

    if (largestIdx < 0) {
      mask.delete();
      contoursVec.delete();
      hierarchy.delete();
      continue;
    }

    // Approximate polygon
    const contourMat = (contoursVec as any).get(largestIdx) as any;
    const epsilon = 0.02 * cv.arcLength(contourMat, true);
    const approx = reg.create(`approx-${patchId}`) as any;
    cv.approxPolyDP(contourMat, approx, epsilon, true);

    // Convert to Point[]
    const points: Point[] = [];
    const pixelPoints: Point[] = [];
    let sumX = 0;
    let sumY = 0;

    for (let i = 0; i < approx.rows; i++) {
      const x = approx.intAt(i, 0);
      const y = approx.intAt(i, 1);
      points.push({ x, y });
      pixelPoints.push({ x, y });
      sumX += x;
      sumY += y;
    }

    const centroid: Point = {
      x: sumX / points.length,
      y: sumY / points.length,
    };

    contours.push({
      patchId,
      points,
      pixelPoints,
      centroid,
      area: cv.contourArea(contourMat),
    });

    approx.delete();
    mask.delete();
    contoursVec.delete();
    hierarchy.delete();
  }

  return contours;
}

// ── Stage 10: Return results ────────────────────────────────────────────────

function stage10Preview(
  labelMat: any,
  contours: ContourData[],
  centers: any,
  scale: number,
  params: ProcessParams
): PreviewResult {
  // Pack contours into Float32Array: [x0, y0, x1, y1, ..., NaN, NaN] per patch
  const outlineParts: Float32Array[] = [];

  for (const c of contours) {
    const part = new Float32Array(c.points.length * 2 + 2);
    for (let i = 0; i < c.points.length; i++) {
      part[i * 2] = c.points[i].x;
      part[i * 2 + 1] = c.points[i].y;
    }
    part[part.length - 2] = NaN;
    part[part.length - 1] = NaN;
    outlineParts.push(part);
  }

  const totalLen = outlineParts.reduce((sum, p) => sum + p.length, 0);
  const outlines = new Float32Array(totalLen);
  let offset = 0;
  for (const part of outlineParts) {
    outlines.set(part, offset);
    offset += part.length;
  }

  // One hex color per patch (from k-means centers)
  const colors = contours.map((c) => {
    // Map patch ID to a center index — use modulo as fallback
    const idx = (c.patchId - 1) % centers.rows;
    const l = centers.data32F[idx * 3];
    const a = centers.data32F[idx * 3 + 1];
    const b = centers.data32F[idx * 3 + 2];
    return labToHex(l, a, b);
  });

  return { outlines, colors, patchCount: contours.length };
}

function stage10Full(
  cv: any,
  reg: MatRegistry,
  labelMat: any,
  contours: ContourData[],
  kmeansResult: KMeansResult,
  processedSrc: any,
  originalSrc: ImageData,
  params: ProcessParams,
  scale: number,
  progress: ProgressFn
): FullResult {
  const width = labelMat.cols;
  const height = labelMat.rows;

  // Post-A: Grid detection
  progress('grid-detect', 92);
  const grid = detectGrid(cv, reg, labelMat, width, height);

  // Post-B: Grid snapping
  progress('grid-snap', 94);
  const snappedContours = snapToGrid(contours, grid, params);

  // Post-C: Coordinate conversion
  const convertedContours = convertCoordinates(snappedContours, params.pixelsPerUnit, scale);

  // Post-E: Color extraction (from original corrected image)
  progress('color-extract', 96);
  const colorData = extractColors(cv, reg, originalSrc, convertedContours);

  // Post-D: Shape classification
  progress('shape-classify', 97);
  const { templates, patchesWithTemplates } = classifyShapes(convertedContours, colorData);

  // Post-F: Neighbor detection
  progress('neighbor-detect', 98);
  const neighborMap = detectNeighbors(labelMat, width, height);

  // Post-G: Assemble
  const patches: Patch[] = patchesWithTemplates.map((pc, i) => {
    const contour = convertedContours[i];
    return {
      id: contour.patchId,
      templateId: pc.templateId,
      polygon: contour.points,
      pixelPolygon: contour.pixelPoints,
      svgPath: pointsToSvgPath(contour.points),
      centroid: contour.centroid,
      area: contour.area,
      vertexCount: contour.points.length,
      dominantColor: pc.dominantColor,
      colorPalette: pc.colorPalette,
      fabricSwatch: pc.fabricSwatch,
      neighbors: neighborMap.get(contour.patchId) || [],
    };
  });

  return {
    patches,
    templates,
    grid,
    labelMat,
    scale,
    scaledWidth: width,
    scaledHeight: height,
  };
}

// ── Coordinate conversion (Post-C) ──────────────────────────────────────────

function convertCoordinates(
  contours: ContourData[],
  pixelsPerUnit: number,
  scale: number
): ContourData[] {
  return contours.map((c) => {
    const points = c.points.map((p) => ({
      x: Math.round((p.x / pixelsPerUnit) * 100) / 100,
      y: Math.round((p.y / pixelsPerUnit) * 100) / 100,
    }));

    const pixelPoints = c.pixelPoints.map((p) => ({
      x: Math.round(p.x / scale),
      y: Math.round(p.y / scale),
    }));

    const centroid = {
      x: Math.round((c.centroid.x / pixelsPerUnit) * 100) / 100,
      y: Math.round((c.centroid.y / pixelsPerUnit) * 100) / 100,
    };

    return { ...c, points, pixelPoints, centroid };
  });
}

// ── Utility: LAB to hex ─────────────────────────────────────────────────────

/**
 * Convert OpenCV LAB values (L: 0-100, a: 0-255 shifted, b: 0-255 shifted)
 * to a hex color string.
 *
 * OpenCV's LAB uses: L ∈ [0,100], a ∈ [0,255] (biased at 128), b ∈ [0,255] (biased at 128).
 */
function labToHex(l: number, a: number, b: number): string {
  // Convert OpenCV LAB to standard LAB
  const L = l;
  const aStd = a - 128;
  const bStd = b - 128;

  // LAB → XYZ (D65)
  const fy = (L + 16) / 116;
  const fx = aStd / 500 + fy;
  const fz = fy - bStd / 200;

  const delta = 6 / 29;
  const delta2 = delta * delta;
  const delta3 = delta2 * delta;

  const xr = fx > delta ? fx * fx * fx : (fx - 16 / 116) / 7.787;
  const yr = fy > delta ? fy * fy * fy : (fy - 16 / 116) / 7.787;
  const zr = fz > delta ? fz * fz * fz : (fz - 16 / 116) / 7.787;

  // D65 reference white
  const x = xr * 95.047;
  const y = yr * 100.0;
  const z = zr * 108.883;

  // XYZ → linear RGB
  const rLin = x * 0.032406 + y * -0.015372 + z * -0.004986;
  const gLin = x * -0.009689 + y * 0.018758 + z * 0.000415;
  const bLin = x * 0.000557 + y * -0.00204 + z * 0.01057;

  // Linear RGB → sRGB with gamma
  const toSRgb = (c: number) => {
    const clamped = Math.max(0, Math.min(1, c));
    return clamped > 0.0031308 ? 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055 : 12.92 * clamped;
  };

  const r = Math.round(toSRgb(rLin) * 255);
  const g = Math.round(toSRgb(gLin) * 255);
  const bVal = Math.round(toSRgb(bLin) * 255);

  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(clamp8(r))}${toHex(clamp8(g))}${toHex(clamp8(bVal))}`;
}

function clamp8(n: number): number {
  return Math.max(0, Math.min(255, n));
}

// ── Utility: Points to SVG path ─────────────────────────────────────────────

function pointsToSvgPath(points: Point[]): string {
  if (points.length === 0) return '';
  const cmds = points.map((p) => `L ${p.x},${p.y}`);
  cmds[0] = `M ${points[0].x},${points[0].y}`;
  cmds.push('Z');
  return cmds.join(' ');
}

// ── Pipeline Error ──────────────────────────────────────────────────────────

export class PipelineError extends Error {
  constructor(
    message: string,
    public recoverable: boolean
  ) {
    super(message);
    this.name = 'PipelineError';
  }
}

/** Wrap a pipeline stage so any throw carries the stage name in its message. */
function runStage<T>(stage: string, fn: () => T): T {
  try {
    return fn();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (err instanceof PipelineError) throw err;
    throw new PipelineError(`Stage ${stage} failed: ${msg}`, true);
  }
}

/**
 * Stage 5 with silent fallback to K=8 when k-means fails to converge or
 * throws. Spec error-handling row: "K-means doesn't converge — try adjusting
 * Colors" is surfaced only if the fallback also fails.
 */
function runKMeansWithFallback(
  cv: any,
  reg: MatRegistry,
  bilateralResult: Mat,
  params: ProcessParams,
  progress: ProgressFn
): KMeansResult {
  try {
    return stage5KMeans(cv, reg, bilateralResult, params, progress);
  } catch {
    // Drop any partial mats from the failed attempt, then retry with K=8.
    ['kmeans-rgb', 'kmeans-lab', 'samples-mat', 'labels', 'centers'].forEach((n) => reg.delete(n));
    try {
      return stage5KMeans(cv, reg, bilateralResult, { ...params, kColors: 8 }, progress);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new PipelineError(`Color detection struggled — try adjusting Colors. (${msg})`, true);
    }
  }
}
