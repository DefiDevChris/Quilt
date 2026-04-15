import type { InMessage, OutMessage } from './messages';
import type { ProcessParams, Patch, ShapeTemplate, DetectedGrid } from '@/types/photo-to-design';
import { usePhotoDesignStore } from '@/stores/photoDesignStore';

/**
 * Main-thread wrapper for the Photo-to-Design Web Worker.
 *
 * - Manages worker lifecycle (spawn, terminate).
 * - Routes outgoing calls and incoming responses via requestId.
 * - Debounces preview-quality process calls to 100 ms.
 */
export class PhotoDesignClient {
  private worker: Worker;
  private pending = new Map<string, { resolve: (value: unknown) => void; reject: (error: Error) => void }>();
  private previewDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    // Classic worker (not module) so that importScripts works for OpenCV.
    this.worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'classic' });
    this.worker.onmessage = (e: MessageEvent<OutMessage>) => this.route(e.data);
    this.worker.onerror = (e) => this.panic(e);
  }

  /**
   * Generic call to the worker. Returns a promise that resolves when the
   * corresponding response/error message arrives.
   */
  call<T>(type: InMessage['type'], payload?: unknown, transfer: Transferable[] = []): Promise<T> {
    const requestId = crypto.randomUUID();
    return new Promise<T>((resolve, reject) => {
      this.pending.set(requestId, { resolve: resolve as (value: unknown) => void, reject });
      this.worker.postMessage({ type, requestId, payload } as InMessage, transfer);
    });
  }

  /**
   * Debounce preview-quality process calls to 100 ms.
   * Rapid slider drags will only trigger one worker message per window.
   */
  requestPreview(params: ProcessParams) {
    if (this.previewDebounceTimer !== null) {
      clearTimeout(this.previewDebounceTimer);
    }
    this.previewDebounceTimer = setTimeout(() => {
      this.previewDebounceTimer = null;
      this.call('process', { params, quality: 'preview' });
    }, 100);
  }

  /** Full-quality process calls go through immediately (no debounce). */
  requestFull(params: ProcessParams): Promise<void> {
    return this.call('process', { params, quality: 'full' });
  }

  // ── Internal ───────────────────────────────────────────────────────────

  private route(msg: OutMessage) {
    // Resolve pending promise for typed response messages.
    if (msg.type === 'response') {
      const p = this.pending.get(msg.requestId);
      if (p) {
        p.resolve(msg.payload);
        this.pending.delete(msg.requestId);
      }
      return;
    }

    // Broadcast messages that update the store.
    switch (msg.type) {
      case 'ready':
        usePhotoDesignStore.getState().setWorkerReady(true);
        break;

      case 'progress':
        usePhotoDesignStore.getState().setProcessing(true, msg.stage, msg.percent);
        break;

      case 'previewResult':
        usePhotoDesignStore.getState().setPreviewResult(msg.outlines, msg.colors, msg.patchCount);
        usePhotoDesignStore.getState().setProcessing(false);
        break;

      case 'fullResult':
        usePhotoDesignStore.getState().setFullResult(msg.patches, msg.templates, msg.grid);
        usePhotoDesignStore.getState().setProcessing(false);
        break;

      case 'editResult':
        // Phase 6: update patches after manual edit
        usePhotoDesignStore.getState().setProcessing(false);
        break;

      case 'undoRedoState':
        usePhotoDesignStore.getState().setUndoRedoState(msg.canUndo, msg.canRedo);
        break;

      case 'error':
        usePhotoDesignStore.getState().setError({
          stage: msg.stage,
          message: msg.message,
          recoverable: msg.recoverable,
        });
        usePhotoDesignStore.getState().setProcessing(false);
        // Reject the pending promise if one exists.
        {
          const p = this.pending.get(msg.requestId);
          if (p) {
            p.reject(new Error(msg.message));
            this.pending.delete(msg.requestId);
          }
        }
        break;
    }
  }

  /**
   * Worker crash handler. Rejects all pending promises and attempts to
   * respawn a fresh worker.
   */
  private panic(e: ErrorEvent) {
    console.error('[PhotoDesignClient] Worker crash:', e);
    const error = new Error(`Worker crashed: ${e.message}`);
    for (const [, p] of this.pending) {
      p.reject(error);
    }
    this.pending.clear();

    // Surface error to store.
    usePhotoDesignStore.getState().setError({
      stage: 'worker',
      message: 'Processing crashed. Restarting…',
      recoverable: true,
    });

    // Respawn: terminate dead worker, create a new one, re-init.
    this.worker.terminate();
    this.worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'classic' });
    this.worker.onmessage = (ev: MessageEvent<OutMessage>) => this.route(ev.data);
    this.worker.onerror = (ev) => this.panic(ev);

    // Re-initialize.
    this.call('init').catch(() => {
      // If re-init also fails, the error is already surfaced.
    });
  }

  /** Terminate the worker and clean up. */
  dispose() {
    if (this.previewDebounceTimer !== null) {
      clearTimeout(this.previewDebounceTimer);
      this.previewDebounceTimer = null;
    }
    this.worker.terminate();
    this.pending.clear();
  }
}
