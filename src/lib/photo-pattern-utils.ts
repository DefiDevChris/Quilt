/**
 * Photo Pattern Engine — Orchestrates the photo-to-quilt-pattern pipeline
 *
 * Integrates with Web Worker for heavy processing while keeping
 * DOM-dependent operations on the main thread.
 *
 * Pipeline:
 * 1. Main Thread: DOM canvas operations, image loading, downscaling
 * 2. Main Thread: Perspective correction (requires OpenCV transforms)
 * 3. Web Worker: Full detection pipeline (all 15 objectives)
 * 4. Main Thread: Finalize and return results
 */

import type {
  PipelineStep,
  PipelineStepStatus,
  DetectedPiece,
  WorkerResponseMessage,
  WorkerProgressMessage,
  DetectionOptions,
  QuiltDetectionConfig,
} from '@/lib/photo-pattern-types';
import {
  PHOTO_PATTERN_RESOLUTION_TIERS,
  PHOTO_PATTERN_MAX_IMAGE_DATA_SIZE,
  PHOTO_PATTERN_ABSOLUTE_MAX_DIMENSION,
} from '@/lib/constants';
import {
  autoDetectQuiltBoundary,
  computePerspectiveTransform,
  applyPerspectiveCorrection,
} from '@/lib/perspective-utils';
import { detectQuiltShape, detectEdgePieces } from '@/lib/piece-detection-utils';
import type { OpenCV, OpenCVMat } from '@/lib/opencv-loader';

// ── Types ──────────────────────────────────────────────────────────────────

/**
 * Lightweight reference to the corrected image for cross-component sharing.
 * Stores a Blob URL instead of raw ImageData to avoid Zustand state bloat
 * and React reconciliation lag.
 */
export interface CorrectedImageRef {
  url: string;
  width: number;
  height: number;
}

export interface PipelineResult {
  readonly pieces: readonly DetectedPiece[];
  /**
   * Blob URL pointing to the corrected image data.
   * Use URL.revokeObjectURL() when no longer needed to prevent memory leaks.
   */
  readonly correctedImageRef: CorrectedImageRef | null;
  readonly perspectiveApplied: boolean;
  /** Information about any image downscaling that occurred */
  readonly downscaleInfo: import('@/lib/photo-pattern-types').DownscaleInfo;
  /** Error message if pipeline failed */
  readonly error?: string;
}

// ── Web Worker Management ───────────────────────────────────────────────────

let detectionWorker: Worker | null = null;
let workerMessageId = 0;
let pendingMessageId: number | null = null;

function getDetectionWorker(): Worker {
  if (detectionWorker) {
    return detectionWorker;
  }

  detectionWorker = new Worker(new URL('./piece-detection.worker.ts', import.meta.url), {
    type: 'module',
  });

  return detectionWorker;
}

export function terminateDetectionWorker(): void {
  if (detectionWorker) {
    detectionWorker.terminate();
    detectionWorker = null;
    pendingMessageId = null;
  }
}

export function isDetectionWorkerAvailable(): boolean {
  return typeof Worker !== 'undefined';
}

// ── Pipeline Helpers ───────────────────────────────────────────────────────

const PIPELINE_STEP_NAMES: readonly string[] = [
  'Preprocessing image...',
  'Detecting grid structure...',
  'Finding seam lines...',
  'Identifying pieces...',
  'Extracting colors...',
  'Finalizing...',
];

export function createInitialPipeline(): PipelineStep[] {
  return PIPELINE_STEP_NAMES.map((name) => ({
    name,
    status: 'pending' as PipelineStepStatus,
  }));
}

export function advancePipelineStep(
  steps: readonly PipelineStep[],
  index: number,
  status: PipelineStepStatus,
  message?: string
): PipelineStep[] {
  return steps.map((step, i) => {
    if (i !== index) return step;
    return { ...step, status, ...(message !== undefined ? { message } : {}) };
  });
}

// ── Downscale ───────────────────────────────────────────────────────────────

/**
 * Calculates the maximum dimension that keeps ImageData under the memory budget.
 * ImageData = width * height * 4 bytes (RGBA)
 */
function calculateMaxDimensionForMemoryBudget(
  originalWidth: number,
  originalHeight: number,
  maxBytes: number
): number {
  const aspectRatio = originalWidth / originalHeight;
  // Solve for maxDimension where: maxDim * (maxDim/aspect) * 4 <= maxBytes
  // For portrait: maxDimension is height
  // For landscape: maxDimension is width
  // Use max(ar, 1/ar) so the formula is correct for both portrait and landscape
  const effectiveRatio = Math.max(aspectRatio, 1 / aspectRatio);
  const maxDimensionFromMemory = Math.floor(Math.sqrt((maxBytes / 4) * effectiveRatio));
  return Math.min(maxDimensionFromMemory, PHOTO_PATTERN_ABSOLUTE_MAX_DIMENSION);
}

/**
 * Gets the target max dimension based on piece scale and memory constraints.
 * - Uses piece-scale-aware resolution tiers
 * - Ensures we stay within memory budget
 * - Never exceeds absolute maximum
 */
function getTargetMaxDimension(
  originalWidth: number,
  originalHeight: number,
  pieceScale: QuiltDetectionConfig['pieceScale'] = 'standard'
): number {
  const tierMax = PHOTO_PATTERN_RESOLUTION_TIERS[pieceScale];
  const memoryMax = calculateMaxDimensionForMemoryBudget(
    originalWidth,
    originalHeight,
    PHOTO_PATTERN_MAX_IMAGE_DATA_SIZE
  );

  // Use the more conservative of the two limits
  return Math.min(tierMax, memoryMax);
}

export interface DownscaleResult {
  width: number;
  height: number;
  scaled: boolean;
  originalWidth: number;
  originalHeight: number;
  scaleFactor: number;
}

/**
 * Calculates downscale parameters WITHOUT creating any Mats or ImageData.
 * This allows us to downscale on canvas BEFORE expensive OpenCV operations.
 */
export function calculateDownscaleParams(
  originalWidth: number,
  originalHeight: number,
  pieceScale: QuiltDetectionConfig['pieceScale'] = 'standard'
): DownscaleResult {
  const targetMaxDimension = getTargetMaxDimension(originalWidth, originalHeight, pieceScale);
  const longest = Math.max(originalWidth, originalHeight);

  if (longest <= targetMaxDimension) {
    return {
      width: originalWidth,
      height: originalHeight,
      scaled: false,
      originalWidth,
      originalHeight,
      scaleFactor: 1,
    };
  }

  const ratio = targetMaxDimension / longest;
  return {
    width: Math.round(originalWidth * ratio),
    height: Math.round(originalHeight * ratio),
    scaled: true,
    originalWidth,
    originalHeight,
    scaleFactor: ratio,
  };
}

// ── Worker-based Detection ─────────────────────────────────────────────────

async function detectPiecesWithWorker(
  imageData: ImageData,
  options: DetectionOptions,
  onProgress: (step: number, status: 'running' | 'complete' | 'error', message?: string) => void
): Promise<DetectedPiece[]> {
  const worker = getDetectionWorker();
  const currentMessageId = ++workerMessageId;
  pendingMessageId = currentMessageId;

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Detection worker timed out after 120s'));
    }, 120_000);

    const messageHandler = (event: MessageEvent) => {
      const data = event.data as {
        type: string;
        _messageId?: number;
        pieces?: DetectedPiece[];
        error?: string;
        step?: number;
        status?: string;
        message?: string;
      };

      // Ignore responses for superseded requests
      if (
        pendingMessageId !== null &&
        data._messageId !== undefined &&
        data._messageId !== pendingMessageId
      ) {
        return;
      }

      if (data.type === 'PROGRESS') {
        onProgress(data.step!, data.status as 'running' | 'complete' | 'error', data.message);
        return;
      }

      if (data.type === 'DETECT_PIECES_RESULT') {
        cleanup();
        resolve(data.pieces!);
        return;
      }

      if (data.type === 'DETECT_PIECES_ERROR') {
        cleanup();
        reject(new Error(data.error));
        return;
      }
    };

    const errorHandler = () => {
      cleanup();
      reject(new Error('Detection worker encountered an error'));
    };

    const cleanup = () => {
      clearTimeout(timeout);
      worker.removeEventListener('message', messageHandler);
      worker.removeEventListener('error', errorHandler);
    };

    worker.addEventListener('message', messageHandler);
    worker.addEventListener('error', errorHandler);

    // Transfer ImageData's underlying buffer to worker (moves, doesn't copy)
    // This prevents memory duplication - the main thread loses access to the buffer
    const transferableObjects: Transferable[] = [];
    if (imageData.data.buffer) {
      transferableObjects.push(imageData.data.buffer);
    }

    worker.postMessage(
      {
        type: 'DETECT_PIECES',
        imageData,
        ...options,
        _messageId: currentMessageId,
      },
      transferableObjects
    );
  });
}

// ── Detection Pipeline ─────────────────────────────────────────────────────

export interface RunDetectionPipelineOptions {
  /** Detection sensitivity (0.2 - 2.0) */
  sensitivity?: number;
  /** Enable shape clustering (Objective 2) */
  enableShapeClustering?: boolean;
  /** Detect nested shapes for appliqué (Objective 10) */
  detectNestedShapes?: boolean;
  /** Enable CLAHE illumination normalization (Objective 5) */
  enableCLAHE?: boolean;
  /** Enable Laplacian sharpening (Objective 4) */
  enableSharpening?: boolean;
  /** Enable topstitching removal (Objective 6) */
  removeTopstitching?: boolean;
  /** Enable Sobel gradient filtering (Objective 8) */
  useSobelGradient?: boolean;
  /** Enable Watershed for low-contrast seams (Objective 9) */
  enableWatershed?: boolean;
  /** Minimum solidity for artifact rejection (Objective 11) */
  minSolidity?: number;
  /** Maximum aspect ratio for sliver rejection (Objective 12) */
  maxAspectRatio?: number;
  /** Quilt scan configuration / priors */
  scanConfig?: QuiltDetectionConfig;
}

export interface ImageSource {
  imageData: ImageData;
  width: number;
  height: number;
}

function createImageSourceFromElement(
  cv: OpenCV,
  imageElement: HTMLImageElement,
  targetWidth: number,
  targetHeight: number
): ImageSource {
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d', { alpha: false })!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(
    imageElement,
    0,
    0,
    imageElement.naturalWidth,
    imageElement.naturalHeight,
    0,
    0,
    targetWidth,
    targetHeight
  );

  const mat = cv.imread(canvas);
  canvas.width = 0;
  canvas.height = 0;

  const outCanvas = document.createElement('canvas');
  outCanvas.width = mat.cols;
  outCanvas.height = mat.rows;
  cv.imshow(outCanvas, mat);
  mat.delete();

  const outCtx = outCanvas.getContext('2d')!;
  const imageData = outCtx.getImageData(0, 0, outCanvas.width, outCanvas.height);
  outCanvas.width = 0;
  outCanvas.height = 0;

  return { imageData, width: targetWidth, height: targetHeight };
}

function matToImageData(cv: OpenCV, mat: OpenCVMat): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = mat.cols;
  canvas.height = mat.rows;
  cv.imshow(canvas, mat);
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  canvas.width = 0;
  canvas.height = 0;
  return imageData;
}

export async function runDetectionPipeline(
  cv: OpenCV,
  imageElement: HTMLImageElement,
  onProgress: (steps: PipelineStep[]) => void,
  options: RunDetectionPipelineOptions = {}
): Promise<PipelineResult> {
  const {
    sensitivity = 1.0,
    enableShapeClustering = true,
    detectNestedShapes = false,
    enableCLAHE = true,
    enableSharpening = true,
    removeTopstitching = true,
    useSobelGradient = true,
    enableWatershed = true,
    minSolidity = 0.5,
    maxAspectRatio = 20,
    scanConfig,
  } = options;

  let steps = createInitialPipeline();

  const advance = (index: number, status: PipelineStepStatus, message?: string) => {
    steps = advancePipelineStep(steps, index, status, message);
    onProgress(steps);
  };

  const onWorkerProgress = (
    step: number,
    status: 'running' | 'complete' | 'error',
    message?: string
  ) => {
    if (step >= 2 && step <= 4) {
      advance(step, status, message);
    }
  };

  let imageMat: OpenCVMat | null = null;
  let correctedMat: OpenCVMat | null = null;
  let transformMatrix: OpenCVMat | null = null;
  let downscaleParams: ReturnType<typeof calculateDownscaleParams> | null = null;

  try {
    // Step 0: Preprocessing (Main Thread)
    advance(0, 'running');

    // Calculate optimal target resolution based on piece scale and memory budget
    downscaleParams = calculateDownscaleParams(
      imageElement.naturalWidth,
      imageElement.naturalHeight,
      scanConfig?.pieceScale ?? 'standard'
    );

    const imageSource = createImageSourceFromElement(
      cv,
      imageElement,
      downscaleParams.width,
      downscaleParams.height
    );

    // Create mat from imageData - need to create a temporary canvas approach
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = imageSource.width;
    tempCanvas.height = imageSource.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) throw new Error('Failed to get canvas context');
    tempCtx.putImageData(imageSource.imageData, 0, 0);
    imageMat = cv.imread(tempCanvas);
    tempCanvas.width = 0;
    tempCanvas.height = 0;

    advance(0, 'complete');

    // Step 1: Detect grid / perspective (Main Thread)
    advance(1, 'running');

    const corners = autoDetectQuiltBoundary(cv, imageMat);
    let perspectiveApplied = false;

    if (corners) {
      transformMatrix = computePerspectiveTransform(cv, corners, imageMat.cols, imageMat.rows);
      correctedMat = applyPerspectiveCorrection(
        cv,
        imageMat,
        transformMatrix,
        imageMat.cols,
        imageMat.rows
      );
      perspectiveApplied = true;
    } else {
      correctedMat = imageMat.clone();
    }

    advance(1, 'complete');

    // Steps 2-4: Detection in Web Worker (progress updated by worker callbacks)
    advance(2, 'running');

    // Extract ImageData from corrected mat
    const workerCanvas = document.createElement('canvas');
    workerCanvas.width = correctedMat.cols;
    workerCanvas.height = correctedMat.rows;
    cv.imshow(workerCanvas, correctedMat);
    const workerCtx = workerCanvas.getContext('2d');
    if (!workerCtx) throw new Error('Failed to get canvas context');
    const imageData = workerCtx.getImageData(0, 0, workerCanvas.width, workerCanvas.height);

    // Convert corrected image to a Blob URL for lightweight Zustand storage
    const correctedImageRef: CorrectedImageRef | null = await new Promise<CorrectedImageRef | null>(
      (resolve) => {
        workerCanvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({
                url: URL.createObjectURL(blob),
                width: workerCanvas.width,
                height: workerCanvas.height,
              });
            } else {
              resolve(null);
            }
          },
          'image/jpeg',
          0.92
        );
      }
    );

    workerCanvas.width = 0;
    workerCanvas.height = 0;

    if (!isDetectionWorkerAvailable()) {
      throw new Error('Web Workers not supported');
    }

    // Send to worker with transferable ImageData (buffer is moved, not copied)
    const pieces = await detectPiecesWithWorker(
      imageData,
      {
        sensitivity,
        enableShapeClustering,
        detectNestedShapes,
        enableCLAHE,
        enableSharpening,
        removeTopstitching,
        useSobelGradient,
        enableWatershed,
        minSolidity,
        maxAspectRatio,
        quiltConfig: scanConfig,
      },
      onWorkerProgress
    );

    advance(2, 'complete');
    advance(3, 'complete');
    advance(4, 'complete');

    // Step 5: Finalizing
    advance(5, 'running');

    // Detect quilt shape and mark edge pieces for non-rectangular quilts
    let piecesWithEdgeInfo: DetectedPiece[] = pieces;
    if (scanConfig?.quiltShape && scanConfig.quiltShape !== 'rectangular') {
      const boundary = detectQuiltShape(pieces, correctedMat.cols, correctedMat.rows);
      piecesWithEdgeInfo = detectEdgePieces(pieces, boundary);
    }

    advance(5, 'complete');

    // Build downscale info for consumer feedback
    const downscaleInfo: import('@/lib/photo-pattern-types').DownscaleInfo = {
      scaled: downscaleParams?.scaled ?? false,
      originalWidth: downscaleParams?.originalWidth ?? imageElement.naturalWidth,
      originalHeight: downscaleParams?.originalHeight ?? imageElement.naturalHeight,
      finalWidth: downscaleParams?.width ?? imageElement.naturalWidth,
      finalHeight: downscaleParams?.height ?? imageElement.naturalHeight,
      scaleFactor: downscaleParams?.scaleFactor ?? 1,
      reason: downscaleParams?.scaled
        ? scanConfig?.pieceScale === 'tiny'
          ? 'piece_scale'
          : 'memory_budget'
        : 'none',
    };

    return {
      pieces: piecesWithEdgeInfo,
      correctedImageRef,
      perspectiveApplied,
      downscaleInfo,
    };
  } catch (error) {
    const runningIndex = steps.findIndex((s) => s.status === 'running');
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (runningIndex >= 0) {
      advance(runningIndex, 'error', errorMessage);
    }

    return {
      pieces: [],
      correctedImageRef: null,
      perspectiveApplied: false,
      downscaleInfo: {
        scaled: false,
        originalWidth: imageElement.naturalWidth,
        originalHeight: imageElement.naturalHeight,
        finalWidth: imageElement.naturalWidth,
        finalHeight: imageElement.naturalHeight,
        scaleFactor: 1,
        reason: 'none',
      },
      error: errorMessage,
    };
  } finally {
    // Always delete imageMat if it differs from correctedMat (or if correctedMat is null)
    if (imageMat && imageMat !== correctedMat) {
      imageMat.delete();
    }
    if (correctedMat) {
      correctedMat.delete();
    }
    if (transformMatrix) {
      transformMatrix.delete();
    }
  }
}
