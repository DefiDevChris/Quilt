'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { Point, WorkerInput, WorkerOutput } from '@/lib/photo-to-design/types';
import { usePhotoDesignStore } from '@/stores/photoDesignStore';

/**
 * React hook managing the Photo-to-Design seam engine.
 *
 * Workers are required — desktop browsers have supported them for years and
 * the photo-to-design feature is desktop-only. If `Worker` is undefined at
 * mount time, the hook surfaces a clear error instead of trying a main-thread
 * fallback (which wouldn't work anyway since the SAM pipeline hard-requires
 * WebGPU and OpenCV's `importScripts` loader).
 */
export function usePhotoToDesign() {
  const workerRef = useRef<Worker | null>(null);
  const generationRef = useRef(0);

  useEffect(() => {
    if (typeof Worker === 'undefined') {
      const s = usePhotoDesignStore.getState();
      s.setModelStatus('error');
      s.setModelError("Your browser doesn't support the photo-to-design engine.");
      return;
    }
    try {
      workerRef.current = new Worker(new URL('@/lib/photo-to-design/worker.ts', import.meta.url), {
        type: 'module',
      });
      workerRef.current.onmessage = (event: MessageEvent<WorkerOutput>) => {
        handleMessage(event.data);
      };
      workerRef.current.onerror = (event) => {
        const s = usePhotoDesignStore.getState();
        s.setModelStatus('error');
        s.setModelError(event.message || 'Worker error');
        s.setIsProcessing(false);
        s.setProcessingProgress(null);
      };
    } catch (err) {
      const s = usePhotoDesignStore.getState();
      s.setModelStatus('error');
      s.setModelError(err instanceof Error ? err.message : 'Could not start worker');
    }
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  const preload = useCallback(() => {
    const worker = workerRef.current;
    if (!worker) return;

    const s = usePhotoDesignStore.getState();
    // Don't re-preload if already loading, ready, or in an unrecoverable state.
    if (
      s.modelStatus === 'loading' ||
      s.modelStatus === 'ready' ||
      s.modelStatus === 'webgpu-missing'
    ) {
      return;
    }

    s.setModelStatus('loading');
    s.setModelError(null);
    const generation = ++generationRef.current;
    worker.postMessage({ type: 'preload', generation } satisfies WorkerInput);
  }, []);

  const process = useCallback((imageData: ImageData) => {
    const worker = workerRef.current;
    if (!worker) return;

    const store = usePhotoDesignStore.getState();
    const currentGridSpec = store.gridSpec;
    if (!currentGridSpec) {
      store.setProcessingError('Grid spec not set. Calibrate the grid first.');
      store.setIsProcessing(false);
      return;
    }

    store.setResult(null);
    store.setProcessingError(null);
    store.setProcessingProgress({ stage: 0, stageName: 'starting', percentage: 0 });
    store.setIsProcessing(true);

    const generation = ++generationRef.current;
    const rngSeed = Date.now() + generation;

    worker.postMessage({
      type: 'segment',
      generation,
      imageData: {
        data: imageData.data,
        width: imageData.width,
        height: imageData.height,
      },
      gridSpec: currentGridSpec,
      rngSeed,
    } satisfies WorkerInput);
  }, []);

  const abort = useCallback(() => {
    const worker = workerRef.current;
    if (!worker) return;
    const generation = ++generationRef.current;
    worker.postMessage({ type: 'abort', generation } satisfies WorkerInput);
    const s = usePhotoDesignStore.getState();
    s.setProcessingProgress(null);
    s.setIsProcessing(false);
    s.setIsInteractiveProcessing(false);
  }, []);

  /**
   * Add a patch by clicking in the photo. Point is in ORIGINAL image
   * coordinates — the worker prescales internally.
   */
  const addPatchAtPoint = useCallback((imageData: ImageData, point: Point) => {
    const worker = workerRef.current;
    if (!worker) return;

    const store = usePhotoDesignStore.getState();
    if (store.isInteractiveProcessing || store.isProcessing) return;
    if (!store.result || !store.gridSpec) return;

    store.setProcessingError(null);
    store.setIsInteractiveProcessing(true);

    const generation = ++generationRef.current;
    worker.postMessage({
      type: 'interactive',
      generation,
      imageData: {
        data: imageData.data,
        width: imageData.width,
        height: imageData.height,
      },
      gridSpec: store.gridSpec,
      point,
    } satisfies WorkerInput);
  }, []);

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  return { preload, process, abort, addPatchAtPoint };
}

function handleMessage(output: WorkerOutput): void {
  const s = usePhotoDesignStore.getState();

  switch (output.type) {
    case 'model-progress':
      s.setModelDownloadProgress(output.progress);
      return;

    case 'ready':
      s.setModelStatus('ready');
      s.setModelDownloadProgress(null);
      return;

    case 'progress':
      s.setProcessingProgress(output.progress);
      return;

    case 'success':
      s.setResult(output.result);
      s.setProcessingProgress(null);
      s.setIsProcessing(false);
      return;

    case 'interactive-result':
      if (output.candidate) s.applyInteractivePatch(output.candidate);
      s.setIsInteractiveProcessing(false);
      return;

    case 'error':
      if (output.errorKind === 'webgpu-missing') {
        s.setModelStatus('webgpu-missing');
        s.setModelError(output.error);
        s.setModelDownloadProgress(null);
        return;
      }
      if (output.errorKind === 'preload') {
        s.setModelStatus('error');
        s.setModelError(output.error);
        s.setModelDownloadProgress(null);
        return;
      }
      // 'segment' / 'unknown' — pipeline failure (covers both full segments
      // and interactive decoder errors, since both share the same errorKind).
      s.setProcessingError(output.error);
      s.setProcessingProgress(null);
      s.setIsProcessing(false);
      s.setIsInteractiveProcessing(false);
      return;
  }
}
