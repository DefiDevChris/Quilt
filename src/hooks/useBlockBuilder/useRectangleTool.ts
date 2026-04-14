'use client';

import { useRef, useCallback } from 'react';
import { gridPointToPixel } from '@/lib/blockbuilder-utils';
import { generateRectangle } from '@/lib/block-builder-engine';
import { CANVAS } from '@/lib/design-system';
import type { GridPoint, SegmentHelpers, SnapHelpers, MinimalCanvas } from './types';

const PENCIL_PREVIEW_COLOR = CANVAS.pencilPreview;

export function useRectangleTool(snap: SnapHelpers, segs: SegmentHelpers) {
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

      const fabric = await import('fabric');
      if (previewRef.current) c.remove(previewRef.current);

      const start = startRef.current;
      const minR = Math.min(start.row, gridPt.row);
      const maxR = Math.max(start.row, gridPt.row);
      const minC = Math.min(start.col, gridPt.col);
      const maxC = Math.max(start.col, gridPt.col);

      const rect = new fabric.Rect({
        left: minC * snap.gridSize,
        top: minR * snap.gridSize,
        width: (maxC - minC) * snap.gridSize,
        height: (maxR - minR) * snap.gridSize,
        fill: 'transparent',
        stroke: PENCIL_PREVIEW_COLOR,
        strokeWidth: 1.5,
        strokeDashArray: [6, 4],
        selectable: false,
        evented: false,
      });
      c.add(rect);
      previewRef.current = rect;
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
        segs.addShapeSegments(generateRectangle(start.row, start.col, gridPt.row, gridPt.col));
      }
      startRef.current = null;
      clearPreview(c);
      c.renderAll();
    },
    [snap, segs, clearPreview]
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

  return { onMouseDown, onMouseMove, onMouseUp, onEscape, clearPreview, reset };
}
