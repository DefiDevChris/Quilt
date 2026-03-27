import { describe, it, expect } from 'vitest';
import {
  classifyPatchShape,
  generateCuttingChart,
  optimizeStripCutting,
  formatFraction,
  type PatchShape,
} from '@/lib/cutting-chart-generator';

describe('cutting-chart-generator', () => {
  describe('classifyPatchShape', () => {
    it('classifies a square (4 equal-length sides)', () => {
      const svg = '<svg viewBox="0 0 100 100"><path d="M 0 0 L 100 0 L 100 100 L 0 100 Z"/></svg>';
      const result = classifyPatchShape(svg, 0.25);
      expect(result.shape).toBe('square');
    });

    it('classifies an HST (3-vertex triangle)', () => {
      const svg = '<svg viewBox="0 0 100 100"><polygon points="0,0 100,0 0,100"/></svg>';
      const result = classifyPatchShape(svg, 0.25);
      expect(result.shape).toBe('hst');
    });

    it('classifies a rectangle (4 vertices, non-square aspect ratio)', () => {
      const svg = '<svg viewBox="0 0 100 100"><path d="M 0 0 L 200 0 L 200 100 L 0 100 Z"/></svg>';
      const result = classifyPatchShape(svg, 0.25);
      expect(result.shape).toBe('rectangle');
    });

    it('returns finished dimensions in the result', () => {
      const svg = '<svg viewBox="0 0 100 100"><path d="M 0 0 L 100 0 L 100 100 L 0 100 Z"/></svg>';
      const result = classifyPatchShape(svg, 0.25);
      expect(result.finishedWidth).toBeGreaterThan(0);
      expect(result.finishedHeight).toBeGreaterThan(0);
    });

    it('calculates correct cut size for a square with 0.25" seam allowance', () => {
      // A 3" finished square needs 3.5" cut size (add 0.5" total)
      const svg = '<svg viewBox="0 0 100 100"><path d="M 0 0 L 100 0 L 100 100 L 0 100 Z"/></svg>';
      const result = classifyPatchShape(svg, 0.25);
      // cutWidth should be finishedWidth + 2 * seamAllowance
      expect(result.cutWidth).toBeCloseTo(result.finishedWidth + 0.5, 2);
    });

    it('classifies irregular shapes with 5+ vertices', () => {
      const svg = '<svg viewBox="0 0 100 100"><polygon points="0,0 60,0 100,50 60,100 0,100"/></svg>';
      const result = classifyPatchShape(svg, 0.25);
      expect(['trapezoid', 'irregular']).toContain(result.shape);
    });

    it('provides special instructions for HST', () => {
      const svg = '<svg viewBox="0 0 100 100"><polygon points="0,0 100,0 0,100"/></svg>';
      const result = classifyPatchShape(svg, 0.25);
      expect(result.specialInstructions).toBeTruthy();
      expect(result.specialInstructions).toContain('diagonally');
    });
  });

  describe('generateCuttingChart', () => {
    it('returns empty array for empty input', () => {
      expect(generateCuttingChart([], 0.25)).toEqual([]);
    });

    it('groups patches by fabric', () => {
      const items = [
        {
          shapeId: 's1',
          shapeName: 'Square A',
          svgData: '<svg viewBox="0 0 100 100"><path d="M 0 0 L 100 0 L 100 100 L 0 100 Z"/></svg>',
          quantity: 4,
          seamAllowance: 0.25,
          unitSystem: 'imperial' as const,
          fabricId: 'fabric-red',
          fabricName: 'Red Solid',
          fillColor: '#FF0000',
        },
        {
          shapeId: 's2',
          shapeName: 'Square B',
          svgData: '<svg viewBox="0 0 100 100"><path d="M 0 0 L 100 0 L 100 100 L 0 100 Z"/></svg>',
          quantity: 2,
          seamAllowance: 0.25,
          unitSystem: 'imperial' as const,
          fabricId: 'fabric-blue',
          fabricName: 'Blue Solid',
          fillColor: '#0000FF',
        },
      ];

      const chart = generateCuttingChart(items, 0.25);
      expect(chart.length).toBe(2);
    });

    it('calculates total pieces per entry', () => {
      const items = [
        {
          shapeId: 's1',
          shapeName: 'Square',
          svgData: '<svg viewBox="0 0 100 100"><path d="M 0 0 L 100 0 L 100 100 L 0 100 Z"/></svg>',
          quantity: 8,
          seamAllowance: 0.25,
          unitSystem: 'imperial' as const,
        },
      ];

      const chart = generateCuttingChart(items, 0.25);
      expect(chart.length).toBeGreaterThan(0);
      expect(chart[0].totalPieces).toBe(8);
    });
  });

  describe('optimizeStripCutting', () => {
    it('calculates pieces per strip from WOF', () => {
      const patches = [
        {
          shapeName: 'Square',
          shape: 'square' as PatchShape,
          cutWidth: 3.5,
          cutHeight: 3.5,
          quantity: 20,
          specialInstructions: null,
          stripWidth: 3.5,
        },
      ];

      const plans = optimizeStripCutting(patches, 42);
      expect(plans.length).toBeGreaterThan(0);
      // 42" WOF / 3.5" per piece = 12 pieces per strip
      expect(plans[0].piecesPerStrip).toBe(12);
      // 20 pieces / 12 per strip = 2 strips needed (ceil)
      expect(plans[0].stripsNeeded).toBe(2);
    });

    it('returns empty array for empty input', () => {
      expect(optimizeStripCutting([], 42)).toEqual([]);
    });

    it('handles irregular shapes with null stripWidth', () => {
      const patches = [
        {
          shapeName: 'Irregular',
          shape: 'irregular' as PatchShape,
          cutWidth: 5,
          cutHeight: 4,
          quantity: 6,
          specialInstructions: 'Template cut',
          stripWidth: null,
        },
      ];

      const plans = optimizeStripCutting(patches, 42);
      // Irregular shapes should be skipped or handled separately
      expect(plans.length).toBe(0);
    });
  });

  describe('formatFraction', () => {
    it('formats whole numbers', () => {
      expect(formatFraction(3)).toBe('3');
    });

    it('formats common fractions', () => {
      expect(formatFraction(3.5)).toBe('3-1/2');
      expect(formatFraction(3.25)).toBe('3-1/4');
      expect(formatFraction(3.75)).toBe('3-3/4');
    });

    it('formats eighth fractions', () => {
      expect(formatFraction(3.875)).toBe('3-7/8');
      expect(formatFraction(3.125)).toBe('3-1/8');
    });

    it('formats pure fractions (less than 1)', () => {
      expect(formatFraction(0.5)).toBe('1/2');
      expect(formatFraction(0.25)).toBe('1/4');
    });
  });
});
