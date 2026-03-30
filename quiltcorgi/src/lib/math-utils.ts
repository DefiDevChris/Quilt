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
