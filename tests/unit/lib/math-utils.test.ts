import { describe, it, expect } from 'vitest';
import { clamp, EPSILON } from '@/lib/math-utils';

describe('clamp', () => {
  it('returns value when within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-2, -5, 5)).toBe(-2);
  });

  it('returns min when value below range', () => {
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(-100, -5, 5)).toBe(-5);
  });

  it('returns min when value is NaN', () => {
    expect(clamp(NaN, 0, 10)).toBe(0);
  });

  it('returns max when value above range', () => {
    expect(clamp(15, 0, 10)).toBe(10);
    expect(clamp(100, -5, 5)).toBe(5);
  });
});
