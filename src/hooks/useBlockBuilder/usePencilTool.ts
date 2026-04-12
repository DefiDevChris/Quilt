'use client';

import { useRef, useCallback } from 'react';
import { gridPointToPixel } from '@/lib/blockbuilder-utils';
import { CANVAS } from '@/lib/design-system';
import type { GridPoint, SegmentHelpers, SnapHelpers, MinimalCanvas } from './types';

const PENCIL_PREVIEW_COLOR = CANVAS.pencilPreview;

export function usePencilTool(snap: SnapHelpers, segs: SegmentHelpers) {
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
      const gridPt = snap.snapToGridPoint(pointer.x, pointer.y);
      if (!gridPt) return;

      const fabric = await import('fabric');

      if (!startRef.current) {
        startRef.current = gridPt;
        const px = gridPointToPixel(gridPt, snap.gridSize);
        const dot = new fabric.Circle({
          left: px.x - 3, top: px.y - 3, radius: 3,
          fill: PENCIL_PREVIEW_COLOR, selectable: false, evented: false, stroke: '',
        });
        c.add(dot);
        previewRef.current = dot;
        c.renderAll();
      } else {
        const startPt = startRef.current;
        if (startPt.row === gridPt.row && startPt.col === gridPt.col) return;
        segs.addShapeSegments([{ from: startPt, to: gridPt }]);
        startRef.current = gridPt;

        if (previewRef.current) c.remove(previewRef.current);
        const px = gridPointToPixel(gridPt, snap.gridSize);
        const dot = new fabric.Circle({
          left: px.x - 3, top: px.y - 3, radius: 3,
          fill: PENCIL_PREVIEW_COLOR, selectable: false, evented: false, stroke: '',
        });
        c.add(dot);
        previewRef.current = dot;
        c.renderAll();
      }
    },
    [snap, segs]
  );

  const onMouseMove = useCallback(
    async (pointer: { x: number; y: number }, c: MinimalCanvas) => {
      if (!startRef.current) return;
      const gridPt = snap.snapToGridPoint(pointer.x, pointer.y);
      if (!gridPt) return;

      const fabric = await import('fabric');
      if (previewRef.current) c.remove(previewRef.current);

      const startPx = gridPointToPixel(startRef.current, snap.gridSize);
      const endPx = gridPointToPixel(gridPt, snap.gridSize);
      const line = new fabric.Line([startPx.x, startPx.y, endPx.x, endPx.y], {
        stroke: PENCIL_PREVIEW_COLOR, strokeWidth: 1.5,
        strokeDashArray: [6, 4], selectable: false, evented: false,
      });
      c.add(line);
      previewRef.current = line;
      c.renderAll();
    },
    [snap]
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

  return { onMouseDown, onMouseMove, onDoubleClick, onEscape, clearPreview, reset };
}
