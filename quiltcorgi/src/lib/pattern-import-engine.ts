/**
 * Pattern Import Engine
 *
 * Orchestrates the transformation of parsed pattern data into a QuiltCorgi
 * project. Builds canvas objects, printlist items, grid settings, and custom
 * block definitions from a ParsedPattern + matched fabrics and blocks.
 *
 * Pure computation — no React, Fabric.js, DOM, or DB dependency.
 */

import type { ParsedPattern, ParsedBlock, ParsedLayout } from './pattern-parser-types';
import { stripBranding, stripPatternName } from './pattern-branding-strip';
import type { FabricMatch } from './pattern-fabric-matcher';
import type { BlockMatchResult } from './pattern-block-matcher';
import { generateCustomBlockSvg } from './pattern-block-matcher';
import { PIXELS_PER_INCH, DEFAULT_SEAM_ALLOWANCE_INCHES } from '@/lib/constants';

// ── Types ─────────────────────────────────────────────────────────

export interface ImportedProject {
  readonly name: string;
  readonly description: string;
  readonly canvasWidth: number;
  readonly canvasHeight: number;
  readonly gridSettings: GridSettings;
  readonly canvasData: CanvasData;
  readonly printlistItems: readonly ImportedPrintlistItem[];
  readonly customBlocks: readonly CustomBlockDefinition[];
  readonly skillLevel: string;
}

export interface GridSettings {
  readonly enabled: boolean;
  readonly snapToGrid: boolean;
  readonly size: number;
  readonly rows: number;
  readonly cols: number;
}

export interface CanvasData {
  readonly version: string;
  readonly objects: readonly CanvasObject[];
  readonly background: string;
}

export interface CanvasObject {
  readonly type: string;
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
  readonly fill: string;
  readonly stroke: string;
  readonly strokeWidth: number;
  readonly scaleX: number;
  readonly scaleY: number;
  readonly angle: number;
  readonly originX: string;
  readonly originY: string;
  readonly flipX: boolean;
  readonly flipY: boolean;
  readonly opacity: number;
  readonly visible: boolean;
  readonly selectable: boolean;
  readonly blockId?: string;
  readonly fabricId?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface ImportedPrintlistItem {
  readonly shapeId: string;
  readonly shapeName: string;
  readonly svgData: string;
  readonly quantity: number;
  readonly seamAllowance: number;
  readonly seamAllowanceEnabled: boolean;
  readonly unitSystem: 'imperial';
  readonly fabricLabel: string;
  readonly colorHex: string;
  readonly cutWidth: number;
  readonly cutHeight: number;
  readonly shape: string;
  readonly fabricGroup?: string;
}

export interface CustomBlockDefinition {
  readonly name: string;
  readonly category: string;
  readonly svgData: string;
  readonly tags: readonly string[];
}

// ── Internal Constants ────────────────────────────────────────────

const CANVAS_DATA_VERSION = '7.2.0';
const CANVAS_BACKGROUND = 'transparent';
const DEFAULT_STROKE_COLOR = '#333333';
const DEFAULT_STROKE_WIDTH = 1;
const BORDER_FILL = '#f5f0e6';
const SASHING_FILL = '#eae8de';
const FALLBACK_BLOCK_COLOR = '#888888';

// ── Fabric.js Object Defaults ────────────────────────────────────

/**
 * Build a complete Fabric.js 7.2.0-compatible canvas object from minimal properties.
 * Every object on the canvas needs these base properties for `loadFromJSON` to work.
 */
function fabricObject(props: {
  type: string;
  left: number;
  top: number;
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  angle?: number;
  blockId?: string;
  fabricId?: string;
  metadata?: Readonly<Record<string, unknown>>;
}): CanvasObject {
  return {
    type: props.type,
    left: props.left,
    top: props.top,
    width: props.width,
    height: props.height,
    fill: props.fill,
    stroke: props.stroke,
    strokeWidth: props.strokeWidth,
    scaleX: 1,
    scaleY: 1,
    angle: props.angle ?? 0,
    originX: 'left',
    originY: 'top',
    flipX: false,
    flipY: false,
    opacity: 1,
    visible: true,
    selectable: true,
    ...(props.blockId != null ? { blockId: props.blockId } : {}),
    ...(props.fabricId != null ? { fabricId: props.fabricId } : {}),
    ...(props.metadata != null ? { metadata: props.metadata } : {}),
  };
}

/**
 * Generate a deterministic shape ID from fabric label, shape, and dimensions.
 */
function generateShapeId(
  fabricLabel: string,
  shape: string,
  cutWidth: number,
  cutHeight: number
): string {
  // Create a deterministic hash-like ID from the key components
  const raw = `${fabricLabel}::${shape}::${cutWidth.toFixed(4)}::${cutHeight.toFixed(4)}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw.charCodeAt(i);
    hash = ((hash << 5) - hash + ch) | 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `imp-${hex.slice(0, 8)}-${hex.slice(0, 4)}-${hex.slice(4, 8)}-${shape.slice(0, 4)}`;
}

/**
 * Generate a simple SVG representation for a printlist shape.
 */
function generateShapeSvg(
  shape: string,
  cutWidth: number,
  cutHeight: number,
  colorHex: string
): string {
  const w = cutWidth * PIXELS_PER_INCH;
  const h = cutHeight * PIXELS_PER_INCH;
  const viewBox = `0 0 ${w} ${h}`;

  if (shape === 'hst') {
    // Half-square triangle
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${w}" height="${h}"><polygon points="0,${h} ${w},${h} ${w},0" fill="${colorHex}" stroke="#333" stroke-width="1"/></svg>`;
  }

  // Default: rectangle/square
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${w}" height="${h}"><rect x="0" y="0" width="${w}" height="${h}" fill="${colorHex}" stroke="#333" stroke-width="1"/></svg>`;
}

// ── Helpers ───────────────────────────────────────────────────────

/**
 * Look up the FabricMatch for a given pattern fabric label.
 * Returns the first match or undefined.
 */
function findFabricMatch(
  fabricLabel: string,
  fabricMatches: readonly FabricMatch[]
): FabricMatch | undefined {
  return fabricMatches.find((fm) => fm.patternLabel === fabricLabel);
}

/**
 * Look up the BlockMatchResult for a given pattern block name.
 * Returns the first match or undefined.
 */
function findBlockMatch(
  blockName: string,
  blockMatches: readonly BlockMatchResult[]
): BlockMatchResult | undefined {
  return blockMatches.find((bm) => bm.patternBlockName === blockName);
}

/**
 * Resolve the primary fill color for a block. Uses the first fabric
 * match's colorHex, falling back to a neutral grey.
 */
function resolveBlockColor(block: ParsedBlock, fabricMatches: readonly FabricMatch[]): string {
  if (block.pieces.length === 0) {
    return FALLBACK_BLOCK_COLOR;
  }

  const firstPiece = block.pieces[0];
  const match = findFabricMatch(firstPiece.fabricLabel, fabricMatches);
  return match?.colorHex ?? FALLBACK_BLOCK_COLOR;
}

/**
 * Compute the total border inset in inches from an array of border widths.
 * Each border is applied on both sides, so total offset = sum of all widths.
 */
function computeBorderOffset(borderWidths: readonly number[]): number {
  return borderWidths.reduce((sum, w) => sum + w, 0);
}

/**
 * Create a unique printlist key for deduplication.
 */
function printlistKey(
  fabricLabel: string,
  shape: string,
  cutWidth: number,
  cutHeight: number
): string {
  return `${fabricLabel}::${shape}::${cutWidth.toFixed(4)}::${cutHeight.toFixed(4)}`;
}

// ── On-Point Layout Helpers ──────────────────────────────────────

/**
 * Compute the diagonal span of a square block rotated 45 degrees.
 * For a block of side `s`, the bounding box of the rotated square is s * sqrt(2).
 */
function diagonalSpan(sideInches: number): number {
  return sideInches * Math.SQRT2;
}

/**
 * Build canvas objects for an on-point (diagonal) layout.
 *
 * Blocks are rotated 45 degrees and arranged in a diamond grid.
 * Setting triangles (HSTs along edges, QSTs at corners) fill the
 * perimeter so the overall quilt is rectangular.
 */
function buildOnPointBlockObjects(
  blocks: readonly ParsedBlock[],
  fabricMatches: readonly FabricMatch[],
  blockMatches: readonly BlockMatchResult[],
  gridSettings: GridSettings,
  borderOffsetPx: number,
  sashingPx: number
): CanvasObject[] {
  const objects: CanvasObject[] = [];

  const firstBlock = blocks[0];
  const blockSideInches = firstBlock?.finishedWidth ?? 12;
  const blockSidePx = blockSideInches * PIXELS_PER_INCH;
  const diagPx = diagonalSpan(blockSideInches) * PIXELS_PER_INCH;
  const cellStepPx = diagPx / 2 + sashingPx;

  // Background fabric for setting triangles
  const bgFabric = fabricMatches.find((fm) => fm.patternLabel.toLowerCase().includes('background'));
  const bgColor = bgFabric?.colorHex ?? '#f5f0e6';

  // Build flat block list
  const blockPlacements: ParsedBlock[] = [];
  for (const block of blocks) {
    for (let q = 0; q < block.quantity; q++) {
      blockPlacements.push(block);
    }
  }

  const { rows, cols } = gridSettings;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const blockIndex = row * cols + col;

      const centerX = borderOffsetPx + diagPx / 2 + col * cellStepPx;
      const centerY = borderOffsetPx + diagPx / 2 + row * cellStepPx;

      if (blockIndex < blockPlacements.length) {
        const block = blockPlacements[blockIndex];
        const blockMatch = findBlockMatch(block.name, blockMatches);
        const fillColor = resolveBlockColor(block, fabricMatches);

        objects.push(
          fabricObject({
            type: 'Rect',
            left: centerX - blockSidePx / 2,
            top: centerY - blockSidePx / 2,
            width: blockSidePx,
            height: blockSidePx,
            fill: fillColor,
            stroke: DEFAULT_STROKE_COLOR,
            strokeWidth: DEFAULT_STROKE_WIDTH,
            angle: 45,
            blockId: blockMatch?.matchedBlockId ?? undefined,
            metadata: {
              role: 'block',
              blockName: block.name,
              row,
              col,
              onPoint: true,
              matchConfidence: blockMatch?.confidence ?? 0,
              needsCustomBlock: blockMatch?.needsCustomBlock ?? true,
            },
          })
        );
      }

      // Side setting triangles (HST) along edges
      const isTopEdge = row === 0;
      const isBottomEdge = row === rows - 1;
      const isLeftEdge = col === 0;
      const isRightEdge = col === cols - 1;

      if (isTopEdge) {
        objects.push(
          fabricObject({
            type: 'Triangle',
            left: centerX - diagPx / 4,
            top: borderOffsetPx,
            width: diagPx / 2,
            height: diagPx / 4,
            fill: bgColor,
            stroke: DEFAULT_STROKE_COLOR,
            strokeWidth: DEFAULT_STROKE_WIDTH,
            metadata: { role: 'setting-triangle', triangleType: 'hst', side: 'top', row, col },
          })
        );
      }

      if (isBottomEdge) {
        objects.push(
          fabricObject({
            type: 'Triangle',
            left: centerX - diagPx / 4,
            top: centerY + diagPx / 4,
            width: diagPx / 2,
            height: diagPx / 4,
            fill: bgColor,
            stroke: DEFAULT_STROKE_COLOR,
            strokeWidth: DEFAULT_STROKE_WIDTH,
            metadata: { role: 'setting-triangle', triangleType: 'hst', side: 'bottom', row, col },
          })
        );
      }

      if (isLeftEdge) {
        objects.push(
          fabricObject({
            type: 'Triangle',
            left: borderOffsetPx,
            top: centerY - diagPx / 4,
            width: diagPx / 4,
            height: diagPx / 2,
            fill: bgColor,
            stroke: DEFAULT_STROKE_COLOR,
            strokeWidth: DEFAULT_STROKE_WIDTH,
            metadata: { role: 'setting-triangle', triangleType: 'hst', side: 'left', row, col },
          })
        );
      }

      if (isRightEdge) {
        objects.push(
          fabricObject({
            type: 'Triangle',
            left: centerX + diagPx / 4,
            top: centerY - diagPx / 4,
            width: diagPx / 4,
            height: diagPx / 2,
            fill: bgColor,
            stroke: DEFAULT_STROKE_COLOR,
            strokeWidth: DEFAULT_STROKE_WIDTH,
            metadata: { role: 'setting-triangle', triangleType: 'hst', side: 'right', row, col },
          })
        );
      }
    }
  }

  // Corner setting triangles (QST) at the four corners
  const totalWidthPx = cols * cellStepPx - sashingPx + diagPx / 2;
  const totalHeightPx = rows * cellStepPx - sashingPx + diagPx / 2;
  const cornerSize = diagPx / 4;

  const cornerPositions = [
    { left: borderOffsetPx, top: borderOffsetPx, corner: 'top-left' },
    { left: borderOffsetPx + totalWidthPx - cornerSize, top: borderOffsetPx, corner: 'top-right' },
    {
      left: borderOffsetPx,
      top: borderOffsetPx + totalHeightPx - cornerSize,
      corner: 'bottom-left',
    },
    {
      left: borderOffsetPx + totalWidthPx - cornerSize,
      top: borderOffsetPx + totalHeightPx - cornerSize,
      corner: 'bottom-right',
    },
  ];

  for (const pos of cornerPositions) {
    objects.push(
      fabricObject({
        type: 'Triangle',
        left: pos.left,
        top: pos.top,
        width: cornerSize,
        height: cornerSize,
        fill: bgColor,
        stroke: DEFAULT_STROKE_COLOR,
        strokeWidth: DEFAULT_STROKE_WIDTH,
        metadata: { role: 'setting-triangle', triangleType: 'qst', corner: pos.corner },
      })
    );
  }

  return objects;
}

// ── Border Color Resolution ─────────────────────────────────────

/**
 * Resolve a distinct border color for each border layer.
 * Looks for fabric matches with 'border' in the label and cycles
 * through them. Falls back to the default border fill.
 */
function resolveBorderColors(
  fabricMatches: readonly FabricMatch[],
  borderCount: number
): readonly string[] {
  const borderFabrics = fabricMatches.filter((fm) =>
    fm.patternLabel.toLowerCase().includes('border')
  );

  const colors: string[] = [];
  for (let i = 0; i < borderCount; i++) {
    if (borderFabrics.length > 0) {
      colors.push(borderFabrics[i % borderFabrics.length].colorHex);
    } else {
      colors.push(BORDER_FILL);
    }
  }

  return colors;
}

// ── Cornerstone Helpers ─────────────────────────────────────────

/**
 * Resolve the cornerstone color from accent or contrasting fabrics.
 * Falls back to a muted tone if no accent fabric is available.
 */
function resolveCornerstoneColor(fabricMatches: readonly FabricMatch[]): string {
  const accentFabric = fabricMatches.find((fm) => fm.patternLabel.toLowerCase().includes('accent'));
  if (accentFabric != null) {
    return accentFabric.colorHex;
  }

  // Fall back to a contrasting neutral
  return '#c9c0b6';
}

/**
 * Build cornerstone squares at sashing intersections.
 * A cornerstone is placed at each crossing of a vertical and horizontal
 * sashing strip — that is, at grid coordinates where both row > 0 and col > 0.
 */
function buildCornerstoneObjects(
  gridSettings: GridSettings,
  borderOffsetPx: number,
  blockWidthPx: number,
  blockHeightPx: number,
  sashingPx: number,
  cornerstoneColor: string
): CanvasObject[] {
  if (sashingPx <= 0) {
    return [];
  }

  const objects: CanvasObject[] = [];

  for (let row = 1; row < gridSettings.rows; row++) {
    for (let col = 1; col < gridSettings.cols; col++) {
      const left = borderOffsetPx + col * blockWidthPx + (col - 1) * sashingPx;
      const top = borderOffsetPx + row * blockHeightPx + (row - 1) * sashingPx;

      objects.push(
        fabricObject({
          type: 'Rect',
          left,
          top,
          width: sashingPx,
          height: sashingPx,
          fill: cornerstoneColor,
          stroke: DEFAULT_STROKE_COLOR,
          strokeWidth: DEFAULT_STROKE_WIDTH,
          metadata: { role: 'cornerstone', row, col },
        })
      );
    }
  }

  return objects;
}

// ── Missing Layout Helpers ──────────────────────────────────────

/**
 * Infer grid dimensions when rows and cols are both missing.
 *
 * If blocks exist, finds the closest rectangular grid that fits all
 * blocks. Prefers landscape orientation when the quilt is wider than tall.
 * If no blocks exist, returns { rows: 1, cols: 1 }.
 */
function inferGridDimensions(
  totalBlocks: number,
  quiltWidth: number,
  quiltHeight: number
): { rows: number; cols: number } {
  if (totalBlocks <= 0) {
    return { rows: 1, cols: 1 };
  }

  const sqrt = Math.sqrt(totalBlocks);
  const isLandscape = quiltWidth >= quiltHeight;

  // Try to find factor pairs that fit totalBlocks exactly or with minimal waste
  let bestCols = Math.ceil(sqrt);
  let bestRows = Math.ceil(totalBlocks / bestCols);

  // For non-square counts, try common factor pairs
  for (let c = Math.ceil(sqrt); c <= totalBlocks; c++) {
    const r = Math.ceil(totalBlocks / c);
    if (r * c >= totalBlocks && r * c < bestRows * bestCols) {
      bestCols = c;
      bestRows = r;
    }
    // Stop once we get to trivially wide layouts
    if (r <= 1) break;
  }

  // Prefer landscape if quilt is wider
  if (isLandscape && bestCols < bestRows) {
    return { rows: bestCols, cols: bestRows };
  }

  return { rows: bestRows, cols: bestCols };
}

/**
 * Build a single full-canvas placeholder rect for patterns with no blocks.
 */
function buildPlaceholderObject(canvasWidth: number, canvasHeight: number): CanvasObject {
  return fabricObject({
    type: 'Rect',
    left: 0,
    top: 0,
    width: canvasWidth,
    height: canvasHeight,
    fill: BORDER_FILL,
    stroke: DEFAULT_STROKE_COLOR,
    strokeWidth: DEFAULT_STROKE_WIDTH,
    metadata: { role: 'placeholder' },
  });
}

// ── Fabric Grouping Helpers ─────────────────────────────────────

/**
 * Infer a color family group from a fabric label or hex color.
 * Uses basic hue classification for hex colors.
 */
function inferFabricGroup(fabricLabel: string, colorHex: string): string {
  const labelLower = fabricLabel.toLowerCase();

  // Check label for common color family keywords
  const families = [
    'red',
    'orange',
    'yellow',
    'green',
    'blue',
    'purple',
    'pink',
    'brown',
    'black',
    'white',
    'gray',
    'grey',
    'neutral',
    'cream',
    'beige',
  ];
  for (const family of families) {
    if (labelLower.includes(family)) {
      return family === 'grey' ? 'Gray' : family.charAt(0).toUpperCase() + family.slice(1);
    }
  }

  // Fall back to hex-based hue classification
  return classifyHexToFamily(colorHex);
}

/**
 * Classify a hex color string into a broad color family.
 */
function classifyHexToFamily(hex: string): string {
  const cleaned = hex.replace('#', '');
  if (cleaned.length < 6) return 'Other';

  const r = parseInt(cleaned.substring(0, 2), 16);
  const g = parseInt(cleaned.substring(2, 4), 16);
  const b = parseInt(cleaned.substring(4, 6), 16);

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;

  // Near-black or near-white
  if (lightness < 30) return 'Black';
  if (lightness > 230 && max - min < 20) return 'White';
  if (max - min < 25) return 'Gray';

  // Determine dominant hue
  let hue: number;
  if (max === min) {
    hue = 0;
  } else if (max === r) {
    hue = ((g - b) / (max - min)) * 60;
  } else if (max === g) {
    hue = (2 + (b - r) / (max - min)) * 60;
  } else {
    hue = (4 + (r - g) / (max - min)) * 60;
  }
  if (hue < 0) hue += 360;

  if (hue < 15 || hue >= 345) return 'Red';
  if (hue < 45) return 'Orange';
  if (hue < 70) return 'Yellow';
  if (hue < 160) return 'Green';
  if (hue < 250) return 'Blue';
  if (hue < 290) return 'Purple';
  return 'Pink';
}

/**
 * Assign fabricGroup to each printlist item when the pattern has many
 * unique fabrics (> 20). Groups by inferred color family to prevent
 * the printlist from being overwhelming.
 */
function assignFabricGroups(
  items: readonly ImportedPrintlistItem[],
  parsed: ParsedPattern
): ImportedPrintlistItem[] {
  const uniqueFabricLabels = new Set(parsed.fabrics.map((f) => f.label));

  if (uniqueFabricLabels.size <= 20) {
    return items.map((item) => item);
  }

  // Build a label → colorFamily map from parsed fabrics
  const labelToFamily = new Map<string, string>();
  for (const fabric of parsed.fabrics) {
    if (fabric.colorFamily != null) {
      labelToFamily.set(fabric.label, fabric.colorFamily);
    }
  }

  return items.map((item) => {
    const explicitFamily = labelToFamily.get(item.fabricLabel);
    const group = explicitFamily ?? inferFabricGroup(item.fabricLabel, item.colorHex);
    return { ...item, fabricGroup: group };
  });
}

// ── calculateGridFromLayout ───────────────────────────────────────

/**
 * Derives grid settings from the parsed layout and block definitions.
 *
 * If the layout specifies explicit rows and cols, those values are used.
 * Otherwise, the grid dimensions are inferred from the total block count
 * and the quilt's finished dimensions to produce the best arrangement.
 *
 * When both rows and cols are missing, uses `inferGridDimensions` to
 * find the closest rectangular grid, preferring landscape orientation
 * when the quilt is wider than tall.
 *
 * @param layout - The parsed quilt layout
 * @param blocks - The parsed block definitions
 * @param quiltWidth - Optional finished quilt width for orientation inference
 * @param quiltHeight - Optional finished quilt height for orientation inference
 * @returns Grid settings with dimensions and pixel-based grid size
 */
export function calculateGridFromLayout(
  layout: ParsedLayout,
  blocks: readonly ParsedBlock[],
  quiltWidth?: number,
  quiltHeight?: number
): GridSettings {
  const totalBlockCount = blocks.reduce((sum, b) => sum + b.quantity, 0);

  let rows: number;
  let cols: number;

  if (layout.rows != null && layout.cols != null) {
    rows = layout.rows;
    cols = layout.cols;
  } else if (layout.rows != null && totalBlockCount > 0) {
    rows = layout.rows;
    cols = Math.ceil(totalBlockCount / rows);
  } else if (layout.cols != null && totalBlockCount > 0) {
    cols = layout.cols;
    rows = Math.ceil(totalBlockCount / cols);
  } else if (totalBlockCount > 0) {
    // Edge Case 5: Use landscape-aware inference when quilt dimensions are available
    const inferred = inferGridDimensions(totalBlockCount, quiltWidth ?? 1, quiltHeight ?? 1);
    rows = inferred.rows;
    cols = inferred.cols;
  } else {
    rows = 1;
    cols = 1;
  }

  // Grid size in inches — matches the project schema's gridSettings.size field.
  // Use the average of width and height for non-square blocks.
  const firstBlock = blocks[0];
  const size = firstBlock != null ? (firstBlock.finishedWidth + firstBlock.finishedHeight) / 2 : 1;

  return {
    enabled: true,
    snapToGrid: true,
    size,
    rows,
    cols,
  };
}

// ── buildCanvasObjects ────────────────────────────────────────────

/**
 * Places blocks on the canvas grid and generates border and sashing
 * elements around/between them.
 *
 * Handles three element types:
 * 1. **Grid blocks** — placed in a row x col arrangement
 * 2. **Border pieces** — placed around the grid perimeter
 * 3. **Sashing strips** — placed between blocks when sashingWidth > 0
 *
 * @param parsed - The full parsed pattern
 * @param fabricMatches - Fabric match results for color resolution
 * @param blockMatches - Block match results for blockId assignment
 * @param gridSettings - Pre-calculated grid settings
 * @returns Array of canvas objects ready for Fabric.js serialization
 */
export function buildCanvasObjects(
  parsed: ParsedPattern,
  fabricMatches: readonly FabricMatch[],
  blockMatches: readonly BlockMatchResult[],
  gridSettings: GridSettings
): CanvasObject[] {
  const objects: CanvasObject[] = [];

  const { layout, blocks } = parsed;
  const borderWidths = layout.borderWidths ?? [];
  const sashingWidth = layout.sashingWidth ?? 0;
  const borderOffsetInches = computeBorderOffset(borderWidths);
  const borderOffsetPx = borderOffsetInches * PIXELS_PER_INCH;

  // Use first block's dimensions as the canonical cell size
  const firstBlock = blocks[0];
  const blockWidthInches = firstBlock?.finishedWidth ?? 12;
  const blockHeightInches = firstBlock?.finishedHeight ?? 12;
  const blockWidthPx = blockWidthInches * PIXELS_PER_INCH;
  const blockHeightPx = blockHeightInches * PIXELS_PER_INCH;
  const sashingPx = sashingWidth * PIXELS_PER_INCH;

  // ── Handle empty blocks (Edge Case 5) ───────────────────────
  if (blocks.length === 0) {
    const canvasWidth = parsed.finishedWidth * PIXELS_PER_INCH;
    const canvasHeight = parsed.finishedHeight * PIXELS_PER_INCH;
    objects.push(buildPlaceholderObject(canvasWidth, canvasHeight));
    return objects;
  }

  // ── Borders ──────────────────────────────────────────────────
  // Build border rectangles from outermost to innermost.
  // Each border wraps around the previous layer.
  // Use distinct colors per border layer (Edge Case 2).

  const borderColors = resolveBorderColors(fabricMatches, borderWidths.length);
  let currentBorderInset = 0;

  for (let i = 0; i < borderWidths.length; i++) {
    const bw = borderWidths[i];
    const bwPx = bw * PIXELS_PER_INCH;

    // Remaining inset from all borders inside this one
    const innerInset = borderWidths.slice(i + 1).reduce((s, w) => s + w, 0);
    const innerWidthPx =
      gridSettings.cols * blockWidthPx + Math.max(0, gridSettings.cols - 1) * sashingPx;
    const innerHeightPx =
      gridSettings.rows * blockHeightPx + Math.max(0, gridSettings.rows - 1) * sashingPx;
    const innerBordersPx = innerInset * PIXELS_PER_INCH;

    const totalInnerWidthPx = innerWidthPx + 2 * innerBordersPx;
    const totalInnerHeightPx = innerHeightPx + 2 * innerBordersPx;

    const borderColor = borderColors[i] ?? BORDER_FILL;

    // Top border
    objects.push(
      fabricObject({
        type: 'Rect',
        left: currentBorderInset * PIXELS_PER_INCH,
        top: currentBorderInset * PIXELS_PER_INCH,
        width: totalInnerWidthPx + 2 * bwPx,
        height: bwPx,
        fill: borderColor,
        stroke: DEFAULT_STROKE_COLOR,
        strokeWidth: DEFAULT_STROKE_WIDTH,
        metadata: { role: 'border', borderIndex: i, side: 'top' },
      })
    );

    // Bottom border
    objects.push(
      fabricObject({
        type: 'Rect',
        left: currentBorderInset * PIXELS_PER_INCH,
        top: currentBorderInset * PIXELS_PER_INCH + bwPx + totalInnerHeightPx,
        width: totalInnerWidthPx + 2 * bwPx,
        height: bwPx,
        fill: borderColor,
        stroke: DEFAULT_STROKE_COLOR,
        strokeWidth: DEFAULT_STROKE_WIDTH,
        metadata: { role: 'border', borderIndex: i, side: 'bottom' },
      })
    );

    // Left border
    objects.push(
      fabricObject({
        type: 'Rect',
        left: currentBorderInset * PIXELS_PER_INCH,
        top: currentBorderInset * PIXELS_PER_INCH + bwPx,
        width: bwPx,
        height: totalInnerHeightPx,
        fill: borderColor,
        stroke: DEFAULT_STROKE_COLOR,
        strokeWidth: DEFAULT_STROKE_WIDTH,
        metadata: { role: 'border', borderIndex: i, side: 'left' },
      })
    );

    // Right border
    objects.push(
      fabricObject({
        type: 'Rect',
        left: currentBorderInset * PIXELS_PER_INCH + bwPx + totalInnerWidthPx,
        top: currentBorderInset * PIXELS_PER_INCH + bwPx,
        width: bwPx,
        height: totalInnerHeightPx,
        fill: borderColor,
        stroke: DEFAULT_STROKE_COLOR,
        strokeWidth: DEFAULT_STROKE_WIDTH,
        metadata: { role: 'border', borderIndex: i, side: 'right' },
      })
    );

    currentBorderInset += bw;
  }

  // ── On-Point Layout (Edge Case 1) ───────────────────────────
  if (layout.type === 'on-point') {
    const onPointObjects = buildOnPointBlockObjects(
      blocks,
      fabricMatches,
      blockMatches,
      gridSettings,
      borderOffsetPx,
      sashingPx
    );
    objects.push(...onPointObjects);
    return objects;
  }

  // ── Sashing + Grid Blocks ────────────────────────────────────

  // Build a flat list of blocks to place, respecting quantities
  const blockPlacements: ParsedBlock[] = [];
  for (const block of blocks) {
    for (let q = 0; q < block.quantity; q++) {
      blockPlacements.push(block);
    }
  }

  for (let row = 0; row < gridSettings.rows; row++) {
    for (let col = 0; col < gridSettings.cols; col++) {
      const blockIndex = row * gridSettings.cols + col;

      // Horizontal sashing (vertical strips between columns)
      if (sashingWidth > 0 && col > 0) {
        const sashingFabric = fabricMatches.find((fm) =>
          fm.patternLabel.toLowerCase().includes('sashing')
        );
        const sashingColor = sashingFabric?.colorHex ?? SASHING_FILL;

        objects.push(
          fabricObject({
            type: 'Rect',
            left: borderOffsetPx + col * blockWidthPx + (col - 1) * sashingPx,
            top: borderOffsetPx + row * (blockHeightPx + sashingPx),
            width: sashingPx,
            height: blockHeightPx,
            fill: sashingColor,
            stroke: DEFAULT_STROKE_COLOR,
            strokeWidth: DEFAULT_STROKE_WIDTH,
            metadata: { role: 'sashing', orientation: 'vertical', row, col },
          })
        );
      }

      // Horizontal sashing (horizontal strips between rows)
      if (sashingWidth > 0 && row > 0 && col === 0) {
        const sashingFabric = fabricMatches.find((fm) =>
          fm.patternLabel.toLowerCase().includes('sashing')
        );
        const sashingColor = sashingFabric?.colorHex ?? SASHING_FILL;

        const totalRowWidth =
          gridSettings.cols * blockWidthPx + Math.max(0, gridSettings.cols - 1) * sashingPx;

        objects.push(
          fabricObject({
            type: 'Rect',
            left: borderOffsetPx,
            top: borderOffsetPx + row * blockHeightPx + (row - 1) * sashingPx,
            width: totalRowWidth,
            height: sashingPx,
            fill: sashingColor,
            stroke: DEFAULT_STROKE_COLOR,
            strokeWidth: DEFAULT_STROKE_WIDTH,
            metadata: { role: 'sashing', orientation: 'horizontal', row, col: 0 },
          })
        );
      }

      // Skip if we've run out of blocks to place
      if (blockIndex >= blockPlacements.length) {
        continue;
      }

      const block = blockPlacements[blockIndex];
      const blockMatch = findBlockMatch(block.name, blockMatches);
      const fillColor = resolveBlockColor(block, fabricMatches);

      const left = borderOffsetPx + col * (blockWidthPx + sashingPx);
      const top = borderOffsetPx + row * (blockHeightPx + sashingPx);

      objects.push(
        fabricObject({
          type: 'Rect',
          left,
          top,
          width: blockWidthPx,
          height: blockHeightPx,
          fill: fillColor,
          stroke: DEFAULT_STROKE_COLOR,
          strokeWidth: DEFAULT_STROKE_WIDTH,
          blockId: blockMatch?.matchedBlockId ?? undefined,
          metadata: {
            role: 'block',
            blockName: block.name,
            row,
            col,
            matchConfidence: blockMatch?.confidence ?? 0,
            needsCustomBlock: blockMatch?.needsCustomBlock ?? true,
          },
        })
      );
    }
  }

  // ── Cornerstones (Edge Case 3) ──────────────────────────────
  if (sashingPx > 0) {
    const cornerstoneColor = resolveCornerstoneColor(fabricMatches);
    const cornerstones = buildCornerstoneObjects(
      gridSettings,
      borderOffsetPx,
      blockWidthPx,
      blockHeightPx,
      sashingPx,
      cornerstoneColor
    );
    objects.push(...cornerstones);
  }

  return objects;
}

// ── buildPrintlistFromPattern ─────────────────────────────────────

/**
 * Builds printlist items from the parsed pattern's blocks and their pieces.
 *
 * Each piece in each block contributes to the printlist. Quantities are
 * multiplied by the block's quantity to get the total cuts needed.
 * Identical cuts (same fabric, shape, and dimensions) are deduplicated
 * and their quantities summed.
 *
 * @param parsed - The full parsed pattern
 * @param fabricMatches - Fabric match results for color resolution
 * @returns Deduplicated printlist items sorted by fabric label
 */
export function buildPrintlistFromPattern(
  parsed: ParsedPattern,
  fabricMatches: readonly FabricMatch[]
): ImportedPrintlistItem[] {
  const itemMap = new Map<string, ImportedPrintlistItem>();

  for (const block of parsed.blocks) {
    for (const piece of block.pieces) {
      const totalQuantity = piece.quantity * block.quantity;
      const match = findFabricMatch(piece.fabricLabel, fabricMatches);
      const colorHex = match?.colorHex ?? FALLBACK_BLOCK_COLOR;

      const key = printlistKey(piece.fabricLabel, piece.shape, piece.cutWidth, piece.cutHeight);

      const existing = itemMap.get(key);
      if (existing != null) {
        // Sum quantities for identical cuts — create new object (immutable)
        itemMap.set(key, {
          ...existing,
          quantity: existing.quantity + totalQuantity,
        });
      } else {
        const shapeId = generateShapeId(
          piece.fabricLabel,
          piece.shape,
          piece.cutWidth,
          piece.cutHeight
        );
        const svgData = generateShapeSvg(piece.shape, piece.cutWidth, piece.cutHeight, colorHex);

        itemMap.set(key, {
          shapeId,
          shapeName: `${piece.shape} ${piece.cutWidth}" x ${piece.cutHeight}"`,
          svgData,
          quantity: totalQuantity,
          seamAllowance: DEFAULT_SEAM_ALLOWANCE_INCHES,
          seamAllowanceEnabled: true,
          unitSystem: 'imperial',
          fabricLabel: piece.fabricLabel,
          colorHex,
          cutWidth: piece.cutWidth,
          cutHeight: piece.cutHeight,
          shape: piece.shape,
        });
      }
    }
  }

  // Sort by fabric label for consistent ordering
  return Array.from(itemMap.values()).sort((a, b) => a.fabricLabel.localeCompare(b.fabricLabel));
}

// ── collectCustomBlocks ───────────────────────────────────────────

/**
 * Collects custom block definitions for blocks that had no match in the
 * library (where needsCustomBlock is true). Generates a placeholder SVG
 * for each unmatched block.
 */
function collectCustomBlocks(
  blocks: readonly ParsedBlock[],
  blockMatches: readonly BlockMatchResult[]
): CustomBlockDefinition[] {
  const seen = new Set<string>();
  const customBlocks: CustomBlockDefinition[] = [];

  for (const block of blocks) {
    const match = findBlockMatch(block.name, blockMatches);
    if (match == null || !match.needsCustomBlock) {
      continue;
    }

    // Deduplicate by block name
    const normalizedName = block.name.toLowerCase().trim();
    if (seen.has(normalizedName)) {
      continue;
    }
    seen.add(normalizedName);

    const pieceCount = block.pieces.reduce((sum, p) => sum + p.quantity, 0);
    const svgData = generateCustomBlockSvg(
      block.name,
      block.finishedWidth,
      block.finishedHeight,
      pieceCount
    );

    customBlocks.push({
      name: block.name,
      category: 'imported',
      svgData,
      tags: ['imported', 'custom', 'pattern-import'],
    });
  }

  return customBlocks;
}

// ── buildProjectFromPattern ───────────────────────────────────────

/**
 * Main orchestrator: transforms a parsed pattern + match results into
 * a complete ImportedProject ready for persistence.
 *
 * Steps:
 * 1. Strip branding from name and description
 * 2. Calculate canvas dimensions from finished quilt size
 * 3. Derive grid settings from layout
 * 4. Build canvas objects (blocks, borders, sashing)
 * 5. Build printlist items from cutting directions
 * 6. Collect custom block definitions for unmatched blocks
 *
 * @param parsed - The fully parsed pattern
 * @param fabricMatches - Results from the fabric matcher
 * @param blockMatches - Results from the block matcher
 * @returns A complete ImportedProject
 */
export function buildProjectFromPattern(
  parsed: ParsedPattern,
  fabricMatches: readonly FabricMatch[],
  blockMatches: readonly BlockMatchResult[]
): ImportedProject {
  // 1. Strip branding
  const cleanName = stripPatternName(parsed.name);
  const cleanDescription = stripBranding(parsed.description);

  // 2. Canvas dimensions
  const canvasWidth = parsed.finishedWidth * PIXELS_PER_INCH;
  const canvasHeight = parsed.finishedHeight * PIXELS_PER_INCH;

  // 3. Grid settings (pass quilt dimensions for landscape-aware inference)
  const gridSettings = calculateGridFromLayout(
    parsed.layout,
    parsed.blocks,
    parsed.finishedWidth,
    parsed.finishedHeight
  );

  // 4. Canvas objects
  const canvasObjects = buildCanvasObjects(parsed, fabricMatches, blockMatches, gridSettings);

  // 5. Printlist items (with fabric grouping for many-fabric patterns)
  const rawPrintlistItems = buildPrintlistFromPattern(parsed, fabricMatches);
  const printlistItems = assignFabricGroups(rawPrintlistItems, parsed);

  // 6. Custom blocks
  const customBlocks = collectCustomBlocks(parsed.blocks, blockMatches);

  return {
    name: cleanName,
    description: cleanDescription,
    canvasWidth,
    canvasHeight,
    gridSettings,
    canvasData: {
      version: CANVAS_DATA_VERSION,
      objects: canvasObjects,
      background: CANVAS_BACKGROUND,
    },
    printlistItems,
    customBlocks,
    skillLevel: parsed.skillLevel,
  };
}
