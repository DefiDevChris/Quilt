'use client';

import { useEffect, useRef } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useProjectStore } from '@/stores/projectStore';
import { maybeSnap } from '@/lib/canvas-utils';

export function useDrawingTool() {
  const fabricCanvas = useCanvasStore((s) => s.fabricCanvas);
  const activeTool = useCanvasStore((s) => s.activeTool);
  const stateRef = useRef({
    fillColor: '#D4883C',
    strokeColor: '#2D2D2D',
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
      if (activeTool === 'blockbuilder' || activeTool === 'spraycan') {
        return;
      }

      if (activeTool === 'select') {
        canvas.selection = true;
        canvas.defaultCursor = 'default';
        canvas.getObjects().forEach((obj) => {
          // Skip objects that are explicitly marked as non-selectable (like guides)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if ((obj as any).data?.isGuide || (obj as any).data?.isHelper) return;
          obj.selectable = true;
          obj.evented = true;
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
        const s = stateRef.current;
        const sx = maybeSnap(pointer.x, s.gridSettings, s.unitSystem);
        const sy = maybeSnap(pointer.y, s.gridSettings, s.unitSystem);

        isDrawing = true;
        startX = sx;
        startY = sy;

        if (activeTool === 'rectangle' || activeTool === 'sashing' || activeTool === 'border') {
          previewShape = new fabric.Rect({
            left: sx,
            top: sy,
            width: 0,
            height: 0,
            fill: 'transparent',
            stroke: '#00FF00',
            strokeWidth: 4,
            strokeDashArray: [5, 5],
            selectable: false,
            evented: false,
            originX: 'left',
            originY: 'top',
          });
        } else if (activeTool === 'triangle') {
          previewShape = new fabric.Polygon(
            [
              { x: sx, y: sy },
              { x: sx, y: sy },
              { x: sx, y: sy },
            ],
            {
              fill: 'transparent',
              stroke: '#00FF00',
              strokeWidth: 4,
              strokeDashArray: [5, 5],
              selectable: false,
              evented: false,
            }
          );
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

        if (activeTool === 'rectangle' || activeTool === 'sashing' || activeTool === 'border') {
          const width = cx - startX;
          const height = cy - startY;
          previewShape.set({
            left: width >= 0 ? startX : cx,
            top: height >= 0 ? startY : cy,
            width: Math.abs(width),
            height: Math.abs(height),
          });
        } else if (activeTool === 'triangle') {
          const poly = previewShape as InstanceType<typeof fabric.Polygon>;
          poly.points = [
            { x: startX, y: cy },
            { x: cx, y: cy },
            { x: startX, y: startY },
          ];
          poly.setBoundingBox(true);
          poly.setCoords();
        }

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
          
          // Tag sashing and border shapes with metadata
          const metadata: Record<string, unknown> = {};
          if (activeTool === 'sashing') {
            metadata.type = 'sashing';
          } else if (activeTool === 'border') {
            metadata.type = 'border';
          }

          previewShape.set({
            fill: fillColor,
            stroke: strokeColor,
            strokeWidth,
            strokeDashArray: undefined,
            selectable: true,
            evented: true,
            data: metadata,
          });

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
