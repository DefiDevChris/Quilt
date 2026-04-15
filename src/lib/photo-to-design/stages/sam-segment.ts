// ============================================================================
// Stage: SAM2 Auto-Mask Segmentation
//
// Runs the SAM2 image encoder once per image (cached by pixel hash), then
// prompts the lightweight decoder with a grid of points to produce a set of
// candidate binary masks. Non-max suppression deduplicates overlapping masks,
// then masks below the score threshold are discarded.
//
// Contract with callers:
//   - Always run inside the worker — relies on transformers.js, which is heavy.
//   - Yields to the worker message loop every BATCH_SIZE decoder calls so
//     aborts are responsive and the main thread stays unblocked.
//   - Every model/tensor allocation is disposed before returning, except the
//     memoized image embeddings (kept alive intentionally for the next call).
// ============================================================================

import { loadSam } from '../sam-loader';
import type { BoundingBox, RawSAMMask } from '../types';

/** How many decoder calls between awaits — keeps the worker responsive. */
const BATCH_SIZE = 10;

/**
 * Defaults are tuned for the base-plus fp16 model on mid-range WebGPU.
 * 8×8 = 64 prompts × ~100ms/decoder = ~6s initial auto-mask pass on hardware
 * WebGPU; several minutes on software fallback. Bump to 16×16 behind a detail
 * slider when we want finer coverage — quadruples wall time.
 */
export const DEFAULT_POINT_GRID_SIDE = 8;
export const DEFAULT_SCORE_THRESHOLD = 0.7;
export const DEFAULT_NMS_IOU_THRESHOLD = 0.7;

export interface SamSegmentOptions {
  pointGridSide?: number;
  scoreThreshold?: number;
  nmsIouThreshold?: number;
  /** Fires after each batch: (masks completed, total masks). */
  onProgress?: (completed: number, total: number) => void;
  abortSignal?: AbortSignal;
}

interface EncodeCache {
  hash: string;
  /** Opaque transformers.js tensor kept alive across calls with the same hash. */
  imageEmbeddings: unknown;
  imagePositionalEmbeddings: unknown;
  originalSizes: unknown;
  reshapedInputSizes: unknown;
}

let encodeCache: EncodeCache | null = null;

type MinimalTensor = {
  data: Float32Array | Uint8Array | Int32Array;
  dims: number[];
  dispose?: () => void;
};

export async function segmentWithSam(
  imageData: ImageData,
  imageHash: string,
  opts: SamSegmentOptions = {}
): Promise<RawSAMMask[]> {
  const pointGridSide = opts.pointGridSide ?? DEFAULT_POINT_GRID_SIDE;
  const scoreThreshold = opts.scoreThreshold ?? DEFAULT_SCORE_THRESHOLD;
  const nmsIouThreshold = opts.nmsIouThreshold ?? DEFAULT_NMS_IOU_THRESHOLD;
  const { onProgress, abortSignal } = opts;

  const { model, processor } = await loadSam();
  const transformers = await import('@huggingface/transformers');
  const { RawImage } = transformers;

  const rawImage = new RawImage(
    new Uint8ClampedArray(imageData.data),
    imageData.width,
    imageData.height,
    4
  );

  await ensureEncoded(rawImage, imageHash, processor, model);

  const cache = encodeCache;
  if (!cache) throw new Error('SAM encode cache missing after ensureEncoded.');

  const points = buildPointGrid(imageData.width, imageData.height, pointGridSide);
  const candidates: RawSAMMask[] = [];

  for (let i = 0; i < points.length; i += BATCH_SIZE) {
    checkAbort(abortSignal);
    const batch = points.slice(i, i + BATCH_SIZE);
    for (const [x, y] of batch) {
      const mask = await decodeAtPoint(
        rawImage,
        processor,
        model,
        cache,
        x,
        y,
        scoreThreshold,
        imageData.width,
        imageData.height
      );
      if (mask) candidates.push(mask);
    }

    onProgress?.(Math.min(i + BATCH_SIZE, points.length), points.length);
    // Let the worker drain its message queue — required for responsive aborts.
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
  }

  return nonMaxSuppress(candidates, nmsIouThreshold);
}

/**
 * Single-point decoder that reuses the cached image embedding whenever the
 * hash matches, re-encoding only on a genuine image change. This is the hot
 * path for interactive correction (U6) — decoder alone should run in roughly
 * 100 ms on WebGPU once the embedding is warm.
 */
export async function decodeSinglePoint(
  imageData: ImageData,
  imageHash: string,
  point: [number, number],
  opts: { scoreThreshold?: number } = {}
): Promise<RawSAMMask | null> {
  const scoreThreshold = opts.scoreThreshold ?? DEFAULT_SCORE_THRESHOLD;

  const { model, processor } = await loadSam();
  const transformers = await import('@huggingface/transformers');
  const { RawImage } = transformers;

  const rawImage = new RawImage(
    new Uint8ClampedArray(imageData.data),
    imageData.width,
    imageData.height,
    4
  );

  await ensureEncoded(rawImage, imageHash, processor, model);
  const cache = encodeCache;
  if (!cache) throw new Error('SAM encode cache missing after ensureEncoded.');

  return decodeAtPoint(
    rawImage,
    processor,
    model,
    cache,
    point[0],
    point[1],
    scoreThreshold,
    imageData.width,
    imageData.height
  );
}

/** Evicts the embeddings cache — call when the image changes materially. */
export function clearSamCache(): void {
  if (!encodeCache) return;
  disposeAll([
    encodeCache.imageEmbeddings,
    encodeCache.imagePositionalEmbeddings,
    encodeCache.originalSizes,
    encodeCache.reshapedInputSizes,
  ]);
  encodeCache = null;
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

async function ensureEncoded(
  rawImage: unknown,
  hash: string,
  processor: unknown,
  model: unknown
): Promise<void> {
  if (encodeCache?.hash === hash) return;
  clearSamCache();

  const call = processor as (image: unknown) => Promise<{
    pixel_values: unknown;
    original_sizes: unknown;
    reshaped_input_sizes: unknown;
  }>;
  const inputs = await call(rawImage);

  const m = model as {
    get_image_embeddings?: (i: unknown) => Promise<{
      image_embeddings: unknown;
      image_positional_embeddings?: unknown;
    }>;
  };
  if (!m.get_image_embeddings) {
    throw new Error(
      'SAM2 model does not expose get_image_embeddings — transformers.js version incompatible.'
    );
  }
  const emb = await m.get_image_embeddings(inputs);

  encodeCache = {
    hash,
    imageEmbeddings: emb.image_embeddings,
    imagePositionalEmbeddings: emb.image_positional_embeddings,
    originalSizes: inputs.original_sizes,
    reshapedInputSizes: inputs.reshaped_input_sizes,
  };
}

/** Exported for unit testing — pure function, no transformers.js dependency. */
export function buildPointGrid(
  width: number,
  height: number,
  side: number
): Array<[number, number]> {
  const points: Array<[number, number]> = [];
  const stepX = width / (side + 1);
  const stepY = height / (side + 1);
  for (let i = 1; i <= side; i++) {
    for (let j = 1; j <= side; j++) {
      points.push([Math.round(j * stepX), Math.round(i * stepY)]);
    }
  }
  return points;
}

async function decodeAtPoint(
  rawImage: unknown,
  processor: unknown,
  model: unknown,
  cache: EncodeCache,
  x: number,
  y: number,
  scoreThreshold: number,
  width: number,
  height: number
): Promise<RawSAMMask | null> {
  // Transformers.js point-input shape: [batch][num_images][num_points][x, y].
  const input_points = [[[[x, y]]]];
  const input_labels = [[[1]]];

  const promptCall = processor as (
    image: unknown,
    opts: { input_points: number[][][][]; input_labels: number[][][] }
  ) => Promise<{
    input_points: unknown;
    input_labels: unknown;
    original_sizes: unknown;
    reshaped_input_sizes: unknown;
  }>;
  const promptInputs = await promptCall(rawImage, { input_points, input_labels });

  const modelCall = model as (args: Record<string, unknown>) => Promise<{
    pred_masks: MinimalTensor;
    iou_scores: MinimalTensor;
  }>;
  const out = await modelCall({
    image_embeddings: cache.imageEmbeddings,
    image_positional_embeddings: cache.imagePositionalEmbeddings,
    input_points: promptInputs.input_points,
    input_labels: promptInputs.input_labels,
  });

  try {
    const scores = out.iou_scores.data as Float32Array;
    let bestIdx = 0;
    let bestScore = scores[0];
    for (let k = 1; k < scores.length; k++) {
      if (scores[k] > bestScore) {
        bestScore = scores[k];
        bestIdx = k;
      }
    }
    if (bestScore < scoreThreshold) return null;

    const postCall = (
      processor as {
        post_process_masks: (
          pred: MinimalTensor,
          orig: unknown,
          reshaped: unknown
        ) => Promise<MinimalTensor[]>;
      }
    ).post_process_masks;
    const processedMasks = await postCall(
      out.pred_masks,
      promptInputs.original_sizes,
      promptInputs.reshaped_input_sizes
    );

    try {
      const maskTensor = pickBestMask(processedMasks, bestIdx, width, height);
      if (!maskTensor) return null;
      const binary = binarize(maskTensor.data);
      const bbox = computeBbox(binary, width, height);
      if (bbox.width === 0 || bbox.height === 0) return null;
      return { data: binary, width, height, bbox, score: bestScore };
    } finally {
      disposeAll(processedMasks);
    }
  } finally {
    disposeAll([out.pred_masks, out.iou_scores]);
  }
}

/**
 * `post_process_masks` returns one mask-tensor per input image; each tensor's
 * dims are typically `[num_masks, H, W]` or `[1, num_masks, H, W]`. We pull
 * the slice corresponding to the best IoU score.
 */
function pickBestMask(
  masks: MinimalTensor[],
  bestIdx: number,
  width: number,
  height: number
): MinimalTensor | null {
  const perImage = masks[0];
  if (!perImage) return null;
  const pixelsPerMask = width * height;
  const totalMasks = perImage.data.length / pixelsPerMask;
  if (!Number.isFinite(totalMasks) || totalMasks < 1) return null;
  const idx = Math.max(0, Math.min(Math.floor(totalMasks) - 1, bestIdx));
  const offset = idx * pixelsPerMask;
  const slice = perImage.data.subarray(offset, offset + pixelsPerMask) as typeof perImage.data;
  return { data: slice, dims: [height, width] };
}

/** Exported for unit testing — pure function. */
export function binarize(data: Float32Array | Uint8Array | Int32Array): Uint8Array {
  const out = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    out[i] = data[i] > 0.5 ? 255 : 0;
  }
  return out;
}

/** Exported for unit testing — pure function. */
export function computeBbox(mask: Uint8Array, width: number, height: number): BoundingBox {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y++) {
    const row = y * width;
    for (let x = 0; x < width; x++) {
      if (mask[row + x]) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  return { minX, minY, maxX, maxY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

/** Exported for unit testing — pure function. */
export function nonMaxSuppress(masks: RawSAMMask[], iouThreshold: number): RawSAMMask[] {
  const sorted = [...masks].sort((a, b) => b.score - a.score);
  const kept: RawSAMMask[] = [];
  for (const candidate of sorted) {
    let suppressed = false;
    for (const survivor of kept) {
      if (maskIou(candidate, survivor) > iouThreshold) {
        suppressed = true;
        break;
      }
    }
    if (!suppressed) kept.push(candidate);
  }
  return kept;
}

function maskIou(a: RawSAMMask, b: RawSAMMask): number {
  // Bbox reject — cheap; a full pixel sweep over two non-overlapping 1024²
  // masks would cost 1 MB of memory accesses per pair.
  if (a.bbox.maxX < b.bbox.minX || a.bbox.minX > b.bbox.maxX) return 0;
  if (a.bbox.maxY < b.bbox.minY || a.bbox.minY > b.bbox.maxY) return 0;

  let intersection = 0;
  let union = 0;
  const len = a.data.length;
  for (let i = 0; i < len; i++) {
    const av = a.data[i] !== 0;
    const bv = b.data[i] !== 0;
    if (av && bv) intersection++;
    if (av || bv) union++;
  }
  return union === 0 ? 0 : intersection / union;
}

function checkAbort(signal: AbortSignal | undefined): void {
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
}

function disposeAll(items: unknown[]): void {
  for (const item of items) {
    if (!item) continue;
    const d = (item as { dispose?: () => void }).dispose;
    if (typeof d === 'function') {
      try {
        d.call(item);
      } catch {
        // Best-effort dispose; swallow errors so one failure doesn't leak the rest.
      }
    }
  }
}
