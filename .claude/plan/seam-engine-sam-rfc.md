# Seam Engine SAM RFC — Implementation Pipeline (2026-04-14)

Supersedes `seam-engine-implementation-plan.md` and `seam-engine-vectorization-spec.md` (classical CV approach). This plan pivots to SAM2-based segmentation per the locked decision in `~/.claude/projects/-home-chrishoran-Desktop-Quilt/memory/project_sam_pivot_decisions.md`.

## Core Directives

- **100% client-side**: no server inference.
- **Desktop browsers only**. WebGPU required for auto-detection. No WebGPU → feature unavailable with clear error. **No WASM-CPU SAM fallback** (per memory — 10–20s/image violates "never scale back").
- **Manual correction** is post-detection UX (fix bad/missed patches, Roboflow Smart Select style), NOT a fallback for missing WebGPU.
- **Golden rule of canonicalization**: ML → rough blob; OpenCV → simplified vertices; Grid Engine → snapped physical scale (¼″).
- **Memory discipline**: every `cv.Mat` ends with `.delete()`; every ML tensor ends with `.dispose()`.
- **Pre-scaling mandatory**: OffscreenCanvas downscale to maxDim ≤ 1024 before any `cv.Mat` / SAM tensor (OOM prevention).
- **Worker-only**: no main-thread engine path. Yield every 10 masks via `await new Promise(r => setTimeout(r, 0))`.

## Locked Technical Choices (from memory)

- Model: **SAM2-hiera-base-plus fp16** (80.8 M params, ~150 MB), **tiny** (38.9 M, ~65 MB) as fallback if bundle budget pressured. NOT SAM3 (restrictive license). NOT SlimSAM-77 (distill of SAM v1, failure mode on printed fabrics — the thing we pivoted away from).
- Runtime: **`@huggingface/transformers` v3.8+** — `Sam2Model.from_pretrained` + `AutoProcessor.from_pretrained` + manual point-prompt loop. Do NOT assume high-level `pipeline('mask-generation')` is ported to TF.js v3.
- Hosting: Hugging Face CDN (IndexedDB cache handles re-downloads).
- CSP `connect-src`: `huggingface.co`, `cdn-lfs.hf.co`, `cdn-lfs-us-1.hf.co`, `cdn-lfs-eu-1.hf.co`, `cdn-lfs.huggingface.co`.
- OpenCV: **vendored** at `public/opencv/opencv.js` (4.10.0 stock — no contrib). No npm wrappers.

## DAG

```
U0 ─┬─► U1 ─► U2 ─► U3 ─► U4 ─► U5 ─► U6 ─► U7
    │               │      │      │
    └─► U1b ────────┘      │      │
                           └──────┴─► U8 (runs after each merge)
```

## Work Units

### U0 — OpenCV vendor + CSP + cleanup (Tier 1, done 2026-04-14)

- **Files:** `public/opencv/opencv.js` (4.10.0, SHA `e9aa9515…a724`), `public/opencv/VERSION.txt`, `public/opencv/README.md`, `.gitattributes`, `next.config.ts` (CSP connect-src HF CDNs), `package.json` (remove empty `opencvjs`), delete `tests/unit/lib/opencv-seam-detector.test.ts`.
- **Checkpoint:** `npm install` + `npm test` + `npm run build` green; devtools serves `/opencv/opencv.js` with correct MIME; zero CSP violations on HF CDN.
- **Risk:** low.

### U1 — SAM2 spike + HW probe (Tier 2)

- **Files:** `scratch/sam-spike/` (index.html + spike.ts; NOT checked in to `src/`); `scratch/sam-spike/spike-report.md`.
- **Scope:** load `Xenova/sam2-hiera-base-plus` fp16 via `@huggingface/transformers@^3.8` with `device: 'webgpu'`, `dtype: 'fp16'`; measure encode + single-point decode latency; probe `navigator.gpu` adapter limits + IndexedDB cache behavior; log actual bundle bytes downloaded; pin exact model card SHA.
- **Checkpoint:** spike loads model on Chrome/Edge/Safari 26+/Firefox with WebGPU; encode < 4s on M-class GPU, < 12s on 7-year-old integrated GPU (Intel UHD 620 class); peak worker heap < 1.5 GB; WebGPU-absent branch surfaces "WebGPU required" error (no silent WASM fallback); spike-report.md pins exact model repo + SHA + measured sizes + latencies.
- **Risk:** medium (bundle budget + WebGPU availability).
- **Rollback:** if base-plus fails budget → switch to tiny.

### U1b — Plan docs reconciliation (Tier 1, done 2026-04-14)

- Mark `seam-engine-implementation-plan.md` + `seam-engine-vectorization-spec.md` SUPERSEDED.
- This doc = new source of truth.
- CLAUDE.md / QWEN.md unchanged (the photo-to-design line doesn't name an algorithm).

### U2 — Worker bootstrap + eager prefetch (Tier 2)

- **Files:** `src/lib/photo-to-design/sam-loader.ts`, `src/lib/photo-to-design/worker.ts` (rewrite), `src/lib/photo-to-design/seam-engine.ts` (dispatcher), `src/components/photo-to-design/UploadStep.tsx` (kick off preload on drop), `src/hooks/usePhotoToDesign.ts` (drop main-thread fallback — workers universal on desktop).
- **Scope:** memoized `Sam2Model.from_pretrained` + `AutoProcessor.from_pretrained`; transferable `ArrayBuffer` messages; progress events piped from loader to UI (bytes loaded); eager preload when user drops image.
- **Checkpoint:** drop image → model download starts immediately; progress bar moves during cold start; worker posts `{type:'ready', bytes, cached}` once; second run reports `cached:true` and skips network; aborting mid-download leaves IndexedDB clean.
- **Risk:** medium.
- **Rollback:** feature flag `NEXT_PUBLIC_ENABLE_SEAM_ENGINE=false`.

### U3 — Pre-scale + SAM auto-mask (Tier 2)

- **Files:** `src/lib/photo-to-design/stages/sam-segment.ts`.
- **Scope:** OffscreenCanvas downscale maxDim ≤ 1024; SHA-256 of scaled pixels → embeddings cache key; point-grid auto-mask (32×32 default), since `pipeline('mask-generation')` may not ship in TF.js v3; chunked yield every 10 masks; emit `{mask:Uint8Array, bbox, score}`; dispose every tensor; wrap in `abortSignal`-aware loop.
- **Checkpoint:** `two-halves.png` → ≥2 masks, scores > 0.7; 4000×3000 input pre-scaled to ≤1024; worker heap < 1.2 GB peak; main thread never blocked > 50 ms (heartbeat via `requestIdleCallback`); 5 consecutive runs, heap delta < 50 MB after GC.
- **Risk:** high (loop correctness + memory).
- **Rollback:** 16×16 prompt grid if too slow; embeddings-cache key = content hash only if collisions.

### U4 — Morphology + vectorize (Tier 2)

- **Files:** `src/lib/photo-to-design/stages/vectorize.ts`, `src/lib/photo-to-design/opencv-loader.ts` (memoized `importScripts('/opencv/opencv.js')` + `cv.onRuntimeInitialized`).
- **Scope:** `cv.morphologyEx` MORPH_CLOSE (3×3) → MORPH_OPEN (3×3); `cv.findContours` RETR_EXTERNAL/CHAIN_APPROX_NONE; `cv.approxPolyDP` epsilon `0.01 * arcLength`; every `Mat` in try/finally with `.delete()`; output `Point[]`.
- **Checkpoint:** square blob → 4 verts, triangle → 3, L-shape → 6; 50 contours run with bounded WASM heap (compare `cv.getMatCount()` before/after).
- **Risk:** medium.
- **Rollback:** epsilon `0.005 * arcLength`; `VectorizeError` on `cv.exception`.

### U5 — Grid canonicalization + dedup (Tier 2)

- **Files:** `src/lib/photo-to-design/stages/canonicalize.ts`.
- **Scope:** use existing `GridSpec` from `types.ts`; snap to `cellSize/4` (¼″) grid; drop polygons < 3 vertices post-snap; bbox-hash dedup → `templateId` per unique bounding box; return `Patch[]` per `EngineOutput` shape.
- **Checkpoint:** 50 jittered 2″×2″ squares → 1 templateId, 50 instances; 45°-rotated square preserves 4 verts; 4.1″×2.0″ not deduped with 4.0″×2.0″.
- **Risk:** medium.
- **Rollback:** widen snap tolerance to ½″ if dedup too aggressive.

### U6 — Interactive point-prompt decoder (Tier 3)

- **Files:** `src/lib/photo-to-design/stages/interactive-decoder.ts`, `src/components/photo-to-design/ReviewCanvas.tsx` (wiring).
- **Scope:** reuse cached image embedding from U3; on click, decoder only (~100 ms on WebGPU); run U4+U5 locally on the returned mask; insert/replace patch in store; undo stack per session.
- **Checkpoint:** click → patch appears < 300 ms end-to-end; snapped to ¼″ grid; undo restores deep-equal prior state; 20 consecutive clicks, heap < 100 MB delta.
- **Risk:** high.
- **Rollback:** disable `interactive=true`; fall back to "rerun auto-segment" button.

### U7 — Polygon invariant gate (Tier 2)

- **Files:** `src/lib/photo-to-design/stages/validate.ts`.
- **Scope:** pure TS; verify vertex count ≥ 3, nonzero signed area, no non-adjacent edge intersections, consistent winding; throw `PolygonInvariantError` with offending patch id; called at end of U5 before `EngineOutput` leaves worker.
- **Checkpoint:** fixture corpus (bowties, figure-8s) → 100% detection; 0 false positives on ¼″-snapped outputs from U5.
- **Risk:** low.
- **Rollback:** on throw, engine surfaces "Couldn't produce clean patches — try adjusting Detail" and retains unrefined patches.

### U8 — Fixture sweep + memory harness (Tier 2)

- **Files:** `tests/manual/seam-engine-sweep.spec.ts`, `tests/fixtures/photo-to-design/{checker-8x8, solid-red, two-halves, real-quilt-a, real-quilt-b}.png`.
- **Scope:** Playwright (desktop chromium only); full-pipeline run per fixture; memory harness = 5 consecutive uploads, asserts heap delta < 200 MB after GC; ≥ 80% line coverage on `stages/*.ts`.
- **Checkpoint:** sweep green on local + CI; memory invariant holds under Playwright 4× CPU throttle; < 3 min wall clock.
- **Risk:** medium.
- **Rollback:** quarantine individual fixtures; never skip memory assertion.

## Merge Queue

1. U0 + U1b merge first (no code-path dependency).
2. U1 spike report must pin model SHA + measured bytes + latencies before U2 begins.
3. U2 → U3 → U4 → U5 → U7 strict serial; rebase on integration branch before merge; rerun unit tests post-rebase.
4. U6 begins only after U5 + U7 merged.
5. U8 runs after every merge into integration branch; regression evicts the offending unit.

## Integration Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| WebGPU unavailable on target hardware | HIGH | No WASM-CPU fallback. U2 surfaces "WebGPU required" UI. |
| Bundle budget (base-plus ~150 MB + OpenCV ~10 MB) | HIGH | U1 pins exact bytes; fallback to tiny (~65 MB). |
| `pipeline('mask-generation')` absent in TF.js v3 | MED | U3 implements manual point-grid prompt loop. |
| `Mat` leaks crash tab | MED | try/finally per Mat; U8 harness bounds heap across 5 runs. |
| Clipper invariant (downstream PDF pipeline) | MED | U7 gate before `EngineOutput`. |

## Recovery Protocol

If U3 or U6 stalls: evict → regenerate with narrowed acceptance test deltas (e.g., 16×16 prompt grid, 500 ms decoder budget) → retry. Never weaken: WebGPU-only rule, memory-leak harness, polygon invariant.
