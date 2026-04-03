/**
 * Color Math — Pure color conversion and distance utilities.
 *
 * Shared by Photo to Pattern and OCR engines. Zero external dependencies.
 * All functions are pure and immutable.
 *
 * Uses the D65 illuminant reference white for sRGB -> XYZ -> LAB conversion.
 */

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface RGB {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

export interface LAB {
  readonly l: number;
  readonly a: number;
  readonly b: number;
}

export interface HSL {
  readonly h: number;
  readonly s: number;
  readonly l: number;
}

// ---------------------------------------------------------------------------
// D65 illuminant reference white
// ---------------------------------------------------------------------------

const D65_X = 0.95047;
const D65_Y = 1.0;
const D65_Z = 1.08883;

// ---------------------------------------------------------------------------
// Conversions: hex <-> RGB
// ---------------------------------------------------------------------------

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

  // Validate: only hex characters allowed
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

/**
 * Convert RGB to a 6-digit lowercase hex string with hash prefix.
 */
export function rgbToHex(rgb: RGB): string {
  const r = Math.round(Math.max(0, Math.min(255, rgb.r)));
  const g = Math.round(Math.max(0, Math.min(255, rgb.g)));
  const b = Math.round(Math.max(0, Math.min(255, rgb.b)));

  const toHex = (n: number): string => n.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// ---------------------------------------------------------------------------
// Conversion: RGB -> HSL
// ---------------------------------------------------------------------------

/**
 * Convert RGB (0-255) to HSL (h: 0-360, s: 0-1, l: 0-1).
 */
export function rgbToHsl(rgb: RGB): HSL {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) {
    return { h: 0, s: 0, l };
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h: number;
  if (max === r) {
    h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  } else if (max === g) {
    h = ((b - r) / d + 2) / 6;
  } else {
    h = ((r - g) / d + 4) / 6;
  }

  return { h: h * 360, s, l };
}

// ---------------------------------------------------------------------------
// Conversion: HSL -> RGB
// ---------------------------------------------------------------------------

/**
 * Convert HSL (h: 0-360, s: 0-1, l: 0-1) to RGB (0-255).
 */
export function hslToRgb(hsl: HSL): RGB {
  const h = hsl.h / 360;
  const { s, l } = hsl;

  if (s === 0) {
    const gray = Math.round(l * 255);
    return { r: gray, g: gray, b: gray };
  }

  const hue2rgb = (p: number, q: number, t: number): number => {
    const t2 = t < 0 ? t + 1 : t > 1 ? t - 1 : t;
    if (t2 < 1 / 6) return p + (q - p) * 6 * t2;
    if (t2 < 1 / 2) return q;
    if (t2 < 2 / 3) return p + (q - p) * (2 / 3 - t2) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return {
    r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, h) * 255),
    b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  };
}

// ---------------------------------------------------------------------------
// Conversion: RGB -> XYZ -> LAB
// ---------------------------------------------------------------------------

/**
 * Linearize an sRGB channel value (0-255) to linear light (0-1).
 */
function srgbToLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/**
 * Convert linear RGB to CIE XYZ using sRGB matrix.
 */
function linearRgbToXyz(
  rLin: number,
  gLin: number,
  bLin: number
): { readonly x: number; readonly y: number; readonly z: number } {
  return {
    x: rLin * 0.4124564 + gLin * 0.3575761 + bLin * 0.1804375,
    y: rLin * 0.2126729 + gLin * 0.7151522 + bLin * 0.072175,
    z: rLin * 0.0193339 + gLin * 0.119192 + bLin * 0.9503041,
  };
}

/**
 * Apply the CIE LAB f(t) nonlinear transform.
 */
function labF(t: number): number {
  const delta = 6 / 29;
  const deltaCubed = delta * delta * delta;
  return t > deltaCubed ? Math.cbrt(t) : t / (3 * delta * delta) + 4 / 29;
}

/**
 * Convert RGB (0-255 per channel) to CIE LAB using D65 illuminant.
 */
export function rgbToLab(rgb: RGB): LAB {
  const rLin = srgbToLinear(rgb.r);
  const gLin = srgbToLinear(rgb.g);
  const bLin = srgbToLinear(rgb.b);

  const xyz = linearRgbToXyz(rLin, gLin, bLin);

  const fx = labF(xyz.x / D65_X);
  const fy = labF(xyz.y / D65_Y);
  const fz = labF(xyz.z / D65_Z);

  return {
    l: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
  };
}

// ---------------------------------------------------------------------------
// Distance
// ---------------------------------------------------------------------------

/**
 * CIE76 Euclidean distance between two colors in LAB space.
 */
export function labDistance(a: LAB, b: LAB): number {
  const dl = a.l - b.l;
  const da = a.a - b.a;
  const db = a.b - b.b;
  return Math.sqrt(dl * dl + da * da + db * db);
}

// ---------------------------------------------------------------------------
// Matching
// ---------------------------------------------------------------------------

/**
 * Find the closest color in a palette to a target color using LAB distance.
 * Returns the index, distance, and matched color.
 */
export function findClosestColor(
  target: RGB,
  palette: readonly RGB[]
): { readonly index: number; readonly distance: number; readonly color: RGB } {
  if (palette.length === 0) {
    throw new Error('Palette must contain at least one color');
  }

  const targetLab = rgbToLab(target);

  let bestIndex = 0;
  let bestDistance = Infinity;

  for (let i = 0; i < palette.length; i++) {
    const d = labDistance(targetLab, rgbToLab(palette[i]));
    if (d < bestDistance) {
      bestDistance = d;
      bestIndex = i;
    }
  }

  return {
    index: bestIndex,
    distance: bestDistance,
    color: palette[bestIndex],
  };
}

// ---------------------------------------------------------------------------
// Sampling
// ---------------------------------------------------------------------------

/**
 * Compute the average RGB color from a segment of a Uint8ClampedArray of
 * RGBA pixel data. startIndex is the byte offset (not pixel index).
 * count is the number of pixels to average.
 */
export function averageColor(pixels: Uint8ClampedArray, startIndex: number, count: number): RGB {
  if (count === 0) {
    return { r: 0, g: 0, b: 0 };
  }

  let totalR = 0;
  let totalG = 0;
  let totalB = 0;

  for (let i = 0; i < count; i++) {
    const offset = startIndex + i * 4;
    totalR += pixels[offset];
    totalG += pixels[offset + 1];
    totalB += pixels[offset + 2];
  }

  return {
    r: Math.round(totalR / count),
    g: Math.round(totalG / count),
    b: Math.round(totalB / count),
  };
}
