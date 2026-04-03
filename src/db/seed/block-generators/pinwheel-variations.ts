/**
 * Pinwheel quilt block variations.
 *
 * Each block is built from Half-Square Triangles (HSTs) arranged in rotating
 * patterns within a 100x100 viewBox. Seven variation families produce 60+
 * unique blocks across eight colour palettes.
 */

import type { BlockDefinition } from '../blockDefinitions';
import { svgWrap, rect, polygon, block, hst, PALETTES, type PaletteName } from './utils';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const paletteNames = Object.keys(PALETTES) as PaletteName[];

/**
 * Classic pinwheel: four HSTs whose "coloured" triangles chase each other
 * around the centre, creating a spinning look.
 *
 * Layout (each quadrant is 50x50):
 *   TL: top-left triangle coloured   → diagonal runs ↘
 *   TR: bottom-left triangle coloured → diagonal runs ↗  (mirrored)
 *   BL: bottom-right triangle coloured → diagonal runs ↙  (mirrored)
 *   BR: top-right triangle coloured   → diagonal runs ↘
 *
 * The key to a pinwheel is that each quadrant's coloured triangle points
 * toward the centre, cycling clockwise (or counter-clockwise).
 */
function classicPinwheel(primary: string, bg: string): string {
  // Top-left quadrant: coloured triangle top-left
  const tl = hst(0, 0, 50, 50, primary, bg);
  // Top-right quadrant: coloured triangle bottom-right  → spins clockwise
  const tr = hst(50, 0, 50, 50, bg, primary);
  // Bottom-left quadrant: coloured triangle bottom-right
  const bl = hst(0, 50, 50, 50, bg, primary);
  // Bottom-right quadrant: coloured triangle top-left
  const br = hst(50, 50, 50, 50, primary, bg);

  return tl + tr + bl + br;
}

/**
 * Counter-clockwise version — swap the coloured corners.
 */
function classicPinwheelCCW(primary: string, bg: string): string {
  const tl = hst(0, 0, 50, 50, bg, primary);
  const tr = hst(50, 0, 50, 50, primary, bg);
  const bl = hst(0, 50, 50, 50, primary, bg);
  const br = hst(50, 50, 50, 50, bg, primary);

  return tl + tr + bl + br;
}

// ---------------------------------------------------------------------------
// 1. Classic Pinwheel  (8 CW + 8 CCW = 16)
// ---------------------------------------------------------------------------

function generateClassicPinwheels(): BlockDefinition[] {
  const blocks: BlockDefinition[] = [];

  for (const name of paletteNames) {
    const p = PALETTES[name];

    blocks.push(
      block(`Classic Pinwheel (${name})`, 'Pinwheels', classicPinwheel(p.primary, p.bg), [
        'pinwheel',
        'classic',
        'traditional',
        name,
      ])
    );

    blocks.push(
      block(`Classic Pinwheel CCW (${name})`, 'Pinwheels', classicPinwheelCCW(p.primary, p.bg), [
        'pinwheel',
        'classic',
        'counter-clockwise',
        name,
      ])
    );
  }

  return blocks;
}

// ---------------------------------------------------------------------------
// 2. Double Pinwheel  (8 variations)
//    A small centre pinwheel (30x30 centred) surrounded by an outer ring
//    of HSTs that also spin, creating a nested pinwheel effect.
// ---------------------------------------------------------------------------

function doublePinwheelSvg(inner: string, outer: string, bg: string): string {
  // Outer ring: four corner HSTs filling the border area
  const outerParts =
    hst(0, 0, 50, 50, outer, bg) +
    hst(50, 0, 50, 50, bg, outer) +
    hst(0, 50, 50, 50, bg, outer) +
    hst(50, 50, 50, 50, outer, bg);

  // Inner pinwheel: centred at 50,50 — occupies 35..65 region (30x30)
  const innerParts =
    hst(35, 35, 15, 15, inner, bg) +
    hst(50, 35, 15, 15, bg, inner) +
    hst(35, 50, 15, 15, bg, inner) +
    hst(50, 50, 15, 15, inner, bg);

  return outerParts + innerParts;
}

function generateDoublePinwheels(): BlockDefinition[] {
  return paletteNames.map((name) => {
    const p = PALETTES[name];
    return block(
      `Double Pinwheel (${name})`,
      'Pinwheels',
      doublePinwheelSvg(p.accent, p.primary, p.bg),
      ['pinwheel', 'double', 'nested', name]
    );
  });
}

// ---------------------------------------------------------------------------
// 3. Broken Pinwheel  (8 variations)
//    Three quadrants match; the fourth uses the accent colour.
// ---------------------------------------------------------------------------

function brokenPinwheelSvg(primary: string, accent: string, bg: string): string {
  const tl = hst(0, 0, 50, 50, primary, bg);
  const tr = hst(50, 0, 50, 50, bg, primary);
  const bl = hst(0, 50, 50, 50, bg, primary);
  // "Broken" quadrant uses accent colour
  const br = hst(50, 50, 50, 50, accent, bg);

  return tl + tr + bl + br;
}

function generateBrokenPinwheels(): BlockDefinition[] {
  return paletteNames.map((name) => {
    const p = PALETTES[name];
    return block(
      `Broken Pinwheel (${name})`,
      'Pinwheels',
      brokenPinwheelSvg(p.primary, p.accent, p.bg),
      ['pinwheel', 'broken', 'asymmetric', name]
    );
  });
}

// ---------------------------------------------------------------------------
// 4. Whirlwind / Spinning Pinwheel  (8 variations)
//    Asymmetric HSTs: each quadrant uses a non-square rectangle so the
//    diagonal "leans", giving a stronger sense of spin / curve.
// ---------------------------------------------------------------------------

function whirlwindSvg(primary: string, secondary: string, bg: string): string {
  // Each quadrant is split into a narrow HST (emphasising spin) and a filler
  // Top-left: tall-narrow HST + background fill
  const tl = hst(0, 0, 35, 50, primary, bg) + rect(35, 0, 15, 50, bg);
  // Top-right: wide-short HST
  const tr = rect(50, 0, 15, 50, bg) + hst(65, 0, 35, 50, bg, secondary);
  // Bottom-left
  const bl = rect(0, 50, 15, 50, bg) + hst(15, 50, 35, 50, bg, secondary);
  // Bottom-right
  const br = hst(50, 50, 35, 50, primary, bg) + rect(85, 50, 15, 50, bg);

  return tl + tr + bl + br;
}

function generateWhirlwinds(): BlockDefinition[] {
  return paletteNames.map((name) => {
    const p = PALETTES[name];
    return block(
      `Whirlwind Pinwheel (${name})`,
      'Pinwheels',
      whirlwindSvg(p.primary, p.secondary, p.bg),
      ['pinwheel', 'whirlwind', 'spinning', 'asymmetric', name]
    );
  });
}

// ---------------------------------------------------------------------------
// 5. Pinwheel Star  (8 variations)
//    A centre pinwheel (using 25x25 quadrants) with star points extending
//    from the midpoints of each side towards the edges.
// ---------------------------------------------------------------------------

function pinwheelStarSvg(primary: string, accent: string, bg: string): string {
  // Background fill
  const bgRect = rect(0, 0, 100, 100, bg);

  // Centre pinwheel (25..75 region, 50x50)
  const centre =
    hst(25, 25, 25, 25, primary, bg) +
    hst(50, 25, 25, 25, bg, primary) +
    hst(25, 50, 25, 25, bg, primary) +
    hst(50, 50, 25, 25, primary, bg);

  // Star points — kite-shaped triangles extending outward from each side
  // Top point
  const topStar = polygon('50,0 25,25 75,25', accent);
  // Right point
  const rightStar = polygon('100,50 75,25 75,75', accent);
  // Bottom point
  const bottomStar = polygon('50,100 75,75 25,75', accent);
  // Left point
  const leftStar = polygon('0,50 25,75 25,25', accent);

  return bgRect + centre + topStar + rightStar + bottomStar + leftStar;
}

function generatePinwheelStars(): BlockDefinition[] {
  return paletteNames.map((name) => {
    const p = PALETTES[name];
    return block(
      `Pinwheel Star (${name})`,
      'Pinwheels',
      pinwheelStarSvg(p.primary, p.accent, p.bg),
      ['pinwheel', 'star', 'combination', name]
    );
  });
}

// ---------------------------------------------------------------------------
// 6. Large/Small Pinwheel  (8 variations)
//    A 2x2 grid of mini pinwheels — each quadrant contains its own 50x50
//    pinwheel, so the whole block has four spinning motifs.
// ---------------------------------------------------------------------------

function miniPinwheel(ox: number, oy: number, size: number, primary: string, bg: string): string {
  const half = size / 2;
  return (
    hst(ox, oy, half, half, primary, bg) +
    hst(ox + half, oy, half, half, bg, primary) +
    hst(ox, oy + half, half, half, bg, primary) +
    hst(ox + half, oy + half, half, half, primary, bg)
  );
}

function largeSmallPinwheelSvg(primary: string, secondary: string, bg: string): string {
  // Top-left and bottom-right use primary
  const tlPinwheel = miniPinwheel(0, 0, 50, primary, bg);
  const brPinwheel = miniPinwheel(50, 50, 50, primary, bg);
  // Top-right and bottom-left use secondary
  const trPinwheel = miniPinwheel(50, 0, 50, secondary, bg);
  const blPinwheel = miniPinwheel(0, 50, 50, secondary, bg);

  return tlPinwheel + trPinwheel + blPinwheel + brPinwheel;
}

function generateLargeSmallPinwheels(): BlockDefinition[] {
  return paletteNames.map((name) => {
    const p = PALETTES[name];
    return block(
      `Large/Small Pinwheel (${name})`,
      'Pinwheels',
      largeSmallPinwheelSvg(p.primary, p.secondary, p.bg),
      ['pinwheel', 'grid', 'four-patch', 'mini', name]
    );
  });
}

// ---------------------------------------------------------------------------
// 7. Offset Pinwheel  (4 variations — first 4 palettes)
//    The centre of rotation is shifted to (40, 40) creating an asymmetric
//    composition with four unequal quadrants.
// ---------------------------------------------------------------------------

function offsetPinwheelSvg(primary: string, accent: string, bg: string): string {
  const cx = 40;
  const cy = 40;

  // Top-left quadrant (smaller)
  const tl = hst(0, 0, cx, cy, primary, bg);
  // Top-right quadrant (wider)
  const tr = hst(cx, 0, 100 - cx, cy, bg, primary);
  // Bottom-left quadrant (taller)
  const bl = hst(0, cy, cx, 100 - cy, bg, accent);
  // Bottom-right quadrant (largest)
  const br = hst(cx, cy, 100 - cx, 100 - cy, accent, bg);

  return tl + tr + bl + br;
}

function generateOffsetPinwheels(): BlockDefinition[] {
  const selectedPalettes = paletteNames.slice(0, 4);

  return selectedPalettes.map((name) => {
    const p = PALETTES[name];
    return block(
      `Offset Pinwheel (${name})`,
      'Pinwheels',
      offsetPinwheelSvg(p.primary, p.accent, p.bg),
      ['pinwheel', 'offset', 'asymmetric', 'modern', name]
    );
  });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function generatePinwheelVariations(): BlockDefinition[] {
  return [
    ...generateClassicPinwheels(), // 16  (8 CW + 8 CCW)
    ...generateDoublePinwheels(), //  8
    ...generateBrokenPinwheels(), //  8
    ...generateWhirlwinds(), //  8
    ...generatePinwheelStars(), //  8
    ...generateLargeSmallPinwheels(), //  8
    ...generateOffsetPinwheels(), //  4
  ]; // Total: 60
}
