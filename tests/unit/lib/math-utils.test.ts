import { describe, it, expect } from 'vitest';
import {
  assertFinite,
  assertPositive,
  assertNonNegative,
  clamp,
  floatEquals,
  isEffectivelyZero,
  EPSILON,
} from '@/lib/math-utils';

describe('assertFinite', () => {
  it('accepts finite numbers', () => {
    expect(() => assertFinite(5, 'test')).not.toThrow();
    expect(() => assertFinite(-3.14, 'test')).not.toThrow();
    expect(() => assertFinite(0, 'test')).not.toThrow();
  });

  it('throws on NaN', () => {
    expect(() => assertFinite(NaN, 'test')).toThrow('test must be a finite number, got NaN');
  });

  it('throws on positive infinity', () => {
    expect(() => assertFinite(Infinity, 'test')).toThrow('test must be a finite number, got Infinity');
  });

  it('throws on negative infinity', () => {
    expect(() => assertFinite(-Infinity, 'test')).toThrow('test must be a finite number, got -Infinity');
  });
});

describe('assertPositive', () => {
  it('accepts positive numbers', () => {
    expect(() => assertPositive(1, 'test')).not.toThrow();
    expect(() => assertPositive(0.1, 'test')).not.toThrow();
  });

  it('throws on zero', () => {
    expect(() => assertPositive(0, 'test')).toThrow('test must be a positive number, got 0');
  });

  it('throws on negative numbers', () => {
    expect(() => assertPositive(-1, 'test')).toThrow('test must be a positive number, got -1');
  });

  it('throws on NaN', () => {
    expect(() => assertPositive(NaN, 'test')).toThrow('test must be a positive number, got NaN');
  });
});

describe('assertNonNegative', () => {
  it('accepts zero', () => {
    expect(() => assertNonNegative(0, 'test')).not.toThrow();
  });

  it('accepts positive numbers', () => {
    expect(() => assertNonNegative(1, 'test')).not.toThrow();
    expect(() => assertNonNegative(0.1, 'test')).not.toThrow();
  });

  it('throws on negative numbers', () => {
    expect(() => assertNonNegative(-1, 'test')).toThrow('test must be non-negative, got -1');
  });

  it('throws on NaN', () => {
    expect(() => assertNonNegative(NaN, 'test')).toThrow('test must be non-negative, got NaN');
  });

  it('throws on negative infinity', () => {
    expect(() => assertNonNegative(-Infinity, 'test')).toThrow('test must be non-negative, got -Infinity');
  });
});

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

describe('floatEquals', () => {
  it('returns true for equal numbers', () => {
    expect(floatEquals(1.0, 1.0)).toBe(true);
    expect(floatEquals(0, 0)).toBe(true);
    expect(floatEquals(-1.5, -1.5)).toBe(true);
  });

  it('returns true for numbers within epsilon', () => {
    expect(floatEquals(1.0, 1.0000001)).toBe(true);
    expect(floatEquals(0, EPSILON / 2)).toBe(true);
  });

  it('returns false for numbers outside epsilon', () => {
    expect(floatEquals(1.0, 1.1)).toBe(false);
    expect(floatEquals(0, EPSILON * 2)).toBe(false);
  });

  it('returns false for NaN', () => {
    expect(floatEquals(NaN, 1)).toBe(false);
    expect(floatEquals(1, NaN)).toBe(false);
    expect(floatEquals(NaN, NaN)).toBe(false);
  });

  it('returns false for Infinity', () => {
    expect(floatEquals(Infinity, 1)).toBe(false);
    expect(floatEquals(-Infinity, 1)).toBe(false);
  });

  it('uses custom epsilon', () => {
    expect(floatEquals(1.0, 1.1, 0.2)).toBe(true);
    expect(floatEquals(1.0, 1.3, 0.2)).toBe(false);
  });
});

describe('isEffectivelyZero', () => {
  it('returns true for zero', () => {
    expect(isEffectivelyZero(0)).toBe(true);
  });

  it('returns true for values within epsilon', () => {
    expect(isEffectivelyZero(EPSILON / 2)).toBe(true);
    expect(isEffectivelyZero(-EPSILON / 2)).toBe(true);
  });

  it('returns false for values outside epsilon', () => {
    expect(isEffectivelyZero(EPSILON * 2)).toBe(false);
    expect(isEffectivelyZero(-EPSILON * 2)).toBe(false);
  });

  it('returns false for NaN', () => {
    expect(isEffectivelyZero(NaN)).toBe(false);
  });

  it('returns false for Infinity', () => {
    expect(isEffectivelyZero(Infinity)).toBe(false);
    expect(isEffectivelyZero(-Infinity)).toBe(false);
  });
});