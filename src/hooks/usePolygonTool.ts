'use client';

import { useEffect, useRef } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useCanvasContext } from '@/contexts/CanvasContext';
import { useProjectStore } from '@/stores/projectStore';
import { useLayoutStore } from '@/stores/layoutStore';
import { maybeSnap, cursorForTool } from '@/lib/canvas-utils';
import { snapToGridCorner } from '@/lib/snap-utils';
import { showDrawingHud, hideDrawingHud, formatLength } from '@/lib/drawing-hud';
import type { CanvasGridSettings } from '@/types/grid';
import { CANVAS } from '@/lib/design-system';

export function usePolygonTool() {
  const { getCanvas } = useCanvasContext();
  const fabricCanvas = getCanvas();
  const activeTool = useCanvasStore((s) => s.activeTool);

  const stateRef = useRef<{
    fillColor: string;
    strokeColor: string;
    strokeWidth: number;
    gridSettings: CanvasGridSettings;
    unitSystem: 'imperial' | 'metric';
    isSpacePressed: boolean;
  }>({
    fillColor: CANVAS.pencilPreview,
    strokeColor: CANVAS.seamLine,
    strokeWidth: 1,
    gridSettings: { enabled: true, size: 1, snapToGrid: true, granularity: 'inch' },
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
      canvas.defaultCursor = cursorForTool('polygon');
      canvas.discardActiveObject();
      canvas.renderAll();

      let points: { x: number; y: number }[] = [];
      let previewLines: InstanceType<typeof fabric.Line>[] = [];
      let previewDots: InstanceType<typeof fabric.Circle>[] = [];
      let isDrawing = false;
      let lastPointer: { x: number; y: number } | null = null;

      function zoom(): number {
        return Math.max(0.0001, useCanvasStore.getState().zoom);
      }

      function closeThreshold(): number {
        return 15 / zoom();
      }

      // Constrain a point to 45° increments relative to an origin.
      function constrain45(origin: { x: number; y: number }, pt: { x: number; y: number }) {
        const dx = pt.x - origin.x;
        const dy = pt.y - origin.y;
        const angle = Math.atan2(dy, dx);
        const snappedAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
        const len = Math.hypot(dx, dy);
        return {
          x: origin.x + len * Math.cos(snappedAngle),
          y: origin.y + len * Math.sin(snappedAngle),
        };
      }

      function snapPoint(x: number, y: number): { x: number; y: number } {
        const s = stateRef.current;
        const { mode } = useProjectStore.getState();

        if (mode === 'free-form') {
          // Free-form: snap to grid corners at current granularity
          const gridSizeIn =
            s.gridSettings.size *
            (s.gridSettings.granularity === 'half'
              ? 0.5
              : s.gridSettings.granularity === 'quarter'
                ? 0.25
                : 1);
          return snapToGridCorner({ x, y }, gridSizeIn, useCanvasStore.getState().zoom);
        } else {
          // Layout/Template: use existing snap logic
          return {
            x: maybeSnap(x, s.gridSettings, s.unitSystem),
            y: maybeSnap(y, s.gridSettings, s.unitSystem),
          };
        }
      }

      function addPreviewDot(x: number, y: number, emphasize = false) {
        if (!fabric || !canvas) return;
        const z = zoom();
        const r = (emphasize ? 8 : 5) / z;
        const dot = new fabric.Circle({
          left: x - r,
          top: y - r,
          radius: r,
          fill: emphasize ? CANVAS.pencilPreview : CANVAS.seamLine,
          stroke: emphasize ? CANVAS.seamLine : undefined,
          strokeWidth: emphasize ? 2 / z : 0,
          selectable: false,
          evented: false,
        });
        canvas.add(dot);
        previewDots.push(dot);
      }

      // Re-render the first vertex dot to reflect close-affordance state.
      function updateFirstDotAffordance(near: boolean) {
        if (!canvas || previewDots.length === 0 || points.length < 3) return;
        const firstDot = previewDots[0];
        const z = zoom();
        const r = (near ? 8 : 5) / z;
        firstDot.set({
          radius: r,
          left: points[0].x - r,
          top: points[0].y - r,
          fill: near ? CANVAS.pencilPreview : CANVAS.seamLine,
          stroke: near ? CANVAS.seamLine : '',
          strokeWidth: near ? 2 / z : 0,
        });
      }

      function addPreviewLine(
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        dashArray?: number[]
      ) {
        if (!fabric || !canvas) return;
        const z = zoom();
        const scaledDash = dashArray ? dashArray.map((d) => d / z) : undefined;
        const line = new fabric.Line([x1, y1, x2, y2], {
          stroke: CANVAS.pencilPreview,
          strokeWidth: 4 / z,
          strokeDashArray: scaledDash,
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
          hideDrawingHud();
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
        hideDrawingHud();
        canvas.renderAll();
      }

      function cancelPolygon() {
        clearPreview();
        points = [];
        isDrawing = false;
        hideDrawingHud();
        canvas.renderAll();
      }

      function onMouseDown(e: { e: MouseEvent }) {
        if (stateRef.current.isSpacePressed) return;
        if (!fabric || !canvas) return;

        const pointerRaw = canvas.getScenePoint(e.e);
        const pointer =
          e.e.shiftKey && points.length > 0
            ? constrain45(points[points.length - 1], pointerRaw)
            : pointerRaw;

        // Fence constraint: Layout/Template modes only allow polygon vertices inside block-cell areas
        const { mode } = useProjectStore.getState();
        const emitFenceRejection = () => {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('quiltstudio:fence-rejection', {
                detail: {
                  message: 'Polygon vertices must be placed inside a block cell in this mode.',
                },
              })
            );
          }
        };
        if (mode === 'layout' || mode === 'template') {
          const fenceAreas = canvas
            .getObjects()
            .filter(
              (obj) =>
                (obj as unknown as Record<string, unknown>)['_fenceElement'] &&
                (obj as unknown as Record<string, unknown>)['_fenceRole'] === 'block-cell'
            );
          const isInsideCell = fenceAreas.some((obj) =>
            (
              obj as unknown as { containsPoint: (pt: { x: number; y: number }) => boolean }
            ).containsPoint(pointer)
          );
          if (!isInsideCell) {
            emitFenceRejection();
            return;
          }
        }

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

          if (distToStart < closeThreshold() && points.length >= 3) {
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

        const pointerRaw = canvas.getScenePoint(e.e);
        lastPointer = pointerRaw;
        const pointer = e.e.shiftKey
          ? constrain45(points[points.length - 1], pointerRaw)
          : pointerRaw;
        const snapped = snapPoint(pointer.x, pointer.y);

        // Visual affordance for closing the polygon.
        if (points.length >= 3) {
          const first = points[0];
          const dist = Math.hypot(snapped.x - first.x, snapped.y - first.y);
          updateFirstDotAffordance(dist < closeThreshold());
        }

        // Dimension HUD: show the length of the rubber-band segment.
        const anchor = points[points.length - 1];
        const segLenPx = Math.hypot(snapped.x - anchor.x, snapped.y - anchor.y);
        showDrawingHud(
          e.e.clientX,
          e.e.clientY,
          formatLength(segLenPx, stateRef.current.unitSystem)
        );

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

      function undoLastVertex() {
        if (!canvas || !isDrawing || points.length === 0) return;
        if (points.length === 1) {
          cancelPolygon();
          return;
        }
        points.pop();
        // Remove the dot for the popped vertex and the last two lines
        // (segment + rubber band), then re-add the rubber band from the
        // new last point to the first point (via current pointer if known).
        const poppedDot = previewDots.pop();
        if (poppedDot) canvas.remove(poppedDot);
        while (previewLines.length > 0) {
          const line = previewLines.pop()!;
          canvas.remove(line);
        }
        // Re-add existing segment lines between remaining points.
        for (let i = 1; i < points.length; i++) {
          addPreviewLine(points[i - 1].x, points[i - 1].y, points[i].x, points[i].y);
        }
        // Rubber band from last placed point to current pointer (or first point).
        const last = points[points.length - 1];
        const target = lastPointer ?? points[0];
        addPreviewLine(last.x, last.y, target.x, target.y);
        if (points.length >= 2) {
          addPreviewLine(target.x, target.y, points[0].x, points[0].y, [5, 5]);
        }
        canvas.renderAll();
      }

      function onKeyDown(e: KeyboardEvent) {
        if (!isDrawing) return;
        if (e.key === 'Escape') {
          e.preventDefault();
          cancelPolygon();
        } else if (e.key === 'Enter' && points.length >= 3) {
          e.preventDefault();
          completePolygon();
        } else if (e.key === 'Backspace' || e.key === 'Delete') {
          e.preventDefault();
          undoLastVertex();
        }
      }

      function onDblClick() {
        if (isDrawing && points.length >= 3) {
          completePolygon();
        }
      }

      canvas.on('mouse:down', onMouseDown as never);
      canvas.on('mouse:move', onMouseMove as never);
      canvas.on('mouse:dblclick', onDblClick as never);

      const canvasEl = canvas.getElement();
      canvasEl.setAttribute('tabindex', '0');
      canvasEl.addEventListener('keydown', onKeyDown);
      window.addEventListener('keydown', onKeyDown);

      cleanup = () => {
        canvas.off('mouse:down', onMouseDown as never);
        canvas.off('mouse:move', onMouseMove as never);
        canvas.off('mouse:dblclick', onDblClick as never);
        canvasEl.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keydown', onKeyDown);
        clearPreview();
      };
    })();

    return () => {
      isMounted = false;
      cleanup?.();
    };
  }, [fabricCanvas, activeTool]);
}
