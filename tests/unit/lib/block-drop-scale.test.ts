import { describe, it, expect } from 'vitest';
import { computeBlockDropScale } from '@/lib/block-drop-scale';

describe('computeBlockDropScale', () => {
  it('returns 1 for perfectly fitting block', () => {
    expect(computeBlockDropScale(100, 100, 100, 100)).toBe(1);
  });

  it('scales down a larger block to fit', () => {
    // Block 200x200 into cell 100x100 => scale 0.5
    expect(computeBlockDropScale(100, 100, 200, 200)).toBe(0.5);
  });

  it('uses min ratio for non-square block in square cell', () => {
    // Block 200x100 into cell 100x100 => min(100/200, 100/100) = 0.5
    expect(computeBlockDropScale(100, 100, 200, 100)).toBe(0.5);
  });

  it('uses min ratio for square block in non-square cell', () => {
    // Block 100x100 into cell 200x50 => min(200/100, 50/100) = 0.5
    expect(computeBlockDropScale(200, 50, 100, 100)).toBe(0.5);
  });

  it('scales up a smaller block', () => {
    // Block 50x50 into cell 100x100 => scale 2.0
    expect(computeBlockDropScale(100, 100, 50, 50)).toBe(2);
  });

  it('returns 1 for zero-width block', () => {
    expect(computeBlockDropScale(100, 100, 0, 50)).toBe(1);
  });

  it('returns 1 for zero-height block', () => {
    expect(computeBlockDropScale(100, 100, 50, 0)).toBe(1);
  });

  it('returns 1 for zero-dimension cell', () => {
    expect(computeBlockDropScale(0, 100, 50, 50)).toBe(1);
    expect(computeBlockDropScale(100, 0, 50, 50)).toBe(1);
  });

  it('handles non-square cell and non-square block', () => {
    // Block 150x300 into cell 75x100 => min(75/150, 100/300) = min(0.5, 0.333) = 0.333
    const scale = computeBlockDropScale(75, 100, 150, 300);
    expect(scale).toBeCloseTo(1 / 3, 5);
  });

  it('always returns uniform scale (result is a single number)', () => {
    const scale = computeBlockDropScale(200, 100, 150, 80);
    expect(typeof scale).toBe('number');
    // min(200/150, 100/80) = min(1.333, 1.25) = 1.25
    expect(scale).toBeCloseTo(1.25, 5);
  });
});
