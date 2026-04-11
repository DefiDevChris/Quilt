'use client';

import { useEffect, useRef } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useProjectStore } from '@/stores/projectStore';

/**
 * Easydraw — freehand drawing tool for the quilt worktable.
 *
 * Activates fabric.js' built-in PencilBrush in drawing mode. Each stroke
 * becomes a fabric.Path that is automatically filled with the active fill
 * color, made selectable, and pushed onto the undo stack.
 *
 * The tool deactivates whenever the active tool changes away from 'easydraw',
 * restoring normal pointer interaction.
 */
export function useEasyDrawTool() {
  const fabricCanvas = useCanvasStore((s) => s.fabricCanvas);
  const activeTool = useCanvasStore((s) => s.activeTool);

  const stateRef = useRef({
    fillColor: '#f9a06b',
    strokeColor: '#4a3f35',
    strokeWidth: 2,
  });

  useEffect(() => {
    return useCanvasStore.subscribe((state) => {
      stateRef.current = {
        fillColor: state.fillColor,
        strokeColor: state.strokeColor,
        strokeWidth: Math.max(1, state.strokeWidth),
      };
    });
  }, []);

  useEffect(() => {
    if (!fabricCanvas || activeTool !== 'easydraw') return;

    let isMounted = true;
    let cleanup: (() => void) | null = null;

    (async () => {
      const fabric = await import('fabric');
      if (!isMounted) return;
      const canvas = fabricCanvas as InstanceType<typeof fabric.Canvas>;

      const previousDrawingMode = canvas.isDrawingMode;
      const previousSelection = canvas.selection;

      const brush = new fabric.PencilBrush(canvas);
      brush.color = stateRef.current.strokeColor;
      brush.width = Math.max(2, stateRef.current.strokeWidth);
      canvas.freeDrawingBrush = brush;
      canvas.isDrawingMode = true;
      canvas.selection = false;
      canvas.defaultCursor = 'crosshair';

      // Keep brush settings in sync if the user changes color/width while
      // the tool is active.
      const unsubscribeBrush = useCanvasStore.subscribe((state) => {
        brush.color = state.strokeColor;
        brush.width = Math.max(2, state.strokeWidth);
      });

      function onPathCreated(e: { path?: import('fabric').Path }) {
        if (!e.path) return;
        const { fillColor, strokeColor, strokeWidth } = stateRef.current;
        e.path.set({
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth,
          selectable: true,
          evented: true,
          objectCaching: false,
        });
        canvas.renderAll();

        const json = JSON.stringify(canvas.toJSON());
        useCanvasStore.getState().pushUndoState(json);
        useProjectStore.getState().setDirty(true);
      }

      canvas.on('path:created', onPathCreated as never);

      cleanup = () => {
        unsubscribeBrush();
        canvas.off('path:created', onPathCreated as never);
        canvas.isDrawingMode = previousDrawingMode;
        canvas.selection = previousSelection;
        canvas.defaultCursor = 'default';
      };
    })();

    return () => {
      isMounted = false;
      cleanup?.();
    };
  }, [fabricCanvas, activeTool]);
}
