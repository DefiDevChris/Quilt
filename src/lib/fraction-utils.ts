/**
 * Fraction / imperial-length formatting helpers.
 *
 * Historically these lived inside `piece-detection-utils.ts` next to the
 * OpenCV pipeline. That file was deleted when the brittle 15-step CV
 * pipeline was ripped out — these tiny pure-math helpers moved here so the
 * cutting-template and edge-dimension modules can keep rendering quilter-
 * friendly fractions.
 */

import { gcd } from './math-utils';

/**
 * Round a decimal inch value to the nearest eighth of an inch.
 * Quilters cut in 1/8" increments, so any finer precision is cosmetic.
 */
export function roundToEighthNearest(value: number): number {
  return Math.round(value * 8) / 8;
}

/**
 * Format a decimal inch value as a quilter-friendly mixed fraction:
 *   3        → "3"
 *   0.25     → "1/4"
 *   2.125    → "2 1/8"
 *   2.125, '-' → "2-1/8"
 *
 * Uses eighths as the denominator and simplifies via GCD.
 */
export function formatFraction(value: number, separator: string = ' '): string {
  const rounded = roundToEighthNearest(value);
  const whole = Math.floor(rounded);
  const eighths = Math.round((rounded - whole) * 8);

  if (eighths === 0) {
    return `${whole}`;
  }

  const gcdValue = gcd(eighths, 8);
  const numerator = eighths / gcdValue;
  const denominator = 8 / gcdValue;

  if (whole === 0) {
    return `${numerator}/${denominator}`;
  }

  return `${whole}${separator}${numerator}/${denominator}`;
}
