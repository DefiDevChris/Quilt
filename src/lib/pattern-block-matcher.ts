/**
 * Pattern Block Matcher Engine
 *
 * Matches parsed pattern blocks to the 659-block library using a multi-strategy
 * approach: exact name, normalized name, and tag-based keyword search.
 * Generates placeholder SVGs for unmatched blocks.
 *
 * Pure computation — no React, DOM, or Fabric.js dependency.
 */

import type { ParsedBlock } from './pattern-parser-types';
import { normalizeBlockName } from './string-utils';
export { normalizeBlockName } from './string-utils';

// ── Types ──────────────────────────────────────────────────────────

export interface BlockLibraryEntry {
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly tags: string[];
  readonly svgData: string;
}

export interface BlockMatchResult {
  readonly patternBlockName: string;
  readonly matchedBlockId: string | null;
  readonly matchedBlockName: string | null;
  readonly confidence: number;
  readonly matchMethod: 'exact-name' | 'normalized-name' | 'tag' | 'none';
  readonly needsCustomBlock: boolean;
}

// ── Constants ──────────────────────────────────────────────────────

const TRAILING_SUFFIXES = /\b(quilt|block|unit)$/;

const STOP_WORDS = new Set([
  'the',
  'a',
  'an',
  'of',
  'in',
  'on',
  'at',
  'to',
  'for',
  'and',
  'or',
  'with',
]);

const CONFIDENCE_EXACT = 1.0;
const CONFIDENCE_NORMALIZED = 0.85;
const CONFIDENCE_TAG_SINGLE = 0.6;
const CONFIDENCE_TAG_AMBIGUOUS = 0.4;
const CONFIDENCE_NONE = 0.0;

// ── Name Normalization ─────────────────────────────────────────────

/**
 * Strips common stop words from a normalized name, returning only
 * meaningful keywords.
 */
function extractKeywords(name: string): string[] {
  return normalizeBlockName(name)
    .split(/\s+/)
    .filter((word) => word.length > 0 && !STOP_WORDS.has(word));
}

// ── Matching Strategies ────────────────────────────────────────────

function tryExactMatch(
  blockName: string,
  library: readonly BlockLibraryEntry[]
): BlockLibraryEntry | null {
  const lower = blockName.toLowerCase().trim();
  return library.find((entry) => entry.name.toLowerCase().trim() === lower) ?? null;
}

function tryNormalizedMatch(
  blockName: string,
  library: readonly BlockLibraryEntry[]
): BlockLibraryEntry | null {
  const normalized = normalizeBlockName(blockName);
  if (normalized.length === 0) {
    return null;
  }

  return library.find((entry) => normalizeBlockName(entry.name) === normalized) ?? null;
}

function tryTagMatch(
  blockName: string,
  library: readonly BlockLibraryEntry[]
): { entry: BlockLibraryEntry; isAmbiguous: boolean } | null {
  const keywords = extractKeywords(blockName);
  if (keywords.length === 0) {
    return null;
  }

  const scored = library
    .map((entry) => {
      const entryTags = entry.tags.map((t) => t.toLowerCase());
      const matchCount = keywords.filter((kw) => entryTags.includes(kw)).length;
      return { entry, matchCount };
    })
    .filter((item) => item.matchCount > 0)
    .sort((a, b) => b.matchCount - a.matchCount);

  if (scored.length === 0) {
    return null;
  }

  const best = scored[0];
  const isAmbiguous = scored.length > 1 && scored[1].matchCount === best.matchCount;

  return { entry: best.entry, isAmbiguous };
}

// ── Public API ─────────────────────────────────────────────────────

/**
 * Matches a single parsed pattern block against the block library.
 *
 * Strategy priority:
 * 1. Exact case-insensitive name match (confidence 1.0)
 * 2. Normalized name match — suffix-stripped, stop-word comparison (confidence 0.85)
 * 3. Tag-based keyword overlap (confidence 0.6 for single match, 0.4 for ambiguous)
 * 4. No match (confidence 0.0, needsCustomBlock = true)
 */
export function matchPatternBlock(
  blockDescription: ParsedBlock,
  blockLibrary: readonly BlockLibraryEntry[]
): BlockMatchResult {
  const patternBlockName = blockDescription.name;

  // Strategy 1: Exact match
  const exactMatch = tryExactMatch(patternBlockName, blockLibrary);
  if (exactMatch) {
    return {
      patternBlockName,
      matchedBlockId: exactMatch.id,
      matchedBlockName: exactMatch.name,
      confidence: CONFIDENCE_EXACT,
      matchMethod: 'exact-name',
      needsCustomBlock: false,
    };
  }

  // Strategy 2: Normalized match
  const normalizedMatch = tryNormalizedMatch(patternBlockName, blockLibrary);
  if (normalizedMatch) {
    return {
      patternBlockName,
      matchedBlockId: normalizedMatch.id,
      matchedBlockName: normalizedMatch.name,
      confidence: CONFIDENCE_NORMALIZED,
      matchMethod: 'normalized-name',
      needsCustomBlock: false,
    };
  }

  // Strategy 3: Tag-based match
  const tagMatch = tryTagMatch(patternBlockName, blockLibrary);
  if (tagMatch) {
    return {
      patternBlockName,
      matchedBlockId: tagMatch.entry.id,
      matchedBlockName: tagMatch.entry.name,
      confidence: tagMatch.isAmbiguous ? CONFIDENCE_TAG_AMBIGUOUS : CONFIDENCE_TAG_SINGLE,
      matchMethod: 'tag',
      needsCustomBlock: false,
    };
  }

  // Strategy 4: No match
  return {
    patternBlockName,
    matchedBlockId: null,
    matchedBlockName: null,
    confidence: CONFIDENCE_NONE,
    matchMethod: 'none',
    needsCustomBlock: true,
  };
}

/**
 * Batch-matches all parsed blocks against the library.
 * Returns one result per input block in the same order.
 */
export function matchAllBlocks(
  blocks: readonly ParsedBlock[],
  blockLibrary: readonly BlockLibraryEntry[]
): BlockMatchResult[] {
  return blocks.map((block) => matchPatternBlock(block, blockLibrary));
}

// ── Placeholder SVG Generation ─────────────────────────────────────

/**
 * Computes a grid subdivision that best approximates the given piece count.
 * Tries to find the most square-like arrangement.
 */
function computeGridDimensions(pieceCount: number): { cols: number; rows: number } {
  if (pieceCount <= 0) {
    return { cols: 1, rows: 1 };
  }

  const sqrt = Math.sqrt(pieceCount);
  const cols = Math.ceil(sqrt);
  const rows = Math.ceil(pieceCount / cols);

  return { cols, rows };
}

/**
 * Escapes XML special characters in text content.
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Truncates a block name to fit within the SVG text area.
 * Keeps the first ~14 characters and appends an ellipsis if needed.
 */
function truncateForSvg(name: string, maxLength: number = 14): string {
  if (name.length <= maxLength) {
    return name;
  }
  return `${name.slice(0, maxLength - 1)}\u2026`;
}

/**
 * Generates a simple placeholder SVG for an unmatched block.
 *
 * Uses the standard 100x100 viewBox convention shared by all block generators.
 * Shows a grid subdivision based on piece count (e.g., 4 pieces = 2x2,
 * 9 = 3x3) with the block name as a small text element.
 *
 * @param blockName - Display name for the block
 * @param _width - Finished width in inches (reserved for future use)
 * @param _height - Finished height in inches (reserved for future use)
 * @param pieceCount - Number of pieces to approximate as a grid
 */
export function generateCustomBlockSvg(
  blockName: string,
  _width: number,
  _height: number,
  pieceCount: number
): string {
  const viewBoxSize = 100;
  const { cols, rows } = computeGridDimensions(pieceCount);

  const cellWidth = viewBoxSize / cols;
  const cellHeight = viewBoxSize / rows;

  const gridLines: string[] = [];

  // Vertical grid lines
  for (let c = 1; c < cols; c++) {
    const x = c * cellWidth;
    gridLines.push(
      `<line x1="${x}" y1="0" x2="${x}" y2="${viewBoxSize}" stroke="#333" stroke-width="0.5" fill="none"/>`
    );
  }

  // Horizontal grid lines
  for (let r = 1; r < rows; r++) {
    const y = r * cellHeight;
    gridLines.push(
      `<line x1="0" y1="${y}" x2="${viewBoxSize}" y2="${y}" stroke="#333" stroke-width="0.5" fill="none"/>`
    );
  }

  const displayName = truncateForSvg(blockName);
  const escapedName = escapeXml(displayName);

  // Font size scales down for longer names
  const fontSize = displayName.length > 10 ? 6 : 7;

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewBoxSize} ${viewBoxSize}">`,
    `<rect x="0" y="0" width="${viewBoxSize}" height="${viewBoxSize}" fill="none" stroke="#333" stroke-width="0.5"/>`,
    ...gridLines,
    `<text x="50" y="94" text-anchor="middle" font-size="${fontSize}" fill="#333" font-family="sans-serif">${escapedName}</text>`,
    '</svg>',
  ].join('');
}
