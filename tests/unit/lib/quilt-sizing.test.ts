import { describe, it, expect } from 'vitest';
import {
  snapToStandardBlockSize,
  computeLayoutSize,
  computeTemplateSize,
  STANDARD_BLOCK_SIZES,
} from '../../../src/lib/quilt-sizing';
import type { LayoutPreset } from '@/lib/layout-library';

describe('quilt-sizing', () => {
  it('snaps block sizes correctly', () => {
    expect(snapToStandardBlockSize(5)).toBe(6);
    expect(snapToStandardBlockSize(7.5)).toBe(8);
    expect(snapToStandardBlockSize(11)).toBe(10);
    expect(snapToStandardBlockSize(15)).toBe(14);
    expect(snapToStandardBlockSize(20)).toBe(16);
  });

  it('exports STANDARD_BLOCK_SIZES constant', () => {
    expect(STANDARD_BLOCK_SIZES).toEqual([6, 8, 10, 12, 14, 16]);
  });

  it('computes layout sizes with 5x4 grid', () => {
    const preset: LayoutPreset = {
      id: 'test-5x4',
      name: 'Test 5x4',
      description: 'Test',
      category: 'grid',
      config: {
        type: 'grid',
        rows: 5,
        cols: 4,
        blockSize: 10,
        sashing: { width: 0, color: '#F5F0E8', fabricId: null },
        borders: [],
      },
    };
    const size = computeLayoutSize(preset, 10, false);
    expect(size.width).toBe(40);
    expect(size.height).toBe(50);
  });

  it('computes layout sizes with rotation', () => {
    const preset: LayoutPreset = {
      id: 'test-5x4',
      name: 'Test 5x4',
      description: 'Test',
      category: 'grid',
      config: {
        type: 'grid',
        rows: 5,
        cols: 4,
        blockSize: 10,
        sashing: { width: 0, color: '#F5F0E8', fabricId: null },
        borders: [],
      },
    };
    const size = computeLayoutSize(preset, 10, true);
    expect(size.width).toBe(50);
    expect(size.height).toBe(40);
  });

  it('computes layout sizes with sashing and borders', () => {
    const preset: LayoutPreset = {
      id: 'test-3x3',
      name: 'Test 3x3',
      description: 'Test',
      category: 'sashing',
      config: {
        type: 'sashing',
        rows: 3,
        cols: 3,
        blockSize: 10,
        sashing: { width: 2, color: '#F5F0E8', fabricId: null },
        borders: [{ width: 4, color: '#FFFFFF', fabricId: null }],
      },
    };
    const size = computeLayoutSize(preset, 10, false);
    // cols: 3 * 10 = 30 + 2 * 2 (sashing) = 34 + 8 (borders) = 42
    expect(size.width).toBe(42);
    expect(size.height).toBe(42);
  });

  it('computes template sizes appropriately', () => {
    const template = {
      templateData: {
        grid: { rows: 4, cols: 4 },
        sashing: { width: 1 },
      },
    };
    const size = computeTemplateSize(template, 12, false);
    // 4 * 12 = 48 + 3 * 1 = 51
    expect(size.width).toBe(51);
    expect(size.height).toBe(51);
  });
});
