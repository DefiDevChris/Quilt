/**
 * Quilt block definitions for seeding the database.
 * Each block has SVG geometry and metadata. SVGs are drawn in a 100x100 viewBox.
 * Fabric.js JSON is generated from the SVG paths at seed time.
 */

import { getGeneratedBlocks } from './block-generators/index';

export interface BlockDefinition {
  name: string;
  category: string;
  subcategory: string | null;
  svgData: string;
  tags: string[];
}

function svgWrap(innerPaths: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${innerPaths}</svg>`;
}

// --- Helper: generate a grid of squares ---
function gridSquares(rows: number, cols: number, fill1: string, fill2: string): string {
  const w = 100 / cols;
  const h = 100 / rows;
  let paths = '';
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const fill = (r + c) % 2 === 0 ? fill1 : fill2;
      paths += `<rect x="${c * w}" y="${r * h}" width="${w}" height="${h}" fill="${fill}" stroke="#333" stroke-width="0.5"/>`;
    }
  }
  return paths;
}

// --- Helper: Half-Square Triangle block ---
function hstBlock(topLeftFill: string, bottomRightFill: string): string {
  return (
    `<polygon points="0,0 100,0 0,100" fill="${topLeftFill}" stroke="#333" stroke-width="0.5"/>` +
    `<polygon points="100,0 100,100 0,100" fill="${bottomRightFill}" stroke="#333" stroke-width="0.5"/>`
  );
}

// --- Helper: Quarter-Square Triangle block ---
function qstBlock(): string {
  return (
    `<polygon points="50,0 100,50 50,100 0,50" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
    `<polygon points="0,0 50,0 0,50" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
    `<polygon points="50,0 100,0 100,50" fill="#C9A06E" stroke="#333" stroke-width="0.5"/>` +
    `<polygon points="100,50 100,100 50,100" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
    `<polygon points="0,50 50,100 0,100" fill="#C9A06E" stroke="#333" stroke-width="0.5"/>`
  );
}

// --- Helper: Flying Geese unit ---
function flyingGeese(x: number, y: number, w: number, h: number): string {
  return (
    `<polygon points="${x},${y + h} ${x + w / 2},${y} ${x + w},${y + h}" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
    `<polygon points="${x},${y} ${x + w / 2},${y} ${x},${y + h}" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
    `<polygon points="${x + w / 2},${y} ${x + w},${y} ${x + w},${y + h}" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>`
  );
}

// --- Helper: Log Cabin strips ---
function logCabinStrips(rounds: number): string {
  let paths = '';
  const center = 50;
  const cSize = 100 / (2 * rounds + 1);
  const cx = center - cSize / 2;
  const cy = center - cSize / 2;
  paths += `<rect x="${cx}" y="${cy}" width="${cSize}" height="${cSize}" fill="#E53935" stroke="#333" stroke-width="0.5"/>`;

  const lightFills = ['#F5F0E8', '#FAF8F5', '#E5E2DD'];
  const darkFills = ['#D4883C', '#C9A06E', '#B8860B'];

  for (let i = 0; i < rounds; i++) {
    const offset = cSize * (i + 1);
    const size = cSize * (2 * i + 3);
    const x0 = cx - offset;
    const y0 = cy - offset;
    const light = lightFills[i % lightFills.length];
    const dark = darkFills[i % darkFills.length];

    // top strip
    paths += `<rect x="${x0}" y="${y0}" width="${size}" height="${cSize}" fill="${light}" stroke="#333" stroke-width="0.5"/>`;
    // right strip
    paths += `<rect x="${x0 + size - cSize}" y="${y0 + cSize}" width="${cSize}" height="${size - cSize}" fill="${dark}" stroke="#333" stroke-width="0.5"/>`;
    // bottom strip
    if (i < rounds - 1 || rounds <= 3) {
      paths += `<rect x="${x0}" y="${y0 + size - cSize}" width="${size - cSize}" height="${cSize}" fill="${light}" stroke="#333" stroke-width="0.5"/>`;
    }
    // left strip
    paths += `<rect x="${x0}" y="${y0 + cSize}" width="${cSize}" height="${size - 2 * cSize}" fill="${dark}" stroke="#333" stroke-width="0.5"/>`;
  }
  return paths;
}

// --- Generate star polygon points ---
function starPolygon(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  numPoints: number
): string {
  const points: string[] = [];
  for (let i = 0; i < numPoints * 2; i++) {
    const angle = (i * Math.PI) / numPoints - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    points.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return points.join(' ');
}

// --- Category: Traditional ---
const traditionalBlocks: BlockDefinition[] = [
  {
    name: 'Nine Patch',
    category: 'Traditional',
    subcategory: 'Patch',
    svgData: svgWrap(gridSquares(3, 3, '#D4883C', '#F5F0E8')),
    tags: ['beginner', '9-patch', 'traditional', 'easy'],
  },
  {
    name: 'Four Patch',
    category: 'Traditional',
    subcategory: 'Patch',
    svgData: svgWrap(gridSquares(2, 2, '#D4883C', '#F5F0E8')),
    tags: ['beginner', '4-patch', 'traditional', 'easy'],
  },
  {
    name: 'Sixteen Patch',
    category: 'Traditional',
    subcategory: 'Patch',
    svgData: svgWrap(gridSquares(4, 4, '#D4883C', '#F5F0E8')),
    tags: ['intermediate', '16-patch', 'traditional'],
  },
  {
    name: 'Checkerboard',
    category: 'Traditional',
    subcategory: 'Patch',
    svgData: svgWrap(gridSquares(5, 5, '#2D2D2D', '#FAF8F5')),
    tags: ['beginner', 'checkerboard', 'traditional'],
  },
  {
    name: 'Irish Chain',
    category: 'Traditional',
    subcategory: 'Chain',
    svgData: svgWrap(gridSquares(5, 5, '#4CAF50', '#F5F0E8')),
    tags: ['intermediate', 'chain', 'traditional', 'irish'],
  },
  {
    name: 'Rail Fence',
    category: 'Traditional',
    subcategory: 'Strips',
    svgData: svgWrap(
      `<rect x="0" y="0" width="100" height="33.3" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
        `<rect x="0" y="33.3" width="100" height="33.3" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
        `<rect x="0" y="66.6" width="100" height="33.4" fill="#C9A06E" stroke="#333" stroke-width="0.5"/>`
    ),
    tags: ['beginner', 'strips', 'traditional', 'rail-fence'],
  },
  {
    name: "Bear's Paw",
    category: 'Traditional',
    subcategory: 'Paw',
    svgData: svgWrap(
      `<rect x="0" y="0" width="50" height="50" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
        `<rect x="50" y="0" width="50" height="50" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
        `<rect x="0" y="50" width="50" height="50" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
        `<rect x="50" y="50" width="50" height="50" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="0,0 25,0 0,25" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="25,0 50,0 50,25" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="0,25 0,50 25,50" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
        `<rect x="20" y="20" width="10" height="10" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="50,0 75,0 50,25" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="75,0 100,0 100,25" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="50,25 50,50 75,50" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
        `<rect x="70" y="20" width="10" height="10" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
        `<rect x="37.5" y="37.5" width="25" height="25" fill="#D4883C" stroke="#333" stroke-width="0.5"/>`
    ),
    tags: ['intermediate', 'traditional', 'paw', 'bear'],
  },
  {
    name: 'Churn Dash',
    category: 'Traditional',
    subcategory: null,
    svgData: svgWrap(
      `<polygon points="0,0 33,0 0,33" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="33,0 33,33 0,33" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
        `<rect x="33" y="0" width="34" height="33" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="67,0 100,0 100,33" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="67,0 67,33 100,33" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
        `<rect x="0" y="33" width="33" height="34" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
        `<rect x="33" y="33" width="34" height="34" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
        `<rect x="67" y="33" width="33" height="34" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="0,67 33,67 33,100" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="0,67 0,100 33,100" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
        `<rect x="33" y="67" width="34" height="33" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="67,67 100,67 67,100" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="100,67 100,100 67,100" fill="#D4883C" stroke="#333" stroke-width="0.5"/>`
    ),
    tags: ['intermediate', 'traditional', 'churn-dash'],
  },
  {
    name: 'Bow Tie',
    category: 'Traditional',
    subcategory: null,
    svgData: svgWrap(
      `<polygon points="0,0 50,0 50,50 0,50" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="50,0 100,0 100,50 50,50" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="0,50 50,50 50,100 0,100" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="50,50 100,50 100,100 50,100" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="25,25 50,50 25,75" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="75,25 50,50 75,75" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
        `<rect x="37.5" y="37.5" width="25" height="25" fill="#D4883C" stroke="#333" stroke-width="0.5"/>`
    ),
    tags: ['beginner', 'traditional', 'bow-tie'],
  },
  {
    name: 'Shoofly',
    category: 'Traditional',
    subcategory: null,
    svgData: svgWrap(
      `<polygon points="0,0 33,33 0,33" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="0,0 33,0 33,33" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
        `<rect x="33" y="0" width="34" height="33" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="67,0 100,0 67,33" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="100,0 100,33 67,33" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
        `<rect x="0" y="33" width="33" height="34" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
        `<rect x="33" y="33" width="34" height="34" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
        `<rect x="67" y="33" width="33" height="34" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="0,67 33,67 0,100" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="33,67 33,100 0,100" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
        `<rect x="33" y="67" width="34" height="33" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="67,67 100,67 100,100" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="67,67 67,100 100,100" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>`
    ),
    tags: ['beginner', 'traditional', 'shoofly'],
  },
  {
    name: 'Monkey Wrench',
    category: 'Traditional',
    subcategory: null,
    svgData: svgWrap(
      `<polygon points="0,0 50,0 0,50" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="50,0 100,0 50,50" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="100,0 100,50 50,50" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
        `<rect x="25" y="25" width="50" height="50" fill="#C9A06E" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="0,50 50,50 0,100" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="0,100 50,50 50,100" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="50,50 100,50 100,100" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="50,100 100,100 50,50" fill="#D4883C" stroke="#333" stroke-width="0.5"/>`
    ),
    tags: ['intermediate', 'traditional', 'monkey-wrench'],
  },
];

// --- Category: Log Cabin ---
const logCabinBlocks: BlockDefinition[] = [
  {
    name: 'Log Cabin Classic',
    category: 'Log Cabin',
    subcategory: 'Traditional',
    svgData: svgWrap(logCabinStrips(3)),
    tags: ['beginner', 'log-cabin', 'strips', 'traditional'],
  },
  {
    name: 'Log Cabin Courthouse',
    category: 'Log Cabin',
    subcategory: 'Courthouse',
    svgData: svgWrap(logCabinStrips(4)),
    tags: ['intermediate', 'log-cabin', 'courthouse', 'strips'],
  },
  {
    name: 'Log Cabin Barn Raising',
    category: 'Log Cabin',
    subcategory: 'Barn Raising',
    svgData: svgWrap(logCabinStrips(2)),
    tags: ['beginner', 'log-cabin', 'barn-raising'],
  },
];

// --- Category: Stars ---
const starBlocks: BlockDefinition[] = [
  {
    name: 'Ohio Star',
    category: 'Stars',
    subcategory: null,
    svgData: svgWrap(gridSquares(3, 3, '#F5F0E8', '#F5F0E8') + qstBlock()),
    tags: ['intermediate', 'star', 'ohio', 'traditional'],
  },
  {
    name: 'Sawtooth Star',
    category: 'Stars',
    subcategory: null,
    svgData: svgWrap(
      `<rect x="0" y="0" width="100" height="100" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
        `<rect x="33" y="33" width="34" height="34" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
        flyingGeese(33, 0, 34, 33) +
        `<polygon points="67,33 100,50 67,67" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="33,67 50,100 67,67" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="0,50 33,33 33,67" fill="#D4883C" stroke="#333" stroke-width="0.5"/>`
    ),
    tags: ['intermediate', 'star', 'sawtooth', 'traditional'],
  },
  {
    name: 'Friendship Star',
    category: 'Stars',
    subcategory: null,
    svgData: svgWrap(
      `<rect x="0" y="0" width="33" height="33" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="33,0 67,0 50,33" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="33,0 33,33 50,33" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="67,0 67,33 50,33" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
        `<rect x="67" y="0" width="33" height="33" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="0,33 0,67 33,50" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="0,33 33,33 33,50" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="0,67 33,67 33,50" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
        `<rect x="33" y="33" width="34" height="34" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="67,33 100,33 67,50" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="100,33 100,67 67,50" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="67,50 67,67 100,67" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
        `<rect x="0" y="67" width="33" height="33" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="33,67 67,67 50,100" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="33,67 33,100 50,100" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="67,67 67,100 50,100" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
        `<rect x="67" y="67" width="33" height="33" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>`
    ),
    tags: ['beginner', 'star', 'friendship', 'traditional'],
  },
  {
    name: 'Evening Star',
    category: 'Stars',
    subcategory: null,
    svgData: svgWrap(
      `<rect x="0" y="0" width="100" height="100" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="${starPolygon(50, 50, 48, 22, 8)}" fill="#D4883C" stroke="#333" stroke-width="0.5"/>`
    ),
    tags: ['intermediate', 'star', 'evening', 'eight-point'],
  },
  {
    name: 'Lone Star',
    category: 'Stars',
    subcategory: null,
    svgData: svgWrap(
      `<rect x="0" y="0" width="100" height="100" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="${starPolygon(50, 50, 48, 30, 8)}" fill="#B8860B" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="${starPolygon(50, 50, 28, 15, 8)}" fill="#D4883C" stroke="#333" stroke-width="0.5"/>`
    ),
    tags: ['advanced', 'star', 'lone-star', 'texas'],
  },
  {
    name: 'North Star',
    category: 'Stars',
    subcategory: null,
    svgData: svgWrap(
      `<rect x="0" y="0" width="100" height="100" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="${starPolygon(50, 50, 45, 20, 4)}" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
        `<circle cx="50" cy="50" r="10" fill="#C9A06E" stroke="#333" stroke-width="0.5"/>`
    ),
    tags: ['intermediate', 'star', 'north-star', 'compass'],
  },
  {
    name: 'Morning Star',
    category: 'Stars',
    subcategory: null,
    svgData: svgWrap(
      `<rect x="0" y="0" width="100" height="100" fill="#FAF8F5" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="${starPolygon(50, 50, 46, 25, 6)}" fill="#D4883C" stroke="#333" stroke-width="0.5"/>`
    ),
    tags: ['intermediate', 'star', 'morning-star', 'hexagonal'],
  },
  {
    name: 'Star of Bethlehem',
    category: 'Stars',
    subcategory: null,
    svgData: svgWrap(
      `<rect x="0" y="0" width="100" height="100" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="${starPolygon(50, 50, 48, 18, 8)}" fill="#B8860B" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="${starPolygon(50, 50, 20, 10, 8)}" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>`
    ),
    tags: ['advanced', 'star', 'bethlehem', 'eight-point'],
  },
  {
    name: 'Variable Star',
    category: 'Stars',
    subcategory: null,
    svgData: svgWrap(
      `<rect x="0" y="0" width="100" height="100" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
        `<rect x="33" y="33" width="34" height="34" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="33,0 50,33 67,0" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="100,33 67,50 100,67" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="33,100 50,67 67,100" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="0,33 33,50 0,67" fill="#D4883C" stroke="#333" stroke-width="0.5"/>`
    ),
    tags: ['intermediate', 'star', 'variable'],
  },
];

// --- Category: Pinwheel ---
const pinwheelBlocks: BlockDefinition[] = [
  {
    name: 'Pinwheel',
    category: 'Pinwheel',
    subcategory: null,
    svgData: svgWrap(
      `<polygon points="0,0 50,0 50,50" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="0,0 0,50 50,50" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="50,0 100,0 50,50" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="100,0 100,50 50,50" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="0,50 50,50 0,100" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="50,50 50,100 0,100" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="50,50 100,50 100,100" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="50,50 50,100 100,100" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>`
    ),
    tags: ['beginner', 'pinwheel', 'spinning'],
  },
  {
    name: 'Double Pinwheel',
    category: 'Pinwheel',
    subcategory: null,
    svgData: svgWrap(
      `<polygon points="0,0 25,0 25,25" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="0,0 0,25 25,25" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="25,0 50,0 25,25" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="50,0 50,25 25,25" fill="#C9A06E" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="0,25 25,25 0,50" fill="#C9A06E" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="25,25 25,50 0,50" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="25,25 50,25 50,50" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="25,25 25,50 50,50" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
        `<rect x="50" y="0" width="50" height="50" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
        `<rect x="0" y="50" width="50" height="50" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
        `<rect x="50" y="50" width="50" height="50" fill="#C9A06E" stroke="#333" stroke-width="0.5"/>`
    ),
    tags: ['intermediate', 'pinwheel', 'double'],
  },
];

// --- Category: Flying Geese ---
const flyingGeeseBlocks: BlockDefinition[] = [
  {
    name: 'Flying Geese',
    category: 'Flying Geese',
    subcategory: null,
    svgData: svgWrap(
      flyingGeese(0, 0, 100, 50) +
        `<polygon points="0,50 50,100 100,50" fill="#C9A06E" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="0,50 0,100 50,100" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="100,50 100,100 50,100" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>`
    ),
    tags: ['beginner', 'flying-geese', 'traditional'],
  },
  {
    name: 'Flying Geese Row',
    category: 'Flying Geese',
    subcategory: null,
    svgData: svgWrap(
      flyingGeese(0, 0, 25, 100) +
        flyingGeese(25, 0, 25, 100) +
        flyingGeese(50, 0, 25, 100) +
        flyingGeese(75, 0, 25, 100)
    ),
    tags: ['beginner', 'flying-geese', 'row', 'border'],
  },
];

// --- Category: Triangles ---
const triangleBlocks: BlockDefinition[] = [
  {
    name: 'Half Square Triangle',
    category: 'Triangles',
    subcategory: 'HST',
    svgData: svgWrap(hstBlock('#D4883C', '#F5F0E8')),
    tags: ['beginner', 'hst', 'triangle', 'basic'],
  },
  {
    name: 'Quarter Square Triangle',
    category: 'Triangles',
    subcategory: 'QST',
    svgData: svgWrap(qstBlock()),
    tags: ['intermediate', 'qst', 'triangle'],
  },
  {
    name: 'Hourglass',
    category: 'Triangles',
    subcategory: null,
    svgData: svgWrap(
      `<polygon points="0,0 100,0 50,50" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="0,0 50,50 0,100" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="100,0 100,100 50,50" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="0,100 50,50 100,100" fill="#D4883C" stroke="#333" stroke-width="0.5"/>`
    ),
    tags: ['beginner', 'hourglass', 'triangle'],
  },
  {
    name: 'Broken Dishes',
    category: 'Triangles',
    subcategory: null,
    svgData: svgWrap(
      `<polygon points="0,0 50,0 50,50" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="0,0 0,50 50,50" fill="#C9A06E" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="50,0 100,0 50,50" fill="#C9A06E" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="100,0 100,50 50,50" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="0,50 50,50 0,100" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="50,50 50,100 0,100" fill="#C9A06E" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="50,50 100,50 100,100" fill="#C9A06E" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="50,50 50,100 100,100" fill="#D4883C" stroke="#333" stroke-width="0.5"/>`
    ),
    tags: ['beginner', 'broken-dishes', 'triangle'],
  },
  {
    name: "Dutchman's Puzzle",
    category: 'Triangles',
    subcategory: null,
    svgData: svgWrap(
      flyingGeese(0, 0, 50, 50) +
        `<polygon points="50,0 75,50 100,0" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="50,0 50,50 75,50" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="100,0 100,50 75,50" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
        flyingGeese(0, 50, 50, 50) +
        flyingGeese(50, 50, 50, 50)
    ),
    tags: ['intermediate', 'dutchmans-puzzle', 'triangle'],
  },
];

// --- Category: Squares ---
const squareBlocks: BlockDefinition[] = [
  {
    name: 'Simple Square',
    category: 'Squares',
    subcategory: null,
    svgData: svgWrap(
      `<rect x="0" y="0" width="100" height="100" fill="#D4883C" stroke="#333" stroke-width="0.5"/>`
    ),
    tags: ['beginner', 'square', 'basic', 'solid'],
  },
  {
    name: 'Square in a Square',
    category: 'Squares',
    subcategory: null,
    svgData: svgWrap(
      `<rect x="0" y="0" width="100" height="100" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="50,10 90,50 50,90 10,50" fill="#D4883C" stroke="#333" stroke-width="0.5"/>`
    ),
    tags: ['beginner', 'square-in-square', 'economy'],
  },
  {
    name: 'Economy Block',
    category: 'Squares',
    subcategory: null,
    svgData: svgWrap(
      `<polygon points="0,0 50,0 0,50" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="50,0 100,0 100,50" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="0,50 0,100 50,100" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="100,50 100,100 50,100" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="50,0 100,50 50,100 0,50" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
        `<rect x="25" y="25" width="50" height="50" fill="#C9A06E" stroke="#333" stroke-width="0.5"/>`
    ),
    tags: ['beginner', 'economy', 'square'],
  },
];

// --- Category: Diamonds ---
const diamondBlocks: BlockDefinition[] = [
  {
    name: 'Diamond',
    category: 'Diamonds',
    subcategory: null,
    svgData: svgWrap(
      `<rect x="0" y="0" width="100" height="100" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="50,5 95,50 50,95 5,50" fill="#D4883C" stroke="#333" stroke-width="0.5"/>`
    ),
    tags: ['beginner', 'diamond', 'basic'],
  },
  {
    name: 'Diamond in a Square',
    category: 'Diamonds',
    subcategory: null,
    svgData: svgWrap(
      `<rect x="0" y="0" width="100" height="100" fill="#C9A06E" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="50,10 90,50 50,90 10,50" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="50,25 75,50 50,75 25,50" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>`
    ),
    tags: ['intermediate', 'diamond', 'nested'],
  },
];

// --- Category: Modern ---
const modernBlocks: BlockDefinition[] = [
  {
    name: 'Modern Cross',
    category: 'Modern',
    subcategory: null,
    svgData: svgWrap(
      `<rect x="0" y="0" width="100" height="100" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
        `<rect x="33" y="0" width="34" height="100" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
        `<rect x="0" y="33" width="100" height="34" fill="#D4883C" stroke="#333" stroke-width="0.5"/>`
    ),
    tags: ['beginner', 'modern', 'cross', 'plus'],
  },
  {
    name: 'Modern Stripe',
    category: 'Modern',
    subcategory: null,
    svgData: svgWrap(
      `<rect x="0" y="0" width="20" height="100" fill="#D4883C" stroke="none"/>` +
        `<rect x="20" y="0" width="20" height="100" fill="#F5F0E8" stroke="none"/>` +
        `<rect x="40" y="0" width="20" height="100" fill="#C9A06E" stroke="none"/>` +
        `<rect x="60" y="0" width="20" height="100" fill="#F5F0E8" stroke="none"/>` +
        `<rect x="80" y="0" width="20" height="100" fill="#D4883C" stroke="none"/>` +
        `<rect x="0" y="0" width="100" height="100" fill="none" stroke="#333" stroke-width="0.5"/>`
    ),
    tags: ['beginner', 'modern', 'stripe', 'strips'],
  },
  {
    name: 'Improv Wedge',
    category: 'Modern',
    subcategory: null,
    svgData: svgWrap(
      `<polygon points="0,0 60,0 40,100 0,100" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="60,0 100,0 100,100 40,100" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>`
    ),
    tags: ['beginner', 'modern', 'improv', 'wedge'],
  },
  {
    name: 'Disappearing Nine Patch',
    category: 'Modern',
    subcategory: null,
    svgData: svgWrap(
      `<rect x="0" y="0" width="50" height="50" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
        `<rect x="50" y="0" width="50" height="50" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
        `<rect x="0" y="50" width="50" height="50" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
        `<rect x="50" y="50" width="50" height="50" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
        `<rect x="17" y="17" width="33" height="33" fill="#C9A06E" stroke="#333" stroke-width="0.5"/>` +
        `<rect x="50" y="50" width="33" height="33" fill="#C9A06E" stroke="#333" stroke-width="0.5"/>`
    ),
    tags: ['intermediate', 'modern', 'disappearing', 'nine-patch'],
  },
  {
    name: 'Herringbone',
    category: 'Modern',
    subcategory: null,
    svgData: svgWrap(
      `<polygon points="0,0 50,25 0,50" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="50,25 100,0 100,50" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="0,0 50,25 100,0" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="0,50 50,25 100,50" fill="#C9A06E" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="0,50 50,75 0,100" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="50,75 100,50 100,100" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="0,50 50,75 100,50" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="0,100 50,75 100,100" fill="#C9A06E" stroke="#333" stroke-width="0.5"/>`
    ),
    tags: ['intermediate', 'modern', 'herringbone'],
  },
];

// --- Category: Curves ---
const curveBlocks: BlockDefinition[] = [
  {
    name: "Drunkard's Path",
    category: 'Curves',
    subcategory: null,
    svgData: svgWrap(
      `<rect x="0" y="0" width="100" height="100" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
        `<path d="M0,0 Q50,0 50,50 Q0,50 0,0 Z" fill="#D4883C" stroke="#333" stroke-width="0.5"/>`
    ),
    tags: ['intermediate', 'curve', 'drunkards-path'],
  },
  {
    name: 'Orange Peel',
    category: 'Curves',
    subcategory: null,
    svgData: svgWrap(
      `<rect x="0" y="0" width="100" height="100" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
        `<path d="M0,50 Q50,0 100,50 Q50,100 0,50 Z" fill="#D4883C" stroke="#333" stroke-width="0.5"/>`
    ),
    tags: ['intermediate', 'curve', 'orange-peel'],
  },
  {
    name: 'Clamshell',
    category: 'Curves',
    subcategory: null,
    svgData: svgWrap(
      `<rect x="0" y="0" width="100" height="100" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
        `<path d="M0,50 Q0,0 50,0 Q100,0 100,50 L100,100 L0,100 Z" fill="#D4883C" stroke="#333" stroke-width="0.5"/>`
    ),
    tags: ['intermediate', 'curve', 'clamshell'],
  },
  {
    name: 'Rob Peter to Pay Paul',
    category: 'Curves',
    subcategory: null,
    svgData: svgWrap(
      `<rect x="0" y="0" width="100" height="100" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
        `<path d="M0,0 Q50,50 0,100 Z" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
        `<path d="M100,0 Q50,50 100,100 Z" fill="#D4883C" stroke="#333" stroke-width="0.5"/>`
    ),
    tags: ['intermediate', 'curve', 'rob-peter'],
  },
];

// --- Category: Hexagons ---
const hexagonBlocks: BlockDefinition[] = [
  {
    name: 'Hexagon',
    category: 'Hexagons',
    subcategory: null,
    svgData: svgWrap(
      `<rect x="0" y="0" width="100" height="100" fill="#F5F0E8" stroke="none"/>` +
        `<polygon points="50,3 93,27 93,73 50,97 7,73 7,27" fill="#D4883C" stroke="#333" stroke-width="0.5"/>`
    ),
    tags: ['intermediate', 'hexagon', 'epp'],
  },
  {
    name: "Grandmother's Flower Garden",
    category: 'Hexagons',
    subcategory: null,
    svgData: svgWrap(
      `<rect x="0" y="0" width="100" height="100" fill="#F5F0E8" stroke="none"/>` +
        `<polygon points="50,15 75,28 75,52 50,65 25,52 25,28" fill="#E53935" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="50,3 63,10 63,22 50,28 37,22 37,10" fill="#FFD700" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="50,65 75,52 88,60 88,78 75,85 50,78" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="50,65 25,52 12,60 12,78 25,85 50,78" fill="#D4883C" stroke="#333" stroke-width="0.5"/>`
    ),
    tags: ['advanced', 'hexagon', 'flower-garden', 'epp', 'grandmother'],
  },
];

// --- Category: Dresden ---
const dresdenBlocks: BlockDefinition[] = [
  {
    name: 'Dresden Plate',
    category: 'Dresden',
    subcategory: null,
    svgData: (() => {
      const blades = 12;
      let paths = `<rect x="0" y="0" width="100" height="100" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>`;
      const fills = ['#D4883C', '#C9A06E', '#B8860B', '#E53935', '#4CAF50', '#1976D2'];
      for (let i = 0; i < blades; i++) {
        const a1 = (((i * 360) / blades - 90) * Math.PI) / 180;
        const a2 = ((((i + 1) * 360) / blades - 90) * Math.PI) / 180;
        const inner = 12;
        const outer = 45;
        const x1i = 50 + inner * Math.cos(a1);
        const y1i = 50 + inner * Math.sin(a1);
        const x1o = 50 + outer * Math.cos(a1);
        const y1o = 50 + outer * Math.sin(a1);
        const x2i = 50 + inner * Math.cos(a2);
        const y2i = 50 + inner * Math.sin(a2);
        const x2o = 50 + outer * Math.cos(a2);
        const y2o = 50 + outer * Math.sin(a2);
        paths += `<polygon points="${x1i},${y1i} ${x1o},${y1o} ${x2o},${y2o} ${x2i},${y2i}" fill="${fills[i % fills.length]}" stroke="#333" stroke-width="0.5"/>`;
      }
      paths += `<circle cx="50" cy="50" r="12" fill="#FFD700" stroke="#333" stroke-width="0.5"/>`;
      return svgWrap(paths);
    })(),
    tags: ['advanced', 'dresden', 'plate', 'applique'],
  },
];

// --- Category: Appliqué ---
const appliqueBlocks: BlockDefinition[] = [
  {
    name: 'Heart',
    category: 'Appliqué',
    subcategory: null,
    svgData: svgWrap(
      `<rect x="0" y="0" width="100" height="100" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
        `<path d="M50,85 C20,65 5,45 5,30 C5,15 15,5 30,5 C40,5 47,12 50,20 C53,12 60,5 70,5 C85,5 95,15 95,30 C95,45 80,65 50,85 Z" fill="#E53935" stroke="#333" stroke-width="0.5"/>`
    ),
    tags: ['beginner', 'applique', 'heart', 'love'],
  },
  {
    name: 'Tulip',
    category: 'Appliqué',
    subcategory: null,
    svgData: svgWrap(
      `<rect x="0" y="0" width="100" height="100" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
        `<path d="M50,20 C35,20 25,35 30,50 L50,45 L70,50 C75,35 65,20 50,20 Z" fill="#E53935" stroke="#333" stroke-width="0.5"/>` +
        `<rect x="47" y="45" width="6" height="40" fill="#4CAF50" stroke="#333" stroke-width="0.5"/>` +
        `<path d="M47,70 C35,65 30,55 35,50" fill="none" stroke="#4CAF50" stroke-width="3"/>` +
        `<path d="M53,65 C65,60 70,50 65,45" fill="none" stroke="#4CAF50" stroke-width="3"/>`
    ),
    tags: ['intermediate', 'applique', 'tulip', 'flower'],
  },
  {
    name: 'Butterfly',
    category: 'Appliqué',
    subcategory: null,
    svgData: svgWrap(
      `<rect x="0" y="0" width="100" height="100" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
        `<path d="M50,20 Q20,10 15,40 Q10,65 50,55 Z" fill="#7B1FA2" stroke="#333" stroke-width="0.5"/>` +
        `<path d="M50,20 Q80,10 85,40 Q90,65 50,55 Z" fill="#E91E63" stroke="#333" stroke-width="0.5"/>` +
        `<path d="M50,55 Q35,75 30,90" fill="none" stroke="#333" stroke-width="2"/>` +
        `<path d="M50,55 Q65,75 70,90" fill="none" stroke="#333" stroke-width="2"/>` +
        `<rect x="48" y="20" width="4" height="35" fill="#333" stroke="none"/>`
    ),
    tags: ['intermediate', 'applique', 'butterfly', 'nature'],
  },
  {
    name: 'Leaf',
    category: 'Appliqué',
    subcategory: null,
    svgData: svgWrap(
      `<rect x="0" y="0" width="100" height="100" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
        `<path d="M50,10 Q80,30 80,60 Q80,90 50,90 Q20,90 20,60 Q20,30 50,10 Z" fill="#4CAF50" stroke="#333" stroke-width="0.5"/>` +
        `<line x1="50" y1="10" x2="50" y2="90" stroke="#2E7D32" stroke-width="2"/>`
    ),
    tags: ['beginner', 'applique', 'leaf', 'nature'],
  },
  {
    name: 'Sun',
    category: 'Appliqué',
    subcategory: null,
    svgData: svgWrap(
      `<rect x="0" y="0" width="100" height="100" fill="#E3F2FD" stroke="#333" stroke-width="0.5"/>` +
        `<circle cx="50" cy="50" r="25" fill="#FFD700" stroke="#FF8F00" stroke-width="1"/>` +
        `<polygon points="${starPolygon(50, 50, 45, 28, 12)}" fill="#FFD700" stroke="#FF8F00" stroke-width="0.5"/>`
    ),
    tags: ['beginner', 'applique', 'sun', 'nature'],
  },
];

// --- Programmatic generation of additional blocks to reach 200+ ---
function generateVariations(): BlockDefinition[] {
  const variations: BlockDefinition[] = [];
  const colors = [
    { name: 'Blue', fill: '#1976D2', bg: '#E3F2FD' },
    { name: 'Red', fill: '#E53935', bg: '#FFEBEE' },
    { name: 'Green', fill: '#4CAF50', bg: '#E8F5E9' },
    { name: 'Purple', fill: '#7B1FA2', bg: '#F3E5F5' },
    { name: 'Teal', fill: '#00897B', bg: '#E0F2F1' },
    { name: 'Pink', fill: '#E91E63', bg: '#FCE4EC' },
    { name: 'Navy', fill: '#1A237E', bg: '#E8EAF6' },
    { name: 'Amber', fill: '#FF8F00', bg: '#FFF8E1' },
    { name: 'Brown', fill: '#5D4037', bg: '#EFEBE9' },
    { name: 'Indigo', fill: '#283593', bg: '#E8EAF6' },
  ];

  // HST color variations
  for (const color of colors) {
    variations.push({
      name: `HST ${color.name}`,
      category: 'Triangles',
      subcategory: 'HST',
      svgData: svgWrap(hstBlock(color.fill, color.bg)),
      tags: ['beginner', 'hst', 'triangle', color.name.toLowerCase()],
    });
  }

  // Grid variations (different sizes)
  const gridSizes = [
    { name: 'Twenty-Five Patch', rows: 5, cols: 5 },
    { name: 'Thirty-Six Patch', rows: 6, cols: 6 },
    { name: 'Double Four Patch', rows: 4, cols: 4 },
  ];
  for (const color of colors.slice(0, 5)) {
    for (const grid of gridSizes) {
      variations.push({
        name: `${grid.name} ${color.name}`,
        category: 'Traditional',
        subcategory: 'Patch',
        svgData: svgWrap(gridSquares(grid.rows, grid.cols, color.fill, color.bg)),
        tags: ['intermediate', 'patch', 'grid', color.name.toLowerCase()],
      });
    }
  }

  // Star color variations
  for (const color of colors.slice(0, 8)) {
    variations.push({
      name: `${color.name} Star`,
      category: 'Stars',
      subcategory: null,
      svgData: svgWrap(
        `<rect x="0" y="0" width="100" height="100" fill="${color.bg}" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="${starPolygon(50, 50, 45, 20, 5)}" fill="${color.fill}" stroke="#333" stroke-width="0.5"/>`
      ),
      tags: ['intermediate', 'star', 'five-point', color.name.toLowerCase()],
    });
  }

  // Pinwheel color variations
  for (const color of colors.slice(0, 6)) {
    variations.push({
      name: `${color.name} Pinwheel`,
      category: 'Pinwheel',
      subcategory: null,
      svgData: svgWrap(
        `<polygon points="0,0 50,0 50,50" fill="${color.fill}" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="0,0 0,50 50,50" fill="${color.bg}" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="50,0 100,0 50,50" fill="${color.bg}" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="100,0 100,50 50,50" fill="${color.fill}" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="0,50 50,50 0,100" fill="${color.bg}" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="50,50 50,100 0,100" fill="${color.fill}" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="50,50 100,50 100,100" fill="${color.fill}" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="50,50 50,100 100,100" fill="${color.bg}" stroke="#333" stroke-width="0.5"/>`
      ),
      tags: ['beginner', 'pinwheel', color.name.toLowerCase()],
    });
  }

  // Flying geese color variations
  for (const color of colors.slice(0, 5)) {
    variations.push({
      name: `${color.name} Geese`,
      category: 'Flying Geese',
      subcategory: null,
      svgData: svgWrap(
        `<polygon points="0,100 50,0 100,100" fill="${color.fill}" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="0,0 50,0 0,100" fill="${color.bg}" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="50,0 100,0 100,100" fill="${color.bg}" stroke="#333" stroke-width="0.5"/>`
      ),
      tags: ['beginner', 'flying-geese', color.name.toLowerCase()],
    });
  }

  // Modern cross variations
  for (const color of colors.slice(0, 6)) {
    variations.push({
      name: `${color.name} Cross`,
      category: 'Modern',
      subcategory: null,
      svgData: svgWrap(
        `<rect x="0" y="0" width="100" height="100" fill="${color.bg}" stroke="#333" stroke-width="0.5"/>` +
          `<rect x="33" y="0" width="34" height="100" fill="${color.fill}" stroke="#333" stroke-width="0.5"/>` +
          `<rect x="0" y="33" width="100" height="34" fill="${color.fill}" stroke="#333" stroke-width="0.5"/>`
      ),
      tags: ['beginner', 'modern', 'cross', color.name.toLowerCase()],
    });
  }

  // Diamond color variations
  for (const color of colors.slice(0, 5)) {
    variations.push({
      name: `${color.name} Diamond`,
      category: 'Diamonds',
      subcategory: null,
      svgData: svgWrap(
        `<rect x="0" y="0" width="100" height="100" fill="${color.bg}" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="50,5 95,50 50,95 5,50" fill="${color.fill}" stroke="#333" stroke-width="0.5"/>`
      ),
      tags: ['beginner', 'diamond', color.name.toLowerCase()],
    });
  }

  // Additional unique traditional blocks
  const additionalTraditional: BlockDefinition[] = [
    {
      name: 'Storm at Sea',
      category: 'Traditional',
      subcategory: null,
      svgData: svgWrap(
        `<rect x="0" y="0" width="100" height="100" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="50,0 100,50 50,100 0,50" fill="#1976D2" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="50,15 85,50 50,85 15,50" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="50,30 70,50 50,70 30,50" fill="#1976D2" stroke="#333" stroke-width="0.5"/>`
      ),
      tags: ['advanced', 'traditional', 'storm-at-sea', 'optical'],
    },
    {
      name: "Grandmother's Choice",
      category: 'Traditional',
      subcategory: null,
      svgData: svgWrap(
        `<rect x="0" y="0" width="100" height="100" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="0,0 50,0 25,25" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="50,0 100,0 75,25" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="25,25 75,25 75,75 25,75" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="0,100 25,75 50,100" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="50,100 75,75 100,100" fill="#D4883C" stroke="#333" stroke-width="0.5"/>`
      ),
      tags: ['intermediate', 'traditional', 'grandmothers-choice'],
    },
    {
      name: "Jacob's Ladder",
      category: 'Traditional',
      subcategory: null,
      svgData: svgWrap(
        `<polygon points="0,0 25,0 0,25" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="25,0 25,25 0,25" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="25,0 50,0 50,25 25,25" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="50,0 75,0 75,25 50,25" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="75,0 100,0 100,25" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="75,0 75,25 100,25" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
          `<rect x="0" y="25" width="25" height="25" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
          `<rect x="25" y="25" width="25" height="25" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
          `<rect x="50" y="25" width="25" height="25" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
          `<rect x="75" y="25" width="25" height="25" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
          `<rect x="0" y="50" width="50" height="50" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="0,50 50,50 0,100" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
          `<rect x="50" y="50" width="50" height="50" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="50,50 100,50 100,100" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>`
      ),
      tags: ['intermediate', 'traditional', 'jacobs-ladder'],
    },
    {
      name: 'Card Trick',
      category: 'Traditional',
      subcategory: null,
      svgData: svgWrap(
        `<rect x="0" y="0" width="100" height="100" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="0,0 50,0 50,50" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="50,0 100,0 50,50" fill="#C9A06E" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="0,0 0,50 50,50" fill="#B8860B" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="100,0 100,50 50,50" fill="#E53935" stroke="#333" stroke-width="0.5"/>` +
          `<rect x="25" y="25" width="50" height="50" fill="#FAF8F5" stroke="#333" stroke-width="0.5"/>`
      ),
      tags: ['intermediate', 'traditional', 'card-trick', 'optical'],
    },
    {
      name: 'Maple Leaf',
      category: 'Traditional',
      subcategory: null,
      svgData: svgWrap(
        `<rect x="0" y="0" width="100" height="100" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="0,0 33,0 33,33" fill="#4CAF50" stroke="#333" stroke-width="0.5"/>` +
          `<rect x="33" y="0" width="34" height="33" fill="#4CAF50" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="67,0 100,0 67,33" fill="#4CAF50" stroke="#333" stroke-width="0.5"/>` +
          `<rect x="0" y="33" width="33" height="34" fill="#4CAF50" stroke="#333" stroke-width="0.5"/>` +
          `<rect x="33" y="33" width="34" height="34" fill="#4CAF50" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="67,67 100,67 100,100" fill="#4CAF50" stroke="#333" stroke-width="0.5"/>` +
          `<rect x="48" y="67" width="4" height="33" fill="#5D4037" stroke="none"/>`
      ),
      tags: ['intermediate', 'traditional', 'maple-leaf', 'nature'],
    },
    {
      name: 'Basket',
      category: 'Traditional',
      subcategory: null,
      svgData: svgWrap(
        `<rect x="0" y="0" width="100" height="100" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="10,90 50,30 90,90" fill="#C9A06E" stroke="#333" stroke-width="0.5"/>` +
          `<line x1="30" y1="60" x2="70" y2="60" stroke="#333" stroke-width="1"/>` +
          `<line x1="20" y1="75" x2="80" y2="75" stroke="#333" stroke-width="1"/>` +
          `<path d="M35,30 Q50,5 65,30" fill="none" stroke="#C9A06E" stroke-width="3"/>`
      ),
      tags: ['intermediate', 'traditional', 'basket'],
    },
    {
      name: 'Windmill',
      category: 'Traditional',
      subcategory: null,
      svgData: svgWrap(
        `<polygon points="0,0 50,50 0,50" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="0,0 50,0 50,50" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="50,0 100,0 50,50" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="100,0 100,50 50,50" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="50,50 100,50 100,100" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="50,50 50,100 100,100" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="0,50 50,50 50,100" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="0,50 0,100 50,100" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>`
      ),
      tags: ['beginner', 'traditional', 'windmill'],
    },
    {
      name: 'Double Wedding Ring',
      category: 'Traditional',
      subcategory: null,
      svgData: svgWrap(
        `<rect x="0" y="0" width="100" height="100" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
          `<path d="M15,50 Q15,15 50,15 Q85,15 85,50 Q85,85 50,85 Q15,85 15,50 Z" fill="none" stroke="#D4883C" stroke-width="8"/>` +
          `<circle cx="50" cy="50" r="15" fill="#C9A06E" stroke="#333" stroke-width="0.5"/>`
      ),
      tags: ['advanced', 'traditional', 'wedding-ring', 'curve'],
    },
  ];

  variations.push(...additionalTraditional);

  // Additional modern blocks
  const additionalModern: BlockDefinition[] = [
    {
      name: 'Chevron',
      category: 'Modern',
      subcategory: null,
      svgData: svgWrap(
        `<polygon points="0,0 50,25 100,0 100,50 50,75 0,50" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="0,50 50,75 100,50 100,100 50,100 0,100" fill="#C9A06E" stroke="#333" stroke-width="0.5"/>`
      ),
      tags: ['beginner', 'modern', 'chevron'],
    },
    {
      name: 'Arrow',
      category: 'Modern',
      subcategory: null,
      svgData: svgWrap(
        `<rect x="0" y="0" width="100" height="100" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="50,10 80,50 60,50 60,90 40,90 40,50 20,50" fill="#D4883C" stroke="#333" stroke-width="0.5"/>`
      ),
      tags: ['beginner', 'modern', 'arrow', 'directional'],
    },
    {
      name: 'Zig Zag',
      category: 'Modern',
      subcategory: null,
      svgData: svgWrap(
        `<polygon points="0,0 25,50 0,100 0,0" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="0,0 25,50 50,0" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="25,50 50,0 50,100 25,50 0,100" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="50,0 75,50 50,100" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="50,0 75,50 100,0" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="75,50 100,0 100,100" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="75,50 100,100 50,100" fill="#D4883C" stroke="#333" stroke-width="0.5"/>`
      ),
      tags: ['intermediate', 'modern', 'zig-zag'],
    },
    {
      name: 'Plus Sign',
      category: 'Modern',
      subcategory: null,
      svgData: svgWrap(
        `<rect x="0" y="0" width="100" height="100" fill="#FAF8F5" stroke="#333" stroke-width="0.5"/>` +
          `<rect x="30" y="0" width="40" height="100" fill="#D4883C" stroke="none"/>` +
          `<rect x="0" y="30" width="100" height="40" fill="#D4883C" stroke="none"/>`
      ),
      tags: ['beginner', 'modern', 'plus', 'cross'],
    },
    {
      name: 'X Block',
      category: 'Modern',
      subcategory: null,
      svgData: svgWrap(
        `<rect x="0" y="0" width="100" height="100" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="0,0 15,0 100,85 100,100 85,100 0,15" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="85,0 100,0 100,15 15,100 0,100 0,85" fill="#D4883C" stroke="#333" stroke-width="0.5"/>`
      ),
      tags: ['beginner', 'modern', 'x-block'],
    },
  ];

  variations.push(...additionalModern);

  // Foundation Paper Piecing blocks
  const fppBlocks: BlockDefinition[] = [
    {
      name: 'FPP Star',
      category: 'Foundation Paper Piecing',
      subcategory: null,
      svgData: svgWrap(
        `<rect x="0" y="0" width="100" height="100" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="${starPolygon(50, 50, 48, 25, 6)}" fill="#7B1FA2" stroke="#333" stroke-width="0.5"/>`
      ),
      tags: ['advanced', 'fpp', 'star', 'paper-piecing'],
    },
    {
      name: 'FPP Diamond',
      category: 'Foundation Paper Piecing',
      subcategory: null,
      svgData: svgWrap(
        `<rect x="0" y="0" width="100" height="100" fill="#E8EAF6" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="50,5 95,50 50,95 5,50" fill="#283593" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="50,20 80,50 50,80 20,50" fill="#E8EAF6" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="50,35 65,50 50,65 35,50" fill="#283593" stroke="#333" stroke-width="0.5"/>`
      ),
      tags: ['advanced', 'fpp', 'diamond', 'paper-piecing'],
    },
    {
      name: 'FPP Arrow',
      category: 'Foundation Paper Piecing',
      subcategory: null,
      svgData: svgWrap(
        `<rect x="0" y="0" width="100" height="100" fill="#FCE4EC" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="50,5 90,40 70,40 70,95 30,95 30,40 10,40" fill="#E91E63" stroke="#333" stroke-width="0.5"/>`
      ),
      tags: ['intermediate', 'fpp', 'arrow', 'paper-piecing'],
    },
  ];

  variations.push(...fppBlocks);

  // Kaleidoscope blocks
  for (const color of colors.slice(0, 8)) {
    variations.push({
      name: `${color.name} Kaleidoscope`,
      category: 'Kaleidoscope',
      subcategory: null,
      svgData: svgWrap(
        `<rect x="0" y="0" width="100" height="100" fill="${color.bg}" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="50,0 100,50 50,100 0,50" fill="${color.fill}" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="50,20 80,50 50,80 20,50" fill="${color.bg}" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="50,35 65,50 50,65 35,50" fill="${color.fill}" stroke="#333" stroke-width="0.5"/>`
      ),
      tags: ['advanced', 'kaleidoscope', color.name.toLowerCase()],
    });
  }

  // Hourglass color variations
  for (const color of colors.slice(0, 8)) {
    variations.push({
      name: `${color.name} Hourglass`,
      category: 'Triangles',
      subcategory: null,
      svgData: svgWrap(
        `<polygon points="0,0 100,0 50,50" fill="${color.fill}" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="0,0 50,50 0,100" fill="${color.bg}" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="100,0 100,100 50,50" fill="${color.bg}" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="0,100 50,50 100,100" fill="${color.fill}" stroke="#333" stroke-width="0.5"/>`
      ),
      tags: ['beginner', 'hourglass', 'triangle', color.name.toLowerCase()],
    });
  }

  // Square-in-a-Square color variations
  for (const color of colors.slice(0, 6)) {
    variations.push({
      name: `${color.name} Economy`,
      category: 'Squares',
      subcategory: null,
      svgData: svgWrap(
        `<rect x="0" y="0" width="100" height="100" fill="${color.bg}" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="50,10 90,50 50,90 10,50" fill="${color.fill}" stroke="#333" stroke-width="0.5"/>`
      ),
      tags: ['beginner', 'economy', 'square-in-square', color.name.toLowerCase()],
    });
  }

  // Curve color variations (Drunkard's Path)
  for (const color of colors.slice(0, 6)) {
    variations.push({
      name: `${color.name} Drunkard's Path`,
      category: 'Curves',
      subcategory: null,
      svgData: svgWrap(
        `<rect x="0" y="0" width="100" height="100" fill="${color.bg}" stroke="#333" stroke-width="0.5"/>` +
          `<path d="M0,0 Q50,0 50,50 Q0,50 0,0 Z" fill="${color.fill}" stroke="#333" stroke-width="0.5"/>`
      ),
      tags: ['intermediate', 'curve', 'drunkards-path', color.name.toLowerCase()],
    });
  }

  // Log Cabin color variations
  for (const color of colors.slice(0, 5)) {
    variations.push({
      name: `${color.name} Log Cabin`,
      category: 'Log Cabin',
      subcategory: null,
      svgData: svgWrap(
        `<rect x="0" y="0" width="100" height="100" fill="${color.bg}" stroke="#333" stroke-width="0.5"/>` +
          `<rect x="35" y="35" width="30" height="30" fill="#E53935" stroke="#333" stroke-width="0.5"/>` +
          `<rect x="20" y="20" width="60" height="15" fill="${color.fill}" stroke="#333" stroke-width="0.5"/>` +
          `<rect x="65" y="35" width="15" height="45" fill="${color.bg}" stroke="#333" stroke-width="0.5"/>` +
          `<rect x="20" y="65" width="45" height="15" fill="${color.fill}" stroke="#333" stroke-width="0.5"/>` +
          `<rect x="20" y="35" width="15" height="30" fill="${color.bg}" stroke="#333" stroke-width="0.5"/>`
      ),
      tags: ['beginner', 'log-cabin', color.name.toLowerCase()],
    });
  }

  // Hexagon color variations
  for (const color of colors.slice(0, 5)) {
    variations.push({
      name: `${color.name} Hexagon`,
      category: 'Hexagons',
      subcategory: null,
      svgData: svgWrap(
        `<rect x="0" y="0" width="100" height="100" fill="${color.bg}" stroke="none"/>` +
          `<polygon points="50,3 93,27 93,73 50,97 7,73 7,27" fill="${color.fill}" stroke="#333" stroke-width="0.5"/>`
      ),
      tags: ['intermediate', 'hexagon', 'epp', color.name.toLowerCase()],
    });
  }

  // Additional unique named blocks
  const namedExtras: BlockDefinition[] = [
    {
      name: 'Snowball',
      category: 'Traditional',
      subcategory: null,
      svgData: svgWrap(
        `<rect x="0" y="0" width="100" height="100" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="0,0 25,0 0,25" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="75,0 100,0 100,25" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="0,75 0,100 25,100" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="75,100 100,100 100,75" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>`
      ),
      tags: ['beginner', 'traditional', 'snowball'],
    },
    {
      name: 'Cathedral Window',
      category: 'Traditional',
      subcategory: null,
      svgData: svgWrap(
        `<rect x="0" y="0" width="100" height="100" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
          `<circle cx="50" cy="50" r="40" fill="none" stroke="#D4883C" stroke-width="3"/>` +
          `<path d="M50,10 Q90,50 50,90 Q10,50 50,10 Z" fill="#D4883C" stroke="#333" stroke-width="0.5" opacity="0.3"/>` +
          `<circle cx="50" cy="50" r="20" fill="#C9A06E" stroke="#333" stroke-width="0.5"/>`
      ),
      tags: ['advanced', 'traditional', 'cathedral-window'],
    },
    {
      name: 'Bow Tie Variation',
      category: 'Traditional',
      subcategory: null,
      svgData: svgWrap(
        `<rect x="0" y="0" width="50" height="50" fill="#C9A06E" stroke="#333" stroke-width="0.5"/>` +
          `<rect x="50" y="0" width="50" height="50" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
          `<rect x="0" y="50" width="50" height="50" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
          `<rect x="50" y="50" width="50" height="50" fill="#C9A06E" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="25,25 50,50 75,25" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="25,75 50,50 75,75" fill="#D4883C" stroke="#333" stroke-width="0.5"/>`
      ),
      tags: ['beginner', 'traditional', 'bow-tie'],
    },
    {
      name: 'Tumbler',
      category: 'Modern',
      subcategory: null,
      svgData: svgWrap(
        `<rect x="0" y="0" width="100" height="100" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="20,0 80,0 90,100 10,100" fill="#D4883C" stroke="#333" stroke-width="0.5"/>`
      ),
      tags: ['beginner', 'modern', 'tumbler'],
    },
    {
      name: 'Pineapple',
      category: 'Log Cabin',
      subcategory: 'Pineapple',
      svgData: svgWrap(
        `<rect x="0" y="0" width="100" height="100" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="50,5 95,50 50,95 5,50" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="50,20 80,50 50,80 20,50" fill="#C9A06E" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="50,35 65,50 50,65 35,50" fill="#D4883C" stroke="#333" stroke-width="0.5"/>` +
          `<rect x="43" y="43" width="14" height="14" fill="#E53935" stroke="#333" stroke-width="0.5"/>`
      ),
      tags: ['advanced', 'log-cabin', 'pineapple'],
    },
    {
      name: 'Ocean Waves',
      category: 'Traditional',
      subcategory: null,
      svgData: svgWrap(
        `<polygon points="0,0 50,0 25,25" fill="#1976D2" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="50,0 100,0 75,25" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="25,25 75,25 50,50" fill="#1976D2" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="0,0 25,25 0,50" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="100,0 100,50 75,25" fill="#1976D2" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="0,50 25,75 0,100" fill="#1976D2" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="50,50 25,75 75,75" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="100,50 75,75 100,100" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="25,75 50,100 0,100" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="75,75 100,100 50,100" fill="#1976D2" stroke="#333" stroke-width="0.5"/>`
      ),
      tags: ['advanced', 'traditional', 'ocean-waves'],
    },
    {
      name: 'Attic Windows',
      category: 'Traditional',
      subcategory: null,
      svgData: svgWrap(
        `<rect x="15" y="0" width="85" height="85" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="0,15 15,0 15,85 0,100" fill="#8B8B8B" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="0,100 15,85 100,85 100,100" fill="#6B6B6B" stroke="#333" stroke-width="0.5"/>`
      ),
      tags: ['intermediate', 'traditional', 'attic-windows', '3d'],
    },
    {
      name: 'Dresden Fan',
      category: 'Dresden',
      subcategory: 'Fan',
      svgData: (() => {
        const blades = 6;
        let paths = `<rect x="0" y="0" width="100" height="100" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>`;
        const fills = ['#D4883C', '#C9A06E', '#B8860B', '#E53935', '#4CAF50', '#1976D2'];
        for (let i = 0; i < blades; i++) {
          const a1 = (((i * 90) / blades + 180) * Math.PI) / 180;
          const a2 = ((((i + 1) * 90) / blades + 180) * Math.PI) / 180;
          const r = 90;
          const x1 = 100 + r * Math.cos(a1);
          const y1 = 100 + r * Math.sin(a1);
          const x2 = 100 + r * Math.cos(a2);
          const y2 = 100 + r * Math.sin(a2);
          paths += `<polygon points="100,100 ${x1},${y1} ${x2},${y2}" fill="${fills[i % fills.length]}" stroke="#333" stroke-width="0.5"/>`;
        }
        return svgWrap(paths);
      })(),
      tags: ['intermediate', 'dresden', 'fan', 'applique'],
    },
  ];

  variations.push(...namedExtras);

  // Mariner's Compass variations
  for (const color of colors.slice(0, 6)) {
    variations.push({
      name: `${color.name} Compass`,
      category: "Mariner's Compass",
      subcategory: null,
      svgData: svgWrap(
        `<circle cx="50" cy="50" r="48" fill="${color.bg}" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="${starPolygon(50, 50, 45, 18, 8)}" fill="${color.fill}" stroke="#333" stroke-width="0.5"/>` +
          `<circle cx="50" cy="50" r="10" fill="${color.bg}" stroke="#333" stroke-width="0.5"/>`
      ),
      tags: ['advanced', 'compass', 'mariners', color.name.toLowerCase()],
    });
  }

  // Chevron color variations
  for (const color of colors.slice(0, 6)) {
    variations.push({
      name: `${color.name} Chevron`,
      category: 'Modern',
      subcategory: null,
      svgData: svgWrap(
        `<polygon points="0,0 50,25 100,0 100,50 50,75 0,50" fill="${color.fill}" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="0,50 50,75 100,50 100,100 50,100 0,100" fill="${color.bg}" stroke="#333" stroke-width="0.5"/>`
      ),
      tags: ['beginner', 'modern', 'chevron', color.name.toLowerCase()],
    });
  }

  // Windmill color variations
  for (const color of colors.slice(0, 6)) {
    variations.push({
      name: `${color.name} Windmill`,
      category: 'Traditional',
      subcategory: null,
      svgData: svgWrap(
        `<polygon points="0,0 50,50 0,50" fill="${color.fill}" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="0,0 50,0 50,50" fill="${color.bg}" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="50,0 100,0 50,50" fill="${color.fill}" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="100,0 100,50 50,50" fill="${color.bg}" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="50,50 100,50 100,100" fill="${color.fill}" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="50,50 50,100 100,100" fill="${color.bg}" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="0,50 50,50 50,100" fill="${color.fill}" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="0,50 0,100 50,100" fill="${color.bg}" stroke="#333" stroke-width="0.5"/>`
      ),
      tags: ['beginner', 'traditional', 'windmill', color.name.toLowerCase()],
    });
  }

  // Snowball color variations
  for (const color of colors.slice(0, 6)) {
    variations.push({
      name: `${color.name} Snowball`,
      category: 'Traditional',
      subcategory: null,
      svgData: svgWrap(
        `<rect x="0" y="0" width="100" height="100" fill="${color.fill}" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="0,0 25,0 0,25" fill="${color.bg}" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="75,0 100,0 100,25" fill="${color.bg}" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="0,75 0,100 25,100" fill="${color.bg}" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="75,100 100,100 100,75" fill="${color.bg}" stroke="#333" stroke-width="0.5"/>`
      ),
      tags: ['beginner', 'traditional', 'snowball', color.name.toLowerCase()],
    });
  }

  // Arrow color variations
  for (const color of colors.slice(0, 6)) {
    variations.push({
      name: `${color.name} Arrow`,
      category: 'Modern',
      subcategory: null,
      svgData: svgWrap(
        `<rect x="0" y="0" width="100" height="100" fill="${color.bg}" stroke="#333" stroke-width="0.5"/>` +
          `<polygon points="50,10 80,50 60,50 60,90 40,90 40,50 20,50" fill="${color.fill}" stroke="#333" stroke-width="0.5"/>`
      ),
      tags: ['beginner', 'modern', 'arrow', color.name.toLowerCase()],
    });
  }

  return variations;
}

export function getAllBlockDefinitions(): BlockDefinition[] {
  const originals = [
    ...traditionalBlocks,
    ...logCabinBlocks,
    ...starBlocks,
    ...pinwheelBlocks,
    ...flyingGeeseBlocks,
    ...triangleBlocks,
    ...squareBlocks,
    ...diamondBlocks,
    ...modernBlocks,
    ...curveBlocks,
    ...hexagonBlocks,
    ...dresdenBlocks,
    ...appliqueBlocks,
    ...generateVariations(),
  ];

  const existingNames = new Set(originals.map((b) => b.name));
  const generated = getGeneratedBlocks().filter((b) => !existingNames.has(b.name));

  return [...originals, ...generated];
}
