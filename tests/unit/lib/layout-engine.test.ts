import { describe, it, expect } from 'vitest';
import {
  computeLayout,
  computeGridLayout,
  computeSashingLayout,
  computeOnPointLayout,
  computeBorderStrips,
  getDefaultLayoutConfig,
  type LayoutConfig,
} from '@/lib/layout-utils';
import { PIXELS_PER_INCH } from '@/lib/constants';

describe('layout-utils', () => {
  describe('getDefaultLayoutConfig', () => {
    it('returns free-form layout with sensible defaults', () => {
      const config = getDefaultLayoutConfig();
      expect(config.type).toBe('free-form');
      expect(config.rows).toBe(3);
      expect(config.cols).toBe(3);
      expect(config.blockSize).toBe(6);
      expect(config.sashing.width).toBe(1);
      expect(config.borders).toEqual([]);
    });
  });

  describe('computeLayout', () => {
    it('returns empty result for free-form layout', () => {
      const config: LayoutConfig = {
        type: 'free-form',
        rows: 3,
        cols: 3,
        blockSize: 6,
        sashing: { width: 1, color: '#FFF', fabricId: null },
        borders: [],
      };
      const result = computeLayout(config, PIXELS_PER_INCH);
      expect(result.cells).toEqual([]);
      expect(result.sashingStrips).toEqual([]);
      expect(result.settingTriangles).toEqual([]);
      expect(result.borderStrips).toEqual([]);
      expect(result.innerWidth).toBe(0);
      expect(result.innerHeight).toBe(0);
    });

    it('delegates to grid computation for grid type', () => {
      const config: LayoutConfig = {
        type: 'grid',
        rows: 2,
        cols: 3,
        blockSize: 6,
        sashing: { width: 1, color: '#FFF', fabricId: null },
        borders: [],
      };
      const result = computeLayout(config, PIXELS_PER_INCH);
      expect(result.cells.length).toBe(6);
    });

    it('includes borders in total dimensions', () => {
      const config: LayoutConfig = {
        type: 'grid',
        rows: 2,
        cols: 2,
        blockSize: 6,
        sashing: { width: 1, color: '#FFF', fabricId: null },
        borders: [{ width: 2, color: '#000', fabricId: null }],
      };
      const result = computeLayout(config, PIXELS_PER_INCH);
      const borderPx = 2 * PIXELS_PER_INCH;
      expect(result.totalWidth).toBe(result.innerWidth + borderPx * 2);
      expect(result.totalHeight).toBe(result.innerHeight + borderPx * 2);
    });
  });

  describe('computeGridLayout', () => {
    it('generates correct number of cells', () => {
      const result = computeGridLayout(3, 4, 96);
      expect(result.cells.length).toBe(12);
    });

    it('positions cells correctly', () => {
      const blockSize = 96;
      const result = computeGridLayout(2, 2, blockSize);

      expect(result.cells[0]).toEqual({
        row: 0,
        col: 0,
        centerX: 48,
        centerY: 48,
        size: 96,
        rotation: 0,
      });
      expect(result.cells[1]).toEqual({
        row: 0,
        col: 1,
        centerX: 144,
        centerY: 48,
        size: 96,
        rotation: 0,
      });
      expect(result.cells[2]).toEqual({
        row: 1,
        col: 0,
        centerX: 48,
        centerY: 144,
        size: 96,
        rotation: 0,
      });
      expect(result.cells[3]).toEqual({
        row: 1,
        col: 1,
        centerX: 144,
        centerY: 144,
        size: 96,
        rotation: 0,
      });
    });

    it('computes correct inner dimensions', () => {
      const result = computeGridLayout(3, 4, 100);
      expect(result.innerWidth).toBe(400);
      expect(result.innerHeight).toBe(300);
    });

    it('has no sashing strips or setting triangles', () => {
      const result = computeGridLayout(2, 2, 96);
      expect(result.sashingStrips).toEqual([]);
      expect(result.settingTriangles).toEqual([]);
    });

    it('handles single cell', () => {
      const result = computeGridLayout(1, 1, 200);
      expect(result.cells.length).toBe(1);
      expect(result.cells[0].centerX).toBe(100);
      expect(result.cells[0].centerY).toBe(100);
      expect(result.innerWidth).toBe(200);
      expect(result.innerHeight).toBe(200);
    });
  });

  describe('computeSashingLayout', () => {
    const sashing = { width: 1, color: '#CCC', fabricId: null };

    it('generates correct number of cells', () => {
      const result = computeSashingLayout(3, 3, 96, 10, sashing);
      expect(result.cells.length).toBe(9);
    });

    it('positions cells with sashing gaps', () => {
      const blockSize = 100;
      const sashWidth = 20;
      const result = computeSashingLayout(2, 2, blockSize, sashWidth, sashing);

      // First cell center
      expect(result.cells[0].centerX).toBe(50);
      expect(result.cells[0].centerY).toBe(50);

      // Second cell (shifted by block + sashing)
      expect(result.cells[1].centerX).toBe(170); // 120 + 50
      expect(result.cells[1].centerY).toBe(50);
    });

    it('computes correct inner dimensions with sashing', () => {
      const blockSize = 100;
      const sashWidth = 20;
      const result = computeSashingLayout(3, 3, blockSize, sashWidth, sashing);
      // 3 blocks * 100 + 2 gaps * 20 = 340
      expect(result.innerWidth).toBe(340);
      expect(result.innerHeight).toBe(340);
    });

    it('generates vertical sashing strips between columns', () => {
      const result = computeSashingLayout(2, 3, 100, 20, sashing);
      const verticals = result.sashingStrips.filter((s) => s.width === 20 && s.height > 20);
      expect(verticals.length).toBe(2);
    });

    it('generates horizontal sashing strips between rows', () => {
      const result = computeSashingLayout(3, 2, 100, 20, sashing);
      const horizontals = result.sashingStrips.filter((s) => s.height === 20 && s.width > 20);
      expect(horizontals.length).toBe(2);
    });

    it('generates cornerstone squares at intersections', () => {
      const result = computeSashingLayout(3, 3, 100, 20, sashing);
      const cornerstones = result.sashingStrips.filter(
        (s) => s.width === 20 && s.height === 20
      );
      // (rows-1) * (cols-1) = 2 * 2 = 4
      expect(cornerstones.length).toBe(4);
    });

    it('has no sashing strips for single row and column', () => {
      const result = computeSashingLayout(1, 1, 100, 20, sashing);
      expect(result.sashingStrips).toEqual([]);
    });
  });

  describe('computeOnPointLayout', () => {
    it('generates correct number of cells', () => {
      const result = computeOnPointLayout(3, 3, 100);
      expect(result.cells.length).toBe(9);
    });

    it('sets rotation to 45 degrees', () => {
      const result = computeOnPointLayout(2, 2, 100);
      result.cells.forEach((cell) => {
        expect(cell.rotation).toBe(45);
      });
    });

    it('positions cells with cell size = blockSize * sqrt(2)', () => {
      const blockSize = 100;
      const cellSize = blockSize * Math.SQRT2;
      const result = computeOnPointLayout(2, 2, blockSize);

      expect(result.cells[0].centerX).toBeCloseTo(cellSize / 2, 5);
      expect(result.cells[0].centerY).toBeCloseTo(cellSize / 2, 5);
      expect(result.cells[1].centerX).toBeCloseTo(cellSize + cellSize / 2, 5);
    });

    it('computes correct inner dimensions', () => {
      const blockSize = 100;
      const cellSize = blockSize * Math.SQRT2;
      const result = computeOnPointLayout(3, 4, blockSize);
      expect(result.innerWidth).toBeCloseTo(4 * cellSize, 5);
      expect(result.innerHeight).toBeCloseTo(3 * cellSize, 5);
    });

    it('generates setting triangles for edges', () => {
      const result = computeOnPointLayout(3, 3, 100);
      const sideTriangles = result.settingTriangles.filter((t) => t.type === 'side');
      // Top: 2, Bottom: 2, Left: 2, Right: 2 = 8
      expect(sideTriangles.length).toBe(8);
    });

    it('generates 4 corner setting triangles', () => {
      const result = computeOnPointLayout(3, 3, 100);
      const cornerTriangles = result.settingTriangles.filter((t) => t.type === 'corner');
      expect(cornerTriangles.length).toBe(4);
    });

    it('generates corner triangles even for 1x1 layout', () => {
      const result = computeOnPointLayout(1, 1, 100);
      expect(result.cells.length).toBe(1);
      const corners = result.settingTriangles.filter((t) => t.type === 'corner');
      expect(corners.length).toBe(4);
      // No side triangles for 1x1
      const sides = result.settingTriangles.filter((t) => t.type === 'side');
      expect(sides.length).toBe(0);
    });

    it('setting triangle points have valid coordinates', () => {
      const result = computeOnPointLayout(2, 2, 100);
      result.settingTriangles.forEach((tri) => {
        expect(tri.points.length).toBe(3);
        tri.points.forEach((p) => {
          expect(typeof p.x).toBe('number');
          expect(typeof p.y).toBe('number');
          expect(isNaN(p.x)).toBe(false);
          expect(isNaN(p.y)).toBe(false);
        });
      });
    });
  });

  describe('computeBorderStrips', () => {
    it('returns empty for no borders', () => {
      const strips = computeBorderStrips(100, 100, [], PIXELS_PER_INCH);
      expect(strips).toEqual([]);
    });

    it('generates 4 strips per border', () => {
      const borders = [{ width: 2, color: '#000', fabricId: null }];
      const strips = computeBorderStrips(100, 100, borders, 1);
      expect(strips.length).toBe(4);
    });

    it('generates 8 strips for 2 borders', () => {
      const borders = [
        { width: 2, color: '#000', fabricId: null },
        { width: 1, color: '#FFF', fabricId: null },
      ];
      const strips = computeBorderStrips(100, 100, borders, 1);
      expect(strips.length).toBe(8);
    });

    it('strips have correct sides', () => {
      const borders = [{ width: 2, color: '#000', fabricId: null }];
      const strips = computeBorderStrips(100, 100, borders, 1);
      const sides = strips.map((s) => s.side);
      expect(sides).toContain('top');
      expect(sides).toContain('bottom');
      expect(sides).toContain('left');
      expect(sides).toContain('right');
    });

    it('top strip has correct dimensions', () => {
      const bw = 10;
      const borders = [{ width: bw, color: '#000', fabricId: null }];
      const strips = computeBorderStrips(200, 150, borders, 1);
      const top = strips.find((s) => s.side === 'top')!;
      // Top strip spans only innerWidth (not including corners)
      // Corners are covered by left/right strips
      expect(top.x).toBe(0);
      expect(top.y).toBe(-bw);
      expect(top.width).toBe(200);
      expect(top.height).toBe(bw);
    });

    it('left strip covers full height including corners', () => {
      const bw = 10;
      const borders = [{ width: bw, color: '#000', fabricId: null }];
      const strips = computeBorderStrips(200, 150, borders, 1);
      const left = strips.find((s) => s.side === 'left')!;
      // Left strip spans full outer height including corners
      expect(left.x).toBe(-bw);
      expect(left.y).toBe(-bw);
      expect(left.width).toBe(bw);
      expect(left.height).toBe(150 + 2 * bw);
    });

    it('preserves border color and fabricId', () => {
      const borders = [{ width: 2, color: '#FF0000', fabricId: 'fab-123' }];
      const strips = computeBorderStrips(100, 100, borders, 1);
      strips.forEach((s) => {
        expect(s.color).toBe('#FF0000');
        expect(s.fabricId).toBe('fab-123');
        expect(s.borderIndex).toBe(0);
      });
    });

    it('outer border wraps around inner border', () => {
      const borders = [
        { width: 10, color: '#000', fabricId: null },
        { width: 5, color: '#FFF', fabricId: null },
      ];
      const strips = computeBorderStrips(100, 100, borders, 1);
      const innerTop = strips.find((s) => s.borderIndex === 0 && s.side === 'top')!;
      const outerTop = strips.find((s) => s.borderIndex === 1 && s.side === 'top')!;
      // Outer border should be further from center
      expect(outerTop.y).toBeLessThan(innerTop.y);
      expect(outerTop.width).toBeGreaterThan(innerTop.width);
    });
  });
});
