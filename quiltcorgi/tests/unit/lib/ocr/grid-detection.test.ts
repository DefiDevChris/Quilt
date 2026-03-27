import { describe, it, expect } from 'vitest';
import {
  houghTransform,
  clusterLines,
  separateLines,
  computeIntersections,
  classifyLayout,
} from '@/lib/ocr/grid-detection';
import type { GrayscaleBuffer } from '@/lib/ocr/image-preprocess';
import type { DetectedLine } from '@/types/quilt-ocr';

function makeEdgeImage(width: number, height: number): GrayscaleBuffer {
  const data = new Uint8ClampedArray(width * height);
  return { width, height, data };
}

function makeHorizontalLines(width: number, height: number, yPositions: number[]): GrayscaleBuffer {
  const data = new Uint8ClampedArray(width * height);
  for (const y of yPositions) {
    if (y >= 0 && y < height) {
      for (let x = 0; x < width; x++) {
        data[y * width + x] = 255;
      }
    }
  }
  return { width, height, data };
}

describe('grid-detection', () => {
  describe('houghTransform', () => {
    it('returns empty array for blank image', () => {
      const edges = makeEdgeImage(50, 50);
      const lines = houghTransform(edges, 100);
      expect(lines).toHaveLength(0);
    });

    it('detects horizontal lines', () => {
      const edges = makeHorizontalLines(100, 100, [25, 50, 75]);
      const lines = houghTransform(edges, 50);
      expect(lines.length).toBeGreaterThan(0);

      // Horizontal lines have theta ≈ π/2
      const horizontalLines = lines.filter(
        (l) => Math.abs(l.theta - Math.PI / 2) < 0.2
      );
      expect(horizontalLines.length).toBeGreaterThan(0);
    });

    it('sorts lines by votes descending', () => {
      const edges = makeHorizontalLines(100, 100, [50]);
      const lines = houghTransform(edges, 10);
      for (let i = 1; i < lines.length; i++) {
        expect(lines[i].votes).toBeLessThanOrEqual(lines[i - 1].votes);
      }
    });
  });

  describe('clusterLines', () => {
    it('returns empty for empty input', () => {
      expect(clusterLines([])).toHaveLength(0);
    });

    it('merges nearby lines', () => {
      const lines: DetectedLine[] = [
        { rho: 50, theta: Math.PI / 2, votes: 100 },
        { rho: 52, theta: Math.PI / 2, votes: 80 },
        { rho: 200, theta: Math.PI / 2, votes: 90 },
      ];
      const clustered = clusterLines(lines, 15, 0.1);
      expect(clustered.length).toBe(2);
    });

    it('keeps distant lines separate', () => {
      const lines: DetectedLine[] = [
        { rho: 50, theta: 0, votes: 100 },
        { rho: 200, theta: Math.PI / 2, votes: 90 },
      ];
      const clustered = clusterLines(lines, 15, 0.1);
      expect(clustered.length).toBe(2);
    });
  });

  describe('separateLines', () => {
    it('separates horizontal and vertical lines', () => {
      const lines: DetectedLine[] = [
        { rho: 50, theta: Math.PI / 2, votes: 100 }, // horizontal
        { rho: 100, theta: 0.01, votes: 90 }, // vertical
        { rho: 150, theta: Math.PI / 2 - 0.05, votes: 80 }, // horizontal
      ];
      const { horizontal, vertical } = separateLines(lines);
      expect(horizontal).toHaveLength(2);
      expect(vertical).toHaveLength(1);
    });

    it('sorts by rho', () => {
      const lines: DetectedLine[] = [
        { rho: 150, theta: Math.PI / 2, votes: 100 },
        { rho: 50, theta: Math.PI / 2, votes: 90 },
      ];
      const { horizontal } = separateLines(lines);
      expect(horizontal[0].rho).toBeLessThan(horizontal[1].rho);
    });
  });

  describe('computeIntersections', () => {
    it('computes all intersections', () => {
      const hRhos = [10, 20, 30];
      const vRhos = [5, 15];
      const intersections = computeIntersections(hRhos, vRhos);
      expect(intersections).toHaveLength(6);
      expect(intersections[0]).toEqual({ x: 5, y: 10 });
    });

    it('returns empty for no lines', () => {
      expect(computeIntersections([], [10, 20])).toHaveLength(0);
    });
  });

  describe('classifyLayout', () => {
    it('classifies uniform grid', () => {
      const hRhos = [10, 30, 50, 70, 90];
      const vRhos = [10, 30, 50, 70, 90];
      expect(classifyLayout(hRhos, vRhos, 100, 100)).toBe('grid');
    });

    it('classifies free-form with too few lines', () => {
      expect(classifyLayout([10], [20], 100, 100)).toBe('free-form');
    });

    it('classifies sashing with alternating spacing', () => {
      // Alternating: block(20px), sash(5px), block(20px), sash(5px), block(20px)
      const hRhos = [0, 20, 25, 45, 50, 70, 75, 95];
      const vRhos = [0, 20, 25, 45, 50, 70, 75, 95];
      const result = classifyLayout(hRhos, vRhos, 100, 100);
      expect(result).toBe('sashing');
    });
  });
});
