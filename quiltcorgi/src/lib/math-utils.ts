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
 * Mulberry32 PRNG - deterministic random number generator.
 * Matches the implementation in colorway-engine.ts.
 *
 * @param seed - 32-bit unsigned integer seed
 * @returns Function that returns pseudo-random values in [0, 1)
 */
export function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return function () {
    s += 0x6d2b79f5;
    let z = s;
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return ((z ^ (z >>> 14)) >>> 0) / 0x100000000;
  };
}

// ============================================================================
// Input Validation Helpers
// ============================================================================

/**
 * Assert that a value is a finite number.
 * @throws Error if value is not finite (including NaN and Infinity)
 */
export function assertFinite(value: number, name: string): void {
  if (!Number.isFinite(value)) {
    throw new Error(`${name} must be a finite number, got ${value}`);
  }
}

/**
 * Assert that a value is a positive number (> 0).
 * @throws Error if value is not positive
 */
export function assertPositive(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a positive number, got ${value}`);
  }
}

/**
 * Assert that a value is a non-negative number (>= 0).
 * @throws Error if value is negative or not finite
 */
export function assertNonNegative(value: number, name: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${name} must be non-negative, got ${value}`);
  }
}

/**
 * Clamp a value to a range [min, max].
 * Returns min if value is NaN or less than min.
 */
export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

// ============================================================================
// Floating Point Comparison
// ============================================================================

/**
 * Epsilon value for floating point comparisons.
 * Chosen to be small enough for precision but large enough to handle
 * typical floating point arithmetic errors.
 */
export const EPSILON = 1e-6;

/**
 * Compare two numbers for equality within epsilon tolerance.
 * Useful for comparing floating point results.
 */
export function floatEquals(a: number, b: number, epsilon = EPSILON): boolean {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  return Math.abs(a - b) < epsilon;
}

/**
 * Check if a number is effectively zero (within epsilon).
 */
export function isEffectivelyZero(value: number, epsilon = EPSILON): boolean {
  return Number.isFinite(value) && Math.abs(value) < epsilon;
}
