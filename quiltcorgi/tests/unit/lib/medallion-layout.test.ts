import { describe, it, expect } from 'vitest';
import { computeMedallionLayout } from '@/lib/layouts/medallion-layout';
import type { LayoutConfig } from '@/lib/layout-engine';

function makeConfig(overrides: Partial<LayoutConfig> = {}): LayoutConfig {
  return {
    type: 'medallion',
    rows: 1,
    cols: 1,
    blockSize: 12,
    sashing: { width: 0, color: '#FFF', fabricId: null },
    borders: [],
    medallion: {
      centerBlockSize: 12,
      rounds: [],
    },
    ...overrides,
  };
}

describe('medallion-layout', () => {
  it('places center block at correct position', () => {
    const result = computeMedallionLayout(makeConfig(), 96);
    expect(result.cells.length).toBe(1);
    const center = result.cells[0];
    expect(center.size).toBe(12 * 96);
    expect(center.centerX).toBe(6 * 96);
    expect(center.centerY).toBe(6 * 96);
  });

  it('returns correct inner dimensions for center block only', () => {
    const result = computeMedallionLayout(makeConfig(), 96);
    expect(result.innerWidth).toBe(12 * 96);
    expect(result.innerHeight).toBe(12 * 96);
  });

  it('increases total dimensions with each solid round', () => {
    const config = makeConfig({
      medallion: {
        centerBlockSize: 12,
        rounds: [
          { type: 'solid', width: 3, color: '#D4883C', fabricId: null },
        ],
      },
    });
    const result = computeMedallionLayout(config, 96);
    // Total should be center (12) + 2 sides * round width (3) = 18
    expect(result.totalWidth).toBe(18 * 96);
    expect(result.totalHeight).toBe(18 * 96);
  });

  it('adds border strips for solid rounds', () => {
    const config = makeConfig({
      medallion: {
        centerBlockSize: 12,
        rounds: [
          { type: 'solid', width: 3, color: '#D4883C', fabricId: null },
        ],
      },
    });
    const result = computeMedallionLayout(config, 96);
    // 4 strips (top, bottom, left, right)
    expect(result.borderStrips.length).toBe(4);
  });

  it('handles multiple rounds', () => {
    const config = makeConfig({
      medallion: {
        centerBlockSize: 8,
        rounds: [
          { type: 'solid', width: 2, color: '#AAA', fabricId: null },
          { type: 'solid', width: 4, color: '#BBB', fabricId: null },
        ],
      },
    });
    const result = computeMedallionLayout(config, 96);
    // Total = 8 + 2*(2+4) = 20
    expect(result.totalWidth).toBe(20 * 96);
    expect(result.borderStrips.length).toBe(8); // 4 per round
  });

  it('returns empty result for no medallion config', () => {
    const config = makeConfig({ medallion: undefined });
    const result = computeMedallionLayout(config, 96);
    expect(result.cells).toEqual([]);
  });
});
