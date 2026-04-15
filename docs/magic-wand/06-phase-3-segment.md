# Phase 3: Segment Once (SAM Automatic Mask Generator)

## Goal

Run SAM's Automatic Mask Generator (AMG) exactly once per image. Compute per-patch feature vectors. Cache in the worker.

This is the expensive step. Every later user action reuses the cached output.

## Inputs

- `imageBitmap` and `pxPerInch` set (Phase 2 done).

## Outputs

- `useMagicWandStore.patches: PatchFeature[]` populated with 50-500 entries typically.
- Preview canvas shows distinct-colored overlays per patch.

## Tasks

### 1. Point grid generation

Default 32×32 = 1024 point prompts. Dev toggle for 16 or 48.

```ts
function generatePointGrid(w: number, h: number, density = 32): Vec2[] {
  const pts: Vec2[] = [];
  const stepX = w / (density + 1);
  const stepY = h / (density + 1);
  for (let i = 1; i <= density; i++) {
    for (let j = 1; j <= density; j++) {
      pts.push({ x: stepX * i, y: stepY * j });
    }
  }
  return pts;
}
```

### 2. Batched decoder calls

For each prompt, run the SAM decoder with the cached encoder embeddings. SAM returns 3 candidate masks per prompt; pick top-1 by predicted IoU. Batch 16 prompts per decoder invocation to amortize tensor alloc.

### 3. Non-max suppression on masks

Nearby prompts yield heavily-overlapping masks. Filter:

- Drop masks with `predictedIoU < 0.7`.
- Drop masks with `area < (minPatchIn * pxPerInch)^2` where `minPatchIn = 0.5`.
- Drop masks with `area > 0.25 * imageArea` (background).
- NMS by mask IoU: sort by predicted IoU desc, keep a mask if its IoU with every kept mask is < 0.7.

Typical survivor count: 50-400.

### 4. Contour extraction

Per surviving mask:

- `cv.findContours` with `cv.RETR_EXTERNAL`, `cv.CHAIN_APPROX_TC89_KCOS`.
- Close explicitly. Flip CW -> CCW via signed-area test.
- Keep the full contour for rendering; `cv.approxPolyDP` with epsilon = 1.5% of perimeter for the shape signature only.

### 5. Feature vector per patch

`src/lib/magic-wand/engine/features.ts`:

```ts
export function computeFeatures(
  maskRLE: Uint32Array,          // run-length encoded mask
  imageRGBA: Uint8ClampedArray,
  w: number, h: number,
  pxPerInch: number
): PatchFeature {
  const labPixels = extractMaskedLab(maskRLE, imageRGBA, w, h);
  const centroid = computeCentroid(maskRLE, w, h);
  const bbox = computeBbox(maskRLE, w, h);
  return {
    id: crypto.randomUUID(),
    contour: contourFromMask(maskRLE, w, h),
    centroid,
    areaPx: countMaskPixels(maskRLE),
    bbox,
    meanLab: mean(labPixels),
    stdLab: std(labPixels),
    dominantPalette: kmeansLab(labPixels, 5),
    lbpHistogram: lbpHist(maskRLE, imageRGBA, w, h, 10),
    shapeSig: shapeSignature(approxPolyDP(contourFromMask(maskRLE, w, h), 0.015)),
  };
}
```

Sub-algorithm notes:
- **LAB conversion**: sRGB -> linear RGB (precompute 256-entry LUT) -> XYZ -> LAB (D65 white).
- **Dominant palette**: k-means on LAB with k=5, 20 iterations, k-means++ init from a 1000-pixel sample. Output 5 LAB centroids.
- **LBP**: 8-neighbor uniform LBP on luminance. 10-bin histogram (9 uniform patterns + 1 non-uniform). Normalize sum=1.
- **Shape signature**: from `approxPolyDP` vertices — ordered normalized edge lengths and interior angles in degrees.

### 6. Stream progress

Post progress every 32 prompts:

```ts
post({
  type: 'progress',
  stage: 'amg',
  fraction: done / total,
  detail: `${done}/${total} prompts`,
});
```

Main renders a progress bar. Include ETA once 64 prompts have completed (extrapolate).

### 7. Preview render (`stages/SegmentStage.tsx`)

- Render original image on `PatchCanvas` (Fabric.js).
- Per patch: semi-transparent filled polygon in a distinct color (visual separation only — not fabric identity).
- Footer: "Found N patches."
- Primary CTA: "Start grouping" -> Phase 4.
- Secondary: "Re-run denser (density 48)" -> re-runs AMG.

### 8. Main-thread view type

Main holds a lightweight projection of each patch. Full feature vectors stay in the worker.

```ts
type PatchView = {
  id: string;
  centroid: Vec2;
  bbox: BBox;
  contour: Vec2[];        // for rendering only
  previewColor: string;   // meanLab -> CSS rgb()
};
```

Transfer via `postMessage` once after AMG completes. Do not stream per-patch — serialization overhead dominates.

### 9. Cancellation

If user navigates away or reuploads mid-AMG:

- Main sends `cancel` with the original `requestId`.
- Worker checks a cancel flag between prompt batches; bails with a `PROCESS_CANCELLED` error code.

## Pitfalls

- **Over-segmentation on prints.** A busy floral may segment into 10 sub-regions. NMS + area floor should suppress this. If not, raise the area floor before touching SAM params.
- **Background captured as a giant mask.** 25% area ceiling catches it.
- **Memory blowup.** 2048×2048 × 400 masks at 1 bit per pixel still runs into hundreds of MB. Use run-length encoding for mask storage; discard raw arrays after feature extraction.
- **AMG takes 20-60 s on a low-end machine.** Post first progress event before the first batch returns so the UI does not feel frozen.
- **Coordinate drift.** Contours are in original-image pixel coords. When the canvas is zoomed, transform via Fabric.js viewport, not CSS.

## Exit Criteria

- [ ] AMG completes within 60 s on a 2048×2048 image on a mid-desktop.
- [ ] 90% of visible patches captured on three fixture photos (manual visual check).
- [ ] Feature vectors computed and cached in the worker.
- [ ] Preview renders with distinct color fills per patch.
- [ ] Cancellation mid-AMG works without leaking workers.
- [ ] Re-upload clears patches. Re-calibrate alone does not (image unchanged).
