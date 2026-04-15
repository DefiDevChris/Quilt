# Phase 3: Analysis Pipeline

**Sources: `photo-to-design-prompts/prompt3.md` and `prompt4.md` in commit `0ca99e4`.**

## Goal

Inside the Worker, process the perspective-corrected image into a complete set of `Patch`, `ShapeTemplate`, and `DetectedGrid` objects — ready to render in the review screen and eventually ship to the Studio.

## Inputs

- `correctedImageUrl` loaded into the worker as `ImageData`.
- `pixelsPerUnit` and `unit` from calibration.
- `ProcessParams` derived from sliders (see §"Slider-to-Parameter Mapping").

## Outputs

On `quality: 'preview'`:
- `previewResult { outlines: Float32Array, colors: string[], patchCount: number }` — Float32Array transferred for zero-copy.

On `quality: 'full'`:
- `fullResult { patches: Patch[], templates: ShapeTemplate[], grid: DetectedGrid }`.

## Tasks

Implement each stage as a module under `src/lib/photo-to-design/cv/`. Each stage accepts a `MatRegistry` and writes its output into a named mat for the next stage to pick up. Post `progress` messages between stages.

### Stage 1: Resolution scaling (`pipeline.ts`)

- `quality === 'preview'`: `scale = min(1, 1024 / max(w, h))`; `cv.resize(src, dst, new cv.Size(0,0), scale, scale)`; scale `minPatchArea` by `scale * scale`.
- `quality === 'full'`: use source; `scale = 1`.

### Stage 2: CLAHE — lighting normalization

Fixes uneven lighting (lamps, windows, shadows). Same fabric on both sides of a shadow must read as the same color.

```
BGR -> LAB (cv.COLOR_BGR2Lab)
split(lab, channels)
clahe = new cv.CLAHE(claheClipLimit, new cv.Size(claheGridSize, claheGridSize))
clahe.apply(channels[0], channels[0])
merge(channels, lab)
LAB -> BGR
```

### Stage 3: Optional Gaussian blur — heavy prints

If `gaussianBlurSize > 0`, apply `cv.GaussianBlur` with that kernel. Smears busy floral/geometric prints so they don't create false patch boundaries.

### Stage 4: Bilateral filter

```
cv.bilateralFilter(src, dst, bilateralD, bilateralSigmaColor, bilateralSigmaSpace)
```

Smooths colors inside patches while preserving the sharp color transitions at seam lines. After this stage, the image looks like a flat-color digital illustration with hard edges.

### Stage 5: Color quantization (k-means)

Reduce the image to K distinct colors.

1. `BGR -> LAB` (perceptually uniform).
2. Reshape to an `(numPixels × 3)` matrix of type `CV_32F`.
3. If `kColors === 0` (auto): run the elbow method.
   - Subsample 50,000 pixels.
   - Run k-means for K = 3..20, record compactness (total within-cluster variance).
   - Find the elbow — the K where the compactness drop decelerates most.
   - Use that K.
4. `cv.kmeans(samples, K, labels, criteria, attempts, flags, centers)`.
5. Output: `labels` (each pixel's cluster ID 0..K-1), `centers` (K LAB colors).

### Stage 6: Connected components (label map)

Turn the k-means output into a `labelMap` where every pixel belongs to exactly one patch.

For each cluster ID c = 0..K-1:
- Binary mask: `mask[y][x] = (clusterOf[y][x] === c) ? 255 : 0`.
- `cv.connectedComponents(mask, ccLabels, 8, cv.CV_32S)`.
- Each connected component is a separate patch. Assign a unique patch ID (incrementing globally).

Store as a single `cv.Mat` of type `CV_32S` of shape `h × w`. This is the topological guarantee — every pixel has exactly one patch ID, zero gaps, zero overlaps, by construction.

### Stage 7: Small region merging

Patches smaller than `minPatchArea` are noise. For each small patch:

1. Find boundary pixels (pixels adjacent to a different patch ID).
2. Among neighboring patch IDs, pick the one whose average LAB color is closest to this small patch's average LAB color.
3. Relabel all pixels of the small patch to that neighbor's ID in `labelMap`.

Repeat until no patches remain below the threshold.

### Stage 8: Edge enhancement (optional)

Runs only if `edgeEnhance === true`. Handles the same-color-adjacent-patches problem (two patches from the same fabric separated only by a physical seam shadow).

1. Run on the **original** corrected image — seam shadows may have been smoothed away by the bilateral filter.
2. Grayscale + light `cv.GaussianBlur(3×3)` + `cv.Canny(src, dst, cannyLow, cannyHigh)`.
3. `cv.morphologyEx(cv.MORPH_CLOSE, 3×3 rect)` to join fragmented edges.
4. Find patches that are "suspiciously large" (area > 4× median patch area).
5. For each: extract Canny edges inside that patch's region, subtract from the patch mask, `cv.connectedComponents` on what remains. If it splits into ≥ 2 regions of reasonable size, accept the split and assign new patch IDs.

### Stage 9: Contour extraction

For each unique patch ID:

```
mask = (labelMap === id) * 255
cv.findContours(mask, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE)
largest = contours[i with max length]
cv.approxPolyDP(largest, approx, 0.02 * cv.arcLength(largest, true), true)
```

Convert `approx` to `Point[]`.

### Stage 10: Return results

- **Preview:** pack contours into one `Float32Array` — `[x0, y0, x1, y1, ..., NaN, NaN, x0, y0, ...]`. One hex color per patch (from k-means centers, converted LAB→RGB→hex). Post `previewResult` with the Float32Array as Transferable.
- **Full:** keep the label map and contours in the Worker; continue to post-processing below.

---

## Post-processing (from PROMPT 4)

Runs after Stage 10 on full-quality runs only.

### Post-A: Grid detection (`grid-detect.ts`)

Does the quilt follow a regular repeating grid?

1. **Boundary segments.** Walk `labelMap`. Wherever pixel (x, y) has a different ID than (x+1, y) or (x, y+1), that's a boundary. Group connected boundary pixels into short line segments; compute each segment's angle and length.
2. **Angle histogram.** 180 bins (0°..179°). Each segment weighted by length. Smooth with Gaussian σ=2°. Find peaks → dominant angles. Typical quilts: peaks near 0° and 90°.
3. **Grid line positions.** For each dominant angle, project boundary segments onto the perpendicular axis (1D). Build a histogram of projected positions. Find peaks → grid lines.
4. **Regular spacing?** Measure gaps between adjacent grid lines. Compute coefficient of variation `CV = std/mean`. `CV < 0.15` → regular.
5. **Confidence.** What fraction of total boundary length falls within `gridSnapTolerance` of a detected grid line? If `> 0.5` → confirmed.
6. **Classify.**
   - Two peaks ~90° apart → `rectangular`.
   - ~60° apart → `triangular` / `hexagonal`.
   - Low confidence or no regular spacing → `none`.

### Post-B: Grid snapping (`grid-snap.ts`)

If grid confidence > 0.5 AND `gridSnapEnabled`:

1. Compute all grid line intersections.
2. For each contour vertex: find the nearest intersection. If within `gridSnapTolerance` px, snap to it.
3. Vertices from different patches that land on the same intersection are now identical — topology is clean by construction.

If no grid detected, apply light regularization instead:

- For each contour edge, if its angle is within 5° of a dominant angle, snap the edge to that angle.
- Merge vertices within 3 px across all patches (union-find on vertex positions).

### Post-C: Coordinate conversion

```
realX = pixelX / pixelsPerUnit
realY = pixelY / pixelsPerUnit
```

Round to 0.01. Build `svgPath`: `M x0,y0 L x1,y1 ... Z`. Store both `pixelPolygon` (canvas) and `polygon` (real-world).

### Post-D: Shape classification (`shape-classify.ts`)

Group same-shape patches into templates.

For each patch:
1. Center polygon on origin (subtract centroid).
2. Scale so longest distance from center = 1.
3. Rotate so the longest edge aligns to 0°.
4. Normalize starting vertex to the top-left-most point.

This yields a "canonical signature" independent of position, scale, rotation.

Pairwise compare patches with the same vertex count. Use Hausdorff distance between canonical signatures; also check the mirror image. `distance < 0.08` → same shape.

Build `ShapeTemplate` per cluster. Human-readable name:

- 3 vertices with a right angle → "HST" (half-square triangle) + size.
- 4 vertices, all right angles, equal sides → "Square" + size.
- 4 vertices, all right angles, unequal sides → "Rectangle" + dimensions.
- 6 vertices → "Hexagon" + size.
- Otherwise → vertex count + dimensions.

### Post-E: Color extraction (`color-extract.ts`)

For each patch, sample from the **original corrected image** (before filtering — real colors, not processed).

- **Dominant color:** all pixels inside the patch, median R, G, B (median resists seam-shadow outliers). → hex.
- **Palette:** up to 300 random pixels from the patch, k-means in LAB with k=3. Three hex colors for patterned fabrics.
- **Fabric swatch:** crop patch bbox from the original image, apply the patch mask (transparent outside), resize to max 128×128, PNG data URL.

### Post-F: Neighbor detection (`neighbor-detect.ts`)

Walk `labelMap`. For every pixel, if (x+1, y) or (x, y+1) has a different ID, record the pair. Build a neighbors array per patch.

### Post-G: Assemble

Build `Patch[]`, `ShapeTemplate[]`, `DetectedGrid`. Post `fullResult`.

---

## Slider-to-Parameter Mapping

Put this in `src/lib/photo-to-design/sliders.ts` and call it on the main thread before every `requestPreview` / `requestFull`:

```ts
export function slidersToParams(
  s: PhotoDesignState['sliders'],
  totalPixels: number,
  pixelsPerUnit: number,
  unit: 'in' | 'cm'
): ProcessParams {
  return {
    claheClipLimit: 1.0 + (s.lighting / 100) * 7.0,
    claheGridSize: 8,

    gaussianBlurSize: s.heavyPrints ? (s.smoothing > 50 ? 7 : 5) : 0,

    bilateralD: (() => {
      const d = Math.round(3 + (s.smoothing / 100) * 18);
      return d % 2 === 0 ? d + 1 : d;
    })(),
    bilateralSigmaColor: 20 + (s.smoothing / 100) * 130,
    bilateralSigmaSpace: 20 + (s.smoothing / 100) * 130,

    kColors: s.colors === 0 ? 0 : Math.round(2 + (s.colors / 100) * 28),

    minPatchArea: Math.round((0.0001 + (s.minPatchSize / 100) * 0.05) * totalPixels),

    edgeEnhance: s.edgeEnhance,
    cannyLow: Math.round(10 + (1 - s.edgeSensitivity / 100) * 90),
    cannyHigh: Math.round(30 + (1 - s.edgeSensitivity / 100) * 200),

    gridSnapEnabled: s.gridSnap > 5,
    gridSnapTolerance: Math.round(2 + (s.gridSnap / 100) * 20),

    pixelsPerUnit,
    unit,
  };
}
```

## Error Handling

Wrap the whole pipeline in try/catch. In the catch:

- `RangeError` or message includes "memory" → post `error` with `recoverable: true`, auto-downscale to half resolution, retry once.
- k-means doesn't converge → post recoverable error suggesting a Colors-slider adjustment, fall back to K=8.
- `connectedComponents` returns 1 region → recoverable error "no patches found".

`finally`: `reg.deleteAll()` unconditionally.

## Pitfalls

- **LAB conversion direction.** OpenCV's LAB is non-linear 8-bit; values are not directly perceptual without a scale. Use `cv.COLOR_BGR2Lab` consistently and compare in the same space.
- **K-means is non-deterministic.** Seed by passing a stable random state; accept minor non-determinism between runs or cache.
- **`findContours` returns nested hierarchies.** Use `cv.RETR_EXTERNAL` — we don't want child contours from print detail inside a patch.
- **approxPolyDP epsilon too high** makes squares look like triangles; too low leaves jagged contours. 2% of perimeter is the goldilocks zone.
- **Grid snapping can collapse distinct patches** if tolerance is too high. Cap tolerance at `gridSnapTolerance` px from `ProcessParams`.
- **Shape classification on a 4000-patch quilt** is O(n²). Group by vertex count first; typical quilts have ≤ 4 vertex-count buckets.
- **Small-region merge can oscillate.** Keep a visited set or a max-iterations cap.
- **Do not apply filters to the image used for color extraction.** Dominant color must come from the original corrected image.

## Verification

- CLAHE: photo with a shadow across it — same fabric reads as the same color on both sides.
- Bilateral: after filtering, the image looks like flat-color illustration with sharp edges.
- K-means auto: a 6-fabric quilt detects ~6.
- Connected components: a 3×3 alternating-color grid finds 9 patches.
- Small-region merge: speckles (< minPatchArea) vanish.
- Edge enhancement: two same-color adjacent patches with a visible seam shadow split correctly.
- Preview on 1024 px: < 500 ms.
- Full on 4000×3000: < 5 s.
- No mat leaks across 10 consecutive runs.
- Grid detect: rectangular quilt → `rectangular` with plausible spacing. Art quilt → `none`.
- Shape classify: 9-patch → 1 template with `instanceCount: 9`. Star block → multiple templates.
- Dominant color on a solid red patch ≈ the fabric's actual red.
- Neighbors list contains every touching patch, none else.

## Exit Criteria

- [ ] All 10 pipeline stages implemented and posting progress between them.
- [ ] Preview mode returns a valid `Float32Array` with packed outlines.
- [ ] Full mode returns valid `Patch[]`, `ShapeTemplate[]`, `DetectedGrid`.
- [ ] Slider-to-params mapping matches the spec exactly.
- [ ] Error fallbacks (memory, k-means, zero patches) are all exercised by a test.
- [ ] Grid detection correctly returns `rectangular` / `none` on the two fixture types.
- [ ] Memory smoke test: 10 runs in a row, heap stable.
