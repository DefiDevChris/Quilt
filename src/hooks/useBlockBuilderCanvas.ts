'use client';

import { useEffect, useRef } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useProjectStore } from '@/stores/projectStore';
import { maybeSnap } from '@/lib/canvas-utils';

export function useBlockBuilderCanvas() {
  const fabricCanvas = useCanvasStore((s) => s.fabricCanvas);
  const activeTool = useCanvasStore((s) => s.activeTool);
  const blockBuilderMode = useCanvasStore((s) => s.blockBuilderMode);

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
      let previewDot: InstanceType<typeof fabric.Circle> | null = null;

      function snapToGrid(points: { x: number; y: number }[]): { x: number; y: number }[] {
        const s = stateRef.current;
        if (!s.gridSettings.snapToGrid) return points;

        return points.map((p) => ({
          x: maybeSnap(p.x, s.gridSettings, s.unitSystem),
          y: maybeSnap(p.y, s.gridSettings, s.unitSystem),
        }));
      }

      function simplifyPath(
        points: { x: number; y: number }[],
        tolerance = 4
      ): { x: number; y: number }[] {
        if (points.length < 3) return points;

        const sqTolerance = tolerance * tolerance;

        function getSqSegDist(
          p: { x: number; y: number },
          p1: { x: number; y: number },
          p2: { x: number; y: number }
        ) {
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

      function pointsToClosedPathData(
        points: { x: number; y: number }[],
        smooth: boolean
      ): string {
        if (points.length < 2) return '';
        if (points.length === 2) {
          return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y} Z`;
        }

        if (!smooth) {
          let path = `M ${points[0].x} ${points[0].y}`;
          for (let i = 1; i < points.length; i++) {
            path += ` L ${points[i].x} ${points[i].y}`;
          }
          path += ' Z';
          return path;
        }

        // Smooth curves using quadratic bezier with closure
        let path = `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
          const curr = points[i];
          const next = points[(i + 1) % points.length];
          const xc = (curr.x + next.x) / 2;
          const yc = (curr.y + next.y) / 2;
          path += ` Q ${curr.x} ${curr.y} ${xc} ${yc}`;
        }
        path += ' Z';
        return path;
      }

      function onMouseDown(e: { e: MouseEvent }) {
        if (stateRef.current.isSpacePressed) return;
        if (!fabric || !canvas) return;

        const pointer = canvas.getScenePoint(e.e);
        isDrawing = true;
        rawPoints = [{ x: pointer.x, y: pointer.y }];

        // Show start dot
        const snapped = snapToGrid([{ x: pointer.x, y: pointer.y }])[0];
        previewDot = new fabric.Circle({
          left: snapped.x - 4,
          top: snapped.y - 4,
          radius: 4,
          fill: '#8d4f00',
          selectable: false,
          evented: false,
        });
        canvas.add(previewDot);

        const pathData = `M ${pointer.x} ${pointer.y}`;
        previewPath = new fabric.Path(pathData, {
          stroke: '#00FF00',
          strokeWidth: 2,
          fill: undefined,
          strokeDashArray: [4, 4],
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

        const simplified = simplifyPath(rawPoints, 6);
        const snapped = snapToGrid(simplified);
        const smooth = stateRef.current.blockBuilderMode === 'smooth';

        // Build open path for preview (not closed yet)
        let pathData = '';
        if (snapped.length > 0) {
          if (snapped.length === 1) {
            pathData = `M ${snapped[0].x} ${snapped[0].y}`;
          } else if (!smooth) {
            pathData = `M ${snapped[0].x} ${snapped[0].y}`;
            for (let i = 1; i < snapped.length; i++) {
              pathData += ` L ${snapped[i].x} ${snapped[i].y}`;
            }
          } else {
            pathData = `M ${snapped[0].x} ${snapped[0].y}`;
            for (let i = 1; i < snapped.length; i++) {
              if (i < snapped.length - 1) {
                const xc = (snapped[i].x + snapped[i + 1].x) / 2;
                const yc = (snapped[i].y + snapped[i + 1].y) / 2;
                pathData += ` Q ${snapped[i].x} ${snapped[i].y} ${xc} ${yc}`;
              } else {
                pathData += ` L ${snapped[i].x} ${snapped[i].y}`;
              }
            }
          }
        }

        previewPath.set({ path: pathData });
        canvas.renderAll();
      }

      function onMouseUp() {
        if (!fabric || !canvas || !isDrawing) return;
        isDrawing = false;

        // Remove preview elements
        if (previewPath) {
          canvas.remove(previewPath);
          previewPath = null;
        }
        if (previewDot) {
          canvas.remove(previewDot);
          previewDot = null;
        }

        if (rawPoints.length < 2) {
          rawPoints = [];
          canvas.renderAll();
          return;
        }

        // Simplify, snap, and close the path
        const simplified = simplifyPath(rawPoints, 4);
        const snapped = snapToGrid(simplified);
        const smooth = stateRef.current.blockBuilderMode === 'smooth';
        const { strokeColor, strokeWidth, fillColor } = stateRef.current;

        const pathData = pointsToClosedPathData(snapped, smooth);

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
        if (previewDot) canvas.remove(previewDot);
      };
    })();

    return () => {
      isMounted = false;
      cleanup?.();
    };
  }, [fabricCanvas, activeTool]);
}
