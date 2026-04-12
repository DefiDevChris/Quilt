// ============================================================================
// XORSHIFT128+ Random Number Generator
// Deterministic, seedable RNG for reproducible results
// ============================================================================

import type { XORShift128Plus } from './types';

/**
 * Create a XORSHIFT128+ RNG seeded with a 64-bit value.
 * Algorithm: https://vigna.di.unimi.it/ftp/papers/xorshiftplus.pdf
 */
export function createXORShift128Plus(seed: number): XORShift128Plus {
  let state = BigInt(seed >>> 0);

  function splitmix64(): bigint {
    state = (state + BigInt('0x9e3779b97f4a7c15')) & BigInt('0xFFFFFFFFFFFFFFFF');
    let z = state;
    z = ((z ^ (z >> BigInt(30))) * BigInt('0xbf58476d1ce4e5b9')) & BigInt('0xFFFFFFFFFFFFFFFF');
    z = ((z ^ (z >> BigInt(27))) * BigInt('0x94d049bb133111eb')) & BigInt('0xFFFFFFFFFFFFFFFF');
    return (z ^ (z >> BigInt(31))) & BigInt('0xFFFFFFFFFFFFFFFF');
  }

  let s0 = splitmix64();
  let s1 = splitmix64();

  if (s0 === BigInt(0) && s1 === BigInt(0)) {
    s0 = BigInt(1);
  }

  const next = (): number => {
    let x = s0;
    const y = s1;
    s0 = y;
    x = ((x ^ (x << BigInt(23))) & BigInt('0xFFFFFFFFFFFFFFFF')) ^ y ^ (y >> BigInt(26));
    s1 = x;
    const result = (s0 + y) & BigInt('0xFFFFFFFFFFFFFFFF');
    return Number(result >> BigInt(11)) / Number(BigInt(1) << BigInt(53));
  };

  const nextInt = (): number => {
    let x = s0;
    const y = s1;
    s0 = y;
    x = ((x ^ (x << BigInt(23))) & BigInt('0xFFFFFFFFFFFFFFFF')) ^ y ^ (y >> BigInt(26));
    s1 = x;
    const result = (s0 + y) & BigInt('0xFFFFFFFFFFFFFFFF');
    return Number(result & BigInt('0xFFFFFFFF'));
  };

  return { next, nextInt };
}

/** Shuffle array in-place using Fisher-Yates */
export function shuffleArray<T>(array: T[], rng: XORShift128Plus): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/** Pick k unique indices from [0, n) using reservoir sampling */
export function sampleKFromN(rng: XORShift128Plus, k: number, n: number): number[] {
  if (k >= n) return Array.from({ length: n }, (_, i) => i);

  const result: number[] = [];
  for (let i = 0; i < k; i++) result.push(i);
  for (let i = k; i < n; i++) {
    const j = Math.floor(rng.next() * (i + 1));
    if (j < k) result[j] = i;
  }
  return result;
}
