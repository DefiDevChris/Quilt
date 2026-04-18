'use client';

import { useEffect, useRef } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useCanvasContext } from '@/contexts/CanvasContext';
import { useProjectStore } from '@/stores/projectStore';
import { cursorForTool } from '@/lib/canvas-utils';
import { snapToGridCorner } from '@/lib/snap-utils';
import { createSegment, segmentToSvgPath } from '@/lib/easydraw-engine';
import type { Point } from '@/lib/easydraw-engine';
import type { CanvasGridSettings } from '@/types/grid';
import { CANVAS, COLORS } from '@/lib/design-system';

/**
 * EasyDraw Tool Hook — Click-click segment drawing.
 *
 * Phase 8: Simplified EasyDraw (no bezier handles).
 * - Click 1: set start point (snapped to grid corner)
 * - Click 2: set end point (snapped to grid corner), creates straight segment
 * - Escape: cancel mid-draw
 * - Right-click: cancel mid-draw
 *
 * Consecutive segments can optionally snap their start to the previous
 * segment's end (default on).
 */

interface DrawState {
  startPoint: Point | null;
  previewLine: unknown | null;
  snapIndicator: unknown | null;
}

export function useEasyDraw() {
  const { getCanvas } = useCanvasContext();
  const fabricCanvas = getCanvas();
  const activeTool = useCanvasStore((s) => s.activeTool);
  const mode = useProjectStore((s) => s.mode);

  const stateRef = useRef<{
    strokeColor: string;
    strokeWidth: number;
    gridSettings: CanvasGridSettings;
    snapToPrevious: boolean;
    zoom: number;
  }>({
    strokeColor: CANVAS.seamLine,
    strokeWidth: 2,
    gridSettings: { enabled: true, size: 1, snapToGrid: true, granularity: 'inch' },
    snapToPrevious: true,
    zoom: 1,
  });

  // Keep state in sync with store
  useEffect(() => {
    return useCanvasStore.subscribe((state) => {
      stateRef.current = {
        strokeColor: state.strokeColor,
        strokeWidth: Math.max(1, state.strokeWidth),
        gridSettings: state.gridSettings,
        snapToPrevious: stateRef.current.snapToPrevious, // preserved from init
        zoom: state.zoom,
      };
    });
  }, []);

  // Main effect for EasyDraw tool
  useEffect(() => {
    if (!fabricCanvas || activeTool !== 'easydraw') return;

    // Only active in free-form mode
    if (mode !== 'free-form') return;

    let isMounted = true;
    let cleanup: (() => void) | null = null;

    (async () => {
      const fabric = await import('fabric');
      if (!isMounted) return;
      const canvas = fabricCanvas as InstanceType<typeof fabric.Canvas>;

      const previousSelection = canvas.selection;
      const previousCursor = canvas.defaultCursor;
      canvas.selection = false;
      canvas.defaultCursor = cursorForTool('easydraw');

      const drawState: DrawState = {
        startPoint: null,
        previewLine: null,
        snapIndicator: null,
      };

      function getGridSizeIn(): number {
        const { gridSettings } = stateRef.current;
        const multiplier =
          gridSettings.granularity === 'half'
            ? 0.5
            : gridSettings.granularity === 'quarter'
              ? 0.25
              : 1;
        return gridSettings.size * multiplier;
      }

      function snapPoint(point: Point): Point {
        const { gridSettings, zoom } = stateRef.current;
        if (!gridSettings.snapToGrid) return point;
        const gridSizeIn = getGridSizeIn();
        return snapToGridCorner(point, gridSizeIn, zoom);
      }

      function createPreviewLine(start: Point, end: Point) {
        const { strokeColor, strokeWidth, zoom } = stateRef.current;
        const scaledWidth = strokeWidth / zoom;

        const line = new fabric.Line([start.x, start.y, end.x, end.y], {
          stroke: strokeColor,
          strokeWidth: scaledWidth,
          selectable: false,
          evented: false,
          strokeDashArray: [6 / zoom, 4 / zoom],
        });

        return line;
      }

      function createSnapIndicator(point: Point) {
        const { zoom } = stateRef.current;
        const radius = 4 / zoom;

        const circle = new fabric.Circle({
          left: point.x - radius,
          top: point.y - radius,
          radius,
          fill: COLORS.primary,
          stroke: COLORS.surface,
          strokeWidth: 1 / zoom,
          selectable: false,
          evented: false,
        });

        return circle;
      }

      function clearPreview() {
        if (drawState.previewLine) {
          canvas.remove(drawState.previewLine as InstanceType<typeof fabric.FabricObject>);
          drawState.previewLine = null;
        }
        if (drawState.snapIndicator) {
          canvas.remove(drawState.snapIndicator as InstanceType<typeof fabric.FabricObject>);
          drawState.snapIndicator = null;
        }
      }

      function commitSegment(start: Point, end: Point) {
        const { strokeColor, strokeWidth, zoom } = stateRef.current;
        const segment = createSegment(start, end);
        const pathData = segmentToSvgPath(segment);
        const scaledWidth = strokeWidth / zoom;

        const path = new fabric.Path(pathData, {
          stroke: strokeColor,
          strokeWidth: scaledWidth,
          fill: '',
          selectable: true,
          evented: true,
          objectCaching: false,
        });

        // Tag the object for selection detection
        (path as unknown as { __easyDrawSegment?: boolean }).__easyDrawSegment = true;
        (path as unknown as { __segmentData?: typeof segment }).__segmentData = segment;

        canvas.add(path);
        canvas.setActiveObject(path);
        canvas.renderAll();

        // Push to undo stack
        const json = JSON.stringify(canvas.toJSON());
        useCanvasStore.getState().pushUndoState(json);
        useProjectStore.getState().setDirty(true);

        return path;
      }

      function onMouseDown(e: { e: MouseEvent; target?: unknown }) {
        // Right-click cancels
        if (e.e.button === 2) {
          clearPreview();
          drawState.startPoint = null;
          canvas.defaultCursor = cursorForTool('easydraw');
          return;
        }

        const pointer = canvas.getScenePoint(e.e);
        const snappedPoint = snapPoint({ x: pointer.x, y: pointer.y });

        if (!drawState.startPoint) {
          // First click - set start point
          drawState.startPoint = snappedPoint;

          // Show snap indicator
          const indicator = createSnapIndicator(snappedPoint);
          drawState.snapIndicator = indicator;
          canvas.add(indicator as unknown as InstanceType<typeof fabric.FabricObject>);
          canvas.renderAll();
        } else {
          // Second click - complete segment
          const endPoint = snappedPoint;

          clearPreview();
          commitSegment(drawState.startPoint, endPoint);

          // For consecutive drawing, optionally start new segment from this point
          if (stateRef.current.snapToPrevious) {
            drawState.startPoint = endPoint;
            const indicator = createSnapIndicator(endPoint);
            drawState.snapIndicator = indicator;
            canvas.add(indicator as unknown as InstanceType<typeof fabric.FabricObject>);
          } else {
            drawState.startPoint = null;
          }

          canvas.renderAll();
        }
      }

      function onMouseMove(e: { e: MouseEvent }) {
        if (!drawState.startPoint) return;

        const pointer = canvas.getScenePoint(e.e);
        const snappedPoint = snapPoint({ x: pointer.x, y: pointer.y });

        // Update preview line
        clearPreview();
        const preview = createPreviewLine(drawState.startPoint, snappedPoint);
        drawState.previewLine = preview;
        canvas.add(preview as unknown as InstanceType<typeof fabric.FabricObject>);

        // Restore snap indicator
        if (drawState.startPoint) {
          const indicator = createSnapIndicator(drawState.startPoint);
          drawState.snapIndicator = indicator;
          canvas.add(indicator as unknown as InstanceType<typeof fabric.FabricObject>);
        }

        canvas.renderAll();
      }

      function onKeyDown(e: KeyboardEvent) {
        if (e.key === 'Escape') {
          clearPreview();
          drawState.startPoint = null;
          canvas.defaultCursor = cursorForTool('easydraw');
          canvas.renderAll();
        }
      }

      function onContextMenu(e: MouseEvent) {
        // Prevent context menu and treat as cancel
        e.preventDefault();
        clearPreview();
        drawState.startPoint = null;
        canvas.defaultCursor = cursorForTool('easydraw');
        canvas.renderAll();
      }

      // Attach events
      canvas.on('mouse:down', onMouseDown as never);
      canvas.on('mouse:move', onMouseMove as never);
      window.addEventListener('keydown', onKeyDown);
      canvas.wrapperEl?.addEventListener('contextmenu', onContextMenu);

      cleanup = () => {
        canvas.off('mouse:down', onMouseDown as never);
        canvas.off('mouse:move', onMouseMove as never);
        window.removeEventListener('keydown', onKeyDown);
        canvas.wrapperEl?.removeEventListener('contextmenu', onContextMenu);
        clearPreview();
        canvas.selection = previousSelection;
        canvas.defaultCursor = previousCursor;
      };
    })();

    return () => {
      isMounted = false;
      cleanup?.();
    };
  }, [fabricCanvas, activeTool, mode]);
}
