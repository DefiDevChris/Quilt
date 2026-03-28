/**
 * Medallion Layout Engine
 *
 * Computes a center block with concentric border rounds.
 * Each round can be solid or pieced (via border-generator).
 *
 * Pure computation — no React or Fabric.js dependency.
 */

import type {
  LayoutConfig,
  LayoutResult,
  LayoutCell,
  LayoutBorderStrip,
} from '@/lib/layout-engine';

/**
 * Compute medallion layout: center block + concentric rounds.
 */
export function computeMedallionLayout(config: LayoutConfig, pxPerUnit: number): LayoutResult {
  const emptyResult: LayoutResult = {
    cells: [],
    sashingStrips: [],
    settingTriangles: [],
    borderStrips: [],
    piecedBorderUnits: [],
    innerWidth: 0,
    innerHeight: 0,
    totalWidth: 0,
    totalHeight: 0,
  };

  if (!config.medallion) return emptyResult;

  const { centerBlockSize, rounds } = config.medallion;
  const centerSizePx = centerBlockSize * pxPerUnit;

  // Center block
  const centerCell: LayoutCell = {
    row: 0,
    col: 0,
    centerX: centerSizePx / 2,
    centerY: centerSizePx / 2,
    size: centerSizePx,
    rotation: 0,
  };

  const cells: LayoutCell[] = [centerCell];
  const borderStrips: LayoutBorderStrip[] = [];
  let currentWidth = centerSizePx;
  let currentHeight = centerSizePx;

  // Add concentric rounds
  let accOffset = 0;
  for (let i = 0; i < rounds.length; i++) {
    const round = rounds[i];
    const roundWidthPx = round.width * pxPerUnit;

    if (round.type === 'solid') {
      // Top strip
      borderStrips.push({
        x: -(accOffset + roundWidthPx),
        y: -(accOffset + roundWidthPx),
        width: currentWidth + 2 * roundWidthPx,
        height: roundWidthPx,
        color: round.color,
        fabricId: round.fabricId,
        borderIndex: i,
        side: 'top',
      });

      // Bottom strip
      borderStrips.push({
        x: -(accOffset + roundWidthPx),
        y: centerSizePx + accOffset,
        width: currentWidth + 2 * roundWidthPx,
        height: roundWidthPx,
        color: round.color,
        fabricId: round.fabricId,
        borderIndex: i,
        side: 'bottom',
      });

      // Left strip
      borderStrips.push({
        x: -(accOffset + roundWidthPx),
        y: -accOffset,
        width: roundWidthPx,
        height: currentHeight,
        color: round.color,
        fabricId: round.fabricId,
        borderIndex: i,
        side: 'left',
      });

      // Right strip
      borderStrips.push({
        x: centerSizePx + accOffset,
        y: -accOffset,
        width: roundWidthPx,
        height: currentHeight,
        color: round.color,
        fabricId: round.fabricId,
        borderIndex: i,
        side: 'right',
      });
    }

    accOffset += roundWidthPx;
    currentWidth += 2 * roundWidthPx;
    currentHeight += 2 * roundWidthPx;
  }

  return {
    cells,
    sashingStrips: [],
    settingTriangles: [],
    borderStrips,
    piecedBorderUnits: [],
    innerWidth: centerSizePx,
    innerHeight: centerSizePx,
    totalWidth: currentWidth,
    totalHeight: currentHeight,
  };
}
