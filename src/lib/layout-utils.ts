/**
 * Layout Engine — Pure computation functions for quilt layout generation.
 *
 * Computes cell positions, sashing strips, setting triangles, and borders
 * for Grid, Sashing, On-Point, and Free-Form layout types.
 * All outputs are in pixels. Callers convert from units using pxPerUnit.
 */

export type LayoutType = 'none' | 'free-form' | 'grid' | 'sashing' | 'on-point' | 'strippy' | 'medallion';

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

export interface LayoutConfig {
  type: LayoutType;
  rows: number;
  cols: number;
  blockSize: number;
  sashing: SashingConfig;
  borders: BorderConfig[];
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
  /** Optional fill color for setting shapes */
  fill?: string;
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
  if (config.type === 'none') {
    return { ...EMPTY_RESULT };
  }

  // Validate inputs
  const rows = Math.max(1, Math.min(20, config.rows));
  const cols = Math.max(1, Math.min(20, config.cols));
  const blockSize = Math.max(1, Math.min(24, config.blockSize));
  const blockSizePx = blockSize * pxPerUnit;

  let result: LayoutResult;

  switch (config.type) {
    case 'grid':
      result = computeGridLayout(rows, cols, blockSizePx);
      break;
    case 'sashing':
      result = computeSashingLayout(
        rows,
        cols,
        blockSizePx,
        Math.max(0.25, config.sashing.width) * pxPerUnit,
        config.sashing
      );
      break;
    case 'on-point':
      result = computeOnPointLayout(rows, cols, blockSizePx);
      break;
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

  // Rotated block diagonal = blockSizePx * sqrt(2)
  const diagonal = blockSizePx * Math.SQRT2;
  const halfDiagonal = diagonal / 2;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      cells.push({
        row: r,
        col: c,
        centerX: c * diagonal + halfDiagonal,
        centerY: r * diagonal + halfDiagonal,
        size: blockSizePx,
        rotation: 45,
      });
    }
  }

  const innerWidth = cols * diagonal;
  const innerHeight = rows * diagonal;

  // Top edge setting triangles
  for (let c = 0; c < cols - 1; c++) {
    settingTriangles.push({
      type: 'side',
      points: [
        { x: (c + 0.5) * diagonal, y: 0 },
        { x: (c + 1) * diagonal, y: halfDiagonal },
        { x: (c + 1.5) * diagonal, y: 0 },
      ],
    });
  }

  // Bottom edge setting triangles
  for (let c = 0; c < cols - 1; c++) {
    settingTriangles.push({
      type: 'side',
      points: [
        { x: (c + 0.5) * diagonal, y: innerHeight },
        { x: (c + 1) * diagonal, y: innerHeight - halfDiagonal },
        { x: (c + 1.5) * diagonal, y: innerHeight },
      ],
    });
  }

  // Left edge setting triangles
  for (let r = 0; r < rows - 1; r++) {
    settingTriangles.push({
      type: 'side',
      points: [
        { x: 0, y: (r + 0.5) * diagonal },
        { x: halfDiagonal, y: (r + 1) * diagonal },
        { x: 0, y: (r + 1.5) * diagonal },
      ],
    });
  }

  // Right edge setting triangles
  for (let r = 0; r < rows - 1; r++) {
    settingTriangles.push({
      type: 'side',
      points: [
        { x: innerWidth, y: (r + 0.5) * diagonal },
        { x: innerWidth - halfDiagonal, y: (r + 1) * diagonal },
        { x: innerWidth, y: (r + 1.5) * diagonal },
      ],
    });
  }

  // Corner triangles
  settingTriangles.push(
    {
      type: 'corner',
      points: [
        { x: 0, y: 0 },
        { x: halfDiagonal, y: 0 },
        { x: 0, y: halfDiagonal },
      ],
    },
    {
      type: 'corner',
      points: [
        { x: innerWidth, y: 0 },
        { x: innerWidth - halfDiagonal, y: 0 },
        { x: innerWidth, y: halfDiagonal },
      ],
    },
    {
      type: 'corner',
      points: [
        { x: 0, y: innerHeight },
        { x: halfDiagonal, y: innerHeight },
        { x: 0, y: innerHeight - halfDiagonal },
      ],
    },
    {
      type: 'corner',
      points: [
        { x: innerWidth, y: innerHeight },
        { x: innerWidth - halfDiagonal, y: innerHeight },
        { x: innerWidth, y: innerHeight - halfDiagonal },
      ],
    }
  );

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
  let accumulatedOffset = 0;

  for (let i = 0; i < borders.length; i++) {
    const border = borders[i];
    const bw = border.width * pxPerUnit;

    // Top/bottom strips span innerWidth + accumulated offset (NOT corners).
    // Left/right strips span full height INCLUDING their own border width (covering corners).
    // This asymmetry means left/right strips "paint over" corner areas — intentional
    // so that vertical borders create continuous strips from top to bottom.

    // Top strip - spans only innerWidth + accumulated offset (not corners)
    strips.push({
      x: accumulatedOffset === 0 ? 0 : -accumulatedOffset,
      y: -accumulatedOffset - bw,
      width: innerWidth + 2 * accumulatedOffset,
      height: bw,
      color: border.color,
      fabricId: border.fabricId,
      borderIndex: i,
      side: 'top',
    });

    // Bottom strip - spans only innerWidth + accumulated offset (not corners)
    strips.push({
      x: accumulatedOffset === 0 ? 0 : -accumulatedOffset,
      y: innerHeight + accumulatedOffset,
      width: innerWidth + 2 * accumulatedOffset,
      height: bw,
      color: border.color,
      fabricId: border.fabricId,
      borderIndex: i,
      side: 'bottom',
    });

    // Left strip - spans full outer height including corners
    strips.push({
      x: -accumulatedOffset - bw,
      y: -accumulatedOffset - bw,
      width: bw,
      height: innerHeight + 2 * accumulatedOffset + 2 * bw,
      color: border.color,
      fabricId: border.fabricId,
      borderIndex: i,
      side: 'left',
    });

    // Right strip - spans full outer height including corners
    strips.push({
      x: innerWidth + accumulatedOffset,
      y: -accumulatedOffset - bw,
      width: bw,
      height: innerHeight + 2 * accumulatedOffset + 2 * bw,
      color: border.color,
      fabricId: border.fabricId,
      borderIndex: i,
      side: 'right',
    });

    accumulatedOffset += bw;
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
      color: '#e5d5c5',
      fabricId: null,
    },
    borders: [],
  };
}
