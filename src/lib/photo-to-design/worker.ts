/// <reference lib="webworker" />
import type { InMessage, OutMessage } from './messages';
import type { Point } from '@/types/photo-to-design';
import { MatRegistry } from './cv/mat-registry';
import { waitForOpenCVReady } from './cv/opencv-init';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cv: any = null;
let reg: MatRegistry | null = null;
let correctedImageData: ImageData | null = null;

// ── Message router ─────────────────────────────────────────────────────────

self.onmessage = async (e: MessageEvent<InMessage>) => {
  const msg = e.data;
  try {
    switch (msg.type) {
      case 'init':
        return handleInit(msg.requestId);
      case 'loadImage':
        return handleLoadImage(msg.requestId, msg.payload);
      case 'autoDetectCorners':
        return handleAutoDetectCorners(msg.requestId, msg.payload);
      case 'warpPerspective':
        return handleWarpPerspective(msg.requestId, msg.payload);
      case 'process':
        return handleProcess(msg.requestId, msg.payload);
      case 'splitPatch':
        return handleSplitPatch(msg.requestId, msg.payload);
      case 'mergePatches':
        return handleMergePatches(msg.requestId, msg.payload);
      case 'floodFill':
        return handleFloodFill(msg.requestId, msg.payload);
      case 'undo':
        return handleUndo(msg.requestId);
      case 'redo':
        return handleRedo(msg.requestId);
      case 'dispose':
        return handleDispose(msg.requestId);
      default: {
        const _exhaustive: never = msg;
        post({
          type: 'error',
          requestId: (msg as InMessage).requestId,
          stage: 'router',
          message: `Unknown message type: ${(msg as { type: string }).type}`,
          recoverable: false,
        });
        void _exhaustive;
      }
    }
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    post({
      type: 'error',
      requestId: (msg as InMessage).requestId,
      stage: (msg as InMessage).type,
      message: error.message,
      recoverable: false,
    });
  }
};

// ── Handlers ───────────────────────────────────────────────────────────────

async function handleInit(requestId: string) {
  if (cv) {
    post({ type: 'response', requestId, payload: { ok: true } });
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  self.importScripts('/opencv/opencv.js');
  cv = (self as any).cv;
  await waitForOpenCVReady(cv);
  reg = new MatRegistry(cv);

  post({ type: 'response', requestId, payload: { ok: true } });
  post({ type: 'ready', requestId: '' });
}

function handleLoadImage(_requestId: string, payload: { imageData: ImageData }) {
  correctedImageData = payload.imageData;
}

function handleAutoDetectCorners(
  requestId: string,
  _payload: { imageData: ImageData },
) {
  // TODO: Canny + HoughLinesP → return 4 corners or null
  post({
    type: 'response',
    requestId,
    payload: { ok: false },
  });
}

function handleWarpPerspective(
  _requestId: string,
  _payload: { corners: Point[]; imageData: ImageData },
) {
  // TODO: getPerspectiveTransform + warpPerspective → return corrected ImageData
}

function handleProcess(
  _requestId: string,
  _payload: { params: unknown; quality: 'preview' | 'full' },
) {
  // TODO: 10-stage CV pipeline (Phase 3)
}

function handleSplitPatch(
  _requestId: string,
  _payload: { patchId: number; line: [Point, Point] },
) {
  // TODO: split patch along a line on label map
}

function handleMergePatches(
  _requestId: string,
  _payload: { aId: number; bId: number },
) {
  // TODO: merge two patches on label map
}

function handleFloodFill(
  _requestId: string,
  _payload: { point: Point; targetId: number },
) {
  // TODO: flood fill to reassign connected region
}

function handleUndo(_requestId: string) {
  // TODO: pop RLE label-map snapshot, re-extract contours
}

function handleRedo(_requestId: string) {
  // TODO: symmetric redo
}

function handleDispose(_requestId: string) {
  if (reg) {
    reg.deleteAll();
  }
  correctedImageData = null;
  cv = null;
  reg = null;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function post(msg: OutMessage) {
  (self as unknown as Worker).postMessage(msg);
}
