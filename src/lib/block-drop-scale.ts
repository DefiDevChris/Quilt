/**
 * Pure function to compute uniform scale factor for dropping a block
 * into a fence cell. Uses min(cellW/blockW, cellH/blockH) to ensure
 * the block fits within the cell while maintaining aspect ratio.
 *
 * Per project conventions (CLAUDE.md Fabric.js section), scaleX === scaleY.
 */
export function computeBlockDropScale(
  cellWidth: number,
  cellHeight: number,
  blockWidth: number,
  blockHeight: number
): number {
  if (blockWidth <= 0 || blockHeight <= 0) return 1;
  if (cellWidth <= 0 || cellHeight <= 0) return 1;
  return Math.min(cellWidth / blockWidth, cellHeight / blockHeight);
}
