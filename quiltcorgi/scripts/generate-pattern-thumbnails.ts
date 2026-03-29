/**
 * Generate visual preview thumbnails for pattern template JSON files.
 *
 * Reads all `.json` files from `src/data/patterns/`, generates a simplified
 * quilt layout SVG for each, converts to PNG via `sharp`, and saves to
 * `public/thumbnails/patterns/{slug}.png`.
 *
 * Usage:
 *   npx tsx scripts/generate-pattern-thumbnails.ts
 *
 * Prerequisites:
 *   npm install -D sharp
 */

import { readFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import sharp from 'sharp';
import type { ParsedPattern } from '../src/lib/pattern-parser-types';
import { inferColorHex } from '../src/lib/pattern-fabric-matcher';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const PATTERNS_DIR = resolve(__dirname, '../src/data/patterns');
const OUTPUT_DIR = resolve(__dirname, '../public/thumbnails/patterns');
const CANVAS_SIZE = 400;
const PNG_QUALITY = 80;
const BACKGROUND_COLOR = '#fafafa';
const SASHING_COLOR = '#e0ddd5';
const BORDER_RADIUS = 6;
const PADDING = 12;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ThumbnailResult {
  readonly filename: string;
  readonly status: 'generated' | 'skipped';
  readonly reason?: string;
}

interface BlockColorAssignment {
  readonly blockName: string;
  readonly color: string;
}

// ---------------------------------------------------------------------------
// Color resolution
// ---------------------------------------------------------------------------

/**
 * Build a map of fabric label -> hex color for all fabrics in a pattern.
 *
 * Some patterns use generic labels in block pieces (e.g. "Green", "Red", "Light")
 * that don't correspond to a fabric entry. For any label referenced in blocks but
 * missing from the fabrics array, we attempt to infer a color from the label text.
 */
function buildFabricColorMap(pattern: ParsedPattern): ReadonlyMap<string, string> {
  const colorMap = new Map<string, string>();

  // Map defined fabrics by label
  for (const fabric of pattern.fabrics) {
    const hex = inferColorHex(fabric.name, fabric.colorFamily ?? undefined);
    colorMap.set(fabric.label, hex);
  }

  // Collect all fabric labels referenced in block pieces
  for (const block of pattern.blocks) {
    for (const piece of block.pieces) {
      if (!colorMap.has(piece.fabricLabel)) {
        // Label not in fabrics array — infer color from the label text itself,
        // passing the label as both name and colorFamily for maximum coverage
        colorMap.set(piece.fabricLabel, inferColorHex(piece.fabricLabel, piece.fabricLabel));
      }
    }
  }

  return colorMap;
}

/**
 * Check whether a hex color is a saturated, non-neutral color.
 * Neutral/gray colors have very similar R, G, B channels.
 */
function isColorful(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max - min > 40;
}

/**
 * Determine a representative color for each block type based on its
 * most prominent non-background fabric (highest piece quantity).
 *
 * When multiple fabrics tie in quantity, prefers the one that resolves
 * to a more saturated color (avoids picking grays for the thumbnail).
 */
function assignBlockColors(
  pattern: ParsedPattern,
  fabricColorMap: ReadonlyMap<string, string>
): readonly BlockColorAssignment[] {
  const backgroundLabels = new Set(
    pattern.fabrics.filter((f) => f.role === 'background').map((f) => f.label)
  );

  return pattern.blocks.map((block) => {
    // Find the piece with the highest quantity that is not a background fabric.
    // On ties, prefer a fabric that resolves to a colorful hex.
    let bestLabel: string | null = null;
    let bestQuantity = 0;
    let bestIsColorful = false;

    for (const piece of block.pieces) {
      if (backgroundLabels.has(piece.fabricLabel)) continue;

      const pieceColor = fabricColorMap.get(piece.fabricLabel) ?? '#888888';
      const pieceIsColorful = isColorful(pieceColor);

      const isBetter =
        piece.quantity > bestQuantity ||
        (piece.quantity === bestQuantity && pieceIsColorful && !bestIsColorful);

      if (isBetter) {
        bestQuantity = piece.quantity;
        bestLabel = piece.fabricLabel;
        bestIsColorful = pieceIsColorful;
      }
    }

    // Fall back to first piece if all pieces use background fabric
    if (!bestLabel && block.pieces.length > 0) {
      bestLabel = block.pieces[0].fabricLabel;
    }

    const color = bestLabel ? (fabricColorMap.get(bestLabel) ?? '#888888') : '#888888';

    return { blockName: block.name, color };
  });
}

// ---------------------------------------------------------------------------
// SVG generation (pure function)
// ---------------------------------------------------------------------------

/**
 * Generate a simplified quilt layout SVG string for a parsed pattern.
 *
 * Draws a proportional grid of colored blocks with optional sashing
 * and borders, fitted within a CANVAS_SIZE x CANVAS_SIZE viewport.
 */
export function generatePatternSvg(pattern: ParsedPattern): string {
  const rows = pattern.layout?.rows ?? 1;
  const cols = pattern.layout?.cols ?? 1;
  const sashingWidth = pattern.layout?.sashingWidth ?? 0;
  const borderWidths = pattern.layout?.borderWidths ?? [];

  const fabricColorMap = buildFabricColorMap(pattern);
  const blockColors = assignBlockColors(pattern, fabricColorMap);

  // Determine border fabric color
  const borderFabric = pattern.fabrics.find((f) => f.role === 'border');
  const borderColor = borderFabric
    ? inferColorHex(borderFabric.name, borderFabric.colorFamily ?? undefined)
    : '#6c635a';

  // Calculate total border thickness
  const totalBorder = borderWidths.reduce((sum, w) => sum + w, 0);

  // Use finished dimensions to determine aspect ratio
  const quiltWidth = pattern.finishedWidth || cols * 6;
  const quiltHeight = pattern.finishedHeight || rows * 6;
  const aspectRatio = quiltWidth / quiltHeight;

  // Fit within the available drawing area (CANVAS_SIZE minus padding)
  const drawArea = CANVAS_SIZE - PADDING * 2;
  let svgQuiltWidth: number;
  let svgQuiltHeight: number;

  if (aspectRatio >= 1) {
    svgQuiltWidth = drawArea;
    svgQuiltHeight = drawArea / aspectRatio;
  } else {
    svgQuiltHeight = drawArea;
    svgQuiltWidth = drawArea * aspectRatio;
  }

  // Center the quilt in the canvas
  const offsetX = (CANVAS_SIZE - svgQuiltWidth) / 2;
  const offsetY = (CANVAS_SIZE - svgQuiltHeight) / 2;

  // Calculate proportional border in SVG units
  const borderProportion = quiltWidth > 0 ? totalBorder / quiltWidth : 0;
  const svgBorderThickness = svgQuiltWidth * borderProportion;

  // Calculate proportional sashing in SVG units
  const innerWidth = quiltWidth - totalBorder * 2;
  const blockUnitWidth = innerWidth > 0 ? innerWidth / cols : 1;
  const sashingProportion = blockUnitWidth > 0 ? sashingWidth / blockUnitWidth : 0;

  // Grid area (inside borders)
  const gridX = offsetX + svgBorderThickness;
  const gridY = offsetY + svgBorderThickness;
  const gridWidth = svgQuiltWidth - svgBorderThickness * 2;
  const gridHeight = svgQuiltHeight - svgBorderThickness * 2;

  // Calculate block and sashing sizes in SVG units
  const svgSashingWidth =
    sashingWidth > 0 ? (gridWidth * sashingProportion) / (1 + sashingProportion) : 0;

  const totalSashingX = svgSashingWidth * (cols - 1);
  const totalSashingY = svgSashingWidth * (rows - 1);
  const blockWidth = cols > 0 ? (gridWidth - totalSashingX) / cols : gridWidth;
  const blockHeight = rows > 0 ? (gridHeight - totalSashingY) / rows : gridHeight;

  // Build block layout — alternate block types if multiple exist
  const totalBlocks = rows * cols;
  const blockColorList: string[] = [];

  if (blockColors.length === 0) {
    for (let i = 0; i < totalBlocks; i++) {
      blockColorList.push('#888888');
    }
  } else if (blockColors.length === 1) {
    // Single block type: use the block color for all
    for (let i = 0; i < totalBlocks; i++) {
      blockColorList.push(blockColors[0].color);
    }
  } else {
    // Multiple block types: alternate in a checkerboard-like pattern
    for (let i = 0; i < totalBlocks; i++) {
      const colorIndex = i % blockColors.length;
      blockColorList.push(blockColors[colorIndex].color);
    }
  }

  // Start building SVG
  const elements: string[] = [];

  // Background
  elements.push(
    `<rect x="0" y="0" width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" fill="${BACKGROUND_COLOR}" />`
  );

  // Outer quilt shape with rounded corners (acts as clip + border base)
  elements.push(
    `<rect x="${offsetX}" y="${offsetY}" width="${svgQuiltWidth}" height="${svgQuiltHeight}" ` +
      `rx="${BORDER_RADIUS}" ry="${BORDER_RADIUS}" fill="${borderColor}" />`
  );

  // Inner area (behind blocks and sashing)
  if (svgBorderThickness > 0) {
    elements.push(
      `<rect x="${gridX}" y="${gridY}" width="${gridWidth}" height="${gridHeight}" ` +
        `fill="${sashingWidth > 0 ? SASHING_COLOR : BACKGROUND_COLOR}" />`
    );
  } else {
    // No border — fill the whole quilt rect as sashing or background
    elements.push(
      `<rect x="${offsetX}" y="${offsetY}" width="${svgQuiltWidth}" height="${svgQuiltHeight}" ` +
        `rx="${BORDER_RADIUS}" ry="${BORDER_RADIUS}" ` +
        `fill="${sashingWidth > 0 ? SASHING_COLOR : BACKGROUND_COLOR}" />`
    );
  }

  // Draw blocks
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const blockIndex = row * cols + col;
      const bx = gridX + col * (blockWidth + svgSashingWidth);
      const by = gridY + row * (blockHeight + svgSashingWidth);
      const color = blockColorList[blockIndex] ?? '#888888';

      elements.push(
        `<rect x="${bx.toFixed(2)}" y="${by.toFixed(2)}" ` +
          `width="${blockWidth.toFixed(2)}" height="${blockHeight.toFixed(2)}" ` +
          `fill="${color}" />`
      );
    }
  }

  // If we have multiple border widths, draw concentric border strips
  // (the outermost is already drawn as the base rect)
  if (borderWidths.length > 1) {
    let cumulativeWidth = 0;

    for (let i = 0; i < borderWidths.length - 1; i++) {
      cumulativeWidth += borderWidths[i];
      const proportion = quiltWidth > 0 ? cumulativeWidth / quiltWidth : 0;
      const inset = svgQuiltWidth * proportion;

      // Alternate border colors slightly for visual distinction
      const shade = i % 2 === 0 ? '#d4d0c8' : borderColor;

      elements.push(
        `<rect x="${(offsetX + inset).toFixed(2)}" y="${(offsetY + inset).toFixed(2)}" ` +
          `width="${(svgQuiltWidth - inset * 2).toFixed(2)}" ` +
          `height="${(svgQuiltHeight - inset * 2).toFixed(2)}" ` +
          `fill="none" stroke="${shade}" stroke-width="0.5" />`
      );
    }
  }

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" viewBox="0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}">`,
    ...elements,
    '</svg>',
  ].join('\n');
}

// ---------------------------------------------------------------------------
// PNG conversion
// ---------------------------------------------------------------------------

async function svgToPng(svgString: string): Promise<Buffer> {
  return sharp(Buffer.from(svgString))
    .resize(CANVAS_SIZE, CANVAS_SIZE, {
      fit: 'contain',
      background: BACKGROUND_COLOR,
    })
    .png({ quality: PNG_QUALITY })
    .toBuffer();
}

// ---------------------------------------------------------------------------
// Pattern processing
// ---------------------------------------------------------------------------

function isValidQuiltPattern(data: unknown): data is ParsedPattern {
  if (typeof data !== 'object' || data === null) return false;

  const record = data as Record<string, unknown>;
  return (
    record.isQuilt === true &&
    typeof record.id === 'string' &&
    typeof record.name === 'string' &&
    typeof record.finishedWidth === 'number' &&
    typeof record.finishedHeight === 'number' &&
    Array.isArray(record.blocks) &&
    Array.isArray(record.fabrics)
  );
}

async function processPattern(filePath: string, filename: string): Promise<ThumbnailResult> {
  let raw: string;
  try {
    raw = readFileSync(filePath, 'utf-8');
  } catch {
    return { filename, status: 'skipped', reason: 'Could not read file' };
  }

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { filename, status: 'skipped', reason: 'Invalid JSON' };
  }

  if (!isValidQuiltPattern(data)) {
    return { filename, status: 'skipped', reason: 'Not a valid quilt pattern' };
  }

  const pattern = data;

  // Provide layout defaults for patterns missing layout info
  const patternWithDefaults: ParsedPattern = {
    ...pattern,
    layout: {
      type: pattern.layout?.type ?? 'grid',
      rows: pattern.layout?.rows ?? 1,
      cols: pattern.layout?.cols ?? 1,
      sashingWidth: pattern.layout?.sashingWidth ?? 0,
      borderWidths: pattern.layout?.borderWidths ?? [],
    },
  };

  try {
    const svg = generatePatternSvg(patternWithDefaults);
    const png = await svgToPng(svg);
    const outputPath = join(OUTPUT_DIR, `${pattern.id}.png`);
    const { writeFileSync } = await import('node:fs');
    writeFileSync(outputPath, png);

    return { filename, status: 'generated' };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { filename, status: 'skipped', reason: `Generation failed: ${message}` };
  }
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

function printReport(results: readonly ThumbnailResult[]): void {
  const generated = results.filter((r) => r.status === 'generated');
  const skipped = results.filter((r) => r.status === 'skipped');

  console.log('');
  console.log('Thumbnail Generation');
  console.log('====================');
  console.log(`Total patterns:   ${results.length}`);
  console.log(`Generated:        ${generated.length}`);
  console.log(`Skipped:          ${skipped.length}`);
  console.log(`Output:           ${OUTPUT_DIR}/`);

  if (skipped.length > 0) {
    console.log('');
    console.log('Skipped:');
    for (const r of skipped) {
      console.log(`  - ${r.filename}: ${r.reason}`);
    }
  }

  console.log('');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log('Pattern Thumbnail Generator');
  console.log('===========================');
  console.log(`Source:  ${PATTERNS_DIR}`);
  console.log(`Output: ${OUTPUT_DIR}`);

  if (!existsSync(PATTERNS_DIR)) {
    console.log('No patterns directory found');
    process.exit(0);
  }

  // Create output directory if it doesn't exist
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Discover pattern files (skip _failed/ subdirectory)
  const entries = readdirSync(PATTERNS_DIR, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => entry.name)
    .sort();

  if (files.length === 0) {
    console.log('No .json files found in patterns directory');
    process.exit(0);
  }

  console.log(`Found ${files.length} JSON file(s)\n`);

  const results: ThumbnailResult[] = [];

  for (const filename of files) {
    const filePath = join(PATTERNS_DIR, filename);
    console.log(`  Processing: ${filename}`);
    const result = await processPattern(filePath, filename);
    results.push(result);

    if (result.status === 'generated') {
      console.log(`    -> Generated`);
    } else {
      console.log(`    -> Skipped: ${result.reason}`);
    }
  }

  printReport(results);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
