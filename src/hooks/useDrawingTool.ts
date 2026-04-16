'use client';

import { useEffect, useRef } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useCanvasContext } from '@/contexts/CanvasContext';
import { useProjectStore } from '@/stores/projectStore';
import { useLayoutStore } from '@/stores/layoutStore';
import { maybeSnap } from '@/lib/canvas-utils';
import { isPointInFenceAreaPure } from '@/hooks/useFenceConstraints';
import { CANVAS } from '@/lib/design-system';

export function useDrawingTool() {
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
    if (!fabricCanvas) return;

    let isMounted = true;
    let fabric: typeof import('fabric') | null = null;
    let cleanup: (() => void) | null = null;

    (async () => {
      fabric = await import('fabric');
      if (!isMounted) return;
      const canvas = fabricCanvas as InstanceType<typeof fabric.Canvas>;

      // Tools handled by their own hooks — exit early
      if (activeTool === 'polygon' || activeTool === 'easydraw' || activeTool === 'bend') {
        return;
      }

      if (activeTool === 'select') {
        canvas.selection = true;
        canvas.defaultCursor = 'default';
        canvas.getObjects().forEach((obj) => {
          // Skip objects that are explicitly marked as non-selectable (like guides)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if ((obj as any).data?.isGuide || (obj as any).data?.isHelper) return;
          // Skip layout-generated objects
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if ((obj as any)._layoutElement) return;

          obj.selectable = true;
          obj.evented = true;
          obj.hasControls = true;
          obj.hasBorders = true;
          obj.lockMovementX = false;
          obj.lockMovementY = false;
          obj.lockRotation = false;
          obj.lockScalingX = false;
          obj.lockScalingY = false;
        });
        canvas.renderAll();
        return;
      }

      // For drawing tools, disable selection but keep objects selectable after creation
      canvas.selection = false;
      canvas.defaultCursor = 'crosshair';
      canvas.discardActiveObject();
      canvas.renderAll();

      let isDrawing = false;
      let startX = 0;
      let startY = 0;
      let previewShape: InstanceType<typeof fabric.FabricObject> | null = null;

      function onMouseDown(e: { e: MouseEvent }) {
        if (stateRef.current.isSpacePressed) return;
        if (!fabric || !canvas) return;

        const pointer = canvas.getScenePoint(e.e);

        // Fence constraint: when a layout is applied, only allow drawing
        // inside block-cell fence areas
        const { hasAppliedLayout } = useLayoutStore.getState();
        if (hasAppliedLayout) {
          const fenceAreas = canvas.getObjects().filter((obj: Record<string, unknown>) =>
            obj._fenceElement && obj._fenceRole === 'block-cell'
          );
          const isInsideCell = fenceAreas.some((obj: Record<string, unknown>) =>
            (obj as unknown as { containsPoint: (pt: { x: number; y: number }) => boolean }).containsPoint(pointer)
          );
          if (!isInsideCell) return;
        }

        const s = stateRef.current;
        const sx = maybeSnap(pointer.x, s.gridSettings, s.unitSystem);
        const sy = maybeSnap(pointer.y, s.gridSettings, s.unitSystem);

        isDrawing = true;
        startX = sx;
        startY = sy;

        if (activeTool === 'rectangle') {
          previewShape = new fabric.Rect({
            left: sx,
            top: sy,
            width: 0,
            height: 0,
            fill: 'transparent',
            stroke: CANVAS.pencilPreview,
            strokeWidth: 4,
            strokeDashArray: [5, 5],
            selectable: false,
            evented: false,
            originX: 'left',
            originY: 'top',
          });
        } else if (activeTool === 'triangle') {
          // Use a Rect as preview placeholder; the final triangle is created on mouseUp
          // to avoid Fabric.js Polygon coordinate drift when updating points in-place.
          previewShape = new fabric.Rect({
            left: sx,
            top: sy,
            width: 0,
            height: 0,
            fill: 'transparent',
            stroke: CANVAS.pencilPreview,
            strokeWidth: 4,
            strokeDashArray: [5, 5],
            selectable: false,
            evented: false,
            originX: 'left',
            originY: 'top',
          });
        }

        if (previewShape) {
          canvas.add(previewShape);
          canvas.renderAll();
        }
      }

      function onMouseMove(e: { e: MouseEvent }) {
        if (!fabric || !canvas) return;
        if (!isDrawing || !previewShape) return;

        const pointer = canvas.getScenePoint(e.e);
        const s = stateRef.current;
        const cx = maybeSnap(pointer.x, s.gridSettings, s.unitSystem);
        const cy = maybeSnap(pointer.y, s.gridSettings, s.unitSystem);

        // Both rectangle and triangle preview use a bounding-box Rect
        const width = cx - startX;
        const height = cy - startY;
        previewShape.set({
          left: width >= 0 ? startX : cx,
          top: height >= 0 ? startY : cy,
          width: Math.abs(width),
          height: Math.abs(height),
        });

        canvas.renderAll();
      }

      function onMouseUp() {
        if (!fabric || !canvas) return;
        if (!isDrawing || !previewShape) return;
        isDrawing = false;

        const w = previewShape.width ?? 0;
        const h = previewShape.height ?? 0;
        const isZeroArea = w < 2 && h < 2;

        if (isZeroArea) {
          canvas.remove(previewShape);
        } else {
          const { fillColor, strokeColor, strokeWidth } = stateRef.current;

          if (activeTool === 'triangle') {
            // Replace the preview Rect with a properly positioned Polygon.
            // Using relative (0-based) points + left/top avoids the coordinate
            // drift that occurs when setting absolute points on a Fabric.js Polygon.
            const finalLeft = previewShape.left ?? startX;
            const finalTop = previewShape.top ?? startY;
            const finalW = previewShape.width ?? 0;
            const finalH = previewShape.height ?? 0;

            canvas.remove(previewShape);

            const triangle = new fabric.Polygon(
              [
                { x: 0, y: finalH },       // bottom-left
                { x: finalW, y: finalH },   // bottom-right
                { x: 0, y: 0 },             // top-left (apex)
              ],
              {
                left: finalLeft,
                top: finalTop,
                fill: fillColor,
                stroke: strokeColor,
                strokeWidth,
                selectable: true,
                evented: true,
              }
            );

            canvas.add(triangle);
          } else {
            previewShape.set({
              fill: fillColor,
              stroke: strokeColor,
              strokeWidth,
              strokeDashArray: undefined,
              selectable: true,
              evented: true,
            });
          }

          const json = JSON.stringify(canvas.toJSON());
          useCanvasStore.getState().pushUndoState(json);
          useProjectStore.getState().setDirty(true);
        }

        previewShape = null;
        canvas.renderAll();
      }

      canvas.on('mouse:down', onMouseDown as never);
      canvas.on('mouse:move', onMouseMove as never);
      canvas.on('mouse:up', onMouseUp as never);

      cleanup = () => {
        canvas.off('mouse:down', onMouseDown as never);
        canvas.off('mouse:move', onMouseMove as never);
        canvas.off('mouse:up', onMouseUp as never);
        if (previewShape) canvas.remove(previewShape);
      };
    })();

    return () => {
      isMounted = false;
      cleanup?.();
    };
  }, [fabricCanvas, activeTool]);
}
