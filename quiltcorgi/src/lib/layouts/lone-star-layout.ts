/**
 * Lone Star Layout Engine
 *
 * Computes an 8-pointed star (Lone Star / Star of Bethlehem) layout
 * with diamond units in concentric rings and background fill shapes.
 *
 * Pure computation — no React or Fabric.js dependency.
 */

import type {
  LayoutConfig,
  LayoutResult,
  LayoutCell,
  LayoutSettingTriangle,
} from '@/lib/layout-engine';

/**
 * Compute Lone Star layout: 8 arms of diamond units + background fills.
 */
export function computeLoneStarLayout(config: LayoutConfig, pxPerUnit: number): LayoutResult {
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

  if (!config.loneStar) return emptyResult;

  const { diamondRings } = config.loneStar;
  const totalSizePx = config.blockSize * pxPerUnit;
  const centerX = totalSizePx / 2;
  const centerY = totalSizePx / 2;

  // Star geometry
  const starRadius = totalSizePx * 0.45; // Star takes 90% of the block
  const ringWidth = starRadius / diamondRings;

  const cells: LayoutCell[] = [];

  // 8 arms, each divided into rings
  for (let arm = 0; arm < 8; arm++) {
    const armAngle = (arm * Math.PI) / 4; // 45-degree intervals

    for (let ring = 0; ring < diamondRings; ring++) {
      const distFromCenter = (ring + 0.5) * ringWidth;
      const dx = distFromCenter * Math.cos(armAngle);
      const dy = distFromCenter * Math.sin(armAngle);

      cells.push({
        row: arm,
        col: ring,
        centerX: centerX + dx,
        centerY: centerY + dy,
        size: ringWidth,
        rotation: (arm * 45) % 360,
      });
    }
  }

  // Background shapes: 4 corner squares + 4 side triangles
  const settingTriangles: LayoutSettingTriangle[] = [];
  const cornerOffset = totalSizePx * 0.35;

  // 4 corner squares (at 45, 135, 225, 315 degrees)
  for (let i = 0; i < 4; i++) {
    const angle = ((i * 2 + 1) * Math.PI) / 4; // 45, 135, 225, 315
    const cx = centerX + cornerOffset * Math.cos(angle);
    const cy = centerY + cornerOffset * Math.sin(angle);
    const halfSize = ringWidth * 0.8;

    settingTriangles.push({
      points: [
        { x: cx - halfSize, y: cy - halfSize },
        { x: cx + halfSize, y: cy - halfSize },
        { x: cx + halfSize, y: cy + halfSize },
        { x: cx - halfSize, y: cy + halfSize },
      ],
      type: 'corner',
    });
  }

  // 4 side triangles (at 0, 90, 180, 270 degrees)
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2; // 0, 90, 180, 270
    const tipX = centerX + starRadius * Math.cos(angle);
    const tipY = centerY + starRadius * Math.sin(angle);
    const perpAngle = angle + Math.PI / 2;
    const baseOffset = ringWidth;

    settingTriangles.push({
      points: [
        { x: tipX, y: tipY },
        { x: tipX + baseOffset * Math.cos(perpAngle), y: tipY + baseOffset * Math.sin(perpAngle) },
        { x: tipX - baseOffset * Math.cos(perpAngle), y: tipY - baseOffset * Math.sin(perpAngle) },
      ],
      type: 'side',
    });
  }

  return {
    cells,
    sashingStrips: [],
    settingTriangles,
    borderStrips: [],
    piecedBorderUnits: [],
    innerWidth: totalSizePx,
    innerHeight: totalSizePx,
    totalWidth: totalSizePx,
    totalHeight: totalSizePx,
  };
}
