/**
 * Log Cabin quilt block variations.
 *
 * Generates 64 block definitions across six variation families:
 *   - Courthouse Steps (16)
 *   - Pineapple Block (8)
 *   - Off-Center Log Cabin (8)
 *   - Spiral Log Cabin (8)
 *   - Half Log Cabin (8)
 *   - Log Cabin Round Sizes (16)
 */

import type { BlockDefinition } from '../blockDefinitions';
import { svgWrap, rect, polygon, block, PALETTES, type PaletteName } from './utils';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const paletteNames = Object.keys(PALETTES) as PaletteName[];

/** Return an array of colors alternating light/dark from a palette. */
function stripColors(palette: PaletteName, count: number): string[] {
  const p = PALETTES[palette];
  const lights = [p.bg, p.secondary];
  const darks = [p.primary, p.accent];
  const colors: string[] = [];
  for (let i = 0; i < count; i++) {
    colors.push(i % 2 === 0 ? darks[i % darks.length] : lights[i % lights.length]);
  }
  return colors;
}

/* ------------------------------------------------------------------ */
/*  1. Courthouse Steps                                                */
/*     Strips added symmetrically: top+bottom, then left+right.        */
/*     8 palettes × 2 round counts (3, 4) = 16 blocks                 */
/* ------------------------------------------------------------------ */

function courthouseStepsSvg(palette: PaletteName, rounds: number): string {
  const p = PALETTES[palette];
  const totalStrips = rounds * 2; // each round adds 2 pairs
  const stripWidth = 50 / (totalStrips + 1); // half-side divided among strips + center
  const centerSize = stripWidth * 2;
  const centerOffset = 50 - centerSize / 2;

  let svg = rect(centerOffset, centerOffset, centerSize, centerSize, p.accent);

  let x = centerOffset;
  let y = centerOffset;
  let w = centerSize;
  let h = centerSize;

  const colors = stripColors(palette, rounds * 2);

  for (let r = 0; r < rounds; r++) {
    const cTop = colors[r * 2];
    const cSide = colors[r * 2 + 1];

    // top strip
    y -= stripWidth;
    h += stripWidth;
    svg += rect(x, y, w, stripWidth, cTop);

    // bottom strip
    h += stripWidth;
    svg += rect(x, y + h - stripWidth, w, stripWidth, cTop);

    // left strip
    x -= stripWidth;
    w += stripWidth;
    svg += rect(x, y, stripWidth, h, cSide);

    // right strip
    w += stripWidth;
    svg += rect(x + w - stripWidth, y, stripWidth, h, cSide);
  }

  return svg;
}

function generateCourthouseSteps(): BlockDefinition[] {
  const blocks: BlockDefinition[] = [];
  const roundCounts = [3, 4];

  for (const palette of paletteNames) {
    for (const rounds of roundCounts) {
      const label = palette.charAt(0).toUpperCase() + palette.slice(1);
      blocks.push(
        block(
          `Courthouse Steps - ${label} ${rounds}-Round`,
          'Log Cabin',
          courthouseStepsSvg(palette, rounds),
          ['log-cabin', 'strips', 'courthouse-steps', 'symmetric', palette],
          'Courthouse Steps'
        )
      );
    }
  }

  return blocks;
}

/* ------------------------------------------------------------------ */
/*  2. Pineapple Block                                                 */
/*     Log cabin with corner triangles at each round. 8 variations.    */
/* ------------------------------------------------------------------ */

function pineappleSvg(palette: PaletteName): string {
  const p = PALETTES[palette];
  const rounds = 4;
  const stripWidth = 50 / (rounds + 1);
  const centerSize = stripWidth * 2;
  const centerOffset = 50 - centerSize / 2;

  let svg = rect(centerOffset, centerOffset, centerSize, centerSize, p.accent);

  let x = centerOffset;
  let y = centerOffset;
  let w = centerSize;
  let h = centerSize;

  const colors = stripColors(palette, rounds);

  for (let r = 0; r < rounds; r++) {
    const c = colors[r];
    const triColor = r % 2 === 0 ? p.secondary : p.primary;

    // right strip
    w += stripWidth;
    svg += rect(x + w - stripWidth, y, stripWidth, h, c);

    // top strip
    y -= stripWidth;
    h += stripWidth;
    svg += rect(x, y, w, stripWidth, c);

    // left strip
    x -= stripWidth;
    w += stripWidth;
    svg += rect(x, y, stripWidth, h, c);

    // bottom strip
    h += stripWidth;
    svg += rect(x, y + h - stripWidth, w, stripWidth, c);

    // corner triangles
    const triSize = stripWidth;
    // top-left
    svg += polygon(`${x},${y} ${x + triSize},${y} ${x},${y + triSize}`, triColor);
    // top-right
    svg += polygon(`${x + w},${y} ${x + w - triSize},${y} ${x + w},${y + triSize}`, triColor);
    // bottom-left
    svg += polygon(`${x},${y + h} ${x + triSize},${y + h} ${x},${y + h - triSize}`, triColor);
    // bottom-right
    svg += polygon(
      `${x + w},${y + h} ${x + w - triSize},${y + h} ${x + w},${y + h - triSize}`,
      triColor
    );
  }

  return svg;
}

function generatePineapple(): BlockDefinition[] {
  return paletteNames.map((palette) => {
    const label = palette.charAt(0).toUpperCase() + palette.slice(1);
    return block(
      `Pineapple Block - ${label}`,
      'Log Cabin',
      pineappleSvg(palette),
      ['log-cabin', 'strips', 'pineapple', 'corner-triangles', palette],
      'Pineapple'
    );
  });
}

/* ------------------------------------------------------------------ */
/*  3. Off-Center Log Cabin                                            */
/*     Center square offset to top-left corner, strips on 2 sides.     */
/*     8 palette variations.                                           */
/* ------------------------------------------------------------------ */

function offCenterSvg(palette: PaletteName): string {
  const p = PALETTES[palette];
  const rounds = 5;
  const centerSize = 100 / (rounds + 1);

  let svg = rect(0, 0, centerSize, centerSize, p.accent);

  let w = centerSize;
  let h = centerSize;

  const colors = stripColors(palette, rounds);

  for (let r = 0; r < rounds; r++) {
    const c = colors[r];
    const stripW = centerSize;

    // bottom strip (full width so far)
    svg += rect(0, h, w, stripW, c);
    h += stripW;

    // right strip (full height including the new bottom)
    svg += rect(w, 0, stripW, h, c);
    w += stripW;
  }

  return svg;
}

function generateOffCenter(): BlockDefinition[] {
  return paletteNames.map((palette) => {
    const label = palette.charAt(0).toUpperCase() + palette.slice(1);
    return block(
      `Off-Center Log Cabin - ${label}`,
      'Log Cabin',
      offCenterSvg(palette),
      ['log-cabin', 'strips', 'off-center', 'asymmetric', palette],
      'Off-Center'
    );
  });
}

/* ------------------------------------------------------------------ */
/*  4. Spiral Log Cabin                                                */
/*     Standard log cabin with spiral color arrangement—each spiral     */
/*     arm gets one color. 8 palette variations.                       */
/* ------------------------------------------------------------------ */

function spiralSvg(palette: PaletteName): string {
  const p = PALETTES[palette];
  const rounds = 4;
  const stripWidth = 50 / (rounds * 2 + 1);
  const centerSize = stripWidth * 2;
  const centerOffset = 50 - centerSize / 2;

  let svg = rect(centerOffset, centerOffset, centerSize, centerSize, p.accent);

  let x = centerOffset;
  let y = centerOffset;
  let w = centerSize;
  let h = centerSize;

  // Four arm colors: right, top, left, bottom
  const armColors = [p.primary, p.secondary, p.bg, p.accent];

  for (let r = 0; r < rounds; r++) {
    // right strip
    w += stripWidth;
    svg += rect(x + w - stripWidth, y, stripWidth, h, armColors[0]);

    // top strip
    y -= stripWidth;
    h += stripWidth;
    svg += rect(x, y, w, stripWidth, armColors[1]);

    // left strip
    x -= stripWidth;
    w += stripWidth;
    svg += rect(x, y, stripWidth, h, armColors[2]);

    // bottom strip
    h += stripWidth;
    svg += rect(x, y + h - stripWidth, w, stripWidth, armColors[3]);
  }

  return svg;
}

function generateSpiral(): BlockDefinition[] {
  return paletteNames.map((palette) => {
    const label = palette.charAt(0).toUpperCase() + palette.slice(1);
    return block(
      `Spiral Log Cabin - ${label}`,
      'Log Cabin',
      spiralSvg(palette),
      ['log-cabin', 'strips', 'spiral', 'color-arm', palette],
      'Spiral'
    );
  });
}

/* ------------------------------------------------------------------ */
/*  5. Half Log Cabin                                                  */
/*     Strips on only two adjacent sides (L-shape). 8 variations.      */
/* ------------------------------------------------------------------ */

function halfLogCabinSvg(palette: PaletteName): string {
  const p = PALETTES[palette];
  const rounds = 5;
  const centerSize = 100 / (rounds + 1);

  // Center sits at bottom-left
  const startX = 0;
  const startY = 100 - centerSize;

  let svg = rect(startX, startY, centerSize, centerSize, p.accent);

  let w = centerSize;
  let y = startY;
  let h = centerSize;

  const colors = stripColors(palette, rounds);

  for (let r = 0; r < rounds; r++) {
    const c = colors[r];
    const stripW = centerSize;

    // top strip (across current width)
    y -= stripW;
    h += stripW;
    svg += rect(0, y, w, stripW, c);

    // right strip (full new height)
    svg += rect(w, y, stripW, h, c);
    w += stripW;
  }

  return svg;
}

function generateHalfLogCabin(): BlockDefinition[] {
  return paletteNames.map((palette) => {
    const label = palette.charAt(0).toUpperCase() + palette.slice(1);
    return block(
      `Half Log Cabin - ${label}`,
      'Log Cabin',
      halfLogCabinSvg(palette),
      ['log-cabin', 'strips', 'half', 'l-shape', palette],
      'Half Log Cabin'
    );
  });
}

/* ------------------------------------------------------------------ */
/*  6. Log Cabin Round Sizes                                           */
/*     Standard log cabin with 2, 3, 4, 5 rounds.                     */
/*     4 palettes × 4 round counts = 16 blocks                        */
/* ------------------------------------------------------------------ */

function standardLogCabinSvg(palette: PaletteName, rounds: number): string {
  const p = PALETTES[palette];
  const stripWidth = 50 / (rounds * 2 + 1);
  const centerSize = stripWidth * 2;
  const centerOffset = 50 - centerSize / 2;

  let svg = rect(centerOffset, centerOffset, centerSize, centerSize, p.accent);

  let x = centerOffset;
  let y = centerOffset;
  let w = centerSize;
  let h = centerSize;

  const colors = stripColors(palette, rounds * 4);

  for (let r = 0; r < rounds; r++) {
    const baseIdx = r * 4;

    // right strip
    w += stripWidth;
    svg += rect(x + w - stripWidth, y, stripWidth, h, colors[baseIdx]);

    // top strip
    y -= stripWidth;
    h += stripWidth;
    svg += rect(x, y, w, stripWidth, colors[baseIdx + 1]);

    // left strip
    x -= stripWidth;
    w += stripWidth;
    svg += rect(x, y, stripWidth, h, colors[baseIdx + 2]);

    // bottom strip
    h += stripWidth;
    svg += rect(x, y + h - stripWidth, w, stripWidth, colors[baseIdx + 3]);
  }

  return svg;
}

function generateLogCabinRounds(): BlockDefinition[] {
  const blocks: BlockDefinition[] = [];
  const roundCounts = [2, 3, 4, 5];
  // Use 4 palettes to get 16 total
  const selectedPalettes: PaletteName[] = ['warm', 'cool', 'earth', 'jewel'];

  for (const palette of selectedPalettes) {
    for (const rounds of roundCounts) {
      const label = palette.charAt(0).toUpperCase() + palette.slice(1);
      blocks.push(
        block(
          `Log Cabin ${rounds}-Round - ${label}`,
          'Log Cabin',
          standardLogCabinSvg(palette, rounds),
          ['log-cabin', 'strips', 'standard', `${rounds}-round`, palette],
          'Standard'
        )
      );
    }
  }

  return blocks;
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

export function generateLogCabinVariations(): BlockDefinition[] {
  return [
    ...generateCourthouseSteps(),
    ...generatePineapple(),
    ...generateOffCenter(),
    ...generateSpiral(),
    ...generateHalfLogCabin(),
    ...generateLogCabinRounds(),
  ];
}
