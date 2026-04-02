'use client';

import { useEffect, useRef } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useProjectStore } from '@/stores/projectStore';
import { maybeSnap } from '@/lib/canvas-utils';

export function useFreeDrawTool() {
  const fabricCanvas = useCanvasStore((s) => s.fabricCanvas);
  const activeTool = useCanvasStore((s) => s.activeTool);
  const freeDrawSmooth = useCanvasStore((s) => s.freeDrawSmooth);
  
  const stateRef = useRef({
    fillColor: '#D4883C',
    strokeColor: '#2D2D2D',
    strokeWidth: 1,
    gridSettings: { enabled: true, size: 1, snapToGrid: true },
    unitSystem: 'imperial' as 'imperial' | 'metric',
    isSpacePressed: false,
    freeDrawSmooth: false,
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
        freeDrawSmooth: state.freeDrawSmooth,
      };
    });
  }, []);

  useEffect(() => {
    if (!fabricCanvas || activeTool !== 'freedraw') return;

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

      function simplifyPath(points: { x: number; y: number }[], tolerance = 2): { x: number; y: number }[] {
        if (points.length < 3) return points;
        
        const sqTolerance = tolerance * tolerance;
        
        function getSqDist(p1: { x: number; y: number }, p2: { x: number; y: number }) {
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          return dx * dx + dy * dy;
        }
        
        function simplifyDouglasPeucker(points: { x: number; y: number }[], sqTolerance: number): { x: number; y: number }[] {
          const len = points.length;
          if (len <= 2) return points;
          
          let maxSqDist = sqTolerance;
          let index = 0;
          
          const first = points[0];
          const last = points[len - 1];
          
          for (let i = 1; i < len - 1; i++) {
            const sqDist = getSqSegDist(points[i], first, last);
            if (sqDist > maxSqDist) {
              index = i;
              maxSqDist = sqDist;
            }
          }
          
          if (maxSqDist > sqTolerance) {
            const left = simplifyDouglasPeucker(points.slice(0, index + 1), sqTolerance);
            const right = simplifyDouglasPeucker(points.slice(index), sqTolerance);
            return left.slice(0, -1).concat(right);
          }
          
          return [first, last];
        }
        
        function getSqSegDist(p: { x: number; y: number }, p1: { x: number; y: number }, p2: { x: number; y: number }) {
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
        
        return simplifyDouglasPeucker(points, sqTolerance);
      }

      function snapPointsToGrid(points: { x: number; y: number }[]): { x: number; y: number }[] {
        const s = stateRef.current;
        if (!s.gridSettings.snapToGrid) return points;
        
        return points.map(p => ({
          x: maybeSnap(p.x, s.gridSettings, s.unitSystem),
          y: maybeSnap(p.y, s.gridSettings, s.unitSystem),
        }));
      }

      function pointsToPathData(points: { x: number; y: number }[], smooth: boolean): string {
        if (points.length === 0) return '';
        if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
        
        if (!smooth) {
          // Straight lines
          let path = `M ${points[0].x} ${points[0].y}`;
          for (let i = 1; i < points.length; i++) {
            path += ` L ${points[i].x} ${points[i].y}`;
          }
          return path;
        }
        
        // Smooth curves using quadratic bezier
        let path = `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length - 1; i++) {
          const xc = (points[i].x + points[i + 1].x) / 2;
          const yc = (points[i].y + points[i + 1].y) / 2;
          path += ` Q ${points[i].x} ${points[i].y} ${xc} ${yc}`;
        }
        path += ` L ${points[points.length - 1].x} ${points[points.length - 1].y}`;
        return path;
      }

      function onMouseDown(e: { e: MouseEvent }) {
        if (stateRef.current.isSpacePressed) return;
        if (!fabric || !canvas) return;

        const pointer = canvas.getScenePoint(e.e);
        isDrawing = true;
        rawPoints = [{ x: pointer.x, y: pointer.y }];
        
        const pathData = `M ${pointer.x} ${pointer.y}`;
        previewPath = new fabric.Path(pathData, {
          stroke: '#00FF00',
          strokeWidth: 3,
          fill: undefined,
          strokeDashArray: [3, 3],
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
        
        // Update preview with raw points
        const pathData = pointsToPathData(rawPoints, false);
        previewPath.set({ path: pathData as any });
        canvas.renderAll();
      }

      function onMouseUp() {
        if (!fabric || !canvas || !isDrawing) return;
        isDrawing = false;

        if (rawPoints.length < 2) {
          if (previewPath) canvas.remove(previewPath);
          previewPath = null;
          rawPoints = [];
          canvas.renderAll();
          return;
        }

        // Simplify and snap to grid
        const simplified = simplifyPath(rawPoints, 3);
        const snapped = snapPointsToGrid(simplified);
        
        // Create final path
        const { strokeColor, strokeWidth, fillColor, freeDrawSmooth } = stateRef.current;
        const pathData = pointsToPathData(snapped, freeDrawSmooth);
        
        if (previewPath) canvas.remove(previewPath);
        
        const finalPath = new fabric.Path(pathData, {
          stroke: strokeColor,
          strokeWidth,
          fill: undefined,
          selectable: true,
          evented: true,
        });
        
        canvas.add(finalPath);
        
        const json = JSON.stringify(canvas.toJSON());
        useCanvasStore.getState().pushUndoState(json);
        useProjectStore.getState().setDirty(true);

        previewPath = null;
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
  }, [fabricCanvas, activeTool, freeDrawSmooth]);
}
