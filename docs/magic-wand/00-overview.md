# Photo-to-Design: Overview

## North Star

User photographs a physical quilt. The app runs classical computer vision on the image (OpenCV.js in a Web Worker — **no AI models**), identifies every fabric patch, classifies shape templates, and loads the whole quilt onto the Design Studio canvas as editable vector polygons. From there it behaves like any Studio project — recolor, resize, export, print.

This is **not** a printlist tool. The printlist is a downstream Studio feature. Photo-to-Design's job is to land the quilt on the canvas. That is the whole product.

## Core Decisions

- **Classical OpenCV only.** No SAM, no ONNX, no model downloads. CLAHE → bilateral filter → k-means → connected components → contour extraction. ~3-4 MB custom OpenCV.js build running in a Web Worker.
- **Cross-platform.** Works on desktop and mobile. Touch interactions supported. No desktop-only gate.
- **Output contract:** `StudioImportPayload` written to a new `Project.canvasData` and opened in the Studio. No writes to `printlistStore`.
- **In-browser only.** No server, no cloud inference.
- **Mandatory perspective correction.** 4-corner drag with auto-detect (Canny + HoughLines). Without this, the CV pipeline misreads every patch along skewed edges.
- **Mandatory scale calibration.** Two-point ruler + known distance + unit. Produces `pixelsPerUnit`. Every output dimension is in real-world inches or cm.
- **Slider-driven review screen.** The CV pipeline exposes its parameters to the user (Lighting, Smoothing, Heavy Prints, Colors, Min Patch Size, Edge Enhancement, Grid Snap). Debounced preview reruns on a downscaled image every 100 ms.
- **Manual correction tools.** Draw Seam (split), Erase Seam (merge), Flood Fill (reassign). First-class — not a fallback.
- **RLE-compressed undo.** Label map is ~48 MB raw for a 4000×3000 image. Can't store raw snapshots. RLE compresses 50:1 to 200:1. Keep 15 history levels.

## Non-Goals

- AI / ML models.
- Server-side inference.
- Fabric-catalog matching.
- Rotation beyond 0° / 45° / 60° grids.
- Millimeter-precision metrology.

## Success Criteria

- On a rectangular 6-fabric quilt, auto-K detects ~6 and the patch count is within ±10% of ground truth.
- Preview re-render from slider change ≤ 500 ms on a 1024 px image.
- Full pipeline ≤ 5 s on a 4000×3000 image.
- Exported patches land on the Studio canvas at positions matching the source photo.
- Full flow runs 3 times without memory growth. Worker terminates cleanly on unmount.

## Why Seven Prior Attempts Failed

`git log --all --oneline --grep="photo-to-design"`.

- **Switched to AI mid-stream.** `2b683c4` replaced the CV pipeline with SAM/ONNX. Heavier, slower, worse UX. Reverted.
- **Uniform-grid assumption.** `cedcfd5` assumed every quilt is an axis-aligned grid. Medallions and art quilts broke silently.
- **Perspective-only.** `3086d09` got perspective right but stopped there.
- **No manual correction path.** Users can't fix what the pipeline misreads — and it will misread things. Without Draw/Erase/Flood, every imperfect result becomes a dead end.
- **No slider-driven review.** Users couldn't tune CV to their specific photo.

The user's own seven-prompt spec (`photo-to-design-prompts/` in commit `0ca99e4`) is the source of truth. This plan repackages those prompts into four executable phases.

## Architecture

```
+------------------------------------------------------------+
|  Main Thread  (src/app/photo-to-design/)                   |
|                                                            |
|    UploadScreen      PerspectiveScreen   CalibrateScreen   |
|    ReviewScreen (canvas + sliders + toolbar + templates)   |
|                                                            |
|    Zustand: usePhotoDesignStore                            |
|    Debounced WorkerClient (preview @ 100ms)                |
+----------------+-------------------------------------------+
                 |  postMessage (Transferable ImageData)
                 v
+------------------------------------------------------------+
|  Web Worker  (src/lib/photo-to-design/worker.ts)           |
|                                                            |
|    OpenCV.js (WASM) + MatRegistry                          |
|                                                            |
|    Pipeline (PROMPT 3):                                    |
|      resize -> CLAHE -> blur? -> bilateral                 |
|        -> k-means -> connectedComponents                   |
|        -> merge small -> edge-enhance? -> contours         |
|                                                            |
|    Post-processing (PROMPT 4):                             |
|      grid detect -> grid snap -> real-world coords         |
|        -> shape classify -> color extract -> neighbors     |
|                                                            |
|    Manual edits (PROMPT 6):                                |
|      splitPatch / mergePatches / floodFill                 |
|      (operate on label map; RLE undo history)              |
+------------------------------------------------------------+
```

## State Machine

```
upload -> perspective -> calibrate -> review -> export
                                         ^
                                         | manual edits loop here
                                         v
                                      (no stage change)
```

Each transition guarded by `canAdvance()` in the store. Undo operates within `review`; it never unwinds a stage transition.

## Message Protocol

All messages: `{ type, requestId?, payload }`.

### Main → Worker

| type | payload | description |
|---|---|---|
| `init` | `{}` | Load OpenCV; respond `ready`. |
| `loadImage` | `{ imageData: ImageData }` | Store perspective-corrected image. |
| `autoDetectCorners` | `{ imageData }` | Canny + HoughLinesP; return 4 corners or null. |
| `warpPerspective` | `{ corners: Point[4], imageData }` | Return corrected `ImageData`. |
| `process` | `{ params: ProcessParams, quality: 'preview' \| 'full' }` | Run full pipeline. |
| `splitPatch` | `{ patchId, line: [Point, Point] }` | Split patch along a line. |
| `mergePatches` | `{ aId, bId }` | Merge two patches. |
| `floodFill` | `{ point: Point, targetId: number }` | Reassign a connected region. |
| `undo` | `{}` | Pop label-map snapshot; re-extract contours. |
| `redo` | `{}` | Symmetric. |
| `dispose` | `{}` | Free all mats, terminate. |

### Worker → Main

| type | payload | description |
|---|---|---|
| `ready` | `{}` | OpenCV loaded. |
| `progress` | `{ stage: string, percent: number }` | Pipeline progress. |
| `previewResult` | `{ outlines: Float32Array, colors: string[], patchCount: number }` | Lightweight (Transferable). |
| `fullResult` | `{ patches: Patch[], templates: ShapeTemplate[], grid: DetectedGrid }` | Complete data. |
| `editResult` | `{ changedPatches: Patch[], removedIds: number[] }` | After manual edit. |
| `undoRedoState` | `{ canUndo: boolean, canRedo: boolean }` | UI toolbar. |
| `error` | `{ stage, message, recoverable: boolean }` | User-visible. |

## Key Types

```ts
// src/types/photo-to-design.ts

export interface Point { x: number; y: number }

export interface Patch {
  id: number;
  templateId: string;
  polygon: Point[];         // real-world (inches or cm)
  pixelPolygon: Point[];    // pixel coords for canvas overlay
  svgPath: string;          // "M x,y L x,y ... Z"
  centroid: Point;
  area: number;
  vertexCount: number;
  dominantColor: string;    // hex
  colorPalette: [string, string, string];
  fabricSwatch: string;     // PNG data URL
  neighbors: number[];
}

export interface ShapeTemplate {
  id: string;
  name: string;             // "2\" Square", "HST 3\"", "Hexagon 2\""
  normalizedPolygon: Point[];
  realWorldSize: { w: number; h: number };
  instanceCount: number;
  instanceIds: number[];
}

export interface DetectedGrid {
  type: 'rectangular' | 'triangular' | 'hexagonal' | 'none';
  dominantAngles: number[];
  spacings: { angle: number; spacing: number }[];
  confidence: number;       // 0..1
}

export interface ProcessParams {
  claheClipLimit: number;      // 1.0-8.0
  claheGridSize: number;       // typ 8
  gaussianBlurSize: number;    // 0 (off), 3, 5, 7
  bilateralD: number;          // 3-21, odd
  bilateralSigmaColor: number; // 20-150
  bilateralSigmaSpace: number; // 20-150
  kColors: number;             // 0 = auto, 2-30 manual
  minPatchArea: number;        // pixels
  edgeEnhance: boolean;
  cannyLow: number;            // 10-100
  cannyHigh: number;           // 30-230
  gridSnapEnabled: boolean;
  gridSnapTolerance: number;   // 2-22 px
  pixelsPerUnit: number;
  unit: 'in' | 'cm';
}

export interface StudioImportPayload {
  version: '1.0';
  source: 'photo-to-design';
  metadata: {
    quiltWidth: number;
    quiltHeight: number;
    unit: 'in' | 'cm';
    patchCount: number;
    templateCount: number;
    gridType: 'rectangular' | 'triangular' | 'hexagonal' | 'none';
  };
  patches: {
    id: string;
    templateId: string;
    polygon: Point[];
    fill: string;
    colorPalette: [string, string, string];
    swatch: string;
  }[];
  templates: ShapeTemplate[];
  correctedImageUrl?: string;  // optional low-opacity background in Studio
}
```

## File Tree

```
src/
  app/photo-to-design/
    page.tsx                    # entry
    layout.tsx                  # feature wrapper
    PhotoDesignApp.tsx          # state-machine host
    screens/
      UploadScreen.tsx
      PerspectiveScreen.tsx
      CalibrateScreen.tsx
      ReviewScreen.tsx          # canvas + sidebar + toolbar
    components/
      QuiltCanvas.tsx           # two stacked <canvas> elements
      CornerHandles.tsx
      CrosshairMarkers.tsx
      SliderPanel.tsx
      TemplateList.tsx
      Toolbar.tsx               # Select, Draw Seam, Erase Seam, Flood Fill, Undo, Redo
      StatusBar.tsx

  stores/
    photoDesignStore.ts         # Zustand

  lib/photo-to-design/
    client.ts                   # main-thread worker wrapper + debounce
    worker.ts                   # worker entry
    messages.ts                 # typed message protocol
    cv/
      opencv-init.ts            # wait for OpenCV runtime init
      mat-registry.ts           # memory manager
      pipeline.ts               # 10-stage process()
      grid-detect.ts
      grid-snap.ts
      shape-classify.ts
      color-extract.ts
      neighbor-detect.ts
      edits.ts                  # splitPatch / mergePatches / floodFill
      label-map.ts              # Int32Array helpers
      rle-history.ts            # 15-slot undo
      perspective.ts            # auto-detect + warp
    sliders.ts                  # slider-to-ProcessParams mapping
    __tests__/
      pipeline.test.ts
      grid-detect.test.ts
      shape-classify.test.ts
      rle-history.test.ts

  types/
    photo-to-design.ts

public/
  opencv/
    opencv.js                   # custom build or stock, gitignored
```

## Dependencies

Already installed (reuse): `zustand`, `heic2any`, `fabric` (for Studio canvas), `clipper-lib`.

To install for this feature: **none new required**. Use `@techstark/opencv-js` only if a custom build is not feasible — otherwise load a stock or custom `opencv.js` from `public/opencv/` via `importScripts()` inside the worker. Add `@types/offscreencanvas` as a devDependency.

**Do NOT install** `onnxruntime-web` or anything AI-model-related.

## Storage

| What | Where | Why |
|---|---|---|
| OpenCV.js blob | `public/opencv/` via Cache API | 3-8 MB; immutable cache |
| ImageData (source + corrected) | Worker heap | Transferable; cleared on dispose |
| Label map | Worker heap, RLE history (15) | ~48 MB raw; ~20 MB total compressed |
| Patches / templates / grid | Zustand | Session-scoped |
| `StudioImportPayload` | IndexedDB or router state | Hand-off to Studio |

No model download. No COOP/COEP headers needed. OpenCV.js runs single-threaded WASM; existing `worker-src 'self' blob:` + `'wasm-unsafe-eval'` in the app's CSP is sufficient.

## Error Handling Table (PROMPT 7)

| When | User sees | Recovery |
|---|---|---|
| OpenCV.js fails to load | "Browser doesn't support this feature." | Link to supported browsers. |
| RangeError during mat creation | "Image very large. Reducing size…" | Auto-downscale to 2048 long edge; retry. |
| K-means doesn't converge | "Color detection struggled — try adjusting Colors." | Fall back to K=8; show result. |
| 0 patches found | "No patches detected — try increasing Colors." | Show sliders. |
| 500+ patches found | "Many small patches — try more Smoothing / Min Patch Size." | Show sliders. |
| Worker crash (`onerror`) | "Processing crashed. Restarting…" | Terminate dead worker, spawn fresh, re-init, re-send image, retry. |
| HEIC decode fails | "iPhone photo format not supported. Share as JPEG." | Instructions. |
| User navigates away | silent | `dispose()` on unmount. |

## Branding

Follow `brand_config.json`:
- Primary `#ff8d49`, Spline Sans headings, Inter body, 8 px radius cards, `rounded-full` CTAs.
- No hover movement; hover changes color/background only (150 ms ease-out).
- No spinners — opacity-pulse during long ops.
- Do not introduce new colors.

## Before You Start (Preflight)

Do the following before touching a phase. Do not skip.

1. **Audit prior attempts.** Read the diffs of the relevant commits. Seven prior pipelines lived in this repo; understanding what was ripped out prevents re-implementing the same mistakes.

   ```bash
   git log --all --oneline --grep="photo-to-design"
   git show 0ca99e4    # the 7-prompt spec — treat as source of truth
   git show 2b683c4    # SAM detour — avoid
   git show cedcfd5    # block-grid first — avoid
   git show 3086d09    # perspective-first — gate it to ingest, don't design around it
   ```

2. **Read the 7 prompts.** `photo-to-design-prompts/prompt1.md` through `prompt7.md` in commit `0ca99e4`. These are the user's own specification. This plan repackages them; where my wording differs from the prompts, the prompts win.

3. **Confirm Studio integration.** Read `src/types/project.ts`. The Studio loads from `Project.canvasData` plus `canvasData.initialSetup`. Your export target is to write a new Project with `canvasData.photoToDesign = StudioImportPayload` plus whatever `initialSetup` bootstrapping the Studio requires, then navigate to `/studio/[newProjectId]`.

4. **Undo Agent 1's scaffold if it was SAM-based.** If `src/app/magic-wand/`, `src/lib/magic-wand/`, `public/models/mobile-sam/` or `onnxruntime-web` are in the tree, revert commit `eb2e913` before starting:

   ```bash
   git revert --no-commit eb2e913
   # inspect, adjust, then:
   git commit -m "revert(magic-wand): roll back SAM scaffold — wrong architecture"
   ```

5. **Stage fixtures.** Under `tests/fixtures/photo-to-design/`:
   - `rectangular-6-fabric.jpg` — axis-aligned grid, 6 fabrics, ruler in frame.
   - `star-block.jpg` — mixed shapes (squares, HSTs, diamonds).
   - `art-quilt.jpg` — no grid, freeform, 8+ fabrics.
   Add to `.gitignore` if > 1 MB; document sourcing in a local README.

## Document Order

1. `00-overview.md` — this file
2. `01-phase-1-foundation.md` — OpenCV build, Worker, MatRegistry, store, messages, types
3. `02-phase-2-ingest.md` — Upload, Perspective, Calibrate screens
4. `03-phase-3-analysis.md` — 10-stage CV pipeline + grid/shape/color post-processing
5. `04-phase-4-review-edit-export.md` — Review screen, manual tools, RLE undo, Studio export, shipping checklist

Each phase has explicit Exit Criteria. Do not advance until they pass.
