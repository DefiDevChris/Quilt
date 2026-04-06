import { describe, it, expect } from 'vitest';
import { inferGridDimensions } from '@/lib/layout-import-layouts';

describe('inferGridDimensions', () => {
  it('returns 1x1 for zero blocks', () => {
    expect(inferGridDimensions(0, 48, 48)).toEqual({ rows: 1, cols: 1 });
  });

  it('prefers landscape for wide quilts', () => {
    expect(inferGridDimensions(4, 100, 50)).toEqual({ rows: 2, cols: 2 });
  });

  it('prefers portrait for tall quilts', () => {
    expect(inferGridDimensions(4, 50, 100)).toEqual({ rows: 2, cols: 2 });
  });

  it('finds optimal grid for prime numbers', () => {
    expect(inferGridDimensions(7, 48, 48)).toEqual({ rows: 1, cols: 7 });
  });

  it('handles square quilts', () => {
    expect(inferGridDimensions(9, 48, 48)).toEqual({ rows: 3, cols: 3 });
  });

  it('swaps rows/cols for landscape preference when needed', () => {
    const result = inferGridDimensions(6, 100, 50);
    expect(result.rows * result.cols).toBeGreaterThanOrEqual(6);
    expect(result.cols).toBeGreaterThanOrEqual(result.rows);
  });
});