/**
 * Resize Engine — Pure computation for quilt resize operations.
 *
 * Scale mode: proportionally scales all object positions and dimensions.
 * Add-blocks mode: expands canvas and adds new layout cells.
 * Zero React/Fabric.js/DOM dependencies.
 */

import type { LayoutType } from '@/lib/layout-engine';

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
}

export interface ResizeResult {
  readonly newCanvasWidth: number;
  readonly newCanvasHeight: number;
  readonly objects: readonly TransformedObject[];
  readonly layoutSettings: LayoutSettingsUpdate | null;
  readonly addedCells: readonly AddedCell[];
}

function computeScaleResize(input: ResizeInput): ResizeResult {
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

  // Free-form, medallion, lone-star: just expand canvas, no new cells
  if (
    input.layoutType === 'free-form' ||
    input.layoutType === 'medallion' ||
    input.layoutType === 'lone-star'
  ) {
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
      if (input.tilePattern && oldRows > 0 && oldCols > 0) {
        const sourceRow = row % oldRows;
        const sourceCol = col % oldCols;
        const sourceObjs = input.objects.filter((obj) => {
          const objCol = Math.floor(obj.left / (blockSize * (input.currentWidth / oldCols)));
          const objRow = Math.floor(obj.top / (blockSize * (input.currentHeight / oldRows)));
          return objRow === sourceRow && objCol === sourceCol;
        });
        sourceObjectIds.push(...sourceObjs.map((o) => o.id));
      }

      addedCells.push({
        row,
        col,
        centerX: col * blockSize + blockSize / 2,
        centerY: row * blockSize + blockSize / 2,
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
  if (input.mode === 'scale') {
    return computeScaleResize(input);
  }
  return computeAddBlocksResize(input);
}
