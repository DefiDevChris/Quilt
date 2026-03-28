/**
 * Layout Engine — Pure computation functions for quilt layout generation.
 *
 * Computes cell positions, sashing strips, setting triangles, and borders
 * for Grid, Sashing, On-Point, Medallion, Lone Star, and Free-Form layout types.
 * All outputs are in pixels. Callers convert from units using pxPerUnit.
 */

import { computeMedallionLayout } from '@/lib/layouts/medallion-layout';
import { computeLoneStarLayout } from '@/lib/layouts/lone-star-layout';

export type LayoutType = 'free-form' | 'grid' | 'sashing' | 'on-point' | 'medallion' | 'lone-star';

export interface SashingConfig {
  width: number;
  color: string;
  fabricId: string | null;
}

export interface BorderConfig {
  id?: string;
  width: number;
  color: string;
  fabricId: string | null;
  type?: 'solid' | 'pieced';
  pattern?: string;
  unitSize?: number;
  secondaryColor?: string;
  secondaryFabricId?: string | null;
  cornerTreatment?: string;
  customBlockId?: string;
}

export interface MedallionRound {
  type: 'solid' | 'pieced';
  width: number;
  color: string;
  fabricId: string | null;
  pattern?: string;
  unitSize?: number;
  secondaryColor?: string;
}

export interface MedallionConfig {
  centerBlockSize: number;
  rounds: MedallionRound[];
}

export interface LoneStarConfig {
  diamondRings: number;
  ringColors: string[];
  backgroundFill: string;
}

export interface LayoutConfig {
  type: LayoutType;
  rows: number;
  cols: number;
  blockSize: number;
  sashing: SashingConfig;
  borders: BorderConfig[];
  medallion?: MedallionConfig;
  loneStar?: LoneStarConfig;
}

export interface LayoutCell {
  row: number;
  col: number;
  centerX: number;
  centerY: number;
  size: number;
  rotation: number;
}

export interface LayoutSashingStrip {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  fabricId: string | null;
}

export interface LayoutSettingTriangle {
  points: Array<{ x: number; y: number }>;
  type: 'side' | 'corner';
}

export interface LayoutBorderStrip {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  fabricId: string | null;
  borderIndex: number;
  side: 'top' | 'bottom' | 'left' | 'right';
}

export interface LayoutResult {
  cells: LayoutCell[];
  sashingStrips: LayoutSashingStrip[];
  settingTriangles: LayoutSettingTriangle[];
  borderStrips: LayoutBorderStrip[];
  piecedBorderUnits: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    svgData: string;
    color: string;
    fabricId: string | null;
    rotation: number;
  }>;
  innerWidth: number;
  innerHeight: number;
  totalWidth: number;
  totalHeight: number;
}

const EMPTY_RESULT: LayoutResult = {
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

export function computeLayout(config: LayoutConfig, pxPerUnit: number): LayoutResult {
  if (config.type === 'free-form') {
    return { ...EMPTY_RESULT };
  }

  const blockSizePx = config.blockSize * pxPerUnit;

  let result: LayoutResult;

  switch (config.type) {
    case 'grid':
      result = computeGridLayout(config.rows, config.cols, blockSizePx);
      break;
    case 'sashing':
      result = computeSashingLayout(
        config.rows,
        config.cols,
        blockSizePx,
        config.sashing.width * pxPerUnit,
        config.sashing
      );
      break;
    case 'on-point':
      result = computeOnPointLayout(config.rows, config.cols, blockSizePx);
      break;
    case 'medallion':
      return computeMedallionLayout(config, pxPerUnit);
    case 'lone-star':
      return computeLoneStarLayout(config, pxPerUnit);
    default:
      return { ...EMPTY_RESULT };
  }

  result.borderStrips = computeBorderStrips(
    result.innerWidth,
    result.innerHeight,
    config.borders,
    pxPerUnit
  );

  const totalBorderWidth = config.borders.reduce((sum, b) => sum + b.width * pxPerUnit, 0);
  result.totalWidth = result.innerWidth + totalBorderWidth * 2;
  result.totalHeight = result.innerHeight + totalBorderWidth * 2;

  return result;
}

export function computeGridLayout(rows: number, cols: number, blockSizePx: number): LayoutResult {
  const cells: LayoutCell[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      cells.push({
        row: r,
        col: c,
        centerX: c * blockSizePx + blockSizePx / 2,
        centerY: r * blockSizePx + blockSizePx / 2,
        size: blockSizePx,
        rotation: 0,
      });
    }
  }

  const innerWidth = cols * blockSizePx;
  const innerHeight = rows * blockSizePx;

  return {
    cells,
    sashingStrips: [],
    settingTriangles: [],
    borderStrips: [],
    piecedBorderUnits: [],
    innerWidth,
    innerHeight,
    totalWidth: innerWidth,
    totalHeight: innerHeight,
  };
}

export function computeSashingLayout(
  rows: number,
  cols: number,
  blockSizePx: number,
  sashingWidthPx: number,
  sashingConfig: SashingConfig
): LayoutResult {
  const cells: LayoutCell[] = [];
  const sashingStrips: LayoutSashingStrip[] = [];

  const cellStride = blockSizePx + sashingWidthPx;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      cells.push({
        row: r,
        col: c,
        centerX: c * cellStride + blockSizePx / 2,
        centerY: r * cellStride + blockSizePx / 2,
        size: blockSizePx,
        rotation: 0,
      });
    }
  }

  // Vertical sashing strips (between columns)
  for (let c = 0; c < cols - 1; c++) {
    const stripX = (c + 1) * cellStride - sashingWidthPx;
    sashingStrips.push({
      x: stripX,
      y: 0,
      width: sashingWidthPx,
      height: rows * cellStride - sashingWidthPx,
      color: sashingConfig.color,
      fabricId: sashingConfig.fabricId,
    });
  }

  // Horizontal sashing strips (between rows)
  for (let r = 0; r < rows - 1; r++) {
    const stripY = (r + 1) * cellStride - sashingWidthPx;
    sashingStrips.push({
      x: 0,
      y: stripY,
      width: cols * cellStride - sashingWidthPx,
      height: sashingWidthPx,
      color: sashingConfig.color,
      fabricId: sashingConfig.fabricId,
    });
  }

  // Cornerstone squares at sashing intersections
  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < cols - 1; c++) {
      const csX = (c + 1) * cellStride - sashingWidthPx;
      const csY = (r + 1) * cellStride - sashingWidthPx;
      sashingStrips.push({
        x: csX,
        y: csY,
        width: sashingWidthPx,
        height: sashingWidthPx,
        color: sashingConfig.color,
        fabricId: sashingConfig.fabricId,
      });
    }
  }

  const innerWidth = cols * blockSizePx + (cols - 1) * sashingWidthPx;
  const innerHeight = rows * blockSizePx + (rows - 1) * sashingWidthPx;

  return {
    cells,
    sashingStrips,
    settingTriangles: [],
    borderStrips: [],
    piecedBorderUnits: [],
    innerWidth,
    innerHeight,
    totalWidth: innerWidth,
    totalHeight: innerHeight,
  };
}

export function computeOnPointLayout(
  rows: number,
  cols: number,
  blockSizePx: number
): LayoutResult {
  const cells: LayoutCell[] = [];
  const settingTriangles: LayoutSettingTriangle[] = [];

  // When a block of side s is rotated 45 degrees, its bounding box is s*sqrt(2).
  // Blocks are placed so their vertices touch (point-to-point tiling).
  const cellSize = blockSizePx * Math.SQRT2;
  const halfCell = cellSize / 2;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      cells.push({
        row: r,
        col: c,
        centerX: c * cellSize + halfCell,
        centerY: r * cellSize + halfCell,
        size: blockSizePx,
        rotation: 45,
      });
    }
  }

  const innerWidth = cols * cellSize;
  const innerHeight = rows * cellSize;

  // Setting triangles along edges — fill the triangular gaps between
  // the outermost rotated blocks and the rectangular boundary.

  // Top edge triangles (between adjacent top-row blocks)
  for (let c = 0; c < cols - 1; c++) {
    settingTriangles.push({
      type: 'side',
      points: [
        { x: c * cellSize + halfCell, y: 0 },
        { x: (c + 1) * cellSize, y: halfCell },
        { x: (c + 1) * cellSize + halfCell, y: 0 },
      ],
    });
  }

  // Bottom edge triangles
  for (let c = 0; c < cols - 1; c++) {
    settingTriangles.push({
      type: 'side',
      points: [
        { x: c * cellSize + halfCell, y: innerHeight },
        { x: (c + 1) * cellSize, y: innerHeight - halfCell },
        { x: (c + 1) * cellSize + halfCell, y: innerHeight },
      ],
    });
  }

  // Left edge triangles (between adjacent left-column blocks)
  for (let r = 0; r < rows - 1; r++) {
    settingTriangles.push({
      type: 'side',
      points: [
        { x: 0, y: r * cellSize + halfCell },
        { x: halfCell, y: (r + 1) * cellSize },
        { x: 0, y: (r + 1) * cellSize + halfCell },
      ],
    });
  }

  // Right edge triangles
  for (let r = 0; r < rows - 1; r++) {
    settingTriangles.push({
      type: 'side',
      points: [
        { x: innerWidth, y: r * cellSize + halfCell },
        { x: innerWidth - halfCell, y: (r + 1) * cellSize },
        { x: innerWidth, y: (r + 1) * cellSize + halfCell },
      ],
    });
  }

  // Corner triangles (4 corners of the quilt)
  // Top-left
  settingTriangles.push({
    type: 'corner',
    points: [
      { x: 0, y: 0 },
      { x: halfCell, y: 0 },
      { x: 0, y: halfCell },
    ],
  });
  // Top-right
  settingTriangles.push({
    type: 'corner',
    points: [
      { x: innerWidth, y: 0 },
      { x: innerWidth - halfCell, y: 0 },
      { x: innerWidth, y: halfCell },
    ],
  });
  // Bottom-left
  settingTriangles.push({
    type: 'corner',
    points: [
      { x: 0, y: innerHeight },
      { x: halfCell, y: innerHeight },
      { x: 0, y: innerHeight - halfCell },
    ],
  });
  // Bottom-right
  settingTriangles.push({
    type: 'corner',
    points: [
      { x: innerWidth, y: innerHeight },
      { x: innerWidth - halfCell, y: innerHeight },
      { x: innerWidth, y: innerHeight - halfCell },
    ],
  });

  return {
    cells,
    sashingStrips: [],
    settingTriangles,
    borderStrips: [],
    piecedBorderUnits: [],
    innerWidth,
    innerHeight,
    totalWidth: innerWidth,
    totalHeight: innerHeight,
  };
}

export function computeBorderStrips(
  innerWidth: number,
  innerHeight: number,
  borders: BorderConfig[],
  pxPerUnit: number
): LayoutBorderStrip[] {
  const strips: LayoutBorderStrip[] = [];
  let offset = 0;

  for (let i = 0; i < borders.length; i++) {
    const border = borders[i];
    const bw = border.width * pxPerUnit;
    const outerX = -offset - bw;
    const outerY = -offset - bw;
    const outerW = innerWidth + 2 * (offset + bw);
    const outerH = innerHeight + 2 * (offset + bw);

    // Top strip
    strips.push({
      x: outerX,
      y: outerY,
      width: outerW,
      height: bw,
      color: border.color,
      fabricId: border.fabricId,
      borderIndex: i,
      side: 'top',
    });

    // Bottom strip
    strips.push({
      x: outerX,
      y: innerHeight + offset,
      width: outerW,
      height: bw,
      color: border.color,
      fabricId: border.fabricId,
      borderIndex: i,
      side: 'bottom',
    });

    // Left strip
    strips.push({
      x: outerX,
      y: outerY + bw,
      width: bw,
      height: outerH - 2 * bw,
      color: border.color,
      fabricId: border.fabricId,
      borderIndex: i,
      side: 'left',
    });

    // Right strip
    strips.push({
      x: innerWidth + offset,
      y: outerY + bw,
      width: bw,
      height: outerH - 2 * bw,
      color: border.color,
      fabricId: border.fabricId,
      borderIndex: i,
      side: 'right',
    });

    offset += bw;
  }

  return strips;
}

export function getDefaultLayoutConfig(): LayoutConfig {
  return {
    type: 'free-form',
    rows: 3,
    cols: 3,
    blockSize: 6,
    sashing: {
      width: 1,
      color: '#F5F0E8',
      fabricId: null,
    },
    borders: [],
  };
}
