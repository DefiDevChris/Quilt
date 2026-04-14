'use client';

import { useRef, useCallback } from 'react';
import { gridPointToPixel } from '@/lib/blockbuilder-utils';
import { CANVAS } from '@/lib/design-system';
import type { GridPoint, SegmentHelpers, SnapHelpers, MinimalCanvas } from './types';

const PENCIL_PREVIEW_COLOR = CANVAS.pencilPreview;

export function useTriangleTool(snap: SnapHelpers, segs: SegmentHelpers) {
  const startRef = useRef<GridPoint | null>(null);
  const previewRef = useRef<unknown>(null);

  const clearPreview = useCallback((c: MinimalCanvas) => {
    if (previewRef.current) {
      c.remove(previewRef.current);
      previewRef.current = null;
    }
  }, []);

  const onMouseDown = useCallback(
    async (pointer: { x: number; y: number }, c: MinimalCanvas) => {
      if (startRef.current) return;
      const gridPt = snap.snapToNearestGridPoint(pointer.x, pointer.y);
      startRef.current = gridPt;

      const fabric = await import('fabric');
      const px = gridPointToPixel(gridPt, snap.gridSize);
      const dot = new fabric.Circle({
        left: px.x - 4,
        top: px.y - 4,
        radius: 4,
        fill: PENCIL_PREVIEW_COLOR,
        selectable: false,
        evented: false,
        stroke: '',
      });
      c.add(dot);
      previewRef.current = dot;
      c.renderAll();
    },
    [snap]
  );

  const onMouseMove = useCallback(
    async (pointer: { x: number; y: number }, c: MinimalCanvas) => {
      if (!startRef.current) return;
      const gridPt = snap.snapToNearestGridPoint(pointer.x, pointer.y);
      const start = startRef.current;
      if (start.row === gridPt.row && start.col === gridPt.col) return;

      const fabric = await import('fabric');
      if (previewRef.current) c.remove(previewRef.current);

      const a = gridPointToPixel(start, snap.gridSize);
      const b = gridPointToPixel({ row: gridPt.row, col: start.col }, snap.gridSize);
      const cPt = gridPointToPixel({ row: start.row, col: gridPt.col }, snap.gridSize);

      const path = new fabric.Path(`M ${a.x} ${a.y} L ${b.x} ${b.y} L ${cPt.x} ${cPt.y} Z`, {
        fill: CANVAS.selectionHighlight,
        stroke: PENCIL_PREVIEW_COLOR,
        strokeWidth: 1.5,
        strokeDashArray: [6, 4],
        selectable: false,
        evented: false,
      });
      c.add(path);
      previewRef.current = path;
      c.renderAll();
    },
    [snap]
  );

  const onMouseUp = useCallback(
    (pointer: { x: number; y: number }, c: MinimalCanvas) => {
      if (!startRef.current) return;
      const gridPt = snap.snapToNearestGridPoint(pointer.x, pointer.y);
      const start = startRef.current;
      if (start.row !== gridPt.row || start.col !== gridPt.col) {
        segs.addShapeSegments([
          { from: start, to: { row: gridPt.row, col: start.col } },
          { from: { row: gridPt.row, col: start.col }, to: { row: start.row, col: gridPt.col } },
          { from: { row: start.row, col: gridPt.col }, to: start },
        ]);
      }
      startRef.current = null;
      clearPreview(c);
      c.renderAll();
    },
    [snap, segs, clearPreview]
  );

  const onDoubleClick = useCallback(
    (c: MinimalCanvas) => {
      startRef.current = null;
      clearPreview(c);
      c.renderAll();
    },
    [clearPreview]
  );

  const onEscape = useCallback(
    (c: MinimalCanvas) => {
      startRef.current = null;
      clearPreview(c);
      c.renderAll();
    },
    [clearPreview]
  );

  const reset = useCallback(() => {
    startRef.current = null;
    previewRef.current = null;
  }, []);

  return { onMouseDown, onMouseMove, onMouseUp, onDoubleClick, onEscape, clearPreview, reset };
}
