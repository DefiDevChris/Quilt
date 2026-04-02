'use client';

import { useEffect, useRef } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useProjectStore } from '@/stores/projectStore';
import { getPixelsPerUnit, snapToGrid, maybeSnap } from '@/lib/canvas-utils';

interface AnchorPoint {
  x: number;
  y: number;
  cp1x: number;
  cp1y: number;
  cp2x: number;
  cp2y: number;
}

function buildSvgPathData(anchors: AnchorPoint[]): string {
  if (anchors.length < 2) return '';
  const parts: string[] = [`M ${anchors[0].x} ${anchors[0].y}`];
  for (let i = 1; i < anchors.length; i++) {
    const prev = anchors[i - 1];
    const curr = anchors[i];
    parts.push(`C ${prev.cp2x} ${prev.cp2y}, ${curr.cp1x} ${curr.cp1y}, ${curr.x} ${curr.y}`);
  }
  return parts.join(' ');
}

export function useBezierCurveTool() {
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
    if (!fabricCanvas || activeTool !== 'bend') return;

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
      canvas.getObjects().forEach((obj) => {
        obj.selectable = false;
        obj.evented = false;
      });
      canvas.renderAll();

      const anchors: AnchorPoint[] = [];
      let previewPath: InstanceType<typeof fabric.Path> | null = null;
      const controlVisuals: InstanceType<typeof fabric.FabricObject>[] = [];
      let isDragging = false;
      let dragAnchorIndex = -1;

      function clearControlVisuals() {
        controlVisuals.forEach((v) => canvas.remove(v));
        controlVisuals.length = 0;
      }

      function drawControlVisuals() {
        if (!fabric) return;
        clearControlVisuals();
        for (const anchor of anchors) {
          // Control point handles as small circles
          const cp1 = new fabric.Circle({
            left: anchor.cp1x - 4,
            top: anchor.cp1y - 4,
            radius: 4,
            fill: '#1976D2',
            stroke: '#fff',
            strokeWidth: 1,
            selectable: false,
            evented: false,
          });
          const cp2 = new fabric.Circle({
            left: anchor.cp2x - 4,
            top: anchor.cp2y - 4,
            radius: 4,
            fill: '#E53935',
            stroke: '#fff',
            strokeWidth: 1,
            selectable: false,
            evented: false,
          });
          // Lines from anchor to control points
          const line1 = new fabric.Line([anchor.x, anchor.y, anchor.cp1x, anchor.cp1y], {
            stroke: '#1976D2',
            strokeWidth: 1,
            strokeDashArray: [3, 3],
            selectable: false,
            evented: false,
          });
          const line2 = new fabric.Line([anchor.x, anchor.y, anchor.cp2x, anchor.cp2y], {
            stroke: '#E53935',
            strokeWidth: 1,
            strokeDashArray: [3, 3],
            selectable: false,
            evented: false,
          });
          // Anchor point
          const anchorDot = new fabric.Circle({
            left: anchor.x - 5,
            top: anchor.y - 5,
            radius: 5,
            fill: '#fff',
            stroke: '#2D2D2D',
            strokeWidth: 2,
            selectable: false,
            evented: false,
          });
          canvas.add(line1, line2, cp1, cp2, anchorDot);
          controlVisuals.push(line1, line2, cp1, cp2, anchorDot);
        }
        canvas.renderAll();
      }

      function updatePreview() {
        if (!fabric) return;
        if (previewPath) canvas.remove(previewPath);
        if (anchors.length < 2) {
          previewPath = null;
          return;
        }
        const pathData = buildSvgPathData(anchors);
        previewPath = new fabric.Path(pathData, {
          fill: 'transparent',
          stroke: stateRef.current.strokeColor,
          strokeWidth: stateRef.current.strokeWidth,
          strokeDashArray: [5, 5],
          selectable: false,
          evented: false,
        });
        canvas.add(previewPath);
        // Ensure preview is below control visuals
        if (previewPath) {
          canvas.sendObjectToBack(previewPath);
        }
      }

      function finalizePath() {
        if (!fabric || anchors.length < 2) {
          anchors.length = 0;
          clearControlVisuals();
          if (previewPath) {
            canvas.remove(previewPath);
            previewPath = null;
          }
          return;
        }

        clearControlVisuals();
        if (previewPath) {
          canvas.remove(previewPath);
          previewPath = null;
        }

        const pathData = buildSvgPathData(anchors);
        const { fillColor, strokeColor, strokeWidth } = stateRef.current;
        const finalPath = new fabric.Path(pathData, {
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth,
          selectable: false,
          evented: false,
        });
        canvas.add(finalPath);

        const json = JSON.stringify(canvas.toJSON());
        useCanvasStore.getState().pushUndoState(json);
        useProjectStore.getState().setDirty(true);

        anchors.length = 0;
        canvas.renderAll();
      }

      function onMouseDown(e: { e: MouseEvent }) {
        if (stateRef.current.isSpacePressed || !fabric) return;

        const pointer = canvas.getScenePoint(e.e);
        const s = stateRef.current;
        const sx = maybeSnap(pointer.x, s.gridSettings, s.unitSystem);
        const sy = maybeSnap(pointer.y, s.gridSettings, s.unitSystem);

        // Start dragging to set control points
        isDragging = true;
        dragAnchorIndex = anchors.length;

        anchors.push({
          x: sx,
          y: sy,
          cp1x: sx,
          cp1y: sy,
          cp2x: sx,
          cp2y: sy,
        });

        updatePreview();
        drawControlVisuals();
      }

      function onMouseMove(e: { e: MouseEvent }) {
        if (!fabric || !isDragging || dragAnchorIndex < 0) return;

        const pointer = canvas.getScenePoint(e.e);
        const anchor = anchors[dragAnchorIndex];
        if (!anchor) return;

        // Drag sets cp2 away from anchor, cp1 mirrors it
        const dx = pointer.x - anchor.x;
        const dy = pointer.y - anchor.y;
        anchor.cp2x = anchor.x + dx;
        anchor.cp2y = anchor.y + dy;
        anchor.cp1x = anchor.x - dx;
        anchor.cp1y = anchor.y - dy;

        updatePreview();
        drawControlVisuals();
      }

      function onMouseUp() {
        isDragging = false;
        dragAnchorIndex = -1;
      }

      function onDoubleClick() {
        finalizePath();
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
        clearControlVisuals();
        if (previewPath) canvas.remove(previewPath);
        // If there are unfinished anchors, finalize or discard
        if (anchors.length >= 2) {
          finalizePath();
        } else {
          anchors.length = 0;
        }
      };
    })();

    return () => {
      isMounted = false;
      cleanup?.();
    };
  }, [fabricCanvas, activeTool]);
}
