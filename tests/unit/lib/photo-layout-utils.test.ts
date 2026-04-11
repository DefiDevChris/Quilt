import { describe, it, expect } from 'vitest';
import {
  computeHomography,
  projectPoint,
  rectCorners,
  sortCornersClockwise,
  warpPerspective,
} from '@/lib/perspective-engine';
import { buildBlockPattern } from '@/lib/photo-layout-utils';
import { BLOCK_GRID_PRESETS, getBlockGridPreset } from '@/lib/block-grid-presets';
import type { QuadCorners } from '@/lib/photo-layout-types';

// jsdom does not ship an ImageData implementation. The perspective engine
// instantiates `new ImageData(w, h)` internally while warping, so we provide
// a minimal polyfill that mirrors the browser contract.
if (typeof (globalThis as { ImageData?: unknown }).ImageData === 'undefined') {
  class PolyfillImageData {
    readonly data: Uint8ClampedArray;
    readonly width: number;
    readonly height: number;
    constructor(width: number, height: number) {
      this.width = width;
      this.height = height;
      this.data = new Uint8ClampedArray(width * height * 4);
    }
  }
  (globalThis as { ImageData: unknown }).ImageData =
    PolyfillImageData as unknown as typeof ImageData;
}

/**
 * Perspective-first pipeline tests — replaces the old 15-step CV pipeline
 * tests that were deleted with the heuristic detection code. Focuses on
 * math correctness (homography, warp, grid generation) rather than UI.
 */
describe('photo-layout pipeline', () => {
  describe('sortCornersClockwise', () => {
    it('returns corners in TL,TR,BR,BL order regardless of input order', () => {
      const corners: QuadCorners = [
        { x: 100, y: 100 }, // BR
        { x: 0, y: 0 },     // TL
        { x: 100, y: 0 },   // TR
        { x: 0, y: 100 },   // BL
      ];
      const sorted = sortCornersClockwise(corners);
      expect(sorted).not.toBeNull();
      expect(sorted![0]).toEqual({ x: 0, y: 0 });
      expect(sorted![1]).toEqual({ x: 100, y: 0 });
      expect(sorted![2]).toEqual({ x: 100, y: 100 });
      expect(sorted![3]).toEqual({ x: 0, y: 100 });
    });
  });

  describe('computeHomography', () => {
    it('is the identity transform when src === dst', () => {
      const dst = rectCorners(200, 200);
      const h = computeHomography(dst, dst);
      expect(h).not.toBeNull();
      const p = projectPoint(h!, 50, 75);
      expect(p).not.toBeNull();
      expect(p!.x).toBeCloseTo(50, 5);
      expect(p!.y).toBeCloseTo(75, 5);
    });

    it('maps a skewed quadrilateral to a rectangle', () => {
      const src: QuadCorners = [
        { x: 10, y: 5 },
        { x: 90, y: 12 },
        { x: 95, y: 80 },
        { x: 5, y: 75 },
      ];
      const dst = rectCorners(100, 100);
      const h = computeHomography(src, dst);
      expect(h).not.toBeNull();
      for (let i = 0; i < 4; i++) {
        const projected = projectPoint(h!, src[i].x, src[i].y);
        expect(projected!.x).toBeCloseTo(dst[i].x, 3);
        expect(projected!.y).toBeCloseTo(dst[i].y, 3);
      }
    });
  });

  describe('warpPerspective', () => {
    it('returns a bitmap with the requested dimensions', () => {
      const source = new ImageData(100, 100);
      // Fill with an opaque green so we can verify resampling ran.
      for (let i = 0; i < source.data.length; i += 4) {
        source.data[i + 0] = 0;
        source.data[i + 1] = 200;
        source.data[i + 2] = 0;
        source.data[i + 3] = 255;
      }
      const h = computeHomography(rectCorners(100, 100), rectCorners(50, 50));
      const warped = warpPerspective(source, h!, 50, 50);
      expect(warped).not.toBeNull();
      expect(warped!.width).toBe(50);
      expect(warped!.height).toBe(50);
      // Middle pixel should be solid green.
      const mid = (25 * 50 + 25) * 4;
      expect(warped!.data[mid + 1]).toBeGreaterThan(150);
    });
  });

  describe('block grid presets', () => {
    it('exposes a 9-patch preset', () => {
      const preset = getBlockGridPreset('grid-3x3');
      expect(preset).toBeDefined();
      expect(preset!.rows).toBe(3);
      expect(preset!.cols).toBe(3);
    });

    it('includes HST variants with diagonal splits', () => {
      const hst = BLOCK_GRID_PRESETS.find((p) => p.id === 'hst-2x2');
      expect(hst).toBeDefined();
      expect(hst!.splits?.length).toBe(4);
    });
  });

  describe('buildBlockPattern', () => {
    it('produces one cell per patch for a plain 9-patch', () => {
      const preset = getBlockGridPreset('grid-3x3')!;
      const { cells } = buildBlockPattern(preset, 12, 12, null);
      expect(cells).toHaveLength(9);
      for (const cell of cells) {
        expect(cell.polygonInches.length).toBe(4);
      }
    });

    it('produces two triangular halves for every HST cell', () => {
      const preset = getBlockGridPreset('hst-2x2')!;
      const { cells } = buildBlockPattern(preset, 12, 12, null);
      // 2x2 = 4 cells, each split into 2 halves.
      expect(cells).toHaveLength(8);
      for (const cell of cells) {
        expect(cell.polygonInches.length).toBe(3);
      }
    });

    it('fills cells with a neutral placeholder when no warped image is given', () => {
      const preset = getBlockGridPreset('grid-2x2')!;
      const { cells } = buildBlockPattern(preset, 10, 10, null);
      expect(cells.every((c) => /^#[0-9a-f]{6}$/i.test(c.fabricColor))).toBe(true);
    });
  });
});
