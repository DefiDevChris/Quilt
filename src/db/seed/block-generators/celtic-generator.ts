/**
 * Celtic block generator.
 * Generates 50+ blocks with interlocking Celtic knots, crosses, and spirals.
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
// Celtic Knot
// ---------------------------------------------------------------------------

function generateCelticKnotBlocks(): BlockDefinition[] {
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

  // Simple four-loop knot
  for (const [palName, pal] of palettes.slice(0, 4)) {
    const sw = 6;
    let svg = rect(0, 0, 100, 100, pal.bg);

    // Outer border ring
    svg += `<circle cx="50" cy="50" r="44" fill="none" stroke="${pal.primary}" stroke-width="${sw}"/>`;

    // Four interlocking loops
    svg += `<path d="M 50 10 C 75 10, 90 25, 90 50 C 90 75, 75 90, 50 90 C 25 90, 10 75, 10 50 C 10 25, 25 10, 50 10" fill="none" stroke="${pal.accent}" stroke-width="${sw - 1}"/>`;
    svg += `<path d="M 30 30 C 50 10, 70 30, 50 50 C 30 70, 50 90, 70 70 C 90 50, 70 30, 50 50 C 30 70, 10 50, 30 30" fill="none" stroke="${pal.primary}" stroke-width="${sw}"/>`;

    // Center dot
    svg += circle(50, 50, 5, pal.accent);

    blocks.push(
      block(
        `Celtic Knot Loop (${palName})`,
        'Celtic',
        svg,
        ['celtic', 'knot', 'interlocking', 'loop'],
        'Celtic Knot'
      )
    );
  }

  // Figure-eight knot
  for (const [palName, pal] of palettes.slice(0, 4)) {
    const sw = 5;
    let svg = rect(0, 0, 100, 100, pal.bg);

    svg += `<path d="M 25 20 C 5 20, 5 50, 25 50 C 45 50, 45 20, 25 20" fill="none" stroke="${pal.primary}" stroke-width="${sw + 2}"/>`;
    svg += `<path d="M 25 20 C 5 20, 5 50, 25 50 C 45 50, 45 20, 25 20" fill="none" stroke="${pal.bg}" stroke-width="${sw - 2}"/>`;
    svg += `<path d="M 75 50 C 55 50, 55 80, 75 80 C 95 80, 95 50, 75 50" fill="none" stroke="${pal.primary}" stroke-width="${sw + 2}"/>`;
    svg += `<path d="M 75 50 C 55 50, 55 80, 75 80 C 95 80, 95 50, 75 50" fill="none" stroke="${pal.bg}" stroke-width="${sw - 2}"/>`;

    // Cross-over band
    svg += `<path d="M 25 50 C 40 50, 60 50, 75 50" fill="none" stroke="${pal.accent}" stroke-width="${sw + 1}"/>`;
    svg += `<path d="M 25 50 C 40 50, 60 50, 75 50" fill="none" stroke="${pal.bg}" stroke-width="${sw - 2}"/>`;
    svg += `<line x1="35" y1="20" x2="65" y2="80" stroke="${pal.primary}" stroke-width="${sw}"/>`;
    svg += `<line x1="35" y1="20" x2="65" y2="80" stroke="${pal.bg}" stroke-width="${sw - 3}"/>`;

    blocks.push(
      block(
        `Celtic Figure-Eight Knot (${palName})`,
        'Celtic',
        svg,
        ['celtic', 'knot', 'figure-eight', 'interlocking'],
        'Celtic Knot'
      )
    );
  }

  // Quartered knot panels
  for (const [palName, pal] of palettes.slice(0, 4)) {
    const sw = 4;
    let svg = rect(0, 0, 100, 100, pal.bg);

    // Four quadrant loops
    const quadrants = [
      { cx: 25, cy: 25 },
      { cx: 75, cy: 25 },
      { cx: 25, cy: 75 },
      { cx: 75, cy: 75 },
    ];

    for (const q of quadrants) {
      svg += `<circle cx="${q.cx}" cy="${q.cy}" r="18" fill="none" stroke="${pal.primary}" stroke-width="${sw + 1}"/>`;
      svg += `<circle cx="${q.cx}" cy="${q.cy}" r="18" fill="none" stroke="${pal.bg}" stroke-width="${sw - 2}"/>`;
      svg += `<circle cx="${q.cx}" cy="${q.cy}" r="10" fill="none" stroke="${pal.accent}" stroke-width="${sw}"/>`;
      svg += `<circle cx="${q.cx}" cy="${q.cy}" r="10" fill="none" stroke="${pal.bg}" stroke-width="${sw - 2}"/>`;
    }

    // Connecting bands
    svg += `<line x1="0" y1="50" x2="100" y2="50" stroke="${pal.primary}" stroke-width="${sw}"/>`;
    svg += `<line x1="50" y1="0" x2="50" y2="100" stroke="${pal.primary}" stroke-width="${sw}"/>`;

    blocks.push(
      block(
        `Celtic Quartered Knot (${palName})`,
        'Celtic',
        svg,
        ['celtic', 'knot', 'quartered', 'panel'],
        'Celtic Knot'
      )
    );
  }

  return blocks;
}

// ---------------------------------------------------------------------------
// Celtic Cross
// ---------------------------------------------------------------------------

function generateCelticCrossBlocks(): BlockDefinition[] {
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
    const armW = 14;
    const halfArm = armW / 2;
    const cx = 50;
    const cy = 50;
    const ringR = 22;
    const crossColor = pal.primary;

    let svg = rect(0, 0, 100, 100, pal.bg);

    // Circle behind cross
    svg += `<circle cx="${cx}" cy="${cy}" r="${ringR}" fill="none" stroke="${pal.accent}" stroke-width="4"/>`;

    // Vertical arm
    svg += rect(cx - halfArm, 5, armW, 90, crossColor);
    // Horizontal arm
    svg += rect(10, cy - halfArm, 80, armW, crossColor);

    // Ring overlap decorations
    svg += `<circle cx="${cx}" cy="${cy}" r="${ringR}" fill="none" stroke="${pal.secondary}" stroke-width="3"/>`;

    // Inner knot detail at center
    svg += circle(cx, cy, 6, pal.accent);
    svg += circle(cx, cy, 3, pal.bg);

    // Terminal knobs
    svg += circle(cx, 5, halfArm, crossColor);
    svg += circle(cx, 95, halfArm, crossColor);
    svg += circle(10, cy, halfArm, crossColor);
    svg += circle(90, cy, halfArm, crossColor);

    blocks.push(
      block(
        `Celtic Cross (${palName})`,
        'Celtic',
        svg,
        ['celtic', 'cross', 'ring', 'traditional'],
        'Celtic Cross'
      )
    );
  }

  return blocks;
}

// ---------------------------------------------------------------------------
// Interlace Band
// ---------------------------------------------------------------------------

function generateInterlaceBandBlocks(): BlockDefinition[] {
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

  // Horizontal braid
  for (const [palName, pal] of palettes.slice(0, 4)) {
    const sw = 8;
    let svg = rect(0, 0, 100, 100, pal.bg);

    // Three interweaving horizontal bands
    const yPositions = [30, 50, 70];
    const colors = [pal.primary, pal.accent, pal.secondary];

    for (let b = 0; b < 3; b++) {
      const y = yPositions[b];
      let d = `M 0 ${y}`;
      for (let x = 0; x <= 100; x += 25) {
        const offset = b % 2 === 0 ? 8 : -8;
        const cy = y + ((x / 25) % 2 === 0 ? offset : -offset);
        d += ` Q ${x + 12.5} ${cy}, ${x + 25} ${y}`;
      }
      svg += `<path d="${d}" fill="none" stroke="${colors[b]}" stroke-width="${sw}" stroke-linecap="round"/>`;
      svg += `<path d="${d}" fill="none" stroke="${pal.bg}" stroke-width="${sw - 4}" stroke-linecap="round"/>`;
    }

    blocks.push(
      block(
        `Interlace Band Horizontal (${palName})`,
        'Celtic',
        svg,
        ['celtic', 'interlace', 'braid', 'horizontal', 'woven'],
        'Interlace Band'
      )
    );
  }

  // Vertical braid
  for (const [palName, pal] of palettes.slice(0, 3)) {
    const sw = 8;
    let svg = rect(0, 0, 100, 100, pal.bg);

    const xPositions = [30, 50, 70];
    const colors = [pal.primary, pal.accent, pal.secondary];

    for (let b = 0; b < 3; b++) {
      const x = xPositions[b];
      let d = `M ${x} 0`;
      for (let y = 0; y <= 100; y += 25) {
        const offset = b % 2 === 0 ? 8 : -8;
        const cx = x + ((y / 25) % 2 === 0 ? offset : -offset);
        d += ` Q ${cx} ${y + 12.5}, ${x} ${y + 25}`;
      }
      svg += `<path d="${d}" fill="none" stroke="${colors[b]}" stroke-width="${sw}" stroke-linecap="round"/>`;
      svg += `<path d="${d}" fill="none" stroke="${pal.bg}" stroke-width="${sw - 4}" stroke-linecap="round"/>`;
    }

    blocks.push(
      block(
        `Interlace Band Vertical (${palName})`,
        'Celtic',
        svg,
        ['celtic', 'interlace', 'braid', 'vertical', 'woven'],
        'Interlace Band'
      )
    );
  }

  // Diagonal braid
  for (const [palName, pal] of palettes.slice(0, 3)) {
    const sw = 7;
    let svg = rect(0, 0, 100, 100, pal.bg);
    const colors = [pal.primary, pal.accent, pal.secondary];

    for (let b = 0; b < 3; b++) {
      const offset = b * 12;
      const d = `M ${-10 + offset} 0 Q 25 ${25 + offset * 0.3}, 50 50 Q 75 ${75 - offset * 0.3}, ${110 - offset} 100`;
      svg += `<path d="${d}" fill="none" stroke="${colors[b]}" stroke-width="${sw}" stroke-linecap="round"/>`;
      svg += `<path d="${d}" fill="none" stroke="${pal.bg}" stroke-width="${sw - 4}" stroke-linecap="round"/>`;
    }

    // Counter-diagonal
    for (let b = 0; b < 3; b++) {
      const offset = b * 12;
      const d = `M ${110 - offset} 0 Q 75 ${25 + offset * 0.3}, 50 50 Q 25 ${75 - offset * 0.3}, ${-10 + offset} 100`;
      svg += `<path d="${d}" fill="none" stroke="${colors[b]}" stroke-width="${sw}" stroke-linecap="round"/>`;
      svg += `<path d="${d}" fill="none" stroke="${pal.bg}" stroke-width="${sw - 4}" stroke-linecap="round"/>`;
    }

    blocks.push(
      block(
        `Interlace Band Diagonal (${palName})`,
        'Celtic',
        svg,
        ['celtic', 'interlace', 'braid', 'diagonal', 'woven'],
        'Interlace Band'
      )
    );
  }

  return blocks;
}

// ---------------------------------------------------------------------------
// Trinity Knot / Triquetra
// ---------------------------------------------------------------------------

function generateTrinityKnotBlocks(): BlockDefinition[] {
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
    const sw = 5;
    let svg = rect(0, 0, 100, 100, pal.bg);

    // Three-lobed triquetra using cubic bezier curves
    // Top lobe
    svg += `<path d="M 50 18 C 30 18, 15 40, 30 55 C 40 65, 50 55, 50 55" fill="none" stroke="${pal.primary}" stroke-width="${sw + 1}"/>`;
    svg += `<path d="M 50 18 C 30 18, 15 40, 30 55 C 40 65, 50 55, 50 55" fill="none" stroke="${pal.bg}" stroke-width="${sw - 3}"/>`;

    // Bottom-right lobe
    svg += `<path d="M 50 55 C 50 55, 60 65, 70 55 C 85 40, 70 18, 50 18" fill="none" stroke="${pal.primary}" stroke-width="${sw + 1}"/>`;
    svg += `<path d="M 50 55 C 50 55, 60 65, 70 55 C 85 40, 70 18, 50 18" fill="none" stroke="${pal.bg}" stroke-width="${sw - 3}"/>`;

    // Bottom lobe
    svg += `<path d="M 30 55 C 25 70, 40 85, 50 82 C 60 85, 75 70, 70 55" fill="none" stroke="${pal.primary}" stroke-width="${sw + 1}"/>`;
    svg += `<path d="M 30 55 C 25 70, 40 85, 50 82 C 60 85, 75 70, 70 55" fill="none" stroke="${pal.bg}" stroke-width="${sw - 3}"/>`;

    // Central triangle accent
    svg += polygon('50,30 35,60 65,60', pal.accent);
    svg += polygon('50,35 40,57 60,57', pal.bg);

    // Circle around the knot
    svg += `<circle cx="50" cy="50" r="44" fill="none" stroke="${pal.secondary}" stroke-width="2"/>`;

    blocks.push(
      block(
        `Trinity Knot (${palName})`,
        'Celtic',
        svg,
        ['celtic', 'trinity', 'triquetra', 'knot', 'three-lobed'],
        'Trinity Knot'
      )
    );
  }

  return blocks;
}

// ---------------------------------------------------------------------------
// Spiral
// ---------------------------------------------------------------------------

function generateSpiralBlocks(): BlockDefinition[] {
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

  // Single spiral
  for (const [palName, pal] of palettes.slice(0, 3)) {
    const sw = 4;
    let svg = rect(0, 0, 100, 100, pal.bg);

    // Spiral built from successive arcs
    const cx = 50;
    const cy = 50;
    let d = `M ${cx} ${cy}`;
    const turns = 4;
    const maxR = 40;

    for (let i = 0; i < turns * 2; i++) {
      const r = (maxR / (turns * 2)) * (i + 1);
      const sweepX = i % 2 === 0 ? cx + r : cx - r;
      d += ` A ${r} ${r} 0 0 ${i % 2} ${sweepX} ${cy}`;
    }

    svg += `<path d="${d}" fill="none" stroke="${pal.primary}" stroke-width="${sw}" stroke-linecap="round"/>`;
    svg += circle(cx, cy, 3, pal.accent);

    blocks.push(
      block(
        `Celtic Single Spiral (${palName})`,
        'Celtic',
        svg,
        ['celtic', 'spiral', 'single', 'curved'],
        'Spiral'
      )
    );
  }

  // Double spiral (S-curve)
  for (const [palName, pal] of palettes.slice(0, 3)) {
    const sw = 4;
    let svg = rect(0, 0, 100, 100, pal.bg);

    // Left spiral
    const lcx = 30;
    const lcy = 50;
    let dL = `M ${lcx} ${lcy}`;
    for (let i = 0; i < 6; i++) {
      const r = 4 * (i + 1);
      const sx = i % 2 === 0 ? lcx + r : lcx - r;
      dL += ` A ${r} ${r} 0 0 ${i % 2} ${sx} ${lcy}`;
    }
    svg += `<path d="${dL}" fill="none" stroke="${pal.primary}" stroke-width="${sw}" stroke-linecap="round"/>`;

    // Right spiral (mirrored)
    const rcx = 70;
    const rcy = 50;
    let dR = `M ${rcx} ${rcy}`;
    for (let i = 0; i < 6; i++) {
      const r = 4 * (i + 1);
      const sx = i % 2 === 0 ? rcx - r : rcx + r;
      dR += ` A ${r} ${r} 0 0 ${i % 2 === 0 ? 1 : 0} ${sx} ${rcy}`;
    }
    svg += `<path d="${dR}" fill="none" stroke="${pal.accent}" stroke-width="${sw}" stroke-linecap="round"/>`;

    // Connecting bridge
    svg += `<line x1="${lcx}" y1="${lcy}" x2="${rcx}" y2="${rcy}" stroke="${pal.secondary}" stroke-width="3"/>`;
    svg += circle(lcx, lcy, 3, pal.primary);
    svg += circle(rcx, rcy, 3, pal.accent);

    blocks.push(
      block(
        `Celtic Double Spiral (${palName})`,
        'Celtic',
        svg,
        ['celtic', 'spiral', 'double', 's-curve'],
        'Spiral'
      )
    );
  }

  // Triple spiral (triskelion)
  for (const [palName, pal] of palettes.slice(0, 2)) {
    const sw = 4;
    let svg = rect(0, 0, 100, 100, pal.bg);
    const cx = 50;
    const cy = 50;

    // Three arms radiating from center at 120 degree intervals
    const armAngles = [0, 120, 240];
    const armColors = [pal.primary, pal.accent, pal.secondary];

    for (let a = 0; a < 3; a++) {
      const baseAngle = armAngles[a];
      const toRad = (deg: number) => (deg * Math.PI) / 180;

      // Arm endpoint
      const armR = 35;
      const endX = cx + armR * Math.cos(toRad(baseAngle - 90));
      const endY = cy + armR * Math.sin(toRad(baseAngle - 90));

      // Control points for spiral arm
      const cp1x = cx + 15 * Math.cos(toRad(baseAngle - 30));
      const cp1y = cy + 15 * Math.sin(toRad(baseAngle - 30));
      const cp2x = cx + 30 * Math.cos(toRad(baseAngle - 60));
      const cp2y = cy + 30 * Math.sin(toRad(baseAngle - 60));

      const d = `M ${cx} ${cy} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;
      svg += `<path d="${d}" fill="none" stroke="${armColors[a]}" stroke-width="${sw}" stroke-linecap="round"/>`;

      // Spiral curl at the end
      const curlR = 8;
      const curlX = endX + curlR * Math.cos(toRad(baseAngle));
      const curlY = endY + curlR * Math.sin(toRad(baseAngle));
      svg += `<path d="M ${endX} ${endY} A ${curlR} ${curlR} 0 1 1 ${curlX} ${curlY}" fill="none" stroke="${armColors[a]}" stroke-width="${sw}" stroke-linecap="round"/>`;
    }

    svg += circle(cx, cy, 4, pal.primary);
    svg += `<circle cx="${cx}" cy="${cy}" r="44" fill="none" stroke="${pal.secondary}" stroke-width="1.5"/>`;

    blocks.push(
      block(
        `Celtic Triple Spiral (${palName})`,
        'Celtic',
        svg,
        ['celtic', 'spiral', 'triple', 'triskelion'],
        'Spiral'
      )
    );
  }

  return blocks;
}

// ---------------------------------------------------------------------------
// Key Pattern
// ---------------------------------------------------------------------------

function generateKeyPatternBlocks(): BlockDefinition[] {
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

  // Greek key / meander border
  for (const [palName, pal] of palettes.slice(0, 4)) {
    const u = 10; // unit size
    let svg = rect(0, 0, 100, 100, pal.bg);

    // Top border key pattern
    for (let x = 0; x < 100; x += u * 4) {
      svg += rect(x, 0, u * 3, u, pal.primary);
      svg += rect(x, u, u, u, pal.primary);
      svg += rect(x + u, u, u, u, pal.bg);
      svg += rect(x + u * 2, u, u, u * 2, pal.primary);
      svg += rect(x + u, u * 2, u * 2, u, pal.bg);
      svg += rect(x + u * 3, 0, u, u * 3, pal.primary);
    }

    // Bottom border key pattern (mirrored)
    for (let x = 0; x < 100; x += u * 4) {
      svg += rect(x, 70, u * 3, u, pal.primary);
      svg += rect(x, 80, u, u, pal.primary);
      svg += rect(x + u, 80, u, u, pal.bg);
      svg += rect(x + u * 2, 80, u, u * 2, pal.primary);
      svg += rect(x + u * 3, 70, u, u * 3, pal.primary);
    }

    // Center decorative diamond
    svg += diamond(50, 50, 24, pal.accent);
    svg += diamond(50, 50, 14, pal.bg);

    blocks.push(
      block(
        `Celtic Key Border (${palName})`,
        'Celtic',
        svg,
        ['celtic', 'key', 'meander', 'maze', 'angular'],
        'Key Pattern'
      )
    );
  }

  // Full tile key maze
  for (const [palName, pal] of palettes.slice(0, 4)) {
    const u = 10;
    let svg = rect(0, 0, 100, 100, pal.bg);

    // Maze-like angular pattern filling entire block
    // Row 1
    svg += rect(0, 0, u * 3, u, pal.primary);
    svg += rect(0, u, u, u * 2, pal.primary);
    svg += rect(u, u * 2, u * 2, u, pal.primary);
    svg += rect(u * 2, u, u, u, pal.primary);

    svg += rect(u * 4, 0, u, u * 3, pal.secondary);
    svg += rect(u * 5, u * 2, u * 2, u, pal.secondary);
    svg += rect(u * 7, 0, u * 3, u, pal.secondary);
    svg += rect(u * 9, u, u, u * 2, pal.secondary);

    // Row 2
    svg += rect(0, u * 4, u * 2, u, pal.accent);
    svg += rect(u, u * 4, u, u * 3, pal.accent);
    svg += rect(u * 2, u * 6, u * 2, u, pal.accent);

    svg += rect(u * 4, u * 4, u * 3, u, pal.primary);
    svg += rect(u * 6, u * 4, u, u * 3, pal.primary);
    svg += rect(u * 4, u * 6, u * 2, u, pal.primary);

    svg += rect(u * 8, u * 4, u * 2, u, pal.secondary);
    svg += rect(u * 8, u * 5, u, u * 2, pal.secondary);

    // Row 3
    svg += rect(0, u * 8, u * 3, u, pal.secondary);
    svg += rect(u * 2, u * 8, u, u * 2, pal.secondary);
    svg += rect(u * 4, u * 8, u * 2, u, pal.accent);
    svg += rect(u * 4, u * 9, u, u, pal.accent);
    svg += rect(u * 7, u * 8, u * 3, u, pal.primary);
    svg += rect(u * 7, u * 9, u, u, pal.primary);
    svg += rect(u * 9, u * 9, u, u, pal.primary);

    blocks.push(
      block(
        `Celtic Key Maze (${palName})`,
        'Celtic',
        svg,
        ['celtic', 'key', 'maze', 'angular', 'geometric'],
        'Key Pattern'
      )
    );
  }

  return blocks;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function generateCelticBlocks(): BlockDefinition[] {
  return [
    ...generateCelticKnotBlocks(),
    ...generateCelticCrossBlocks(),
    ...generateInterlaceBandBlocks(),
    ...generateTrinityKnotBlocks(),
    ...generateSpiralBlocks(),
    ...generateKeyPatternBlocks(),
  ];
}
