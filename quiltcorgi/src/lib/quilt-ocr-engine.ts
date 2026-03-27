/**
 * OCR Quilt Photo Reconstruction — main pipeline orchestrator.
 * Coordinates the 7-step analysis pipeline:
 *   1. Preprocess → 2. Grid detection → 3. Block segmentation →
 *   4. Block recognition → 5. Color extraction → 6. Measurement → 7. Output
 */

import type { ImageBuffer } from '@/lib/ocr/image-preprocess';
import { preprocessImage } from '@/lib/ocr/image-preprocess';
import { buildGrid } from '@/lib/ocr/grid-detection';
import { extractBlockRegions } from '@/lib/ocr/block-segmentation';
import { recognizeBlocks, type BlockSignature } from '@/lib/ocr/block-recognition';
import { extractBlockColors } from '@/lib/ocr/color-extraction';
import { computeMeasurements } from '@/lib/ocr/measurement';
import type {
  OcrConfig,
  OcrResult,
  OcrPipelineStep,
  DetectedGrid,
} from '@/types/quilt-ocr';
import { DEFAULT_OCR_CONFIG } from '@/types/quilt-ocr';

type ProgressCallback = (step: OcrPipelineStep) => void;

const PIPELINE_STEPS = [
  'Preprocessing image',
  'Detecting grid structure',
  'Segmenting blocks',
  'Recognizing blocks',
  'Extracting colors',
  'Computing measurements',
  'Generating output',
] as const;

function createStep(
  name: string,
  status: OcrPipelineStep['status'],
  message?: string,
  durationMs?: number
): OcrPipelineStep {
  return { name, status, message, durationMs };
}

/**
 * Run the full OCR analysis pipeline on a quilt photo.
 */
export function analyzeQuiltPhoto(
  image: ImageBuffer,
  signatures: readonly BlockSignature[],
  config: Partial<OcrConfig> = {},
  onProgress?: ProgressCallback
): OcrResult {
  const mergedConfig: OcrConfig = { ...DEFAULT_OCR_CONFIG, ...config };
  const steps: OcrPipelineStep[] = [];

  function reportProgress(index: number, status: OcrPipelineStep['status'], ms?: number) {
    const step = createStep(PIPELINE_STEPS[index], status, undefined, ms);
    steps.push(step);
    onProgress?.(step);
  }

  // Step 1: Preprocess
  reportProgress(0, 'running');
  const t0 = Date.now();
  const { edges } = preprocessImage(image, mergedConfig.edgeThreshold);
  reportProgress(0, 'complete', Date.now() - t0);

  // Step 2: Grid detection
  reportProgress(1, 'running');
  const t1 = Date.now();
  const grid = buildGrid(edges, mergedConfig.houghThreshold, mergedConfig.minLineGap);
  reportProgress(1, 'complete', Date.now() - t1);

  // Step 3: Block segmentation
  reportProgress(2, 'running');
  const t2 = Date.now();
  const regions = extractBlockRegions(image, grid);
  reportProgress(2, 'complete', Date.now() - t2);

  // Step 4: Block recognition
  reportProgress(3, 'running');
  const t3 = Date.now();
  const blocks = recognizeBlocks(regions, signatures);
  reportProgress(3, 'complete', Date.now() - t3);

  // Step 5: Color extraction
  reportProgress(4, 'running');
  const t4 = Date.now();
  const colors = extractBlockColors(regions);
  reportProgress(4, 'complete', Date.now() - t4);

  // Step 6: Measurements
  reportProgress(5, 'running');
  const t5 = Date.now();
  const measurements = mergedConfig.referenceWidthInches
    ? computeMeasurements(
        grid,
        mergedConfig.referenceWidthInches,
        image.width,
        mergedConfig.seamAllowanceInches
      )
    : null;
  reportProgress(5, 'complete', Date.now() - t5);

  // Step 7: Output
  reportProgress(6, 'complete', 0);

  return {
    grid,
    blocks,
    colors,
    measurements,
    pipelineSteps: steps,
  };
}

/**
 * Update grid manually (user adjusts detected lines).
 * Returns a new grid with corrected dimensions.
 */
export function updateGrid(
  horizontalLines: readonly number[],
  verticalLines: readonly number[]
): DetectedGrid {
  const rows = Math.max(0, horizontalLines.length - 1);
  const cols = Math.max(0, verticalLines.length - 1);

  const avgCellWidth =
    cols > 0
      ? (verticalLines[verticalLines.length - 1] - verticalLines[0]) / cols
      : 0;
  const avgCellHeight =
    rows > 0
      ? (horizontalLines[horizontalLines.length - 1] - horizontalLines[0]) / rows
      : 0;

  const intersections = [];
  for (const hLine of horizontalLines) {
    for (const vLine of verticalLines) {
      intersections.push({ x: vLine, y: hLine });
    }
  }

  return {
    rows,
    cols,
    cellWidth: avgCellWidth,
    cellHeight: avgCellHeight,
    horizontalLines: [...horizontalLines],
    verticalLines: [...verticalLines],
    intersections,
    layoutType: 'grid',
    confidence: 1.0,
  };
}
