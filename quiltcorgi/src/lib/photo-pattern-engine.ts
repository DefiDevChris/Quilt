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
} from '@/lib/perspective-engine';
import { detectQuiltShape, detectEdgePieces } from '@/lib/piece-detection-engine';
import type { OpenCV, OpenCVMat } from '@/lib/opencv-loader';

// ── Types ──────────────────────────────────────────────────────────────────

export interface PipelineResult {
  readonly pieces: readonly DetectedPiece[];
  readonly correctedImageData: ImageData | null;
  readonly perspectiveApplied: boolean;
  /** Information about any image downscaling that occurred */
  readonly downscaleInfo: import('@/lib/photo-pattern-types').DownscaleInfo;
}

// ── Web Worker Management ───────────────────────────────────────────────────

let detectionWorker: Worker | null = null;
let workerMessageId = 0;

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

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Detection worker timed out after 120s'));
    }, 120_000);

    const messageHandler = (event: MessageEvent<WorkerResponseMessage | WorkerProgressMessage>) => {
      const data = event.data;

      if (data.type === 'PROGRESS') {
        const progressData = data as WorkerProgressMessage;
        onProgress(progressData.step, progressData.status, progressData.message);
        return;
      }

      if (data.type === 'DETECT_PIECES_RESULT') {
        const response = data as WorkerResponseMessage & { pieces: DetectedPiece[] };
        cleanup();
        resolve(response.pieces);
        return;
      }

      if (data.type === 'DETECT_PIECES_ERROR') {
        const response = data as WorkerResponseMessage & { error: string };
        cleanup();
        reject(new Error(response.error));
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

    // Memory-efficient: Downscale on canvas BEFORE creating OpenCV Mat
    // This avoids having both full-size and downscaled Mats in memory simultaneously
    const canvas = document.createElement('canvas');
    canvas.width = downscaleParams.width;
    canvas.height = downscaleParams.height;
    const ctx = canvas.getContext('2d', { alpha: false })!; // No alpha needed for photos

    // Use high-quality downscaling
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Draw directly at target size (memory-efficient)
    ctx.drawImage(
      imageElement,
      0,
      0,
      downscaleParams.originalWidth,
      downscaleParams.originalHeight,
      0,
      0,
      downscaleParams.width,
      downscaleParams.height
    );

    // Create OpenCV Mat from already-downscaled canvas (single allocation)
    imageMat = cv.imread(canvas);

    // Clear canvas reference to help GC
    canvas.width = 0;
    canvas.height = 0;

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

    // Extract ImageData for the worker
    const outCanvas = document.createElement('canvas');
    outCanvas.width = correctedMat.cols;
    outCanvas.height = correctedMat.rows;
    cv.imshow(outCanvas, correctedMat);
    const outCtx = outCanvas.getContext('2d');

    if (!outCtx) {
      throw new Error('Failed to get canvas context');
    }

    const imageData = outCtx.getImageData(0, 0, outCanvas.width, outCanvas.height);
    // Capture corrected image data before transferring the buffer to the worker
    const correctedImageData = new ImageData(
      new Uint8ClampedArray(imageData.data),
      imageData.width,
      imageData.height
    );

    // Free the outCanvas pixel buffer now that we've extracted the data
    outCanvas.width = 0;
    outCanvas.height = 0;

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
      correctedImageData,
      perspectiveApplied,
      downscaleInfo,
    };
  } catch (error) {
    const runningIndex = steps.findIndex((s) => s.status === 'running');
    if (runningIndex >= 0) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      advance(runningIndex, 'error', errorMessage);
    }

    return {
      pieces: [],
      correctedImageData: null,
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

// ── Fallback: Main-thread Detection ────────────────────────────────────────

export async function detectPiecesMainThread(
  cv: OpenCV,
  correctedImage: OpenCVMat,
  options: DetectionOptions = {}
): Promise<readonly DetectedPiece[]> {
  const { detectPieces } = await import('@/lib/piece-detection-engine');
  return detectPieces(cv, correctedImage, options) as DetectedPiece[];
}
