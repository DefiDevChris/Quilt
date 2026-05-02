/**
 * Color Math — Pure color conversion utilities.
 *
 * Zero external dependencies. All functions are pure and immutable.
 */

export interface RGB {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

/**
 * Parse a hex color string to RGB.
 * Handles 3-digit (#abc) and 6-digit (#aabbcc) forms, with or without hash.
 * Returns {r:0, g:0, b:0} for any invalid input.
 */
export function hexToRgb(hex: string): RGB {
  const fallback: RGB = { r: 0, g: 0, b: 0 };

  if (typeof hex !== 'string' || hex.length === 0) return fallback;

  const stripped = hex.startsWith('#') ? hex.slice(1) : hex;
  const lower = stripped.toLowerCase();

  if (!/^[0-9a-f]+$/.test(lower)) return fallback;

  if (lower.length === 3) {
    const r = parseInt(lower[0] + lower[0], 16);
    const g = parseInt(lower[1] + lower[1], 16);
    const b = parseInt(lower[2] + lower[2], 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return fallback;
    return { r, g, b };
  }

  if (lower.length !== 6) return fallback;

  const r = parseInt(lower.slice(0, 2), 16);
  const g = parseInt(lower.slice(2, 4), 16);
  const b = parseInt(lower.slice(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return fallback;
  return { r, g, b };
}
