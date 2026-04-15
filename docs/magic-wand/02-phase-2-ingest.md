# Phase 2: Ingest (Upload, Perspective, Calibrate)

**Source: `photo-to-design-prompts/prompt2.md` in commit `0ca99e4`.**

## Goal

Three screens that capture the user's photo, straighten it, and set the scale. End state: `usePhotoDesignStore` has `sourceObjectUrl`, `correctedImageUrl`, `pixelsPerUnit`, and `stage === 'review'` ready for analysis.

## Inputs

- Phase 1 complete. Worker is ready on mount.

## Outputs

- `correctedImageUrl` (perspective-warped rectangular image) set.
- `pixelsPerUnit` set (real-world scale).
- Stage transitions: `upload → perspective → calibrate → review`.

## Tasks

### Screen 1: Upload (`screens/UploadScreen.tsx`)

Drop-zone with a large icon and text: "Drop a photo of your quilt here, or tap to browse". On mobile, also show a "Take Photo" button bound to `<input type="file" accept="image/*" capture="environment">`.

Accept: JPEG, PNG, WebP, HEIC.

On file select:

1. **EXIF orientation.** Read the EXIF tag and apply rotation before display. Use a tiny EXIF parser (or `exifr` if the dep is worth it). Critical for iPhone photos.
2. **HEIC.** If the browser can't decode HEIC natively, use the existing `heic2any` dep to convert to JPEG in the main thread. If that fails, show: "Please share this photo as JPEG and try again."
3. **Downscale.** If longest edge > 4096 px, downscale proportionally using an `OffscreenCanvas`.
4. **Object URL.** `URL.createObjectURL(file)`. Store in `sourceObjectUrl`. Also store `sourceDimensions`.
5. **Validate.** Reject files > 50 MB. Warn (non-blocking) if resolution < 800×800.
6. Advance `stage = 'perspective'`.

### Screen 2: Perspective correction (`screens/PerspectiveScreen.tsx` + `components/CornerHandles.tsx`)

The user marks the four corners of the quilt so the app can straighten the photo.

Layout:
- Uploaded image fills available space.
- Four draggable circular handles — one per corner (TL, TR, BR, BL).
- Handle size ≥ 44×44 CSS px (touch-friendly). High-contrast outlines (white fill, dark border) so they're visible on any quilt color.

**Auto-detection** (on screen load):

Send the image to the worker as `autoDetectCorners`. Worker logic:

1. Convert to grayscale.
2. `cv.Canny` for edges.
3. `cv.HoughLinesP` to find line segments.
4. Cluster by angle; find the four most dominant line groups that could form a quadrilateral.
5. Compute intersections of candidate lines; pick the quadrilateral with the largest enclosed area that contains the image center.
6. Return `[TL, TR, BR, BL]` or `null`.

If detected, pre-position the handles there. Else place handles at 10% inset from the image corners.

**Drag.** On handle release, send a downscaled preview to the worker for a quick warp preview (< 200 ms). Show it in a small thumbnail beside the main image.

**Continue button.** On click:

1. Send full-resolution image + 4 corners to the worker as `warpPerspective`.
2. Worker computes `dstWidth = max(distance(TL,TR), distance(BL,BR))`, `dstHeight = max(distance(TL,BL), distance(TR,BR))`. `srcPoints = [TL,TR,BR,BL]`, `dstPoints = [[0,0],[dstWidth,0],[dstWidth,dstHeight],[0,dstHeight]]`.
3. `M = cv.getPerspectiveTransform(srcPoints, dstPoints)`, `cv.warpPerspective(src, dst, M, new cv.Size(dstWidth, dstHeight))`.
4. Worker posts `ImageData` back (Transferable).
5. Main thread converts to object URL via `OffscreenCanvas → putImageData → convertToBlob → URL.createObjectURL`; store in `correctedImageUrl`.
6. Advance `stage = 'calibrate'`.

### Screen 3: Calibration (`screens/CalibrateScreen.tsx` + `components/CrosshairMarkers.tsx`)

The user tells the app the real-world size of something in the photo.

Layout:
- Display the corrected image (full width).
- Instruction: "Tap two points on the quilt and enter the distance between them."
- Two crosshair markers the user places by clicking/tapping. First click places marker A; second places marker B; after that, either marker can be dragged.
- Numeric input for the distance.
- Unit toggle: inches / cm (stored in `calibrationUnit`).
- Live readout: "1 inch = 47 pixels" (or similar), updates as the user edits.

Compute:

```
pixelsPerUnit = pixelDistance(pointA, pointB) / enteredDistance
```

Constraint: `pixelDistance >= 100 px`. Block "Analyze" if shorter — accuracy collapses.

**Analyze button.** On click:

1. Commit `pixelsPerUnit` to the store.
2. Advance `stage = 'review'`.
3. Immediately dispatch `client.requestFull(defaultParams)` — this kicks off the first full-quality pipeline run while the review screen mounts.

## Worker handlers added in this phase

`autoDetectCorners` — Canny + HoughLinesP quadrilateral search. Use a dedicated `MatRegistry` instance. Wrap in try/finally.

`warpPerspective` — builds M, applies `warpPerspective`, returns `ImageData` (via `new ImageData(new Uint8ClampedArray(dst.data), dst.cols, dst.rows)` then `postMessage(..., [imageData.data.buffer])`).

Neither handler mutates the stored corrected image yet — that's `loadImage`, called once on advance to `review`.

## Pitfalls

- **EXIF is not applied by default** in `<img>` on all browsers. Rotate the ImageBitmap explicitly before handing it anywhere.
- **HEIC2any is heavy.** Dynamic-import it only when the file MIME triggers it. Don't let it bloat the initial bundle.
- **OffscreenCanvas isn't available in older Safari.** Fall back to a hidden DOM canvas for downscaling.
- **Drag handles under pan/zoom.** If the image is pannable/zoomable, coordinate transforms must round-trip correctly — use a consistent `imageToScreen` / `screenToImage` helper.
- **Perspective dst size too big.** If the user marks very small corner positions, the computed `dstWidth/Height` can be tens of thousands of pixels. Clamp to the source resolution.
- **Auto-detect is allowed to fail.** Don't block the user if it returns `null`; just use the inset defaults.

## Verification

- Upload: JPEG from iPhone (rotated EXIF), PNG, WebP all display correctly.
- Upload: 6000×4000 image downscales to 4096 long edge without crashing.
- Perspective: photo of a known rectangle (book, laptop) produces a correctly rectangular warp.
- Perspective: dragging handles is smooth on mouse AND touch.
- Calibration math: 100 px apart + "2 inches" → `pixelsPerUnit === 50`.
- Calibration: block "Analyze" when `pixelDistance < 100`.
- Stage navigation updates the store correctly; back navigation preserves data.
- Worker `MatRegistry` shows no mat leaks after autoDetect + warp.

## Exit Criteria

- [ ] All three screens render and transition correctly on desktop AND mobile viewports.
- [ ] EXIF-rotated iPhone photo displays right-side-up.
- [ ] HEIC fallback via `heic2any` works or shows the "share as JPEG" message cleanly.
- [ ] Auto-corner detection produces usable corners on the `rectangular-6-fabric` fixture.
- [ ] Perspective warp produces a rectangular `correctedImageUrl`.
- [ ] Calibration sets a plausible `pixelsPerUnit`.
- [ ] Advancing to `review` kicks off `process` with `quality: 'full'`.
- [ ] Back-navigation within the flow preserves prior state.
