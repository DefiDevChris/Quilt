'use client';

import { useEffect, useRef } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useProjectStore } from '@/stores/projectStore';
import { getPixelsPerUnit, snapToGrid, maybeSnap } from '@/lib/canvas-utils';

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
      if (
        activeTool === 'text' ||
        activeTool === 'easydraw' ||
        activeTool === 'eyedropper' ||
        activeTool === 'spraycan'
      ) {
        return;
      }

      if (activeTool === 'select') {
        canvas.selection = true;
        canvas.defaultCursor = 'default';
        canvas.getObjects().forEach((obj) => {
          // Skip objects that are explicitly marked as non-selectable (like guides)
          if (obj.data?.isGuide || obj.data?.isHelper) return;
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
      let polygonPoints: { x: number; y: number }[] = [];
      let polygonPreviewLine: InstanceType<typeof fabric.Line> | null = null;

      function onMouseDown(e: { e: MouseEvent }) {
        if (stateRef.current.isSpacePressed) return;
        if (!fabric || !canvas) return;

        const pointer = canvas.getScenePoint(e.e);
        const s = stateRef.current;
        const sx = maybeSnap(pointer.x, s.gridSettings, s.unitSystem);
        const sy = maybeSnap(pointer.y, s.gridSettings, s.unitSystem);

        if (activeTool === 'polygon') {
          polygonPoints.push({ x: sx, y: sy });
          if (polygonPreviewLine) {
            canvas.remove(polygonPreviewLine);
          }
          if (polygonPoints.length > 1) {
            const prev = polygonPoints[polygonPoints.length - 2];
            const line = new fabric.Line([prev.x, prev.y, sx, sy], {
              stroke: stateRef.current.strokeColor,
              strokeWidth: 1,
              selectable: false,
              evented: false,
              strokeDashArray: [5, 5],
            });
            canvas.add(line);
            polygonPreviewLine = null;
          }
          const preview = new fabric.Line([sx, sy, sx, sy], {
            stroke: stateRef.current.strokeColor,
            strokeWidth: 1,
            selectable: false,
            evented: false,
            strokeDashArray: [5, 5],
          });
          canvas.add(preview);
          polygonPreviewLine = preview;
          canvas.renderAll();
          return;
        }

        isDrawing = true;
        startX = sx;
        startY = sy;

        const { strokeColor, strokeWidth } = stateRef.current;

        if (activeTool === 'rectangle') {
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
        } else if (activeTool === 'line') {
          previewShape = new fabric.Line([sx, sy, sx, sy], {
            stroke: '#00FF00',
            strokeWidth: 4,
            strokeDashArray: [5, 5],
            selectable: false,
            evented: false,
          });
        }

        if (previewShape) {
          canvas.add(previewShape);
          canvas.renderAll();
        }
      }

      function onMouseMove(e: { e: MouseEvent }) {
        if (!fabric || !canvas) return;
        const pointer = canvas.getScenePoint(e.e);
        const s = stateRef.current;
        const cx = maybeSnap(pointer.x, s.gridSettings, s.unitSystem);
        const cy = maybeSnap(pointer.y, s.gridSettings, s.unitSystem);

        if (activeTool === 'polygon' && polygonPreviewLine) {
          polygonPreviewLine.set({ x2: cx, y2: cy });
          canvas.renderAll();
          return;
        }

        if (!isDrawing || !previewShape) return;

        if (activeTool === 'rectangle') {
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
        } else if (activeTool === 'line') {
          (previewShape as InstanceType<typeof fabric.Line>).set({ x2: cx, y2: cy });
        }

        canvas.renderAll();
      }

      function onMouseUp() {
        if (!fabric || !canvas) return;
        if (activeTool === 'polygon') return;
        if (!isDrawing || !previewShape) return;
        isDrawing = false;

        const w = previewShape.width ?? 0;
        const h = previewShape.height ?? 0;
        const isZeroArea =
          activeTool === 'line'
            ? Math.abs(
                (previewShape as InstanceType<typeof fabric.Line>).x2! -
                  (previewShape as InstanceType<typeof fabric.Line>).x1!
              ) < 2 &&
              Math.abs(
                (previewShape as InstanceType<typeof fabric.Line>).y2! -
                  (previewShape as InstanceType<typeof fabric.Line>).y1!
              ) < 2
            : w < 2 && h < 2;

        if (isZeroArea) {
          canvas.remove(previewShape);
        } else {
          const { fillColor, strokeColor, strokeWidth } = stateRef.current;
          previewShape.set({
            fill: activeTool === 'line' ? undefined : fillColor,
            stroke: strokeColor,
            strokeWidth,
            strokeDashArray: undefined,
            selectable: true,
            evented: true,
          });
          const json = JSON.stringify(canvas.toJSON());
          useCanvasStore.getState().pushUndoState(json);
          useProjectStore.getState().setDirty(true);
        }

        previewShape = null;
        canvas.renderAll();
      }

      function onDoubleClick() {
        if (!fabric || !canvas || activeTool !== 'polygon') return;
        if (polygonPoints.length < 3) {
          polygonPoints = [];
          if (polygonPreviewLine) {
            canvas.remove(polygonPreviewLine);
            polygonPreviewLine = null;
          }
          return;
        }

        canvas.getObjects().forEach((obj) => {
          if (obj.strokeDashArray) canvas.remove(obj);
        });

        const { fillColor, strokeColor, strokeWidth } = stateRef.current;
        const polygon = new fabric.Polygon([...polygonPoints], {
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

        polygonPoints = [];
        polygonPreviewLine = null;
        canvas.renderAll();
      }

      canvas.on('mouse:down', onMouseDown as never);
      canvas.on('mouse:move', onMouseMove as never);
      canvas.on('mouse:up', onMouseUp as never);
      canvas.on('mouse:dblclick', onDoubleClick as never);

      cleanup = () => {
        canvas.off('mouse:down', onMouseDown as never);
        canvas.off('mouse:move', onMouseMove as never);
        canvas.off('mouse:up', onMouseUp as never);
        canvas.off('mouse:dblclick', onDoubleClick as never);
        if (previewShape) canvas.remove(previewShape);
        if (polygonPreviewLine) canvas.remove(polygonPreviewLine);
      };
    })();

    return () => {
      isMounted = false;
      cleanup?.();
    };
  }, [fabricCanvas, activeTool]);
}
