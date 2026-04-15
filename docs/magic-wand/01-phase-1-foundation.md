# Phase 1: Foundation

**Source: `photo-to-design-prompts/prompt1.md` in commit `0ca99e4`.**

## Goal

Stand up the OpenCV worker, memory manager, Zustand store, and typed message protocol. No feature UI yet. Prove a round-trip: main sends `init`, worker loads OpenCV, worker posts `ready`, store flips `workerReady: true`.

## Inputs

- Preflight complete (see `00-overview.md §Before You Start`).
- Branch `feat/photo-to-design` checked out.

## Outputs

- Worker boots and loads OpenCV within 15 s first run.
- `MatRegistry` allocates / releases mats without WASM-heap growth.
- `usePhotoDesignStore` initialized with defaults.
- Typed client debounces `process` messages to 100 ms for preview quality.

## Tasks

### 1. OpenCV.js build

Stock `opencv.js` is 8+ MB and includes modules this feature doesn't use.

**Preferred:** Custom Emscripten build with only `core` and `imgproc` enabled. Target 3-4 MB. Produce a single `.js` loadable via `importScripts()` in the Worker.

Document the exact Emscripten command in `public/opencv/BUILD.md`:

```bash
python ./platforms/js/build_js.py build_js \
  --build_wasm \
  --disable_wasm_simd_optimized_build \
  --cmake_option="-DBUILD_LIST=core,imgproc"
```

**Acceptable fallback:** Stock `@techstark/opencv-js` loaded via `importScripts` to `self.cv`. Add a TODO to swap in a custom build for launch.

Either way, verify these symbols resolve: `cv.bilateralFilter`, `cv.kmeans`, `cv.connectedComponents`, `cv.findContours`, `cv.approxPolyDP`, `cv.Canny`, `cv.CLAHE`, `cv.getPerspectiveTransform`, `cv.warpPerspective`, `cv.cvtColor`, `cv.GaussianBlur`, `cv.split`, `cv.merge`, `cv.morphologyEx`, `cv.HoughLinesP`, `cv.resize`.

### 2. Web Worker scaffold

`src/lib/photo-to-design/worker.ts`:

```ts
/// <reference lib="webworker" />
import type { InMessage, OutMessage } from './messages';

let cv: any = null;
let correctedImageData: ImageData | null = null;

self.onmessage = async (e: MessageEvent<InMessage>) => {
  const msg = e.data;
  try {
    switch (msg.type) {
      case 'init':           return init(msg.requestId);
      case 'loadImage':      return loadImage(msg.requestId, msg.payload);
      case 'autoDetectCorners': return autoDetectCorners(msg.requestId, msg.payload);
      case 'warpPerspective':   return warpPerspective(msg.requestId, msg.payload);
      case 'process':        return processImage(msg.requestId, msg.payload);
      case 'splitPatch':     return splitPatch(msg.requestId, msg.payload);
      case 'mergePatches':   return mergePatches(msg.requestId, msg.payload);
      case 'floodFill':      return floodFill(msg.requestId, msg.payload);
      case 'undo':           return undo(msg.requestId);
      case 'redo':           return redo(msg.requestId);
      case 'dispose':        return dispose(msg.requestId);
      default:
        post({ type: 'error', requestId: msg.requestId, stage: 'router', message: `Unknown type: ${msg.type}`, recoverable: false });
    }
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    post({ type: 'error', requestId: msg.requestId, stage: msg.type, message: error.message, recoverable: false });
  }
};

async function init(requestId: string) {
  // load OpenCV
  importScripts('/opencv/opencv.js');
  cv = (self as any).cv;
  if (typeof cv.getBuildInformation !== 'function') {
    await new Promise<void>((res) => { cv.onRuntimeInitialized = () => res(); });
  }
  post({ type: 'response', requestId, payload: { ok: true } });
  post({ type: 'ready', requestId: '' });
}

function post(msg: OutMessage) {
  (self as unknown as Worker).postMessage(msg);
}
```

Rules:
- Load OpenCV on `init` only. Post `ready` after load succeeds.
- Catch every error and post it back — never silently die.
- A single `try/catch` wraps every handler. Individual handlers use `try/finally` with `reg.deleteAll()` when they allocate mats.

### 3. MatRegistry

`src/lib/photo-to-design/cv/mat-registry.ts`:

```ts
export class MatRegistry {
  private mats: Map<string, any> = new Map();
  constructor(private cv: any) {}

  create(name: string, ...args: any[]): any {
    if (this.mats.has(name)) throw new Error(`MatRegistry: "${name}" already exists`);
    const mat = new this.cv.Mat(...args);
    this.mats.set(name, mat);
    return mat;
  }

  adopt(name: string, mat: any): any {
    if (this.mats.has(name)) throw new Error(`MatRegistry: "${name}" already exists`);
    this.mats.set(name, mat);
    return mat;
  }

  get(name: string): any {
    const m = this.mats.get(name);
    if (!m) throw new Error(`MatRegistry: "${name}" not found`);
    return m;
  }

  delete(name: string): void {
    const m = this.mats.get(name);
    if (m) { m.delete(); this.mats.delete(name); }
  }

  deleteAll(): void {
    for (const m of this.mats.values()) m.delete();
    this.mats.clear();
  }
}
```

Every `new cv.Mat()` in the worker must go through `create()` or `adopt()`. Every handler ends with `reg.deleteAll()` in a `finally`.

### 4. Zustand store

`src/stores/photoDesignStore.ts`:

```ts
import { create } from 'zustand';
import type { Point, Patch, ShapeTemplate, DetectedGrid } from '@/types/photo-to-design';

type Stage = 'upload' | 'perspective' | 'calibrate' | 'review' | 'export';

export interface PhotoDesignState {
  stage: Stage;

  sourceFile: File | null;
  sourceObjectUrl: string | null;
  sourceDimensions: { width: number; height: number } | null;

  corners: [Point, Point, Point, Point] | null;
  correctedImageUrl: string | null;

  calibrationPoints: [Point, Point] | null;
  calibrationDistance: number;
  calibrationUnit: 'in' | 'cm';
  pixelsPerUnit: number | null;

  sliders: {
    lighting: number;       // 0-100, default 30
    smoothing: number;      // 0-100, default 50
    heavyPrints: boolean;   // default false
    colors: number;         // 0=auto, 1-100, default 0
    minPatchSize: number;   // 0-100, default 30
    edgeEnhance: boolean;   // default false
    edgeSensitivity: number;// 0-100, default 50
    gridSnap: number;       // 0-100, default 50
  };

  isProcessing: boolean;
  processingStage: string;
  processingPercent: number;

  viewMode: 'photo+outlines' | 'colorFill' | 'outlinesOnly' | 'photoOnly';
  previewOutlines: Float32Array | null;
  previewColors: string[] | null;
  previewPatchCount: number;

  patches: Patch[] | null;
  templates: ShapeTemplate[] | null;
  grid: DetectedGrid | null;

  selectedPatchId: number | null;
  hoveredPatchId: number | null;
  activeTool: 'select' | 'drawSeam' | 'eraseSeam' | 'floodFill' | null;
  canUndo: boolean;
  canRedo: boolean;

  workerReady: boolean;
  error: { stage: string; message: string; recoverable: boolean } | null;
}

// Actions: setters for every stage transition, tool selection, and a `dispose()` that
// terminates the worker and revokes object URLs.
```

Add an `actions` block. Gate every stage transition — e.g. `canAdvance('review')` requires `pixelsPerUnit != null`. Expose `reset()` and `dispose()`.

### 5. Shared types

`src/types/photo-to-design.ts` — copy the type block from `00-overview.md §Key Types` verbatim. Export everything.

### 6. Message protocol

`src/lib/photo-to-design/messages.ts`:

```ts
export type InMessage =
  | { type: 'init'; requestId: string; payload?: undefined }
  | { type: 'loadImage'; requestId: string; payload: { imageData: ImageData } }
  | { type: 'autoDetectCorners'; requestId: string; payload: { imageData: ImageData } }
  | { type: 'warpPerspective'; requestId: string; payload: { corners: Point[]; imageData: ImageData } }
  | { type: 'process'; requestId: string; payload: { params: ProcessParams; quality: 'preview' | 'full' } }
  | { type: 'splitPatch'; requestId: string; payload: { patchId: number; line: [Point, Point] } }
  | { type: 'mergePatches'; requestId: string; payload: { aId: number; bId: number } }
  | { type: 'floodFill'; requestId: string; payload: { point: Point; targetId: number } }
  | { type: 'undo'; requestId: string; payload?: undefined }
  | { type: 'redo'; requestId: string; payload?: undefined }
  | { type: 'dispose'; requestId: string; payload?: undefined };

export type OutMessage =
  | { type: 'response'; requestId: string; payload: any }
  | { type: 'ready'; requestId: '' }
  | { type: 'progress'; requestId: string; stage: string; percent: number }
  | { type: 'previewResult'; requestId: string; outlines: Float32Array; colors: string[]; patchCount: number }
  | { type: 'fullResult'; requestId: string; patches: Patch[]; templates: ShapeTemplate[]; grid: DetectedGrid }
  | { type: 'editResult'; requestId: string; changedPatches: Patch[]; removedIds: number[] }
  | { type: 'undoRedoState'; requestId: string; canUndo: boolean; canRedo: boolean }
  | { type: 'error'; requestId: string; stage: string; message: string; recoverable: boolean };
```

### 7. Main-thread client with debounce

`src/lib/photo-to-design/client.ts`:

```ts
export class PhotoDesignClient {
  private worker: Worker;
  private pending = new Map<string, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();
  private previewDebounceTimer: number | null = null;

  constructor() {
    this.worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
    this.worker.onmessage = (e: MessageEvent<OutMessage>) => this.route(e.data);
    this.worker.onerror = (e) => this.panic(e);
  }

  call<T>(type: InMessage['type'], payload?: unknown, transfer: Transferable[] = []): Promise<T> {
    const requestId = crypto.randomUUID();
    return new Promise<T>((resolve, reject) => {
      this.pending.set(requestId, { resolve: resolve as (v: unknown) => void, reject });
      this.worker.postMessage({ type, requestId, payload }, transfer);
    });
  }

  /** Debounce preview-quality process calls to 100ms. Full-quality calls go through immediately. */
  requestPreview(params: ProcessParams) {
    if (this.previewDebounceTimer !== null) clearTimeout(this.previewDebounceTimer);
    this.previewDebounceTimer = window.setTimeout(() => {
      this.previewDebounceTimer = null;
      this.call('process', { params, quality: 'preview' });
    }, 100);
  }

  requestFull(params: ProcessParams) {
    return this.call('process', { params, quality: 'full' });
  }

  private route(msg: OutMessage) { /* resolve / dispatch */ }
  private panic(e: ErrorEvent) { /* reject pending, surface error to store */ }

  dispose() { this.worker.terminate(); }
}
```

Wire the `route` method so `previewResult`/`fullResult`/`progress`/`undoRedoState`/`error` update `usePhotoDesignStore` directly; `response` messages resolve the pending promise.

### 8. Wire the client to the store

In the app shell (`PhotoDesignApp.tsx`, created in Phase 2), instantiate one client per mount. Cleanup on unmount:

```ts
useEffect(() => {
  const client = new PhotoDesignClient();
  usePhotoDesignStore.setState({ /* bind client handle */ });
  client.call('init');
  return () => usePhotoDesignStore.getState().dispose();
}, []);
```

## Verification

Run each and paste output:

```bash
npm run type-check
npm run build
# Node harness or a tiny scratch page that instantiates PhotoDesignClient and calls init.
# Expect `ready` within 15 s first run.
```

Leak smoke test (inside worker console): allocate 100 mats, `deleteAll`, allocate 100 more, observe `performance.memory.usedJSHeapSize` via postMessage snapshot — should not grow meaningfully between rounds.

## Pitfalls

- **`importScripts` is only callable inside classic workers.** If using `{ type: 'module' }`, either fetch OpenCV via `fetch` + `eval` (gross but works) or switch to a classic-worker build. Prefer classic worker for simplicity.
- **Do not** import `onnxruntime-web` or any AI library. This is a classical CV feature.
- **Don't cache OpenCV mats across pipeline runs** — sources differ, parameters differ. Always allocate fresh and `deleteAll()` at the end.
- **Don't compute heavy transforms on the main thread.** Perspective warp, autoDetectCorners, everything image-sized goes through the Worker.
- **Typed arrays are Transferable, but `ImageData.data` is not** — transfer the underlying `ArrayBuffer` or accept a copy.

## Exit Criteria

- [ ] `init` round-trip completes end-to-end with `ready` posted.
- [ ] `MatRegistry` leak test: 100 mats allocated, `deleteAll`, repeat — heap stable.
- [ ] `usePhotoDesignStore` initializes with defaults; selectors return expected values.
- [ ] `PhotoDesignClient.requestPreview` fires once per 100 ms window under rapid slider drags.
- [ ] All shared types exported from `src/types/photo-to-design.ts`.
- [ ] `npm run type-check` and `npm run build` pass.
