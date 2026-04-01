/**
 * Resize Engine — Pure computation for quilt resize operations.
 *
 * Scale mode: proportionally scales all object positions and dimensions.
 * Add-blocks mode: expands canvas and adds new layout cells.
 * Zero React/Fabric.js/DOM dependencies.
 */

import type { LayoutType } from '@/lib/layout-utils';

const MIN_DIMENSION = 1;
const MAX_DIMENSION = 200;

export interface CanvasObjectData {
  readonly id: string;
  readonly left: number;
  readonly top: number;
  readonly scaleX: number;
  readonly scaleY: number;
  readonly width: number;
  readonly height: number;
  readonly type: string;
}

export interface TransformedObject {
  readonly id: string;
  readonly left: number;
  readonly top: number;
  readonly scaleX: number;
  readonly scaleY: number;
  readonly width: number;
  readonly height: number;
  readonly type: string;
}

export interface LayoutSettingsUpdate {
  readonly rows: number;
  readonly cols: number;
  readonly blockSize: number;
}

export interface AddedCell {
  readonly row: number;
  readonly col: number;
  readonly centerX: number;
  readonly centerY: number;
  readonly size: number;
  readonly sourceObjectIds: readonly string[];
}

export interface ResizeSashingConfig {
  readonly width: number;
  readonly enabled: boolean;
}

export interface ResizeInput {
  readonly currentWidth: number;
  readonly currentHeight: number;
  readonly newWidth: number;
  readonly newHeight: number;
  readonly mode: 'scale' | 'add-blocks';
  readonly lockAspectRatio: boolean;
  readonly layoutType: LayoutType;
  readonly layoutSettings: LayoutSettingsUpdate | null;
  readonly objects: readonly CanvasObjectData[];
  readonly tilePattern: boolean;
  /** Sashing configuration for accurate cell position calculation */
  readonly sashing?: ResizeSashingConfig | null;
}

export interface ResizeResult {
  readonly newCanvasWidth: number;
  readonly newCanvasHeight: number;
  readonly objects: readonly TransformedObject[];
  readonly layoutSettings: LayoutSettingsUpdate | null;
  readonly addedCells: readonly AddedCell[];
}

function computeScaleResize(input: ResizeInput): ResizeResult {
  if (input.currentWidth === 0 || input.currentHeight === 0) {
    return {
      newCanvasWidth: input.newWidth,
      newCanvasHeight: input.newHeight,
      objects: [...input.objects],
      layoutSettings: null,
      addedCells: [],
    };
  }

  const scaleFactorX = input.newWidth / input.currentWidth;
  const scaleFactorY = input.newHeight / input.currentHeight;

  const objects: TransformedObject[] = input.objects.map((obj) => ({
    id: obj.id,
    left: obj.left * scaleFactorX,
    top: obj.top * scaleFactorY,
    scaleX: obj.scaleX * scaleFactorX,
    scaleY: obj.scaleY * scaleFactorY,
    width: obj.width,
    height: obj.height,
    type: obj.type,
  }));

  return {
    newCanvasWidth: input.newWidth,
    newCanvasHeight: input.newHeight,
    objects,
    layoutSettings: null,
    addedCells: [],
  };
}

function computeAddBlocksResize(input: ResizeInput): ResizeResult {
  const objects: TransformedObject[] = input.objects.map((obj) => ({
    id: obj.id,
    left: obj.left,
    top: obj.top,
    scaleX: obj.scaleX,
    scaleY: obj.scaleY,
    width: obj.width,
    height: obj.height,
    type: obj.type,
  }));

  // Free-form: just expand canvas, no new cells
  if (input.layoutType === 'free-form') {
    return {
      newCanvasWidth: input.newWidth,
      newCanvasHeight: input.newHeight,
      objects,
      layoutSettings: null,
      addedCells: [],
    };
  }

  // Grid-based layouts: compute new rows/cols
  if (!input.layoutSettings) {
    return {
      newCanvasWidth: input.newWidth,
      newCanvasHeight: input.newHeight,
      objects,
      layoutSettings: null,
      addedCells: [],
    };
  }

  const { blockSize, rows: oldRows, cols: oldCols } = input.layoutSettings;
  const newCols = Math.floor(input.newWidth / blockSize);
  const newRows = Math.floor(input.newHeight / blockSize);

  const addedCells: AddedCell[] = [];
  for (let row = 0; row < newRows; row++) {
    for (let col = 0; col < newCols; col++) {
      if (row < oldRows && col < oldCols) continue;

      const sourceObjectIds: string[] = [];

      // Calculate cell stride (accounts for sashing if enabled)
      const sashingWidth = input.sashing?.enabled ? input.sashing.width : 0;
      const cellStride = blockSize + sashingWidth;

      if (input.tilePattern && oldRows > 0 && oldCols > 0) {
        const sourceRow = row % oldRows;
        const sourceCol = col % oldCols;
        const sourceObjs = input.objects.filter((obj) => {
          const oldCellStride = blockSize + sashingWidth;
          const objCol = Math.floor(
            obj.left /
              (oldCellStride * (input.currentWidth / (oldCols * oldCellStride - sashingWidth)))
          );
          const objRow = Math.floor(
            obj.top /
              (oldCellStride * (input.currentHeight / (oldRows * oldCellStride - sashingWidth)))
          );
          return objRow === sourceRow && objCol === sourceCol;
        });
        sourceObjectIds.push(...sourceObjs.map((o) => o.id));
      }

      addedCells.push({
        row,
        col,
        centerX: col * cellStride + blockSize / 2,
        centerY: row * cellStride + blockSize / 2,
        size: blockSize,
        sourceObjectIds,
      });
    }
  }

  return {
    newCanvasWidth: input.newWidth,
    newCanvasHeight: input.newHeight,
    objects,
    layoutSettings: { rows: newRows, cols: newCols, blockSize },
    addedCells,
  };
}

export function computeResize(input: ResizeInput): ResizeResult {
  const newWidth = Math.max(MIN_DIMENSION, Math.min(MAX_DIMENSION, input.newWidth));
  let newHeight = Math.max(MIN_DIMENSION, Math.min(MAX_DIMENSION, input.newHeight));

  if (input.lockAspectRatio) {
    if (input.currentHeight === 0) {
      throw new Error('Cannot resize with zero current height when aspect ratio is locked');
    }
    const aspectRatio = input.currentWidth / input.currentHeight;
    newHeight = Math.max(MIN_DIMENSION, Math.min(MAX_DIMENSION, newWidth / aspectRatio));
  }

  const validated: ResizeInput = { ...input, newWidth, newHeight };

  if (validated.mode === 'scale') {
    return computeScaleResize(validated);
  }

  return computeAddBlocksResize(validated);
}
