/**
 * Designer Fence Engine
 *
 * Pure computation: computes fence areas for a simple quilt grid
 * with optional sashing and borders. MVP — no cornerstones, binding, or edging.
 * Zero DOM dependencies.
 */

import type { FenceArea } from '@/types/fence';

export interface DesignerBorderConfig {
  width: number;
  fabricId: string | null;
  fabricUrl: string | null;
}

/**
 * Compute fence areas for the simple designer quilt layout.
 *
 * @param rows         Number of block rows
 * @param cols         Number of block columns
 * @param blockSize    Size of each block in inches (or cm depending on unit system)
 * @param sashingWidth Width of sashing strips (0 = no sashing)
 * @param borders      Array of border configurations (outermost first)
 * @param quiltWidthIn  Total quilt width in inches
 * @param quiltHeightIn Total quilt height in inches
 * @param pxPerUnit    Pixels per unit (typically 96 for imperial)
 * @returns Array of FenceArea objects scaled to fit inside the quilt
 */
export function computeDesignerFenceAreas(
  rows: number,
  cols: number,
  blockSize: number,
  sashingWidth: number,
  borders: DesignerBorderConfig[],
  quiltWidthIn: number,
  quiltHeightIn: number,
  pxPerUnit: number
): FenceArea[] {
  const areas: FenceArea[] = [];

  // Compute the total size taken by blocks + sashing
  const totalBlockWidth = cols * blockSize;
  const totalBlockHeight = rows * blockSize;
  const totalSashingWidth = (cols - 1) * sashingWidth;
  const totalSashingHeight = (rows - 1) * sashingWidth;

  // Content area: blocks + sashing
  const contentWidthIn = totalBlockWidth + totalSashingWidth;
  const contentHeightIn = totalBlockHeight + totalSashingHeight;

  // Border total width on each side
  const totalBorderWidth = borders.reduce((sum, b) => sum + b.width, 0);

  // Total layout size including borders
  const layoutWidthIn = contentWidthIn + totalBorderWidth * 2;
  const layoutHeightIn = contentHeightIn + totalBorderHeight(borders) * 2;

  // Scale to fit the actual quilt dimensions
  const scaleX = quiltWidthIn / Math.max(layoutWidthIn, 1);
  const scaleY = quiltHeightIn / Math.max(layoutHeightIn, 1);

  // Compute pixel dimensions for each element type
  const blockWidthPx = blockSize * scaleX * pxPerUnit;
  const blockHeightPx = blockSize * scaleY * pxPerUnit;
  const sashingWidthPx = sashingWidth * scaleX * pxPerUnit;
  const sashingHeightPx = sashingWidth * scaleY * pxPerUnit;

  // Compute border pixel dimensions (borders are uniform width on all sides in MVP)
  const borderSizesPx = borders.map((b) => ({
    widthPx: b.width * scaleX * pxPerUnit,
    heightPx: b.width * scaleY * pxPerUnit,
  }));

  // Calculate starting offset (center the content in the quilt)
  const quiltWidthPx = quiltWidthIn * pxPerUnit;
  const quiltHeightPx = quiltHeightIn * pxPerUnit;

  const contentAreaWidthPx = cols * blockWidthPx + (cols - 1) * sashingWidthPx;
  const contentAreaHeightPx = rows * blockHeightPx + (rows - 1) * sashingHeightPx;

  const totalBordersWidthPx = borderSizesPx.reduce((sum, b) => sum + b.widthPx, 0);
  const totalBordersHeightPx = borderSizesPx.reduce((sum, b) => sum + b.heightPx, 0);

  const offsetX =
    (quiltWidthPx - contentAreaWidthPx - totalBordersWidthPx * 2) / 2 + totalBordersWidthPx;
  const offsetY =
    (quiltHeightPx - contentAreaHeightPx - totalBordersHeightPx * 2) / 2 + totalBordersHeightPx;

  // Generate block cell areas
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = offsetX + col * (blockWidthPx + sashingWidthPx);
      const y = offsetY + row * (blockHeightPx + sashingHeightPx);

      areas.push({
        id: `cell-${row}-${col}`,
        role: 'block-cell',
        x,
        y,
        width: blockWidthPx,
        height: blockHeightPx,
        label: 'Block',
        row,
        col,
        assignedFabricId: null,
        assignedBlockId: null,
      });
    }
  }

  // Generate sashing strips (horizontal between rows)
  if (sashingWidth > 0 && rows > 1) {
    for (let row = 0; row < rows - 1; row++) {
      const y = offsetY + (row + 1) * blockHeightPx + row * sashingHeightPx;
      areas.push({
        id: `sashing-h-${row}`,
        role: 'sashing',
        x: offsetX,
        y,
        width: contentAreaWidthPx,
        height: sashingHeightPx,
        label: 'Sashing',
        assignedFabricId: null,
        assignedBlockId: null,
      });
    }
  }

  // Generate sashing strips (vertical between columns)
  if (sashingWidth > 0 && cols > 1) {
    for (let col = 0; col < cols - 1; col++) {
      const x = offsetX + (col + 1) * blockWidthPx + col * sashingWidthPx;
      areas.push({
        id: `sashing-v-${col}`,
        role: 'sashing',
        x,
        y: offsetY,
        width: sashingWidthPx,
        height: contentAreaHeightPx,
        label: 'Sashing',
        assignedFabricId: null,
        assignedBlockId: null,
      });
    }
  }

  // Generate border areas (4 sides per border layer)
  let borderOffsetPx = 0;
  for (let i = 0; i < borders.length; i++) {
    const border = borders[i];
    const bWidthPx = borderSizesPx[i].widthPx;
    const bHeightPx = borderSizesPx[i].heightPx;

    const innerX = offsetX - borderOffsetPx - bWidthPx;
    const innerY = offsetY - borderOffsetPx - bHeightPx;
    const innerWidth = contentAreaWidthPx + borderOffsetPx * 2 + bWidthPx * 2;
    const innerHeight = contentAreaHeightPx + borderOffsetPx * 2 + bHeightPx * 2;

    // Top border
    areas.push({
      id: `border-${i}-top`,
      role: 'border',
      x: innerX,
      y: innerY,
      width: innerWidth,
      height: bHeightPx,
      label: `Border ${i + 1}`,
      borderIndex: i,
      assignedFabricId: border.fabricId,
      assignedBlockId: null,
    });

    // Bottom border
    areas.push({
      id: `border-${i}-bottom`,
      role: 'border',
      x: innerX,
      y: innerY + innerHeight - bHeightPx,
      width: innerWidth,
      height: bHeightPx,
      label: `Border ${i + 1}`,
      borderIndex: i,
      assignedFabricId: border.fabricId,
      assignedBlockId: null,
    });

    // Left border
    areas.push({
      id: `border-${i}-left`,
      role: 'border',
      x: innerX,
      y: innerY + bHeightPx,
      width: bWidthPx,
      height: innerHeight - bHeightPx * 2,
      label: `Border ${i + 1}`,
      borderIndex: i,
      assignedFabricId: border.fabricId,
      assignedBlockId: null,
    });

    // Right border
    areas.push({
      id: `border-${i}-right`,
      role: 'border',
      x: innerX + innerWidth - bWidthPx,
      y: innerY + bHeightPx,
      width: bWidthPx,
      height: innerHeight - bHeightPx * 2,
      label: `Border ${i + 1}`,
      borderIndex: i,
      assignedFabricId: border.fabricId,
      assignedBlockId: null,
    });

    borderOffsetPx += Math.max(bWidthPx, bHeightPx);
  }

  return areas;
}

/**
 * Compute the total border width for one side (top/bottom use height, left/right use width).
 * For MVP, we treat border.width as uniform on all sides.
 */
function totalBorderWidth(borders: DesignerBorderConfig[]): number {
  return borders.reduce((sum, b) => sum + b.width, 0);
}

function totalBorderHeight(borders: DesignerBorderConfig[]): number {
  return borders.reduce((sum, b) => sum + b.width, 0);
}
