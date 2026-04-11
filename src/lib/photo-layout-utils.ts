/**
 * Photo Pattern Engine — Orchestrates the photo-to-quilt-pattern pipeline
 *
 * Pipeline:
 * 1. Main Thread: DOM canvas operations, image loading, downscaling
 * 2. Web Worker: OpenCV WASM — perspective correction + full detection pipeline
 * 3. Main Thread: Orphan filter → shape normalization → edge snap → scale
 *
 * All OpenCV operations run in a dedicated Web Worker (detection-worker.js)
 * to avoid crashing the browser tab. If the worker OOMs, the page survives.
 */

import type {
  PipelineStep,
  PipelineStepStatus,
  DetectedPiece,
  ScaledPiece,
  Point2D,
  DownscaleInfo,
  QuiltDetectionConfig,
} from '@/lib/photo-layout-types';
import type { QuantizedPiece, QuantizerConfig, CellSizeInches } from '@/lib/shape-quantizer-engine';
import {
  PHOTO_PATTERN_RESOLUTION_TIERS,
  PHOTO_PATTERN_MAX_IMAGE_DATA_SIZE,
  PHOTO_PATTERN_ABSOLUTE_MAX_DIMENSION,
  DEFAULT_SEAM_ALLOWANCE_INCHES,
} from '@/lib/constants';
import { detectInWorker } from '@/lib/opencv-loader';

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
  /** Quantized + grid-snapped pieces, ready for canvas placement */
  readonly scaledPieces: readonly ScaledPiece[];
  /** Final detection bitmap dimensions in pixels (post-downscale). */
  readonly imageWidthPx: number;
  readonly imageHeightPx: number;
  /** Inferred base unit in pixels at detection resolution. */
  readonly inferredUnitPx: number;
  /** Inferred global rotation in degrees. */
  readonly inferredRotationDeg: number;
  /** Number of distinct canonical classes discovered. */
  readonly classCount: number;
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
  const effectiveRatio = Math.max(aspectRatio, 1 / aspectRatio);
  const maxDimensionFromMemory = Math.floor(Math.sqrt((maxBytes / 4) * effectiveRatio));
  return Math.min(maxDimensionFromMemory, PHOTO_PATTERN_ABSOLUTE_MAX_DIMENSION);
}

/**
 * Gets the target max dimension based on piece scale and memory constraints.
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
 * Convert quantized pixel polygons to inch-based ScaledPieces using target
 * canvas dimensions. Preserves class metadata for print-list clustering.
 */
function buildScaledPieces(
  quantized: readonly QuantizedPiece[],
  pieceColorById: ReadonlyMap<string, string>,
  imageWidth: number,
  imageHeight: number,
  targetWidthInches: number,
  targetHeightInches: number,
  seamAllowance: number
): ScaledPiece[] {
  const scaleX = targetWidthInches / imageWidth;
  const scaleY = targetHeightInches / imageHeight;

  return quantized.map((q) => {
    const contourInches: Point2D[] = q.contour.map((p) => ({
      x: p.x * scaleX,
      y: p.y * scaleY,
    }));

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const p of contourInches) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }

    const finishedW = maxX - minX;
    const finishedH = maxY - minY;
    const cutW = finishedW + seamAllowance * 2;
    const cutH = finishedH + seamAllowance * 2;

    return {
      id: q.id,
      contourInches,
      finishedWidth: formatInches(finishedW),
      finishedHeight: formatInches(finishedH),
      cutWidth: formatInches(cutW),
      cutHeight: formatInches(cutH),
      finishedWidthNum: finishedW,
      finishedHeightNum: finishedH,
      dominantColor: pieceColorById.get(q.id) ?? '#d4ccc4',
      shapeClass: q.shapeClass,
      classKey: q.classKey,
      classLabel: q.classLabel,
      unitsW: q.unitsW,
      unitsH: q.unitsH,
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
  sensitivity?: number;
  enableShapeClustering?: boolean;
  detectNestedShapes?: boolean;
  enableCLAHE?: boolean;
  enableSharpening?: boolean;
  removeTopstitching?: boolean;
  useSobelGradient?: boolean;
  enableWatershed?: boolean;
  minSolidity?: number;
  maxAspectRatio?: number;
  scanConfig?: QuiltDetectionConfig;
  /** Optional overrides for the post-detection shape quantizer. */
  quantizerConfig?: Partial<QuantizerConfig>;
}

/**
 * Re-quantize already-detected pieces with new settings. Used by the Review
 * step when the user tweaks the base unit, rotation offset, or min area and
 * wants a cheap refresh without re-running the OpenCV worker.
 */
export async function requantizeDetectedPieces(
  detectedPieces: readonly DetectedPiece[],
  imageWidthPx: number,
  imageHeightPx: number,
  targetWidthInches: number,
  targetHeightInches: number,
  seamAllowance: number,
  quantizerConfig?: Partial<QuantizerConfig>
): Promise<{
  scaledPieces: ScaledPiece[];
  unitPx: number;
  rotationDeg: number;
  classCount: number;
  droppedIds: readonly string[];
}> {
  const { quantizeShapes } = await import('@/lib/shape-quantizer-engine');
  const { filterOrphanPieces } = await import('@/lib/orphan-filter');

  let cleanPieces: readonly DetectedPiece[] = detectedPieces;
  try {
    cleanPieces = filterOrphanPieces(detectedPieces).pieces;
  } catch {
    // Non-fatal
  }

  const quantResult = quantizeShapes(cleanPieces, quantizerConfig);

  const colorById = new Map<string, string>();
  for (const p of cleanPieces) colorById.set(p.id, p.dominantColor);

  const scaledPieces = buildScaledPieces(
    quantResult.pieces,
    colorById,
    imageWidthPx,
    imageHeightPx,
    targetWidthInches,
    targetHeightInches,
    seamAllowance
  );

  return {
    scaledPieces,
    unitPx: quantResult.unitPx,
    rotationDeg: quantResult.rotationDeg,
    classCount: quantResult.classCount,
    droppedIds: quantResult.droppedIds,
  };
}

export async function runDetectionPipeline(
  imageElement: HTMLImageElement,
  onProgress: (steps: PipelineStep[]) => void,
  options: RunDetectionPipelineOptions = {}
): Promise<PipelineResult> {
  console.time('[PhotoPipeline] Total');
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
    quantizerConfig,
  } = options;

  let steps = createInitialPipeline();

  const advance = (index: number, status: PipelineStepStatus, message?: string) => {
    steps = advancePipelineStep(steps, index, status, message);
    onProgress(steps);
  };

  let downscaleParams: ReturnType<typeof calculateDownscaleParams> | null = null;

  try {
    // Step 0: Preprocessing — downscale on canvas (main thread, DOM required)
    advance(0, 'running');

    downscaleParams = calculateDownscaleParams(
      imageElement.naturalWidth,
      imageElement.naturalHeight,
      scanConfig?.pieceScale ?? 'standard'
    );

    const canvas = document.createElement('canvas');
    canvas.width = downscaleParams.width;
    canvas.height = downscaleParams.height;
    const ctx = canvas.getContext('2d', { alpha: false })!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
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

    const imageData = ctx.getImageData(0, 0, downscaleParams.width, downscaleParams.height);

    // Free canvas memory
    canvas.width = 0;
    canvas.height = 0;

    advance(0, 'complete');

    // Steps 1-4: OpenCV detection in Web Worker
    console.time('[PhotoPipeline] Worker detection');
    advance(1, 'running');

    const workerResult = await detectInWorker(
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
      (step, status, message) => {
        if (step >= 1 && step <= 4) {
          advance(step, status, message);
        }
      }
    );

    const pieces = workerResult.pieces;
    const perspectiveApplied = workerResult.perspectiveApplied;
    console.timeEnd('[PhotoPipeline] Worker detection');
    console.log('[PhotoPipeline] Worker returned', pieces.length, 'pieces');

    advance(1, 'complete');
    advance(2, 'complete');
    advance(3, 'complete');
    advance(4, 'complete');

    // Step 5: Finalizing — orphan filter → quantize → scale (main thread)
    advance(5, 'running');

    // Orphan filter
    let cleanPieces: readonly DetectedPiece[] = pieces;
    try {
      const { filterOrphanPieces } = await import('@/lib/orphan-filter');
      const filterResult = filterOrphanPieces(pieces);
      cleanPieces = filterResult.pieces;
    } catch {
      // Non-fatal
    }

    // Shape quantization — single-pass grid inference + canonicalization
    const imageW = downscaleParams.width;
    const imageH = downscaleParams.height;

    const { quantizeShapes } = await import('@/lib/shape-quantizer-engine');
    const quantResult = quantizeShapes(cleanPieces, quantizerConfig);
    console.log(
      '[PhotoPipeline] Quantized:',
      quantResult.pieces.length,
      'pieces,',
      quantResult.classCount,
      'classes,',
      'u=',
      quantResult.unitPx.toFixed(2),
      'px, θ=',
      quantResult.rotationDeg.toFixed(2),
      'deg'
    );

    // Map id → dominant color for rendering.
    const colorById = new Map<string, string>();
    for (const p of cleanPieces) colorById.set(p.id, p.dominantColor);

    const scaledPieces = buildScaledPieces(
      quantResult.pieces,
      colorById,
      imageW,
      imageH,
      DEFAULT_CANVAS_WIDTH,
      DEFAULT_CANVAS_HEIGHT,
      DEFAULT_SEAM_ALLOWANCE_INCHES
    );

    advance(5, 'complete');

    console.log(
      '[PhotoPipeline] Final: ',
      cleanPieces.length,
      'clean pieces,',
      scaledPieces.length,
      'scaled pieces'
    );
    console.timeEnd('[PhotoPipeline] Total');

    // Build downscale info
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
      correctedImageRef: null,
      perspectiveApplied,
      downscaleInfo,
      scaledPieces,
      imageWidthPx: imageW,
      imageHeightPx: imageH,
      inferredUnitPx: quantResult.unitPx,
      inferredRotationDeg: quantResult.rotationDeg,
      classCount: quantResult.classCount,
    };
  } catch (error) {
    console.error('[PhotoPipeline] Pipeline failed:', error);
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
      imageWidthPx: imageElement.naturalWidth,
      imageHeightPx: imageElement.naturalHeight,
      inferredUnitPx: 0,
      inferredRotationDeg: 0,
      classCount: 0,
    };
  }
}
