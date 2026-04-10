/**
 * Photo Pattern Engine — Orchestrates the photo-to-quilt-pattern pipeline
 *
 * Pipeline:
 * 1. Main Thread: DOM canvas operations, image loading, downscaling
 * 2. Main Thread: Perspective correction (requires OpenCV transforms)
 * 3. Main Thread: Full detection pipeline (OpenCV via WASM, yields to keep UI responsive)
 * 4. Main Thread: Orphan filter → shape normalization → edge snap → scale
 */

import type {
  PipelineStep,
  PipelineStepStatus,
  DetectedPiece,
  ScaledPiece,
  Rect,
  Point2D,
  DownscaleInfo,
  DetectionOptions,
  QuiltDetectionConfig,
} from '@/lib/photo-layout-types';
import {
  PHOTO_PATTERN_RESOLUTION_TIERS,
  PHOTO_PATTERN_MAX_IMAGE_DATA_SIZE,
  PHOTO_PATTERN_ABSOLUTE_MAX_DIMENSION,
  DEFAULT_SEAM_ALLOWANCE_INCHES,
  DEFAULT_CANVAS_WIDTH,
  DEFAULT_CANVAS_HEIGHT,
} from '@/lib/constants';
import {
  autoDetectQuiltBoundary,
  computePerspectiveTransform,
  applyPerspectiveCorrection,
} from '@/lib/perspective-utils';
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
  readonly downscaleInfo: DownscaleInfo;
  /** Normalized + edge-snapped pieces, ready for canvas placement */
  readonly scaledPieces: readonly ScaledPiece[];
}

// ── Main-Thread Detection ──────────────────────────────────────────────────

/**
 * Runs piece detection on the main thread (OpenCV WASM hangs inside
 * Turbopack-managed Web Workers).  Yields periodically so the UI
 * stays responsive.
 */
async function detectPiecesWithWorker(
  imageData: ImageData,
  options: DetectionOptions,
  onProgress: (step: number, status: 'running' | 'complete' | 'error', message?: string) => void
): Promise<DetectedPiece[]> {
  // Load OpenCV on the main thread (same instance the pipeline already has)
  const { loadOpenCv } = await import('@/lib/opencv-loader');
  const cv = await loadOpenCv();

  const { detectPiecesOnMainThread } = await import('@/lib/piece-detection.worker');

  return detectPiecesOnMainThread(cv, imageData, options, onProgress);
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

// ── Scaling Helpers ───────────────────────────────────────────────────────

/**
 * Convert pixel contours to inch-based ScaledPieces using target dimensions.
 */
function buildScaledPieces(
  pieces: readonly DetectedPiece[],
  contours: readonly Point2D[][],
  imageWidth: number,
  imageHeight: number,
  targetWidthInches: number,
  targetHeightInches: number,
  seamAllowance: number
): ScaledPiece[] {
  const scaleX = targetWidthInches / imageWidth;
  const scaleY = targetHeightInches / imageHeight;

  return pieces.map((piece, i) => {
    const contour = contours[i] ?? piece.contour;
    const contourInches: Point2D[] = contour.map((p) => ({
      x: p.x * scaleX,
      y: p.y * scaleY,
    }));

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const p of contourInches) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }

    const finishedW = maxX - minX;
    const finishedH = maxY - minY;
    const cutW = finishedW + seamAllowance * 2;
    const cutH = finishedH + seamAllowance * 2;

    return {
      id: piece.id,
      contourInches,
      finishedWidth: formatInches(finishedW),
      finishedHeight: formatInches(finishedH),
      cutWidth: formatInches(cutW),
      cutHeight: formatInches(cutH),
      finishedWidthNum: finishedW,
      finishedHeightNum: finishedH,
      dominantColor: piece.dominantColor,
    };
  });
}

/** Format a decimal inch value to nearest 1/8" fraction string. */
function formatInches(value: number): string {
  const eighths = Math.round(value * 8);
  const whole = Math.floor(eighths / 8);
  const remainder = eighths % 8;
  if (remainder === 0) return `${whole}"`;
  const fractions: Record<number, string> = {
    1: '1/8',
    2: '1/4',
    3: '3/8',
    4: '1/2',
    5: '5/8',
    6: '3/4',
    7: '7/8',
  };
  return whole > 0 ? `${whole} ${fractions[remainder]}"` : `${fractions[remainder]}"`;
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

    // Convert corrected image to a Blob URL for lightweight Zustand storage
    // instead of storing massive ImageData arrays in React state
    const correctedImageRef: CorrectedImageRef | null = await new Promise<CorrectedImageRef | null>(
      (resolve) => {
        outCanvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({
                url: URL.createObjectURL(blob),
                width: outCanvas.width,
                height: outCanvas.height,
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

    // Free the outCanvas pixel buffer now that we've extracted the data
    outCanvas.width = 0;
    outCanvas.height = 0;

    // Run detection on the main thread (OpenCV WASM hangs in Turbopack workers)
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

    // Step 5: Finalizing — orphan filter → normalize → edge snap → scale
    advance(5, 'running');

    // Orphan filter: remove pieces that share no edges with any neighbor.
    // Real quilt pieces are always sewn to at least one adjacent piece —
    // isolated detections are CV artifacts (dust, shadows, noise).
    let cleanPieces: readonly DetectedPiece[] = pieces;
    try {
      const { filterOrphanPieces } = await import('@/lib/orphan-filter');
      const filterResult = filterOrphanPieces(pieces);
      cleanPieces = filterResult.pieces;
    } catch {
      // Non-fatal — continue with all pieces if filter fails
    }

    // Shape normalization: cluster, regularize, equalize, straighten
    let normalizedContours: Point2D[][] = cleanPieces.map((p) =>
      p.contour.map((pt) => ({ x: pt.x, y: pt.y }))
    );
    try {
      const { normalizeShapes } = await import('@/lib/shape-normalizer-engine');
      const normResult = normalizeShapes(cleanPieces);
      normalizedContours = normResult.normalizedContours.map((c) =>
        c.map((pt) => ({ x: pt.x, y: pt.y }))
      );
    } catch {
      // Non-fatal — continue with raw contours
    }

    // Edge snapping: snap shared edges to canonical positions, snap boundary
    // edges to canvas border. Quilts have no gaps — all shapes touch.
    const imageW = correctedMat?.cols ?? imageElement.naturalWidth;
    const imageH = correctedMat?.rows ?? imageElement.naturalHeight;
    const canvasBounds: Rect = { x: 0, y: 0, width: imageW, height: imageH };

    try {
      const { snapEdges } = await import('@/lib/edge-snapper-engine');
      normalizedContours = snapEdges(normalizedContours, canvasBounds);
    } catch {
      // Non-fatal — continue with unsnapped contours
    }

    // Scale pixel contours to inch-based ScaledPieces
    const scaledPieces = buildScaledPieces(
      cleanPieces,
      normalizedContours,
      imageW,
      imageH,
      DEFAULT_CANVAS_WIDTH,
      DEFAULT_CANVAS_HEIGHT,
      DEFAULT_SEAM_ALLOWANCE_INCHES
    );

    advance(5, 'complete');

    // Build downscale info for consumer feedback
    const downscaleInfo: DownscaleInfo = {
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
      pieces: cleanPieces,
      correctedImageRef,
      perspectiveApplied,
      downscaleInfo,
      scaledPieces,
    };
  } catch (error) {
    const runningIndex = steps.findIndex((s) => s.status === 'running');
    if (runningIndex >= 0) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
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
      scaledPieces: [],
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
  const { detectPieces } = await import('@/lib/piece-detection-utils');
  return detectPieces(cv, correctedImage, options) as DetectedPiece[];
}
