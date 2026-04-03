import { computeScaleFactor, computeMeasurements, computeCutDimension, computePixelMeasurements } from '@/lib/ocr/measurement';
import type { DetectedGrid } from '@/types/quilt-ocr';

describe('computeScaleFactor', () => {
  it('returns 0 for zero pixels', () => {
    expect(computeScaleFactor(10, 0)).toBe(0);
  });

  it('returns 0 for negative inches', () => {
    expect(computeScaleFactor(-5, 100)).toBe(0);
  });

  it('returns correct scale', () => {
    expect(computeScaleFactor(60, 600)).toBe(0.1);
  });
});

describe('computeMeasurements', () => {
  it('returns zeroed when scale is 0', () => {
    const grid: DetectedGrid = { rows: 3, cols: 3, cellWidth: 100, cellHeight: 100 , horizontalLines: [], verticalLines: [], intersections: [], layoutType: 'grid', confidence: 1 };
    const result = computeMeasurements(grid, 60, 0);
    expect(result.totalWidthInches).toBe(0);
  });

  it('returns zeroed when rows <= 0', () => {
    const grid: DetectedGrid = { rows: 0, cols: 3, cellWidth: 100, cellHeight: 100 , horizontalLines: [], verticalLines: [], intersections: [], layoutType: 'grid', confidence: 1 };
    const result = computeMeasurements(grid, 60, 600);
    expect(result.totalWidthInches).toBe(0);
  });

  it('returns zeroed when cellWidth <= 0', () => {
    const grid: DetectedGrid = { rows: 3, cols: 3, cellWidth: 0, cellHeight: 100 , horizontalLines: [], verticalLines: [], intersections: [], layoutType: 'grid', confidence: 1 };
    const result = computeMeasurements(grid, 60, 600);
    expect(result.totalWidthInches).toBe(0);
  });

  it('computes measurements for valid grid', () => {
    const grid: DetectedGrid = { rows: 3, cols: 3, cellWidth: 100, cellHeight: 100 , horizontalLines: [], verticalLines: [], intersections: [], layoutType: 'grid', confidence: 1 };
    const result = computeMeasurements(grid, 60, 600, 0.25);
    expect(result.totalWidthInches).toBe(60);
    expect(result.seamAllowanceInches).toBe(0.25);
  });

  it('handles single column grid (no sashing)', () => {
    const grid: DetectedGrid = { rows: 1, cols: 1, cellWidth: 100, cellHeight: 100 , horizontalLines: [], verticalLines: [], intersections: [], layoutType: 'grid', confidence: 1 };
    const result = computeMeasurements(grid, 60, 600);
    expect(result.sashingWidthInches).toBe(0);
  });
});

describe('computeCutDimension', () => {
  it('adds seam allowance and rounds up to eighth', () => {
    expect(computeCutDimension(10, 0.25)).toBeCloseTo(10.5, 1);
  });
});

describe('computePixelMeasurements', () => {
  it('computes pixel dimensions', () => {
    const grid: DetectedGrid = { rows: 3, cols: 4, cellWidth: 100.5, cellHeight: 50.3 , horizontalLines: [], verticalLines: [], intersections: [], layoutType: 'grid', confidence: 1 };
    const result = computePixelMeasurements(grid);
    expect(result.blockWidthPx).toBe(101);
    expect(result.blockHeightPx).toBe(50);
    expect(result.gridWidthPx).toBe(402);
    expect(result.gridHeightPx).toBe(151);
  });
});
