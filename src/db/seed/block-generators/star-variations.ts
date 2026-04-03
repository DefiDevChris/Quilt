/**
 * Star quilt block variation generator.
 * Produces 80+ star block definitions across 9 star types and multiple palette variations.
 */

import {
  svgWrap,
  rect,
  polygon,
  circle,
  path,
  regularPolygonPoints,
  block,
  hst,
  diamond,
  PALETTES,
  type PaletteName,
} from './utils';
import type { BlockDefinition } from '../blockDefinitions';

// ---------------------------------------------------------------------------
// Palette helpers
// ---------------------------------------------------------------------------

const ALL_PALETTES: PaletteName[] = Object.keys(PALETTES) as PaletteName[];

function pal(name: PaletteName) {
  return PALETTES[name];
}

function pick(palettes: readonly PaletteName[], count: number): PaletteName[] {
  return palettes.slice(0, count);
}

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------

/** Flying-geese unit: large triangle pointing up with two small background corner triangles. */
function flyingGeese(
  x: number,
  y: number,
  w: number,
  h: number,
  gooseFill: string,
  bgFill: string
): string {
  const midX = x + w / 2;
  return (
    polygon(`${midX},${y} ${x + w},${y + h} ${x},${y + h}`, gooseFill) +
    polygon(`${x},${y} ${midX},${y} ${x},${y + h}`, bgFill) +
    polygon(`${midX},${y} ${x + w},${y} ${x + w},${y + h}`, bgFill)
  );
}

/** Flying-geese pointing in a given direction (up, down, left, right). */
function flyingGeeseDir(
  x: number,
  y: number,
  w: number,
  h: number,
  dir: 'up' | 'down' | 'left' | 'right',
  gooseFill: string,
  bgFill: string
): string {
  const midX = x + w / 2;
  const midY = y + h / 2;
  switch (dir) {
    case 'up':
      return (
        polygon(`${midX},${y} ${x + w},${y + h} ${x},${y + h}`, gooseFill) +
        polygon(`${x},${y} ${midX},${y} ${x},${y + h}`, bgFill) +
        polygon(`${midX},${y} ${x + w},${y} ${x + w},${y + h}`, bgFill)
      );
    case 'down':
      return (
        polygon(`${x},${y} ${x + w},${y} ${midX},${y + h}`, gooseFill) +
        polygon(`${x},${y + h} ${midX},${y + h} ${x},${y}`, bgFill) +
        polygon(`${midX},${y + h} ${x + w},${y + h} ${x + w},${y}`, bgFill)
      );
    case 'left':
      return (
        polygon(`${x},${midY} ${x + w},${y} ${x + w},${y + h}`, gooseFill) +
        polygon(`${x},${y} ${x + w},${y} ${x},${midY}`, bgFill) +
        polygon(`${x},${midY} ${x + w},${y + h} ${x},${y + h}`, bgFill)
      );
    case 'right':
      return (
        polygon(`${x + w},${midY} ${x},${y} ${x},${y + h}`, gooseFill) +
        polygon(`${x + w},${y} ${x},${y} ${x + w},${midY}`, bgFill) +
        polygon(`${x + w},${midY} ${x},${y + h} ${x + w},${y + h}`, bgFill)
      );
  }
}

/** Thin diamond shape for LeMoyne-style stars: 4 points given center, half-width, half-height. */
function thinDiamond(cx: number, cy: number, hw: number, hh: number, fill: string): string {
  return polygon(`${cx},${cy - hh} ${cx + hw},${cy} ${cx},${cy + hh} ${cx - hw},${cy}`, fill);
}

/** Star polygon with n points, alternating between outer radius and inner radius. */
function starPolygonPoints(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  points: number,
  rotDeg: number = -90
): string {
  const rotRad = (rotDeg * Math.PI) / 180;
  const pts: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const angle = rotRad + (Math.PI * i) / points;
    const r = i % 2 === 0 ? outerR : innerR;
    pts.push(`${(cx + r * Math.cos(angle)).toFixed(2)},${(cy + r * Math.sin(angle)).toFixed(2)}`);
  }
  return pts.join(' ');
}

// ---------------------------------------------------------------------------
// 1. Ohio Star  (8 palette variations)
// ---------------------------------------------------------------------------

function generateOhioStars(): BlockDefinition[] {
  return pick(ALL_PALETTES, 8).map((pName) => {
    const p = pal(pName);
    const s = 100 / 3; // ~33.33 cell size
    let svg = '';

    // Background
    svg += rect(0, 0, 100, 100, p.bg);

    // Corner squares
    svg += rect(0, 0, s, s, p.bg);
    svg += rect(s * 2, 0, s, s, p.bg);
    svg += rect(0, s * 2, s, s, p.bg);
    svg += rect(s * 2, s * 2, s, s, p.bg);

    // Center square
    svg += rect(s, s, s, s, p.primary);

    // Side HST units (quarter-square triangle effect)
    // Top
    svg += hst(s, 0, s, s, p.accent, p.bg);
    // Bottom
    svg += hst(s, s * 2, s, s, p.bg, p.accent);
    // Left
    svg += hst(0, s, s, s, p.accent, p.bg);
    // Right
    svg += hst(s * 2, s, s, s, p.bg, p.accent);

    return block(
      `Ohio Star - ${pName}`,
      'Stars',
      svg,
      ['ohio star', 'traditional', 'patchwork', 'nine-patch', pName],
      'Traditional Stars'
    );
  });
}

// ---------------------------------------------------------------------------
// 2. Variable Star  (8 palette variations)
// ---------------------------------------------------------------------------

function generateVariableStars(): BlockDefinition[] {
  return pick(ALL_PALETTES, 8).map((pName) => {
    const p = pal(pName);
    // 4x4 grid proportions — center 2x2, sides 1 unit wide
    const u = 25; // unit = 25
    let svg = '';

    svg += rect(0, 0, 100, 100, p.bg);

    // Center 2x2 square
    svg += rect(u, u, u * 2, u * 2, p.primary);

    // Corner squares
    svg += rect(0, 0, u, u, p.bg);
    svg += rect(u * 3, 0, u, u, p.bg);
    svg += rect(0, u * 3, u, u, p.bg);
    svg += rect(u * 3, u * 3, u, u, p.bg);

    // Side HST pairs — top
    svg += hst(u, 0, u, u, p.accent, p.bg);
    svg += hst(u * 2, 0, u, u, p.bg, p.accent);
    // Bottom
    svg += hst(u, u * 3, u, u, p.bg, p.accent);
    svg += hst(u * 2, u * 3, u, u, p.accent, p.bg);
    // Left
    svg += hst(0, u, u, u, p.accent, p.bg);
    svg += hst(0, u * 2, u, u, p.bg, p.accent);
    // Right
    svg += hst(u * 3, u, u, u, p.bg, p.accent);
    svg += hst(u * 3, u * 2, u, u, p.accent, p.bg);

    return block(
      `Variable Star - ${pName}`,
      'Stars',
      svg,
      ['variable star', 'traditional', 'patchwork', pName],
      'Traditional Stars'
    );
  });
}

// ---------------------------------------------------------------------------
// 3. Sawtooth Star  (8 palette variations)
// ---------------------------------------------------------------------------

function generateSawtoothStars(): BlockDefinition[] {
  return pick(ALL_PALETTES, 8).map((pName) => {
    const p = pal(pName);
    const s = 100 / 3;
    let svg = '';

    svg += rect(0, 0, 100, 100, p.bg);

    // Corner squares
    svg += rect(0, 0, s, s, p.secondary);
    svg += rect(s * 2, 0, s, s, p.secondary);
    svg += rect(0, s * 2, s, s, p.secondary);
    svg += rect(s * 2, s * 2, s, s, p.secondary);

    // Center square
    svg += rect(s, s, s, s, p.primary);

    // Flying geese on each side
    svg += flyingGeeseDir(s, 0, s, s, 'down', p.accent, p.secondary);
    svg += flyingGeeseDir(s, s * 2, s, s, 'up', p.accent, p.secondary);
    svg += flyingGeeseDir(0, s, s, s, 'right', p.accent, p.secondary);
    svg += flyingGeeseDir(s * 2, s, s, s, 'left', p.accent, p.secondary);

    return block(
      `Sawtooth Star - ${pName}`,
      'Stars',
      svg,
      ['sawtooth star', 'traditional', 'flying geese', pName],
      'Traditional Stars'
    );
  });
}

// ---------------------------------------------------------------------------
// 4. LeMoyne Star / 8-Pointed Star  (4 palette variations)
// ---------------------------------------------------------------------------

function generateLeMoyneStars(): BlockDefinition[] {
  return pick(ALL_PALETTES, 4).map((pName) => {
    const p = pal(pName);
    const cx = 50;
    const cy = 50;
    const outerR = 48;
    const innerR = 20;
    let svg = '';

    // Background
    svg += rect(0, 0, 100, 100, p.bg);

    // 8 elongated diamonds radiating from center
    for (let i = 0; i < 8; i++) {
      const angle = (i * 45 * Math.PI) / 180 - Math.PI / 2;
      const nextAngle = ((i + 1) * 45 * Math.PI) / 180 - Math.PI / 2;

      // Tip of the diamond
      const tipX = cx + outerR * Math.cos(angle);
      const tipY = cy + outerR * Math.sin(angle);

      // Side points (inner radius at +/- half step)
      const leftAngle = angle - Math.PI / 8;
      const rightAngle = angle + Math.PI / 8;
      const lx = cx + innerR * Math.cos(leftAngle);
      const ly = cy + innerR * Math.sin(leftAngle);
      const rx = cx + innerR * Math.cos(rightAngle);
      const ry = cy + innerR * Math.sin(rightAngle);

      const fill = i % 2 === 0 ? p.primary : p.accent;
      svg += polygon(
        `${cx.toFixed(1)},${cy.toFixed(1)} ${lx.toFixed(1)},${ly.toFixed(1)} ${tipX.toFixed(1)},${tipY.toFixed(1)} ${rx.toFixed(1)},${ry.toFixed(1)}`,
        fill
      );
    }

    // Background corner triangles
    const corners = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ];
    for (let i = 0; i < 4; i++) {
      const a1 = (i * 90 * Math.PI) / 180 - Math.PI / 2;
      const a2 = ((i * 90 + 90) * Math.PI) / 180 - Math.PI / 2;
      const p1x = cx + outerR * Math.cos(a1);
      const p1y = cy + outerR * Math.sin(a1);
      const p2x = cx + outerR * Math.cos(a2);
      const p2y = cy + outerR * Math.sin(a2);
      svg += polygon(
        `${corners[i].x},${corners[i].y} ${p1x.toFixed(1)},${p1y.toFixed(1)} ${p2x.toFixed(1)},${p2y.toFixed(1)}`,
        p.bg
      );
    }

    // Center circle
    svg += circle(cx, cy, 8, p.secondary);

    return block(
      `LeMoyne Star - ${pName}`,
      'Stars',
      svg,
      ['lemoyne star', '8-pointed', 'traditional', 'diamonds', pName],
      'Traditional Stars'
    );
  });
}

// ---------------------------------------------------------------------------
// 5. Friendship Star  (8 palette variations)
// ---------------------------------------------------------------------------

function generateFriendshipStars(): BlockDefinition[] {
  return pick(ALL_PALETTES, 8).map((pName) => {
    const p = pal(pName);
    const s = 100 / 3;
    let svg = '';

    svg += rect(0, 0, 100, 100, p.bg);

    // Center square
    svg += rect(s, s, s, s, p.primary);

    // Side squares (solid background)
    svg += rect(s, 0, s, s, p.bg);
    svg += rect(s, s * 2, s, s, p.bg);
    svg += rect(0, s, s, s, p.bg);
    svg += rect(s * 2, s, s, s, p.bg);

    // Corner HSTs — star points radiate from corners toward center
    svg += hst(0, 0, s, s, p.bg, p.accent);
    svg += hst(s * 2, 0, s, s, p.accent, p.bg);
    svg += hst(0, s * 2, s, s, p.accent, p.bg);
    svg += hst(s * 2, s * 2, s, s, p.bg, p.accent);

    return block(
      `Friendship Star - ${pName}`,
      'Stars',
      svg,
      ['friendship star', 'traditional', 'beginner', 'nine-patch', pName],
      'Traditional Stars'
    );
  });
}

// ---------------------------------------------------------------------------
// 6. Evening Star  (4 palette variations)
// ---------------------------------------------------------------------------

function generateEveningStars(): BlockDefinition[] {
  return pick(ALL_PALETTES, 4).map((pName) => {
    const p = pal(pName);
    const s = 100 / 4;
    let svg = '';

    svg += rect(0, 0, 100, 100, p.bg);

    // Center diamond
    svg += diamond(50, 50, 50, p.primary);

    // Corner triangles pointing inward
    svg += polygon(`0,0 ${s * 2},0 0,${s * 2}`, p.secondary);
    svg += polygon(`${s * 2},0 100,0 100,${s * 2}`, p.secondary);
    svg += polygon(`100,${s * 2} 100,100 ${s * 2},100`, p.secondary);
    svg += polygon(`0,${s * 2} 0,100 ${s * 2},100`, p.secondary);

    // Small accent squares in corners
    svg += rect(0, 0, s, s, p.accent);
    svg += rect(s * 3, 0, s, s, p.accent);
    svg += rect(0, s * 3, s, s, p.accent);
    svg += rect(s * 3, s * 3, s, s, p.accent);

    // Inner star detail — small diamond
    svg += diamond(50, 50, 20, p.accent);

    return block(
      `Evening Star - ${pName}`,
      'Stars',
      svg,
      ['evening star', 'traditional', 'diamond', pName],
      'Traditional Stars'
    );
  });
}

// ---------------------------------------------------------------------------
// 7. Carpenter's Star  (4 palette variations)
// ---------------------------------------------------------------------------

function generateCarpenterStars(): BlockDefinition[] {
  return pick(ALL_PALETTES, 4).map((pName) => {
    const p = pal(pName);
    const u = 100 / 6;
    let svg = '';

    svg += rect(0, 0, 100, 100, p.bg);

    // Outer corner squares
    svg += rect(0, 0, u, u, p.secondary);
    svg += rect(u * 5, 0, u, u, p.secondary);
    svg += rect(0, u * 5, u, u, p.secondary);
    svg += rect(u * 5, u * 5, u, u, p.secondary);

    // Center square
    svg += rect(u * 2, u * 2, u * 2, u * 2, p.primary);

    // Inner star points — HSTs around center
    // Top
    svg += hst(u * 2, u, u, u, p.accent, p.bg);
    svg += hst(u * 3, u, u, u, p.bg, p.accent);
    // Bottom
    svg += hst(u * 2, u * 4, u, u, p.bg, p.accent);
    svg += hst(u * 3, u * 4, u, u, p.accent, p.bg);
    // Left
    svg += hst(u, u * 2, u, u, p.accent, p.bg);
    svg += hst(u, u * 3, u, u, p.bg, p.accent);
    // Right
    svg += hst(u * 4, u * 2, u, u, p.bg, p.accent);
    svg += hst(u * 4, u * 3, u, u, p.accent, p.bg);

    // Outer star points — larger HSTs
    // Top row
    svg += hst(u, 0, u, u, p.primary, p.bg);
    svg += hst(u * 2, 0, u * 2, u, p.accent, p.bg);
    svg += hst(u * 4, 0, u, u, p.bg, p.primary);
    // Bottom row
    svg += hst(u, u * 5, u, u, p.bg, p.primary);
    svg += hst(u * 2, u * 5, u * 2, u, p.bg, p.accent);
    svg += hst(u * 4, u * 5, u, u, p.primary, p.bg);
    // Left column
    svg += hst(0, u, u, u, p.primary, p.bg);
    svg += hst(0, u * 2, u, u * 2, p.accent, p.bg);
    svg += hst(0, u * 4, u, u, p.bg, p.primary);
    // Right column
    svg += hst(u * 5, u, u, u, p.bg, p.primary);
    svg += hst(u * 5, u * 2, u, u * 2, p.bg, p.accent);
    svg += hst(u * 5, u * 4, u, u, p.primary, p.bg);

    return block(
      `Carpenter's Star - ${pName}`,
      'Stars',
      svg,
      ['carpenters star', 'traditional', 'complex', 'ohio star variant', pName],
      'Traditional Stars'
    );
  });
}

// ---------------------------------------------------------------------------
// 8. N-Pointed Stars  (5, 6, 7, 10, 12 points — 2 each = 10)
// ---------------------------------------------------------------------------

function generateNPointedStars(): BlockDefinition[] {
  const pointCounts = [5, 6, 7, 10, 12];
  const palettePairs: [PaletteName, PaletteName][] = [
    ['warm', 'cool'],
    ['jewel', 'earth'],
    ['autumn', 'spring'],
    ['ocean', 'neutral'],
    ['warm', 'jewel'],
  ];
  const results: BlockDefinition[] = [];

  pointCounts.forEach((n, idx) => {
    const [pName1, pName2] = palettePairs[idx];

    [pName1, pName2].forEach((pName) => {
      const p = pal(pName);
      let svg = '';

      svg += rect(0, 0, 100, 100, p.bg);

      // Outer star polygon
      const outerR = 46;
      const innerR = n <= 6 ? 22 : 18;
      const starPts = starPolygonPoints(50, 50, outerR, innerR, n);
      svg += polygon(starPts, p.primary);

      // Inner accent circle
      svg += circle(50, 50, innerR * 0.6, p.accent);

      // Small center dot
      svg += circle(50, 50, 4, p.secondary);

      results.push(
        block(
          `${n}-Pointed Star - ${pName}`,
          'Stars',
          svg,
          [`${n}-pointed`, 'geometric', 'star', pName],
          'Geometric Stars'
        )
      );
    });
  });

  return results;
}

// ---------------------------------------------------------------------------
// 9. Wonky Star  (4 palette variations)
// ---------------------------------------------------------------------------

function generateWonkyStars(): BlockDefinition[] {
  // Offsets for 4 different wonky configurations
  const configs = [
    { cx: 45, cy: 42, offsets: [3, -5, 4, -3, 2, -4, 5, -2] },
    { cx: 52, cy: 55, offsets: [-4, 3, -2, 5, -3, 4, -5, 2] },
    { cx: 48, cy: 46, offsets: [5, -2, 3, -4, 6, -1, 2, -5] },
    { cx: 53, cy: 48, offsets: [-3, 4, -5, 2, -1, 6, -4, 3] },
  ];

  return pick(ALL_PALETTES, 4).map((pName, i) => {
    const p = pal(pName);
    const cfg = configs[i];
    const { cx, cy, offsets } = cfg;
    let svg = '';

    svg += rect(0, 0, 100, 100, p.bg);

    // Build an irregular star with 8 points
    const pts: string[] = [];
    for (let j = 0; j < 8; j++) {
      const baseAngle = (j * 45 * Math.PI) / 180 - Math.PI / 2;
      const isOuter = j % 2 === 0;
      const baseR = isOuter ? 44 : 18;
      const wobble = offsets[j];
      const r = baseR + wobble;
      const angleWobble = (offsets[(j + 1) % 8] * Math.PI) / 180;
      pts.push(
        `${(cx + r * Math.cos(baseAngle + angleWobble)).toFixed(1)},${(cy + r * Math.sin(baseAngle + angleWobble)).toFixed(1)}`
      );
    }
    svg += polygon(pts.join(' '), p.primary);

    // Off-center accent circle
    svg += circle(cx + 2, cy - 1, 10, p.accent);

    // Slightly asymmetric inner detail
    svg += polygon(
      `${cx},${cy - 8} ${cx + 6},${cy + 1} ${cx - 1},${cy + 7} ${cx - 7},${cy - 2}`,
      p.secondary
    );

    return block(
      `Wonky Star - ${pName}`,
      'Stars',
      svg,
      ['wonky star', 'modern', 'improv', 'asymmetric', pName],
      'Modern Stars'
    );
  });
}

// ---------------------------------------------------------------------------
// Additional variations to reach 80+ total
// ---------------------------------------------------------------------------

// 10. Spinning Star (4 variations) — rotational pinwheel-like star
function generateSpinningStars(): BlockDefinition[] {
  return pick(ALL_PALETTES, 4).map((pName) => {
    const p = pal(pName);
    let svg = '';

    svg += rect(0, 0, 100, 100, p.bg);

    // Four spinning blades
    svg += polygon('50,50 25,0 50,0', p.primary);
    svg += polygon('50,50 100,0 100,25', p.primary);
    svg += polygon('50,50 100,75 100,100', p.primary);
    svg += polygon('50,50 0,100 0,75', p.primary);

    // Complementary blades
    svg += polygon('50,50 50,0 75,0', p.accent);
    svg += polygon('50,50 100,50 100,75', p.accent);
    svg += polygon('50,50 50,100 25,100', p.accent);
    svg += polygon('50,50 0,50 0,25', p.accent);

    // Center square
    svg += rect(42, 42, 16, 16, p.secondary);

    return block(
      `Spinning Star - ${pName}`,
      'Stars',
      svg,
      ['spinning star', 'pinwheel', 'modern', pName],
      'Modern Stars'
    );
  });
}

// 11. North Star (4 variations) — compass-style star
function generateNorthStars(): BlockDefinition[] {
  return pick(ALL_PALETTES, 4).map((pName) => {
    const p = pal(pName);
    let svg = '';

    svg += rect(0, 0, 100, 100, p.bg);

    // 4 long cardinal-direction points
    svg += polygon('50,2 58,42 50,50 42,42', p.primary);
    svg += polygon('98,50 58,58 50,50 58,42', p.primary);
    svg += polygon('50,98 42,58 50,50 58,58', p.primary);
    svg += polygon('2,50 42,42 50,50 42,58', p.primary);

    // 4 short diagonal points
    svg += polygon('85,15 58,42 50,50 58,42', p.accent);
    svg += polygon('50,50 58,42 85,15 58,42', p.accent);
    // Proper diagonal points
    svg += polygon('80,20 58,42 58,50', p.accent);
    svg += polygon('80,80 58,58 50,58', p.accent);
    svg += polygon('20,80 42,58 42,50', p.accent);
    svg += polygon('20,20 42,42 50,42', p.accent);

    // Center circle
    svg += circle(50, 50, 7, p.secondary);

    return block(
      `North Star - ${pName}`,
      'Stars',
      svg,
      ['north star', 'compass', 'traditional', pName],
      'Traditional Stars'
    );
  });
}

// 12. Lone Star (4 variations) — nested 8-pointed star
function generateLoneStars(): BlockDefinition[] {
  return pick(ALL_PALETTES, 4).map((pName) => {
    const p = pal(pName);
    let svg = '';

    svg += rect(0, 0, 100, 100, p.bg);

    // Outer 8-pointed star
    const outerPts = starPolygonPoints(50, 50, 48, 28, 8);
    svg += polygon(outerPts, p.secondary);

    // Middle 8-pointed star
    const midPts = starPolygonPoints(50, 50, 36, 20, 8);
    svg += polygon(midPts, p.primary);

    // Inner 8-pointed star
    const innerPts = starPolygonPoints(50, 50, 24, 14, 8);
    svg += polygon(innerPts, p.accent);

    // Center
    svg += circle(50, 50, 6, p.bg);

    return block(
      `Lone Star - ${pName}`,
      'Stars',
      svg,
      ['lone star', 'nested', '8-pointed', 'traditional', pName],
      'Traditional Stars'
    );
  });
}

// 13. Hunter's Star (4 variations) — interlocking star and square
function generateHunterStars(): BlockDefinition[] {
  return pick(ALL_PALETTES, 4).map((pName) => {
    const p = pal(pName);
    let svg = '';

    svg += rect(0, 0, 100, 100, p.bg);

    // Diamond rotated 45 degrees fills center
    svg += diamond(50, 50, 70, p.secondary);

    // 4 HST units creating the star effect
    svg += hst(0, 0, 50, 50, p.primary, p.bg);
    svg += hst(50, 0, 50, 50, p.bg, p.primary);
    svg += hst(0, 50, 50, 50, p.bg, p.primary);
    svg += hst(50, 50, 50, 50, p.primary, p.bg);

    // Inner diamond
    svg += diamond(50, 50, 30, p.accent);

    return block(
      `Hunter's Star - ${pName}`,
      'Stars',
      svg,
      ['hunters star', 'traditional', 'interlocking', pName],
      'Traditional Stars'
    );
  });
}

// 14. Radiant Star (4 variations) — radiating point design
function generateRadiantStars(): BlockDefinition[] {
  return pick(ALL_PALETTES, 4).map((pName) => {
    const p = pal(pName);
    let svg = '';

    svg += rect(0, 0, 100, 100, p.bg);

    // 16 radiating triangular rays
    for (let i = 0; i < 16; i++) {
      const angle = (i * 22.5 * Math.PI) / 180;
      const nextAngle = ((i + 1) * 22.5 * Math.PI) / 180;
      const outerR = 48;

      const x1 = (50 + outerR * Math.cos(angle)).toFixed(1);
      const y1 = (50 + outerR * Math.sin(angle)).toFixed(1);
      const x2 = (50 + outerR * Math.cos(nextAngle)).toFixed(1);
      const y2 = (50 + outerR * Math.sin(nextAngle)).toFixed(1);

      const fill = i % 2 === 0 ? p.primary : p.accent;
      svg += polygon(`50,50 ${x1},${y1} ${x2},${y2}`, fill);
    }

    // Center circle
    svg += circle(50, 50, 10, p.secondary);
    svg += circle(50, 50, 5, p.bg);

    return block(
      `Radiant Star - ${pName}`,
      'Stars',
      svg,
      ['radiant star', 'sunburst', 'geometric', pName],
      'Geometric Stars'
    );
  });
}

// 15. Broken Star (2 variations) — expanded LeMoyne with secondary star ring
function generateBrokenStars(): BlockDefinition[] {
  return pick(ALL_PALETTES, 2).map((pName) => {
    const p = pal(pName);
    let svg = '';

    svg += rect(0, 0, 100, 100, p.bg);

    // Outer ring of 8 small diamonds
    for (let i = 0; i < 8; i++) {
      const angle = (i * 45 * Math.PI) / 180 - Math.PI / 2;
      const dx = 50 + 38 * Math.cos(angle);
      const dy = 50 + 38 * Math.sin(angle);
      svg += diamond(dx, dy, 14, p.secondary);
    }

    // Inner 8-pointed star
    const innerPts = starPolygonPoints(50, 50, 32, 16, 8);
    svg += polygon(innerPts, p.primary);

    // Core 8-pointed star
    const corePts = starPolygonPoints(50, 50, 20, 10, 8);
    svg += polygon(corePts, p.accent);

    // Center
    svg += circle(50, 50, 5, p.bg);

    return block(
      `Broken Star - ${pName}`,
      'Stars',
      svg,
      ['broken star', 'traditional', 'complex', 'lemoyne variant', pName],
      'Traditional Stars'
    );
  });
}

// 16. Star of Bethlehem (2 variations) — multi-layered radiating star
function generateBethlehemStars(): BlockDefinition[] {
  return pick(ALL_PALETTES, 2).map((pName) => {
    const p = pal(pName);
    let svg = '';

    svg += rect(0, 0, 100, 100, p.bg);

    // 8 large diamonds radiating outward
    for (let i = 0; i < 8; i++) {
      const angle = (i * 45 * Math.PI) / 180 - Math.PI / 2;
      const tipR = 48;
      const baseR = 12;
      const spread = 8;

      const tipX = 50 + tipR * Math.cos(angle);
      const tipY = 50 + tipR * Math.sin(angle);
      const baseX = 50 + baseR * Math.cos(angle);
      const baseY = 50 + baseR * Math.sin(angle);
      const perpAngle = angle + Math.PI / 2;
      const lx = baseX + spread * Math.cos(perpAngle);
      const ly = baseY + spread * Math.sin(perpAngle);
      const rx = baseX - spread * Math.cos(perpAngle);
      const ry = baseY - spread * Math.sin(perpAngle);

      const fill = i % 2 === 0 ? p.primary : p.accent;
      svg += polygon(
        `50,50 ${lx.toFixed(1)},${ly.toFixed(1)} ${tipX.toFixed(1)},${tipY.toFixed(1)} ${rx.toFixed(1)},${ry.toFixed(1)}`,
        fill
      );
    }

    // Background squares in the 4 corners
    svg += polygon('0,0 20,0 0,20', p.bg);
    svg += polygon('80,0 100,0 100,20', p.bg);
    svg += polygon('0,80 0,100 20,100', p.bg);
    svg += polygon('80,100 100,100 100,80', p.bg);

    // Center detail
    svg += circle(50, 50, 10, p.secondary);
    svg += circle(50, 50, 5, p.bg);

    return block(
      `Star of Bethlehem - ${pName}`,
      'Stars',
      svg,
      ['star of bethlehem', 'traditional', 'radiating', 'complex', pName],
      'Traditional Stars'
    );
  });
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function generateStarVariations(): BlockDefinition[] {
  return [
    ...generateOhioStars(), // 8
    ...generateVariableStars(), // 8
    ...generateSawtoothStars(), // 8
    ...generateLeMoyneStars(), // 4
    ...generateFriendshipStars(), // 8
    ...generateEveningStars(), // 4
    ...generateCarpenterStars(), // 4
    ...generateNPointedStars(), // 10
    ...generateWonkyStars(), // 4
    ...generateSpinningStars(), // 4
    ...generateNorthStars(), // 4
    ...generateLoneStars(), // 4
    ...generateRadiantStars(), // 4
    ...generateHunterStars(), // 4
    ...generateBrokenStars(), // 2
    ...generateBethlehemStars(), // 2
  ]; // Total: 82
}
