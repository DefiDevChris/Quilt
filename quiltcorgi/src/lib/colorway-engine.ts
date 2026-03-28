/**
 * Colorway Engine — Pure logic for bulk color operations on quilt patches.
 *
 * All functions are pure and immutable: they accept inputs, return new arrays,
 * and never mutate their arguments. No React, no Fabric.js, no DOM dependencies.
 */

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface PatchColor {
  objectId: string;
  currentFill: string;
}

export interface ColorChange {
  objectId: string;
  newFill: string;
}

// ---------------------------------------------------------------------------
// normalizeColor
// ---------------------------------------------------------------------------

/**
 * Normalize a hex color string to a lowercase 6-digit #rrggbb form.
 *
 * Handles:
 * - 3-digit shorthand (#fff → #ffffff)
 * - Uppercase (#FF0000 → #ff0000)
 * - Missing hash (ff0000 → #ff0000)
 */
export function normalizeColor(hex: string): string {
  const stripped = hex.startsWith('#') ? hex.slice(1) : hex;
  const lower = stripped.toLowerCase();

  if (lower.length === 3 && /^[0-9a-f]{3}$/.test(lower)) {
    const expanded = lower
      .split('')
      .map((ch) => ch + ch)
      .join('');
    return `#${expanded}`;
  }

  if (lower.length === 6 && /^[0-9a-f]{6}$/.test(lower)) {
    return `#${lower}`;
  }

  return '#000000';
}

// ---------------------------------------------------------------------------
// spraycanRecolor
// ---------------------------------------------------------------------------

/**
 * Return a ColorChange for every patch whose normalized currentFill matches
 * the normalized targetFill.
 */
export function spraycanRecolor(
  patches: PatchColor[],
  targetFill: string,
  newFill: string
): ColorChange[] {
  const normalizedTarget = normalizeColor(targetFill);
  const normalizedNew = normalizeColor(newFill);

  return patches.reduce<ColorChange[]>((acc, patch) => {
    if (normalizeColor(patch.currentFill) === normalizedTarget) {
      return [...acc, { objectId: patch.objectId, newFill: normalizedNew }];
    }
    return acc;
  }, []);
}

// ---------------------------------------------------------------------------
// swapColors
// ---------------------------------------------------------------------------

/**
 * Bidirectional color swap.
 *
 * Patches with colorA receive colorB, and patches with colorB receive colorA.
 * Uses normalized comparison throughout.
 */
export function swapColors(patches: PatchColor[], colorA: string, colorB: string): ColorChange[] {
  const normA = normalizeColor(colorA);
  const normB = normalizeColor(colorB);

  return patches.reduce<ColorChange[]>((acc, patch) => {
    const current = normalizeColor(patch.currentFill);
    if (current === normA) {
      return [...acc, { objectId: patch.objectId, newFill: normB }];
    }
    if (current === normB) {
      return [...acc, { objectId: patch.objectId, newFill: normA }];
    }
    return acc;
  }, []);
}

// ---------------------------------------------------------------------------
// randomizeColors
// ---------------------------------------------------------------------------

/**
 * Mulberry32 — a fast, seedable 32-bit PRNG.
 * Returns a function that produces the next pseudo-random float in [0, 1).
 */
function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return function () {
    s += 0x6d2b79f5;
    let z = s;
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return ((z ^ (z >>> 14)) >>> 0) / 0x100000000;
  };
}

/**
 * Assign a random color from palette to every patch.
 *
 * When seed is provided the output is deterministic; omitting seed uses
 * Math.random() so results will differ between calls.
 */
export function randomizeColors(
  patches: PatchColor[],
  palette: string[],
  seed?: number
): ColorChange[] {
  if (palette.length === 0) {
    return patches.map((patch) => ({ objectId: patch.objectId, newFill: patch.currentFill }));
  }

  const normalizedPalette = palette.map(normalizeColor);
  const rand = seed !== undefined ? mulberry32(seed) : Math.random.bind(Math);

  return patches.map((patch) => {
    const index = Math.floor(rand() * normalizedPalette.length);
    return { objectId: patch.objectId, newFill: normalizedPalette[index] };
  });
}

// ---------------------------------------------------------------------------
// extractUniquePalette
// ---------------------------------------------------------------------------

/**
 * Return a deduplicated array of normalized colors from the given patches.
 * Order follows first occurrence.
 */
export function extractUniquePalette(patches: PatchColor[]): string[] {
  const seen = new Set<string>();
  return patches.reduce<string[]>((acc, patch) => {
    const normalized = normalizeColor(patch.currentFill);
    if (seen.has(normalized)) {
      return acc;
    }
    seen.add(normalized);
    return [...acc, normalized];
  }, []);
}

// ---------------------------------------------------------------------------
// eyedropperPick
// ---------------------------------------------------------------------------

/**
 * Return the normalized fill of the patch matching objectId, or null if not found.
 */
export function eyedropperPick(patches: PatchColor[], objectId: string): string | null {
  const match = patches.find((p) => p.objectId === objectId);
  return match !== undefined ? normalizeColor(match.currentFill) : null;
}

// ---------------------------------------------------------------------------
// Color Scheme Generation
// ---------------------------------------------------------------------------

export type ColorSchemeType =
  | 'monochromatic'
  | 'analogous'
  | 'complementary'
  | 'triadic'
  | 'split-complementary'
  | 'tetradic';

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface HSL {
  h: number;
  s: number;
  l: number;
}

/**
 * Convert hex color to RGB.
 */
function hexToRgb(hex: string): RGB {
  const normalized = normalizeColor(hex);
  const r = parseInt(normalized.slice(1, 3), 16);
  const g = parseInt(normalized.slice(3, 5), 16);
  const b = parseInt(normalized.slice(5, 7), 16);
  return { r, g, b };
}

/**
 * Convert RGB to HSL.
 */
function rgbToHsl(rgb: RGB): HSL {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (diff !== 0) {
    s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / diff + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / diff + 2) / 6;
        break;
      case b:
        h = ((r - g) / diff + 4) / 6;
        break;
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

/**
 * Convert HSL to RGB.
 */
function hslToRgb(hsl: HSL): RGB {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;

  if (s === 0) {
    const gray = Math.round(l * 255);
    return { r: gray, g: gray, b: gray };
  }

  const hue2rgb = (p: number, q: number, t: number): number => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  const r = hue2rgb(p, q, h + 1 / 3);
  const g = hue2rgb(p, q, h);
  const b = hue2rgb(p, q, h - 1 / 3);

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

/**
 * Convert RGB to hex.
 */
function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

/**
 * Generate harmonious color palette based on color theory.
 */
export function generateColorScheme(
  baseColor: string,
  schemeType: ColorSchemeType,
  count: number = 5
): string[] {
  const rgb = hexToRgb(baseColor);
  const hsl = rgbToHsl(rgb);
  const colors: string[] = [normalizeColor(baseColor)];

  switch (schemeType) {
    case 'monochromatic':
      for (let i = 1; i < count; i++) {
        const lightness = Math.max(10, Math.min(90, hsl.l + (i - count / 2) * 15));
        const saturation = Math.max(20, Math.min(100, hsl.s + (i % 2 === 0 ? -10 : 10)));
        const newHsl: HSL = { h: hsl.h, s: saturation, l: lightness };
        colors.push(rgbToHex(hslToRgb(newHsl)));
      }
      break;

    case 'analogous':
      for (let i = 1; i < count; i++) {
        const hue = (hsl.h + i * 30) % 360;
        const newHsl: HSL = { h: hue, s: hsl.s, l: hsl.l };
        colors.push(rgbToHex(hslToRgb(newHsl)));
      }
      break;

    case 'complementary':
      const compHue = (hsl.h + 180) % 360;
      colors.push(rgbToHex(hslToRgb({ h: compHue, s: hsl.s, l: hsl.l })));

      // Add variations
      for (let i = 2; i < count; i++) {
        const useBase = i % 2 === 0;
        const baseHue = useBase ? hsl.h : compHue;
        const lightness = Math.max(20, Math.min(80, hsl.l + (i - count / 2) * 10));
        colors.push(rgbToHex(hslToRgb({ h: baseHue, s: hsl.s * 0.8, l: lightness })));
      }
      break;

    case 'triadic':
      colors.push(rgbToHex(hslToRgb({ h: (hsl.h + 120) % 360, s: hsl.s, l: hsl.l })));
      colors.push(rgbToHex(hslToRgb({ h: (hsl.h + 240) % 360, s: hsl.s, l: hsl.l })));

      // Add variations
      for (let i = 3; i < count; i++) {
        const baseHue = [hsl.h, (hsl.h + 120) % 360, (hsl.h + 240) % 360][i % 3];
        const lightness = Math.max(20, Math.min(80, hsl.l + (i - 3) * 15));
        colors.push(rgbToHex(hslToRgb({ h: baseHue, s: hsl.s * 0.7, l: lightness })));
      }
      break;

    case 'split-complementary':
      colors.push(rgbToHex(hslToRgb({ h: (hsl.h + 150) % 360, s: hsl.s, l: hsl.l })));
      colors.push(rgbToHex(hslToRgb({ h: (hsl.h + 210) % 360, s: hsl.s, l: hsl.l })));

      // Add variations
      for (let i = 3; i < count; i++) {
        const baseHue = [hsl.h, (hsl.h + 150) % 360, (hsl.h + 210) % 360][i % 3];
        const lightness = Math.max(20, Math.min(80, hsl.l + (i - 3) * 12));
        colors.push(rgbToHex(hslToRgb({ h: baseHue, s: hsl.s * 0.8, l: lightness })));
      }
      break;

    case 'tetradic':
      colors.push(rgbToHex(hslToRgb({ h: (hsl.h + 90) % 360, s: hsl.s, l: hsl.l })));
      colors.push(rgbToHex(hslToRgb({ h: (hsl.h + 180) % 360, s: hsl.s, l: hsl.l })));
      colors.push(rgbToHex(hslToRgb({ h: (hsl.h + 270) % 360, s: hsl.s, l: hsl.l })));

      // Add variations
      for (let i = 4; i < count; i++) {
        const baseHue = [hsl.h, (hsl.h + 90) % 360, (hsl.h + 180) % 360, (hsl.h + 270) % 360][
          i % 4
        ];
        const lightness = Math.max(20, Math.min(80, hsl.l + (i - 4) * 10));
        colors.push(rgbToHex(hslToRgb({ h: baseHue, s: hsl.s * 0.9, l: lightness })));
      }
      break;
  }

  return colors.slice(0, count);
}

/**
 * Suggest color palette based on current palette analysis.
 */
export function suggestPalette(
  currentPalette: string[],
  schemeType: ColorSchemeType,
  count: number = 5
): string[] {
  if (currentPalette.length === 0) {
    // Default to a warm base color
    return generateColorScheme('#D4883C', schemeType, count);
  }

  // Use the first color as the base for scheme generation
  const baseColor = currentPalette[0];
  return generateColorScheme(baseColor, schemeType, count);
}
