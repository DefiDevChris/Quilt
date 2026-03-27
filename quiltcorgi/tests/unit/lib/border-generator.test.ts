import { describe, it, expect } from 'vitest';
import {
  generatePiecedBorder,
  generateSawtoothUnits,
  generatePianoKeyUnits,
  generateFlyingGeeseUnits,
  generateCheckerboardUnits,
  generateCornerUnit,
  type BorderPieceUnit,
} from '@/lib/border-generator';

describe('border-generator', () => {
  describe('generateSawtoothUnits', () => {
    it('generates correct number of units for given length', () => {
      const units = generateSawtoothUnits(480, 48, '#D4883C', '#F5F0E8');
      // 480 / 48 = 10 units
      expect(units.length).toBe(10);
    });

    it('generates units with correct dimensions', () => {
      const units = generateSawtoothUnits(480, 48, '#D4883C', '#F5F0E8');
      for (const unit of units) {
        expect(unit.width).toBeCloseTo(48);
        expect(unit.height).toBeCloseTo(48);
      }
    });

    it('positions units sequentially along the edge', () => {
      const units = generateSawtoothUnits(480, 48, '#D4883C', '#F5F0E8');
      for (let i = 0; i < units.length; i++) {
        expect(units[i].x).toBeCloseTo(i * 48);
      }
    });

    it('generates at least 1 unit for very short lengths', () => {
      const units = generateSawtoothUnits(30, 48, '#D4883C', '#F5F0E8');
      expect(units.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('generatePianoKeyUnits', () => {
    it('generates alternating colored rectangles', () => {
      const units = generatePianoKeyUnits(480, 48, '#D4883C', '#F5F0E8');
      expect(units.length).toBe(10);
      // Check alternating colors
      expect(units[0].color).toBe('#D4883C');
      expect(units[1].color).toBe('#F5F0E8');
      expect(units[2].color).toBe('#D4883C');
    });
  });

  describe('generateFlyingGeeseUnits', () => {
    it('generates correct number of geese units', () => {
      const units = generateFlyingGeeseUnits(480, 48, '#D4883C', '#F5F0E8');
      expect(units.length).toBe(10);
    });

    it('generates units with SVG data', () => {
      const units = generateFlyingGeeseUnits(480, 48, '#D4883C', '#F5F0E8');
      for (const unit of units) {
        expect(unit.svgData).toContain('<polygon');
      }
    });
  });

  describe('generateCheckerboardUnits', () => {
    it('generates checkerboard pattern', () => {
      const units = generateCheckerboardUnits(480, 24, '#D4883C', '#F5F0E8');
      // 480 / 24 = 20 units per row, 2 rows for border height = 40 total?
      // Actually we generate a 2xN checkerboard
      expect(units.length).toBe(40);
    });

    it('alternates colors in checkerboard pattern', () => {
      const units = generateCheckerboardUnits(240, 24, '#D4883C', '#F5F0E8');
      // First row
      expect(units[0].color).toBe('#D4883C');
      expect(units[1].color).toBe('#F5F0E8');
    });
  });

  describe('generateCornerUnit', () => {
    it('generates a corner unit with correct size', () => {
      const corner = generateCornerUnit('cornerstone', 48, '#D4883C', '#F5F0E8');
      expect(corner.width).toBe(48);
      expect(corner.height).toBe(48);
    });

    it('generates different SVG for miter vs cornerstone', () => {
      const cornerstone = generateCornerUnit('cornerstone', 48, '#D4883C', '#F5F0E8');
      const miter = generateCornerUnit('miter', 48, '#D4883C', '#F5F0E8');
      expect(cornerstone.svgData).not.toBe(miter.svgData);
    });
  });

  describe('generatePiecedBorder', () => {
    it('generates units for all 4 sides', () => {
      const result = generatePiecedBorder(
        480, 480,
        {
          width: 48,
          color: '#D4883C',
          fabricId: null,
          type: 'pieced',
          pattern: 'sawtooth',
          unitSize: 48,
          secondaryColor: '#F5F0E8',
          cornerTreatment: 'cornerstone',
        },
        1,
        0
      );

      expect(result.topUnits.length).toBeGreaterThan(0);
      expect(result.bottomUnits.length).toBeGreaterThan(0);
      expect(result.leftUnits.length).toBeGreaterThan(0);
      expect(result.rightUnits.length).toBeGreaterThan(0);
    });

    it('generates 4 corner units', () => {
      const result = generatePiecedBorder(
        480, 480,
        {
          width: 48,
          color: '#D4883C',
          fabricId: null,
          type: 'pieced',
          pattern: 'piano-key',
          unitSize: 48,
          secondaryColor: '#F5F0E8',
          cornerTreatment: 'cornerstone',
        },
        1,
        0
      );

      expect(result.cornerUnits.length).toBe(4);
    });

    it('returns empty result for solid border type', () => {
      const result = generatePiecedBorder(
        480, 480,
        {
          width: 48,
          color: '#D4883C',
          fabricId: null,
          type: 'solid',
        },
        1,
        0
      );

      expect(result.topUnits).toEqual([]);
      expect(result.bottomUnits).toEqual([]);
      expect(result.leftUnits).toEqual([]);
      expect(result.rightUnits).toEqual([]);
      expect(result.cornerUnits).toEqual([]);
    });
  });
});
