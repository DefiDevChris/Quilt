import { describe, it, expect } from 'vitest';
import {
  fraction,
  parseFraction,
  simplify,
  add,
  subtract,
  multiply,
  divide,
  toDecimal,
  toMixedNumberString,
  toFractionString,
  toImproperFractionString,
  inchesToCm,
  cmToInches,
  decimalToFraction,
} from '@/lib/fraction-math';

describe('fraction-math', () => {
  describe('fraction()', () => {
    it('creates a fraction from numerator and denominator', () => {
      const f = fraction(3, 4);
      expect(f.numerator).toBe(3);
      expect(f.denominator).toBe(4);
    });

    it('throws on zero denominator', () => {
      expect(() => fraction(1, 0)).toThrow();
    });

    it('normalizes negative denominator to negative numerator', () => {
      const f = fraction(3, -4);
      expect(f.numerator).toBe(-3);
      expect(f.denominator).toBe(4);
    });
  });

  describe('parseFraction()', () => {
    it('parses a simple fraction "3/4"', () => {
      const f = parseFraction('3/4');
      expect(f.numerator).toBe(3);
      expect(f.denominator).toBe(4);
    });

    it('parses a mixed number "2 1/4"', () => {
      const f = parseFraction('2 1/4');
      expect(f.numerator).toBe(9);
      expect(f.denominator).toBe(4);
    });

    it('parses a whole number "5"', () => {
      const f = parseFraction('5');
      expect(f.numerator).toBe(5);
      expect(f.denominator).toBe(1);
    });

    it('parses a decimal "0.625"', () => {
      const f = parseFraction('0.625');
      expect(toDecimal(f)).toBeCloseTo(0.625, 10);
    });

    it('parses a decimal "2.5"', () => {
      const f = parseFraction('2.5');
      expect(f.numerator).toBe(5);
      expect(f.denominator).toBe(2);
    });

    it('parses an improper fraction "9/4"', () => {
      const f = parseFraction('9/4');
      expect(f.numerator).toBe(9);
      expect(f.denominator).toBe(4);
    });

    it('parses negative fraction "-3/8"', () => {
      const f = parseFraction('-3/8');
      expect(f.numerator).toBe(-3);
      expect(f.denominator).toBe(8);
    });

    it('parses negative mixed number "-2 1/4"', () => {
      const f = parseFraction('-2 1/4');
      expect(f.numerator).toBe(-9);
      expect(f.denominator).toBe(4);
    });

    it('throws on empty string', () => {
      expect(() => parseFraction('')).toThrow();
    });

    it('throws on invalid input', () => {
      expect(() => parseFraction('abc')).toThrow();
    });

    it('handles whitespace gracefully', () => {
      const f = parseFraction('  3/4  ');
      expect(f.numerator).toBe(3);
      expect(f.denominator).toBe(4);
    });
  });

  describe('simplify()', () => {
    it('reduces 6/8 to 3/4', () => {
      const f = simplify(fraction(6, 8));
      expect(f.numerator).toBe(3);
      expect(f.denominator).toBe(4);
    });

    it('reduces 10/5 to 2/1', () => {
      const f = simplify(fraction(10, 5));
      expect(f.numerator).toBe(2);
      expect(f.denominator).toBe(1);
    });

    it('keeps 3/4 unchanged', () => {
      const f = simplify(fraction(3, 4));
      expect(f.numerator).toBe(3);
      expect(f.denominator).toBe(4);
    });

    it('handles zero numerator', () => {
      const f = simplify(fraction(0, 5));
      expect(f.numerator).toBe(0);
      expect(f.denominator).toBe(1);
    });

    it('handles negative fractions', () => {
      const f = simplify(fraction(-6, 8));
      expect(f.numerator).toBe(-3);
      expect(f.denominator).toBe(4);
    });
  });

  describe('add()', () => {
    it('adds 1/4 + 1/4 = 1/2', () => {
      const result = add(fraction(1, 4), fraction(1, 4));
      expect(result.numerator).toBe(1);
      expect(result.denominator).toBe(2);
    });

    it('adds 5/8 + 1/4 = 7/8', () => {
      const result = add(fraction(5, 8), fraction(1, 4));
      expect(result.numerator).toBe(7);
      expect(result.denominator).toBe(8);
    });

    it('adds 2/3 + 1/6 = 5/6', () => {
      const result = add(fraction(2, 3), fraction(1, 6));
      expect(result.numerator).toBe(5);
      expect(result.denominator).toBe(6);
    });

    it('adds mixed numbers: 2 1/4 + 1 3/8 = 3 5/8', () => {
      const a = parseFraction('2 1/4');
      const b = parseFraction('1 3/8');
      const result = add(a, b);
      expect(toDecimal(result)).toBeCloseTo(3.625, 10);
      expect(toMixedNumberString(result)).toBe('3 5/8');
    });
  });

  describe('subtract()', () => {
    it('subtracts 3/4 - 1/4 = 1/2', () => {
      const result = subtract(fraction(3, 4), fraction(1, 4));
      expect(result.numerator).toBe(1);
      expect(result.denominator).toBe(2);
    });

    it('subtracts 5/8 - 1/4 = 3/8', () => {
      const result = subtract(fraction(5, 8), fraction(1, 4));
      expect(result.numerator).toBe(3);
      expect(result.denominator).toBe(8);
    });

    it('handles negative result: 1/4 - 3/4 = -1/2', () => {
      const result = subtract(fraction(1, 4), fraction(3, 4));
      expect(result.numerator).toBe(-1);
      expect(result.denominator).toBe(2);
    });
  });

  describe('multiply()', () => {
    it('multiplies 1/2 * 1/2 = 1/4', () => {
      const result = multiply(fraction(1, 2), fraction(1, 2));
      expect(result.numerator).toBe(1);
      expect(result.denominator).toBe(4);
    });

    it('multiplies 3/4 * 2/3 = 1/2', () => {
      const result = multiply(fraction(3, 4), fraction(2, 3));
      expect(result.numerator).toBe(1);
      expect(result.denominator).toBe(2);
    });

    it('multiplies 2 1/2 * 3 = 7 1/2', () => {
      const a = parseFraction('2 1/2');
      const b = fraction(3, 1);
      const result = multiply(a, b);
      expect(toDecimal(result)).toBeCloseTo(7.5, 10);
    });
  });

  describe('divide()', () => {
    it('divides 1/2 / 1/4 = 2', () => {
      const result = divide(fraction(1, 2), fraction(1, 4));
      expect(result.numerator).toBe(2);
      expect(result.denominator).toBe(1);
    });

    it('divides 3/4 / 3/8 = 2', () => {
      const result = divide(fraction(3, 4), fraction(3, 8));
      expect(result.numerator).toBe(2);
      expect(result.denominator).toBe(1);
    });

    it('throws on division by zero', () => {
      expect(() => divide(fraction(1, 2), fraction(0, 1))).toThrow();
    });
  });

  describe('toDecimal()', () => {
    it('converts 3/4 to 0.75', () => {
      expect(toDecimal(fraction(3, 4))).toBe(0.75);
    });

    it('converts 1/3 to ~0.3333', () => {
      expect(toDecimal(fraction(1, 3))).toBeCloseTo(0.3333, 3);
    });

    it('converts 5/1 to 5', () => {
      expect(toDecimal(fraction(5, 1))).toBe(5);
    });
  });

  describe('toMixedNumberString()', () => {
    it('formats 3/4 as "3/4"', () => {
      expect(toMixedNumberString(fraction(3, 4))).toBe('3/4');
    });

    it('formats 9/4 as "2 1/4"', () => {
      expect(toMixedNumberString(fraction(9, 4))).toBe('2 1/4');
    });

    it('formats 4/4 as "1"', () => {
      expect(toMixedNumberString(simplify(fraction(4, 4)))).toBe('1');
    });

    it('formats 0/5 as "0"', () => {
      expect(toMixedNumberString(fraction(0, 5))).toBe('0');
    });

    it('formats -9/4 as "-2 1/4"', () => {
      expect(toMixedNumberString(fraction(-9, 4))).toBe('-2 1/4');
    });

    it('formats 5/1 as "5"', () => {
      expect(toMixedNumberString(fraction(5, 1))).toBe('5');
    });
  });

  describe('toFractionString()', () => {
    it('formats 3/4 as "3/4"', () => {
      expect(toFractionString(fraction(3, 4))).toBe('3/4');
    });

    it('formats 5/1 as "5"', () => {
      expect(toFractionString(fraction(5, 1))).toBe('5');
    });
  });

  describe('toImproperFractionString()', () => {
    it('formats 9/4 as "9/4"', () => {
      expect(toImproperFractionString(fraction(9, 4))).toBe('9/4');
    });

    it('formats 3/1 as "3"', () => {
      expect(toImproperFractionString(fraction(3, 1))).toBe('3');
    });
  });

  describe('decimalToFraction()', () => {
    it('converts 0.5 to 1/2', () => {
      const f = decimalToFraction(0.5);
      expect(f.numerator).toBe(1);
      expect(f.denominator).toBe(2);
    });

    it('converts 0.25 to 1/4', () => {
      const f = decimalToFraction(0.25);
      expect(f.numerator).toBe(1);
      expect(f.denominator).toBe(4);
    });

    it('converts 0.625 to 5/8', () => {
      const f = decimalToFraction(0.625);
      expect(f.numerator).toBe(5);
      expect(f.denominator).toBe(8);
    });

    it('converts 3.0 to 3/1', () => {
      const f = decimalToFraction(3.0);
      expect(f.numerator).toBe(3);
      expect(f.denominator).toBe(1);
    });

    it('converts 0.333 approximately to 1/3', () => {
      const f = decimalToFraction(1 / 3);
      expect(toDecimal(f)).toBeCloseTo(1 / 3, 6);
    });
  });

  describe('unit conversion', () => {
    it('converts 1 inch to 2.54 cm', () => {
      expect(inchesToCm(1)).toBeCloseTo(2.54, 10);
    });

    it('converts 10 inches to 25.4 cm', () => {
      expect(inchesToCm(10)).toBeCloseTo(25.4, 10);
    });

    it('converts 2.54 cm to 1 inch', () => {
      expect(cmToInches(2.54)).toBeCloseTo(1, 10);
    });

    it('converts 25.4 cm to 10 inches', () => {
      expect(cmToInches(25.4)).toBeCloseTo(10, 10);
    });

    it('round-trips correctly: inches -> cm -> inches', () => {
      const original = 5.625;
      expect(cmToInches(inchesToCm(original))).toBeCloseTo(original, 10);
    });
  });
});
