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

  if (lower.length === 3) {
    // Expand each digit: "abc" → "aabbcc"
    const expanded = lower
      .split('')
      .map((ch) => ch + ch)
      .join('');
    return `#${expanded}`;
  }

  return `#${lower}`;
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
export function swapColors(
  patches: PatchColor[],
  colorA: string,
  colorB: string
): ColorChange[] {
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
