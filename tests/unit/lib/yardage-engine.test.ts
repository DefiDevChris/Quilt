import { describe, it, expect } from 'vitest';
import {
  type CanvasShapeData,
  STANDARD_WOFS,
  FAT_QUARTER_DIMENSIONS,
  groupShapesByFabric,
  calculateTotalArea,
  calculateYardage,
  calculateFatQuarters,
  computeYardageEstimates,
} from '@/lib/yardage-utils';

function makeShape(overrides: Partial<CanvasShapeData> = {}): CanvasShapeData {
  return {
    id: 'shape-1',
    widthPx: 96,
    heightPx: 96,
    scaleX: 1,
    scaleY: 1,
    fabricId: null,
    fabricName: null,
    fillColor: '#D4883C',
    type: 'rect',
    ...overrides,
  };
}

describe('yardage-utils', () => {
  describe('STANDARD_WOFS', () => {
    it('contains standard quilting WOF values', () => {
      expect(STANDARD_WOFS).toContain(42);
      expect(STANDARD_WOFS).toContain(44);
      expect(STANDARD_WOFS).toContain(45);
      expect(STANDARD_WOFS).toContain(54);
      expect(STANDARD_WOFS).toContain(60);
    });
  });

  describe('FAT_QUARTER_DIMENSIONS', () => {
    it('is 18 x 22 inches', () => {
      expect(FAT_QUARTER_DIMENSIONS.width).toBe(18);
      expect(FAT_QUARTER_DIMENSIONS.height).toBe(22);
    });
  });

  describe('groupShapesByFabric()', () => {
    it('groups shapes by fabricId when present', () => {
      const shapes = [
        makeShape({ id: 's1', fabricId: 'fab-1', fabricName: 'Kona Cotton White' }),
        makeShape({ id: 's2', fabricId: 'fab-1', fabricName: 'Kona Cotton White' }),
        makeShape({ id: 's3', fabricId: 'fab-2', fabricName: 'Bella Solid Red' }),
      ];
      const groups = groupShapesByFabric(shapes);
      expect(groups).toHaveLength(2);
      const whiteGroup = groups.find((g) => g.fabricId === 'fab-1');
      expect(whiteGroup?.shapes).toHaveLength(2);
      const redGroup = groups.find((g) => g.fabricId === 'fab-2');
      expect(redGroup?.shapes).toHaveLength(1);
    });

    it('groups shapes by fillColor when no fabricId', () => {
      const shapes = [
        makeShape({ id: 's1', fillColor: '#FF0000' }),
        makeShape({ id: 's2', fillColor: '#FF0000' }),
        makeShape({ id: 's3', fillColor: '#0000FF' }),
      ];
      const groups = groupShapesByFabric(shapes);
      expect(groups).toHaveLength(2);
      const redGroup = groups.find((g) => g.groupKey === 'color:#FF0000');
      expect(redGroup?.shapes).toHaveLength(2);
    });

    it('returns empty array for no shapes', () => {
      expect(groupShapesByFabric([])).toEqual([]);
    });

    it('uses fabricId over fillColor when both present', () => {
      const shapes = [
        makeShape({ id: 's1', fabricId: 'fab-1', fabricName: 'Kona White', fillColor: '#FFFFFF' }),
        makeShape({ id: 's2', fabricId: 'fab-1', fabricName: 'Kona White', fillColor: '#000000' }),
      ];
      const groups = groupShapesByFabric(shapes);
      expect(groups).toHaveLength(1);
      expect(groups[0].groupKey).toBe('fabric:fab-1');
    });
  });

  describe('calculateTotalArea()', () => {
    it('calculates area for a 1x1 inch shape at 96px/inch', () => {
      const shapes = [makeShape({ widthPx: 96, heightPx: 96, scaleX: 1, scaleY: 1 })];
      const areaSqIn = calculateTotalArea(shapes, 96);
      expect(areaSqIn).toBeCloseTo(1, 6);
    });

    it('sums areas for multiple shapes', () => {
      const shapes = [
        makeShape({ id: 's1', widthPx: 96, heightPx: 96, scaleX: 1, scaleY: 1 }),
        makeShape({ id: 's2', widthPx: 192, heightPx: 96, scaleX: 1, scaleY: 1 }),
      ];
      const areaSqIn = calculateTotalArea(shapes, 96);
      expect(areaSqIn).toBeCloseTo(3, 6);
    });

    it('accounts for scaleX and scaleY', () => {
      const shapes = [makeShape({ widthPx: 96, heightPx: 96, scaleX: 2, scaleY: 3 })];
      const areaSqIn = calculateTotalArea(shapes, 96);
      expect(areaSqIn).toBeCloseTo(6, 6);
    });

    it('returns 0 for no shapes', () => {
      expect(calculateTotalArea([], 96)).toBe(0);
    });
  });

  describe('calculateYardage()', () => {
    it('calculates yardage for a known area and WOF', () => {
      // 36 sq inches at WOF 42 → need 36/42 = 0.857 inches of length → /36 = 0.0238 yards
      const yards = calculateYardage(36, 42, 0);
      // length = area / wof = 36 / 42 ≈ 0.857"
      // yards = length / 36 ≈ 0.0238
      expect(yards).toBeCloseTo(36 / 42 / 36, 4);
    });

    it('applies waste margin correctly', () => {
      const yardsNoWaste = calculateYardage(100, 44, 0);
      const yardsWith10 = calculateYardage(100, 44, 0.1);
      expect(yardsWith10).toBeCloseTo(yardsNoWaste * 1.1, 6);
    });

    it('handles 25% waste margin', () => {
      const yardsNoWaste = calculateYardage(100, 44, 0);
      const yardsWith25 = calculateYardage(100, 44, 0.25);
      expect(yardsWith25).toBeCloseTo(yardsNoWaste * 1.25, 6);
    });

    it('returns 0 for 0 area', () => {
      expect(calculateYardage(0, 44, 0.1)).toBe(0);
    });
  });

  describe('calculateFatQuarters()', () => {
    it('calculates fat quarters needed for a small area', () => {
      // Fat quarter = 18x22 = 396 sq in
      const fqs = calculateFatQuarters(396, 0);
      expect(fqs).toBe(1);
    });

    it('rounds up to next whole fat quarter', () => {
      const fqs = calculateFatQuarters(400, 0);
      expect(fqs).toBe(2);
    });

    it('applies waste margin to fat quarters', () => {
      // 200 sq in + 10% = 220, which is < 396 → 1 FQ
      const fqs = calculateFatQuarters(200, 0.1);
      expect(fqs).toBe(1);
    });

    it('returns 0 for 0 area', () => {
      expect(calculateFatQuarters(0, 0.1)).toBe(0);
    });
  });

  describe('computeYardageEstimates()', () => {
    it('returns empty results for no shapes', () => {
      const results = computeYardageEstimates([], 96, 44, 0.1);
      expect(results).toEqual([]);
    });

    it('returns one result per fabric group', () => {
      const shapes = [
        makeShape({
          id: 's1',
          fabricId: 'fab-1',
          fabricName: 'Kona White',
          widthPx: 96,
          heightPx: 96,
        }),
        makeShape({
          id: 's2',
          fabricId: 'fab-1',
          fabricName: 'Kona White',
          widthPx: 96,
          heightPx: 96,
        }),
        makeShape({
          id: 's3',
          fabricId: 'fab-2',
          fabricName: 'Bella Red',
          widthPx: 192,
          heightPx: 96,
        }),
      ];
      const results = computeYardageEstimates(shapes, 96, 44, 0.1);
      expect(results).toHaveLength(2);
    });

    it('calculates correct totals for a single fabric group', () => {
      const shapes = [
        makeShape({ id: 's1', fillColor: '#FF0000', widthPx: 96 * 6, heightPx: 96 * 6 }),
      ];
      // 6" x 6" = 36 sq in at 96px/in
      const results = computeYardageEstimates(shapes, 96, 44, 0);
      expect(results).toHaveLength(1);
      expect(results[0].totalAreaSqIn).toBeCloseTo(36, 4);
      // raw yardage = (36/44) / 36 ≈ 0.0227, rounded up to 1/8 = 0.125
      expect(results[0].yardsRequired).toBe(0.125);
    });

    it('includes displayName from fabricName when present', () => {
      const shapes = [
        makeShape({ fabricId: 'fab-1', fabricName: 'Kona Cotton White', fillColor: '#FFF' }),
      ];
      const results = computeYardageEstimates(shapes, 96, 44, 0);
      expect(results[0].displayName).toBe('Kona Cotton White');
    });

    it('uses fillColor as displayName when no fabricName', () => {
      const shapes = [makeShape({ fillColor: '#D4883C' })];
      const results = computeYardageEstimates(shapes, 96, 44, 0);
      expect(results[0].displayName).toBe('#D4883C');
    });

    it('includes border shapes in calculation', () => {
      const shapes = [makeShape({ id: 's1', fillColor: '#FF0000', widthPx: 96, heightPx: 96 })];
      const borderShapes = [
        makeShape({ id: 'b1', fillColor: '#FF0000', widthPx: 96 * 2, heightPx: 96 }),
      ];
      const resultsWithout = computeYardageEstimates(shapes, 96, 44, 0);
      const resultsWith = computeYardageEstimates([...shapes, ...borderShapes], 96, 44, 0);
      expect(resultsWith[0].totalAreaSqIn).toBeGreaterThan(resultsWithout[0].totalAreaSqIn);
    });

    it('rounds yardage up to nearest 1/8 yard', () => {
      const shapes = [makeShape({ id: 's1', fillColor: '#FF0000', widthPx: 96, heightPx: 96 })];
      const results = computeYardageEstimates(shapes, 96, 44, 0);
      // yardsRequired should be rounded up to nearest 1/8
      const eighths = results[0].yardsRequired * 8;
      expect(eighths).toBe(Math.ceil(eighths - 0.0001));
    });

    it('sorts results by yardage descending', () => {
      const shapes = [
        makeShape({ id: 's1', fillColor: '#FF0000', widthPx: 96, heightPx: 96 }),
        makeShape({ id: 's2', fillColor: '#0000FF', widthPx: 96 * 10, heightPx: 96 * 10 }),
      ];
      const results = computeYardageEstimates(shapes, 96, 44, 0);
      expect(results[0].yardsRequired).toBeGreaterThanOrEqual(results[1].yardsRequired);
    });
  });
});
