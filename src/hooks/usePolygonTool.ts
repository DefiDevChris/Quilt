'use client';

import { useEffect, useRef } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useCanvasContext } from '@/contexts/CanvasContext';
import { useProjectStore } from '@/stores/projectStore';
import { maybeSnap } from '@/lib/canvas-utils';
import { CANVAS } from '@/lib/design-system';

export function usePolygonTool() {
  const { getCanvas } = useCanvasContext();
  const fabricCanvas = getCanvas();
  const activeTool = useCanvasStore((s) => s.activeTool);

  const stateRef = useRef<{
    fillColor: string;
    strokeColor: string;
    strokeWidth: number;
    gridSettings: { enabled: boolean; size: number; snapToGrid: boolean };
    unitSystem: 'imperial' | 'metric';
    isSpacePressed: boolean;
  }>({
    fillColor: CANVAS.pencilPreview,
    strokeColor: CANVAS.seamLine,
    strokeWidth: 1,
    gridSettings: { enabled: true, size: 1, snapToGrid: true },
    unitSystem: 'imperial' as 'imperial' | 'metric',
    isSpacePressed: false,
  });

  useEffect(() => {
    return useCanvasStore.subscribe((state) => {
      stateRef.current = {
        fillColor: state.fillColor,
        strokeColor: state.strokeColor,
        strokeWidth: state.strokeWidth,
        gridSettings: state.gridSettings,
        unitSystem: state.unitSystem,
        isSpacePressed: state.isSpacePressed,
      };
    });
  }, []);

  useEffect(() => {
    if (!fabricCanvas || activeTool !== 'polygon') return;

    let isMounted = true;
    let fabric: typeof import('fabric') | null = null;
    let cleanup: (() => void) | null = null;

    (async () => {
      fabric = await import('fabric');
      if (!isMounted) return;
      const canvas = fabricCanvas as InstanceType<typeof fabric.Canvas>;

      canvas.selection = false;
      canvas.defaultCursor = 'crosshair';
      canvas.discardActiveObject();
      canvas.renderAll();

      let points: { x: number; y: number }[] = [];
      let previewLines: InstanceType<typeof fabric.Line>[] = [];
      let previewDots: InstanceType<typeof fabric.Circle>[] = [];
      let isDrawing = false;

      function snapPoint(x: number, y: number): { x: number; y: number } {
        const s = stateRef.current;
        return {
          x: maybeSnap(x, s.gridSettings, s.unitSystem),
          y: maybeSnap(y, s.gridSettings, s.unitSystem),
        };
      }

      function addPreviewDot(x: number, y: number) {
        if (!fabric || !canvas) return;
        const dot = new fabric.Circle({
          left: x - 4,
          top: y - 4,
          radius: 4,
          fill: CANVAS.seamLine,
          selectable: false,
          evented: false,
        });
        canvas.add(dot);
        previewDots.push(dot);
      }

      function addPreviewLine(
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        dashArray?: number[]
      ) {
        if (!fabric || !canvas) return;
        const line = new fabric.Line([x1, y1, x2, y2], {
          stroke: CANVAS.seamLine,
          strokeWidth: 2,
          strokeDashArray: dashArray,
          selectable: false,
          evented: false,
        });
        canvas.add(line);
        previewLines.push(line);
      }

      function clearPreview() {
        if (!canvas) return;
        for (const line of previewLines) {
          canvas.remove(line);
        }
        for (const dot of previewDots) {
          canvas.remove(dot);
        }
        previewLines = [];
        previewDots = [];
      }

      function completePolygon() {
        if (!fabric || !canvas || points.length < 3) {
          clearPreview();
          points = [];
          isDrawing = false;
          canvas?.renderAll();
          return;
        }

        // Remove preview
        clearPreview();

        const { fillColor, strokeColor, strokeWidth } = stateRef.current;

        const polygon = new fabric.Polygon(points, {
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth,
          selectable: true,
          evented: true,
        });

        canvas.add(polygon);

        const json = JSON.stringify(canvas.toJSON());
        useCanvasStore.getState().pushUndoState(json);
        useProjectStore.getState().setDirty(true);

        points = [];
        isDrawing = false;
        canvas.renderAll();
      }

      function cancelPolygon() {
        clearPreview();
        points = [];
        isDrawing = false;
        canvas.renderAll();
      }

      function onMouseDown(e: { e: MouseEvent }) {
        if (stateRef.current.isSpacePressed) return;
        if (!fabric || !canvas) return;

        const pointer = canvas.getScenePoint(e.e);
        const snapped = snapPoint(pointer.x, pointer.y);

        if (!isDrawing) {
          // Start new polygon
          isDrawing = true;
          points = [snapped];
          addPreviewDot(snapped.x, snapped.y);
        } else {
          // Check if clicking near the first point (close the shape)
          const firstPoint = points[0];
          const distToStart = Math.sqrt(
            (snapped.x - firstPoint.x) ** 2 + (snapped.y - firstPoint.y) ** 2
          );

          if (distToStart < 15 && points.length >= 3) {
            // Close the polygon
            completePolygon();
            return;
          }

          // Add a new point
          points.push(snapped);
          addPreviewDot(snapped.x, snapped.y);

          // Add line from previous point to new point
          const prevPoint = points[points.length - 2];
          addPreviewLine(prevPoint.x, prevPoint.y, snapped.x, snapped.y);

          // Remove old rubber band line if it exists (always the last line)
          if (previewLines.length > 1) {
            const lastLine = previewLines[previewLines.length - 1];
            canvas.remove(lastLine);
            previewLines.pop();
          }
          // Add new rubber band line from new point back to first (dashed)
          addPreviewLine(snapped.x, snapped.y, firstPoint.x, firstPoint.y, [5, 5]);
        }

        canvas.renderAll();
      }

      function onMouseMove(e: { e: MouseEvent }) {
        if (!fabric || !canvas || !isDrawing || points.length === 0) return;

        const pointer = canvas.getScenePoint(e.e);
        const snapped = snapPoint(pointer.x, pointer.y);

        if (points.length === 1) {
          // Only one point placed, show line from it to cursor
          // Remove old preview line if exists
          if (previewLines.length > 0) {
            canvas.remove(previewLines[0]);
            previewLines.pop();
          }
          const firstPoint = points[0];
          addPreviewLine(firstPoint.x, firstPoint.y, snapped.x, snapped.y);
        } else {
          // Multiple points placed: update line from last point to cursor, and rubber band to start
          const lastPoint = points[points.length - 1];
          const firstPoint = points[0];

          // Remove last two preview lines (last segment + rubber band)
          while (previewLines.length >= 2) {
            const line = previewLines.pop()!;
            canvas.remove(line);
          }

          // Add line from last placed point to cursor
          addPreviewLine(lastPoint.x, lastPoint.y, snapped.x, snapped.y);
          // Add rubber band line from cursor to first point
          addPreviewLine(snapped.x, snapped.y, firstPoint.x, firstPoint.y, [5, 5]);
        }

        canvas.renderAll();
      }

      function onKeyDown(e: KeyboardEvent) {
        if (e.key === 'Escape' && isDrawing) {
          cancelPolygon();
        }
      }

      canvas.on('mouse:down', onMouseDown as never);
      canvas.on('mouse:move', onMouseMove as never);

      const canvasEl = canvas.getElement();
      canvasEl.setAttribute('tabindex', '0');
      canvasEl.addEventListener('keydown', onKeyDown);

      cleanup = () => {
        canvas.off('mouse:down', onMouseDown as never);
        canvas.off('mouse:move', onMouseMove as never);
        canvasEl.removeEventListener('keydown', onKeyDown);
        clearPreview();
      };
    })();

    return () => {
      isMounted = false;
      cleanup?.();
    };
  }, [fabricCanvas, activeTool]);
}
