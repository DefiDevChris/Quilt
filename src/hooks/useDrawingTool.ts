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
    gridSettings: CanvasGridSettings;
    unitSystem: 'imperial' | 'metric';
    isSpacePressed: boolean;
  }>(
    (() => {
      const s = useCanvasStore.getState();
      return {
        fillColor: s.fillColor ?? CANVAS.pencilPreview,
        strokeColor: s.strokeColor ?? CANVAS.seamLine,
        strokeWidth: s.strokeWidth ?? 1,
        gridSettings: s.gridSettings,
        unitSystem: s.unitSystem,
        isSpacePressed: s.isSpacePressed,
      };
    })()
  );

  useEffect(() => {
    // subscribe returns an unsubscribe fn — it becomes the effect cleanup
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
          const objMeta = obj as unknown as Record<string, unknown>;
          if (
            (objMeta['data'] as Record<string, unknown> | undefined)?.['isGuide'] ||
            (objMeta['data'] as Record<string, unknown> | undefined)?.['isHelper']
          )
            return;
          if (objMeta['_layoutElement']) return;
          if (objMeta['_fenceElement']) return;
          if (objMeta['_inFenceCellId']) {
            obj.selectable = true;
            obj.evented = true;
            obj.hasControls = false;
            obj.hasBorders = true;
            return;
          }

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
      canvas.defaultCursor = cursorForTool(activeTool);
      canvas.discardActiveObject();
      canvas.renderAll();

      let isDrawing = false;
      let startX = 0;
      let startY = 0;
      let lastEvent: MouseEvent | null = null;
      let previewShape: InstanceType<typeof fabric.FabricObject> | null = null;

      // Snap a raw scene-space point according to current mode.
      function snapScenePoint(pt: { x: number; y: number }): { x: number; y: number } {
        const s = stateRef.current;
        const { mode } = useProjectStore.getState();
        if (mode === 'free-form') {
          const gridSizeIn =
            s.gridSettings.size *
            (s.gridSettings.granularity === 'half'
              ? 0.5
              : s.gridSettings.granularity === 'quarter'
                ? 0.25
                : 1);
          return snapToGridCorner(pt, gridSizeIn, useCanvasStore.getState().zoom);
        }
        return {
          x: maybeSnap(pt.x, s.gridSettings, s.unitSystem),
          y: maybeSnap(pt.y, s.gridSettings, s.unitSystem),
        };
      }

      // Given the current pointer and active modifiers, compute the
      // axis-aligned bounding box of the shape being drawn.
      //   Shift → square (abs(dx) == abs(dy)).
      //   Alt   → start point is treated as the center of the shape.
      function computeBox(cx: number, cy: number, shift: boolean, alt: boolean) {
        let dx = cx - startX;
        let dy = cy - startY;
        if (shift) {
          const m = Math.max(Math.abs(dx), Math.abs(dy));
          dx = Math.sign(dx || 1) * m;
          dy = Math.sign(dy || 1) * m;
        }
        let left: number;
        let top: number;
        let width: number;
        let height: number;
        if (alt) {
          width = Math.abs(dx) * 2;
          height = Math.abs(dy) * 2;
          left = startX - Math.abs(dx);
          top = startY - Math.abs(dy);
        } else {
          width = Math.abs(dx);
          height = Math.abs(dy);
          left = dx >= 0 ? startX : startX + dx;
          top = dy >= 0 ? startY : startY + dy;
        }
        return { left, top, width, height, dx, dy };
      }

      // Isoceles triangle inscribed in a WxH box whose apex points in the
      // dominant drag direction, expressed as three points relative to the
      // box's top-left (0,0).
      function triangleRelPoints(
        w: number,
        h: number,
        dx: number,
        dy: number
      ): Array<{ x: number; y: number }> {
        const horizontal = Math.abs(dx) > Math.abs(dy);
        if (horizontal) {
          if (dx >= 0) {
            // apex right
            return [
              { x: 0, y: 0 },
              { x: 0, y: h },
              { x: w, y: h / 2 },
            ];
          }
          return [
            { x: w, y: 0 },
            { x: w, y: h },
            { x: 0, y: h / 2 },
          ];
        }
        if (dy >= 0) {
          // apex bottom
          return [
            { x: 0, y: 0 },
            { x: w, y: 0 },
            { x: w / 2, y: h },
          ];
        }
        // apex top
        return [
          { x: 0, y: h },
          { x: w, y: h },
          { x: w / 2, y: 0 },
        ];
      }

      function previewStrokeWidth(): number {
        return 6 / Math.max(0.0001, useCanvasStore.getState().zoom);
      }

      function previewDash(): [number, number] {
        const z = Math.max(0.0001, useCanvasStore.getState().zoom);
        return [8 / z, 6 / z];
      }

      function onMouseDown(e: { e: MouseEvent }) {
        if (stateRef.current.isSpacePressed) return;
        if (!fabric || !canvas) return;

        const pointer = canvas.getScenePoint(e.e);
        const { mode } = useProjectStore.getState();

        // Fence constraint: Layout/Template modes only allow drawing inside block-cell areas
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
            if (typeof window !== 'undefined') {
              window.dispatchEvent(
                new CustomEvent('quiltstudio:fence-rejection', {
                  detail: {
                    message: 'Shapes can only be drawn inside block cells in this mode.',
                  },
                })
              );
            }
            return;
          }
        }

        const snapped = snapScenePoint(pointer);
        isDrawing = true;
        startX = snapped.x;
        startY = snapped.y;
        lastEvent = e.e;

        const sw = previewStrokeWidth();
        const dash = previewDash();

        if (activeTool === 'rectangle') {
          previewShape = new fabric.Rect({
            left: startX,
            top: startY,
            width: 0,
            height: 0,
            fill: 'transparent',
            stroke: CANVAS.pencilPreview,
            strokeWidth: sw,
            strokeDashArray: dash,
            selectable: false,
            evented: false,
            originX: 'left',
            originY: 'top',
          });
        } else if (activeTool === 'triangle') {
          previewShape = new fabric.Polygon(
            [
              { x: 0, y: 0 },
              { x: 0, y: 0 },
              { x: 0, y: 0 },
            ],
            {
              left: startX,
              top: startY,
              fill: 'transparent',
              stroke: CANVAS.pencilPreview,
              strokeWidth: sw,
              strokeDashArray: dash,
              selectable: false,
              evented: false,
              originX: 'left',
              originY: 'top',
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

        lastEvent = e.e;
        const pointer = canvas.getScenePoint(e.e);
        const { x: cx, y: cy } = snapScenePoint(pointer);
        const shift = !!e.e.shiftKey;
        const alt = !!e.e.altKey;

        const box = computeBox(cx, cy, shift, alt);

        if (activeTool === 'rectangle') {
          previewShape.set({
            left: box.left,
            top: box.top,
            width: box.width,
            height: box.height,
          });
        } else if (activeTool === 'triangle') {
          const relPoints = triangleRelPoints(box.width, box.height, box.dx, box.dy);
          const poly = previewShape as InstanceType<typeof fabric.Polygon>;
          poly.points = relPoints;
          poly.set({ left: box.left, top: box.top });
          poly.setBoundingBox(true);
          poly.setCoords();
        }

        const { unitSystem } = stateRef.current;
        showDrawingHud(
          e.e.clientX,
          e.e.clientY,
          `${formatLength(box.width, unitSystem)} \u00d7 ${formatLength(box.height, unitSystem)}`
        );

        canvas.renderAll();
      }

      function cancelDrawing() {
        if (!canvas) return;
        if (previewShape) canvas.remove(previewShape);
        previewShape = null;
        isDrawing = false;
        hideDrawingHud();
        canvas.renderAll();
      }

      function onMouseUp(e?: { e?: MouseEvent }) {
        if (!fabric || !canvas) return;
        if (!isDrawing || !previewShape) return;
        isDrawing = false;

        const upEvent = e?.e ?? lastEvent;
        const shift = !!upEvent?.shiftKey;
        const alt = !!upEvent?.altKey;

        // Recompute final box from the last known pointer + current modifiers.
        // The preview's left/top/width/height already reflect the move handler's
        // most recent state, so we use those directly.
        const finalLeft = previewShape.left ?? startX;
        const finalTop = previewShape.top ?? startY;
        const finalW = previewShape.width ?? 0;
        const finalH = previewShape.height ?? 0;

        const isZeroArea = finalW < 2 && finalH < 2;
        if (isZeroArea) {
          canvas.remove(previewShape);
          previewShape = null;
          hideDrawingHud();
          canvas.renderAll();
          return;
        }

        const { fillColor, strokeColor, strokeWidth } = stateRef.current;
        void shift;
        void alt;

        if (activeTool === 'triangle') {
          // Reuse the apex-direction points computed during preview.
          const poly = previewShape as InstanceType<typeof fabric.Polygon>;
          const finalPoints = poly.points
            ? poly.points.map((p) => ({ x: p.x, y: p.y }))
            : [
                { x: 0, y: finalH },
                { x: finalW, y: finalH },
                { x: 0, y: 0 },
              ];

          canvas.remove(previewShape);

          const triangle = new fabric.Polygon(finalPoints, {
            left: finalLeft,
            top: finalTop,
            fill: fillColor,
            stroke: strokeColor,
            strokeWidth,
            selectable: true,
            evented: true,
          });

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

        previewShape = null;
        hideDrawingHud();
        canvas.renderAll();
      }

      function onKeyDown(ev: KeyboardEvent) {
        if (ev.key === 'Escape' && isDrawing) {
          cancelDrawing();
        }
        // Re-trigger move handler so Shift/Alt take effect without pointer motion.
        if ((ev.key === 'Shift' || ev.key === 'Alt') && isDrawing && lastEvent) {
          onMouseMove({ e: lastEvent });
        }
      }
      function onKeyUp(ev: KeyboardEvent) {
        if ((ev.key === 'Shift' || ev.key === 'Alt') && isDrawing && lastEvent) {
          onMouseMove({ e: lastEvent });
        }
      }

      canvas.on('mouse:down', onMouseDown as never);
      canvas.on('mouse:move', onMouseMove as never);
      canvas.on('mouse:up', onMouseUp as never);
      window.addEventListener('keydown', onKeyDown);
      window.addEventListener('keyup', onKeyUp);

      cleanup = () => {
        canvas.off('mouse:down', onMouseDown as never);
        canvas.off('mouse:move', onMouseMove as never);
        canvas.off('mouse:up', onMouseUp as never);
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keyup', onKeyUp);
        if (previewShape) canvas.remove(previewShape);
      };
    })();

    return () => {
      isMounted = false;
      cleanup?.();
    };
  }, [fabricCanvas, activeTool]);
}
