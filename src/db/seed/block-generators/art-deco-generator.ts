/**
 * Art Deco block generator.
 * Generates 60+ blocks with bold geometric Art Deco motifs.
 */

import type { BlockDefinition } from '../blockDefinitions';
import {
  svgWrap,
  rect,
  polygon,
  circle,
  path,
  regularPolygonPoints,
  arcPath,
  block,
  hst,
  diamond,
  PALETTES,
} from './utils';

type Palette = (typeof PALETTES)[keyof typeof PALETTES];

// ---------------------------------------------------------------------------
// Fan / Grandmother's Fan helpers
// ---------------------------------------------------------------------------

function fanSegment(
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  startDeg: number,
  endDeg: number,
  fill: string
): string {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const ix1 = cx + innerR * Math.cos(toRad(startDeg));
  const iy1 = cy + innerR * Math.sin(toRad(startDeg));
  const ix2 = cx + innerR * Math.cos(toRad(endDeg));
  const iy2 = cy + innerR * Math.sin(toRad(endDeg));
  const ox1 = cx + outerR * Math.cos(toRad(startDeg));
  const oy1 = cy + outerR * Math.sin(toRad(startDeg));
  const ox2 = cx + outerR * Math.cos(toRad(endDeg));
  const oy2 = cy + outerR * Math.sin(toRad(endDeg));
  const sweep = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
  return `<path d="M ${ix1} ${iy1} L ${ox1} ${oy1} A ${outerR} ${outerR} 0 ${sweep} 1 ${ox2} ${oy2} L ${ix2} ${iy2} A ${innerR} ${innerR} 0 ${sweep} 0 ${ix1} ${iy1} Z" fill="${fill}" stroke="#333" stroke-width="0.5"/>`;
}

function generateFanBlocks(): BlockDefinition[] {
  const blocks: BlockDefinition[] = [];
  const palettes: [string, Palette][] = [
    ['warm', PALETTES.warm],
    ['cool', PALETTES.cool],
    ['jewel', PALETTES.jewel],
    ['autumn', PALETTES.autumn],
    ['earth', PALETTES.earth],
    ['ocean', PALETTES.ocean],
  ];
  const segmentCounts = [3, 4, 5, 6];

  for (const [palName, pal] of palettes) {
    const segments =
      segmentCounts[palettes.indexOf([palName, pal]) % segmentCounts.length] ||
      segmentCounts[blocks.length % segmentCounts.length];
    const segCount = segmentCounts[blocks.length % segmentCounts.length];
    const cx = 0;
    const cy = 100;
    const innerR = 10;
    const outerR = 95;
    const totalAngle = 90;
    const segAngle = totalAngle / segCount;
    const startAngle = -90;

    let svg = rect(0, 0, 100, 100, pal.bg);
    svg += circle(cx, cy, innerR, pal.accent);

    const fills = [pal.primary, pal.secondary, pal.accent, pal.bg];
    for (let i = 0; i < segCount; i++) {
      const sDeg = startAngle + i * segAngle;
      const eDeg = sDeg + segAngle;
      svg += fanSegment(cx, cy, innerR, outerR, sDeg, eDeg, fills[i % fills.length]);
    }

    blocks.push(
      block(
        `Grandmother's Fan ${segCount}-Segment (${palName})`,
        'Art Deco',
        svg,
        ['fan', 'grandmother', 'art-deco', 'quarter-circle'],
        'Fan'
      )
    );
  }

  // Additional fan variations with reversed colors and different origins
  for (const [palName, pal] of palettes.slice(0, 6)) {
    const segCount = segmentCounts[(blocks.length + 2) % segmentCounts.length];
    const cx = 100;
    const cy = 100;
    const innerR = 12;
    const outerR = 90;
    const totalAngle = 90;
    const segAngle = totalAngle / segCount;
    const startAngle = -180;

    let svg = rect(0, 0, 100, 100, pal.bg);
    svg += circle(cx, cy, innerR, pal.primary);

    const fills = [pal.accent, pal.primary, pal.secondary, pal.bg];
    for (let i = 0; i < segCount; i++) {
      const sDeg = startAngle + i * segAngle;
      const eDeg = sDeg + segAngle;
      svg += fanSegment(cx, cy, innerR, outerR, sDeg, eDeg, fills[i % fills.length]);
    }

    blocks.push(
      block(
        `Art Deco Fan ${segCount}-Segment (${palName})`,
        'Art Deco',
        svg,
        ['fan', 'art-deco', 'quarter-circle', 'geometric'],
        'Fan'
      )
    );
  }

  return blocks;
}

// ---------------------------------------------------------------------------
// Sunburst / Sunrise
// ---------------------------------------------------------------------------

function generateSunburstBlocks(): BlockDefinition[] {
  const blocks: BlockDefinition[] = [];
  const palettes: [string, Palette][] = [
    ['warm', PALETTES.warm],
    ['cool', PALETTES.cool],
    ['jewel', PALETTES.jewel],
    ['autumn', PALETTES.autumn],
    ['earth', PALETTES.earth],
    ['spring', PALETTES.spring],
    ['ocean', PALETTES.ocean],
    ['neutral', PALETTES.neutral],
  ];

  // Radiating from bottom-center
  for (const [palName, pal] of palettes.slice(0, 5)) {
    const rayCount = 8 + (blocks.length % 5) * 2;
    const cx = 50;
    const cy = 100;
    let svg = rect(0, 0, 100, 100, pal.bg);

    const angleSpan = 180;
    const rayAngle = angleSpan / rayCount;
    const fills = [pal.primary, pal.secondary];

    for (let i = 0; i < rayCount; i++) {
      const startDeg = -180 + i * rayAngle;
      const endDeg = startDeg + rayAngle;
      const toRad = (d: number) => (d * Math.PI) / 180;
      const x1 = cx + 110 * Math.cos(toRad(startDeg));
      const y1 = cy + 110 * Math.sin(toRad(startDeg));
      const x2 = cx + 110 * Math.cos(toRad(endDeg));
      const y2 = cy + 110 * Math.sin(toRad(endDeg));
      svg += polygon(`${cx},${cy} ${x1},${y1} ${x2},${y2}`, fills[i % 2]);
    }

    blocks.push(
      block(
        `Sunburst ${rayCount}-Ray (${palName})`,
        'Art Deco',
        svg,
        ['sunburst', 'sunrise', 'rays', 'art-deco'],
        'Sunburst'
      )
    );
  }

  // Sunrise with semicircle base
  for (const [palName, pal] of palettes.slice(0, 5)) {
    const rayCount = 10;
    const cx = 50;
    const cy = 70;
    let svg = rect(0, 0, 100, 100, pal.bg);
    svg += rect(0, 70, 100, 30, pal.secondary);

    const fills = [pal.primary, pal.accent];
    for (let i = 0; i < rayCount; i++) {
      const startDeg = -180 + (i * 180) / rayCount;
      const endDeg = startDeg + 180 / rayCount;
      const toRad = (d: number) => (d * Math.PI) / 180;
      const x1 = cx + 70 * Math.cos(toRad(startDeg));
      const y1 = cy + 70 * Math.sin(toRad(startDeg));
      const x2 = cx + 70 * Math.cos(toRad(endDeg));
      const y2 = cy + 70 * Math.sin(toRad(endDeg));
      svg += polygon(`${cx},${cy} ${x1},${y1} ${x2},${y2}`, fills[i % 2]);
    }

    svg += `<path d="${arcPath(cx, cy, 18, -180, 0)} Z" fill="${pal.accent}" stroke="#333" stroke-width="0.5"/>`;

    blocks.push(
      block(
        `Sunrise (${palName})`,
        'Art Deco',
        svg,
        ['sunrise', 'sunburst', 'semicircle', 'art-deco'],
        'Sunburst'
      )
    );
  }

  return blocks;
}

// ---------------------------------------------------------------------------
// Chevron / Zigzag
// ---------------------------------------------------------------------------

function generateChevronBlocks(): BlockDefinition[] {
  const blocks: BlockDefinition[] = [];
  const palettes: [string, Palette][] = [
    ['warm', PALETTES.warm],
    ['cool', PALETTES.cool],
    ['jewel', PALETTES.jewel],
    ['autumn', PALETTES.autumn],
    ['earth', PALETTES.earth],
    ['spring', PALETTES.spring],
    ['ocean', PALETTES.ocean],
    ['neutral', PALETTES.neutral],
  ];

  // Horizontal chevrons
  for (const [palName, pal] of palettes.slice(0, 5)) {
    const bandCount = 4 + (blocks.length % 3);
    const bandH = 100 / bandCount;
    let svg = rect(0, 0, 100, 100, pal.bg);
    const fills = [pal.primary, pal.secondary, pal.accent];

    for (let i = 0; i < bandCount; i++) {
      const y = i * bandH;
      const mid = y + bandH / 2;
      svg += polygon(
        `0,${y} 50,${mid} 100,${y} 100,${y + bandH} 50,${mid + bandH / 2 > 100 ? 100 : mid + bandH / 2} 0,${y + bandH}`,
        fills[i % fills.length]
      );
    }

    blocks.push(
      block(
        `Chevron ${bandCount}-Band (${palName})`,
        'Art Deco',
        svg,
        ['chevron', 'zigzag', 'v-shape', 'art-deco'],
        'Chevron'
      )
    );
  }

  // Vertical zigzag stripes
  for (const [palName, pal] of palettes.slice(0, 5)) {
    const stripeW = 20;
    const stripeCount = 5;
    const amplitude = 10;
    let svg = rect(0, 0, 100, 100, pal.bg);
    const fills = [pal.primary, pal.secondary, pal.accent];

    for (let i = 0; i < stripeCount; i++) {
      const x = i * stripeW;
      const zigPoints: string[] = [];
      const zagPoints: string[] = [];

      for (let y = 0; y <= 100; y += 20) {
        const offset = (y / 20) % 2 === 0 ? 0 : amplitude;
        zigPoints.push(`${x + offset},${y}`);
        zagPoints.push(`${x + stripeW + offset},${y}`);
      }

      const allPoints = [...zigPoints, ...zagPoints.reverse()].join(' ');
      svg += polygon(allPoints, fills[i % fills.length]);
    }

    blocks.push(
      block(
        `Zigzag Stripe (${palName})`,
        'Art Deco',
        svg,
        ['zigzag', 'chevron', 'stripe', 'art-deco'],
        'Chevron'
      )
    );
  }

  return blocks;
}

// ---------------------------------------------------------------------------
// Art Deco Geometric (stepped / ziggurat)
// ---------------------------------------------------------------------------

function generateGeometricBlocks(): BlockDefinition[] {
  const blocks: BlockDefinition[] = [];
  const palettes: [string, Palette][] = [
    ['warm', PALETTES.warm],
    ['cool', PALETTES.cool],
    ['jewel', PALETTES.jewel],
    ['autumn', PALETTES.autumn],
    ['earth', PALETTES.earth],
    ['spring', PALETTES.spring],
    ['ocean', PALETTES.ocean],
    ['neutral', PALETTES.neutral],
  ];

  // Ziggurat / stepped pyramid
  for (const [palName, pal] of palettes.slice(0, 5)) {
    const steps = 5;
    let svg = rect(0, 0, 100, 100, pal.bg);
    const fills = [pal.primary, pal.secondary, pal.accent];

    for (let i = 0; i < steps; i++) {
      const inset = i * 10;
      const y = 100 - (i + 1) * (100 / steps);
      const w = 100 - 2 * inset;
      const h = 100 / steps;
      svg += rect(inset, y, w, h, fills[i % fills.length]);
    }

    blocks.push(
      block(
        `Ziggurat (${palName})`,
        'Art Deco',
        svg,
        ['ziggurat', 'stepped', 'pyramid', 'art-deco', 'geometric'],
        'Geometric'
      )
    );
  }

  // Cascading rectangles
  for (const [palName, pal] of palettes.slice(0, 5)) {
    let svg = rect(0, 0, 100, 100, pal.bg);
    const fills = [pal.primary, pal.secondary, pal.accent, pal.bg];

    for (let i = 0; i < 6; i++) {
      const x = 5 + i * 8;
      const y = 5 + i * 8;
      const w = 90 - i * 16;
      const h = 90 - i * 16;
      if (w > 0 && h > 0) {
        svg += rect(x, y, w, h, fills[i % fills.length]);
      }
    }

    blocks.push(
      block(
        `Cascading Rectangles (${palName})`,
        'Art Deco',
        svg,
        ['cascade', 'rectangles', 'concentric', 'art-deco', 'geometric'],
        'Geometric'
      )
    );
  }

  return blocks;
}

// ---------------------------------------------------------------------------
// Scallop / Clamshell
// ---------------------------------------------------------------------------

function generateScallopBlocks(): BlockDefinition[] {
  const blocks: BlockDefinition[] = [];
  const palettes: [string, Palette][] = [
    ['warm', PALETTES.warm],
    ['cool', PALETTES.cool],
    ['jewel', PALETTES.jewel],
    ['autumn', PALETTES.autumn],
    ['earth', PALETTES.earth],
    ['spring', PALETTES.spring],
    ['ocean', PALETTES.ocean],
    ['neutral', PALETTES.neutral],
  ];

  for (const [palName, pal] of palettes) {
    const r = 16;
    const cols = 4;
    const rows = 4;
    const dx = 100 / cols;
    const dy = r;
    let svg = rect(0, 0, 100, 100, pal.bg);
    const fills = [pal.primary, pal.secondary, pal.accent];

    for (let row = 0; row < rows; row++) {
      const offsetX = row % 2 === 0 ? 0 : dx / 2;
      for (let col = -1; col <= cols; col++) {
        const cx = col * dx + dx / 2 + offsetX;
        const cy = row * dy * 2 + dy;
        svg += `<path d="${arcPath(cx, cy, r, -180, 0)} Z" fill="${fills[(row + col) % fills.length]}" stroke="#333" stroke-width="0.5"/>`;
      }
    }

    blocks.push(
      block(
        `Clamshell (${palName})`,
        'Art Deco',
        svg,
        ['scallop', 'clamshell', 'arc', 'art-deco'],
        'Scallop'
      )
    );
  }

  return blocks;
}

// ---------------------------------------------------------------------------
// Spiderweb (concentric polygons)
// ---------------------------------------------------------------------------

function generateSpiderwebBlocks(): BlockDefinition[] {
  const blocks: BlockDefinition[] = [];
  const palettes: [string, Palette][] = [
    ['warm', PALETTES.warm],
    ['cool', PALETTES.cool],
    ['jewel', PALETTES.jewel],
    ['autumn', PALETTES.autumn],
    ['earth', PALETTES.earth],
  ];

  for (const [palName, pal] of palettes) {
    const sides = 8;
    const layers = 5;
    const cx = 50;
    const cy = 50;
    let svg = rect(0, 0, 100, 100, pal.bg);
    const fills = [pal.primary, pal.secondary, pal.accent, pal.bg, pal.primary];

    // Draw from outermost to innermost so inner covers outer
    for (let i = 0; i < layers; i++) {
      const r = 48 - i * 9;
      if (r > 0) {
        svg += polygon(
          regularPolygonPoints(cx, cy, r, sides, -90 + i * 5),
          fills[i % fills.length]
        );
      }
    }

    // Radial lines
    for (let i = 0; i < sides; i++) {
      const angle = (-90 + (360 / sides) * i) * (Math.PI / 180);
      const x2 = cx + 48 * Math.cos(angle);
      const y2 = cy + 48 * Math.sin(angle);
      svg += `<line x1="${cx}" y1="${cy}" x2="${x2}" y2="${y2}" stroke="#333" stroke-width="0.5"/>`;
    }

    blocks.push(
      block(
        `Spiderweb (${palName})`,
        'Art Deco',
        svg,
        ['spiderweb', 'concentric', 'octagon', 'art-deco', 'geometric'],
        'Spiderweb'
      )
    );
  }

  return blocks;
}

// ---------------------------------------------------------------------------
// Compass Rose
// ---------------------------------------------------------------------------

function generateCompassRoseBlocks(): BlockDefinition[] {
  const blocks: BlockDefinition[] = [];
  const palettes: [string, Palette][] = [
    ['warm', PALETTES.warm],
    ['cool', PALETTES.cool],
    ['jewel', PALETTES.jewel],
    ['autumn', PALETTES.autumn],
    ['earth', PALETTES.earth],
  ];

  // 4-pointed compass rose
  for (const [palName, pal] of palettes.slice(0, 3)) {
    const cx = 50;
    const cy = 50;
    const outerR = 46;
    const innerR = 16;
    let svg = rect(0, 0, 100, 100, pal.bg);
    svg += circle(cx, cy, outerR + 2, pal.secondary);

    const directions = [
      { angle: -90, fill: pal.primary },
      { angle: 0, fill: pal.accent },
      { angle: 90, fill: pal.primary },
      { angle: 180, fill: pal.accent },
    ];

    for (const dir of directions) {
      const rad = (dir.angle * Math.PI) / 180;
      const tipX = cx + outerR * Math.cos(rad);
      const tipY = cy + outerR * Math.sin(rad);
      const leftRad = ((dir.angle - 90) * Math.PI) / 180;
      const rightRad = ((dir.angle + 90) * Math.PI) / 180;
      const lx = cx + innerR * Math.cos(leftRad);
      const ly = cy + innerR * Math.sin(leftRad);
      const rx = cx + innerR * Math.cos(rightRad);
      const ry = cy + innerR * Math.sin(rightRad);
      svg += polygon(`${tipX},${tipY} ${lx},${ly} ${rx},${ry}`, dir.fill);
    }

    svg += circle(cx, cy, innerR / 2, pal.bg);

    blocks.push(
      block(
        `Compass Rose 4-Point (${palName})`,
        'Art Deco',
        svg,
        ['compass', 'rose', 'star', 'art-deco', 'directional'],
        'Compass Rose'
      )
    );
  }

  // 8-pointed compass rose
  for (const [palName, pal] of palettes.slice(0, 2)) {
    const cx = 50;
    const cy = 50;
    const outerR = 46;
    const midR = 30;
    const innerR = 12;
    let svg = rect(0, 0, 100, 100, pal.bg);
    svg += circle(cx, cy, outerR + 2, pal.secondary);

    // 8 points
    for (let i = 0; i < 8; i++) {
      const angle = -90 + i * 45;
      const isCardinal = i % 2 === 0;
      const r = isCardinal ? outerR : midR;
      const fill = isCardinal ? pal.primary : pal.accent;
      const rad = (angle * Math.PI) / 180;
      const tipX = cx + r * Math.cos(rad);
      const tipY = cy + r * Math.sin(rad);
      const leftRad = ((angle - 22.5) * Math.PI) / 180;
      const rightRad = ((angle + 22.5) * Math.PI) / 180;
      const lx = cx + innerR * Math.cos(leftRad);
      const ly = cy + innerR * Math.sin(leftRad);
      const rx = cx + innerR * Math.cos(rightRad);
      const ry = cy + innerR * Math.sin(rightRad);
      svg += polygon(`${tipX},${tipY} ${lx},${ly} ${rx},${ry}`, fill);
    }

    svg += circle(cx, cy, innerR / 2, pal.bg);

    blocks.push(
      block(
        `Compass Rose 8-Point (${palName})`,
        'Art Deco',
        svg,
        ['compass', 'rose', 'star', 'eight-point', 'art-deco'],
        'Compass Rose'
      )
    );
  }

  return blocks;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function generateArtDecoBlocks(): BlockDefinition[] {
  return [
    ...generateFanBlocks(),
    ...generateSunburstBlocks(),
    ...generateChevronBlocks(),
    ...generateGeometricBlocks(),
    ...generateScallopBlocks(),
    ...generateSpiderwebBlocks(),
    ...generateCompassRoseBlocks(),
  ];
}
