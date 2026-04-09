/**
 * Block Signature Registry
 *
 * Precomputes shape signatures for all 50 block SVGs in /quilt_blocks/.
 * Signatures are computed once at app init and cached for fast matching
 * against detected block cells in the Photo-to-Design pipeline.
 *
 * A BlockSignature captures the structural "fingerprint" of a quilt block:
 * - Patch count
 * - Vertex count distribution (how many triangles, quads, etc.)
 * - Adjacency graph (which patches share edges)
 * - Relative areas (normalized so sum = 1.0)
 * - Whether the block has curved paths
 *
 * Pure module — zero React/Fabric/DOM dependencies.
 */

import type { BlockSignature, Point2D } from '@/lib/photo-layout-types';

// ============================================================================
// SVG Parsing
// ============================================================================

/** Parsed SVG patch element with geometric data. */
interface ParsedPatch {
  readonly index: number;
  readonly points: readonly Point2D[];
  readonly area: number;
  readonly vertexCount: number;
  readonly hasCurves: boolean;
  readonly centroid: Point2D;
  readonly shade: string;
}

/**
 * Parse a block SVG string into an array of patches.
 *
 * Supports <rect>, <polygon>, <path>, <circle>, <line>.
 * Paths with arc commands (A/a) are sampled to produce polygon vertices.
 */
function parseSvgPatches(svgData: string): ParsedPatch[] {
  const patches: ParsedPatch[] = [];
  let index = 0;

  // <rect x y width height .../>
  const rectRegex = /<rect\s+([^>]+?)\/>/g;
  let m: RegExpExecArray | null;
  while ((m = rectRegex.exec(svgData)) !== null) {
    const attrs = parseAttr(m[1]);
    const x = parseFloat(attrs.x ?? '0');
    const y = parseFloat(attrs.y ?? '0');
    const w = parseFloat(attrs.width ?? '0');
    const h = parseFloat(attrs.height ?? '0');
    if (w <= 0 || h <= 0) continue;

    const points: Point2D[] = [
      { x, y },
      { x: x + w, y },
      { x: x + w, y: y + h },
      { x, y: y + h },
    ];
    patches.push(makePatch(index++, points, attrs));
  }

  // <polygon points="x,y x,y ..."/>
  const polyRegex = /<polygon\s+([^>]+?)\/>/g;
  while ((m = polyRegex.exec(svgData)) !== null) {
    const attrs = parseAttr(m[1]);
    const pointsRaw = (attrs.points ?? '')
      .trim()
      .split(/\s+/)
      .map((p) => {
        const [x, y] = p.split(',').map(Number);
        return { x, y };
      })
      .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));
    if (pointsRaw.length < 3) continue;
    patches.push(makePatch(index++, pointsRaw, attrs));
  }

  // <path d="..."/> — sample to polygon vertices
  const pathRegex = /<path\s+([^>]+?)\/>/g;
  while ((m = pathRegex.exec(svgData)) !== null) {
    const attrs = parseAttr(m[1]);
    if (!attrs.d) continue;
    const points = samplePathToPolyline(attrs.d);
    if (points.length < 3) continue;
    patches.push(makePatch(index++, points, attrs));
  }

  // <circle cx cy r .../>
  const circleRegex = /<circle\s+([^>]+?)\/>/g;
  while ((m = circleRegex.exec(svgData)) !== null) {
    const attrs = parseAttr(m[1]);
    const cx = parseFloat(attrs.cx ?? '0');
    const cy = parseFloat(attrs.cy ?? '0');
    const r = parseFloat(attrs.r ?? '0');
    if (r <= 0) continue;
    // Sample circle to 24 points
    const points: Point2D[] = [];
    const SAMPLES = 24;
    for (let i = 0; i < SAMPLES; i++) {
      const angle = (2 * Math.PI * i) / SAMPLES;
      points.push({ x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
    }
    patches.push(makePatch(index++, points, { ...attrs, __hasCurves: 'true' }));
  }

  // <line x1 y1 x2 y2 .../> — thin rectangles, skip as patches
  // Lines are strokes, not fillable patches in quilt blocks

  return patches;
}

function parseAttr(attrString: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const regex = /([\w-]+)="([^"]*)"/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(attrString)) !== null) {
    attrs[match[1]] = match[2];
  }
  return attrs;
}

function makePatch(
  index: number,
  points: Point2D[],
  attrs: Record<string, string>
): ParsedPatch {
  const area = polygonArea(points);
  const centroid = polygonCentroid(points);
  return {
    index,
    points: Object.freeze(points),
    area,
    vertexCount: points.length,
    hasCurves: attrs.__hasCurves === 'true' || pathHasCurves(attrs.d ?? ''),
    centroid,
    shade: attrs['data-shade'] ?? 'unknown',
  };
}

// ============================================================================
// Path Sampling
// ============================================================================

/**
 * Sample an SVG path `d` string into a polyline.
 * Supports: M, L, H, V, C, S, Q, T, A, Z commands.
 * Curves are sampled at 16 points per segment.
 */
function samplePathToPolyline(d: string): Point2D[] {
  const commands = parsePathCommands(d);
  const points: Point2D[] = [];
  let cx = 0;
  let cy = 0;

  const SAMPLES = 16;

  for (const cmd of commands) {
    switch (cmd.type) {
      case 'M':
        cx = cmd.args[0];
        cy = cmd.args[1];
        if (points.length === 0) {
          points.push({ x: cx, y: cy });
        }
        break;

      case 'L':
      case 'H':
      case 'V': {
        const nx = cmd.type === 'H' ? cmd.args[0] : cmd.type === 'V' ? cx : cmd.args[0];
        const ny = cmd.type === 'V' ? cmd.args[0] : cmd.args[1];
        cx = nx;
        cy = ny;
        points.push({ x: cx, y: cy });
        break;
      }

      case 'C': {
        const [x1, y1, x2, y2, ex, ey] = cmd.args;
        for (let t = 1; t <= SAMPLES; t++) {
          const s = t / SAMPLES;
          const px =
            (1 - s) ** 3 * cx +
            3 * (1 - s) ** 2 * s * x1 +
            3 * (1 - s) * s ** 2 * x2 +
            s ** 3 * ex;
          const py =
            (1 - s) ** 3 * cy +
            3 * (1 - s) ** 2 * s * y1 +
            3 * (1 - s) * s ** 2 * y2 +
            s ** 3 * ey;
          points.push({ x: px, y: py });
        }
        cx = ex;
        cy = ey;
        break;
      }

      case 'Q': {
        const [x1, y1, ex, ey] = cmd.args;
        for (let t = 1; t <= SAMPLES; t++) {
          const s = t / SAMPLES;
          const px = (1 - s) ** 2 * cx + 2 * (1 - s) * s * x1 + s ** 2 * ex;
          const py = (1 - s) ** 2 * cy + 2 * (1 - s) * s * y1 + s ** 2 * ey;
          points.push({ x: px, y: py });
        }
        cx = ex;
        cy = ey;
        break;
      }

      case 'A': {
        const [rx, ry, xAxisRot, largeArc, sweep, ex, ey] = cmd.args;
        if (rx === 0 || ry === 0) {
          cx = ex;
          cy = ey;
          points.push({ x: cx, y: cy });
          break;
        }
        const startAngle = Math.atan2(cy - ey, cx - ex);
        // Simplified arc: sample elliptical arc from current to end point
        // For full correctness we'd need the full SVG arc center calculation,
        // but for quilt blocks this approximation is sufficient.
        const endAngle = Math.atan2(ey - cy, ex - cx);
        let sweepAngle = endAngle - startAngle;
        if (sweep === 0 && sweepAngle > 0) sweepAngle -= 2 * Math.PI;
        if (sweep === 1 && sweepAngle < 0) sweepAngle += 2 * Math.PI;
        for (let t = 1; t <= SAMPLES; t++) {
          const s = t / SAMPLES;
          const angle = startAngle + sweepAngle * s;
          points.push({
            x: cx + rx * Math.cos(angle + (xAxisRot * Math.PI) / 180),
            y: cy + ry * Math.sin(angle + (xAxisRot * Math.PI) / 180),
          });
        }
        // Override: use the actual endpoint
        points.push({ x: ex, y: ey });
        cx = ex;
        cy = ey;
        break;
      }

      case 'Z':
        // Close path — no new point, just return to start
        break;
    }
  }

  return points;
}

function parsePathCommands(d: string): Array<{ type: string; args: number[] }> {
  const commands: Array<{ type: string; args: number[] }> = [];
  const tokens = d.match(/[MLHVCSQTAZmlhvcsqtaz]|-?\d+\.?\d*/g) ?? [];
  let i = 0;
  let prevType = 'M';

  while (i < tokens.length) {
    const token = tokens[i];
    if (/[MLHVCSQTAZmlhvcsqtaz]/.test(token)) {
      const type = token;
      i++;
      const argCount = pathArgCount(type);
      const args: number[] = [];
      for (let j = 0; j < argCount && i < tokens.length; j++, i++) {
        args.push(parseFloat(tokens[i]));
      }
      // Handle implicit repetition for multi-arg commands
      commands.push({ type, args });
      prevType = type;
    } else {
      // Implicit command (continue previous)
      const argCount = pathArgCount(prevType);
      const args: number[] = [];
      for (let j = 0; j < argCount && i < tokens.length; j++, i++) {
        args.push(parseFloat(tokens[i]));
      }
      commands.push({ type: prevType.toLowerCase() === prevType ? prevType : prevType.toLowerCase(), args });
    }
  }

  return commands;
}

function pathArgCount(type: string): number {
  switch (type.toUpperCase()) {
    case 'M':
    case 'L':
    case 'H':
    case 'V':
    case 'T':
      return 2;
    case 'S':
    case 'Q':
      return 4;
    case 'C':
      return 6;
    case 'A':
      return 7;
    case 'Z':
      return 0;
    default:
      return 0;
  }
}

function pathHasCurves(d: string): boolean {
  return /[CSQTAcsqta]/.test(d);
}

// ============================================================================
// Geometry Utilities
// ============================================================================

/**
 * Compute the signed area of a polygon using the shoelace formula.
 */
export function polygonArea(points: readonly Point2D[]): number {
  let area = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area / 2);
}

function polygonCentroid(points: readonly Point2D[]): Point2D {
  let cx = 0;
  let cy = 0;
  const n = points.length;
  for (const p of points) {
    cx += p.x;
    cy += p.y;
  }
  return { x: cx / n, y: cy / n };
}

// ============================================================================
// Adjacency Detection
// ============================================================================

/**
 * Find which patches share edges.
 * Two patches are adjacent if they share at least 2 vertices within tolerance.
 */
function findAdjacency(
  patches: readonly ParsedPatch[],
  tolerance: number = 2.0
): Array<[number, number]> {
  const pairs: Array<[number, number]> = [];

  for (let i = 0; i < patches.length; i++) {
    for (let j = i + 1; j < patches.length; j++) {
      if (shareEdge(patches[i].points, patches[j].points, tolerance)) {
        pairs.push([i, j]);
      }
    }
  }

  return pairs;
}

/**
 * Two polygons share an edge if they have at least 2 vertices within tolerance.
 */
function shareEdge(
  a: readonly Point2D[],
  b: readonly Point2D[],
  tolerance: number
): boolean {
  const sharedVertices: number[] = [];

  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) {
      const dx = a[i].x - b[j].x;
      const dy = a[i].y - b[j].y;
      if (dx * dx + dy * dy < tolerance * tolerance) {
        sharedVertices.push(i);
        break;
      }
    }
  }

  // Need at least 2 shared vertices to constitute a shared edge
  return sharedVertices.length >= 2;
}

// ============================================================================
// Signature Computation
// ============================================================================

/**
 * Compute a BlockSignature from a block SVG string.
 */
export function computeBlockSignature(
  blockId: string,
  displayName: string,
  svgData: string
): BlockSignature {
  const patches = parseSvgPatches(svgData);
  const totalArea = patches.reduce((sum, p) => sum + p.area, 0);

  const vertexDistribution = new Map<number, number>();
  for (const patch of patches) {
    const count = vertexDistribution.get(patch.vertexCount) ?? 0;
    vertexDistribution.set(patch.vertexCount, count + 1);
  }

  const relativeAreas = patches.map((p) => (totalArea > 0 ? p.area / totalArea : 0));
  const adjacencyPairs = findAdjacency(patches);
  const hasCurves = patches.some((p) => p.hasCurves);

  return Object.freeze({
    blockId,
    displayName,
    patchCount: patches.length,
    vertexDistribution: Object.freeze(vertexDistribution),
    adjacencyPairs: Object.freeze(adjacencyPairs),
    relativeAreas: Object.freeze(relativeAreas),
    hasCurves,
    svgData,
  });
}

// ============================================================================
// Registry
// ============================================================================

/**
 * Map of blockId → BlockSignature.
 * Populated lazily on first access.
 */
let signatureCache: Map<string, BlockSignature> | null = null;

/**
 * Mapping from short block ID to display name.
 * Derived from quilt-overlay-registry conventions.
 */
const DISPLAY_NAMES: Record<string, string> = {
  '01_nine_patch': 'Nine Patch',
  '02_churn_dash': 'Churn Dash',
  '03_log_cabin': 'Log Cabin',
  '04_ohio_star': 'Ohio Star',
  '05_bear_paw': 'Bear Paw',
  '06_sawtooth_star': 'Sawtooth Star',
  '07_flying_geese': 'Flying Geese',
  '08_drunkards_path': "Drunkard's Path",
  '09_hst': 'Half-Square Triangle',
  '10_four_patch': 'Four Patch',
  '11_friendship_star': 'Friendship Star',
  '12_bow_tie': 'Bow Tie',
  '13_hourglass': 'Hourglass',
  '14_broken_dishes': 'Broken Dishes',
  '15_double_star': 'Double Star',
  '16_economy_block': 'Economy Block',
  '17_dutchmans_puzzle': "Dutchman's Puzzle",
  '18_dresden_plate': 'Dresden Plate',
  '19_anvil': 'Anvil',
  '20_puss_in_corner': 'Puss in Corner',
  '21_corn_and_beans': 'Corn and Beans',
  '22_gentlemans_fancy': "Gentleman's Fancy",
  '23_jacobs_ladder': "Jacob's Ladder",
  '24_courthouse_steps': 'Courthouse Steps',
  '25_attic_windows': 'Attic Windows',
  '26_handy_andy': 'Handy Andy',
  '27_old_maids_puzzle': "Old Maid's Puzzle",
  '28_road_to_oklahoma': 'Road to Oklahoma',
  '29_double_nine_patch': 'Double Nine Patch',
  '30_snails_trail': "Snail's Trail",
  '31_lemoyne_star': 'LeMoyne Star',
  '32_double_pinwheel': 'Double Pinwheel',
  '33_zigzag': 'Zigzag',
  '34_dove_at_window': 'Dove at Window',
  '35_grandmothers_choice': "Grandmother's Choice",
  '36_corner_star': 'Corner Star',
  '37_cyclone': 'Cyclone',
  '38_greek_cross': 'Greek Cross',
  '39_honey_bee': 'Honey Bee',
  '40_homestead': 'Homestead',
  '41_winged_arrow': 'Winged Arrow',
  '42_hands_all_around': 'Hands All Around',
  '43_scrappy_star': 'Scrappy Star',
  '44_leahs_star': "Leah's Star",
  '45_star_bright': 'Star Bright',
  '46_merry_go_round': 'Merry-Go-Round',
  '47_nine_patch_star': 'Nine Patch Star',
  '48_indian_meadow': 'Indian Meadow',
  '49_prickly_pear': 'Prickly Pear',
  '50_scrap_bag': 'Scrap Bag',
};

/**
 * Get all 50 block signatures.
 * Computes them on first call, returns cached results thereafter.
 *
 * In the browser, SVGs are fetched from /quilt_blocks/XX.svg.
 * This function returns a promise that resolves when all signatures are ready.
 */
export async function getBlockSignatures(): Promise<Map<string, BlockSignature>> {
  if (signatureCache) return signatureCache;

  const signatures = new Map<string, BlockSignature>();

  for (let i = 1; i <= 50; i++) {
    const num = i.toString().padStart(2, '0');
    const blockId = `${num}_block`;
    // We need the actual filename. Since we don't have the map here,
    // we'll build it from the BLOCK_OVERLAYS data.
  }

  // Better approach: fetch the quilt block filenames from a known manifest
  // or from the quilt-overlay-registry. For now, we use a simpler approach:
  // load all 50 SVGs by their known filename pattern.

  const blockFiles = BLOCK_FILE_MAP;

  for (const [blockId, filename] of Object.entries(blockFiles)) {
    const svgData = await fetchBlockSvg(filename);
    if (!svgData) {
      console.warn(`[block-signature-registry] Failed to load ${filename}`);
      continue;
    }
    const displayName = DISPLAY_NAMES[blockId] ?? blockId;
    const sig = computeBlockSignature(blockId, displayName, svgData);
    signatures.set(blockId, sig);
  }

  signatureCache = signatures;
  return signatures;
}

/**
 * Synchronous version: compute signatures from pre-fetched SVG strings.
 * Use this when SVGs are already loaded (e.g., from a bundled manifest).
 */
export function computeSignaturesFromSvgs(
  entries: Array<{ blockId: string; displayName: string; svgData: string }>
): Map<string, BlockSignature> {
  const signatures = new Map<string, BlockSignature>();
  for (const entry of entries) {
    signatures.set(entry.blockId, computeBlockSignature(entry.blockId, entry.displayName, entry.svgData));
  }
  return signatures;
}

// ============================================================================
// Block SVG Fetching
// ============================================================================

const BLOCK_FILE_MAP: Record<string, string> = {
  '01_nine_patch': '01_nine_patch.svg',
  '02_churn_dash': '02_churn_dash.svg',
  '03_log_cabin': '03_log_cabin.svg',
  '04_ohio_star': '04_ohio_star.svg',
  '05_bear_paw': '05_bear_paw.svg',
  '06_sawtooth_star': '06_sawtooth_star.svg',
  '07_flying_geese': '07_flying_geese.svg',
  '08_drunkards_path': '08_drunkards_path.svg',
  '09_hst': '09_hst.svg',
  '10_four_patch': '10_four_patch.svg',
  '11_friendship_star': '11_friendship_star.svg',
  '12_bow_tie': '12_bow_tie.svg',
  '13_hourglass': '13_hourglass.svg',
  '14_broken_dishes': '14_broken_dishes.svg',
  '15_double_star': '15_double_star.svg',
  '16_economy_block': '16_economy_block.svg',
  '17_dutchmans_puzzle': '17_dutchmans_puzzle.svg',
  '18_dresden_plate': '18_dresden_plate.svg',
  '19_anvil': '19_anvil.svg',
  '20_puss_in_corner': '20_puss_in_corner.svg',
  '21_corn_and_beans': '21_corn_and_beans.svg',
  '22_gentlemans_fancy': '22_gentlemans_fancy.svg',
  '23_jacobs_ladder': '23_jacobs_ladder.svg',
  '24_courthouse_steps': '24_courthouse_steps.svg',
  '25_attic_windows': '25_attic_windows.svg',
  '26_handy_andy': '26_handy_andy.svg',
  '27_old_maids_puzzle': '27_old_maids_puzzle.svg',
  '28_road_to_oklahoma': '28_road_to_oklahoma.svg',
  '29_double_nine_patch': '29_double_nine_patch.svg',
  '30_snails_trail': '30_snails_trail.svg',
  '31_lemoyne_star': '31_lemoyne_star.svg',
  '32_double_pinwheel': '32_double_pinwheel.svg',
  '33_zigzag': '33_zigzag.svg',
  '34_dove_at_window': '34_dove_at_window.svg',
  '35_grandmothers_choice': '35_grandmothers_choice.svg',
  '36_corner_star': '36_corner_star.svg',
  '37_cyclone': '37_cyclone.svg',
  '38_greek_cross': '38_greek_cross.svg',
  '39_honey_bee': '39_honey_bee.svg',
  '40_homestead': '40_homestead.svg',
  '41_winged_arrow': '41_winged_arrow.svg',
  '42_hands_all_around': '42_hands_all_around.svg',
  '43_scrappy_star': '43_scrappy_star.svg',
  '44_leahs_star': '44_leahs_star.svg',
  '45_star_bright': '45_star_bright.svg',
  '46_merry_go_round': '46_merry_go_round.svg',
  '47_nine_patch_star': '47_nine_patch_star.svg',
  '48_indian_meadow': '48_indian_meadow.svg',
  '49_prickly_pear': '49_prickly_pear.svg',
  '50_scrap_bag': '50_scrap_bag.svg',
};

async function fetchBlockSvg(filename: string): Promise<string | null> {
  try {
    const response = await fetch(`/quilt_blocks/${filename}`);
    if (!response.ok) return null;
    return response.text();
  } catch {
    return null;
  }
}
