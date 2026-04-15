# Photo-to-Design — Open Issues

> Captured 2026-04-15 while parking the feature to a branch. Resume work from
> `photo-to-design`; `main` has had all Photo-to-Design code stripped.

## 1. Calibration should not require a physical measurement (blocker)

**Symptom:** `Set Scale` screen forces the user to place two markers and type an
inch/cm distance between them before `Analyze` is enabled. In testing this
produced incorrect output even when the distance was typed correctly (the
calibration pipes a real-world unit conversion through downstream sizing).

**Why it's wrong:** The feature's job is to read a photo of an existing quilt
and hand the Studio a set of patches whose *relative* sizes match what the user
uploaded. The Studio can then scale the whole import to any physical size the
user wants (block size, finished quilt size, etc.). There is no reason the
pipeline needs to know that the photo is "10 inches across" — only that the
shapes are in proportion to each other.

**Fix direction:**
- Drop the `Set Scale` screen entirely, or reduce it to a confirmation step.
- Emit `StudioImportPayload` polygon coordinates in **unit-agnostic normalised
  space** (e.g. patches fit in a 1×1 bounding box, or pixel coords from the
  corrected image).
- On Studio hand-off, scale to the artboard — let the user pick a target
  physical size in Studio (same UX as "set block size" in New Project wizard).
- `useCanvasInit.hydratePhotoToDesignPatches` currently multiplies polygon
  coords by `pxPerUnit`. That needs to be replaced with a proportional scale
  derived from the bounding box of the imported patches and the user's chosen
  target size.

## 2. Corner handle / Mat-disposal rough edges already patched

Logged here so the next iteration doesn't re-break them:
- `CornerHandles` must render into `position: fixed` with `imageRect.top/left +
  pos` offsets — a flex-centred parent's origin does NOT match the image
  origin. See `src/components/photo-to-design/components/CornerHandles.tsx`.
- The worker's `labelMat` is co-owned by `MatRegistry`. Never call
  `labelMat.delete()` directly; track it by registry name and let the registry
  dispose it, or the UI gets "Mat instance already deleted" errors. See
  `src/lib/photo-to-design/worker.ts::handleDispose` and the
  `labelMatName` tracking pattern.

## 3. OpenCV.js stock-build quirks already patched

Keep these in mind if the WASM build is ever swapped:
- `COLOR_RGBA2Lab` is not exported — route RGBA → RGB → Lab.
- `bilateralFilter` rejects 4-channel input — strip alpha first.
- `Mat.reshape` is not exposed — build `samplesMat` from `lab.data` directly.
- `TermCriteria` is a plain JS struct — do NOT call `.delete()` on it.
- K-means auto-detect must stay at ≤8k samples / ≤5 Ks / 1 attempt / 20 iters
  or the main thread will look hung for a minute+.

See `src/lib/photo-to-design/cv/pipeline.ts` for the full set of workarounds
and `runStage(name, fn)` for stage-labelled error wrapping.

## 4. Pinch-to-zoom + 500+ patch guard already landed

Implemented but lightly exercised:
- Two-finger pinch-to-zoom in `QuiltCanvas` via `activePointersRef` /
  `pinchStateRef`.
- Worker emits a recoverable warning once `patches.length > 500` so the UI can
  suggest Simplify. Confirm the UX surfaces this cleanly before GA.

## 5. Rollout gate is in place

- `PHOTO_TO_DESIGN_ACCESS` env var: `internal` (admins only, default), `beta`
  (admins + Pro), `ga` (all Pro).
- Server-side gate in `src/app/photo-to-design/page.tsx`.
- Dashboard entry card is admin-only (`src/app/dashboard/page.tsx`).

When resuming, start by picking the calibration fix (Issue 1) — the current
design is the wrong shape for the feature's actual job.
