'use client';

import { useEffect, useRef } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useProjectStore } from '@/stores/projectStore';
import { maybeSnap } from '@/lib/canvas-utils';

export function useBlockBuilderCanvas() {
  const fabricCanvas = useCanvasStore((s) => s.fabricCanvas);
  const activeTool = useCanvasStore((s) => s.activeTool);
  const _blockBuilderMode = useCanvasStore((s) => s.blockBuilderMode);

  const stateRef = useRef({
    fillColor: '#D4883C',
    strokeColor: '#2D2D2D',
    strokeWidth: 1,
    gridSettings: { enabled: true, size: 1, snapToGrid: true },
    unitSystem: 'imperial' as 'imperial' | 'metric',
    isSpacePressed: false,
    blockBuilderMode: 'straight' as 'straight' | 'smooth',
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
        blockBuilderMode: state.blockBuilderMode,
      };
    });
  }, []);

  useEffect(() => {
    if (!fabricCanvas || activeTool !== 'blockbuilder') return;

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
      canvas.renderAll();

      let isDrawing = false;
      let rawPoints: { x: number; y: number }[] = [];
      let previewPath: InstanceType<typeof fabric.Path> | null = null;

      function snapToGrid(point: { x: number; y: number }): { x: number; y: number } {
        const s = stateRef.current;
        if (!s.gridSettings.snapToGrid) return point;

        return {
          x: maybeSnap(point.x, s.gridSettings, s.unitSystem),
          y: maybeSnap(point.y, s.gridSettings, s.unitSystem),
        };
      }

      function distance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        return Math.sqrt(dx * dx + dy * dy);
      }

      // Simplify path using Douglas-Peucker algorithm
      function simplifyPath(
        points: { x: number; y: number }[],
        tolerance: number
      ): { x: number; y: number }[] {
        if (points.length <= 2) return points;

        const sqTolerance = tolerance * tolerance;

        function getSqSegDist(
          p: { x: number; y: number },
          p1: { x: number; y: number },
          p2: { x: number; y: number }
        ): number {
          let x = p1.x;
          let y = p1.y;
          let dx = p2.x - x;
          let dy = p2.y - y;

          if (dx !== 0 || dy !== 0) {
            const t = ((p.x - x) * dx + (p.y - y) * dy) / (dx * dx + dy * dy);
            if (t > 1) {
              x = p2.x;
              y = p2.y;
            } else if (t > 0) {
              x += dx * t;
              y += dy * t;
            }
          }

          dx = p.x - x;
          dy = p.y - y;
          return dx * dx + dy * dy;
        }

        function douglasPeucker(
          pts: { x: number; y: number }[],
          sqTol: number
        ): { x: number; y: number }[] {
          const len = pts.length;
          if (len <= 2) return pts;

          let maxSqDist = sqTol;
          let index = 0;

          const first = pts[0];
          const last = pts[len - 1];

          for (let i = 1; i < len - 1; i++) {
            const sqDist = getSqSegDist(pts[i], first, last);
            if (sqDist > maxSqDist) {
              index = i;
              maxSqDist = sqDist;
            }
          }

          if (maxSqDist > sqTol) {
            const left = douglasPeucker(pts.slice(0, index + 1), sqTol);
            const right = douglasPeucker(pts.slice(index), sqTol);
            return left.slice(0, -1).concat(right);
          }

          return [first, last];
        }

        return douglasPeucker(points, sqTolerance);
      }

      function buildPathData(points: { x: number; y: number }[]): string {
        if (points.length === 0) return '';
        if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
        let path = `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
          path += ` L ${points[i].x} ${points[i].y}`;
        }
        return path;
      }

      function onMouseDown(e: { e: MouseEvent }) {
        if (stateRef.current.isSpacePressed) return;
        if (!fabric || !canvas) return;

        const pointer = canvas.getScenePoint(e.e);
        isDrawing = true;
        rawPoints = [{ x: pointer.x, y: pointer.y }];

        // Create initial preview path (pencil stroke)
        previewPath = new fabric.Path(`M ${pointer.x} ${pointer.y}`, {
          stroke: '#383831',
          strokeWidth: 2,
          fill: '',
          selectable: false,
          evented: false,
        });
        canvas.add(previewPath);
        canvas.renderAll();
      }

      function onMouseMove(e: { e: MouseEvent }) {
        if (!fabric || !canvas || !isDrawing || !previewPath) return;

        const pointer = canvas.getScenePoint(e.e);
        rawPoints.push({ x: pointer.x, y: pointer.y });

        // Draw continuous path following cursor (like MS Paint pencil)
        const pathData = buildPathData(rawPoints);
        previewPath.set({ path: pathData });
        canvas.renderAll();
      }

      function onMouseUp() {
        if (!fabric || !canvas || !isDrawing) return;
        isDrawing = false;

        if (rawPoints.length < 2) {
          if (previewPath) {
            canvas.remove(previewPath);
            previewPath = null;
          }
          rawPoints = [];
          canvas.renderAll();
          return;
        }

        // Remove the raw preview path
        if (previewPath) {
          canvas.remove(previewPath);
          previewPath = null;
        }

        // Simplify and snap to grid for clean straight lines
        const simplified = simplifyPath(rawPoints, 4);
        const snapped = simplified.map((p) => snapToGrid(p));

        // Build final path data
        const pathData = buildPathData(snapped);
        const { strokeColor, strokeWidth, fillColor } = stateRef.current;

        const finalPath = new fabric.Path(pathData, {
          stroke: strokeColor,
          strokeWidth,
          fill: fillColor + '80',
          selectable: true,
          evented: true,
        });

        canvas.add(finalPath);

        const json = JSON.stringify(canvas.toJSON());
        useCanvasStore.getState().pushUndoState(json);
        useProjectStore.getState().setDirty(true);

        rawPoints = [];
        canvas.renderAll();
      }

      canvas.on('mouse:down', onMouseDown as never);
      canvas.on('mouse:move', onMouseMove as never);
      canvas.on('mouse:up', onMouseUp as never);

      cleanup = () => {
        canvas.off('mouse:down', onMouseDown as never);
        canvas.off('mouse:move', onMouseMove as never);
        canvas.off('mouse:up', onMouseUp as never);
        if (previewPath) canvas.remove(previewPath);
      };
    })();

    return () => {
      isMounted = false;
      cleanup?.();
    };
  }, [fabricCanvas, activeTool]);
}
