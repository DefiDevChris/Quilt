import { describe, it, expect } from 'vitest';
import {
  snapToStandardBlockSize,
  isStandardBlockSize,
  computeLayoutSize,
  computeTemplateSize,
  STANDARD_BLOCK_SIZES,
  type QuiltTemplateForSizing,
} from '@/lib/quilt-sizing';
import type { LayoutPreset } from '@/lib/layout-library';

function makeLayoutPreset(overrides: Partial<LayoutPreset['config']> = {}): LayoutPreset {
  return {
    id: 'test-preset',
    name: 'Test Preset',
    description: 'Test',
    category: 'grid',
    config: {
      type: 'grid',
      rows: 3,
      cols: 3,
      blockSize: 6,
      sashing: { width: 0, color: '#F5F0E8', fabricId: null },
      borders: [],
      ...overrides,
    },
  };
}

describe('snapToStandardBlockSize', () => {
  it('snaps to the nearest standard size', () => {
    expect(snapToStandardBlockSize(5)).toBe(6);
    expect(snapToStandardBlockSize(7.5)).toBe(8);
    expect(snapToStandardBlockSize(11)).toBe(10);
    expect(snapToStandardBlockSize(15)).toBe(14);
    expect(snapToStandardBlockSize(20)).toBe(16);
  });

  it('returns standard sizes unchanged', () => {
    for (const size of STANDARD_BLOCK_SIZES) {
      expect(snapToStandardBlockSize(size)).toBe(size);
    }
  });
});

describe('isStandardBlockSize', () => {
  it('accepts standard sizes only', () => {
    expect(isStandardBlockSize(12)).toBe(true);
    expect(isStandardBlockSize(6)).toBe(true);
    expect(isStandardBlockSize(11)).toBe(false);
    expect(isStandardBlockSize(0)).toBe(false);
  });
});

describe('STANDARD_BLOCK_SIZES', () => {
  it('matches the canonical list', () => {
    expect(STANDARD_BLOCK_SIZES).toEqual([6, 8, 10, 12, 14, 16]);
  });
});

describe('computeLayoutSize', () => {
  it('computes a square 5×5 grid with no sashing or borders', () => {
    const preset = makeLayoutPreset({ rows: 5, cols: 5 });
    const size = computeLayoutSize(preset, 12);
    expect(size).toEqual({ width: 60, height: 60 });
  });

  it('computes a non-square 5×4 grid', () => {
    const preset = makeLayoutPreset({ rows: 5, cols: 4 });
    const size = computeLayoutSize(preset, 10);
    expect(size).toEqual({ width: 40, height: 50 });
  });

  it('swaps rows and cols when rotated', () => {
    const preset = makeLayoutPreset({ rows: 5, cols: 4 });
    const size = computeLayoutSize(preset, 10, true);
    expect(size).toEqual({ width: 50, height: 40 });
  });

  it('adds sashing between blocks (n-1 strips per axis)', () => {
    const preset = makeLayoutPreset({
      rows: 3,
      cols: 3,
      sashing: { width: 2, color: '#F5F0E8', fabricId: null },
    });
    const size = computeLayoutSize(preset, 10);
    // 3 * 10 + (3-1) * 2 = 34
    expect(size).toEqual({ width: 34, height: 34 });
  });

  it('adds borders on both sides of each axis', () => {
    const preset = makeLayoutPreset({
      rows: 3,
      cols: 3,
      borders: [
        { width: 4, color: '#FFFFFF', fabricId: null },
        { width: 1, color: '#FFFFFF', fabricId: null },
      ],
    });
    const size = computeLayoutSize(preset, 10);
    // 3 * 10 + (4 + 1) * 2 = 40
    expect(size).toEqual({ width: 40, height: 40 });
  });

  it('combines sashing and borders', () => {
    const preset = makeLayoutPreset({
      rows: 3,
      cols: 3,
      sashing: { width: 2, color: '#F5F0E8', fabricId: null },
      borders: [{ width: 4, color: '#FFFFFF', fabricId: null }],
    });
    const size = computeLayoutSize(preset, 10);
    // 3 * 10 + 2 * 2 + 4 * 2 = 42
    expect(size).toEqual({ width: 42, height: 42 });
  });
});

describe('computeTemplateSize', () => {
  it('reads gridRows/gridCols from templateData', () => {
    const template: QuiltTemplateForSizing = {
      templateData: {
        gridRows: 4,
        gridCols: 4,
        sashingWidth: 1,
      },
    };
    const size = computeTemplateSize(template, 12);
    // 4 * 12 + (4-1) * 1 = 51
    expect(size).toEqual({ width: 51, height: 51 });
  });

  it('rotates rows and cols when requested', () => {
    const template: QuiltTemplateForSizing = {
      templateData: { gridRows: 5, gridCols: 3 },
    };
    const size = computeTemplateSize(template, 10, true);
    // rotated → rows=3, cols=5; 5*10 width, 3*10 height
    expect(size).toEqual({ width: 50, height: 30 });
  });

  it('falls back to finishedWidth/finishedHeight when templateData lacks grid', () => {
    const template: QuiltTemplateForSizing = {
      finishedWidth: 72,
      finishedHeight: 90,
      templateData: { category: 'straight' },
    };
    const size = computeTemplateSize(template, 12);
    expect(size).toEqual({ width: 72, height: 90 });
  });

  it('uses 60×60 default when nothing is provided', () => {
    const template: QuiltTemplateForSizing = { templateData: null };
    expect(computeTemplateSize(template, 12)).toEqual({ width: 60, height: 60 });
  });

  it('rotates the fallback dimensions', () => {
    const template: QuiltTemplateForSizing = {
      finishedWidth: 50,
      finishedHeight: 65,
      templateData: null,
    };
    expect(computeTemplateSize(template, 12, true)).toEqual({ width: 65, height: 50 });
  });
});
