'use client';

import { useCallback } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useProjectStore } from '@/stores/projectStore';
import { useLayoutStore } from '@/stores/layoutStore';
import { usePrintlistStore } from '@/stores/printlistStore';
import { computeResize, type ResizeInput, type CanvasObjectData } from '@/lib/resize-engine';
import { getPixelsPerUnit, fitToScreenZoom } from '@/lib/canvas-utils';
import { saveProject } from '@/lib/save-project';

type FabricCanvas = {
  getObjects: () => FabricObject[];
  toJSON: () => Record<string, unknown>;
  loadFromJSON: (json: unknown) => Promise<void>;
  renderAll: () => void;
  getWidth: () => number;
  getHeight: () => number;
  setDimensions: (dims: { width: number; height: number }) => void;
  setZoom: (zoom: number) => void;
  viewportTransform: number[];
};

type FabricObject = {
  id?: string;
  left: number;
  top: number;
  scaleX: number;
  scaleY: number;
  width: number;
  height: number;
  type: string;
  set: (props: Record<string, unknown>) => void;
  setCoords: () => void;
  toSVG: () => string;
};

function extractObjectData(objects: FabricObject[]): CanvasObjectData[] {
  return objects
    .filter((obj) => obj.id)
    .map((obj) => ({
      id: obj.id!,
      left: obj.left,
      top: obj.top,
      scaleX: obj.scaleX,
      scaleY: obj.scaleY,
      width: obj.width,
      height: obj.height,
      type: obj.type,
    }));
}

export function useQuiltResize() {
  const applyResize = useCallback(
    (
      mode: 'scale' | 'add-blocks',
      newWidth: number,
      newHeight: number,
      lockAspectRatio: boolean,
      tilePattern: boolean,
      containerWidth: number,
      containerHeight: number
    ) => {
      const canvas = useCanvasStore.getState().fabricCanvas as FabricCanvas | null;
      if (!canvas) return;

      const { unitSystem } = useCanvasStore.getState();
      const { canvasWidth, canvasHeight, projectId } = useProjectStore.getState();
      const layoutStore = useLayoutStore.getState();
      const pxPerUnit = getPixelsPerUnit(unitSystem);

      // 1. Push undo snapshot
      const currentJson = JSON.stringify(canvas.toJSON());
      useCanvasStore.getState().pushUndoState(currentJson);

      // 2. Extract object data
      const fabricObjects = canvas.getObjects() as FabricObject[];
      const objectData = extractObjectData(fabricObjects);

      // 3. Compute resize
      const input: ResizeInput = {
        currentWidth: canvasWidth,
        currentHeight: canvasHeight,
        newWidth,
        newHeight,
        mode,
        lockAspectRatio,
        layoutType: layoutStore.layoutType,
        layoutSettings:
          layoutStore.layoutType !== 'free-form'
            ? { rows: layoutStore.rows, cols: layoutStore.cols, blockSize: layoutStore.blockSize }
            : null,
        objects: objectData,
        tilePattern,
      };

      const result = computeResize(input);

      // 4. Apply transforms to canvas objects
      for (const transformed of result.objects) {
        const fabricObj = fabricObjects.find((o) => o.id === transformed.id);
        if (!fabricObj) continue;
        fabricObj.set({
          left: transformed.left,
          top: transformed.top,
          scaleX: transformed.scaleX,
          scaleY: transformed.scaleY,
        });
        fabricObj.setCoords();
      }

      // 5. Update canvas dimensions
      const newWidthPx = result.newCanvasWidth * pxPerUnit;
      const newHeightPx = result.newCanvasHeight * pxPerUnit;
      canvas.setDimensions({ width: newWidthPx, height: newHeightPx });

      // 6. Update stores
      useProjectStore.getState().setCanvasDimensions(result.newCanvasWidth, result.newCanvasHeight);
      useProjectStore.getState().setDirty(true);

      if (result.layoutSettings) {
        layoutStore.setRows(result.layoutSettings.rows);
        layoutStore.setCols(result.layoutSettings.cols);
        layoutStore.setBlockSize(result.layoutSettings.blockSize);
      }

      // 7. Re-fit zoom
      const zoom = fitToScreenZoom(
        containerWidth,
        containerHeight,
        result.newCanvasWidth,
        result.newCanvasHeight,
        unitSystem
      );
      canvas.setZoom(zoom);
      useCanvasStore.getState().setZoom(zoom);

      // 8. Sync printlist items
      const printlistStore = usePrintlistStore.getState();
      for (const item of printlistStore.items) {
        const fabricObj = fabricObjects.find((o) => o.id === item.shapeId);
        if (!fabricObj) continue;
        const updatedSvg = fabricObj.toSVG();
        printlistStore.syncItemSvg(item.shapeId, updatedSvg);
      }

      // 9. Render and save
      canvas.renderAll();
      if (projectId) {
        saveProject(projectId, canvas);
      }
    },
    []
  );

  return { applyResize };
}
