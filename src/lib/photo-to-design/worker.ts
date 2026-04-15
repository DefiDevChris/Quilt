// ============================================================================
// Web Worker for Photo-to-Design Seam Engine
//
// Two message types:
//   - 'preload'  → eagerly fetch SAM2 weights + processor (called when user
//                  drops an image, so the model is warm by the time they
//                  reach the review step).
//   - 'segment'  → run the full pipeline:
//                    prescale → hash → SAM auto-mask → vectorize → canonicalize
//                  The polygon invariant gate (U7) slots in between canonicalize
//                  and the `success` postMessage once implemented.
//
// A single generation counter per session lets the UI ignore stale results
// when the user changes inputs mid-flight.
// ============================================================================

/// <reference lib="webworker" />

import type { WorkerInput, WorkerOutput } from './types';
import { loadSam, WebGpuUnavailableError } from './sam-loader';
import { prescaleImage } from './stages/prescale';
import { sha256Base64 } from './stages/hash';
import { segmentWithSam } from './stages/sam-segment';
import { vectorizeMasks } from './stages/vectorize';
import { canonicalizePatches } from './stages/canonicalize';
import { PolygonInvariantError, validatePatches } from './stages/validate';
import { runInteractiveDecode } from './stages/interactive-decoder';

const ctx = self as unknown as DedicatedWorkerGlobalScope;

const abortControllers = new Map<number, AbortController>();

ctx.onmessage = async (event: MessageEvent<WorkerInput>) => {
  const msg = event.data;

  switch (msg.type) {
    case 'preload':
      await handlePreload(msg.generation);
      return;

    case 'segment':
      await handleSegment(msg);
      return;

    case 'interactive':
      await handleInteractive(msg);
      return;

    case 'abort': {
      const ac = abortControllers.get(msg.generation);
      ac?.abort();
      abortControllers.delete(msg.generation);
      return;
    }
  }
};

async function handlePreload(generation: number): Promise<void> {
  try {
    const loaded = await loadSam((progress) => {
      ctx.postMessage({
        type: 'model-progress',
        generation,
        progress,
      } satisfies WorkerOutput);
    });

    ctx.postMessage({
      type: 'ready',
      generation,
      cached: loaded.cached,
      totalBytes: loaded.totalBytes,
      elapsedMs: loaded.elapsedMs,
    } satisfies WorkerOutput);
  } catch (err) {
    ctx.postMessage({
      type: 'error',
      generation,
      error: err instanceof Error ? err.message : 'Unknown preload error',
      errorKind: err instanceof WebGpuUnavailableError ? 'webgpu-missing' : 'preload',
    } satisfies WorkerOutput);
  }
}

async function handleSegment(msg: Extract<WorkerInput, { type: 'segment' }>): Promise<void> {
  const { generation, imageData, gridSpec } = msg;
  const ac = new AbortController();
  abortControllers.set(generation, ac);
  const started = performance.now();

  try {
    // Stage 0 — pre-scale. Guarantees we never hand a 4000×3000 buffer to
    // SAM or OpenCV (OOM prevention).
    postProgress(generation, 0, 'prescale', 5);
    const scaled = prescaleImage(imageData.data, imageData.width, imageData.height);

    // Stage 1 — SAM encode + auto-mask. The hash lets repeated runs on the
    // same image skip re-encoding (~seconds on WebGPU).
    postProgress(generation, 1, 'encode', 15);
    const imageHash = await sha256Base64(scaled.imageData.data);

    postProgress(generation, 1, 'autoMask', 20);
    const rawMasks = await segmentWithSam(scaled.imageData, imageHash, {
      abortSignal: ac.signal,
      onProgress: (completed, total) => {
        // Map [0, total] onto percentage 20..70 so later stages have room.
        const pct = 20 + Math.round((completed / total) * 50);
        postProgress(generation, 1, 'autoMask', pct);
      },
    });
    checkAbort(ac.signal);

    // Stage 2 — morphology cleanup + Douglas–Peucker simplification.
    postProgress(generation, 2, 'vectorize', 75);
    const vectorized = await vectorizeMasks(rawMasks);
    checkAbort(ac.signal);

    // Map polygons back to the original-image coordinate space so the user's
    // gridSpec (calibrated against the un-prescaled image) and the downstream
    // SVG overlay (viewBox = original image) all share one frame of reference.
    const upscaled =
      scaled.scale === 1
        ? vectorized
        : vectorized.map((v) => ({
            ...v,
            vertices: v.vertices.map((p) => ({ x: p.x * scaled.scale, y: p.y * scaled.scale })),
            bbox: {
              minX: v.bbox.minX * scaled.scale,
              minY: v.bbox.minY * scaled.scale,
              maxX: v.bbox.maxX * scaled.scale,
              maxY: v.bbox.maxY * scaled.scale,
              width: v.bbox.width * scaled.scale,
              height: v.bbox.height * scaled.scale,
            },
          }));

    // Stage 3 — grid snap + template dedup.
    postProgress(generation, 3, 'canonicalize', 90);
    const patches = canonicalizePatches(upscaled, gridSpec);
    checkAbort(ac.signal);

    // Stage 4 — polygon invariant gate. Last line of defence before the
    // downstream Clipper.js seam-allowance pipeline sees the output.
    postProgress(generation, 4, 'validate', 100);
    validatePatches(patches);

    ctx.postMessage({
      type: 'success',
      generation,
      result: {
        patches,
        gridSpec,
        processingTime: Math.round(performance.now() - started),
      },
    } satisfies WorkerOutput);
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') return;
    ctx.postMessage({
      type: 'error',
      generation,
      error:
        err instanceof PolygonInvariantError
          ? "Couldn't produce clean patches — try adjusting Detail."
          : err instanceof Error
            ? err.message
            : 'Unknown segmentation error',
      errorKind: 'segment',
    } satisfies WorkerOutput);
  } finally {
    abortControllers.delete(generation);
  }
}

async function handleInteractive(
  msg: Extract<WorkerInput, { type: 'interactive' }>
): Promise<void> {
  const { generation, imageData, gridSpec, point } = msg;
  const ac = new AbortController();
  abortControllers.set(generation, ac);

  try {
    postProgress(generation, 0, 'prescale', 10);
    const scaled = prescaleImage(imageData.data, imageData.width, imageData.height);
    const imageHash = await sha256Base64(scaled.imageData.data);

    postProgress(generation, 1, 'interactive', 60);
    const scaledPoint = {
      x: point.x / scaled.scale,
      y: point.y / scaled.scale,
    };
    checkAbort(ac.signal);

    const candidate = await runInteractiveDecode({
      imageData: scaled.imageData,
      imageHash,
      point: scaledPoint,
      gridSpec,
      scale: scaled.scale,
    });
    checkAbort(ac.signal);

    ctx.postMessage({
      type: 'interactive-result',
      generation,
      candidate,
    } satisfies WorkerOutput);
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') return;
    ctx.postMessage({
      type: 'error',
      generation,
      error:
        err instanceof PolygonInvariantError
          ? "Couldn't produce a clean patch from that click — try again."
          : err instanceof Error
            ? err.message
            : 'Interactive decode failed',
      errorKind: 'segment',
    } satisfies WorkerOutput);
  } finally {
    abortControllers.delete(generation);
  }
}

function postProgress(
  generation: number,
  stage: number,
  stageName: string,
  percentage: number
): void {
  ctx.postMessage({
    type: 'progress',
    generation,
    progress: { stage, stageName, percentage },
  } satisfies WorkerOutput);
}

function checkAbort(signal: AbortSignal): void {
  if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
}

export {};
