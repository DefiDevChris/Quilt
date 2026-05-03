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
 * Check if a point (x, y) is inside a polygon defined by vertices.
 * Uses the ray casting algorithm.
 */
export function pointInPolygon(
  points: Array<{ x: number; y: number }>,
  x: number,
  y: number,
): boolean {
  let inside = false;

  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const xi = points[i].x;
    const yi = points[i].y;
    const xj = points[j].x;
    const yj = points[j].y;

    const intersects = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / ((yj - yi) || 1e-9) + xi;
    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}


