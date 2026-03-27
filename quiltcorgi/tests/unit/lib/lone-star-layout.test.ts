import { describe, it, expect } from 'vitest';
import { computeLoneStarLayout } from '@/lib/layouts/lone-star-layout';
import type { LayoutConfig } from '@/lib/layout-engine';

function makeConfig(overrides: Partial<LayoutConfig> = {}): LayoutConfig {
  return {
    type: 'lone-star',
    rows: 1,
    cols: 1,
    blockSize: 24,
    sashing: { width: 0, color: '#FFF', fabricId: null },
    borders: [],
    loneStar: {
      diamondRings: 4,
      ringColors: ['#D4883C', '#C9A06E', '#F5F0E8', '#B8860B'],
      backgroundFill: '#FAF8F5',
    },
    ...overrides,
  };
}

describe('lone-star-layout', () => {
  it('generates diamond cells for each ring and arm', () => {
    const result = computeLoneStarLayout(makeConfig(), 96);
    // 8 arms × 4 rings = 32 diamond cells
    expect(result.cells.length).toBe(32);
  });

  it('generates all valid cell positions (no NaN)', () => {
    const result = computeLoneStarLayout(makeConfig(), 96);
    for (const cell of result.cells) {
      expect(Number.isNaN(cell.centerX)).toBe(false);
      expect(Number.isNaN(cell.centerY)).toBe(false);
    }
  });

  it('generates background setting triangles and squares', () => {
    const result = computeLoneStarLayout(makeConfig(), 96);
    // 4 corner squares + 4 side triangles = 8 background shapes
    expect(result.settingTriangles.length).toBe(8);
  });

  it('sets total dimensions based on block size', () => {
    const result = computeLoneStarLayout(makeConfig(), 96);
    expect(result.totalWidth).toBe(24 * 96);
    expect(result.totalHeight).toBe(24 * 96);
  });

  it('changes cell count when ring count changes', () => {
    const config3 = makeConfig({ loneStar: { diamondRings: 3, ringColors: ['#A', '#B', '#C'], backgroundFill: '#FFF' } });
    const config6 = makeConfig({ loneStar: { diamondRings: 6, ringColors: ['#A', '#B', '#C', '#D', '#E', '#F'], backgroundFill: '#FFF' } });

    const result3 = computeLoneStarLayout(config3, 96);
    const result6 = computeLoneStarLayout(config6, 96);

    expect(result3.cells.length).toBe(24); // 8 × 3
    expect(result6.cells.length).toBe(48); // 8 × 6
  });

  it('returns empty result when loneStar config is missing', () => {
    const config = makeConfig({ loneStar: undefined });
    const result = computeLoneStarLayout(config, 96);
    expect(result.cells).toEqual([]);
  });
});
