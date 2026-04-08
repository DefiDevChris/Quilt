/**
 * Fence Engine Tests
 *
 * Tests the pure computation engine that converts LayoutTemplate + quilt dimensions
 * into FenceArea[] arrays. Zero React/DOM/Fabric.js dependencies.
 */

import { describe, it, expect } from 'vitest';
import { computeFenceAreas } from '@/lib/fence-engine';
import type { LayoutTemplate } from '@/types/layout';

// Helper: create a minimal layout template for testing
function createTemplate(overrides: Partial<LayoutTemplate> = {}): LayoutTemplate {
  return {
    id: 'test-template',
    name: 'Test Template',
    category: 'straight',
    gridRows: 3,
    gridCols: 3,
    defaultBlockSize: 10,
    sashingWidth: 0,
    hasCornerstones: false,
    borders: [],
    bindingWidth: 0,
    thumbnailSvg: '',
    ...overrides,
  };
}

describe('computeFenceAreas', () => {
  describe('straight/grid layout', () => {
    it('should generate correct number of block cells for a 3x3 grid', () => {
      const template = createTemplate({ gridRows: 3, gridCols: 3, defaultBlockSize: 10 });
      const quiltWidth = 30;
      const quiltHeight = 30;
      const pxPerUnit = 96;

      const areas = computeFenceAreas(template, quiltWidth, quiltHeight, pxPerUnit);
      const blockCells = areas.filter((a) => a.role === 'block-cell');

      expect(blockCells).toHaveLength(9);
    });

    it('should generate correct number of block cells for a 4x5 grid', () => {
      const template = createTemplate({ gridRows: 4, gridCols: 5, defaultBlockSize: 8 });
      const areas = computeFenceAreas(template, 40, 32, 96);
      const blockCells = areas.filter((a) => a.role === 'block-cell');

      expect(blockCells).toHaveLength(20);
    });

    it('should scale cells to fill quilt dimensions', () => {
      const template = createTemplate({ gridRows: 2, gridCols: 2, defaultBlockSize: 10 });
      const quiltWidth = 20;
      const quiltHeight = 20;
      const pxPerUnit = 96;

      const areas = computeFenceAreas(template, quiltWidth, quiltHeight, pxPerUnit);
      const blockCells = areas.filter((a) => a.role === 'block-cell');

      const expectedCellSizePx = (quiltWidth / 2) * pxPerUnit; // 10 * 96 = 960

      blockCells.forEach((cell) => {
        expect(Math.round(cell.width)).toBe(Math.round(expectedCellSizePx));
        expect(Math.round(cell.height)).toBe(Math.round(expectedCellSizePx));
      });
    });

    it('should position cells correctly in grid', () => {
      const template = createTemplate({ gridRows: 2, gridCols: 2, defaultBlockSize: 10 });
      const areas = computeFenceAreas(template, 20, 20, 96);
      const blockCells = areas.filter((a) => a.role === 'block-cell');

      // Should be ordered row by row, col by col
      expect(blockCells[0].row).toBe(0);
      expect(blockCells[0].col).toBe(0);
      expect(blockCells[1].row).toBe(0);
      expect(blockCells[1].col).toBe(1);
      expect(blockCells[2].row).toBe(1);
      expect(blockCells[2].col).toBe(0);
      expect(blockCells[3].row).toBe(1);
      expect(blockCells[3].col).toBe(1);
    });

    it('should handle non-square quilts (rectangular)', () => {
      const template = createTemplate({ gridRows: 2, gridCols: 3, defaultBlockSize: 10 });
      // 30 wide x 20 tall
      const areas = computeFenceAreas(template, 30, 20, 96);
      const blockCells = areas.filter((a) => a.role === 'block-cell');

      expect(blockCells).toHaveLength(6);

      // All cells should have positive dimensions
      blockCells.forEach((cell) => {
        expect(cell.width).toBeGreaterThan(0);
        expect(cell.height).toBeGreaterThan(0);
      });
    });
  });

  describe('sashing layout', () => {
    it('should generate sashing strips between rows', () => {
      const template = createTemplate({
        category: 'sashing',
        gridRows: 3,
        gridCols: 3,
        defaultBlockSize: 10,
        sashingWidth: 2,
        hasCornerstones: false,
      });
      const areas = computeFenceAreas(template, 36, 36, 96);

      const sashingAreas = areas.filter((a) => a.role === 'sashing');
      expect(sashingAreas.length).toBeGreaterThan(0);
    });

    it('should generate cornerstones when enabled', () => {
      const template = createTemplate({
        category: 'sashing',
        gridRows: 3,
        gridCols: 3,
        defaultBlockSize: 10,
        sashingWidth: 2,
        hasCornerstones: true,
      });
      const areas = computeFenceAreas(template, 36, 36, 96);

      const cornerstones = areas.filter((a) => a.role === 'cornerstone');
      expect(cornerstones.length).toBeGreaterThan(0);
    });

    it('should not generate cornerstones when disabled', () => {
      const template = createTemplate({
        category: 'sashing',
        gridRows: 3,
        gridCols: 3,
        defaultBlockSize: 10,
        sashingWidth: 2,
        hasCornerstones: false,
      });
      const areas = computeFenceAreas(template, 36, 36, 96);

      const cornerstones = areas.filter((a) => a.role === 'cornerstone');
      expect(cornerstones).toHaveLength(0);
    });
  });

  describe('border layout', () => {
    it('should generate border areas when borders are configured', () => {
      const template = createTemplate({
        gridRows: 2,
        gridCols: 2,
        defaultBlockSize: 10,
        borders: [{ width: 2, position: 0 }],
      });
      const areas = computeFenceAreas(template, 24, 24, 96);

      const borders = areas.filter((a) => a.role === 'border');
      expect(borders.length).toBeGreaterThan(0);
    });

    it('should generate multiple border layers', () => {
      const template = createTemplate({
        gridRows: 2,
        gridCols: 2,
        defaultBlockSize: 10,
        borders: [
          { width: 2, position: 0 },
          { width: 1, position: 1 },
        ],
      });
      const areas = computeFenceAreas(template, 26, 26, 96);

      const borders = areas.filter((a) => a.role === 'border');
      const borderIndices = new Set(borders.map((b) => b.borderIndex));
      expect(borderIndices.size).toBe(2);
    });
  });

  describe('binding layout', () => {
    it('should generate binding areas when bindingWidth > 0', () => {
      const template = createTemplate({
        gridRows: 2,
        gridCols: 2,
        defaultBlockSize: 10,
        bindingWidth: 2,
      });
      const areas = computeFenceAreas(template, 24, 24, 96);

      const bindings = areas.filter((a) => a.role === 'binding');
      expect(bindings).toHaveLength(4); // top, bottom, left, right
    });

    it('should not generate binding areas when bindingWidth is 0', () => {
      const template = createTemplate({
        gridRows: 2,
        gridCols: 2,
        defaultBlockSize: 10,
        bindingWidth: 0,
      });
      const areas = computeFenceAreas(template, 20, 20, 96);

      const bindings = areas.filter((a) => a.role === 'binding');
      expect(bindings).toHaveLength(0);
    });

    it('should position binding around the outer edge', () => {
      const template = createTemplate({
        gridRows: 2,
        gridCols: 2,
        defaultBlockSize: 10,
        bindingWidth: 2,
      });
      const areas = computeFenceAreas(template, 24, 24, 96);

      const bindings = areas.filter((a) => a.role === 'binding');
      const topBinding = bindings.find((b) => b.id === 'binding-top');
      const bottomBinding = bindings.find((b) => b.id === 'binding-bottom');
      const leftBinding = bindings.find((b) => b.id === 'binding-left');
      const rightBinding = bindings.find((b) => b.id === 'binding-right');

      expect(topBinding).toBeDefined();
      expect(bottomBinding).toBeDefined();
      expect(leftBinding).toBeDefined();
      expect(rightBinding).toBeDefined();
    });
  });

  describe('on-point layout', () => {
    it('should generate block cells for on-point layout', () => {
      const template = createTemplate({
        category: 'on-point',
        gridRows: 2,
        gridCols: 2,
        defaultBlockSize: 10,
      });
      const areas = computeFenceAreas(template, 30, 30, 96);

      const blockCells = areas.filter((a) => a.role === 'block-cell');
      expect(blockCells.length).toBeGreaterThan(0);
    });
  });

  describe('strippy layout', () => {
    it('should generate alternating block and sashing columns', () => {
      const template = createTemplate({
        category: 'strippy',
        gridRows: 3,
        gridCols: 5,
        defaultBlockSize: 10,
        sashingWidth: 2,
      });
      const areas = computeFenceAreas(template, 30, 30, 96);

      const blockCells = areas.filter((a) => a.role === 'block-cell');
      const sashingAreas = areas.filter((a) => a.role === 'sashing');

      // 5 cols: 3 block cols (0, 2, 4) + 2 sashing cols (1, 3)
      expect(blockCells).toHaveLength(9); // 3 rows * 3 block cols
      expect(sashingAreas).toHaveLength(2);
    });
  });

  describe('medallion layout', () => {
    it('should generate center block and border areas', () => {
      const template = createTemplate({
        category: 'medallion',
        gridRows: 1,
        gridCols: 1,
        defaultBlockSize: 10,
        borders: [{ width: 3, position: 0 }],
      });
      const areas = computeFenceAreas(template, 20, 20, 96);

      const blockCells = areas.filter((a) => a.role === 'block-cell');
      const borders = areas.filter((a) => a.role === 'border');

      expect(blockCells).toHaveLength(1);
      expect(borders.length).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('should handle 1x1 grid', () => {
      const template = createTemplate({ gridRows: 1, gridCols: 1, defaultBlockSize: 10 });
      const areas = computeFenceAreas(template, 10, 10, 96);

      const blockCells = areas.filter((a) => a.role === 'block-cell');
      expect(blockCells).toHaveLength(1);
    });

    it('should handle large grids (10x10)', () => {
      const template = createTemplate({ gridRows: 10, gridCols: 10, defaultBlockSize: 5 });
      const areas = computeFenceAreas(template, 50, 50, 96);

      const blockCells = areas.filter((a) => a.role === 'block-cell');
      expect(blockCells).toHaveLength(100);
    });

    it('should handle different pixel densities (metric)', () => {
      const template = createTemplate({ gridRows: 2, gridCols: 2, defaultBlockSize: 25 });
      const areas = computeFenceAreas(template, 50, 50, 37.8);

      const blockCells = areas.filter((a) => a.role === 'block-cell');
      expect(blockCells).toHaveLength(4);

      // All cells should have positive dimensions
      blockCells.forEach((cell) => {
        expect(cell.width).toBeGreaterThan(0);
        expect(cell.height).toBeGreaterThan(0);
      });
    });

    it('should assign unique IDs to each area', () => {
      const template = createTemplate({
        category: 'sashing',
        gridRows: 2,
        gridCols: 2,
        defaultBlockSize: 10,
        sashingWidth: 2,
        hasCornerstones: true,
        borders: [{ width: 2, position: 0 }],
        bindingWidth: 2,
      });
      const areas = computeFenceAreas(template, 24, 24, 96);

      const ids = areas.map((a) => a.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should handle zero sashing width gracefully', () => {
      const template = createTemplate({
        category: 'sashing',
        gridRows: 2,
        gridCols: 2,
        defaultBlockSize: 10,
        sashingWidth: 0,
      });
      const areas = computeFenceAreas(template, 20, 20, 96);

      // Should still generate block cells even with zero sashing
      const blockCells = areas.filter((a) => a.role === 'block-cell');
      expect(blockCells.length).toBeGreaterThan(0);
    });
  });

  describe('area properties', () => {
    it('should set correct role for each area type', () => {
      const template = createTemplate({
        category: 'sashing',
        gridRows: 2,
        gridCols: 2,
        defaultBlockSize: 10,
        sashingWidth: 2,
        hasCornerstones: true,
        borders: [{ width: 2, position: 0 }],
        bindingWidth: 2,
      });
      const areas = computeFenceAreas(template, 24, 24, 96);

      const roles = new Set(areas.map((a) => a.role));
      expect(roles).toContain('block-cell');
      expect(roles).toContain('sashing');
      expect(roles).toContain('cornerstone');
      expect(roles).toContain('border');
      expect(roles).toContain('binding');
    });

    it('should initialize assignedFabricId as null', () => {
      const template = createTemplate({ gridRows: 2, gridCols: 2, defaultBlockSize: 10 });
      const areas = computeFenceAreas(template, 20, 20, 96);

      areas.forEach((area) => {
        expect(area.assignedFabricId).toBeNull();
      });
    });

    it('should initialize assignedBlockId as undefined/null for block cells', () => {
      const template = createTemplate({ gridRows: 2, gridCols: 2, defaultBlockSize: 10 });
      const areas = computeFenceAreas(template, 20, 20, 96);

      const blockCells = areas.filter((a) => a.role === 'block-cell');
      blockCells.forEach((cell) => {
        expect(cell.assignedBlockId).toBeUndefined();
      });
    });
  });
});
