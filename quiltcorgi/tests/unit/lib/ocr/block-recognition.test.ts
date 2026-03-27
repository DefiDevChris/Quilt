import { describe, it, expect } from 'vitest';
import {
  computeHogDescriptor,
  cosineSimilarity,
  matchBlock,
  recognizeBlocks,
  getDescriptorLength,
  type BlockSignature,
} from '@/lib/ocr/block-recognition';
import type { BlockRegion } from '@/types/quilt-ocr';

function makeUniformBlock(r: number, g: number, b: number): Uint8ClampedArray {
  const size = 100;
  const data = new Uint8ClampedArray(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    data[i * 4] = r;
    data[i * 4 + 1] = g;
    data[i * 4 + 2] = b;
    data[i * 4 + 3] = 255;
  }
  return data;
}

function makeBlockWithEdge(): Uint8ClampedArray {
  const size = 100;
  const data = new Uint8ClampedArray(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const val = x < 50 ? 0 : 255;
      const idx = (y * size + x) * 4;
      data[idx] = val;
      data[idx + 1] = val;
      data[idx + 2] = val;
      data[idx + 3] = 255;
    }
  }
  return data;
}

function makeBlockRegion(
  pixelData: Uint8ClampedArray,
  row = 0,
  col = 0
): BlockRegion {
  return { row, col, x: 0, y: 0, width: 100, height: 100, pixelData };
}

describe('block-recognition', () => {
  describe('computeHogDescriptor', () => {
    it('returns correct length descriptor', () => {
      const data = makeUniformBlock(128, 128, 128);
      const descriptor = computeHogDescriptor(data);
      expect(descriptor.length).toBe(getDescriptorLength());
      expect(descriptor.length).toBe(128);
    });

    it('produces zero-gradient for uniform block', () => {
      const data = makeUniformBlock(128, 128, 128);
      const descriptor = computeHogDescriptor(data);
      // Uniform block has no gradients, so after L2 normalization
      // all values should be near zero (or NaN-safe small values)
      const maxVal = Math.max(...descriptor);
      // With epsilon in normalization, values will be very small
      expect(maxVal).toBeLessThan(0.1);
    });

    it('produces non-zero descriptor for block with edge', () => {
      const data = makeBlockWithEdge();
      const descriptor = computeHogDescriptor(data);
      const maxVal = Math.max(...descriptor);
      expect(maxVal).toBeGreaterThan(0);
    });

    it('is deterministic', () => {
      const data = makeBlockWithEdge();
      const d1 = computeHogDescriptor(data);
      const d2 = computeHogDescriptor(data);
      for (let i = 0; i < d1.length; i++) {
        expect(d1[i]).toBe(d2[i]);
      }
    });
  });

  describe('cosineSimilarity', () => {
    it('returns 1 for identical vectors', () => {
      const a = new Float64Array([1, 2, 3, 4]);
      expect(cosineSimilarity(a, a)).toBeCloseTo(1, 5);
    });

    it('returns 0 for orthogonal vectors', () => {
      const a = new Float64Array([1, 0, 0, 0]);
      const b = new Float64Array([0, 1, 0, 0]);
      expect(cosineSimilarity(a, b)).toBeCloseTo(0, 5);
    });

    it('returns 0 for different-length vectors', () => {
      const a = new Float64Array([1, 2]);
      const b = new Float64Array([1, 2, 3]);
      expect(cosineSimilarity(a, b)).toBe(0);
    });

    it('is symmetric', () => {
      const a = new Float64Array([1, 2, 3]);
      const b = new Float64Array([4, 5, 6]);
      expect(cosineSimilarity(a, b)).toBeCloseTo(cosineSimilarity(b, a), 10);
    });
  });

  describe('matchBlock', () => {
    it('returns top matches sorted by similarity', () => {
      const blockData = makeBlockWithEdge();
      const region = makeBlockRegion(blockData);

      const sig1: BlockSignature = {
        blockId: '1',
        blockName: 'Half Square',
        category: 'basic',
        descriptor: computeHogDescriptor(makeBlockWithEdge()),
      };
      const sig2: BlockSignature = {
        blockId: '2',
        blockName: 'Uniform',
        category: 'basic',
        descriptor: computeHogDescriptor(makeUniformBlock(128, 128, 128)),
      };

      const matches = matchBlock(region, [sig1, sig2], 2);
      expect(matches).toHaveLength(2);
      expect(matches[0].similarity).toBeGreaterThanOrEqual(
        matches[1].similarity
      );
      // Same pattern should match best
      expect(matches[0].blockId).toBe('1');
    });

    it('respects topN limit', () => {
      const region = makeBlockRegion(makeUniformBlock(0, 0, 0));
      const sigs: BlockSignature[] = Array.from({ length: 10 }, (_, i) => ({
        blockId: String(i),
        blockName: `Block ${i}`,
        category: 'test',
        descriptor: computeHogDescriptor(makeUniformBlock(i * 25, 0, 0)),
      }));

      const matches = matchBlock(region, sigs, 3);
      expect(matches).toHaveLength(3);
    });
  });

  describe('recognizeBlocks', () => {
    it('returns recognized block for each region', () => {
      const regions = [
        makeBlockRegion(makeBlockWithEdge(), 0, 0),
        makeBlockRegion(makeUniformBlock(200, 0, 0), 0, 1),
      ];

      const sigs: BlockSignature[] = [
        {
          blockId: '1',
          blockName: 'Test',
          category: 'basic',
          descriptor: computeHogDescriptor(makeBlockWithEdge()),
        },
      ];

      const recognized = recognizeBlocks(regions, sigs);
      expect(recognized).toHaveLength(2);
      expect(recognized[0].row).toBe(0);
      expect(recognized[0].col).toBe(0);
      expect(recognized[1].col).toBe(1);
      expect(recognized[0].bestMatch).not.toBeNull();
    });

    it('handles empty signature library', () => {
      const regions = [makeBlockRegion(makeUniformBlock(0, 0, 0))];
      const recognized = recognizeBlocks(regions, []);
      expect(recognized).toHaveLength(1);
      expect(recognized[0].bestMatch).toBeNull();
      expect(recognized[0].confidence).toBe(0);
    });
  });
});
