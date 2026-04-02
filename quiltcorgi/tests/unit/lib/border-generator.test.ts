/* eslint-disable @typescript-eslint/no-explicit-any */
import { generateHstUnits, generateCornerUnit, generatePiecedBorder } from '@/lib/border-generator';
import type { BorderConfig } from '@/lib/layout-utils';

describe('generateHstUnits', () => {
  it('delegates to sawtooth generator', () => {
    const units = generateHstUnits(100, 20, '#ff0000', '#00ff00');
    expect(units.length).toBeGreaterThan(0);
  });
});

describe('generateCornerUnit', () => {
  it('handles block-turn treatment', () => {
    const unit = generateCornerUnit('block-turn', 50, '#ff0000', '#00ff00');
    expect(unit.svgData).toContain('polygon');
  });
});

describe('generatePiecedBorder', () => {
  it('returns empty for solid border', () => {
    const border: BorderConfig = { type: 'solid', width: 2, color: '#ff0000', fabricId: null };
    const result = generatePiecedBorder(100, 100, border, 10, 0);
    expect(result.topUnits).toEqual([]);
  });

  it('returns empty for border without pattern', () => {
    const border: BorderConfig = { type: 'pieced', width: 2, color: '#ff0000', fabricId: null };
    const result = generatePiecedBorder(100, 100, border, 10, 0);
    expect(result.topUnits).toEqual([]);
  });

  it('returns empty for unknown pattern', () => {
    const border: BorderConfig = { type: 'pieced', pattern: 'unknown' as any, width: 2, color: '#ff0000', fabricId: null };
    const result = generatePiecedBorder(100, 100, border, 10, 0);
    expect(result.topUnits).toEqual([]);
  });
});
