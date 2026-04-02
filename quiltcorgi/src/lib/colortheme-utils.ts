/**
 * ColorTheme Engine — Pure logic for bulk color operations on quilt patches.
 *
 * All functions are pure and immutable: they accept inputs, return new arrays,
 * and never mutate their arguments. No React, no Fabric.js, no DOM dependencies.
 */

import { mulberry32, clamp } from './math-utils';
import { hexToRgb, rgbToHex, rgbToHsl, hslToRgb, type RGB, type HSL } from './color-math';

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

export type { RGB, HSL };

/**
 * Generate harmonious color palette based on color theory.
 */
export function generateColorScheme(
  baseColor: string,
  schemeType: ColorSchemeType,
  count: number = 5
): string[] {
  // Validate count - must be at least 1
  const validCount = Math.max(1, Math.floor(count));

  const rgb = hexToRgb(baseColor);
  const hsl = rgbToHsl(rgb);
  const colors: string[] = [normalizeColor(baseColor)];

  switch (schemeType) {
    case 'monochromatic':
      for (let i = 1; i < validCount; i++) {
        const lightness = clamp(hsl.l + (i - validCount / 2) * 0.15, 0.1, 0.9);
        const saturation = clamp(hsl.s + (i % 2 === 0 ? -0.1 : 0.1), 0.2, 1.0);
        const newHsl: HSL = { h: hsl.h, s: saturation, l: lightness };
        colors.push(rgbToHex(hslToRgb(newHsl)));
      }
      break;

    case 'analogous':
      for (let i = 1; i < validCount; i++) {
        const hue = (hsl.h + i * 30) % 360;
        const newHsl: HSL = { h: hue, s: hsl.s, l: hsl.l };
        colors.push(rgbToHex(hslToRgb(newHsl)));
      }
      break;

    case 'complementary':
      const compHue = (hsl.h + 180) % 360;
      colors.push(rgbToHex(hslToRgb({ h: compHue, s: hsl.s, l: hsl.l })));

      // Add variations
      for (let i = 2; i < validCount; i++) {
        const useBase = i % 2 === 0;
        const baseHue = useBase ? hsl.h : compHue;
        const lightness = clamp(hsl.l + (i - validCount / 2) * 0.1, 0.2, 0.8);
        colors.push(rgbToHex(hslToRgb({ h: baseHue, s: hsl.s * 0.8, l: lightness })));
      }
      break;

    case 'triadic':
      colors.push(rgbToHex(hslToRgb({ h: (hsl.h + 120) % 360, s: hsl.s, l: hsl.l })));
      colors.push(rgbToHex(hslToRgb({ h: (hsl.h + 240) % 360, s: hsl.s, l: hsl.l })));

      // Add variations
      for (let i = 3; i < validCount; i++) {
        const baseHue = [hsl.h, (hsl.h + 120) % 360, (hsl.h + 240) % 360][i % 3];
        const lightness = clamp(hsl.l + (i - 3) * 0.15, 0.2, 0.8);
        colors.push(rgbToHex(hslToRgb({ h: baseHue, s: hsl.s * 0.7, l: lightness })));
      }
      break;

    case 'split-complementary':
      colors.push(rgbToHex(hslToRgb({ h: (hsl.h + 150) % 360, s: hsl.s, l: hsl.l })));
      colors.push(rgbToHex(hslToRgb({ h: (hsl.h + 210) % 360, s: hsl.s, l: hsl.l })));

      // Add variations
      for (let i = 3; i < validCount; i++) {
        const baseHue = [hsl.h, (hsl.h + 150) % 360, (hsl.h + 210) % 360][i % 3];
        const lightness = clamp(hsl.l + (i - 3) * 0.12, 0.2, 0.8);
        colors.push(rgbToHex(hslToRgb({ h: baseHue, s: hsl.s * 0.8, l: lightness })));
      }
      break;

    case 'tetradic':
      colors.push(rgbToHex(hslToRgb({ h: (hsl.h + 90) % 360, s: hsl.s, l: hsl.l })));
      colors.push(rgbToHex(hslToRgb({ h: (hsl.h + 180) % 360, s: hsl.s, l: hsl.l })));
      colors.push(rgbToHex(hslToRgb({ h: (hsl.h + 270) % 360, s: hsl.s, l: hsl.l })));

      // Add variations
      for (let i = 4; i < validCount; i++) {
        const baseHue = [hsl.h, (hsl.h + 90) % 360, (hsl.h + 180) % 360, (hsl.h + 270) % 360][
          i % 4
        ];
        const lightness = clamp(hsl.l + (i - 4) * 0.1, 0.2, 0.8);
        colors.push(rgbToHex(hslToRgb({ h: baseHue, s: hsl.s * 0.9, l: lightness })));
      }
      break;
  }

  return colors.slice(0, validCount);
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
