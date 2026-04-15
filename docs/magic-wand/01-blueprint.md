# Blueprint: Architecture and Data Flow

## System Diagram

```
+------------------------------------------------------------+
|  Main Thread                                               |
|                                                            |
|  src/app/magic-wand/page.tsx                               |
|    +- UploadStage --------+                                |
|    +- CalibrateStage      |                                |
|    +- SegmentStage        | Zustand: useMagicWandStore     |
|    +- GroupStage          |                                |
|    +- CanonicalizeStage   |                                |
|    +- OutputStage --------+                                |
|                                                            |
|  src/stores/magicWandStore.ts                              |
+----------------+-------------------------------------------+
                 |  postMessage (transferable ArrayBuffers)
                 v
+------------------------------------------------------------+
|  Web Worker (src/lib/magic-wand/worker.ts)                 |
|                                                            |
|  +------------+  +------------+  +--------------------+    |
|  | ONNX       |  | OpenCV.js  |  | Magic Wand Engine  |    |
|  | Runtime    |  |  (WASM)    |  | (pure functions)   |    |
|  | (WASM)     |  |            |  |                    |    |
|  +------+-----+  +------+-----+  +---------+----------+    |
|         |               |                  |               |
|         +---------------+--------+---------+               |
|                                  |                         |
|                          Cache API holds SAM model blob    |
+------------------------------------------------------------+
```

## Worker Message Protocol

All messages are `{ type: string; requestId: string; payload: ... }`.

### Inbound (main -> worker)

| type | payload | response |
|---|---|---|
| `init` | `{}` | `{ ok: true; sharedMemory: boolean }` |
| `loadImage` | `{ bitmap: ImageBitmap }` | `{ ok: true; embeddingsReady: true }` |
| `warpPerspective` | `{ corners: Vec2[4] }` | `{ bitmap: ImageBitmap }` |
| `runAMG` | `{ gridDensity: number }` | stream `{ progress }` + `{ patches: PatchFeature[] }` |
| `findSimilar` | `{ seedPatchId, pickiness, excludeIds }` | `{ candidateIds, scores }` |
| `canonicalize` | `{ patchIds }` | `{ canonical: CanonicalShape; residual }` |
| `inferGrid` | `{ groups }` | `{ grid: Grid \| null; confidence }` |
| `cancel` | `{ requestId: string }` | — (no response) |

### Outbound (worker -> main)

- Response messages keyed by `requestId`.
- Progress messages: `{ type: 'progress'; stage: string; fraction: number; detail?: string }`.
- Error messages: `{ type: 'error'; requestId: string; error: { code: string; message: string } }`.

## Data Flow

```
image file
  -> ImageBitmap (main)
  -> worker.loadImage -> SAM encoder (1-8s first run) -> embeddings cached
  -> user drags ruler -> pxPerInch (main state)
  -> worker.runAMG -> patches: PatchFeature[] (all candidates, cached)
  -> user clicks patch, drags pickiness -> worker.findSimilar -> ghost overlays
  -> user finalizes groups
  -> worker.canonicalize per group -> CanonicalShape + Clipper-validated polygon
  -> worker.inferGrid (optional) -> { pitch, rotation, origin } | null
  -> main composes PrintlistItem[]
  -> user edits names / seam allowance
  -> emit to printlistStore OR download
```

## Key Types

```ts
type Vec2 = { x: number; y: number };
type Lab = { L: number; a: number; b: number };
type BBox = { x: number; y: number; w: number; h: number };

type PatchFeature = {
  id: string;
  contour: Vec2[];                 // raw SAM mask contour (closed, CCW)
  centroid: Vec2;
  areaPx: number;
  bbox: BBox;
  meanLab: Lab;
  stdLab: Lab;
  dominantPalette: Lab[];          // 5 colors via k-means on LAB
  lbpHistogram: number[];          // 10 bins, local binary pattern
  shapeSig: {
    vertexCount: number;
    edgeLens: number[];            // normalized to perimeter
    interiorAngles: number[];      // degrees
  };
};

type CanonicalShape =
  | { kind: 'square'; sideIn: number }
  | { kind: 'rectangle'; wIn: number; hIn: number }
  | { kind: 'hst'; sideIn: number; rot: 0|90|180|270 }
  | { kind: 'qst'; sideIn: number; rot: 0|90|180|270 }
  | { kind: 'equilateral'; sideIn: number; rot: number }
  | { kind: 'isoceles'; baseIn: number; heightIn: number; rot: number }
  | { kind: 'hexagon'; sideIn: number; flat: boolean }
  | { kind: 'diamond'; sideIn: number; tiltDeg: number }
  | { kind: 'parallelogram'; baseIn: number; sideIn: number; skewDeg: number }
  | { kind: 'kite'; aIn: number; bIn: number; rot: number }
  | { kind: 'tumbler'; topIn: number; bottomIn: number; heightIn: number }
  | { kind: 'strip'; wIn: number; hIn: number }
  | { kind: 'arc'; radiusIn: number; sweepDeg: number; rot: number }
  | { kind: 'custom'; vertices: Vec2[]; warning: string };

type FabricGroup = {
  id: string;
  displayName: string;             // user-editable; default "Fabric 1"
  canonical: CanonicalShape;
  patchIds: string[];
  confidence: number;              // [0,1]; average feature-distance inverse
};

type Grid = {
  pitchIn: number;
  rotationDeg: 0 | 45;
  origin: Vec2;
  confidence: number;
};

type MagicWandOutput = {
  calibration: { pxPerInch: number };
  grid: Grid | null;
  groups: FabricGroup[];
  printlist: PrintlistItem[];      // from src/types/printlist.ts
};
```

## State Machine

```
upload -> calibrate -> segment -> group -> canonicalize -> output
             ^                      |
             +----- reset ----------+   (undo from any later stage)
```

Each transition guarded by `canAdvance(fromStage)` in `magicWandStore.ts`. Never skip.

## Storage

| What | Where | Why |
|---|---|---|
| SAM ONNX model | Cache API (`/models/mobile-sam/`) | 30 MB one-time download, survives reload |
| Embeddings | In-memory in worker only | Regenerated on re-upload; cheap to recompute |
| Patches | In-memory in worker | Export to main only on demand (lightweight views) |
| Groups + canonicals | `useMagicWandStore` (Zustand) | Session-scoped; undoable |
| Output | Emit to `printlistStore` or JSON download | Leaves the feature scope |

## Error Boundaries

1. Worker crash -> main detects via missing response within 30s -> offer reload.
2. Model download fails -> retry button; show size hint "30 MB one-time".
3. `SharedArrayBuffer` missing -> fall back to single-thread ORT with visible slower-mode banner.
4. Canonical fit residual > threshold -> emit `custom` with warning; do not block pipeline.
5. Clipper validation fails -> mark group "needs review"; exclude from emit; banner.

## Rendering Contract (Canvas Coordinates)

All ghost overlays live in image-space coordinates. `PatchCanvas` uses a Fabric.js viewport transform for pan/zoom. `GhostLayer` inherits that transform so ghosts snap to their patches regardless of zoom. Never use CSS transforms on the ghost layer — breaks hit-testing.
