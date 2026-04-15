# Seam Engine Implementation Plan

> **SUPERSEDED 2026-04-14** — this classical-CV plan (SLIC + clustering + contours) was replaced by the SAM-based pipeline in [`seam-engine-sam-rfc.md`](./seam-engine-sam-rfc.md). Kept for historical context only; do NOT implement against this plan.

Companion to `seam-engine-vectorization-spec.md`. Spec = algorithms; this = sequencing, risks, and acceptance gates.

## Ground-Truth Findings (Pre-Planning)

- `node_modules/opencvjs/` contains only a 2.4 KB `package.json` (no code). The npm package is empty — unusable. The spec's assumption that this ships the WASM runtime is wrong.
- `scripts/extract-opencv-wasm.mjs` does not exist. `public/opencv/` does not exist.
- `tests/unit/lib/opencv-seam-detector.test.ts` is stale — imports a deleted module. Breaks `npm test` once discovered.
- `next.config.ts` CSP already allows `'wasm-unsafe-eval'` and `worker-src 'self' blob:`. Self-hosted `opencv.js` needs no CSP change.
- Hook `src/hooks/usePhotoToDesign.ts` has a main-thread fallback (lines 87–122) incompatible with OpenCV.js's `importScripts` loader.
- `EngineInput` has no `detail` field yet.
- Wizard auto-fires engine on `step === 'review'` (`PhotoToDesignWizard.tsx:25-29`).
- No doc changes planned — CLAUDE.md / QWEN.md mirror rule not triggered.

## Risk Resolutions

### R1: WASM Delivery Strategy
**Vendor `opencv.js` from official OpenCV 4.x release into `public/opencv/`, commit to repo. Drop `opencvjs` npm dep.**
- Reproducible builds, no CSP change, deterministic CI.
- Path: `public/opencv/opencv.js` + `public/opencv/VERSION.txt` with SHA256.
- Do NOT create `scripts/extract-opencv-wasm.mjs` — vendoring is simpler and safer than a download-at-install script.
- Phase 0 spike confirms file layout (single self-contained .js vs .js + .wasm sidecar) and cold-start time.

### R2: ximgproc / SLIC Availability
**Assume `cv.ximgproc_SuperpixelSLIC` is absent from stock opencv.js. Plan for pure-TS SLIC replacement.**
- Stock opencv.js is compiled without contrib modules; ximgproc is contrib.
- Phase 0 spike verifies by loading vendored opencv.js in scratch worker and checking `typeof cv.ximgproc_SuperpixelSLIC`.
- Fallback: pure-TS SLIC (~200 lines) — k-means in 5D (L, a, b, x, y) on the Lab `Mat` data.

### R3: Main-Thread Fallback
**Drop it. Workers are universal on target browsers.**
- Replace lines 87–122 of `usePhotoToDesign.ts` with a hard-error branch.
- If `Worker` is undefined (should never happen), show: "Your browser doesn't support the photo-to-design engine."

### R4: Bundle / Cold-Start Cost
**Lazy-load OpenCV.js inside the worker on first `postMessage`, cache module-level.**
- Worker itself doesn't download until user hits Review step (already true).
- `importScripts('/opencv/opencv.js')` inside `runSeamEngine`, memoized via `opencv-loader.ts`.
- Emit progress during load so the bar moves during 2–3s cold start.

### R5: Polygon Invariant for Clipper
**Add `stages/validate.ts` as the final gate of Stage 3, before SVG generation. Throw `PolygonInvariantError` on self-intersection.**
- Pure TS. Checks: vertex count ≥ 3, nonzero signed area, no non-adjacent edge intersections.
- On failure, store surfaces user-visible: "Couldn't produce clean patches — try adjusting the Detail slider."

### R6: Kill Switch
**Feature-flag via `NEXT_PUBLIC_ENABLE_SEAM_ENGINE` (default true). On flag-off or CV-load failure, surface manual-draw hint.**
- Session-level `engineAvailable = false` in store after a `loading-engine` stage error, so retries skip the engine.
- Manual-draw UI is out of scope for this work — fallback is an error message that names the workaround.

### R7: CLAUDE.md / QWEN.md Mirror
**N/A** — no doc changes planned.

## Phase Breakdown

Each phase ends at a user-visible, verifiable checkpoint.

### Phase 0 — WASM Delivery Spike + Cleanup (highest uncertainty)
**Files:** create `public/opencv/opencv.js`, `public/opencv/VERSION.txt`, `public/opencv/README.md`; modify `package.json` (remove `opencvjs`), `package-lock.json`, `.gitattributes`; delete `tests/unit/lib/opencv-seam-detector.test.ts`.
**Checkpoint:** `npm test` green, wizard boots clean to Review (still shows stub error). DevTools Network shows no `opencv.js` fetch (not yet wired).
**Estimate:** 90 min / ~30k tokens.

### Phase 1 — Worker Bootstraps OpenCV + Scaffolded Stages
**Files:** create `engine-config.ts`, `stages/{preprocess,cluster,contours,regularize,svg}.ts`, `opencv-loader.ts`, `errors.ts`; modify `seam-engine.ts` (full orchestration, no-op stages), `types.ts` (add `detail?`), `usePhotoToDesign.ts` (drop fallback, read flag), `worker.ts` (comment).
**Checkpoint:** Wizard → Review shows exactly one orange rectangle = whole image. Progress bar completes in < 2 s. DevTools shows `opencv.js` fetched once. Rescan < 200 ms.
**Estimate:** 2.5 h / ~60k tokens.

### Phase 2 — Real Stage 0 (Preprocess + SLIC) + Debug Overlay
**Files:** implement `stages/preprocess.ts` (bilateral, Lab, multi-scale Canny, filterShortEdges, SLIC or custom SLIC); `stages/contours.ts` (temp: one patch per superpixel); create `tests/unit/lib/photo-to-design/preprocess.test.ts`.
**Checkpoint:** Checkerboard fixture → hundreds of small tiles roughly aligned to checker boundaries. Real quilt → "crystallized" overlay with small coherent patches.
**Estimate:** 4 h / ~90k tokens (+1h if custom SLIC needed).

### Phase 3 — Real Stages 1–2 (Clustering + Contours + Coverage Invariant)
**Files:** implement `stages/cluster.ts` (extractFeatures, clusterSuperpixels, refineClusters), `stages/contours.ts` (real: buildClusterImage, extractContours, verifyCoverage → throws `CoverageError`); create `cluster.test.ts`, `contours.test.ts`; create `tests/fixtures/photo-to-design/{checker-8x8,solid-red,two-halves}.png`.
**Checkpoint:** `solid-red.png` → 1 patch; `two-halves.png` → 2; `checker-8x8.png` → 64. Real quilt → patches roughly match fabric regions (wobbly edges ok). No `CoverageError` raised.
**Estimate:** 5 h / ~100k tokens.

### Phase 4 — Real Stage 3 (Regularization) with Polygon Invariant Gate
**Files:** implement `stages/regularize.ts` (simplify-js wrapper, snapToGrid, snapEdgeToQuiltAngle, mergeAndFixGaps via clipper-lib); create `stages/validate.ts` (polygon invariant); modify `seam-engine.ts` to call `validatePolygons` before SVG stage; create `regularize.test.ts`, `validate.test.ts`.
**Checkpoint:** Edges are crisp at 0°/45°/90°. No gaps between adjacent patches at 400% zoom. `PolygonInvariantError` doesn't fire on fixtures. Same seed + same detail → byte-identical output.
**Estimate:** 4 h / ~80k tokens.

### Phase 5 — Detail Slider + Store Wiring
**Files:** modify `photoDesignStore.ts` (add `detail: number`, `setDetail`); `usePhotoToDesign.ts` (read + pass); `types.ts` (`WorkerInput.detail: number`); `worker.ts` (forward); `ReviewCanvas.tsx` (slider UI, 150 ms debounce → abort + rerun); create `photoDesignStore.test.ts`.
**Checkpoint:** Drag slider 0 → 1, patch count drops monotonically. Each drag stop produces fresh overlay within ~600 ms. Resets with wizard Reset.
**Estimate:** 1.5 h / ~30k tokens.

### Phase 6 — Parameter Tuning Sweep + 112-Image Manual Test (ship gate)
**Files:** modify `engine-config.ts` (tune constants); create `tests/fixtures/photo-to-design/corpus-manifest.json`; create `tests/manual/seam-engine-sweep.spec.ts` (Playwright).
**Checkpoint:** ≥ 80% images pass coverage invariant + patch count within 50% of expected. ≥ 60% subjectively "good". 0 crashes. Kill-switch branch exercised on ≥ 1 intentionally-broken image.
**Estimate:** 6 h / ~60k tokens (mostly runtime + review).

### Phase 7 — Optional Polish (kill-switch UX + cold-start progress)
**Files:** modify `ReviewCanvas.tsx` (distinct empty state for `OPENCV_UNAVAILABLE` / `ENGINE_DISABLED`); `opencv-loader.ts` (granular download progress via `ReadableStream`); `seam-engine.ts` (emit 0–5% during CV load).
**Checkpoint:** Block `/opencv/opencv.js` in DevTools → Review shows "unavailable" empty state within 2 s. Throttled Fast-3G shows moving progress bar during load.
**Estimate:** 2 h / ~25k tokens.

## Test Matrix

| Phase | Unit Tests                                                          | Integration Tests         | Manual / Sweep                   |
| ----- | ------------------------------------------------------------------- | ------------------------- | -------------------------------- |
| 0     | —                                                                   | —                         | Wizard smoke boot                |
| 1     | —                                                                   | Hook wires worker (jsdom) | Empty-output rectangle           |
| 2     | `preprocess.test.ts`                                                | —                         | Checkerboard → superpixels       |
| 3     | `cluster.test.ts`, `contours.test.ts`, coverage invariant           | —                         | 3 synthetic fixtures             |
| 4     | `regularize.test.ts`, `validate.test.ts`, determinism on fixtures   | Full engine end-to-end    | Real quilt → clean edges         |
| 5     | `photoDesignStore.test.ts`                                          | Slider → rerun flow       | Interactive drag                 |
| 6     | —                                                                   | —                         | **112-image Playwright sweep**   |
| 7     | —                                                                   | CV-load-failure path      | Throttled-network smoke          |

Unit tests run in jsdom — OpenCV.js cannot run there. Test pure-TS helpers only; engine orchestration is tested via Playwright in Phase 6. Coverage target: 80% lines on every new file (tighter than repo 70%, matching global `testing.md` policy).

## Build Order

```
Phase 0 (WASM spike + cleanup) ← highest uncertainty, clear first
  │
Phase 1 (Worker boots CV, stages scaffolded, no-op output)
  │
Phase 2 (Real preprocess + SLIC, debug overlay)
  │
Phase 3 (Clustering + contours + coverage invariant)
  │
Phase 4 (Regularize + polygon invariant)
  │
Phase 5 (Detail slider wiring)
  │
Phase 6 (112-image tuning sweep) ← ship gate
  │
Phase 7 (Optional polish)        ← post-ship
```

Each phase independently mergeable. Phases 1–5 leave Review in a working-but-progressively-better state. Phase 6 decides ship readiness. Phase 7 is polish.

**Total estimate: ~25 hours / ~475k tokens across all 7 phases.**

## HANDOFF — For tdd-guide Agent

### Already decided — do NOT re-plan
- Vendor `opencv.js`, commit to repo. Remove `opencvjs` npm dep. No `extract-opencv-wasm.mjs` script.
- No main-thread fallback. Workers mandatory. Fallback block in hook = hard-error branch.
- Assume `ximgproc_SuperpixelSLIC` absent. Phase 0 spike confirms. Fallback = pure-TS SLIC.
- Feature flag: `NEXT_PUBLIC_ENABLE_SEAM_ENGINE` (default true).
- Polygon invariant = Stage 3 gate in new `stages/validate.ts`, throws `PolygonInvariantError`.
- Coverage invariant = Stage 2 gate (spec), throws `CoverageError` on > 0.5% pixel mismatch.
- Detail slider default 0.5, range [0, 1] step 0.05, 150 ms debounce. On Review-step right panel.
- Engine runs on entry to Review step (already wired at `PhotoToDesignWizard.tsx:25-29`, don't change).
- No CLAUDE.md / QWEN.md doc changes anywhere.

### TDD responsibilities
- Phase ordering non-negotiable. Phase 0 before any engine code. Phase 6 before "ready to merge".
- Tests land inside each phase, not after. Synthetic fixtures in Phase 3.
- Unit tests in jsdom test pure-TS helpers only. Engine orchestration via Playwright in Phase 6.
- Deterministic fixture tests every phase that touches engine logic — same seed + detail → byte-identical output.
- 80% coverage on new files (tighter than repo's 70%).

### Stay alert
- Stage 3 gap-fix can introduce self-intersections. If `PolygonInvariantError` fires often, first fix is grid-snap threshold, not disabling validation.
- Every `new cv.Mat()` needs `.delete()`. Leaks won't fail tests but crash the tab after ~10 runs. Run Rescan 20× at end of every OpenCV-touching phase.
- WASM ops are synchronous — check `abortSignal?.aborted` at every stage boundary only.
- Cold start shows 2–3s "Starting..." on first scan. Phase 7 formalizes fake progress tick during CV load.

### Out of scope
- Manual patch drawing beyond an error message.
- ML edge classifier, SAM interactive, PDF vector extraction.
- Changes to `perspective.ts`, Upload / Grid steps, wizard container.
- Server / DB / payment / auth changes. 100% client-side.

### Start here
1. Read `seam-engine-vectorization-spec.md` (algorithms) + this plan (sequencing/risks/tests).
2. Begin Phase 0. Red first: Playwright smoke asserting Wizard → Review renders without console errors. Green via vendor + cleanup work above.
3. Before any phase after 0, write phase acceptance test matching "Checkpoint" wording as a red test; only then implement.

---

## ADDENDUM (2026-04-13) — Aggressive Auto-Detect + Roboflow-Style Manual Correction

User direction: **auto-detect should pick up as many patches as possible; manual correction mirrors Roboflow Smart Select (SAM3 mode) — hover-highlight, click inside/outside to refine, Simplify slider, Finish button. Shape canonicalization is a hard quality bar: "never jagged edges, never un-square squares or rectangles."**

The spec's original "manual patch drawing is out of scope" is **overridden**. Manual correction mode is now a core phase of v1.

### Spec/plan changes

1. **Default Detail slider position**: 0.2 (aggressive segmentation), not 0.5. Update spec section "Expose detail slider in UI" and Phase 5 checkpoint copy.

2. **New Stage 3.5 — Shape Canonicalization.** Inserted between Stage 3 validate and Stage 4 SVG. Responsibilities:
   - Compute rotation-invariant shape fingerprint per patch (normalized vertex ring, signed via PCA major axis).
   - Agglomerative cluster patches by fingerprint distance.
   - Per cluster: compute canonical vertices (mean-aligned); force every instance to the canonical form, re-translated/rotated/scaled to the patch's position.
   - On finish: all squares are identical squares, all triangles identical triangles. Position/rotation/scale vary; shape does not.
   - Pure TS, no new deps. New file: `src/lib/photo-to-design/stages/canonicalize.ts`.
   - Unit tests: 12 rough rectangles → 12 byte-identical rectangles after canonicalization.

3. **Phase 4 scope expands** to include Stage 3.5 canonicalization. Estimate bump: 4 h → 5.5 h.

4. **New Phase 5.5 — Manual Correction Mode (Roboflow Smart Select clone).** Inserted between Phase 5 (slider) and Phase 6 (sweep). Responsibilities:
   - Hover over image in Review step: highlight the patch that would be selected (dotted outline, Roboflow-style).
   - Click inside a highlighted area: "adopt" the patch (or merge into current working patch).
   - Click outside the highlighted area while a working patch is active: "extend" the working patch to include that region.
   - Alt-click: subtract a region from the working patch.
   - "Simplify" sub-slider on the working patch (separate from global Detail): Crisp ↔ Simplified.
   - "Finish" button commits the working patch, runs shape canonicalization against the existing patch set (so the new shape snaps to the canonical library).
   - "Undo" and "Start Over" (per Roboflow UI reference).
   - Implementation: engine pre-computes a multi-threshold merge hierarchy at the end of Phase 4. Hover lookups are O(1) via cluster-image pixel probe.
   - Files: modify `ReviewCanvas.tsx`, add `src/components/photo-to-design/ManualCorrectionPanel.tsx`, add `src/lib/photo-to-design/interactive-segmentation.ts`, extend store with `workingPatch` and `hoveredRegion` state.
   - Estimate: 6 h / ~100k tokens.
   - Checkpoint: On a floral-print quilt photo (known hard case), user can click 10 mis-segmented patches and fix them in under 2 minutes. All corrected patches snap to the canonical shape library — no patch is visibly wobbly or off-square after Finish.

5. **Total estimate revised**: ~25 h → ~32 h / ~475k → ~600k tokens across 8 phases. Phase 6 (112-image sweep) now runs on a pipeline with canonicalization enabled, so its acceptance criteria stay the same.

### Out of scope (re-confirmed)
- SAM3 / ML-based segmentation. We ship OpenCV + pure-TS SLIC only. Roboflow UX reference is for interaction patterns, not ML backend.
- Full freeform brush drawing outside the suggested-patch system. If the engine has zero suggestion for a region, user cannot draw arbitrary polygons in v1. (Can be added later if corpus sweep reveals a common gap.)
- Cross-image shape library (canonicalization is per-quilt, not across the user's whole project library).

---

## SAM PIVOT ADDENDUM (2026-04-14)

### 0. Verified Facts (web spike, 2026-04-14) — supersedes uncertain items below

- **SAM3 is OUT. Use SAM2.** SAM3 (released Nov 2025, SAM3.1 in Mar 2026) ships under Meta's "SAM License" — a restrictive acceptable-use policy where Meta retains IP in the Materials, includes a litigation-termination clause, and grants no explicit commercial rights. **Incompatible with a paid SaaS like Quilt Corgi (Stripe-billed).** SAM3 is also 848M params total (~1.7 GB fp16) — too big for browser users regardless of license. Source: `github.com/facebookresearch/sam3/LICENSE`, `arxiv.org/abs/2511.16719`.
- **SAM2 license: Apache 2.0.** Confirmed at `github.com/facebookresearch/sam2/blob/main/LICENSE`. Commercial SaaS use explicitly permitted.
- **SAM2 variants**: tiny (38.9M params), small, base-plus (80.8M), large (224M). Official Meta reference: `facebook/sam2-hiera-base-plus`. Base-plus fp32 is likely ~300+ MB; fp16 ≈ 150 MB (not 75 MB as the pre-spike addendum estimated — revise bundle budget). Tiny fp16 ≈ 65 MB; a candidate if base-plus proves too heavy on first-visit mobile.
- **ONNX availability**: `onnx-community/sam2-hiera-tiny-ONNX` confirmed on HF. Base-plus-ONNX is harder to pin from search — candidates: `SharpAI/sam2-hiera-base-plus-onnx` (lower trust), `vietanhdev/segment-anything-2-onnx-models`, or export ourselves via `samexporter`. Phase 0 picks the specific model card + SHA and, if needed, publishes our own export to `quilt-corgi/sam2-base-plus-fp16`.
- **Runtime**: `@huggingface/transformers` v3.8.0+ added native SAM2 support (same generation as `Sam3TrackerModel` shown in `onnx-community/sam3-tracker-ONNX` docs). dtype options confirmed: `fp32` (WebGPU default), `fp16`, `q8`, `q4`. Lower-level API pattern — `Sam2Model.from_pretrained(...)` + `AutoProcessor.from_pretrained(...)` + manual point-prompt loop for auto-mask generation. **Warning**: Transformers.js v3 may NOT have a high-level `pipeline('mask-generation', ...)` yet — the Python `MaskGenerationPipeline` isn't guaranteed to be ported. Plan assumes lower-level API; if high-level pipeline exists, bonus simplification.
- **WebGPU coverage Q1 2026**: ~70% overall (caniuse). Chrome since v113 (2023). Firefox Windows July 2025 (v141), macOS late 2025 (v145). Safari 26.0 on iOS 26 / iPadOS 26 / macOS Tahoe 26 since Sept 2025. Firefox Android still flagged — Mozilla targeting unflagging in 2026. Chrome Android: ~78% of users have hardware-accelerated WebGPU.
- **HF CDN hostnames (CSP `connect-src`)**: primary migrated from `cdn-lfs.huggingface.co` → `cdn-lfs.hf.co`. Regional: `cdn-lfs-us-1.hf.co`, `cdn-lfs-eu-1.hf.co`. Also need `huggingface.co` (model card lookups) and keep legacy `cdn-lfs.huggingface.co` for cached older clients. CSP additions locked.
- **Bundle total revised**: ~150 MB (fp16 base-plus) + ~10 MB OpenCV.js + ~15 MB Transformers.js ≈ **175 MB first-visit**. Higher than pre-spike 100 MB estimate. If this proves too painful in Phase 0 UX testing, fall back to tiny (~90 MB total) — the "printed fabric quality" claim becomes Phase 0 spike's call, not a planner assumption.

Items below that conflict with this block are SUPERSEDED — left in place for audit.

### 1. Summary

**Replaced:** Stages 0–2 (bilateral → Lab → multi-scale Canny → SLIC → feature extraction → agglomerative cluster) are deleted. Replaced by a single SAM block: image encoder runs once, auto-mask generator emits a mask set, per-mask `cv.findContours` produces polygons. Per-click manual correction uses SAM's mask decoder instead of a precomputed cluster hierarchy.

**Kept:** Phase 3 regularize (simplify-js, grid snap, angle snap, clipper-lib gap-fix), Phase 3.5 shape canonicalization, Phase 5.5 manual-correction UI shape (hover-highlight → click → Simplify → Finish), feature flag `NEXT_PUBLIC_ENABLE_SEAM_ENGINE`, polygon invariant validator, 112-image sweep gate. OpenCV.js stays vendored — still used for `findContours`, `cv.resize` for encoder preprocessing, and the existing `perspective.ts`. Coverage invariant gets loosened (see #9).

**New:** Phase 0 expands to a SAM runtime spike (model choice, quantization, WebGPU feasibility, first-token latency). Phase 2 is rewritten end-to-end around SAM. Phase 5.5 manual-mode calls the decoder live. Background prefetch hook fires at the Upload step so the 75 MB model warms by the time the user reaches Review.

### 2. Resolutions

Every "verify via URL" claim below MUST be re-checked at Phase 0 start. Planner knowledge cutoff is May 2025; claims about April 2026 model releases carry cutoff risk. Phase 0 has an explicit "pin exact model card + commit SHA" deliverable before any implementation work.

**#1 SAM3 web availability (as of 2026-04-14):** Uncertain at planner cutoff. Phase 0 spike must probe `huggingface.co/facebook`, `github.com/facebookresearch/sam2`/`segment-anything`, `huggingface.co/Xenova`, `huggingface.co/onnx-community` for SAM3 ONNX exports. **Decision rule:** choose SAM3 only if (a) permissive license, (b) ONNX export by a reputable maintainer with >100 downloads, (c) decoder inference < 100 ms on WebGPU at 1024×1024. Otherwise SAM2. Plan below assumes SAM2 as load-bearing; SAM3 is a drop-in swap.

**#2 Runtime: Transformers.js (`@huggingface/transformers` v3+).** Ships `MaskGenerationPipeline` implementing everything-mode point-grid sampling + decoder fan-out + stability-score filter + NMS dedup out of the box. Handles encoder normalization + tensor layout via `AutoProcessor`. Uses `onnxruntime-web` under the hood for WebGPU. Active 2025/2026 maintenance. Dev-dep only (~15–20 MB JS loaded lazily in worker). Escape hatch: drop to raw `onnxruntime-web` if pipeline is too rigid (+~1.5 days work).

**#3 Model hosting: Hugging Face CDN + Transformers.js IndexedDB cache.** CORS-enabled, free, stable; cache path is built into the runtime (`env.useBrowserCache = true`). **CSP delta:** add `https://huggingface.co` and `https://cdn-lfs*.huggingface.co` to `connect-src` in `next.config.ts`; confirm exact hostnames via DevTools at Phase 0. Supply-chain risk: HF outage blocks first-load. Mitigation: retry-with-backoff UI + post-ship R2 mirror if hit rate becomes a problem. **Rejected:** committing weights to repo (100+ MB), Git LFS (checkout tax), R2 from day one (premature).

**#4 WebGPU policy: WebGPU-or-manual-only.** Verify coverage at Phase 0 via caniuse. Expected ~85–92% global by April 2026. Feature-detect `'gpu' in navigator`; absent → skip auto-detect, manual-correction mode seeded with zero patches with banner "Your browser doesn't support fast auto-detection — tap each patch to trace." **Do NOT ship WASM-CPU encoder fallback** — ~10–20 s/image violates "never scale back." Decoder-per-click on CPU-WASM is still usable for manual mode (~150–400 ms); encoder runs once per image on GPU only.

**#5 Variant & quantization: SAM2-base-plus, FP16** (~75 MB). `tiny` (39 M params) trades 5–8 pp mask quality — unacceptable for printed fabrics. `large` triples size for marginal gain. FP16 halves weights vs FP32 with <1% accuracy loss; WebGPU supports fp16 natively via `shader-f16`. Reject INT8 — quality loss on narrow seams is unacceptable, and WebGPU INT8 acceleration isn't uniform. If an FP16 export by a trusted maintainer isn't on HF, Phase 0 produces one via `onnxruntime-quantize` and publishes under `quilt-corgi/sam2-base-plus-fp16`.

**#6 Auto-mask generation: `MaskGenerationPipeline`.** Verify exact API in Phase 0 for tunable knobs: `points_per_side` (default 32, start 16 for first-run), `pred_iou_thresh` (0.88), `stability_score_thresh` (0.95), `box_nms_thresh`, `min_mask_region_area` (mapped from `engine-config.minPatchAreaPx`). If pipeline is too rigid, fall back to manual orchestration (~12 lines of `SamModel` + `SamProcessor` glue).

**#7 Mask → polygon: `cv.findContours` on `CV_8UC1`.** Threshold SAM float32 logits at 0 → `Uint8Array`. Copy to `cv.Mat` via `cv.matFromArray(h, w, cv.CV_8UC1, bytes)` → `findContours(..., RETR_EXTERNAL, CHAIN_APPROX_NONE)`. Gotchas: mask output may be 256×256 — upsample with `cv.resize(..., INTER_NEAREST)` before contours. Single-channel not RGBA. One SAM mask may span multiple disconnected components — honor via `connectedComponentsWithStats`, emit one patch per component.

**#8 Preprocessing: delegate to Transformers.js `AutoProcessor`.** Handles resize to 1024×1024 + ImageNet mean/std + fp16 NCHW layout. Pass `Uint8ClampedArray` RGBA via `RawImage`/`ImageBitmap`. Phase 0 verifies `RawImage` works in worker context (no `HTMLImageElement`); else wrap in `createImageBitmap(new ImageData(pixels, w, h))` first.

**#9 Coverage invariant: fill unassigned pixels with a catch-all "background" patch.** SAM everything-mode can leave low-texture regions unassigned. Compute `uncovered = fullImageMask - union(masks)`; `findContours` → one patch per component, `isBackground: true` flag (new `Patch` field). Canonicalization skips background patches. Keep `coverageToleranceFraction: 0.005` as a safety net post-fill.

**#10 Determinism: relaxed tolerances for SAM stages.** WebGPU fp16 isn't byte-identical across hardware. Replace "same seed → byte-identical SVG" with: polygon count ±1, per-patch area ±2%, per-patch centroid ±2 px, Hausdorff distance per contour < 2 px. **Classical stages (Phase 3 regularize, Phase 3.5 canonicalize, Phase 4 SVG) remain byte-identical** — they're pure TS on integer-snapped inputs. New helpers in `tests/unit/lib/photo-to-design/_helpers/polygon-tolerance.ts`.

**#11 Licensing:** SAM2 is Apache 2.0 (verify `github.com/facebookresearch/sam2/blob/main/LICENSE` at Phase 0). SAM3 license unknown — if non-permissive (Meta has shipped restrictive research licenses before), fall back to SAM2. Add `LICENSES.md` crediting "Segment Anything 2 (Meta AI) — Apache 2.0" before any weights reach the user.

**#12 Bundle / cold-start UX: prefetch from Upload step.** First-visit total ≈ 100 MB (75 MB fp16 model + 10 MB OpenCV.js + 15 MB Transformers.js). **Prefetch trigger:** `UploadStep.tsx` `useEffect` fires `preloadSegmentationEngine()` on mount. User spends 15–60s picking file and 30–90s on Perspective + Grid — model warms in parallel. On repeat visit, Transformers.js IndexedDB cache returns instantly. First-visit shows non-blocking chip: `"Preparing segmentation (45 MB of 75 MB)..."` with real byte progress. Review-step entry: if ready → run; if downloading → progress bar in place of canvas + manual-draw hint; if failed → manual-only mode with retry.

### 3. Revised Phase Plan

| Original | New | Status |
|---|---|---|
| 0 — WASM + cleanup | 0 — vendor OpenCV + SAM runtime spike + hosting spike | Keep + expand |
| 1 — Worker + scaffold | 1 — Worker boots CV + Transformers.js; scaffold SAM stage; prefetch wired | Keep shape, new content |
| 2 — preprocess + SLIC | **DELETED** | — |
| 3 — cluster + contours + coverage | 2 — SAM encode + auto-mask + mask→polygon + coverage catch-all | Replace |
| 4 — regularize | 3 — unchanged | Keep |
| 4.5 — canonicalize (addendum) | 4 — unchanged | Keep |
| 5 — detail slider | 5 — modified: slider maps to SAM thresholds | Keep shape |
| 5.5 — manual correction (addendum) | 6 — rewritten: live SAM decoder, not merge hierarchy | Keep shape |
| 6 — 112-image sweep | 7 — unchanged; re-baseline against SAM pipeline | Keep |
| 7 — polish | 8 — adds prefetch chip + retry UX | Keep + expand |

**Detail slider → SAM thresholds (Phase 5):**
- `0.0` → `pointsPerSide=32, predIou=0.80, stability=0.90` (aggressive)
- `0.2` → `pointsPerSide=24, predIou=0.85, stability=0.92` (default)
- `0.5` → `pointsPerSide=16, predIou=0.88, stability=0.95`
- `1.0` → `pointsPerSide=12, predIou=0.92, stability=0.97` (conservative)

Slider change does NOT re-encode. Embeddings cached; only mask-generation reruns (~300–600 ms on WebGPU).

**Updated estimates:**

| Phase | Scope | Hours | Tokens |
|---|---|---|---|
| 0 | Vendor OpenCV + SAM spike + hosting spike + CSP + cleanup | 5 h | 70k |
| 1 | Worker boots CV + Transformers.js; scaffold SAM stage; prefetch | 3 h | 70k |
| 2 | SAM encode + auto-mask + mask→polygon + coverage catch-all | 6 h | 110k |
| 3 | Regularize + polygon invariant | 4 h | 80k |
| 4 | Canonicalize | 1.5 h | 25k |
| 5 | Detail slider → SAM thresholds | 1.5 h | 30k |
| 6 | Manual correction on live SAM decoder | 7 h | 110k |
| 7 | 112-image sweep | 6 h | 60k |
| 8 | Prefetch chip + retry UX + polish | 3 h | 40k |

**Total: ~37 h / ~600k tokens** (up ~15% hours vs pre-pivot; tokens flat).

**Phase 0 explicit deliverables:**
1. `public/opencv/opencv.js` vendored.
2. `docs/sam-pivot-decisions.md` (or header comment in `sam-loader.ts`) recording locked choices: model card URL + commit SHA, runtime version, quantization scheme, HF cache strategy.
3. Scratch spike in `scratch/sam-spike/` (deleted at end of Phase 0): loads Transformers.js + picked SAM model, runs encoder + auto-mask on one sample, logs timings + coverage. **Gate:** encoder < 2 s, total < 5 s, coverage ≥ 99.5% post-catch-all on mid-range WebGPU. Fail = re-pick variant (try `tiny`) or switch to raw `onnxruntime-web`.
4. CSP addition to `next.config.ts` for HF hostnames, verified via DevTools.
5. Decisions pinned: SAM2 vs SAM3, base-plus vs tiny, FP16 vs FP32, hosted by whom.

### 4. Files Touched — Delta vs Pre-Pivot Plan

**Add:**
- `src/lib/photo-to-design/sam-loader.ts` — lazy-loads Transformers.js + model; prefetch API
- `src/lib/photo-to-design/stages/sam-segment.ts` — encoder + auto-mask wrapper
- `src/lib/photo-to-design/stages/mask-to-polygon.ts` — SAM mask tensor → polygons
- `src/lib/photo-to-design/stages/coverage-fill.ts` — catch-all background pass
- `src/lib/photo-to-design/interactive-decoder.ts` — per-click decoder for Phase 6
- `tests/unit/lib/photo-to-design/_helpers/polygon-tolerance.ts` — fp16-tolerant test helpers
- `tests/fixtures/photo-to-design/canonical-rect.png` — Hausdorff anchor
- `docs/sam-pivot-decisions.md` — locked-decisions record from Phase 0

**Delete (vs original plan):**
- `src/lib/photo-to-design/stages/preprocess.ts` — not created; SLIC dead
- `src/lib/photo-to-design/stages/cluster.ts` — not created; classical clustering dead
- `tests/unit/lib/photo-to-design/preprocess.test.ts` / `cluster.test.ts` — not created

**Modify (same files, different content):**
- `seam-engine.ts` — orchestrates `sam-segment → mask-to-polygon → coverage-fill → regularize → canonicalize → svg`
- `engine-config.ts` — SLIC/Canny/Gabor constants out; SAM thresholds in
- `types.ts` — keep `detail?`; add `isBackground?: boolean` to `Patch`
- `worker.ts` — forward detail, handle SAM-load-failed error code
- `usePhotoToDesign.ts` — call `preloadSegmentationEngine()` on mount; download-progress state
- `photoDesignStore.ts` — add `samDownloadProgress: number | null` + setter
- `UploadStep.tsx` — fire prefetch on mount
- `PhotoToDesignWizard.tsx` — render download chip
- `ReviewCanvas.tsx` — WebGPU-absent → manual-only; download-pending waiting state
- `next.config.ts` — CSP `connect-src` + HF CDN

**New dep:** `@huggingface/transformers` (devDependencies only, loaded lazily — NOT in main bundle).

### 5. New Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| WebGPU unavailable on target HW | Medium | Medium | Feature-detect, manual-only mode, telemetry hit-rate counter |
| HF CDN supply chain | Low | High | Retry UX; post-ship R2 mirror if hit rate > 1% |
| 100 MB first-visit download on mobile | High | Medium | Prefetch during Upload; real byte-progress chip |
| fp16 determinism drift | High | Low | Hausdorff-tolerant tests per #10 |
| SAM3 non-commercial license | Low | Project-blocking | Phase 0 verifies before weight download; fall back to SAM2 |
| Transformers.js pipeline too rigid | Low-Medium | Medium | Phase 0 spike verifies knobs; raw `onnxruntime-web` fallback |
| Encoder latency on low-end WebGPU | Medium | Medium | Embeddings cached; slider doesn't re-encode |
| Floral fabric over-segmentation | Medium | Medium | Higher stability threshold; manual-correction is the escape valve; 112-image sweep includes ≥ 20 printed-fabric photos as pass-gate |
| OpenCV.js bitdepth mismatch | Medium | Low | Phase 0 spike produces end-to-end mask→polygon |
| iOS Safari IndexedDB eviction | Medium | Low | Acceptable; re-download with progress |

### 6. Updated HANDOFF — tdd-guide

**LOCKED (do NOT re-plan unless Phase 0 contradicts):**
- Classical CV segmentation is dead. No SLIC, Canny, clustering, Gabor/LBP.
- OpenCV.js stays vendored for `findContours`, `cv.resize`, `perspective.ts`.
- Runtime: Transformers.js (`@huggingface/transformers`) in worker.
- Model: SAM2-base-plus FP16. SAM3 only if Phase 0 verifies existence + license + perf.
- Hosting: HF CDN + Transformers.js IndexedDB. No self-hosting in v1.
- WebGPU-or-manual-only. No WASM-CPU encoder fallback.
- Coverage strategy: catch-all "background" patch. `Patch.isBackground: true` flag.
- Determinism: Hausdorff ≤ 2 px, area ±2%, centroid ±2 px for SAM stages. Byte-identical only for Phases 3/4/SVG.
- Prefetch: fires from `UploadStep.tsx` mount. Chip in wizard header.
- Detail default: 0.2.
- Manual mode: live SAM decoder per click.
- Feature flag, polygon invariant, canonicalization: all unchanged.

**RE-READ before starting:**
1. Original plan Phases 3/3.5/5/5.5 (still valid, renumbered per section 3 above).
2. `seam-engine-vectorization-spec.md` Stages 3 and 4 **only** — Stages 0–2 of that spec are obsolete.
3. Project memories: `project_photo_design_correction_ux.md`, `project_product_decisions_2026.md`.
4. `next.config.ts` CSP.

**Phase 0 must-dos:**
1. Vendor `opencv.js`.
2. Delete stale `tests/unit/lib/opencv-seam-detector.test.ts`.
3. Remove `opencvjs` npm dep.
4. Scratch spike in `scratch/sam-spike/` — load Transformers.js + SAM model from HF, run encoder + auto-mask, log timings. Must beat perf bar.
5. Add HF CDN hostnames to CSP; verify via DevTools.
6. `docs/sam-pivot-decisions.md` with locked URLs/SHAs.
7. `npm install --save-dev @huggingface/transformers` — devDependencies ONLY.

**Phase rules:**
- Phase 0 before any engine code.
- Every SAM-touching phase writes Hausdorff/centroid/area tests FIRST, red, before impl.
- 80% coverage on new files.
- Engine end-to-end tested only via Playwright in Phase 7. Unit tests stay on pure-TS helpers.

**Memory management:**
- Every `new cv.Mat()` still needs `.delete()` (in `mask-to-polygon.ts`, `coverage-fill.ts`).
- Transformers.js tensors: call `.dispose()` once polygons extracted. Phase 0 documents exact API.
- Encoder embeddings module-scoped, cached per image-hash. New store action `resetSegmentationCache()` evicts on wizard exit.

**Stay alert:**
- First-visit download is #1 UX risk. Prefetch aggressively.
- Don't encode twice for same image. Cache by image-hash.
- Mask output may be 256×256 — upsample INTER_NEAREST before contours.
- Manual decoder: debounce hover, not click.
- Floral fabric = key product risk. Manual-correction is the escape valve; must ship before Phase 7 sweep declares pass/fail.

**Out of scope:**
- WASM-CPU encoder fallback
- Cross-session embedding cache
- Self-hosted model mirror (post-ship only if HF reliability fails)
- SAM fine-tuning on quilt data
- Text-prompted segmentation
- Mobile-specific optimizations beyond what WebGPU gives

**Start:**
1. Read this addendum + memory queries above.
2. Phase 0. Red first: Playwright smoke — Wizard → Review with SAM stubbed still renders. Green via vendor + cleanup + spike pass.
3. Before any phase after 0, write Hausdorff-tolerant acceptance test red first.
