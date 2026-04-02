import { describe, it, expect } from 'vitest';
import { multiPolygonToFabricData, variationToSvg } from '@/lib/serendipity-utils';
import type { GeneratedVariation } from '@/lib/serendipity-utils';
import type { MultiPolygon } from 'polygon-clipping';

describe('serendipity-utils', () => {
  describe('multiPolygonToFabricData', () => {
    it('handles invalid bounds', () => {
      const mp: MultiPolygon = [[[[NaN, NaN], [Infinity, -Infinity]]]];
      const result = multiPolygonToFabricData(mp, 'test', ['a', 'b']);
      expect(result.left).toBe(0);
      expect(result.top).toBe(0);
      expect(result.width).toBe(100);
      expect(result.height).toBe(100);
    });
  });

  describe('variationToSvg', () => {
    it('handles empty polygons', () => {
      const variation: GeneratedVariation = {
        type: 'intersection',
        label: 'test',
        svgPath: '',
        polygons: [],
        parentBlockIds: ['a', 'b'],
        parentBlockNames: ['A', 'B'],
      };
      const svg = variationToSvg(variation);
      expect(svg).toContain('Empty variation');
    });

    it('handles invalid bounds', () => {
      const variation: GeneratedVariation = {
        type: 'intersection',
        label: 'test',
        svgPath: 'M 0 0 L 10 0 L 10 10 L 0 10 Z',
        polygons: [[[[NaN, Infinity], [-Infinity, NaN]]]],
        parentBlockIds: ['a', 'b'],
        parentBlockNames: ['A', 'B'],
      };
      const svg = variationToSvg(variation);
      expect(svg).toContain('viewBox="-5 -5 110 110"');
    });
  });
});
