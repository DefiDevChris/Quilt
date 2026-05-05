import { describe, it, expect } from 'vitest';

const snapToQuarterInch = (value: number): number =>
  Math.round(value * 4) / 4;

describe('snapToQuarterInch', () => {
  it('snaps 52.50000000000001 to 52.5', () => {
    expect(snapToQuarterInch(15 * 3.5)).toBe(52.5);
  });

  it('snaps 36 to 36 (already exact)', () => {
    expect(snapToQuarterInch(36)).toBe(36);
  });

  it('snaps 50.00000000000001 to 50', () => {
    expect(snapToQuarterInch(10 * 5 + 1e-14)).toBe(50);
  });

  it('snaps values to nearest 0.25', () => {
    expect(snapToQuarterInch(2.1)).toBe(2);
    expect(snapToQuarterInch(2.2)).toBe(2.25);
    expect(snapToQuarterInch(2.38)).toBe(2.5);
    expect(snapToQuarterInch(2.63)).toBe(2.75);
    expect(snapToQuarterInch(2.88)).toBe(3);
  });

  it('all snapped values are even-quarter-inch', () => {
    const testValues = [
      15 * 3.5,
      14 * 2.75,
      20 * 2.25,
      12 * 3.5,
      10 * 5.0,
      108 * 1.0,
    ];
    for (const v of testValues) {
      const snapped = snapToQuarterInch(v);
      expect(Math.abs(Math.round(snapped * 4) - snapped * 4)).toBeLessThan(
        1e-9,
      );
    }
  });
});
