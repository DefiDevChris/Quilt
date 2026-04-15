// ============================================================================
// SAM2 Model Loader — runs inside the seam-engine worker only.
//
// Memoizes the SAM2 model + processor so we pay the ~150 MB download once.
// Reports byte-level progress via `progress_callback` to the caller.
// Requires WebGPU — this loader throws `WebGpuUnavailableError` otherwise
// (no WASM-CPU fallback per memory / SAM pivot decisions).
// ============================================================================

import type { ModelDownloadProgress } from './types';

/**
 * Locked per memory (`project_sam_pivot_decisions.md`).
 * Tiny fp16 is the only supported variant — base-plus crashes on lower-VRAM
 * GPUs during WebGPU session init (observed on AMD integrated). Must work on
 * all computers, so we commit to one universally loadable model and accept the
 * coarser masks. DO NOT swap to SlimSAM-77 or SAM v1 variants (failure mode
 * on printed fabrics).
 */
export const SAM_MODEL_ID = 'onnx-community/sam2-hiera-tiny-ONNX';

export class WebGpuUnavailableError extends Error {
  constructor(message = 'WebGPU is not available in this browser.') {
    super(message);
    this.name = 'WebGpuUnavailableError';
  }
}

// Only imported types live here — runtime modules are dynamic-imported inside
// the loader so this file doesn't pull transformers.js into bundles that won't
// run the worker (e.g. SSR).
type Sam2ModelT = Awaited<
  ReturnType<typeof import('@huggingface/transformers').Sam2Model.from_pretrained>
>;
type ProcessorT = Awaited<
  ReturnType<typeof import('@huggingface/transformers').AutoProcessor.from_pretrained>
>;

export interface LoadedSam {
  model: Sam2ModelT;
  processor: ProcessorT;
  totalBytes: number;
  cached: boolean;
  elapsedMs: number;
}

let loadPromise: Promise<LoadedSam> | null = null;

type ProgressHandler = (progress: ModelDownloadProgress) => void;

/**
 * Returns the memoized SAM2 model + processor.
 * Safe to call repeatedly — subsequent calls return the cached promise.
 * First call must be made inside a worker (uses `importScripts`-style globals).
 */
export function loadSam(onProgress?: ProgressHandler): Promise<LoadedSam> {
  if (loadPromise) return loadPromise;
  loadPromise = doLoad(onProgress).catch((err) => {
    // Reset so a retry after transient failure can try again.
    loadPromise = null;
    throw err;
  });
  return loadPromise;
}

const trace = (msg: string, extra?: unknown) => {
  // eslint-disable-next-line no-console
  console.log(`[sam-loader] ${msg}`, extra ?? '');
};

async function doLoad(onProgress?: ProgressHandler): Promise<LoadedSam> {
  trace('doLoad start');
  // WebGPU is the only supported backend. Fail fast with a distinguished
  // error the UI can recognize. `navigator.gpu` is sometimes present but
  // `requestAdapter` returns null (locked-down browsers, headless Chrome
  // without --enable-unsafe-webgpu) — treat that as "unavailable" too.
  const nav = (
    self as unknown as {
      navigator?: { gpu?: { requestAdapter?: () => Promise<unknown> } };
    }
  ).navigator;
  if (!nav?.gpu?.requestAdapter) {
    throw new WebGpuUnavailableError();
  }
  let adapter: { features?: { has?: (k: string) => boolean } } | null | undefined;
  try {
    adapter = (await nav.gpu.requestAdapter()) as typeof adapter;
  } catch (err) {
    throw new WebGpuUnavailableError(
      err instanceof Error ? `WebGPU adapter unavailable: ${err.message}` : undefined
    );
  }
  if (!adapter) throw new WebGpuUnavailableError();
  trace('webgpu adapter ok', { vendor: (adapter as { info?: { vendor?: string } }).info?.vendor });

  // fp16 needs the WebGPU `shader-f16` feature. Vulkan/SwiftShader + many
  // integrated GPUs report WebGPU but omit f16 — in that case we load the
  // fp32 weights instead so the pipeline still runs.
  const dtype: 'fp16' | 'fp32' = adapter.features?.has?.('shader-f16') ? 'fp16' : 'fp32';

  const started = performance.now();
  let totalBytes = 0;
  let sawDownload = false;

  // Dynamic import keeps transformers out of non-worker bundles.
  trace('importing transformers.js');
  const transformers = await import('@huggingface/transformers');
  const { AutoProcessor, Sam2Model, env } = transformers;
  trace('transformers imported', { dtype });

  // Point the ONNX Runtime WASM backend at a self-hosted copy of the JSEP
  // files (copied into `public/ort/` by postinstall). Default is jsdelivr,
  // which our production CSP doesn't whitelist — self-hosting also cuts a
  // cross-origin fetch out of cold-start. Use an absolute origin-qualified
  // URL so the worker (which has `self.location.origin` = page origin)
  // resolves it deterministically instead of guessing relative to its blob URL.
  const wasmEnv = env?.backends?.onnx?.wasm as { wasmPaths?: string } | undefined;
  if (wasmEnv) {
    const origin = (self as unknown as { location?: { origin?: string } }).location?.origin ?? '';
    wasmEnv.wasmPaths = `${origin}/ort/`;
  }

  // Disable transformers.js's Cache API layer. In some browser/worker
  // combinations the `caches.open()` call hangs before ever reaching a
  // network fetch — progress fires `initiate` and then the pipeline stalls
  // silently. Going straight to `fetch` sidesteps that and the browser's
  // HTTP cache still handles repeat loads.
  const envTyped = env as unknown as {
    useBrowserCache?: boolean;
    useCustomCache?: boolean;
    useFSCache?: boolean;
    allowLocalModels?: boolean;
  };
  envTyped.useBrowserCache = false;
  envTyped.useCustomCache = false;
  envTyped.useFSCache = false;
  envTyped.allowLocalModels = false;

  // Transformers.js reports download progress through this callback.
  // `status: 'download'` fires once per file, `status: 'progress'` fires
  // repeatedly with bytes loaded, `status: 'done'` per file, `status: 'ready'`
  // at the end. If the model is already in IndexedDB, we never see 'download'.
  const progressCallback = (data: ModelDownloadProgress) => {
    trace('progress', data);
    if (data.status === 'download' || data.status === 'initiate') sawDownload = true;
    if (data.status === 'done' && typeof data.total === 'number') {
      totalBytes += data.total;
    }
    onProgress?.(data);
  };

  trace('calling from_pretrained', { SAM_MODEL_ID, wasmPaths: wasmEnv?.wasmPaths });
  const [model, processor] = await Promise.all([
    Sam2Model.from_pretrained(SAM_MODEL_ID, {
      device: 'webgpu',
      dtype,
      progress_callback: progressCallback,
    }),
    AutoProcessor.from_pretrained(SAM_MODEL_ID, {
      progress_callback: progressCallback,
    }),
  ]);

  const elapsedMs = Math.round(performance.now() - started);

  return {
    model,
    processor,
    totalBytes,
    cached: !sawDownload,
    elapsedMs,
  };
}
