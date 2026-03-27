/**
 * Block recognition — match extracted block images against the library.
 * Uses Histogram of Oriented Gradients (HOG) descriptors for comparison.
 */

import type { BlockMatch, RecognizedBlock, BlockRegion } from '@/types/quilt-ocr';

const HOG_CELL_SIZE = 25; // 100/4 = 25 pixels per cell
const HOG_BINS = 8;
const HOG_CELLS = 4; // 4x4 spatial grid
const HOG_DESCRIPTOR_LENGTH = HOG_CELLS * HOG_CELLS * HOG_BINS; // 128

export interface BlockSignature {
  readonly blockId: string;
  readonly blockName: string;
  readonly category: string;
  readonly descriptor: Float64Array;
}

/**
 * Compute HOG descriptor for a normalized 100x100 RGBA block image.
 * Returns a 128-dimensional vector (4x4 cells, 8 orientation bins).
 */
export function computeHogDescriptor(
  pixelData: Uint8ClampedArray,
  size: number = 100
): Float64Array {
  // Convert to grayscale
  const gray = new Float64Array(size * size);
  for (let i = 0; i < size * size; i++) {
    const offset = i * 4;
    gray[i] =
      0.299 * (pixelData[offset] ?? 0) +
      0.587 * (pixelData[offset + 1] ?? 0) +
      0.114 * (pixelData[offset + 2] ?? 0);
  }

  // Compute gradients
  const gx = new Float64Array(size * size);
  const gy = new Float64Array(size * size);
  const magnitude = new Float64Array(size * size);
  const orientation = new Float64Array(size * size);

  for (let y = 1; y < size - 1; y++) {
    for (let x = 1; x < size - 1; x++) {
      const idx = y * size + x;
      gx[idx] = gray[idx + 1] - gray[idx - 1];
      gy[idx] = gray[(y + 1) * size + x] - gray[(y - 1) * size + x];
      magnitude[idx] = Math.sqrt(gx[idx] * gx[idx] + gy[idx] * gy[idx]);

      // Orientation in [0, π) mapped to bin index
      let angle = Math.atan2(gy[idx], gx[idx]);
      if (angle < 0) angle += Math.PI;
      orientation[idx] = angle;
    }
  }

  // Compute histograms for each cell
  const descriptor = new Float64Array(HOG_DESCRIPTOR_LENGTH);
  const binWidth = Math.PI / HOG_BINS;

  for (let cellY = 0; cellY < HOG_CELLS; cellY++) {
    for (let cellX = 0; cellX < HOG_CELLS; cellX++) {
      const cellOffset = (cellY * HOG_CELLS + cellX) * HOG_BINS;
      const startY = cellY * HOG_CELL_SIZE;
      const startX = cellX * HOG_CELL_SIZE;

      for (let py = startY; py < startY + HOG_CELL_SIZE && py < size; py++) {
        for (let px = startX; px < startX + HOG_CELL_SIZE && px < size; px++) {
          const idx = py * size + px;
          const bin = Math.min(
            Math.floor(orientation[idx] / binWidth),
            HOG_BINS - 1
          );
          descriptor[cellOffset + bin] += magnitude[idx];
        }
      }
    }
  }

  // L2 normalization
  let norm = 0;
  for (let i = 0; i < descriptor.length; i++) {
    norm += descriptor[i] * descriptor[i];
  }
  norm = Math.sqrt(norm + 1e-6);
  for (let i = 0; i < descriptor.length; i++) {
    descriptor[i] /= norm;
  }

  return descriptor;
}

/**
 * Compute cosine similarity between two descriptors.
 * Returns value in [0, 1] where 1 = identical.
 */
export function cosineSimilarity(
  a: Float64Array,
  b: Float64Array
): number {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator > 0 ? dotProduct / denominator : 0;
}

/**
 * Match a block region against a library of pre-computed signatures.
 * Returns top-N matches sorted by similarity.
 */
export function matchBlock(
  region: BlockRegion,
  signatures: readonly BlockSignature[],
  topN: number = 5
): readonly BlockMatch[] {
  const descriptor = computeHogDescriptor(region.pixelData);

  const matches = signatures.map((sig) => ({
    blockId: sig.blockId,
    blockName: sig.blockName,
    category: sig.category,
    similarity: cosineSimilarity(descriptor, sig.descriptor),
  }));

  return [...matches]
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topN);
}

/**
 * Recognize all blocks in the grid against the signature library.
 * Returns recognized blocks with confidence scores.
 */
export function recognizeBlocks(
  regions: readonly BlockRegion[],
  signatures: readonly BlockSignature[],
  topN: number = 5
): readonly RecognizedBlock[] {
  return regions.map((region) => {
    const matches = matchBlock(region, signatures, topN);
    const bestMatch = matches.length > 0 ? matches[0] : null;
    const confidence = bestMatch ? bestMatch.similarity : 0;

    return {
      row: region.row,
      col: region.col,
      matches,
      bestMatch,
      confidence,
    };
  });
}

/**
 * Get the HOG descriptor length for external reference.
 */
export function getDescriptorLength(): number {
  return HOG_DESCRIPTOR_LENGTH;
}
