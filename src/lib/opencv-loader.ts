/**
 * OpenCV Detection Worker Manager
 *
 * All OpenCV operations run in a dedicated Web Worker at
 * /opencv/detection-worker.js. The worker loads a stripped OpenCV.js (~220KB)
 * that fetches its WASM binary (~7.6MB) as a separate file. This avoids:
 *
 *   1. Main thread crash from parsing/decoding a 10.4MB JS file with
 *      embedded base64 WASM
 *   2. CSP violations from data: URI WASM fetch
 *   3. Main thread jank during WASM compilation and detection
 *
 * If the worker OOMs during detection, the page survives and shows an error.
 */

import type { OpenCV } from '@/types/opencv-js';
import type { DetectedPiece } from '@/lib/photo-layout-types';

export type { OpenCV };
export type { OpenCVMat } from '@/types/opencv-js';

// ── Worker lifecycle ──────────────────────────────────────────────────────

let worker: Worker | null = null;
let initPromise: Promise<void> | null = null;
let messageId = 0;

function getWorker(): Worker {
  if (worker) return worker;
  worker = new Worker('/opencv/detection-worker.js');
  return worker;
}

/**
 * Ensures the worker is spawned and OpenCV WASM is initialized.
 * Safe to call multiple times — only initializes once.
 */
export function initOpenCvWorker(): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = new Promise<void>((resolve, reject) => {
    const w = getWorker();

    const onMessage = (e: MessageEvent) => {
      if (e.data.type === 'ready') {
        w.removeEventListener('message', onMessage);
        w.removeEventListener('error', onError);
        resolve();
      } else if (e.data.type === 'error') {
        w.removeEventListener('message', onMessage);
        w.removeEventListener('error', onError);
        initPromise = null;
        reject(new Error(e.data.message));
      }
    };

    const onError = (e: ErrorEvent) => {
      w.removeEventListener('message', onMessage);
      w.removeEventListener('error', onError);
      initPromise = null;
      reject(new Error(`Worker error: ${e.message}`));
    };

    w.addEventListener('message', onMessage);
    w.addEventListener('error', onError);
    w.postMessage({ type: 'init' });
  });

  return initPromise;
}

// ── Detection API ─────────────────────────────────────────────────────────

export interface WorkerDetectionResult {
  pieces: DetectedPiece[];
  perspectiveApplied: boolean;
}

export interface DetectionProgressCallback {
  (step: number, status: 'running' | 'complete' | 'error', message?: string): void;
}

/**
 * Sends image data to the Web Worker for detection.
 * The ArrayBuffer is transferred (zero-copy) to the worker.
 */
export async function detectInWorker(
  imageData: ImageData,
  options: Record<string, unknown> = {},
  onProgress?: DetectionProgressCallback
): Promise<WorkerDetectionResult> {
  await initOpenCvWorker();

  const w = getWorker();
  const id = ++messageId;

  return new Promise<WorkerDetectionResult>((resolve, reject) => {
    const onMessage = (e: MessageEvent) => {
      const msg = e.data;

      if (msg.type === 'progress' && onProgress) {
        onProgress(msg.step, msg.status, msg.message);
        return;
      }

      if (msg.type === 'result') {
        w.removeEventListener('message', onMessage);
        w.removeEventListener('error', onError);
        resolve({
          pieces: msg.pieces,
          perspectiveApplied: msg.perspectiveApplied,
        });
        return;
      }

      if (msg.type === 'error') {
        w.removeEventListener('message', onMessage);
        w.removeEventListener('error', onError);
        reject(new Error(msg.message));
        return;
      }
    };

    const onError = (e: ErrorEvent) => {
      w.removeEventListener('message', onMessage);
      w.removeEventListener('error', onError);
      // Worker crashed (OOM, etc.) — reset so next call spawns a fresh one
      worker = null;
      initPromise = null;
      reject(new Error(`Detection worker crashed: ${e.message || 'out of memory'}`));
    };

    w.addEventListener('message', onMessage);
    w.addEventListener('error', onError);

    // Transfer the underlying ArrayBuffer (zero-copy to worker)
    const buffer = imageData.data.buffer.slice(0);
    w.postMessage(
      {
        type: 'detect',
        id,
        imageData: buffer,
        width: imageData.width,
        height: imageData.height,
        options,
      },
      [buffer]
    );
  });
}

/**
 * Terminates the worker and frees all WASM memory.
 */
export function terminateOpenCvWorker(): void {
  if (worker) {
    worker.terminate();
    worker = null;
    initPromise = null;
  }
}
