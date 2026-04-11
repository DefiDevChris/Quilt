'use client';

import { useEffect } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useProjectStore } from '@/stores/projectStore';

import type { TMat2D } from 'fabric';

type Pt = { x: number; y: number };

interface PolygonLike {
  type?: string;
  points: Pt[];
  pathOffset: Pt;
  calcTransformMatrix: () => TMat2D;
  set: (props: Record<string, unknown>) => void;
  setCoords: () => void;
  setBoundingBox?: (skipCornersCalc?: boolean) => void;
  _layoutElement?: boolean;
  _fenceElement?: boolean;
  _isBlockGroup?: boolean;
}

function distancePointToSegment(p: Pt, a: Pt, b: Pt): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const proj = { x: a.x + t * dx, y: a.y + t * dy };
  return Math.hypot(p.x - proj.x, p.y - proj.y);
}

/**
 * Bend — warp existing polygon shapes by dragging on an edge.
 *
 * Click and drag near the edge of any polygon on the quilt canvas. The
 * dragged segment is replaced with a quadratic Bezier curve approximation
 * (subdivided into vertices, since fabric.Polygon does not render true
 * curves), pulling the edge toward the cursor.
 *
 * Works on any fabric.Polygon that is not a layout/fence chrome element.
 */
export function useBendTool() {
  const fabricCanvas = useCanvasStore((s) => s.fabricCanvas);
  const activeTool = useCanvasStore((s) => s.activeTool);

  useEffect(() => {
    if (!fabricCanvas || activeTool !== 'bend') return;

    let isMounted = true;
    let cleanup: (() => void) | null = null;

    (async () => {
      const fabric = await import('fabric');
      if (!isMounted) return;
      const canvas = fabricCanvas as InstanceType<typeof fabric.Canvas>;

      const previousSelection = canvas.selection;
      const previousCursor = canvas.defaultCursor;
      canvas.selection = false;
      canvas.defaultCursor = 'crosshair';

      let activeBend: {
        target: PolygonLike;
        edgeIndex: number;
        originalPoints: Pt[];
      } | null = null;

      const HIT_THRESHOLD = 24;
      const SUBDIVISIONS = 12;

      function getCanvasPoints(poly: PolygonLike): Pt[] {
        const matrix = poly.calcTransformMatrix();
        return poly.points.map((p) => {
          const local = new fabric.Point(p.x - poly.pathOffset.x, p.y - poly.pathOffset.y);
          return local.transform(matrix);
        });
      }

      function findClosestEdge(
        scenePt: Pt
      ): { target: PolygonLike; edgeIndex: number; distance: number } | null {
        let best: { target: PolygonLike; edgeIndex: number; distance: number } | null = null;

        const objects = canvas.getObjects() as unknown as PolygonLike[];
        for (const obj of objects) {
          if (obj._layoutElement || obj._fenceElement || obj._isBlockGroup) continue;
          if (obj.type !== 'polygon' && obj.type !== 'Polygon') continue;
          if (!Array.isArray(obj.points) || obj.points.length < 2) continue;

          const points = getCanvasPoints(obj);
          for (let i = 0; i < points.length; i++) {
            const a = points[i];
            const b = points[(i + 1) % points.length];
            const d = distancePointToSegment(scenePt, a, b);
            if (best === null || d < best.distance) {
              best = { target: obj, edgeIndex: i, distance: d };
            }
          }
        }
        return best;
      }

      function onMouseDown(e: { e: MouseEvent }) {
        const pointer = canvas.getScenePoint(e.e);
        const closest = findClosestEdge(pointer);
        if (!closest || closest.distance > HIT_THRESHOLD) return;

        activeBend = {
          target: closest.target,
          edgeIndex: closest.edgeIndex,
          originalPoints: closest.target.points.map((p) => ({ x: p.x, y: p.y })),
        };
        canvas.defaultCursor = 'grabbing';
      }

      function onMouseMove(e: { e: MouseEvent }) {
        if (!activeBend) return;
        const pointer = canvas.getScenePoint(e.e);
        const target = activeBend.target;

        // Convert pointer from canvas coords into object-local coords so the
        // control point lives in the same space as target.points.
        const matrix = target.calcTransformMatrix();
        const inverse = fabric.util.invertTransform(matrix);
        const localPointer = new fabric.Point(pointer.x, pointer.y).transform(inverse);
        const C: Pt = {
          x: localPointer.x + target.pathOffset.x,
          y: localPointer.y + target.pathOffset.y,
        };

        const original = activeBend.originalPoints;
        const A = original[activeBend.edgeIndex];
        const B = original[(activeBend.edgeIndex + 1) % original.length];

        // Quadratic Bezier subdivision: P(t) = (1-t)^2*A + 2(1-t)t*C + t^2*B
        const curvePoints: Pt[] = [];
        for (let i = 1; i < SUBDIVISIONS; i++) {
          const t = i / SUBDIVISIONS;
          const u = 1 - t;
          curvePoints.push({
            x: u * u * A.x + 2 * u * t * C.x + t * t * B.x,
            y: u * u * A.y + 2 * u * t * C.y + t * t * B.y,
          });
        }

        // Insert subdivided curve points immediately after the bent edge's
        // start vertex. The end vertex remains unchanged so adjacent edges
        // are not disturbed.
        const newPoints: Pt[] = [];
        for (let i = 0; i < original.length; i++) {
          newPoints.push(original[i]);
          if (i === activeBend.edgeIndex) {
            newPoints.push(...curvePoints);
          }
        }

        target.set({ points: newPoints });
        target.setBoundingBox?.(true);
        target.setCoords();
        canvas.requestRenderAll();
      }

      function onMouseUp() {
        if (!activeBend) return;
        activeBend = null;
        canvas.defaultCursor = 'crosshair';

        const json = JSON.stringify(canvas.toJSON());
        useCanvasStore.getState().pushUndoState(json);
        useProjectStore.getState().setDirty(true);
      }

      canvas.on('mouse:down', onMouseDown as never);
      canvas.on('mouse:move', onMouseMove as never);
      canvas.on('mouse:up', onMouseUp as never);

      cleanup = () => {
        canvas.off('mouse:down', onMouseDown as never);
        canvas.off('mouse:move', onMouseMove as never);
        canvas.off('mouse:up', onMouseUp as never);
        canvas.selection = previousSelection;
        canvas.defaultCursor = previousCursor;
        activeBend = null;
      };
    })();

    return () => {
      isMounted = false;
      cleanup?.();
    };
  }, [fabricCanvas, activeTool]);
}
