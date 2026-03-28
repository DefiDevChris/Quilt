import { describe, it, expect } from 'vitest';
import { analyzeQuiltPhoto, updateGrid } from '@/lib/quilt-ocr-engine';
import type { ImageBuffer } from '@/lib/ocr/image-preprocess';
import type { OcrPipelineStep } from '@/types/quilt-ocr';
import sharp from 'sharp';
import path from 'node:path';

function makeTestImage(width: number, height: number): ImageBuffer {
  const data = new Uint8ClampedArray(width * height * 4);
  // Create a simple grid pattern: alternating 50px blocks
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const blockX = Math.floor(x / 50);
      const blockY = Math.floor(y / 50);
      const isLight = (blockX + blockY) % 2 === 0;
      const val = isLight ? 200 : 50;
      data[idx] = val;
      data[idx + 1] = val;
      data[idx + 2] = val;
      data[idx + 3] = 255;
    }
  }
  return { width, height, data };
}

async function loadFixtureImage(filename: string): Promise<ImageBuffer> {
  const fixturePath = path.resolve(__dirname, '../../fixtures', filename);
  const image = sharp(fixturePath);
  const { width, height } = await image.metadata();
  const rawBuffer = await image.ensureAlpha().raw().toBuffer();
  return {
    width: width!,
    height: height!,
    data: new Uint8ClampedArray(rawBuffer.buffer, rawBuffer.byteOffset, rawBuffer.byteLength),
  };
}

describe('quilt-ocr-engine', () => {
  describe('analyzeQuiltPhoto', () => {
    it('runs full pipeline without errors', () => {
      const image = makeTestImage(200, 200);
      const result = analyzeQuiltPhoto(image, []);

      expect(result.grid).toBeDefined();
      expect(result.blocks).toBeDefined();
      expect(result.colors).toBeDefined();
      expect(result.pipelineSteps.length).toBeGreaterThan(0);
    });

    it('calls progress callback for each step', () => {
      const image = makeTestImage(100, 100);
      const steps: OcrPipelineStep[] = [];
      analyzeQuiltPhoto(image, [], {}, (step) => steps.push(step));

      // Should have 2 entries per pipeline step (running + complete) + final
      expect(steps.length).toBeGreaterThan(5);
      expect(steps.some((s) => s.status === 'complete')).toBe(true);
    });

    it('returns null measurements when no reference provided', () => {
      const image = makeTestImage(100, 100);
      const result = analyzeQuiltPhoto(image, []);
      expect(result.measurements).toBeNull();
    });

    it(
      'returns measurements when reference width provided (real image)',
      { timeout: 30_000 },
      async () => {
        const image = await loadFixtureImage('test-quilt-grid.png');
        const result = analyzeQuiltPhoto(image, [], {
          referenceWidthInches: 60,
          edgeThreshold: 30,
          houghThreshold: 40,
        });
        expect(result.measurements).not.toBeNull();
        expect(result.measurements?.totalWidthInches).toBe(60);
      }
    );

    it('respects custom config', () => {
      const image = makeTestImage(100, 100);
      const result = analyzeQuiltPhoto(image, [], {
        edgeThreshold: 100,
        houghThreshold: 200,
      });
      // With very high thresholds, fewer lines should be detected
      expect(result.grid).toBeDefined();
    });
  });

  describe('updateGrid', () => {
    it('creates grid from manual lines', () => {
      const hLines = [0, 50, 100, 150];
      const vLines = [0, 50, 100];
      const grid = updateGrid(hLines, vLines);

      expect(grid.rows).toBe(3);
      expect(grid.cols).toBe(2);
      expect(grid.cellWidth).toBe(50);
      expect(grid.cellHeight).toBe(50);
      expect(grid.confidence).toBe(1.0);
      expect(grid.layoutType).toBe('grid');
    });

    it('handles single line (no blocks)', () => {
      const grid = updateGrid([50], [50]);
      expect(grid.rows).toBe(0);
      expect(grid.cols).toBe(0);
    });

    it('computes correct intersection count', () => {
      const grid = updateGrid([0, 50, 100], [0, 50, 100]);
      expect(grid.intersections).toHaveLength(9); // 3x3
    });
  });
});
