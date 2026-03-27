'use client';

import { useEffect } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useProjectStore } from '@/stores/projectStore';

export function useCurveEdit() {
  const fabricCanvas = useCanvasStore((s) => s.fabricCanvas);
  const activeTool = useCanvasStore((s) => s.activeTool);

  useEffect(() => {
    if (!fabricCanvas || activeTool !== 'select') return;

    let cleanup: (() => void) | null = null;

    (async () => {
      const fabric = await import('fabric');
      const canvas = fabricCanvas as InstanceType<typeof fabric.Canvas>;

      let editingPath: InstanceType<typeof fabric.Path> | null = null;
      const controlVisuals: InstanceType<typeof fabric.FabricObject>[] = [];
      let dragIndex = -1;
      let dragType: 'anchor' | 'cp' | null = null;

      interface ParsedPoint {
        x: number;
        y: number;
        command: string;
      }

      function getPathPoints(path: InstanceType<typeof fabric.Path>): ParsedPoint[] {
        const points: ParsedPoint[] = [];
        const pathData = path.path;
        if (!Array.isArray(pathData)) return points;

        for (const seg of pathData) {
          const cmd = seg[0] as string;
          if (cmd === 'M' || cmd === 'L') {
            points.push({ x: seg[1] as number, y: seg[2] as number, command: cmd });
          } else if (cmd === 'C') {
            // C cp1x cp1y cp2x cp2y x y
            points.push({ x: seg[5] as number, y: seg[6] as number, command: cmd });
          } else if (cmd === 'Q') {
            points.push({ x: seg[3] as number, y: seg[4] as number, command: cmd });
          }
        }
        return points;
      }

      function clearEditVisuals() {
        controlVisuals.forEach((v) => canvas.remove(v));
        controlVisuals.length = 0;
      }

      function drawEditVisuals(path: InstanceType<typeof fabric.Path>) {
        clearEditVisuals();
        const points = getPathPoints(path);
        const matrix = path.calcTransformMatrix();

        for (const pt of points) {
          const transformed = fabric.util.transformPoint(new fabric.Point(pt.x, pt.y), matrix);
          const dot = new fabric.Circle({
            left: transformed.x - 5,
            top: transformed.y - 5,
            radius: 5,
            fill: '#fff',
            stroke: '#D4883C',
            strokeWidth: 2,
            selectable: false,
            evented: false,
          });
          canvas.add(dot);
          controlVisuals.push(dot);
        }
        canvas.renderAll();
      }

      function exitEditMode() {
        clearEditVisuals();
        if (editingPath) {
          editingPath.set({ selectable: true, evented: true });
          editingPath.setCoords();
        }
        editingPath = null;
        canvas.renderAll();
      }

      function onDoubleClick(e: { target?: unknown }) {
        // fabric is always defined here
        const target = e.target as InstanceType<typeof fabric.Path> | undefined;

        if (editingPath) {
          exitEditMode();
          const json = JSON.stringify(canvas.toJSON());
          useCanvasStore.getState().pushUndoState(json);
          useProjectStore.getState().setDirty(true);
        }

        if (target && target.type === 'path') {
          editingPath = target;
          editingPath.set({ selectable: false, evented: false });
          drawEditVisuals(editingPath);
        }
      }

      function onMouseDown(e: { e: MouseEvent }) {
        if (!editingPath) return;
        const pointer = canvas.getScenePoint(e.e);
        const points = getPathPoints(editingPath);
        const matrix = editingPath.calcTransformMatrix();

        for (let i = 0; i < points.length; i++) {
          const transformed = fabric.util.transformPoint(
            new fabric.Point(points[i].x, points[i].y),
            matrix
          );
          const dist = Math.sqrt(
            (pointer.x - transformed.x) ** 2 + (pointer.y - transformed.y) ** 2
          );
          if (dist < 10) {
            dragIndex = i;
            dragType = 'anchor';
            return;
          }
        }
      }

      function onMouseMove(e: { e: MouseEvent }) {
        if (dragIndex < 0 || !editingPath || dragType !== 'anchor') return;
        const pointer = canvas.getScenePoint(e.e);
        const invMatrix = fabric.util.invertTransform(editingPath.calcTransformMatrix());
        const local = fabric.util.transformPoint(new fabric.Point(pointer.x, pointer.y), invMatrix);

        const pathData = editingPath.path;
        if (!Array.isArray(pathData)) return;

        let pointIdx = 0;
        for (const seg of pathData) {
          const cmd = seg[0] as string;
          if (cmd === 'M' || cmd === 'L') {
            if (pointIdx === dragIndex) {
              seg[1] = local.x;
              seg[2] = local.y;
              break;
            }
            pointIdx++;
          } else if (cmd === 'C') {
            if (pointIdx === dragIndex) {
              seg[5] = local.x;
              seg[6] = local.y;
              break;
            }
            pointIdx++;
          } else if (cmd === 'Q') {
            if (pointIdx === dragIndex) {
              seg[3] = local.x;
              seg[4] = local.y;
              break;
            }
            pointIdx++;
          }
        }

        editingPath.setBoundingBox(true);
        editingPath.setCoords();
        drawEditVisuals(editingPath);
        canvas.renderAll();
      }

      function onMouseUp() {
        if (dragIndex >= 0) {
          dragIndex = -1;
          dragType = null;
        }
      }

      function onSelectionCleared() {
        if (editingPath) {
          exitEditMode();
        }
      }

      canvas.on('mouse:dblclick', onDoubleClick as never);
      canvas.on('mouse:down', onMouseDown as never);
      canvas.on('mouse:move', onMouseMove as never);
      canvas.on('mouse:up', onMouseUp as never);
      canvas.on('selection:cleared', onSelectionCleared);

      cleanup = () => {
        canvas.off('mouse:dblclick', onDoubleClick as never);
        canvas.off('mouse:down', onMouseDown as never);
        canvas.off('mouse:move', onMouseMove as never);
        canvas.off('mouse:up', onMouseUp as never);
        canvas.off('selection:cleared', onSelectionCleared);
        exitEditMode();
      };
    })();

    return () => {
      cleanup?.();
    };
  }, [fabricCanvas, activeTool]);
}
