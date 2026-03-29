import type { PipelineStep, PipelineStepStatus, DetectedPiece } from '@/lib/photo-pattern-types';
import { PHOTO_PATTERN_DOWNSCALE_MAX } from '@/lib/constants';
import {
  autoDetectQuiltBoundary,
  computePerspectiveTransform,
  applyPerspectiveCorrection,
} from '@/lib/perspective-engine';

// ── Types ──────────────────────────────────────────────────────

export interface PipelineResult {
  readonly pieces: readonly DetectedPiece[];
  readonly correctedImageData: ImageData | null;
  readonly perspectiveApplied: boolean;
}

// ── Pipeline Helpers ───────────────────────────────────────────

const PIPELINE_STEP_NAMES: readonly string[] = [
  'Preprocessing image...',
  'Detecting grid structure...',
  'Finding seam lines...',
  'Identifying pieces...',
  'Extracting colors...',
  'Finalizing...',
];

/**
 * Create the initial 6-step pipeline with all steps set to 'pending'.
 */
export function createInitialPipeline(): PipelineStep[] {
  return PIPELINE_STEP_NAMES.map((name) => ({
    name,
    status: 'pending' as PipelineStepStatus,
  }));
}

/**
 * Return a new pipeline array with the step at `index` updated to the
 * given status (and optional message). Never mutates the input.
 */
export function advancePipelineStep(
  steps: readonly PipelineStep[],
  index: number,
  status: PipelineStepStatus,
  message?: string
): PipelineStep[] {
  return steps.map((step, i) => {
    if (i !== index) {
      return step;
    }
    return {
      ...step,
      status,
      ...(message !== undefined ? { message } : {}),
    };
  });
}

// ── Downscale ──────────────────────────────────────────────────

/**
 * Compute target dimensions that fit within `maxDimension` on the longest side.
 * Returns the original dimensions (with `scaled: false`) when both sides
 * are already within the limit.
 */
export function downscaleIfNeeded(
  width: number,
  height: number,
  maxDimension: number = PHOTO_PATTERN_DOWNSCALE_MAX
): { width: number; height: number; scaled: boolean } {
  const longest = Math.max(width, height);

  if (longest <= maxDimension) {
    return { width, height, scaled: false };
  }

  const ratio = maxDimension / longest;
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
    scaled: true,
  };
}

// ── Detection Pipeline ─────────────────────────────────────────

/**
 * Orchestrate the full photo-to-pattern detection pipeline.
 *
 * This is the only function with a DOM dependency (creates a canvas element
 * to extract ImageData from the corrected image). It coordinates the
 * perspective engine and piece detection engine.
 *
 * @param cv       — OpenCV.js instance
 * @param imageElement — An HTMLImageElement loaded with the quilt photo
 * @param sensitivity  — Detection sensitivity (0.2–2.0)
 * @param onProgress   — Callback fired with updated pipeline steps
 */
export async function runDetectionPipeline(
  cv: any,
  imageElement: HTMLImageElement,
  sensitivity: number,
  onProgress: (steps: PipelineStep[]) => void
): Promise<PipelineResult> {
  let steps = createInitialPipeline();

  const advance = (index: number, status: PipelineStepStatus, message?: string) => {
    steps = advancePipelineStep(steps, index, status, message);
    onProgress(steps);
  };

  let imageMat: any = null;
  let correctedMat: any = null;
  let transformMatrix: any = null;

  try {
    // Step 0: Preprocessing
    advance(0, 'running');

    const canvas = document.createElement('canvas');
    canvas.width = imageElement.naturalWidth;
    canvas.height = imageElement.naturalHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(imageElement, 0, 0);

    imageMat = cv.imread(canvas);

    const {
      width: scaledW,
      height: scaledH,
      scaled,
    } = downscaleIfNeeded(imageMat.cols, imageMat.rows);

    if (scaled) {
      const resized = new cv.Mat();
      cv.resize(imageMat, resized, new cv.Size(scaledW, scaledH));
      imageMat.delete();
      imageMat = resized;
    }

    advance(0, 'complete');

    // Step 1: Detect grid / perspective
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

    // Steps 2-4: Seam lines, piece identification, color extraction
    // These are conceptually separate but detectPieces handles all three
    advance(2, 'running');
    advance(2, 'complete');

    advance(3, 'running');

    const { detectPieces } = await import('@/lib/piece-detection-engine');
    const pieces = detectPieces(cv, correctedMat, sensitivity);

    advance(3, 'complete');

    advance(4, 'running');
    // Colors already extracted per-piece inside detectPieces
    advance(4, 'complete');

    // Step 5: Finalizing
    advance(5, 'running');

    // Extract corrected image data for the UI
    let correctedImageData: ImageData | null = null;
    const outCanvas = document.createElement('canvas');
    outCanvas.width = correctedMat.cols;
    outCanvas.height = correctedMat.rows;
    cv.imshow(outCanvas, correctedMat);
    const outCtx = outCanvas.getContext('2d');
    if (outCtx) {
      correctedImageData = outCtx.getImageData(0, 0, outCanvas.width, outCanvas.height);
    }

    advance(5, 'complete');

    return {
      pieces,
      correctedImageData,
      perspectiveApplied,
    };
  } catch (error) {
    // Find the first running step and mark it as errored
    const runningIndex = steps.findIndex((s) => s.status === 'running');
    if (runningIndex >= 0) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      advance(runningIndex, 'error', errorMessage);
    }

    return {
      pieces: [],
      correctedImageData: null,
      perspectiveApplied: false,
    };
  } finally {
    if (imageMat && correctedMat && imageMat !== correctedMat) {
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
