'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { WorkerOutput } from '@/lib/photo-to-design/types';
import { runSeamEngine } from '@/lib/photo-to-design/seam-engine';
import { usePhotoDesignStore } from '@/stores/photoDesignStore';

/**
 * React hook managing Photo-to-Design seam engine lifecycle.
 * Runs in a Web Worker when available, falls back to main thread.
 */
export function usePhotoToDesign() {
  const workerRef = useRef<Worker | null>(null);
  const generationRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const gridSpec = usePhotoDesignStore((s) => s.gridSpec);

  useEffect(() => {
    if (typeof Worker === 'undefined') return;
    try {
      workerRef.current = new Worker(new URL('@/lib/photo-to-design/worker.ts', import.meta.url));
    } catch {
      workerRef.current = null;
    }
    return () => { workerRef.current?.terminate(); workerRef.current = null; };
  }, []);

  const process = useCallback(
    (imageData: ImageData) => {
      const generation = ++generationRef.current;
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

      abortRef.current?.abort();
      const rngSeed = Date.now() + generation;

      if (workerRef.current) {
        const worker = workerRef.current;

        worker.onmessage = (event: MessageEvent<WorkerOutput>) => {
          const output = event.data;
          if (output.generation !== generation) return;
          const s = usePhotoDesignStore.getState();

          if (output.type === 'success' && output.result) {
            s.setResult(output.result);
            s.setProcessingProgress(null);
            s.setIsProcessing(false);
          } else if (output.type === 'progress' && output.progress) {
            s.setProcessingProgress(output.progress);
          } else if (output.type === 'error') {
            s.setProcessingError(output.error ?? 'Unknown error');
            s.setProcessingProgress(null);
            s.setIsProcessing(false);
          }
        };

        worker.onerror = (event) => {
          if (generation !== generationRef.current) return;
          const s = usePhotoDesignStore.getState();
          s.setProcessingError(event.message || 'Worker error');
          s.setProcessingProgress(null);
          s.setIsProcessing(false);
        };

        worker.postMessage({
          imageData: { data: imageData.data, width: imageData.width, height: imageData.height },
          gridSpec: currentGridSpec,
          rngSeed,
          generation,
        });
      } else {
        abortRef.current = new AbortController();
        setTimeout(async () => {
          try {
            const output = await runSeamEngine({
              pixels: imageData.data,
              width: imageData.width,
              height: imageData.height,
              gridSpec: currentGridSpec,
              rngSeed,
              abortSignal: abortRef.current?.signal,
              onProgress: (stage, stageName, percentage) => {
                if (generation !== generationRef.current) return;
                usePhotoDesignStore.getState().setProcessingProgress({ stage, stageName, percentage });
              },
            });
            if (generation !== generationRef.current) return;
            const s = usePhotoDesignStore.getState();
            s.setResult(output);
            s.setProcessingProgress(null);
            s.setIsProcessing(false);
          } catch (err) {
            if (generation !== generationRef.current) return;
            if (err instanceof DOMException && err.name === 'AbortError') {
              usePhotoDesignStore.getState().setIsProcessing(false);
              return;
            }
            const s = usePhotoDesignStore.getState();
            s.setProcessingError(err instanceof Error ? err.message : 'Unknown error');
            s.setProcessingProgress(null);
            s.setIsProcessing(false);
          }
        }, 0);
      }
    },
    [gridSpec]
  );

  const abort = useCallback(() => {
    generationRef.current++;
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'abort', generation: generationRef.current });
    }
    abortRef.current?.abort();
    const s = usePhotoDesignStore.getState();
    s.setProcessingProgress(null);
    s.setIsProcessing(false);
  }, []);

  useEffect(() => {
    return () => { workerRef.current?.terminate(); abortRef.current?.abort(); };
  }, []);

  return { process, abort };
}
