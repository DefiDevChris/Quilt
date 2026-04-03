import {
  decimalToFraction,
  fraction,
  simplify,
  parseFraction,
  add,
  subtract,
  multiply,
  divide,
  toDecimal,
  toMixedNumberString,
  toFractionString,
  inchesToCm,
  cmToInches,
} from '@/lib/fraction-math';

describe('fraction', () => {
  it('creates fraction with positive denominator', () => {
    const f = fraction(1, 2);
    expect(f.numerator).toBe(1);
    expect(f.denominator).toBe(2);
  });

  it('throws for zero denominator', () => {
    expect(() => fraction(1, 0)).toThrow('Denominator cannot be zero');
  });

  it('normalizes negative denominator', () => {
    const f = fraction(1, -2);
    expect(f.numerator).toBe(-1);
    expect(f.denominator).toBe(2);
  });
});

describe('simplify', () => {
  it('simplifies 2/4 to 1/2', () => {
    const result = simplify(fraction(2, 4));
    expect(result.numerator).toBe(1);
    expect(result.denominator).toBe(2);
  });

  it('returns 0/1 for zero numerator', () => {
    const result = simplify(fraction(0, 5));
    expect(result.numerator).toBe(0);
    expect(result.denominator).toBe(1);
  });
});

describe('parseFraction', () => {
  it('parses simple fraction', () => {
    const f = parseFraction('3/4');
    expect(f.numerator).toBe(3);
    expect(f.denominator).toBe(4);
  });

  it('parses negative fraction', () => {
    const f = parseFraction('-3/4');
    expect(f.numerator).toBe(-3);
    expect(f.denominator).toBe(4);
  });

  it('parses mixed number', () => {
    const f = parseFraction('2 1/4');
    expect(f.numerator).toBe(9);
    expect(f.denominator).toBe(4);
  });

  it('parses negative mixed number', () => {
    const f = parseFraction('-2 1/4');
    expect(f.numerator).toBe(-9);
    expect(f.denominator).toBe(4);
  });

  it('parses whole number', () => {
    const f = parseFraction('5');
    expect(f.numerator).toBe(5);
    expect(f.denominator).toBe(1);
  });

  it('parses decimal', () => {
    const f = parseFraction('0.5');
    expect(f.numerator).toBe(1);
    expect(f.denominator).toBe(2);
  });

  it('throws for empty string', () => {
    expect(() => parseFraction('')).toThrow('Cannot parse empty string');
  });

  it('throws for invalid input', () => {
    expect(() => parseFraction('abc')).toThrow();
  });
});

describe('add', () => {
  it('adds 1/2 + 1/4', () => {
    const result = add(fraction(1, 2), fraction(1, 4));
    expect(result.numerator).toBe(3);
    expect(result.denominator).toBe(4);
  });
});

describe('subtract', () => {
  it('subtracts 3/4 - 1/4', () => {
    const result = subtract(fraction(3, 4), fraction(1, 4));
    expect(result.numerator).toBe(1);
    expect(result.denominator).toBe(2);
  });
});

describe('multiply', () => {
  it('multiplies 1/2 * 2/3', () => {
    const result = multiply(fraction(1, 2), fraction(2, 3));
    expect(result.numerator).toBe(1);
    expect(result.denominator).toBe(3);
  });
});

describe('divide', () => {
  it('divides 1/2 / 2/3', () => {
    const result = divide(fraction(1, 2), fraction(2, 3));
    expect(result.numerator).toBe(3);
    expect(result.denominator).toBe(4);
  });

  it('throws for divide by zero', () => {
    expect(() => divide(fraction(1, 2), fraction(0, 1))).toThrow('Cannot divide by zero');
  });
});

describe('toDecimal', () => {
  it('converts 1/2 to 0.5', () => {
    expect(toDecimal(fraction(1, 2))).toBe(0.5);
  });
});

describe('toMixedNumberString', () => {
  it('converts 9/4 to 2 1/4', () => {
    const result = toMixedNumberString(fraction(9, 4));
    expect(result).toBe('2 1/4');
  });

  it('converts 5/4 to 1 1/4', () => {
    const result = toMixedNumberString(fraction(5, 4));
    expect(result).toBe('1 1/4');
  });

  it('converts whole number', () => {
    const result = toMixedNumberString(fraction(5, 1));
    expect(result).toBe('5');
  });

  it('handles negative', () => {
    const result = toMixedNumberString(fraction(-5, 4));
    expect(result).toBe('-1 1/4');
  });
});

describe('toFractionString', () => {
  it('formats 3/4', () => {
    expect(toFractionString(fraction(3, 4))).toBe('3/4');
  });

  it('formats whole number', () => {
    expect(toFractionString(fraction(5, 1))).toBe('5');
  });
});

describe('decimalToFraction', () => {
  it('throws for NaN', () => {
    expect(() => decimalToFraction(NaN)).toThrow('Cannot convert NaN or Infinity to fraction');
  });

  it('throws for Infinity', () => {
    expect(() => decimalToFraction(Infinity)).toThrow('Cannot convert NaN or Infinity to fraction');
  });

  it('converts 0.5 to 1/2', () => {
    const result = decimalToFraction(0.5);
    expect(result.numerator).toBe(1);
    expect(result.denominator).toBe(2);
  });

  it('converts 0.25 to 1/4', () => {
    const result = decimalToFraction(0.25);
    expect(result.numerator).toBe(1);
    expect(result.denominator).toBe(4);
  });

  it('converts integer', () => {
    const result = decimalToFraction(5);
    expect(result.numerator).toBe(5);
    expect(result.denominator).toBe(1);
  });
});

describe('inchesToCm', () => {
  it('converts 1 inch to 2.54 cm', () => {
    expect(inchesToCm(1)).toBeCloseTo(2.54);
  });
});

describe('cmToInches', () => {
  it('converts 2.54 cm to 1 inch', () => {
    expect(cmToInches(2.54)).toBeCloseTo(1);
  });
});
