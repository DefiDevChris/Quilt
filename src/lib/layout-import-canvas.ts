/**
 * Pattern Import Canvas Builder
 *
 * Build canvas objects from parsed layout data.
 */

import type { ParsedPattern, ParsedBlock } from './layout-parser-types';
import type { FabricMatch } from './layout-fabric-matcher';
import type { BlockMatchResult } from './layout-block-matcher';
import type { GridSettings, CanvasObject } from './layout-import-types';
import {
  fabricObject,
  findFabricMatch,
  findBlockMatch,
  resolveBlockColor,
  computeBorderOffset,
  FALLBACK_BLOCK_COLOR,
  SASHING_FILL,
  BORDER_FILL,
  DEFAULT_STROKE_COLOR,
  DEFAULT_STROKE_WIDTH,
} from './layout-import-helpers';
import {
  buildOnPointBlockObjects,
  buildCornerstoneObjects,
  buildPlaceholderObject,
  resolveBorderColors,
  resolveCornerstoneColor,
} from './layout-import-layouts';
import { PIXELS_PER_INCH } from '@/lib/constants';

/**
 * Places blocks on the canvas grid and generates border and sashing
 * elements around/between them.
 *
 * Handles three element types:
 * 1. **Grid blocks** — placed in a row x col arrangement
 * 2. **Border pieces** — placed around the grid perimeter
 * 3. **Sashing strips** — placed between blocks when sashingWidth > 0
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

  // ── Handle empty blocks ───────────────────────────────────────
  if (blocks.length === 0) {
    const canvasWidth = parsed.finishedWidth * PIXELS_PER_INCH;
    const canvasHeight = parsed.finishedHeight * PIXELS_PER_INCH;
    objects.push(buildPlaceholderObject(canvasWidth, canvasHeight));
    return objects;
  }

  // ── Borders ──────────────────────────────────────────────────
  // Build border rectangles from outermost to innermost.
  // Each border wraps around the previous layer.

  const borderColors = resolveBorderColors(fabricMatches, borderWidths.length);
  let currentBorderInset = 0;

  for (let i = 0; i < borderWidths.length; i++) {
    const bw = borderWidths[i];
    const bwPx = bw * PIXELS_PER_INCH;

    // Remaining inset from all borders inside this one
    const innerInset = borderWidths.slice(i + 1).reduce((s: number, w: number) => s + w, 0);
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

  // ── On-Point Layout ───────────────────────────────────────────
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
          fm.layoutLabel.toLowerCase().includes('sashing')
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
          fm.layoutLabel.toLowerCase().includes('sashing')
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

  // ── Cornerstones ──────────────────────────────────────────────
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
