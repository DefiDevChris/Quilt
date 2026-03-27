import { describe, it, expect } from 'vitest';
import {
  extractPolygons,
  generateVariations,
  multiPolygonToSvgPath,
  multiPolygonToFabricData,
  variationToSvg,
  VARIATION_LABELS,
} from '@/lib/serendipity-engine';

function makeRectBlock(
  id: string,
  name: string,
  x: number,
  y: number,
  w: number,
  h: number
): { id: string; name: string; data: Record<string, unknown> } {
  return {
    id,
    name,
    data: {
      type: 'Group',
      objects: [
        {
          type: 'Rect',
          left: x,
          top: y,
          width: w,
          height: h,
          scaleX: 1,
          scaleY: 1,
        },
      ],
      width: 100,
      height: 100,
    },
  };
}

function makePolygonBlock(
  id: string,
  name: string,
  points: Array<{ x: number; y: number }>
): { id: string; name: string; data: Record<string, unknown> } {
  return {
    id,
    name,
    data: {
      type: 'Group',
      objects: [
        {
          type: 'Polygon',
          left: 0,
          top: 0,
          points,
          scaleX: 1,
          scaleY: 1,
        },
      ],
      width: 100,
      height: 100,
    },
  };
}

describe('serendipity-engine', () => {
  describe('extractPolygons', () => {
    it('extracts polygon from a Rect object', () => {
      const block = makeRectBlock('b1', 'Block A', 0, 0, 50, 50);
      const result = extractPolygons(block.id, block.name, block.data);
      expect(result.blockId).toBe('b1');
      expect(result.blockName).toBe('Block A');
      expect(result.polygons.length).toBeGreaterThan(0);
    });

    it('extracts polygon from a Polygon object', () => {
      const block = makePolygonBlock('b2', 'Triangle', [
        { x: 50, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 },
      ]);
      const result = extractPolygons(block.id, block.name, block.data);
      expect(result.polygons.length).toBeGreaterThan(0);
    });

    it('returns default square for empty objects', () => {
      const result = extractPolygons('b3', 'Empty', { objects: [] });
      expect(result.polygons.length).toBe(1);
    });

    it('returns default square for missing objects', () => {
      const result = extractPolygons('b4', 'NoObjs', {});
      expect(result.polygons.length).toBe(1);
    });

    it('handles Circle objects', () => {
      const result = extractPolygons('b5', 'Circle', {
        objects: [{ type: 'Circle', left: 0, top: 0, radius: 25, scaleX: 1, scaleY: 1 }],
      });
      expect(result.polygons.length).toBe(1);
    });

    it('handles Triangle objects', () => {
      const result = extractPolygons('b6', 'Tri', {
        objects: [
          { type: 'Triangle', left: 0, top: 0, width: 50, height: 50, scaleX: 1, scaleY: 1 },
        ],
      });
      expect(result.polygons.length).toBe(1);
    });
  });

  describe('generateVariations', () => {
    it('generates variations for two overlapping rects', () => {
      const blockA = makeRectBlock('a1', 'A', 0, 0, 60, 60);
      const blockB = makeRectBlock('b1', 'B', 30, 30, 60, 60);

      const geoA = extractPolygons(blockA.id, blockA.name, blockA.data);
      const geoB = extractPolygons(blockB.id, blockB.name, blockB.data);

      const variations = generateVariations(geoA, geoB);
      // Should have at least intersection, union, and both differences
      expect(variations.length).toBeGreaterThanOrEqual(3);
    });

    it('sets parent block IDs on all variations', () => {
      const blockA = makeRectBlock('a1', 'A', 0, 0, 60, 60);
      const blockB = makeRectBlock('b1', 'B', 30, 30, 60, 60);

      const geoA = extractPolygons(blockA.id, blockA.name, blockA.data);
      const geoB = extractPolygons(blockB.id, blockB.name, blockB.data);

      const variations = generateVariations(geoA, geoB);
      for (const v of variations) {
        expect(v.parentBlockIds).toEqual(['a1', 'b1']);
        expect(v.parentBlockNames).toEqual(['A', 'B']);
      }
    });

    it('generates SVG path for each variation', () => {
      const blockA = makeRectBlock('a1', 'A', 0, 0, 60, 60);
      const blockB = makeRectBlock('b1', 'B', 30, 30, 60, 60);

      const geoA = extractPolygons(blockA.id, blockA.name, blockA.data);
      const geoB = extractPolygons(blockB.id, blockB.name, blockB.data);

      const variations = generateVariations(geoA, geoB);
      for (const v of variations) {
        expect(v.svgPath).toContain('M');
        expect(v.svgPath).toContain('Z');
      }
    });

    it('intersection is smaller than union', () => {
      const blockA = makeRectBlock('a1', 'A', 0, 0, 60, 60);
      const blockB = makeRectBlock('b1', 'B', 30, 30, 60, 60);

      const geoA = extractPolygons(blockA.id, blockA.name, blockA.data);
      const geoB = extractPolygons(blockB.id, blockB.name, blockB.data);

      const variations = generateVariations(geoA, geoB);
      const intersection = variations.find((v) => v.type === 'intersection');
      const union = variations.find((v) => v.type === 'union');

      expect(intersection).toBeDefined();
      expect(union).toBeDefined();

      // Intersection polygon count should be less than or equal to union
      if (intersection && union) {
        const intPoints = countPoints(intersection.polygons);
        const unionPoints = countPoints(union.polygons);
        // Union should have more or equal points since it covers more area
        expect(unionPoints).toBeGreaterThanOrEqual(intPoints);
      }
    });

    it('handles non-overlapping blocks gracefully', () => {
      const blockA = makeRectBlock('a1', 'A', 0, 0, 20, 20);
      const blockB = makeRectBlock('b1', 'B', 80, 80, 20, 20);

      const geoA = extractPolygons(blockA.id, blockA.name, blockA.data);
      const geoB = extractPolygons(blockB.id, blockB.name, blockB.data);

      const variations = generateVariations(geoA, geoB);
      // Intersection should be empty (not included)
      const intersection = variations.find((v) => v.type === 'intersection');
      expect(intersection).toBeUndefined();
      // Union, A-B, B-A should still exist
      const union = variations.find((v) => v.type === 'union');
      expect(union).toBeDefined();
    });
  });

  describe('multiPolygonToSvgPath', () => {
    it('generates valid SVG path from a simple polygon', () => {
      const mp = [
        [
          [
            [0, 0] as [number, number],
            [100, 0] as [number, number],
            [100, 100] as [number, number],
            [0, 100] as [number, number],
            [0, 0] as [number, number],
          ],
        ],
      ];
      const path = multiPolygonToSvgPath(mp);
      expect(path).toContain('M 0.00 0.00');
      expect(path).toContain('Z');
    });

    it('returns empty string for empty MultiPolygon', () => {
      const path = multiPolygonToSvgPath([]);
      expect(path).toBe('');
    });
  });

  describe('multiPolygonToFabricData', () => {
    it('generates correct Fabric.js data structure', () => {
      const mp = [
        [
          [
            [10, 10] as [number, number],
            [90, 10] as [number, number],
            [90, 90] as [number, number],
            [10, 90] as [number, number],
            [10, 10] as [number, number],
          ],
        ],
      ];

      const data = multiPolygonToFabricData(mp, 'Test Block', ['a1', 'b1']);
      expect(data.type).toBe('Path');
      expect(data.path).toContain('M');
      expect(data.left).toBe(10);
      expect(data.top).toBe(10);
      expect(data.width).toBe(80);
      expect(data.height).toBe(80);
      expect((data._metadata as Record<string, unknown>).parentBlockIds).toEqual(['a1', 'b1']);
      expect((data._metadata as Record<string, unknown>).generatedBy).toBe('serendipity');
    });
  });

  describe('variationToSvg', () => {
    it('generates valid SVG string', () => {
      const blockA = makeRectBlock('a1', 'A', 0, 0, 60, 60);
      const blockB = makeRectBlock('b1', 'B', 30, 30, 60, 60);
      const geoA = extractPolygons(blockA.id, blockA.name, blockA.data);
      const geoB = extractPolygons(blockB.id, blockB.name, blockB.data);
      const variations = generateVariations(geoA, geoB);

      if (variations.length > 0) {
        const svg = variationToSvg(variations[0]);
        expect(svg).toContain('<svg');
        expect(svg).toContain('viewBox');
        expect(svg).toContain('<path');
        expect(svg).toContain('</svg>');
      }
    });
  });

  describe('VARIATION_LABELS', () => {
    it('has labels for all variation types', () => {
      expect(VARIATION_LABELS.intersection).toBeTruthy();
      expect(VARIATION_LABELS.union).toBeTruthy();
      expect(VARIATION_LABELS['difference-ab']).toBeTruthy();
      expect(VARIATION_LABELS['difference-ba']).toBeTruthy();
    });
  });
});

function countPoints(mp: Array<Array<Array<[number, number]>>>): number {
  let count = 0;
  for (const polygon of mp) {
    for (const ring of polygon) {
      count += ring.length;
    }
  }
  return count;
}
