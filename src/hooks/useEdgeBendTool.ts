'use client';

import { useEffect, useRef } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useProjectStore } from '@/stores/projectStore';

interface EdgeHit {
  target: unknown;
  edgeIndex: number;
  p0: { x: number; y: number };
  p2: { x: number; y: number };
  isClosed: boolean;
}

interface AdjacentEdge {
  target: unknown;
  edgeIndex: number;
  p0: { x: number; y: number };
  p2: { x: number; y: number };
  isClosed: boolean;
  isReversed: boolean;
}

export function useEdgeBendTool() {
  const fabricCanvas = useCanvasStore((s) => s.fabricCanvas);
  const activeTool = useCanvasStore((s) => s.activeTool);
  const stateRef = useRef({ isSpacePressed: false });

  useEffect(() => {
    return useCanvasStore.subscribe((state) => {
      stateRef.current.isSpacePressed = state.isSpacePressed;
    });
  }, []);

  useEffect(() => {
    if (!fabricCanvas || activeTool !== 'bend') return;

    let isMounted = true;
    let cleanup: (() => void) | null = null;

    (async () => {
      const fabric = await import('fabric');
      if (!isMounted) return;
      const canvas = fabricCanvas as InstanceType<typeof fabric.Canvas>;

      canvas.selection = false;
      canvas.defaultCursor = 'pointer';
      // Use custom bend cursor
      const canvasEl = canvas.getElement();
      if (canvasEl) {
        canvasEl.style.cursor = 'url(/cursors/bend.cur) 10 10, pointer';
      }
      canvas.discardActiveObject();
      canvas.renderAll();

      let activeEdge: EdgeHit | null = null;
      let adjacentEdges: AdjacentEdge[] = [];
      let convertedTargets = new Map<unknown, InstanceType<typeof fabric.Path>>();

      const EDGE_HIT_THRESHOLD = 10;
      const COORDINATE_EPSILON = 2;

      // ── Helpers ──────────────────────────────────────────────────

      function distToSegment(
        p: { x: number; y: number },
        v: { x: number; y: number },
        w: { x: number; y: number }
      ): number {
        const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
        if (l2 === 0) return Math.sqrt((p.x - v.x) ** 2 + (p.y - v.y) ** 2);
        let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        return Math.sqrt(
          (p.x - (v.x + t * (w.x - v.x))) ** 2 +
          (p.y - (v.y + t * (w.y - v.y))) ** 2
        );
      }

      function getVertices(
        obj: unknown
      ): { x: number; y: number }[] {
        const mat = (obj as InstanceType<typeof fabric.FabricObject>).calcTransformMatrix();
        const objType = (obj as InstanceType<typeof fabric.FabricObject>).type;

        if (objType === 'polygon') {
          const poly = obj as InstanceType<typeof fabric.Polygon>;
          return (poly.points || []).map((p) =>
            fabric.util.transformPoint(new fabric.Point(p.x, p.y), mat)
          );
        }

        // Path
        const path = obj as InstanceType<typeof fabric.Path>;
        const cmds = path.path;
        if (!Array.isArray(cmds)) return [];

        const verts: { x: number; y: number }[] = [];
        for (const cmd of cmds) {
          const type = cmd[0] as string;
          if (type === 'M' || type === 'L') {
            verts.push({ x: cmd[1] as number, y: cmd[2] as number });
          } else if (type === 'Q') {
            verts.push({ x: cmd[3] as number, y: cmd[4] as number });
          } else if (type === 'C') {
            verts.push({ x: cmd[5] as number, y: cmd[6] as number });
          }
        }
        return verts.map((p) =>
          fabric.util.transformPoint(new fabric.Point(p.x, p.y), mat)
        );
      }

      function findNearestEdge(
        obj: unknown,
        pointer: { x: number; y: number }
      ): { hit: EdgeHit; distance: number } | null {
        const verts = getVertices(obj);
        if (verts.length < 2) return null;

        let bestDist = Infinity;
        let bestEdge: EdgeHit | null = null;

        for (let i = 0; i < verts.length; i++) {
          const p0 = verts[i];
          const p1 = verts[(i + 1) % verts.length];
          const d = distToSegment(pointer, p0, p1);
          if (d < bestDist) {
            bestDist = d;
            bestEdge = {
              target: obj,
              edgeIndex: i,
              p0,
              p2: p1,
              isClosed: true,
            };
          }
        }

        if (bestEdge && bestDist <= EDGE_HIT_THRESHOLD) {
          return { hit: bestEdge, distance: bestDist };
        }
        return null;
      }

      function findAdjacentEdges(
        edge: EdgeHit,
        allObjects: unknown[]
      ): AdjacentEdge[] {
        const results: AdjacentEdge[] = [];
        for (const obj of allObjects) {
          if (obj === edge.target) continue;
          const verts = getVertices(obj);
          for (let i = 0; i < verts.length; i++) {
            const v0 = verts[i];
            const v1 = verts[(i + 1) % verts.length];

            const directMatch =
              Math.abs(v0.x - edge.p0.x) < COORDINATE_EPSILON &&
              Math.abs(v0.y - edge.p0.y) < COORDINATE_EPSILON &&
              Math.abs(v1.x - edge.p2.x) < COORDINATE_EPSILON &&
              Math.abs(v1.y - edge.p2.y) < COORDINATE_EPSILON;

            const reverseMatch =
              Math.abs(v0.x - edge.p2.x) < COORDINATE_EPSILON &&
              Math.abs(v0.y - edge.p2.y) < COORDINATE_EPSILON &&
              Math.abs(v1.x - edge.p0.x) < COORDINATE_EPSILON &&
              Math.abs(v1.y - edge.p0.y) < COORDINATE_EPSILON;

            if (directMatch) {
              results.push({
                target: obj,
                edgeIndex: i,
                p0: v0,
                p2: v1,
                isClosed: true,
                isReversed: false,
              });
            } else if (reverseMatch) {
              results.push({
                target: obj,
                edgeIndex: i,
                p0: v1,
                p2: v0,
                isClosed: true,
                isReversed: true,
              });
            }
          }
        }
        return results;
      }

      function ensurePath(
        obj: unknown
      ): InstanceType<typeof fabric.Path> {
        const objType = (obj as InstanceType<typeof fabric.FabricObject>).type;
        if (objType === 'path') {
          return obj as InstanceType<typeof fabric.Path>;
        }

        if (convertedTargets.has(obj)) {
          return convertedTargets.get(obj)!;
        }

        const poly = obj as InstanceType<typeof fabric.Polygon>;
        const pts = poly.points || [];
        if (pts.length < 3) return obj as InstanceType<typeof fabric.Path>;

        let d = `M ${pts[0].x} ${pts[0].y}`;
        for (let i = 1; i < pts.length; i++) {
          d += ` L ${pts[i].x} ${pts[i].y}`;
        }
        d += ' Z';

        const path = new fabric.Path(d, {
          fill: poly.fill,
          stroke: poly.stroke,
          strokeWidth: poly.strokeWidth,
          selectable: poly.selectable,
          evented: poly.evented,
          left: poly.left,
          top: poly.top,
          scaleX: poly.scaleX,
          scaleY: poly.scaleY,
          angle: poly.angle,
          flipX: poly.flipX,
          flipY: poly.flipY,
          opacity: poly.opacity,
        });

        canvas.remove(poly);
        canvas.add(path);
        convertedTargets.set(obj, path);
        return path;
      }

      function bendEdge(
        path: InstanceType<typeof fabric.Path>,
        edgeIndex: number,
        apexLocal: { x: number; y: number }
      ) {
        const pathData = path.path as unknown as Array<[string, ...number[]]>;
        if (!Array.isArray(pathData)) return;

        let p0x: number, p0y: number;
        const startCmd = pathData[edgeIndex];
        p0x = startCmd[1] as number;
        p0y = startCmd[2] as number;

        const nextIdx = (edgeIndex + 1) % pathData.length;
        const endCmd = pathData[nextIdx];
        const endType = endCmd[0];
        let p2x: number, p2y: number;

        if (endType === 'Z') {
          const firstCmd = pathData.find((c) => c[0] === 'M' || c[0] === 'm');
          p2x = firstCmd?.[1] as number;
          p2y = firstCmd?.[2] as number;
        } else {
          p2x = endCmd[1] as number;
          p2y = endCmd[2] as number;
        }

        const cpX = 2 * apexLocal.x - 0.5 * p0x - 0.5 * p2x;
        const cpY = 2 * apexLocal.y - 0.5 * p0y - 0.5 * p2y;

        const newPathData: [string, ...number[]][] = [...pathData];
        if (endType === 'Z') {
          newPathData[nextIdx] = ['Q', cpX, cpY, p2x, p2y];
          newPathData.push(['Z']);
        } else if (endType === 'M') {
          newPathData[nextIdx] = ['Q', cpX, cpY, p2x, p2y];
        } else {
          newPathData[nextIdx] = ['Q', cpX, cpY, p2x, p2y];
        }

        path.set({ path: newPathData as never });
        path.setCoords();
      }

      // ── Event handlers ───────────────────────────────────────────

      function onMouseDown(e: { e: MouseEvent }) {
        if (stateRef.current.isSpacePressed) return;

        const pointer = canvas.getScenePoint(e.e);
        const objects = canvas
          .getObjects()
          .filter(
            (o) =>
              (o.type === 'polygon' || o.type === 'path') &&
              o.selectable &&
              o.evented
          );

        let bestResult: { hit: EdgeHit; distance: number } | null = null;

        for (const obj of objects) {
          const result = findNearestEdge(obj, pointer);
          if (result && (!bestResult || result.distance < bestResult.distance)) {
            bestResult = result;
          }
        }

        if (bestResult) {
          activeEdge = bestResult.hit;
          adjacentEdges = findAdjacentEdges(activeEdge, objects);
          convertedTargets.clear();

          const primaryPath = ensurePath(activeEdge.target);
          activeEdge.target = primaryPath;

          for (const adj of adjacentEdges) {
            adj.target = ensurePath(adj.target);
          }
        }
      }

      function onMouseMove(e: { e: MouseEvent }) {
        if (!activeEdge) return;
        const pointer = canvas.getScenePoint(e.e);

        const primaryPath = activeEdge.target as InstanceType<typeof fabric.Path>;
        const invMat = fabric.util.invertTransform(primaryPath.calcTransformMatrix());
        const apexLocal = fabric.util.transformPoint(
          new fabric.Point(pointer.x, pointer.y),
          invMat
        );
        bendEdge(primaryPath, activeEdge.edgeIndex, apexLocal);

        for (const adj of adjacentEdges) {
          const adjPath = adj.target as InstanceType<typeof fabric.Path>;
          const adjInvMat = fabric.util.invertTransform(adjPath.calcTransformMatrix());
          const adjApexLocal = fabric.util.transformPoint(
            new fabric.Point(pointer.x, pointer.y),
            adjInvMat
          );
          bendEdge(adjPath, adj.edgeIndex, adjApexLocal);
        }

        canvas.renderAll();
      }

      function onMouseUp() {
        if (!activeEdge) return;

        activeEdge = null;
        adjacentEdges = [];
        convertedTargets.clear();

        const json = JSON.stringify(canvas.toJSON());
        useCanvasStore.getState().pushUndoState(json);
        useProjectStore.getState().setDirty(true);

        canvas.renderAll();
      }

      canvas.on('mouse:down', onMouseDown as never);
      canvas.on('mouse:move', onMouseMove as never);
      canvas.on('mouse:up', onMouseUp as never);

      cleanup = () => {
        canvas.off('mouse:down', onMouseDown as never);
        canvas.off('mouse:move', onMouseMove as never);
        canvas.off('mouse:up', onMouseUp as never);
        const el = canvas.getElement();
        if (el) el.style.cursor = '';
        activeEdge = null;
        adjacentEdges = [];
        convertedTargets.clear();
      };
    })().catch(() => {
      // Bend tool setup failed
    });

    return () => {
      isMounted = false;
      cleanup?.();
    };
  }, [fabricCanvas, activeTool]);
}
