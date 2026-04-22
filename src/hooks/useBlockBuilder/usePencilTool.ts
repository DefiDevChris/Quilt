'use client';

import { useRef, useCallback } from 'react';
import { gridPointToPixel } from '@/lib/blockbuilder-utils';
import { CANVAS } from '@/lib/design-system';
import type { GridPoint, SegmentHelpers, SnapHelpers, MinimalCanvas } from './types';

const PENCIL_PREVIEW_COLOR = CANVAS.pencilPreview;

export function usePencilTool(snap: SnapHelpers, segs: SegmentHelpers) {
  const startRef = useRef<GridPoint | null>(null);
  const previewRef = useRef<unknown>(null);
  // Pixel-space origin of the current mouse-down, used to detect drag vs. click.
  const downPixelRef = useRef<{ x: number; y: number } | null>(null);
  // Whether a drag-to-commit gesture is in progress (user moved far enough from down).
  const draggingRef = useRef(false);

  const DRAG_THRESHOLD_PX = 4;

  // Constrain the target grid point to a 45° direction from a start grid point.
  const constrainTo45 = (from: GridPoint, to: GridPoint): GridPoint => {
    const dr = to.row - from.row;
    const dc = to.col - from.col;
    const absR = Math.abs(dr);
    const absC = Math.abs(dc);
    // Choose axis: horizontal, vertical, or diagonal based on which is closest.
    const isDiag = Math.min(absR, absC) * 2 > Math.max(absR, absC);
    if (isDiag) {
      const len = Math.max(absR, absC);
      return {
        row: from.row + Math.sign(dr || 1) * len,
        col: from.col + Math.sign(dc || 1) * len,
      };
    }
    if (absR > absC) return { row: to.row, col: from.col };
    return { row: from.row, col: to.col };
  };

  const clearPreview = useCallback((c: MinimalCanvas) => {
    if (previewRef.current) {
      c.remove(previewRef.current);
      previewRef.current = null;
    }
  }, []);

  const placeDot = useCallback(async (gridPt: GridPoint, c: MinimalCanvas) => {
    const fabric = await import('fabric');
    if (previewRef.current) c.remove(previewRef.current);
    const px = gridPointToPixel(gridPt, snap.gridSize);
    const dot = new fabric.Circle({
      left: px.x - 3,
      top: px.y - 3,
      radius: 3,
      fill: PENCIL_PREVIEW_COLOR,
      selectable: false,
      evented: false,
      stroke: '',
    });
    c.add(dot);
    previewRef.current = dot;
    c.renderAll();
  }, [snap.gridSize]);

  const onMouseDown = useCallback(
    async (pointer: { x: number; y: number }, c: MinimalCanvas) => {
      const gridPt = snap.snapToGridPoint(pointer.x, pointer.y);
      if (!gridPt) return;

      downPixelRef.current = { x: pointer.x, y: pointer.y };
      draggingRef.current = false;

      if (!startRef.current) {
        // First click: anchor start.
        startRef.current = gridPt;
        await placeDot(gridPt, c);
      } else {
        const startPt = startRef.current;
        if (startPt.row === gridPt.row && startPt.col === gridPt.col) return;
        // Click-click chain: commit segment, move anchor to new point.
        segs.addShapeSegments([{ from: startPt, to: gridPt }]);
        startRef.current = gridPt;
        await placeDot(gridPt, c);
      }
    },
    [snap, segs, placeDot]
  );

  const onMouseMove = useCallback(
    async (pointer: { x: number; y: number }, c: MinimalCanvas, ev?: MouseEvent) => {
      if (!startRef.current) return;
      let gridPt = snap.snapToGridPoint(pointer.x, pointer.y);
      if (!gridPt) return;

      // Detect drag start: once the pointer moves DRAG_THRESHOLD_PX away from
      // the mouse-down pixel, we enter "drag-to-commit" mode — the segment is
      // committed on mouse-up rather than on the next click.
      if (downPixelRef.current && !draggingRef.current) {
        const dx = pointer.x - downPixelRef.current.x;
        const dy = pointer.y - downPixelRef.current.y;
        if (Math.hypot(dx, dy) > DRAG_THRESHOLD_PX) {
          draggingRef.current = true;
        }
      }

      if (ev?.shiftKey) {
        gridPt = constrainTo45(startRef.current, gridPt);
      }

      const fabric = await import('fabric');
      if (previewRef.current) c.remove(previewRef.current);

      const startPx = gridPointToPixel(startRef.current, snap.gridSize);
      const endPx = gridPointToPixel(gridPt, snap.gridSize);
      const line = new fabric.Line([startPx.x, startPx.y, endPx.x, endPx.y], {
        stroke: PENCIL_PREVIEW_COLOR,
        strokeWidth: 4,
        strokeDashArray: [8, 6],
        selectable: false,
        evented: false,
      });
      c.add(line);
      previewRef.current = line;
      c.renderAll();
    },
    [snap]
  );

  const onMouseUp = useCallback(
    async (pointer: { x: number; y: number }, c: MinimalCanvas, ev?: MouseEvent) => {
      // Only commit on mouse-up if the user actually dragged; otherwise the
      // mouse-down handler's click-click chaining is the authoritative path.
      const wasDragging = draggingRef.current;
      downPixelRef.current = null;
      draggingRef.current = false;

      if (!wasDragging || !startRef.current) return;

      let gridPt = snap.snapToGridPoint(pointer.x, pointer.y);
      if (!gridPt) return;
      if (ev?.shiftKey) {
        gridPt = constrainTo45(startRef.current, gridPt);
      }
      const startPt = startRef.current;
      if (startPt.row === gridPt.row && startPt.col === gridPt.col) return;

      segs.addShapeSegments([{ from: startPt, to: gridPt }]);
      startRef.current = gridPt;
      await placeDot(gridPt, c);
    },
    [snap, segs, placeDot]
  );

  const onDoubleClick = useCallback(
    (c: MinimalCanvas) => {
      startRef.current = null;
      downPixelRef.current = null;
      draggingRef.current = false;
      clearPreview(c);
      c.renderAll();
    },
    [clearPreview]
  );

  const onEscape = useCallback(
    (c: MinimalCanvas) => {
      startRef.current = null;
      downPixelRef.current = null;
      draggingRef.current = false;
      clearPreview(c);
      c.renderAll();
    },
    [clearPreview]
  );

  const reset = useCallback(() => {
    startRef.current = null;
    previewRef.current = null;
    downPixelRef.current = null;
    draggingRef.current = false;
  }, []);

  return { onMouseDown, onMouseMove, onMouseUp, onDoubleClick, onEscape, clearPreview, reset };
}
