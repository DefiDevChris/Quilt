# Seam Engine Implementation Spec — Image Vectorization Pipeline

> **SUPERSEDED 2026-04-14** — the classical CV pipeline (color+texture+edge SLIC clustering) described here was replaced by the SAM-based pipeline in [`seam-engine-sam-rfc.md`](./seam-engine-sam-rfc.md). Kept for historical context only; do NOT implement against this spec.

## Overview

Replace the placeholder `src/lib/photo-to-design/seam-engine.ts` with a color+texture+edge vectorization pipeline that:
- Runs 100% client-side (Web Worker + OpenCV.js WASM)
- Mathematically guarantees every pixel is in exactly one polygon (no missed patches)
- Is deterministic (same input → same output)
- Produces clean polygons matching the existing `Patch` and `EngineOutput` types

## Existing assets (do NOT rebuild)

- `opencvjs` v1.0.1 — installed
- `simplify-js` v1.2.4 — installed
- `clipper-lib` v6.4.2 — installed
- `src/lib/photo-to-design/worker.ts` — existing Web Worker runner
- `src/lib/photo-to-design/types.ts` — type definitions (`EngineInput`, `EngineOutput`, `Patch`, `GridSpec`, `StageName`)
- `src/lib/photo-to-design/perspective.ts` — already applied before engine runs
- `scripts/extract-opencv-wasm.mjs` — extracts OpenCV WASM runtime

## Type contract (unchanged)

```typescript
interface EngineInput {
  pixels: Uint8ClampedArray;   // RGBA
  width: number;
  height: number;
  gridSpec: GridSpec;          // { cellSize, offsetX, offsetY, cols, rows }
  rngSeed: number;
  abortSignal?: AbortSignal;
  onProgress?: (stage: number, stageName: StageName, percentage: number) => void;
}

interface EngineOutput {
  patches: Patch[];            // [{ id, vertices: Point[], svgPath: string }]
  gridSpec: GridSpec;
  processingTime: number;
}
```

## Pipeline stages

The existing `StageName` enum has 5 stages. Map to this pipeline:

| Stage # | StageName           | What happens                                     |
| ------- | ------------------- | ------------------------------------------------ |
| 0       | `edgeDetection`     | Preprocess + SLIC + edge detection               |
| 1       | `seamTracing`       | Feature extraction + clustering                  |
| 2       | `graphConstruction` | Connected components + boundary extraction       |
| 3       | `regularization`    | Polygon simplification + grid snap + angle snap  |
| 4       | `svgGeneration`     | SVG path strings                                 |

## Stage 0: Edge detection & superpixels

**Goal:** Produce two inputs for the clustering step: (1) SLIC superpixel map, (2) hard edge mask from seams.

### 0.1 Load OpenCV.js in worker

```typescript
// worker.ts — top of file
declare const self: DedicatedWorkerGlobalScope;

let cv: any = null;
async function ensureCvLoaded() {
  if (cv) return cv;
  // OpenCV.js is loaded via importScripts from public/opencv/ directory
  importScripts('/opencv/opencv.js');
  // opencv.js is async — wait for it
  cv = await new Promise((resolve) => {
    (globalThis as any).Module = { onRuntimeInitialized: () => resolve((globalThis as any).cv) };
  });
  return cv;
}
```

### 0.2 Normalize lighting (bilateral filter)

Preserves seams while smoothing lighting gradients.

```typescript
function normalizeLighting(rgba: Mat): Mat {
  const rgb = new cv.Mat();
  cv.cvtColor(rgba, rgb, cv.COLOR_RGBA2RGB);
  const filtered = new cv.Mat();
  // d=9, sigmaColor=75, sigmaSpace=75 — preserves edges, smooths gradients
  cv.bilateralFilter(rgb, filtered, 9, 75, 75);
  rgb.delete();
  return filtered;
}
```

### 0.3 Convert to LAB color space

LAB is perceptually uniform — Euclidean distance in LAB ≈ human perceived color difference.

```typescript
function toLab(rgb: Mat): Mat {
  const lab = new cv.Mat();
  cv.cvtColor(rgb, lab, cv.COLOR_RGB2Lab);
  return lab;
}
```

### 0.4 Edge detection (multi-scale Canny)

Run Canny at two scales and combine — catches both sharp and subtle seams.

```typescript
function detectEdges(lab: Mat): Mat {
  const gray = new cv.Mat();
  const l = new cv.MatVector();
  cv.split(lab, l);
  l.get(0).copyTo(gray);  // L channel only — ignores chroma noise
  l.delete();

  const edges1 = new cv.Mat();
  const edges2 = new cv.Mat();
  const combined = new cv.Mat();

  // Tight edges (sharp seams)
  cv.Canny(gray, edges1, 80, 180);
  // Loose edges (subtle seams)
  cv.Canny(gray, edges2, 30, 80);

  cv.bitwise_or(edges1, edges2, combined);

  // Morphological close — bridge tiny gaps in seam lines
  const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(3, 3));
  cv.morphologyEx(combined, combined, cv.MORPH_CLOSE, kernel);

  // Filter by connected length — discard short edges (texture noise)
  const filtered = filterShortEdges(combined, minLength: Math.round(gridSpec.cellSize * 0.5));

  edges1.delete(); edges2.delete(); gray.delete(); kernel.delete();
  return filtered;
}

// Helper: keep only edge components whose pixel count > minLength
function filterShortEdges(edges: Mat, minLength: number): Mat {
  const labels = new cv.Mat();
  const stats = new cv.Mat();
  const centroids = new cv.Mat();
  const nLabels = cv.connectedComponentsWithStats(edges, labels, stats, centroids, 8);

  const out = cv.Mat.zeros(edges.rows, edges.cols, cv.CV_8UC1);
  for (let i = 1; i < nLabels; i++) {
    const area = stats.intAt(i, cv.CC_STAT_AREA);
    if (area >= minLength) {
      // Copy this component to output
      for (let y = 0; y < labels.rows; y++) {
        for (let x = 0; x < labels.cols; x++) {
          if (labels.intAt(y, x) === i) out.ucharPtr(y, x)[0] = 255;
        }
      }
    }
  }
  labels.delete(); stats.delete(); centroids.delete();
  return out;
}
```

### 0.5 SLIC superpixels

Over-segments image into ~2000-5000 visually-coherent superpixels. Dramatically reduces subsequent clustering work.

```typescript
function computeSuperpixels(lab: Mat, cellSize: number): Mat {
  // Region size = ~30% of a grid cell (fine-grained enough to respect seams)
  const regionSize = Math.max(10, Math.round(cellSize * 0.3));
  const ruler = 20.0;  // smoothness factor

  const slic = new cv.ximgproc_SuperpixelSLIC(lab, cv.SLIC, regionSize, ruler);
  slic.iterate(10);  // 10 iterations is sufficient

  const labels = new cv.Mat();
  slic.getLabels(labels);
  slic.delete();
  return labels;  // CV_32S, one int label per pixel
}
```

**Progress callback:** `onProgress(0, 'edgeDetection', 0..50%)` during preprocessing, `50..100%` during SLIC.

## Stage 1: Clustering

**Goal:** Group superpixels into K clusters where K ≈ number of distinct fabrics.

### 1.1 Per-superpixel feature extraction

For each superpixel, compute a feature vector:
- **Color (3 dims):** mean L, a, b
- **Texture (8 dims):** Gabor filter bank responses at 4 orientations × 2 scales
- **Optional (16 dims):** LBP (Local Binary Pattern) histogram — catches fabric print differences

```typescript
interface SuperpixelFeature {
  id: number;
  pixelCount: number;
  centroid: Point;
  meanLab: [number, number, number];
  gaborResponse: number[];  // length 8
  lbpHistogram: number[];   // length 16 (optional)
  neighbors: Set<number>;   // adjacent superpixel IDs
  sharedEdgeLength: Map<number, number>;  // how many pixels of border shared
  hasEdgeBoundary: Map<number, boolean>;   // does shared border cross a detected seam?
}

function extractFeatures(lab: Mat, labels: Mat, edges: Mat): SuperpixelFeature[] {
  // Scan all pixels, accumulate per-label statistics
  // For Gabor: convolve image with 8 Gabor kernels, compute mean per superpixel
  // For adjacency: when scanning pixel at (y,x) check label(y,x) vs label(y+1,x) and label(y,x+1)
  //                if different, increment sharedEdgeLength
  //                if edges(y,x) > 0 at that boundary, set hasEdgeBoundary=true
  // ...
}
```

Use Gabor kernel bank generated via `cv.getGaborKernel()` at orientations [0, π/4, π/2, 3π/4] and σ = [2, 4].

### 1.2 Agglomerative clustering with edge constraint

Merge adjacent superpixels greedily, but **refuse to merge across hard edges**.

```typescript
function clusterSuperpixels(
  features: SuperpixelFeature[],
  similarityThreshold: number  // user-adjustable "detail" slider, 0.0 - 1.0
): Map<number, number> {  // superpixelId -> clusterId
  // Union-Find data structure
  const parent = new Map<number, number>();
  features.forEach(f => parent.set(f.id, f.id));

  function find(id: number): number {
    if (parent.get(id) !== id) parent.set(id, find(parent.get(id)!));
    return parent.get(id)!;
  }

  // Build priority queue of mergeable pairs, sorted by similarity
  const edges: Array<{ a: number; b: number; dist: number }> = [];
  for (const f of features) {
    for (const n of f.neighbors) {
      if (n <= f.id) continue;  // avoid duplicates
      // REFUSE merge across detected seam edges
      if (f.hasEdgeBoundary.get(n)) continue;
      const dist = featureDistance(f, features[n]);
      edges.push({ a: f.id, b: n, dist });
    }
  }
  edges.sort((x, y) => x.dist - y.dist);

  // Greedy merge while dist < threshold
  const threshold = mapSliderToThreshold(similarityThreshold);  // see below
  for (const e of edges) {
    if (e.dist > threshold) break;
    const ra = find(e.a);
    const rb = find(e.b);
    if (ra !== rb) parent.set(ra, rb);
  }

  // Build final mapping
  const clusterMap = new Map<number, number>();
  features.forEach(f => clusterMap.set(f.id, find(f.id)));
  return clusterMap;
}

function featureDistance(a: SuperpixelFeature, b: SuperpixelFeature): number {
  // Weighted distance: color matters most, texture as tiebreaker
  const colorDist = euclid(a.meanLab, b.meanLab);         // typical: 0-100
  const gaborDist = euclid(a.gaborResponse, b.gaborResponse); // normalize to 0-100
  const lbpDist = chiSquare(a.lbpHistogram, b.lbpHistogram);
  return 0.6 * colorDist + 0.25 * gaborDist + 0.15 * lbpDist;
}

// Map 0-1 slider to usable threshold range
function mapSliderToThreshold(slider: number): number {
  // slider=0 → threshold=5   (almost no merging — over-detailed)
  // slider=0.5 → threshold=15 (balanced)
  // slider=1 → threshold=40  (aggressive merging — minimal regions)
  return 5 + slider * 35;
}
```

**Default slider value:** 0.5. Expose in UI via a "Detail" slider on the Review step. Re-running clustering is fast (~100ms) so it feels instant.

### 1.3 Cluster refinement

After initial clustering, clean up:
- **Merge tiny clusters** (fewer than X pixels) into their nearest-color neighbor
- **Split clusters** that span non-contiguous regions (rare but happens if SLIC misbehaves)

```typescript
function refineClusters(
  clusterMap: Map<number, number>,
  features: SuperpixelFeature[],
  labels: Mat,
  gridCellPixels: number
): Map<number, number> {
  const minClusterPixels = gridCellPixels * 0.1;  // at least 10% of a grid cell
  // Count pixels per cluster
  const clusterSize = new Map<number, number>();
  features.forEach(f => {
    const c = clusterMap.get(f.id)!;
    clusterSize.set(c, (clusterSize.get(c) ?? 0) + f.pixelCount);
  });

  // For each tiny cluster, find nearest-color larger-cluster neighbor, merge
  // ...
  return refinedMap;
}
```

**Progress callback:** `onProgress(1, 'seamTracing', 0..100)` during feature extraction + clustering.

## Stage 2: Connected components → boundary polygons

**Goal:** For each cluster, find its connected regions in the image, then extract boundary polygons.

### 2.1 Build cluster mask

```typescript
function buildClusterImage(labels: Mat, clusterMap: Map<number, number>): Mat {
  // Render a new Mat where each pixel = cluster ID (not superpixel ID)
  const clusterImg = new cv.Mat(labels.rows, labels.cols, cv.CV_32S);
  for (let y = 0; y < labels.rows; y++) {
    for (let x = 0; x < labels.cols; x++) {
      const spId = labels.intAt(y, x);
      clusterImg.intPtr(y, x)[0] = clusterMap.get(spId) ?? 0;
    }
  }
  return clusterImg;
}
```

### 2.2 Extract contours per cluster

```typescript
function extractContours(clusterImg: Mat, clusterIds: number[]): RawPatch[] {
  const patches: RawPatch[] = [];

  for (const clusterId of clusterIds) {
    // Binary mask: this cluster vs. not
    const mask = new cv.Mat();
    cv.compare(clusterImg, new cv.Mat(1, 1, cv.CV_32S, [clusterId]), mask, cv.CMP_EQ);

    // Find contours — each contour = one connected component = one physical patch
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    cv.findContours(mask, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_NONE);

    for (let i = 0; i < contours.size(); i++) {
      const contour = contours.get(i);
      const vertices = matToPointArray(contour);

      // Skip tiny noise
      if (cv.contourArea(contour) < 50) continue;

      patches.push({
        clusterId,
        rawVertices: vertices,
      });
    }

    mask.delete(); contours.delete(); hierarchy.delete();
  }

  return patches;
}

function matToPointArray(contour: Mat): Point[] {
  const n = contour.rows;
  const out: Point[] = new Array(n);
  for (let i = 0; i < n; i++) {
    out[i] = { x: contour.intAt(i, 0), y: contour.intAt(i, 1) };
  }
  return out;
}
```

### 2.3 Coverage check (critical!)

**Guarantee every pixel is in a patch.** Sum patch areas, compare to image area. If mismatch > 0.5%, something went wrong — probably a contour extraction bug. Log and fail loudly.

```typescript
function verifyCoverage(patches: RawPatch[], imgW: number, imgH: number): void {
  const totalPatchArea = patches.reduce((sum, p) => sum + polygonArea(p.rawVertices), 0);
  const imageArea = imgW * imgH;
  const coverage = totalPatchArea / imageArea;
  if (Math.abs(coverage - 1.0) > 0.005) {
    throw new Error(`Patch coverage ${(coverage*100).toFixed(2)}% — expected 100%`);
  }
}
```

This is the insurance policy against missed patches.

**Progress callback:** `onProgress(2, 'graphConstruction', 0..100)`.

## Stage 3: Polygon regularization

**Goal:** Clean up wobbly pixel boundaries → clean geometric polygons. Snap to grid and quilt angles where possible.

### 3.1 Douglas-Peucker simplification

Use `simplify-js` (already installed):

```typescript
import simplify from 'simplify-js';

function simplifyPolygon(vertices: Point[], tolerance: number): Point[] {
  // tolerance in pixels — ~1-3px works well
  return simplify(vertices, tolerance, true);
}
```

**Tolerance rule:** `tolerance = max(1.5, gridSpec.cellSize * 0.02)`. Larger grids tolerate more simplification.

### 3.2 Grid snap

For each vertex, if it's within threshold of a grid intersection, snap to it:

```typescript
function snapToGrid(v: Point, grid: GridSpec, threshold: number): Point {
  const gx = grid.offsetX + Math.round((v.x - grid.offsetX) / grid.cellSize) * grid.cellSize;
  const gy = grid.offsetY + Math.round((v.y - grid.offsetY) / grid.cellSize) * grid.cellSize;
  if (Math.abs(gx - v.x) < threshold && Math.abs(gy - v.y) < threshold) {
    return { x: gx, y: gy };
  }
  return v;
}
```

**Threshold:** `gridSpec.cellSize * 0.15`.

### 3.3 Angle snap (quilt angles)

For each edge, if its angle is close to 0°, 45°, 90°, 135°, straighten it:

```typescript
function snapEdgeToQuiltAngle(prev: Point, curr: Point, tolerance: number): Point {
  const dx = curr.x - prev.x;
  const dy = curr.y - prev.y;
  const length = Math.sqrt(dx*dx + dy*dy);
  if (length === 0) return curr;

  const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
  // Find nearest quilt angle
  const quiltAngles = [0, 45, 90, 135, 180, -45, -90, -135];
  let nearest = quiltAngles[0];
  for (const a of quiltAngles) {
    if (Math.abs(angleDeg - a) < Math.abs(angleDeg - nearest)) nearest = a;
  }
  if (Math.abs(angleDeg - nearest) > tolerance) return curr;  // not close enough

  // Snap
  const rad = (nearest * Math.PI) / 180;
  return {
    x: prev.x + length * Math.cos(rad),
    y: prev.y + length * Math.sin(rad),
  };
}
```

**Tolerance:** 8° (degrees). More than that and it's genuinely not a 45°/90° edge.

### 3.4 Seam consistency (critical for no gaps)

Grid/angle snapping can create tiny gaps between neighboring polygons. Use `clipper-lib` to resolve:

```typescript
import { Clipper, PolyFillType, ClipType } from 'clipper-lib';

function mergeAndFixGaps(patches: Patch[]): Patch[] {
  // 1. Compute union of all patches → should equal image bounding box
  // 2. Any hole in the union = gap
  // 3. Assign holes to nearest patch
  // Implementation with clipper-lib union + difference operations
  // ...
}
```

**This is the guarantee against gaps introduced by simplification.** Skip it and users will see thin cracks between patches.

**Progress callback:** `onProgress(3, 'regularization', 0..100)`.

## Stage 4: SVG generation

Trivial — convert vertex arrays to SVG path strings.

```typescript
function verticesToSvgPath(vertices: Point[]): string {
  if (vertices.length < 3) return '';
  const [first, ...rest] = vertices;
  const parts = [`M ${fmt(first.x)} ${fmt(first.y)}`];
  for (const v of rest) parts.push(`L ${fmt(v.x)} ${fmt(v.y)}`);
  parts.push('Z');
  return parts.join(' ');
}

function fmt(n: number): string {
  return n.toFixed(2).replace(/\.?0+$/, '');  // trim trailing zeros
}
```

Assign IDs and return `EngineOutput`.

**Progress callback:** `onProgress(4, 'svgGeneration', 0..100)`.

## Memory management

OpenCV.js uses manual memory management. Every `new cv.Mat()` needs a matching `.delete()`. Use try/finally:

```typescript
async function runSeamEngine(input: EngineInput): Promise<EngineOutput> {
  const cv = await ensureCvLoaded();
  const startTime = performance.now();

  const rgba = cv.matFromImageData({ data: input.pixels, width: input.width, height: input.height });
  const mats: any[] = [rgba];

  try {
    // Stage 0
    const filtered = normalizeLighting(rgba); mats.push(filtered);
    const lab = toLab(filtered); mats.push(lab);
    const edges = detectEdges(lab, input.gridSpec); mats.push(edges);
    const spLabels = computeSuperpixels(lab, input.gridSpec.cellSize); mats.push(spLabels);

    // Stage 1
    const features = extractFeatures(lab, spLabels, edges);
    const clusterMap = clusterSuperpixels(features, detailSlider);
    const refined = refineClusters(clusterMap, features, spLabels, input.gridSpec.cellSize ** 2);

    // Stage 2
    const clusterImg = buildClusterImage(spLabels, refined); mats.push(clusterImg);
    const uniqueClusters = new Set(refined.values());
    const rawPatches = extractContours(clusterImg, [...uniqueClusters]);
    verifyCoverage(rawPatches, input.width, input.height);

    // Stage 3 + 4
    const patches = regularizeAndExport(rawPatches, input.gridSpec);

    return {
      patches,
      gridSpec: input.gridSpec,
      processingTime: performance.now() - startTime,
    };
  } finally {
    mats.forEach(m => m.delete());
  }
}
```

## Abort handling

Check `input.abortSignal?.aborted` at every stage boundary and before each expensive inner loop:

```typescript
function checkAbort(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
}
```

## Expose detail slider in UI

In `src/components/photo-to-design/ReviewCanvas.tsx`, add:

```tsx
<label>
  Detail level
  <input type="range" min={0} max={1} step={0.05} value={detail} onChange={...} />
</label>
```

On change, re-run the engine with the new detail value. Engine reruns in ~200-500ms — feels interactive.

This requires a minor extension to `EngineInput`:

```typescript
interface EngineInput {
  // ... existing fields
  detail?: number;  // 0 = max segments, 1 = min segments, default 0.5
}
```

## Testing strategy

### Unit tests (vitest, `tests/unit/lib/seam-engine.test.ts`)

1. **Synthetic test images**:
   - Pure checkerboard → expect exactly N×M square patches
   - Solid color image → expect exactly 1 patch covering the whole image
   - Two-color halves → expect exactly 2 patches

2. **Coverage invariant**: run on 10 real quilt images; assert sum(patch areas) ≈ image area (within 0.5%).

3. **Determinism**: run twice with same seed; assert identical output.

### Integration test (manual, via wizard)

Upload each of the 112 cropped quilt images; verify the Review step shows patches covering every visible fabric. Record failures for tuning.

## Parameter tuning constants (central file)

Put all magic numbers in `src/lib/photo-to-design/engine-config.ts`:

```typescript
export const ENGINE_CONFIG = {
  bilateral: { d: 9, sigmaColor: 75, sigmaSpace: 75 },
  canny: { tight: [80, 180], loose: [30, 80] },
  edgeMinLengthFactor: 0.5,   // × cellSize
  slic: { regionSizeFactor: 0.3, ruler: 20, iterations: 10 },
  gabor: { kernelSize: 21, sigmas: [2, 4], orientations: 4 },
  featureWeights: { color: 0.6, texture: 0.25, lbp: 0.15 },
  clusteringThresholdRange: [5, 40],
  minClusterPixelsFactor: 0.1,  // × cellSize²
  simplifyToleranceMin: 1.5,
  simplifyToleranceFactor: 0.02,  // × cellSize
  gridSnapThresholdFactor: 0.15,  // × cellSize
  angleSnapToleranceDeg: 8,
  minPatchAreaPx: 50,
  coverageToleranceFraction: 0.005,  // 0.5%
} as const;
```

Tune these against the test image set, not ad-hoc.

## Performance targets

On mid-range laptop (2020+):
- Stage 0 (preprocess + SLIC): 300-500ms
- Stage 1 (features + clustering): 400-800ms
- Stage 2 (contours): 100-300ms
- Stage 3+4 (regularization + SVG): 50-150ms
- **Total: 1-2 seconds**

Re-run on detail slider change: stages 1-4 only, ~500-1000ms.

## Files to create/modify

| File                                                    | Action      | Description                                  |
| ------------------------------------------------------- | ----------- | -------------------------------------------- |
| `src/lib/photo-to-design/seam-engine.ts`                | **Replace** | Main engine entry, implements `runSeamEngine` |
| `src/lib/photo-to-design/engine-config.ts`              | **Create**  | All tuning constants                          |
| `src/lib/photo-to-design/stages/preprocess.ts`          | **Create**  | Bilateral + LAB + Canny + SLIC                |
| `src/lib/photo-to-design/stages/cluster.ts`             | **Create**  | Feature extraction + agglomerative clustering |
| `src/lib/photo-to-design/stages/contours.ts`            | **Create**  | Cluster → contours + coverage verification    |
| `src/lib/photo-to-design/stages/regularize.ts`          | **Create**  | Simplify + grid snap + angle snap + gap fix   |
| `src/lib/photo-to-design/stages/svg.ts`                 | **Create**  | Polygon → SVG path                            |
| `src/lib/photo-to-design/worker.ts`                     | **Modify**  | Add OpenCV.js load, forward detail param      |
| `src/lib/photo-to-design/types.ts`                      | **Modify**  | Add `detail?: number` to `EngineInput`        |
| `src/hooks/usePhotoToDesign.ts`                         | **Modify**  | Pass `detail` from store to worker            |
| `src/stores/photoDesignStore.ts`                        | **Modify**  | Add `detail: number, setDetail`               |
| `src/components/photo-to-design/ReviewCanvas.tsx`       | **Modify**  | Add detail slider                             |
| `tests/unit/lib/seam-engine.test.ts`                    | **Create**  | Synthetic + real image tests                  |
| `public/opencv/opencv.js`, `public/opencv/opencv.wasm`  | **Ensure**  | Run `scripts/extract-opencv-wasm.mjs` if missing |

## Build order

1. Ensure OpenCV.js WASM runtime is available in `public/opencv/` — run extract script if not.
2. Scaffold files per table above; stub each function.
3. Implement Stage 0 + verify edge/SLIC visualization (debug canvas in ReviewCanvas).
4. Implement Stage 1 + verify cluster map visualization.
5. Implement Stage 2 + verify coverage assertion passes on all test images.
6. Implement Stage 3 + verify simplification doesn't break coverage.
7. Implement Stage 4 + wire into Review step.
8. Add detail slider; tune `ENGINE_CONFIG` defaults.
9. Write tests, run against all 112 cropped images, fix failures.

## Future extensions (explicitly out of scope for v1)

- ML-based edge classifier (seam vs texture noise) — requires training data
- SAM interactive fallback for non-grid quilts — separate wizard mode
- Texture-aware fabric clustering across blocks (same fabric appearing in multiple blocks) — post-processing step
- PDF vector path extraction — separate upload handler, bypasses engine entirely
