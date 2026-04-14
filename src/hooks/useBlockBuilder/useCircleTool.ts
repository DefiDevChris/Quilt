'use client';

import { useRef, useCallback } from 'react';
import { generateCircle } from '@/lib/block-builder-engine';
import { CANVAS } from '@/lib/design-system';
import type { GridPoint, SegmentHelpers, SnapHelpers, MinimalCanvas } from './types';

const PENCIL_PREVIEW_COLOR = CANVAS.pencilPreview;

export function useCircleTool(snap: SnapHelpers, segs: SegmentHelpers) {
  const centerRef = useRef<GridPoint | null>(null);
  const radiusRef = useRef<number>(0);
  const previewRef = useRef<unknown>(null);

  const clearPreview = useCallback((c: MinimalCanvas) => {
    if (previewRef.current) {
      c.remove(previewRef.current);
      previewRef.current = null;
    }
  }, []);

  const onMouseDown = useCallback(
    (pointer: { x: number; y: number }, _c: MinimalCanvas) => {
      if (centerRef.current) return;
      const gridPt = snap.snapToGridPoint(pointer.x, pointer.y);
      if (!gridPt) return;
      centerRef.current = gridPt;
      radiusRef.current = 0;
    },
    [snap]
  );

  const onMouseMove = useCallback(
    async (pointer: { x: number; y: number }, c: MinimalCanvas) => {
      if (!centerRef.current) return;
      const gridPt = snap.snapToGridPoint(pointer.x, pointer.y);
      if (!gridPt) return;

      const center = centerRef.current;
      const radius = Math.max(Math.abs(gridPt.row - center.row), Math.abs(gridPt.col - center.col));
      radiusRef.current = radius;

      const fabric = await import('fabric');
      if (previewRef.current) c.remove(previewRef.current);

      const circle = new fabric.Circle({
        left: (center.col - radius) * snap.gridSize,
        top: (center.row - radius) * snap.gridSize,
        radius: radius * snap.gridSize,
        fill: 'transparent',
        stroke: PENCIL_PREVIEW_COLOR,
        strokeWidth: 1.5,
        strokeDashArray: [6, 4],
        selectable: false,
        evented: false,
      });
      c.add(circle);
      previewRef.current = circle;
      c.renderAll();
    },
    [snap]
  );

  const onMouseUp = useCallback(
    (pointer: { x: number; y: number }, c: MinimalCanvas) => {
      if (!centerRef.current) return;
      const gridPt = snap.snapToGridPoint(pointer.x, pointer.y);
      if (gridPt) {
        const center = centerRef.current;
        const radius = Math.max(
          Math.abs(gridPt.row - center.row),
          Math.abs(gridPt.col - center.col)
        );
        if (radius > 0) segs.addShapeSegments(generateCircle(center.row, center.col, radius));
      }
      centerRef.current = null;
      radiusRef.current = 0;
      clearPreview(c);
      c.renderAll();
    },
    [snap, segs, clearPreview]
  );

  const onEscape = useCallback(
    (c: MinimalCanvas) => {
      centerRef.current = null;
      radiusRef.current = 0;
      clearPreview(c);
      c.renderAll();
    },
    [clearPreview]
  );

  const reset = useCallback(() => {
    centerRef.current = null;
    radiusRef.current = 0;
    previewRef.current = null;
  }, []);

  return { onMouseDown, onMouseMove, onMouseUp, onEscape, clearPreview, reset };
}
