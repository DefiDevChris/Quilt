'use client';

import { useRef, useCallback } from 'react';
import { gridPointToPixel } from '@/lib/blockbuilder-utils';
import { generateBend } from '@/lib/block-builder-engine';
import { CANVAS } from '@/lib/design-system';
import type { GridPoint, Segment, SegmentHelpers, SnapHelpers, MinimalCanvas } from './types';

const SEAM_LINE_WIDTH = 2;
const PENCIL_PREVIEW_COLOR = CANVAS.pencilPreview;

export function useBendTool(snap: SnapHelpers, segs: SegmentHelpers) {
  const segmentRef = useRef<{ index: number; seg: Segment } | null>(null);
  const centerRef = useRef<GridPoint | null>(null);
  const previewRef = useRef<unknown>(null);

  const clearPreview = useCallback((c: MinimalCanvas) => {
    if (previewRef.current) {
      c.remove(previewRef.current);
      previewRef.current = null;
    }
  }, []);

  const onMouseDown = useCallback(
    (pointer: { x: number; y: number }, _c: MinimalCanvas) => {
      const lineSegments = segs.segmentsRef.current.filter((s): s is Segment => !('center' in s));
      const found = segs.findNearestSegment(
        pointer.x,
        pointer.y,
        lineSegments,
        snap.gridSize * 0.5
      );
      if (!found) return;
      segmentRef.current = { index: found.index, seg: found.seg };
    },
    [snap, segs]
  );

  const onMouseMove = useCallback(
    async (pointer: { x: number; y: number }, c: MinimalCanvas) => {
      if (!segmentRef.current) return;
      const gridPt = snap.snapToGridPoint(pointer.x, pointer.y);
      if (!gridPt) return;

      centerRef.current = gridPt;
      const { seg } = segmentRef.current;
      const arc = generateBend(seg, gridPt);

      const fabric = await import('fabric');
      if (previewRef.current) c.remove(previewRef.current);

      const fromPx = gridPointToPixel(arc.from, snap.gridSize);
      const toPx = gridPointToPixel(arc.to, snap.gridSize);
      const centerPx = gridPointToPixel(arc.center, snap.gridSize);
      const dx = fromPx.x - centerPx.x;
      const dy = fromPx.y - centerPx.y;
      const radius = Math.sqrt(dx * dx + dy * dy);
      const sweepFlag = arc.clockwise ? 1 : 0;

      const pathObj = new fabric.Path(
        `M ${fromPx.x} ${fromPx.y} A ${radius} ${radius} 0 0 ${sweepFlag} ${toPx.x} ${toPx.y}`,
        {
          fill: '',
          stroke: PENCIL_PREVIEW_COLOR,
          strokeWidth: SEAM_LINE_WIDTH,
          strokeDashArray: [6, 4],
          selectable: false,
          evented: false,
        }
      );
      c.add(pathObj);
      previewRef.current = pathObj;
      c.renderAll();
    },
    [snap, segs]
  );

  const onMouseUp = useCallback(
    (_pointer: { x: number; y: number }, c: MinimalCanvas) => {
      if (!segmentRef.current || !centerRef.current) return;
      clearPreview(c);

      const { index, seg } = segmentRef.current;
      const center = centerRef.current;
      const arc = generateBend(seg, center);

      const existing = segs.segmentsRef.current[index];
      if (
        existing &&
        !('center' in existing) &&
        existing.from.row === seg.from.row &&
        existing.from.col === seg.from.col &&
        existing.to.row === seg.to.row &&
        existing.to.col === seg.to.col
      ) {
        segs.replaceSegmentAt(index, arc);
      }

      segmentRef.current = null;
      centerRef.current = null;
      c.renderAll();
    },
    [segs, clearPreview]
  );

  const onEscape = useCallback(
    (c: MinimalCanvas) => {
      segmentRef.current = null;
      centerRef.current = null;
      clearPreview(c);
      c.renderAll();
    },
    [clearPreview]
  );

  const reset = useCallback(() => {
    segmentRef.current = null;
    centerRef.current = null;
    previewRef.current = null;
  }, []);

  return { onMouseDown, onMouseMove, onMouseUp, onEscape, clearPreview, reset };
}
