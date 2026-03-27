export interface Fraction {
  readonly numerator: number;
  readonly denominator: number;
}

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b !== 0) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}

export function fraction(numerator: number, denominator: number): Fraction {
  if (denominator === 0) {
    throw new Error('Denominator cannot be zero');
  }
  if (denominator < 0) {
    numerator = -numerator;
    denominator = -denominator;
  }
  return { numerator, denominator };
}

export function simplify(f: Fraction): Fraction {
  if (f.numerator === 0) return fraction(0, 1);
  const g = gcd(f.numerator, f.denominator);
  return fraction(f.numerator / g, f.denominator / g);
}

export function parseFraction(input: string): Fraction {
  const trimmed = input.trim();
  if (trimmed === '') {
    throw new Error('Cannot parse empty string as fraction');
  }

  // Decimal: contains a dot
  if (trimmed.includes('.')) {
    return decimalToFraction(parseFloat(trimmed));
  }

  // Mixed number: "2 1/4" or "-2 1/4"
  const mixedMatch = trimmed.match(/^(-?\d+)\s+(\d+)\/(\d+)$/);
  if (mixedMatch) {
    const whole = parseInt(mixedMatch[1], 10);
    const num = parseInt(mixedMatch[2], 10);
    const den = parseInt(mixedMatch[3], 10);
    if (den === 0) throw new Error('Denominator cannot be zero');
    const sign = whole < 0 ? -1 : 1;
    const totalNum = Math.abs(whole) * den + num;
    return simplify(fraction(sign * totalNum, den));
  }

  // Simple fraction: "3/4" or "-3/4"
  const fractionMatch = trimmed.match(/^(-?\d+)\/(\d+)$/);
  if (fractionMatch) {
    const num = parseInt(fractionMatch[1], 10);
    const den = parseInt(fractionMatch[2], 10);
    if (den === 0) throw new Error('Denominator cannot be zero');
    return simplify(fraction(num, den));
  }

  // Whole number: "5" or "-5"
  const wholeMatch = trimmed.match(/^-?\d+$/);
  if (wholeMatch) {
    return fraction(parseInt(trimmed, 10), 1);
  }

  throw new Error(`Cannot parse "${input}" as a fraction`);
}

export function add(a: Fraction, b: Fraction): Fraction {
  const num = a.numerator * b.denominator + b.numerator * a.denominator;
  const den = a.denominator * b.denominator;
  return simplify(fraction(num, den));
}

export function subtract(a: Fraction, b: Fraction): Fraction {
  const num = a.numerator * b.denominator - b.numerator * a.denominator;
  const den = a.denominator * b.denominator;
  return simplify(fraction(num, den));
}

export function multiply(a: Fraction, b: Fraction): Fraction {
  return simplify(fraction(a.numerator * b.numerator, a.denominator * b.denominator));
}

export function divide(a: Fraction, b: Fraction): Fraction {
  if (b.numerator === 0) {
    throw new Error('Cannot divide by zero');
  }
  return simplify(fraction(a.numerator * b.denominator, a.denominator * b.numerator));
}

export function toDecimal(f: Fraction): number {
  return f.numerator / f.denominator;
}

export function toMixedNumberString(f: Fraction): string {
  const s = simplify(f);
  if (s.numerator === 0) return '0';
  if (s.denominator === 1) return `${s.numerator}`;

  const absNum = Math.abs(s.numerator);
  const whole = Math.floor(absNum / s.denominator);
  const remainder = absNum % s.denominator;
  const sign = s.numerator < 0 ? '-' : '';

  if (whole === 0) return `${sign}${remainder}/${s.denominator}`;
  if (remainder === 0) return `${sign}${whole}`;
  return `${sign}${whole} ${remainder}/${s.denominator}`;
}

export function toFractionString(f: Fraction): string {
  const s = simplify(f);
  if (s.denominator === 1) return `${s.numerator}`;
  return `${s.numerator}/${s.denominator}`;
}

export function toImproperFractionString(f: Fraction): string {
  const s = simplify(f);
  if (s.denominator === 1) return `${s.numerator}`;
  return `${s.numerator}/${s.denominator}`;
}

export function decimalToFraction(decimal: number): Fraction {
  if (Number.isNaN(decimal) || !Number.isFinite(decimal)) {
    throw new Error('Cannot convert NaN or Infinity to fraction');
  }
  if (decimal === Math.floor(decimal)) {
    return fraction(decimal, 1);
  }

  // Use continued fraction algorithm for best rational approximation
  const sign = decimal < 0 ? -1 : 1;
  let abs = Math.abs(decimal);
  const maxDenominator = 10000;

  let h0 = 0, h1 = 1;
  let k0 = 1, k1 = 0;

  for (let i = 0; i < 100; i++) {
    const a = Math.floor(abs);
    const h2 = a * h1 + h0;
    const k2 = a * k1 + k0;

    if (k2 > maxDenominator) break;

    h0 = h1;
    h1 = h2;
    k0 = k1;
    k1 = k2;

    const remainder = abs - a;
    if (remainder < 1e-10) break;
    abs = 1 / remainder;
  }

  return simplify(fraction(sign * h1, k1));
}

export function inchesToCm(inches: number): number {
  return inches * 2.54;
}

export function cmToInches(cm: number): number {
  return cm / 2.54;
}
