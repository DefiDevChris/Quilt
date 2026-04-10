/**
 * Block Piece Measurement Engine
 *
 * Computes exact piece measurements for any of the 50 system blocks
 * at any finished block size using clean grid subdivisions.
 *
 * All 50 blocks are defined in SVG (300×300 viewBox) and converted
 * to real-world measurements by snapping coordinates to a clean grid:
 *   - 12×12 grid  → 1" cells    (simple 3×3, 2×2 blocks)
 *   - 24×24 grid  → 0.5" cells  (half-unit subdivisions)
 *   - 16×16 grid  → 0.75" cells (4×4 blocks)
 *   - 48×48 grid  → 0.25" cells (complex blocks)
 *
 * Scale to any size: multiply all measurements by (targetSize ÷ 12)
 *
 * Usage:
 *   const m = getBlockMeasurements('01_nine_patch', 12);
 *   const scaled = scaleBlockMeasurements(m, 6); // 6" block
 */

export interface Point {
  x: number;
  y: number;
}

export interface PieceMeasurement {
  /** Piece type */
  type: 'rect' | 'triangle' | 'polygon' | 'circle' | 'wedge' | 'path';
  /** Position X in finished block inches */
  x: number;
  /** Position Y in finished block inches */
  y: number;
  /** Width in finished inches */
  width: number;
  /** Height in finished inches */
  height: number;
  /** Polygon points in finished inches (for triangles/polygons) */
  points?: Point[];
  /** Circle radius in finished inches */
  radius?: number;
  /** Shade classification */
  shade?: string;
  /** Human-readable description */
  description: string;
  /** Cut width with ¼" seam allowance */
  cutWidth?: number;
  /** Cut height with ¼" seam allowance */
  cutHeight?: number;
}

export interface BlockMeasurements {
  /** Block ID (e.g., "01_nine_patch") */
  blockId: string;
  /** Display name (e.g., "Nine Patch") */
  displayName: string;
  /** Finished block size in inches */
  finishedSize: number;
  /** Total number of patches */
  patchCount: number;
  /** Grid type used */
  gridType: GridType;
  /** Whether coordinates were approximated */
  isApproximated: boolean;
  /** All piece measurements */
  pieces: PieceMeasurement[];
}

export type GridType = '12x12' | '24x24' | '16x16' | '48x48' | 'curved' | 'irregular';

const SVG_SIZE = 300;

// ─── Block metadata ─────────────────────────────────────────────────

export const BLOCK_GRID_MAP: Record<string, { gridType: GridType; isApproximated: boolean; authoritativeSource?: string }> = {
  '01_nine_patch':       { gridType: '12x12',  isApproximated: false },
  '02_churn_dash':       { gridType: '24x24',  isApproximated: false },
  '03_log_cabin':        { gridType: '48x48',  isApproximated: false },
  '04_ohio_star':        { gridType: '12x12',  isApproximated: false },
  '05_bear_paw':         { gridType: '48x48',  isApproximated: false, authoritativeSource: 'Farm & Folk 12" + Scissortail' },
  '06_sawtooth_star':    { gridType: '12x12',  isApproximated: false },
  '07_flying_geese':     { gridType: '12x12',  isApproximated: false },
  '08_drunkards_path':   { gridType: 'curved', isApproximated: true,  authoritativeSource: 'Farm & Folk 12" + fabricandflowers' },
  '09_hst':              { gridType: '12x12',  isApproximated: false },
  '10_four_patch':       { gridType: '12x12',  isApproximated: false },
  '11_friendship_star':  { gridType: '12x12',  isApproximated: false },
  '12_bow_tie':          { gridType: '12x12',  isApproximated: false },
  '13_hourglass':        { gridType: '12x12',  isApproximated: false },
  '14_broken_dishes':    { gridType: '24x24',  isApproximated: false },
  '15_double_star':      { gridType: '48x48',  isApproximated: false },
  '16_economy_block':    { gridType: '24x24',  isApproximated: false },
  '17_dutchmans_puzzle': { gridType: '24x24',  isApproximated: false },
  '18_dresden_plate':    { gridType: 'curved', isApproximated: true,  authoritativeSource: 'Handmadiya + Nancy Zieman + Matilda\'s Own' },
  '19_anvil':            { gridType: '12x12',  isApproximated: false },
  '20_puss_in_corner':   { gridType: '12x12',  isApproximated: false },
  '21_corn_and_beans':   { gridType: '12x12',  isApproximated: false },
  '22_gentlemans_fancy': { gridType: '24x24',  isApproximated: false },
  '23_jacobs_ladder':    { gridType: '24x24',  isApproximated: false },
  '24_courthouse_steps': { gridType: '24x24',  isApproximated: false },
  '25_attic_windows':    { gridType: '48x48',  isApproximated: false, authoritativeSource: 'MadamSew + Scissortail 12"' },
  '26_handy_andy':       { gridType: '48x48',  isApproximated: false, authoritativeSource: 'QuiltTherapy 12"' },
  '27_old_maids_puzzle': { gridType: '12x12',  isApproximated: false },
  '28_road_to_oklahoma': { gridType: '24x24',  isApproximated: false },
  '29_double_nine_patch':{ gridType: '48x48',  isApproximated: true,  authoritativeSource: 'AllPeopleQuilt + Fabric406' },
  '30_snails_trail':     { gridType: '48x48',  isApproximated: false },
  '31_lemoyne_star':     { gridType: '16x16',  isApproximated: false, authoritativeSource: 'QuiltsByJen + Farm & Folk 12"' },
  '32_double_pinwheel':  { gridType: '24x24',  isApproximated: false },
  '33_zigzag':           { gridType: '16x16',  isApproximated: false },
  '34_dove_at_window':   { gridType: '16x16',  isApproximated: false },
  '35_grandmothers_choice': { gridType: '24x24', isApproximated: false },
  '36_corner_star':      { gridType: '16x16',  isApproximated: false },
  '37_cyclone':          { gridType: '24x24',  isApproximated: false, authoritativeSource: 'Studio 180 Design Cyclone' },
  '38_greek_cross':      { gridType: '12x12',  isApproximated: false, authoritativeSource: 'DelawareQuilts + LakeGirlQuilts 12"' },
  '39_honey_bee':        { gridType: '48x48',  isApproximated: false, authoritativeSource: 'WhyNotSew + AccuQuilt 12"' },
  '40_homestead':        { gridType: '48x48',  isApproximated: false, authoritativeSource: 'FB quilting group 12"' },
  '41_winged_arrow':     { gridType: '24x24',  isApproximated: false },
  '42_hands_all_around': { gridType: '16x16',  isApproximated: false },
  '43_scrappy_star':     { gridType: '24x24',  isApproximated: false },
  '44_leahs_star':       { gridType: '16x16',  isApproximated: false },
  '45_star_bright':      { gridType: '16x16',  isApproximated: false },
  '46_merry_go_round':   { gridType: '12x12',  isApproximated: false },
  '47_nine_patch_star':  { gridType: '24x24',  isApproximated: false },
  '48_indian_meadow':    { gridType: '16x16',  isApproximated: false },
  '49_prickly_pear':     { gridType: '48x48',  isApproximated: false },
  '50_scrap_bag':        { gridType: '48x48',  isApproximated: true  },
};

// ─── Public API ──────────────────────────────────────────────────────

/**
 * Get piece measurements for a block at a specific finished size.
 * Parses the SVG file and converts to clean-grid inch measurements.
 */
export async function getBlockMeasurements(
  blockId: string,
  finishedSize: number = 12,
): Promise<BlockMeasurements> {
  const normalizedId = normalizeBlockId(blockId);
  const gridInfo = BLOCK_GRID_MAP[normalizedId] ?? { gridType: '48x48' as const, isApproximated: true };

  const svgContent = await loadBlockSvg(normalizedId);
  const displayName = extractBlockDisplayName(normalizedId, svgContent);
  const pieces = parseSvgPieces(svgContent, finishedSize, gridInfo.gridType);

  return {
    blockId: normalizedId,
    displayName,
    finishedSize,
    patchCount: pieces.length,
    gridType: gridInfo.gridType,
    isApproximated: gridInfo.isApproximated,
    pieces,
  };
}

/**
 * Scale existing block measurements to a different finished size.
 */
export function scaleBlockMeasurements(
  measurements: BlockMeasurements,
  targetFinishedSize: number,
): BlockMeasurements {
  const ratio = targetFinishedSize / measurements.finishedSize;

  return {
    ...measurements,
    finishedSize: targetFinishedSize,
    pieces: measurements.pieces.map((p) => scalePiece(p, ratio)),
  };
}

/**
 * Get a cutting summary — grouped unique piece shapes with quantities.
 */
export function getCuttingSummary(
  measurements: BlockMeasurements,
): Record<string, { count: number; cutSize: string; finishedSize: string; shade?: string }> {
  const summary: Record<string, { count: number; cutSize: string; finishedSize: string; shade?: string }> = {};

  for (const piece of measurements.pieces) {
    let key: string;
    let cutSize: string;
    let finishedSize: string;

    if (piece.type === 'rect') {
      key = `${piece.width.toFixed(1)}×${piece.height.toFixed(1)} rect`;
      cutSize = `${(piece.cutWidth ?? piece.width + 0.5).toFixed(2)}" × ${(piece.cutHeight ?? piece.height + 0.5).toFixed(2)}"`;
      finishedSize = `${piece.width.toFixed(2)}" × ${piece.height.toFixed(2)}"`;
    } else if (piece.type === 'triangle') {
      key = `${piece.width.toFixed(1)}×${piece.height.toFixed(1)} triangle`;
      cutSize = `${piece.width.toFixed(2)}" × ${piece.height.toFixed(2)}" (finished)`;
      finishedSize = `${piece.width.toFixed(2)}" × ${piece.height.toFixed(2)}"`;
    } else if (piece.type === 'polygon') {
      key = `${piece.points?.length ?? 0}-gon ${piece.width.toFixed(1)}×${piece.height.toFixed(1)}`;
      cutSize = `${piece.width.toFixed(2)}" × ${piece.height.toFixed(2)}" (finished)`;
      finishedSize = `${piece.width.toFixed(2)}" × ${piece.height.toFixed(2)}"`;
    } else if (piece.type === 'circle') {
      key = `circle r=${piece.radius?.toFixed(1)}`;
      cutSize = `${((piece.radius ?? 0) * 2 + 0.5).toFixed(2)}" square`;
      finishedSize = `${((piece.radius ?? 0) * 2).toFixed(2)}" diameter`;
    } else {
      key = piece.type;
      cutSize = 'template required';
      finishedSize = 'varies';
    }

    if (!summary[key]) {
      summary[key] = { count: 0, cutSize, finishedSize, shade: piece.shade };
    }
    summary[key].count++;
  }

  return summary;
}

// ─── Internal ────────────────────────────────────────────────────────

function normalizeBlockId(blockId: string): string {
  // "01" → "01_nine_patch" (try to match known blocks)
  if (/^\d{2}$/.test(blockId)) {
    const known = Object.keys(BLOCK_GRID_MAP).find((k) => k.startsWith(blockId));
    return known ?? blockId;
  }
  // Already full form
  return blockId;
}

async function loadBlockSvg(blockId: string): Promise<string> {
  // Browser: fetch from public endpoint
  if (typeof window !== 'undefined') {
    const resp = await fetch(`/quilt_blocks/${blockId}.svg`);
    return await resp.text();
  }

  // Node.js: read from filesystem
  const fs = await import('fs');
  const path = await import('path');
  const svgDir = path.join(process.cwd(), 'public', 'quilt_blocks');
  return fs.readFileSync(path.join(svgDir, `${blockId}.svg`), 'utf-8');
}

function extractBlockDisplayName(blockId: string, svgContent: string): string {
  // Try XML comment first
  const commentMatch = svgContent.match(/<!--\s*(.+?)\s*-->/);
  if (commentMatch) return commentMatch[1];
  // Fallback: derive from ID
  return blockId
    .replace(/^\d+_/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function parseSvgPieces(
  svgContent: string,
  finishedSize: number,
  gridType: GridType,
): PieceMeasurement[] {
  const scaleFactor = finishedSize / SVG_SIZE;
  const pieces: PieceMeasurement[] = [];

  // ── Rects ──
  const rectRegex = /<rect\s+([^>]+?)\/>/g;
  let match: RegExpExecArray | null;
  while ((match = rectRegex.exec(svgContent)) !== null) {
    const attrs = match[1];
    const x = snapToGrid(parseFloat(attrs.match(/x="([^"]+)"/)?.[1] || '0') * scaleFactor, gridType);
    const y = snapToGrid(parseFloat(attrs.match(/y="([^"]+)"/)?.[1] || '0') * scaleFactor, gridType);
    const w = snapToGrid(parseFloat(attrs.match(/width="([^"]+)"/)?.[1] || '0') * scaleFactor, gridType);
    const h = snapToGrid(parseFloat(attrs.match(/height="([^"]+)"/)?.[1] || '0') * scaleFactor, gridType);
    const shade = attrs.match(/data-shade="([^"]+)"/)?.[1];

    pieces.push({
      type: 'rect',
      x,
      y,
      width: w,
      height: h,
      shade,
      description: `${w.toFixed(2)}" × ${h.toFixed(2)}" rectangle`,
      cutWidth: roundSA(w + 0.5),
      cutHeight: roundSA(h + 0.5),
    });
  }

  // ── Polygons ──
  const polyRegex = /<polygon\s+points="([^"]+)"([^>]*)\/>/g;
  while ((match = polyRegex.exec(svgContent)) !== null) {
    const pointsStr = match[1];
    const attrs = match[2] || '';
    const shade = attrs.match(/data-shade="([^"]+)"/)?.[1];

    const rawPoints = pointsStr.split(' ').map((p) => {
      const [x, y] = p.split(',').map(Number);
      return {
        x: snapToGrid(x * scaleFactor, gridType),
        y: snapToGrid(y * scaleFactor, gridType),
      };
    });

    const xs = rawPoints.map((p) => p.x);
    const ys = rawPoints.map((p) => p.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys);
    const w = roundSA(maxX - minX);
    const h = roundSA(maxY - minY);

    const type = rawPoints.length === 3 ? 'triangle' : 'polygon';

    pieces.push({
      type,
      x: minX,
      y: minY,
      width: w,
      height: h,
      points: rawPoints,
      shade,
      description: `${rawPoints.length}-point shape, ${w.toFixed(2)}" × ${h.toFixed(2)}" bbox`,
      cutWidth: roundSA(w + 0.5),
      cutHeight: roundSA(h + 0.5),
    });
  }

  // ── Paths (curved shapes) ──
  const pathRegex = /<path\s+d="([^"]+)"([^>]*)\/>/g;
  while ((match = pathRegex.exec(svgContent)) !== null) {
    const attrs = match[2] || '';
    const shade = attrs.match(/data-shade="([^"]+)"/)?.[1];

    pieces.push({
      type: 'wedge',
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      shade,
      description: 'Curved wedge/petal shape (template required)',
    });
  }

  // ── Circles ──
  const circleRegex = /<circle\s+([^>]+?)\/>/g;
  while ((match = circleRegex.exec(svgContent)) !== null) {
    const attrs = match[1];
    const cx = snapToGrid(parseFloat(attrs.match(/cx="([^"]+)"/)?.[1] || '0') * scaleFactor, gridType);
    const cy = snapToGrid(parseFloat(attrs.match(/cy="([^"]+)"/)?.[1] || '0') * scaleFactor, gridType);
    const r = snapToGrid(parseFloat(attrs.match(/r="([^"]+)"/)?.[1] || '0') * scaleFactor, gridType);
    const shade = attrs.match(/data-shade="([^"]+)"/)?.[1];

    pieces.push({
      type: 'circle',
      x: cx - r,
      y: cy - r,
      width: r * 2,
      height: r * 2,
      radius: r,
      shade,
      description: `Circle, ${r.toFixed(2)}" radius (${(r * 2).toFixed(2)}" diameter)`,
      cutWidth: roundSA(r * 2 + 0.5),
      cutHeight: roundSA(r * 2 + 0.5),
    });
  }

  return pieces;
}

/**
 * Snap a raw inch value to the nearest clean grid cell.
 */
function snapToGrid(value: number, gridType: GridType): number {
  const cellSize: Record<GridType, number> = {
    '12x12': 1,
    '24x24': 0.5,
    '16x16': 0.75,
    '48x48': 0.25,
    curved: 0.01,  // no snapping for curved
    irregular: 0.25,
  };

  const cell = cellSize[gridType] ?? 0.25;
  return Math.round(value / cell) * cell;
}

function scalePiece(piece: PieceMeasurement, ratio: number): PieceMeasurement {
  return {
    ...piece,
    x: piece.x * ratio,
    y: piece.y * ratio,
    width: piece.width * ratio,
    height: piece.height * ratio,
    radius: piece.radius ? piece.radius * ratio : undefined,
    points: piece.points
      ? piece.points.map((p) => ({ x: p.x * ratio, y: p.y * ratio }))
      : undefined,
    cutWidth: piece.cutWidth ? piece.cutWidth * ratio : undefined,
    cutHeight: piece.cutHeight ? piece.cutHeight * ratio : undefined,
  };
}

/**
 * Round cut sizes to common fractions (⅛" precision) for readability.
 */
function roundSA(value: number): number {
  return Math.round(value * 8) / 8;
}
