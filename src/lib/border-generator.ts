/**
 * Pieced / Patterned Border Generator
 *
 * Generates repeating border units (sawtooth, piano-key, flying-geese,
 * checkerboard, HST) and corner treatments for pieced quilt borders.
 *
 * Pure computation — no React or Fabric.js dependency.
 */

import type { BorderConfig } from '@/lib/layout-utils';

// ── Types ──────────────────────────────────────────────────────────

export type BorderPattern =
  | 'sawtooth'
  | 'piano-key'
  | 'flying-geese'
  | 'checkerboard'
  | 'half-square-triangle'
  | 'custom-block';

export type CornerTreatment = 'miter' | 'cornerstone' | 'block-turn';

export interface BorderPieceUnit {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly svgData: string;
  readonly color: string;
  readonly fabricId: string | null;
  readonly rotation: number;
}

export interface PiecedBorderResult {
  readonly topUnits: BorderPieceUnit[];
  readonly bottomUnits: BorderPieceUnit[];
  readonly leftUnits: BorderPieceUnit[];
  readonly rightUnits: BorderPieceUnit[];
  readonly cornerUnits: BorderPieceUnit[];
}

// ── Pattern Generators ─────────────────────────────────────────────

/**
 * Generate sawtooth (alternating HST) units along a line.
 */
export function generateSawtoothUnits(
  length: number,
  unitSize: number,
  color1: string,
  color2: string
): BorderPieceUnit[] {
  const count = Math.max(1, Math.round(length / unitSize));
  const adjustedSize = length / count;
  const units: BorderPieceUnit[] = [];

  for (let i = 0; i < count; i++) {
    const fill1 = i % 2 === 0 ? color1 : color2;
    const fill2 = i % 2 === 0 ? color2 : color1;
    units.push({
      x: i * adjustedSize,
      y: 0,
      width: adjustedSize,
      height: adjustedSize,
      svgData: `<polygon points="0,0 ${adjustedSize},0 0,${adjustedSize}" fill="${fill1}" stroke="#333" stroke-width="0.5"/><polygon points="${adjustedSize},0 ${adjustedSize},${adjustedSize} 0,${adjustedSize}" fill="${fill2}" stroke="#333" stroke-width="0.5"/>`,
      color: fill1,
      fabricId: null,
      rotation: 0,
    });
  }

  return units;
}

/**
 * Generate piano-key (alternating colored rectangles) units along a line.
 */
export function generatePianoKeyUnits(
  length: number,
  unitSize: number,
  color1: string,
  color2: string
): BorderPieceUnit[] {
  const count = Math.max(1, Math.round(length / unitSize));
  const adjustedSize = length / count;
  const units: BorderPieceUnit[] = [];

  for (let i = 0; i < count; i++) {
    const color = i % 2 === 0 ? color1 : color2;
    units.push({
      x: i * adjustedSize,
      y: 0,
      width: adjustedSize,
      height: unitSize,
      svgData: `<rect x="0" y="0" width="${adjustedSize}" height="${unitSize}" fill="${color}" stroke="#333" stroke-width="0.5"/>`,
      color,
      fabricId: null,
      rotation: 0,
    });
  }

  return units;
}

/**
 * Generate flying-geese (directional triangle) units along a line.
 */
export function generateFlyingGeeseUnits(
  length: number,
  unitSize: number,
  color1: string,
  color2: string
): BorderPieceUnit[] {
  const count = Math.max(1, Math.round(length / unitSize));
  const adjustedSize = length / count;
  const halfH = unitSize / 2;
  const units: BorderPieceUnit[] = [];

  for (let i = 0; i < count; i++) {
    units.push({
      x: i * adjustedSize,
      y: 0,
      width: adjustedSize,
      height: unitSize,
      svgData:
        `<polygon points="${adjustedSize / 2},0 ${adjustedSize},${unitSize} 0,${unitSize}" fill="${color1}" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="0,0 ${adjustedSize / 2},0 0,${halfH}" fill="${color2}" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="${adjustedSize / 2},0 ${adjustedSize},0 ${adjustedSize},${halfH}" fill="${color2}" stroke="#333" stroke-width="0.5"/>`,
      color: color1,
      fabricId: null,
      rotation: 0,
    });
  }

  return units;
}

/**
 * Generate checkerboard units (2-row grid) along a line.
 */
export function generateCheckerboardUnits(
  length: number,
  unitSize: number,
  color1: string,
  color2: string
): BorderPieceUnit[] {
  const colCount = Math.max(1, Math.round(length / unitSize));
  const adjustedSize = length / colCount;
  const units: BorderPieceUnit[] = [];
  const rowCount = 2; // Standard 2-row checkerboard border

  for (let row = 0; row < rowCount; row++) {
    for (let col = 0; col < colCount; col++) {
      const color = (row + col) % 2 === 0 ? color1 : color2;
      units.push({
        x: col * adjustedSize,
        y: row * adjustedSize,
        width: adjustedSize,
        height: adjustedSize,
        svgData: `<rect x="0" y="0" width="${adjustedSize}" height="${adjustedSize}" fill="${color}" stroke="#333" stroke-width="0.5"/>`,
        color,
        fabricId: null,
        rotation: 0,
      });
    }
  }

  return units;
}

/**
 * Generate HST (half-square-triangle) units along a line.
 * HST and sawtooth share the same triangle construction.
 */
export function generateHstUnits(
  length: number,
  unitSize: number,
  color1: string,
  color2: string
): BorderPieceUnit[] {
  return generateSawtoothUnits(length, unitSize, color1, color2);
}

// ── Corner Generator ───────────────────────────────────────────────

/**
 * Generate a single corner unit based on the treatment type.
 */
export function generateCornerUnit(
  treatment: CornerTreatment,
  size: number,
  color1: string,
  color2: string
): BorderPieceUnit {
  let svgData: string;

  switch (treatment) {
    case 'cornerstone':
      svgData = `<rect x="0" y="0" width="${size}" height="${size}" fill="${color1}" stroke="#333" stroke-width="0.5"/>`;
      break;
    case 'miter':
      svgData =
        `<polygon points="0,0 ${size},0 0,${size}" fill="${color1}" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="${size},0 ${size},${size} 0,${size}" fill="${color2}" stroke="#333" stroke-width="0.5"/>`;
      break;
    case 'block-turn':
    default:
      svgData =
        `<polygon points="${size / 2},0 ${size},${size} 0,${size}" fill="${color1}" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="0,0 ${size / 2},0 0,${size}" fill="${color2}" stroke="#333" stroke-width="0.5"/>` +
        `<polygon points="${size / 2},0 ${size},0 ${size},${size}" fill="${color2}" stroke="#333" stroke-width="0.5"/>`;
      break;
  }

  return {
    x: 0,
    y: 0,
    width: size,
    height: size,
    svgData,
    color: color1,
    fabricId: null,
    rotation: 0,
  };
}

// ── Main Generator ─────────────────────────────────────────────────

type PatternGenerator = (
  length: number,
  unitSize: number,
  color1: string,
  color2: string
) => BorderPieceUnit[];

const PATTERN_GENERATORS: Record<BorderPattern, PatternGenerator> = {
  sawtooth: generateSawtoothUnits,
  'piano-key': generatePianoKeyUnits,
  'flying-geese': generateFlyingGeeseUnits,
  checkerboard: generateCheckerboardUnits,
  'half-square-triangle': generateHstUnits,
  'custom-block': generatePianoKeyUnits, // Fallback; custom blocks handled separately
};

function offsetUnits(units: BorderPieceUnit[], dx: number, dy: number): BorderPieceUnit[] {
  return units.map((u) => ({ ...u, x: u.x + dx, y: u.y + dy }));
}

/**
 * Generate a complete pieced border with all four sides and corners.
 */
export function generatePiecedBorder(
  innerWidth: number,
  innerHeight: number,
  border: BorderConfig,
  pxPerUnit: number,
  offset: number
): PiecedBorderResult {
  const empty: PiecedBorderResult = {
    topUnits: [],
    bottomUnits: [],
    leftUnits: [],
    rightUnits: [],
    cornerUnits: [],
  };

  if (!border.type || border.type === 'solid') return empty;
  if (!border.pattern) return empty;

  const pattern = border.pattern as BorderPattern;
  const unitSizePx = (border.unitSize ?? border.width) * pxPerUnit;
  const borderWidthPx = border.width * pxPerUnit;
  const color1 = border.color;
  const color2 = border.secondaryColor ?? '#F5F0E8';
  const cornerTreatment = (border.cornerTreatment ?? 'cornerstone') as CornerTreatment;

  const generator = PATTERN_GENERATORS[pattern];
  if (!generator) return empty;

  // Generate units for each side
  const topRaw = generator(innerWidth, unitSizePx, color1, color2);
  const bottomRaw = generator(innerWidth, unitSizePx, color1, color2);
  const leftRaw = generator(innerHeight, unitSizePx, color1, color2);
  const rightRaw = generator(innerHeight, unitSizePx, color1, color2);

  // Offset positions for each side
  // Top/bottom strips span only innerWidth (not including corner widths)
  // Left/right strips span full innerHeight + 2*borderWidth (including corners)
  const topOffset = offset;
  const topUnits = offsetUnits(topRaw, borderWidthPx + offset, topOffset - borderWidthPx);
  const bottomUnits = offsetUnits(bottomRaw, borderWidthPx + offset, innerHeight + offset);
  const leftUnits = offsetUnits(
    leftRaw.map((u) => ({ ...u, x: u.y, y: u.x, rotation: 90 })),
    offset - borderWidthPx,
    offset
  );
  const rightUnits = offsetUnits(
    rightRaw.map((u) => ({ ...u, x: u.y, y: u.x, rotation: 90 })),
    innerWidth + offset,
    offset
  );

  // Generate corner units - placed at the four corners
  const corner = generateCornerUnit(cornerTreatment, borderWidthPx, color1, color2);
  const cornerUnits: BorderPieceUnit[] = [
    { ...corner, x: offset, y: offset - borderWidthPx },
    { ...corner, x: innerWidth + offset, y: offset - borderWidthPx, rotation: 90 },
    { ...corner, x: offset, y: innerHeight + offset, rotation: 270 },
    { ...corner, x: innerWidth + offset, y: innerHeight + offset, rotation: 180 },
  ];

  return { topUnits, bottomUnits, leftUnits, rightUnits, cornerUnits };
}
