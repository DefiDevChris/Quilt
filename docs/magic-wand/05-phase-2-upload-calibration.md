# Phase 2: Upload + Calibration

## Goal

Accept an image, downscale, and require a scale reference. Produce `{ imageBitmap, pxPerInch }` before anything else runs.

Calibration is mandatory. Without it, every dimension downstream is a lie.

## Inputs

- Phase 1 complete: worker ready, models cached.

## Outputs

- `useMagicWandStore.imageBitmap: ImageBitmap` set.
- `useMagicWandStore.pxPerInch: number` set.
- Transition `stage: 'upload' -> 'calibrate' -> 'segment'`.

## Tasks

### 1. Upload UI (`stages/UploadStage.tsx`)

- Drag-and-drop zone + file input. Accept `image/jpeg`, `image/png`, `image/webp`. Reject `image/heic` with a helpful message.
- Validate: file size <= 25 MB, min dimensions 512 px short edge, max 8192 px long edge.
- Decode via `createImageBitmap(file, { imageOrientation: 'from-image' })` to respect EXIF rotation.
- Downscale if longest edge > 2048 px using an OffscreenCanvas. Preserve aspect.

```ts
async function ingest(file: File): Promise<ImageBitmap> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
    throw new Error('Unsupported image type. Use JPG, PNG, or WebP.');
  }
  if (file.size > 25 * 1024 * 1024) {
    throw new Error('Image is larger than 25 MB.');
  }
  const raw = await createImageBitmap(file, { imageOrientation: 'from-image' });
  if (Math.min(raw.width, raw.height) < 512) {
    raw.close();
    throw new Error('Image is too small. Minimum 512 px short edge.');
  }
  return downscaleToMax(raw, 2048);
}

async function downscaleToMax(src: ImageBitmap, maxEdge: number) {
  const longest = Math.max(src.width, src.height);
  if (longest <= maxEdge) return src;
  const scale = maxEdge / longest;
  const w = Math.round(src.width * scale);
  const h = Math.round(src.height * scale);
  const canvas = new OffscreenCanvas(w, h);
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(src, 0, 0, w, h);
  src.close();
  return canvas.transferToImageBitmap();
}
```

- Commit: `setImage(bitmap)` -> sets store `imageBitmap`, resets downstream.
- Transition to `calibrate`.

### 2. Calibration UI (`stages/CalibrateStage.tsx`, `components/RulerOverlay.tsx`)

Simplest possible UI — one draggable line.

- Render image on a Fabric.js canvas (same canvas host that later stages will reuse).
- Overlay a two-handle line. Default spans 25% of image width, horizontal, centered.
- User drags endpoints to match a known-length element (quilt border edge, a printed ruler, a known patch side).
- Number input: "This line is how many inches?" step 0.125.
- "Apply" button:
  - Computes `lengthPx = distance(handleA, handleB)` in image coords.
  - `pxPerInch = lengthPx / lengthIn`.
  - Commits to store; transitions to `segment`.

Constraints:
- Line length in image-space >= 100 px. Reject shorter with message: "Use a longer reference — at least 100 pixels of known length."
- `lengthIn` must be in range [0.25, 120] inches.
- Snap the final value to the nearest 0.125". Display the snapped value so user can confirm.

### 3. Optional: perspective fix (secondary button, not default)

- "Fix perspective" reveals a 4-point draggable polygon (corners) initialized to 10% inset of image bounds.
- On "Apply", send `warpPerspective` to the worker with the 4 corners.
- Worker returns a warped `ImageBitmap`. Replace `imageBitmap` in the store. Invalidate downstream state: clear `pxPerInch`, `patches`, `groups`. User must re-calibrate.

Do not gate the main flow on perspective. Most top-down photos do not need it.

### 4. Worker: perspective handler

Add `warpPerspective` in `worker.ts`:

```ts
case 'warpPerspective': {
  const { corners } = msg.payload;
  const cv = await getCv();
  const src = imageBitmapToMat(currentBitmap);
  const dst = new cv.Mat();
  const { w, h } = destinationRect(corners);
  const srcMat = cv.matFromArray(4, 1, cv.CV_32FC2, corners.flatMap(p => [p.x, p.y]));
  const dstMat = cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, w, 0, w, h, 0, h]);
  const M = cv.getPerspectiveTransform(srcMat, dstMat);
  cv.warpPerspective(src, dst, M, new cv.Size(w, h));
  const warped = matToImageBitmap(dst);
  src.delete(); dst.delete(); srcMat.delete(); dstMat.delete(); M.delete();
  post({ type: 'response', requestId, payload: { bitmap: warped } });
  break;
}
```

Invalidate cached encoder embeddings when the image changes.

### 5. Store transitions

```ts
setImage: (b) => set({
  imageBitmap: b,
  pxPerInch: null,
  patches: [],
  groups: [],
  grid: null,
  stage: 'calibrate',
}),
setCalibration: (px) => set({ pxPerInch: px, stage: 'segment' }),
```

Guard `setStage('segment')` to require `pxPerInch != null`.

### 6. Progress feedback

Persistent header during calibration:
- Image filename + dimensions.
- "Model ready" / "Downloading ML engine (1-time, 30 MB)" based on worker state.
- Opacity-pulse loader — no spinners (`brand_config` mandate).

Calibration UI remains interactive while the model downloads in the background.

## Pitfalls

- **EXIF orientation.** iPhone photos arrive rotated. `createImageBitmap` with `imageOrientation: 'from-image'` handles this. Verify on a real iPhone EXIF fixture.
- **Aggressive downscaling.** 2048 max edge is the floor; going smaller loses patch detail.
- **Short calibration line.** Enforce the 100 px minimum strictly. Users will try to drag a 20 px line and complain about inch accuracy.
- **Forgetting to snap.** Snap only on final apply, not during drag. Snapping during drag feels jittery.
- **Perspective warp without re-calibration.** If user warps, all prior calibration is invalid. Force re-calibration.

## Exit Criteria

- [ ] User can upload JPG/PNG/WebP and see a correctly-oriented preview.
- [ ] User cannot advance to `segment` without `pxPerInch` set.
- [ ] Perspective warp is opt-in, not default.
- [ ] Re-upload clears all downstream state.
- [ ] Model download and user calibration proceed concurrently without blocking.
