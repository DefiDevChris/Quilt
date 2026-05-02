/**
 * Shared math utilities used across multiple engines.
 *
 * Pure functions with no dependencies.
 */

/**
 * Compute the greatest common divisor of two numbers using Euclidean algorithm.
 * Handles negative numbers by taking absolute values.
 */
export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b !== 0) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}

/**
 * Clamp a value to a range [min, max].
 * Returns min if value is NaN or less than min.
 */
export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

/**
 * Epsilon value for floating point comparisons.
 * Chosen to be small enough for precision but large enough to handle
 * typical floating point arithmetic errors.
 */
export const EPSILON = 1e-6;
