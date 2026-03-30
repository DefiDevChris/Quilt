/**
 * Pattern Import Layouts
 *
 * Layout-specific logic for pattern import (on-point, borders, cornerstones, etc.)
 */

import type { ParsedPattern, ParsedBlock, ParsedLayout } from './pattern-parser-types';
import type { FabricMatch } from './pattern-fabric-matcher';
import type { BlockMatchResult } from './pattern-block-matcher';
import type { GridSettings, CanvasObject } from './pattern-import-types';
import {
  fabricObject,
  findFabricMatch,
  findBlockMatch,
  resolveBlockColor,
  BORDER_FILL,
  SASHING_FILL,
  DEFAULT_STROKE_COLOR,
  DEFAULT_STROKE_WIDTH,
} from './pattern-import-helpers';
import { PIXELS_PER_INCH } from '@/lib/constants';

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
export function buildOnPointBlockObjects(
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

/**
 * Resolve a distinct border color for each border layer.
 * Looks for fabric matches with 'border' in the label and cycles
 * through them. Falls back to the default border fill.
 */
export function resolveBorderColors(
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

/**
 * Resolve the cornerstone color from accent or contrasting fabrics.
 * Falls back to a muted tone if no accent fabric is available.
 */
export function resolveCornerstoneColor(fabricMatches: readonly FabricMatch[]): string {
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
export function buildCornerstoneObjects(
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

/**
 * Infer grid dimensions when rows and cols are both missing.
 *
 * If blocks exist, finds the closest rectangular grid that fits all
 * blocks. Prefers landscape orientation when the quilt is wider than tall.
 * If no blocks exist, returns { rows: 1, cols: 1 }.
 */
export function inferGridDimensions(
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
export function buildPlaceholderObject(canvasWidth: number, canvasHeight: number): CanvasObject {
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

/**
 * Derives grid settings from the parsed layout and block definitions.
 *
 * If the layout specifies explicit rows and cols, those values are used.
 * Otherwise, the grid dimensions are inferred from the total block count
 * and the quilt's finished dimensions to produce the best arrangement.
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
    // Use landscape-aware inference when quilt dimensions are available
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
