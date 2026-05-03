import { gcd } from './math-utils';

// ── Constants ──────────────────────────────────────────────────────

/** Precision threshold for continued fraction convergence */
const CONVERGENCE_THRESHOLD = 1e-10;

export interface Fraction {
  readonly numerator: number;
  readonly denominator: number;
}

function fraction(numerator: number, denominator: number): Fraction {
  if (denominator === 0) {
    throw new Error('Denominator cannot be zero');
  }
  if (denominator < 0) {
    numerator = -numerator;
    denominator = -denominator;
  }
  return { numerator, denominator };
}

function simplify(f: Fraction): Fraction {
  if (f.numerator === 0) return fraction(0, 1);
  const g = gcd(f.numerator, f.denominator);
  return fraction(f.numerator / g, f.denominator / g);
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

  let h0 = 0,
    h1 = 1;
  let k0 = 1,
    k1 = 0;

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
    if (remainder < CONVERGENCE_THRESHOLD) break;
    abs = 1 / remainder;
  }

  return simplify(fraction(sign * h1, k1));
}

// Quilters cut in 1/8" increments, so any finer precision is cosmetic.
function roundToEighthNearest(value: number): number {
  return Math.round(value * 8) / 8;
}

// Format a decimal inch value as a quilter-friendly mixed fraction rounded to eighths.
//   3        → "3"
//   0.25     → "1/4"
//   2.125    → "2 1/8"
//   2.125, '-' → "2-1/8"
export function formatFraction(value: number, separator: string = ' '): string {
  const rounded = roundToEighthNearest(value);
  const whole = Math.floor(rounded);
  const eighths = Math.round((rounded - whole) * 8);

  if (eighths === 0) {
    return `${whole}`;
  }

  const g = gcd(eighths, 8);
  const numerator = eighths / g;
  const denominator = 8 / g;

  if (whole === 0) {
    return `${numerator}/${denominator}`;
  }

  return `${whole}${separator}${numerator}/${denominator}`;
}
