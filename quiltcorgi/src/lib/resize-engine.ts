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

export function computeResize(input: ResizeInput): ResizeResult {
  if (input.mode === 'scale') {
    return computeScaleResize(input);
  }

  // add-blocks mode placeholder — implemented in Task 2
  return {
    newCanvasWidth: input.newWidth,
    newCanvasHeight: input.newHeight,
    objects: [...input.objects],
    layoutSettings: null,
    addedCells: [],
  };
}
