# Phase 1: Infrastructure (Worker, ORT, Headers)

## Goal

Stand up the worker + WASM runtimes + model download pipeline. No feature UI yet. Prove it can segment a single patch when a test harness clicks.

## Inputs

- Scaffolding from `02-scaffolding.md` complete.
- Preflight checklist from `03-phase-0-preflight.md` satisfied.

## Outputs

- Worker responds to `init` and `loadImage`.
- SAM encoder runs to completion on a test image.
- Decoder returns a mask at a point prompt.

## Tasks

### 1. Install dependencies

```bash
npm install onnxruntime-web @techstark/opencv-js
npm install -D @types/offscreencanvas
```

### 2. Stage SAM ONNX files

Place in `public/models/mobile-sam/`:

- `mobile_sam_encoder.onnx` (~25 MB)
- `mobile_sam_decoder.onnx` (~6 MB)

Source: `ChaoningZhang/MobileSAM` on GitHub (Apache-2.0). Copy `LICENSE` next to the model files. Add to `.gitignore`:

```
/public/models/mobile-sam/*.onnx
```

Add a `scripts/fetch-sam-model.sh` that downloads the blobs to the right place and verifies SHA-256. Document in the root README.

Prefer production hosting from S3 / Cloudflare R2 with long cache over GitHub. Set `Cross-Origin-Resource-Policy: same-origin` on that origin.

### 3. Configure Next.js headers

Apply `next.config.ts` changes from `02-scaffolding.md`. Verify:

```bash
npm run dev
curl -I http://localhost:3000/magic-wand
# expect: Cross-Origin-Opener-Policy: same-origin
# expect: Cross-Origin-Embedder-Policy: require-corp
```

### 4. Model loader with Cache API

`src/lib/magic-wand/models/sam-loader.ts`:

```ts
const CACHE_NAME = 'mobile-sam-v1';
const ENCODER_URL = '/models/mobile-sam/mobile_sam_encoder.onnx';
const DECODER_URL = '/models/mobile-sam/mobile_sam_decoder.onnx';

export async function loadSamModel(
  onProgress: (stage: 'encoder' | 'decoder', fraction: number) => void
) {
  const cache = await caches.open(CACHE_NAME);
  const [encoder, decoder] = await Promise.all([
    fetchWithProgress(cache, ENCODER_URL, (f) => onProgress('encoder', f)),
    fetchWithProgress(cache, DECODER_URL, (f) => onProgress('decoder', f)),
  ]);
  return {
    encoder: await encoder.arrayBuffer(),
    decoder: await decoder.arrayBuffer(),
  };
}

async function fetchWithProgress(
  cache: Cache,
  url: string,
  onProgress: (f: number) => void
): Promise<Response> {
  const cached = await cache.match(url);
  if (cached) {
    onProgress(1);
    return cached;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const total = Number(res.headers.get('content-length') ?? 0);
  const chunks: Uint8Array[] = [];
  let received = 0;
  const reader = res.body!.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.byteLength;
    if (total) onProgress(received / total);
  }
  const blob = new Blob(chunks);
  const cached2 = new Response(blob, { headers: res.headers });
  await cache.put(url, cached2.clone());
  return cached2;
}
```

### 5. Worker scaffold

`src/lib/magic-wand/worker.ts`:

```ts
/// <reference lib="webworker" />
import * as ort from 'onnxruntime-web';
import { loadSamModel } from './models/sam-loader';
import type { InMessage, OutMessage } from './messages';

let encoderSession: ort.InferenceSession | null = null;
let decoderSession: ort.InferenceSession | null = null;
let embeddings: Float32Array | null = null;
let imageSize: { w: number; h: number } | null = null;

const hasSAB = typeof SharedArrayBuffer !== 'undefined';
ort.env.wasm.numThreads = hasSAB ? (self.navigator.hardwareConcurrency || 4) : 1;
ort.env.wasm.simd = true;

self.onmessage = async (e: MessageEvent<InMessage>) => {
  const msg = e.data;
  try {
    switch (msg.type) {
      case 'init':
        await init(msg.requestId);
        break;
      case 'loadImage':
        await loadImage(msg.requestId, msg.payload.bitmap);
        break;
      // later phases: warpPerspective, runAMG, findSimilar, canonicalize, inferGrid
      default:
        post({ type: 'error', requestId: msg.requestId, error: { code: 'UNKNOWN_TYPE', message: msg.type } });
    }
  } catch (err) {
    post({ type: 'error', requestId: msg.requestId, error: toErr(err) });
  }
};

async function init(requestId: string) {
  const { encoder, decoder } = await loadSamModel((stage, f) =>
    post({ type: 'progress', stage: `load-${stage}`, fraction: f })
  );
  encoderSession = await ort.InferenceSession.create(encoder, {
    executionProviders: ['wasm'],
  });
  decoderSession = await ort.InferenceSession.create(decoder, {
    executionProviders: ['wasm'],
  });
  post({
    type: 'response',
    requestId,
    payload: { ok: true, sharedMemory: hasSAB },
  });
}

async function loadImage(requestId: string, bitmap: ImageBitmap) {
  // preprocess to SAM input resolution (1024 long edge, pad to square)
  // run encoder, cache embeddings + scale info
  // ...implementation in Phase 3 for full AMG, minimal here just to validate end-to-end
  imageSize = { w: bitmap.width, h: bitmap.height };
  post({ type: 'response', requestId, payload: { ok: true, embeddingsReady: true } });
}

function post(msg: OutMessage) {
  (self as unknown as Worker).postMessage(msg);
}

function toErr(err: unknown) {
  const e = err instanceof Error ? err : new Error(String(err));
  return { code: 'WORKER_ERROR', message: e.message };
}
```

### 6. Message types

`src/lib/magic-wand/messages.ts`: export `InMessage`, `OutMessage`, `ProgressMessage`, `ErrorMessage` matching `01-blueprint.md §Worker Message Protocol`. Share with main via `@/types/magic-wand` re-export.

### 7. Main-thread client

`src/lib/magic-wand/client.ts`:

```ts
import type { InMessage, OutMessage } from './messages';

export class MagicWandClient {
  private worker: Worker;
  private pending = new Map<
    string,
    { resolve: (v: unknown) => void; reject: (e: Error) => void; onProgress?: (p: unknown) => void }
  >();

  constructor() {
    this.worker = new Worker(
      new URL('./worker.ts', import.meta.url),
      { type: 'module' }
    );
    this.worker.onmessage = (e: MessageEvent<OutMessage>) => this.route(e.data);
    this.worker.onerror = (e) => this.panic(e);
  }

  async call<T>(
    type: InMessage['type'],
    payload?: unknown,
    onProgress?: (p: unknown) => void,
  ): Promise<T> {
    const requestId = crypto.randomUUID();
    return new Promise<T>((resolve, reject) => {
      this.pending.set(requestId, {
        resolve: resolve as (v: unknown) => void,
        reject,
        onProgress,
      });
      this.worker.postMessage({ type, requestId, payload });
    });
  }

  private route(msg: OutMessage) { /* dispatch to pending[requestId] */ }
  private panic(e: ErrorEvent) { /* reject all pending */ }

  dispose() { this.worker.terminate(); }
}
```

### 8. OpenCV.js init (referenced, not run here)

`src/lib/magic-wand/models/opencv-init.ts`:

```ts
import cv from '@techstark/opencv-js';

let ready: Promise<typeof cv> | null = null;

export function getCv() {
  if (!ready) {
    ready = new Promise((resolve) => {
      const maybe = cv as unknown as {
        getBuildInformation?: () => string;
        onRuntimeInitialized?: () => void;
      };
      if (maybe.getBuildInformation) resolve(cv);
      else maybe.onRuntimeInitialized = () => resolve(cv);
    });
  }
  return ready;
}
```

### 9. SharedArrayBuffer fallback

If `typeof SharedArrayBuffer === 'undefined'`, the worker must still function in single-thread mode (`ort.env.wasm.numThreads = 1`, set above). Surface a banner: "Running in compatibility mode (slower). Ensure your browser supports SharedArrayBuffer for 4x faster encoding."

### 10. Smoke test

`src/lib/magic-wand/__tests__/worker.smoke.test.ts`. Gate behind `MAGIC_WAND_SMOKE=1` so CI does not run it by default.

- Instantiate `MagicWandClient`.
- Call `init` — expect response within 15 s.
- Call `loadImage` with a 256×256 solid fixture — expect `embeddingsReady: true`.
- Dispose.

## Pitfalls

- **Do not** statically `import * as ort from 'onnxruntime-web'` in a client component. It pulls WASM into the main chunk. Import only inside the worker or dynamic-imported modules.
- **Do not** commit ONNX blobs. Fetch via `scripts/fetch-sam-model.sh`.
- **Do not** forget `Cross-Origin-Resource-Policy` on the model URL when hosted cross-origin.
- **Do not** reuse `ort.InferenceSession` assuming embeddings update on new `loadImage`. Explicitly reset cached embeddings at the start of every `loadImage`.
- **Do not** ignore `worker.onerror` — it fires for uncaught throws in the worker; you must surface those.

## Exit Criteria

- [ ] Worker initializes end-to-end with models cached to the Cache API.
- [ ] Smoke test runs and passes within 15 s first run, 3 s cached.
- [ ] `curl -I /magic-wand` shows both COOP and COEP headers.
- [ ] `/magic-wand` page renders the desktop-only gate on a mobile viewport.
- [ ] No ONNX blob committed; `.gitignore` updated; fetch script documented.
- [ ] Fallback path works when `SharedArrayBuffer` is disabled (test by stripping headers).
