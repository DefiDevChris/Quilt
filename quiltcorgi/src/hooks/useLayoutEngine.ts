'use client';

import { useEffect, useRef } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useLayoutStore } from '@/stores/layoutStore';
import { useProjectStore } from '@/stores/projectStore';
import { getPixelsPerUnit } from '@/lib/canvas-utils';
import {
  computeLayout,
  type LayoutConfig,
  type LayoutResult,
  type LayoutCell,
} from '@/lib/layout-utils';

/**
 * Marks all layout-generated Fabric.js objects with this property
 * so they can be identified and removed on layout changes.
 */
const LAYOUT_MARKER = '_layoutElement';
const CELL_ROW = '_layoutCellRow';
const CELL_COL = '_layoutCellCol';

type FabricCanvas = {
  getObjects: () => FabricObject[];
  add: (...objects: FabricObject[]) => void;
  remove: (...objects: FabricObject[]) => void;
  sendObjectToBack: (obj: FabricObject) => void;
  requestRenderAll: () => void;
  toJSON: () => Record<string, unknown>;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  off: (event: string, handler: (...args: unknown[]) => void) => void;
};

type FabricObject = {
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  scaleX?: number;
  scaleY?: number;
  angle?: number;
  set: (props: Record<string, unknown>) => void;
  setCoords: () => void;
  [LAYOUT_MARKER]?: boolean;
  [CELL_ROW]?: number;
  [CELL_COL]?: number;
};

function getLayoutConfig(): LayoutConfig {
  const s = useLayoutStore.getState();
  return {
    type: s.layoutType,
    rows: s.rows,
    cols: s.cols,
    blockSize: s.blockSize,
    sashing: s.sashing,
    borders: s.borders,
  };
}

function configToKey(config: LayoutConfig): string {
  return JSON.stringify(config);
}

/**
 * Hook that subscribes to layout store changes and applies layout
 * to the Fabric.js canvas: placeholder cells, sashing strips,
 * setting triangles, and border strips.
 */
export function useLayoutEngine() {
  const fabricCanvas = useCanvasStore((s) => s.fabricCanvas);
  const unitSystem = useCanvasStore((s) => s.unitSystem);
  const prevConfigKeyRef = useRef('');

  useEffect(() => {
    if (!fabricCanvas) return;

    let disposed = false;

    const applyCurrentLayout = async () => {
      if (disposed) return;

      const config = getLayoutConfig();
      const key = configToKey(config);
      if (key === prevConfigKeyRef.current) return;
      prevConfigKeyRef.current = key;

      const us = useCanvasStore.getState().unitSystem;
      const pxPerUnit = getPixelsPerUnit(us);

      const fabric = await import('fabric');
      const canvas = fabricCanvas as unknown as FabricCanvas;

      // Collect user objects before removing layout elements
      const allObjects = canvas.getObjects();
      const userObjects = allObjects.filter(
        (obj) => !(obj as Record<string, unknown>)[LAYOUT_MARKER]
      );
      const layoutObjects = allObjects.filter(
        (obj) => !!(obj as Record<string, unknown>)[LAYOUT_MARKER]
      );

      // Remove old layout objects
      if (layoutObjects.length > 0) {
        canvas.remove(...layoutObjects);
      }

      if (config.type === 'free-form') {
        canvas.requestRenderAll();
        return;
      }

      const result = computeLayout(config, pxPerUnit);

      // Render layout elements
      renderBorderStrips(fabric, canvas, result);
      renderSashingStrips(fabric, canvas, result);
      renderSettingTriangles(fabric, canvas, result);
      renderCells(fabric, canvas, result);

      // Re-arrange user blocks into cells
      rearrangeBlocks(canvas, userObjects, result.cells);

      canvas.requestRenderAll();

      // Push undo state
      const json = JSON.stringify(
        (fabricCanvas as unknown as { toJSON: () => Record<string, unknown> }).toJSON()
      );
      useCanvasStore.getState().pushUndoState(json);
      useProjectStore.getState().setDirty(true);
    };

    applyCurrentLayout();

    const unsub = useLayoutStore.subscribe(() => {
      applyCurrentLayout();
    });

    return () => {
      disposed = true;
      unsub();
    };
  }, [fabricCanvas, unitSystem]);
}

function renderCells(fabric: typeof import('fabric'), canvas: FabricCanvas, result: LayoutResult) {
  for (const cell of result.cells) {
    const rect = new fabric.Rect({
      left: cell.centerX,
      top: cell.centerY,
      width: cell.size,
      height: cell.size,
      fill: 'rgba(255, 255, 255, 0.02)',
      stroke: '#8B8B8B',
      strokeWidth: 1,
      strokeDashArray: [5, 5],
      angle: cell.rotation,
      originX: 'center',
      originY: 'center',
      selectable: false,
      evented: false,
      hoverCursor: 'default',
    });
    const r = rect as unknown as Record<string, unknown>;
    r[LAYOUT_MARKER] = true;
    r[CELL_ROW] = cell.row;
    r[CELL_COL] = cell.col;
    canvas.add(rect as unknown as FabricObject);
    canvas.sendObjectToBack(rect as unknown as FabricObject);
  }
}

function renderSashingStrips(
  fabric: typeof import('fabric'),
  canvas: FabricCanvas,
  result: LayoutResult
) {
  for (const strip of result.sashingStrips) {
    const rect = new fabric.Rect({
      left: strip.x,
      top: strip.y,
      width: strip.width,
      height: strip.height,
      fill: strip.color,
      stroke: null,
      selectable: false,
      evented: false,
      hoverCursor: 'default',
    });
    (rect as unknown as Record<string, unknown>)[LAYOUT_MARKER] = true;
    canvas.add(rect as unknown as FabricObject);
    canvas.sendObjectToBack(rect as unknown as FabricObject);
  }
}

function renderSettingTriangles(
  fabric: typeof import('fabric'),
  canvas: FabricCanvas,
  result: LayoutResult
) {
  for (const triangle of result.settingTriangles) {
    const poly = new fabric.Polygon(triangle.points, {
      fill: triangle.type === 'corner' ? '#F5F0E8' : '#FAF8F5',
      stroke: '#E5E2DD',
      strokeWidth: 0.5,
      selectable: false,
      evented: false,
      hoverCursor: 'default',
    });
    (poly as unknown as Record<string, unknown>)[LAYOUT_MARKER] = true;
    canvas.add(poly as unknown as FabricObject);
    canvas.sendObjectToBack(poly as unknown as FabricObject);
  }
}

function renderBorderStrips(
  fabric: typeof import('fabric'),
  canvas: FabricCanvas,
  result: LayoutResult
) {
  for (const strip of result.borderStrips) {
    const rect = new fabric.Rect({
      left: strip.x,
      top: strip.y,
      width: strip.width,
      height: strip.height,
      fill: strip.color,
      stroke: '#E5E2DD',
      strokeWidth: 0.5,
      selectable: false,
      evented: false,
      hoverCursor: 'default',
    });
    (rect as unknown as Record<string, unknown>)[LAYOUT_MARKER] = true;
    canvas.add(rect as unknown as FabricObject);
    canvas.sendObjectToBack(rect as unknown as FabricObject);
  }
}

function rearrangeBlocks(_canvas: FabricCanvas, userObjects: FabricObject[], cells: LayoutCell[]) {
  if (userObjects.length === 0 || cells.length === 0) return;

  // Sort user objects by position (top-to-bottom, left-to-right)
  const sorted = [...userObjects].sort((a, b) => {
    const ay = a.top ?? 0;
    const by = b.top ?? 0;
    const threshold = 20;
    if (Math.abs(ay - by) > threshold) return ay - by;
    return (a.left ?? 0) - (b.left ?? 0);
  });

  // Assign blocks to cells in reading order
  const count = Math.min(sorted.length, cells.length);
  for (let i = 0; i < count; i++) {
    const obj = sorted[i];
    const cell = cells[i];

    obj.set({
      left: cell.centerX,
      top: cell.centerY,
      angle: cell.rotation,
      originX: 'center',
      originY: 'center',
    });
    obj.setCoords();
  }
}
