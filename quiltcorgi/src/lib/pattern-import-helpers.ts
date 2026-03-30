/**
 * Pattern Import Helpers
 *
 * Utility functions for pattern import functionality.
 */

import { PIXELS_PER_INCH, DEFAULT_SEAM_ALLOWANCE_INCHES } from '@/lib/constants';
import type {
  ImportedPrintlistItem,
  CustomBlockDefinition,
  CanvasObject,
} from './pattern-import-types';
import {
  CANVAS_DATA_VERSION,
  CANVAS_BACKGROUND,
  DEFAULT_STROKE_COLOR,
  DEFAULT_STROKE_WIDTH,
  BORDER_FILL,
  SASHING_FILL,
  FALLBACK_BLOCK_COLOR,
} from './pattern-import-types';
import type { ParsedBlock } from './pattern-parser-types';
import type { FabricMatch } from './pattern-fabric-matcher';
import type { BlockMatchResult } from './pattern-block-matcher';
import { generateCustomBlockSvg } from './pattern-block-matcher';

// Re-export constants for convenience
export {
  CANVAS_DATA_VERSION,
  CANVAS_BACKGROUND,
  DEFAULT_STROKE_COLOR,
  DEFAULT_STROKE_WIDTH,
  BORDER_FILL,
  SASHING_FILL,
  FALLBACK_BLOCK_COLOR,
} from './pattern-import-types';

/**
 * Build a complete Fabric.js 7.2.0-compatible canvas object from minimal properties.
 * Every object on the canvas needs these base properties for `loadFromJSON` to work.
 */
export function fabricObject(props: {
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
export function generateShapeId(
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
export function generateShapeSvg(
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

/**
 * Look up the FabricMatch for a given pattern fabric label.
 * Returns the first match or undefined.
 */
export function findFabricMatch(
  fabricLabel: string,
  fabricMatches: readonly FabricMatch[]
): FabricMatch | undefined {
  return fabricMatches.find((fm) => fm.patternLabel === fabricLabel);
}

/**
 * Look up the BlockMatchResult for a given pattern block name.
 * Returns the first match or undefined.
 */
export function findBlockMatch(
  blockName: string,
  blockMatches: readonly BlockMatchResult[]
): BlockMatchResult | undefined {
  return blockMatches.find((bm) => bm.patternBlockName === blockName);
}

/**
 * Resolve the primary fill color for a block. Uses the first fabric
 * match's colorHex, falling back to a neutral grey.
 */
export function resolveBlockColor(block: ParsedBlock, fabricMatches: readonly FabricMatch[]): string {
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
export function computeBorderOffset(borderWidths: readonly number[]): number {
  return borderWidths.reduce((sum, w) => sum + w, 0);
}

/**
 * Create a unique printlist key for deduplication.
 */
export function printlistKey(
  fabricLabel: string,
  shape: string,
  cutWidth: number,
  cutHeight: number
): string {
  return `${fabricLabel}::${shape}::${cutWidth.toFixed(4)}::${cutHeight.toFixed(4)}`;
}

/**
 * Infer a color family group from a fabric label or hex color.
 * Uses basic hue classification for hex colors.
 */
export function inferFabricGroup(fabricLabel: string, colorHex: string): string {
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
export function classifyHexToFamily(hex: string): string {
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
 * Collects custom block definitions for blocks that had no match in the
 * library (where needsCustomBlock is true). Generates a placeholder SVG
 * for each unmatched block.
 */
export function collectCustomBlocks(
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
