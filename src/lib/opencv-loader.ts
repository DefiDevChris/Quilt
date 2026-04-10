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

  console.log('[OpenCVLoader] Initializing worker...');

  initPromise = new Promise<void>((resolve, reject) => {
    const w = getWorker();

    const onMessage = (e: MessageEvent) => {
      console.log('[OpenCVLoader] Worker message:', e.data.type, e.data.message || '');
      if (e.data.type === 'ready') {
        w.removeEventListener('message', onMessage);
        w.removeEventListener('error', onError);
        console.log('[OpenCVLoader] Worker ready');
        resolve();
      } else if (e.data.type === 'error') {
        w.removeEventListener('message', onMessage);
        w.removeEventListener('error', onError);
        initPromise = null;
        console.error('[OpenCVLoader] Worker error:', e.data.message);
        reject(new Error(e.data.message));
      }
    };

    const onError = (e: ErrorEvent) => {
      w.removeEventListener('message', onMessage);
      w.removeEventListener('error', onError);
      initPromise = null;
      console.error('[OpenCVLoader] Worker crashed:', e.message);
      reject(new Error(`Worker error: ${e.message}`));
    };

    w.addEventListener('message', onMessage);
    w.addEventListener('error', onError);
    console.log('[OpenCVLoader] Sending init message to worker');
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
    // 60-second timeout so a stuck worker surfaces instead of hanging silently
    const timeoutHandle = setTimeout(() => {
      w.removeEventListener('message', onMessage);
      w.removeEventListener('error', onError);
      console.error('[OpenCVLoader] Detection timed out after 60s');
      reject(new Error('Detection timed out after 60s — worker may have hung'));
    }, 60_000);

    const cleanup = () => {
      clearTimeout(timeoutHandle);
      w.removeEventListener('message', onMessage);
      w.removeEventListener('error', onError);
    };

    const onMessage = (e: MessageEvent) => {
      const msg = e.data;

      if (msg.type === 'progress') {
        console.log('[OpenCVLoader] progress', msg.step, msg.status, msg.message);
        if (onProgress) onProgress(msg.step, msg.status, msg.message);
        return;
      }

      if (msg.type === 'result') {
        console.log(
          '[OpenCVLoader] RESULT received — pieces:',
          Array.isArray(msg.pieces) ? msg.pieces.length : '(not array)',
          'perspectiveApplied:',
          msg.perspectiveApplied
        );
        cleanup();
        resolve({
          pieces: msg.pieces,
          perspectiveApplied: msg.perspectiveApplied,
        });
        return;
      }

      if (msg.type === 'error') {
        console.error('[OpenCVLoader] Worker error message:', msg.message);
        cleanup();
        reject(new Error(msg.message));
        return;
      }

      console.warn('[OpenCVLoader] Unhandled worker message type:', msg.type, msg);
    };

    const onError = (e: ErrorEvent) => {
      console.error('[OpenCVLoader] Worker crashed:', e.message, e.filename, e.lineno);
      cleanup();
      // Worker crashed (OOM, etc.) — reset so next call spawns a fresh one
      worker = null;
      initPromise = null;
      reject(new Error(`Detection worker crashed: ${e.message || 'out of memory'}`));
    };

    w.addEventListener('message', onMessage);
    w.addEventListener('error', onError);

    // Transfer the underlying ArrayBuffer (zero-copy to worker)
    const buffer = imageData.data.buffer.slice(0);
    console.log(
      '[OpenCVLoader] Sending detect message — buffer bytes:',
      buffer.byteLength,
      'dims:',
      imageData.width,
      'x',
      imageData.height
    );
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
