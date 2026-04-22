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

        // Reject tiny strokes (accidental clicks / micro-movements) — they
        // otherwise collapse into a single grid-snapped dot and clutter the canvas.
        const rawBounds = e.path.getBoundingRect();
        const MIN_STROKE_PX = 6;
        if (rawBounds.width < MIN_STROKE_PX && rawBounds.height < MIN_STROKE_PX) {
          canvas.remove(e.path);
          canvas.renderAll();
          return;
        }

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
            if (typeof window !== 'undefined') {
              window.dispatchEvent(
                new CustomEvent('quiltstudio:fence-rejection', {
                  detail: { message: 'Strokes must be drawn inside a block cell in this mode.' },
                })
              );
            }
            canvas.renderAll();
            return;
          }
        }

        // GIMP-style "Smooth Stroke" post-processing for EasyDraw paths.
        // Strategy:
        //   1. Extract the sequence of anchor points from the raw path.
        //   2. Apply heavy iterative neighbour-averaging to smooth the curve
        //      (emulates GIMP's high-weight smooth-stroke lag).
        //   3. If the raw stroke was nearly linear, collapse to a straight line.
        //   4. Snap ONLY the first and last anchor points to the grid.
        //   5. Rebuild the path as a chain of quadratic Bezier curves.
        const { gridSettings, unitSystem } = stateRef.current;
        if (e.path.path) {
          const rawPath = e.path.path as Array<Array<string | number>>;
          const zoom = useCanvasStore.getState().zoom;

          // Extract anchor points (endpoints of each path command).
          const points: Array<{ x: number; y: number }> = [];
          for (const cmd of rawPath) {
            const last = cmd.length;
            const y = cmd[last - 1];
            const x = cmd[last - 2];
            if (typeof x === 'number' && typeof y === 'number') {
              points.push({ x, y });
            }
          }

          if (points.length >= 2) {
            // --- 1. Smoothing: iterative neighbour averaging (binomial filter)
            // Passes ≈ GIMP's weight/iteration count. 12 passes ≈ weight 300.
            const SMOOTH_PASSES = 12;
            let smoothed = points.slice();
            for (let pass = 0; pass < SMOOTH_PASSES; pass++) {
              const next: Array<{ x: number; y: number }> = new Array(smoothed.length);
              next[0] = smoothed[0];
              next[smoothed.length - 1] = smoothed[smoothed.length - 1];
              for (let i = 1; i < smoothed.length - 1; i++) {
                next[i] = {
                  x: (smoothed[i - 1].x + 2 * smoothed[i].x + smoothed[i + 1].x) / 4,
                  y: (smoothed[i - 1].y + 2 * smoothed[i].y + smoothed[i + 1].y) / 4,
                };
              }
              smoothed = next;
            }

            // --- 2. Linearity detection: collapse to a straight line when
            // the stroke's deviation from its start→end chord is small.
            const first = smoothed[0];
            const last = smoothed[smoothed.length - 1];
            const chordDx = last.x - first.x;
            const chordDy = last.y - first.y;
            const chordLen = Math.hypot(chordDx, chordDy);
            let isLine = false;
            if (chordLen > 1) {
              let maxDev = 0;
              for (let i = 1; i < smoothed.length - 1; i++) {
                const p = smoothed[i];
                // Perpendicular distance from point to chord first→last.
                const dev =
                  Math.abs(chordDy * p.x - chordDx * p.y + last.x * first.y - last.y * first.x) /
                  chordLen;
                if (dev > maxDev) maxDev = dev;
              }
              // Threshold: < 4px deviation (or < 3% of chord) counts as a line.
              if (maxDev < Math.max(4, chordLen * 0.03)) isLine = true;
            }

            // --- 3. Snap only the first and last anchor points to the grid.
            const snapToGrid = (pt: { x: number; y: number }) => {
              if (!gridSettings.snapToGrid) return pt;
              if (mode === 'free-form') {
                const gridSizeIn =
                  gridSettings.size *
                  (gridSettings.granularity === 'half'
                    ? 0.5
                    : gridSettings.granularity === 'quarter'
                      ? 0.25
                      : 1);
                return snapToGridCorner(pt, gridSizeIn, zoom);
              }
              return {
                x: maybeSnap(pt.x, gridSettings, unitSystem),
                y: maybeSnap(pt.y, gridSettings, unitSystem),
              };
            };
            const snappedStart = snapToGrid(smoothed[0]);
            const snappedEnd = snapToGrid(smoothed[smoothed.length - 1]);

            // --- 4. Rebuild the path.
            const newPath: Array<Array<string | number>> = [];
            if (isLine) {
              newPath.push(['M', snappedStart.x, snappedStart.y]);
              newPath.push(['L', snappedEnd.x, snappedEnd.y]);
            } else {
              // Anchor the endpoints; blend the smoothed interior by shifting
              // each point by a decaying fraction of the endpoint snap delta
              // so intermediate curvature stays intact.
              const dStart = { x: snappedStart.x - smoothed[0].x, y: snappedStart.y - smoothed[0].y };
              const dEnd = {
                x: snappedEnd.x - smoothed[smoothed.length - 1].x,
                y: snappedEnd.y - smoothed[smoothed.length - 1].y,
              };
              const n = smoothed.length - 1;
              const adjusted = smoothed.map((p, i) => {
                const t = n === 0 ? 0 : i / n;
                return {
                  x: p.x + dStart.x * (1 - t) + dEnd.x * t,
                  y: p.y + dStart.y * (1 - t) + dEnd.y * t,
                };
              });

              newPath.push(['M', adjusted[0].x, adjusted[0].y]);
              // Quadratic Bezier chain: control = point[i], end = midpoint(point[i], point[i+1]).
              for (let i = 1; i < adjusted.length - 1; i++) {
                const cx = adjusted[i].x;
                const cy = adjusted[i].y;
                const mx = (adjusted[i].x + adjusted[i + 1].x) / 2;
                const my = (adjusted[i].y + adjusted[i + 1].y) / 2;
                newPath.push(['Q', cx, cy, mx, my]);
              }
              const lastAdj = adjusted[adjusted.length - 1];
              newPath.push(['L', lastAdj.x, lastAdj.y]);
            }

            e.path.set({ path: newPath as unknown as import('fabric').Path['path'] });
            e.path.setCoords();
          }
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

      // --- Snap-target preview dots ---------------------------------------
      // During the drag, render two small dots at the grid corners the stroke
      // endpoints will snap to on release. Gives users a WYSIWYG signal since
      // the raw brush stroke visibly diverges from its final snapped endpoints.
      let startDot: InstanceType<typeof fabric.Circle> | null = null;
      let endDot: InstanceType<typeof fabric.Circle> | null = null;
      let isEasyDragging = false;

      function snapEndpoint(pt: { x: number; y: number }): { x: number; y: number } {
        const s = stateRef.current;
        if (!s.gridSettings.snapToGrid) return pt;
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

      function placeOrUpdateDot(
        existing: InstanceType<typeof fabric.Circle> | null,
        pt: { x: number; y: number }
      ): InstanceType<typeof fabric.Circle> {
        const z = Math.max(0.0001, useCanvasStore.getState().zoom);
        const r = 6 / z;
        if (existing) {
          existing.set({ left: pt.x - r, top: pt.y - r, radius: r, strokeWidth: 2 / z });
          existing.setCoords();
          return existing;
        }
        const dot = new fabric.Circle({
          left: pt.x - r,
          top: pt.y - r,
          radius: r,
          fill: CANVAS.pencilPreview,
          stroke: CANVAS.seamLine,
          strokeWidth: 2 / z,
          selectable: false,
          evented: false,
          excludeFromExport: true,
        });
        canvas.add(dot);
        return dot;
      }

      function clearSnapDots() {
        if (startDot) canvas.remove(startDot);
        if (endDot) canvas.remove(endDot);
        startDot = null;
        endDot = null;
        isEasyDragging = false;
      }

      function onMouseDown(ev: { e: MouseEvent }) {
        const pointer = canvas.getScenePoint(ev.e);
        const snapped = snapEndpoint(pointer);
        isEasyDragging = true;
        startDot = placeOrUpdateDot(startDot, snapped);
        endDot = placeOrUpdateDot(endDot, snapped);
        canvas.renderAll();
      }

      function onMouseMove(ev: { e: MouseEvent }) {
        if (!isEasyDragging) return;
        const pointer = canvas.getScenePoint(ev.e);
        const snapped = snapEndpoint(pointer);
        endDot = placeOrUpdateDot(endDot, snapped);
        canvas.renderAll();
      }

      function onMouseUp() {
        clearSnapDots();
        canvas.renderAll();
      }

      canvas.on('mouse:down', onMouseDown as never);
      canvas.on('mouse:move', onMouseMove as never);
      canvas.on('mouse:up', onMouseUp as never);
      canvas.on('path:created', onPathCreated as never);

      cleanup = () => {
        unsubscribeBrush();
        canvas.off('mouse:down', onMouseDown as never);
        canvas.off('mouse:move', onMouseMove as never);
        canvas.off('mouse:up', onMouseUp as never);
        canvas.off('path:created', onPathCreated as never);
        clearSnapDots();
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
