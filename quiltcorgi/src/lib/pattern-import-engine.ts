/**
 * Pattern Import Engine
 *
 * Orchestrates the transformation of parsed pattern data into a QuiltCorgi
 * project. Builds canvas objects, printlist items, grid settings, and custom
 * block definitions from a ParsedPattern + matched fabrics and blocks.
 *
 * Pure computation — no React, Fabric.js, DOM, or DB dependency.
 */

import type { ParsedPattern } from './pattern-parser-types';
import type { FabricMatch } from './pattern-fabric-matcher';
import type { BlockMatchResult } from './pattern-block-matcher';
import type { ImportedProject, GridSettings, CanvasData } from './pattern-import-types';
import { stripBranding, stripPatternName } from './pattern-branding-strip';
import { calculateGridFromLayout } from './pattern-import-layouts';
import { buildCanvasObjects } from './pattern-import-canvas';
import { buildPrintlistFromPattern, assignFabricGroups } from './pattern-import-printlist';
import { collectCustomBlocks, CANVAS_DATA_VERSION, CANVAS_BACKGROUND } from './pattern-import-helpers';
import { PIXELS_PER_INCH } from '@/lib/constants';

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

// Re-export types for consumers
export type {
  ImportedProject,
  GridSettings,
  CanvasData,
  CanvasObject,
  ImportedPrintlistItem,
  CustomBlockDefinition,
} from './pattern-import-types';

// Re-export functions for testing and advanced use
export { calculateGridFromLayout } from './pattern-import-layouts';
export { buildCanvasObjects } from './pattern-import-canvas';
export { buildPrintlistFromPattern } from './pattern-import-printlist';
