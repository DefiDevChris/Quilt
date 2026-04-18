'use client';

import { useEffect, useRef } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useCanvasContext } from '@/contexts/CanvasContext';
import { useProjectStore } from '@/stores/projectStore';
import { useLayoutStore } from '@/stores/layoutStore';
import { maybeSnap, cursorForTool } from '@/lib/canvas-utils';
import { snapToGridCorner } from '@/lib/snap-utils';
import type { CanvasGridSettings } from '@/types/grid';
import { CANVAS } from '@/lib/design-system';

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
  const { getCanvas } = useCanvasContext();
  const fabricCanvas = getCanvas();
  const activeTool = useCanvasStore((s) => s.activeTool);

  const stateRef = useRef<{
    fillColor: string;
    strokeColor: string;
    strokeWidth: number;
    gridSettings: CanvasGridSettings;
    unitSystem: 'imperial' | 'metric';
  }>({
    fillColor: CANVAS.pencilPreview,
    strokeColor: CANVAS.seamLine,
    strokeWidth: 2,
    gridSettings: { enabled: true, size: 1, snapToGrid: true, granularity: 'inch' },
    unitSystem: 'imperial' as 'imperial' | 'metric',
  });

  useEffect(() => {
    return useCanvasStore.subscribe((state) => {
      stateRef.current = {
        fillColor: state.fillColor,
        strokeColor: state.strokeColor,
        strokeWidth: Math.max(1, state.strokeWidth),
        gridSettings: state.gridSettings,
        unitSystem: state.unitSystem,
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
      canvas.defaultCursor = cursorForTool('easydraw');

      // Keep brush settings in sync if the user changes color/width while
      // the tool is active.
      const unsubscribeBrush = useCanvasStore.subscribe((state) => {
        brush.color = state.strokeColor;
        brush.width = Math.max(2, state.strokeWidth);
      });

      function onPathCreated(e: { path?: import('fabric').Path }) {
        if (!e.path) return;

        // Fence constraint: Layout/Template modes reject paths outside block-cell areas
        const { mode } = useProjectStore.getState();
        if (mode === 'layout' || mode === 'template') {
          const pathBounds = e.path.getBoundingRect();
          const fenceAreas = canvas
            .getObjects()
            .filter(
              (obj) =>
                (obj as unknown as Record<string, unknown>)['_fenceElement'] &&
                (obj as unknown as Record<string, unknown>)['_fenceRole'] === 'block-cell'
            );
          const overlapsCell = fenceAreas.some((fenceObj) => {
            const fo = fenceObj as unknown as {
              left: number;
              top: number;
              width: number;
              height: number;
              scaleX: number;
              scaleY: number;
            };
            const fx = fo.left ?? 0;
            const fy = fo.top ?? 0;
            const fw = (fo.width ?? 0) * (fo.scaleX ?? 1);
            const fh = (fo.height ?? 0) * (fo.scaleY ?? 1);
            return (
              pathBounds.left < fx + fw &&
              pathBounds.left + pathBounds.width > fx &&
              pathBounds.top < fy + fh &&
              pathBounds.top + pathBounds.height > fy
            );
          });
          if (!overlapsCell) {
            canvas.remove(e.path);
            canvas.renderAll();
            return;
          }
        }

        // Phase 6: Snap-to-grid post-processing for EasyDraw paths
        const { gridSettings, unitSystem } = stateRef.current;
        if (gridSettings.snapToGrid && e.path.path) {
          const pathData = e.path.path as Array<Array<string | number>>;
          const zoom = useCanvasStore.getState().zoom;

          for (const cmd of pathData) {
            // SVG path commands: M/L have x,y at indices 1,2; Q has cx,cy,x,y at 1,2,3,4; C has 1-6
            for (let i = 1; i < cmd.length; i += 2) {
              if (typeof cmd[i] === 'number' && typeof cmd[i + 1] === 'number') {
                const point = { x: cmd[i] as number, y: cmd[i + 1] as number };

                let snappedPoint: { x: number; y: number };
                if (mode === 'free-form') {
                  // Free-form: snap to grid corners at current granularity
                  const gridSizeIn =
                    gridSettings.size *
                    (gridSettings.granularity === 'half'
                      ? 0.5
                      : gridSettings.granularity === 'quarter'
                        ? 0.25
                        : 1);
                  snappedPoint = snapToGridCorner(point, gridSizeIn, zoom);
                } else {
                  // Layout/Template: use existing snap logic
                  snappedPoint = {
                    x: maybeSnap(point.x, gridSettings, unitSystem),
                    y: maybeSnap(point.y, gridSettings, unitSystem),
                  };
                }

                cmd[i] = snappedPoint.x;
                cmd[i + 1] = snappedPoint.y;
              }
            }
          }
          e.path.setCoords();
        }

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
