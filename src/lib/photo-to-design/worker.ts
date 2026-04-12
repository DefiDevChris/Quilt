// ============================================================================
// Web Worker for Photo-to-Design Seam Engine
// Runs seam detection off the main thread with progress and abort support.
// ============================================================================

/// <reference lib="webworker" />

import type { WorkerInput, WorkerOutput } from './types';
import { runSeamEngine } from './seam-engine';

self.onmessage = async (event: MessageEvent<WorkerInput>) => {
  const { imageData, gridSpec, rngSeed, generation } = event.data;

  const abortController = new AbortController();

  const abortListener = (e: MessageEvent) => {
    if (e.data?.type === 'abort' && e.data.generation === generation) {
      abortController.abort();
      self.removeEventListener('message', abortListener);
    }
  };
  self.addEventListener('message', abortListener);

  try {
    const result = await runSeamEngine({
      pixels: imageData.data,
      width: imageData.width,
      height: imageData.height,
      gridSpec,
      rngSeed,
      abortSignal: abortController.signal,
      onProgress: (stage, stageName, percentage) => {
        self.postMessage({
          type: 'progress',
          progress: { stage, stageName, percentage },
          generation,
        } as WorkerOutput);
      },
    });

    self.postMessage({
      type: 'success',
      result,
      generation,
    } as WorkerOutput);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return;
    self.postMessage({
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown engine error',
      generation,
    } as WorkerOutput);
  } finally {
    self.removeEventListener('message', abortListener);
  }
};

export {};
