'use client';

import { useEffect } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useProjectStore } from '@/stores/projectStore';

export function useEdgeBendTool() {
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

      type EdgeInfo = {
        target: InstanceType<typeof fabric.Polygon | typeof fabric.Path>;
        pointIndex: number;
        p1: { x: number; y: number };
        p2: { x: number; y: number };
        isPolygon: boolean;
        adjacentEdges?: EdgeInfo[];
      };

      let draggingInfo: EdgeInfo | null = null;

      function getDistanceToSegment(p: {x: number, y: number}, v: {x: number, y: number}, w: {x: number, y: number}) {
        const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
        if (l2 === 0) return Math.sqrt((p.x - v.x) ** 2 + (p.y - v.y) ** 2);
        let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        return Math.sqrt(
          (p.x - (v.x + t * (w.x - v.x))) ** 2 +
          (p.y - (v.y + t * (w.y - v.y))) ** 2
        );
      }

      function onMouseDown(e: { e: MouseEvent }) {
        const pointer = canvas.getScenePoint(e.e);
        const objects = canvas.getObjects().filter((obj) => obj.type === 'polygon' || obj.type === 'path');

        let minDistance = 10; // Threshold
        let bestMatch: typeof draggingInfo = null;

        for (const obj of objects) {
          const matrix = obj.calcTransformMatrix();

          if (obj.type === 'polygon') {
            const polygon = obj as InstanceType<typeof fabric.Polygon>;
            const points = polygon.points || [];
            for (let i = 0; i < points.length; i++) {
              const p1 = points[i];
              const p2 = points[(i + 1) % points.length];

              const p1Transformed = fabric.util.transformPoint(new fabric.Point(p1.x, p1.y), matrix);
              const p2Transformed = fabric.util.transformPoint(new fabric.Point(p2.x, p2.y), matrix);

              const dist = getDistanceToSegment(pointer, p1Transformed, p2Transformed);
              if (dist < minDistance) {
                minDistance = dist;
                bestMatch = {
                  target: polygon,
                  pointIndex: i,
                  p1: p1Transformed,
                  p2: p2Transformed,
                  isPolygon: true
                };
              }
            }
          } else if (obj.type === 'path') {
             const path = obj as InstanceType<typeof fabric.Path>;
             const pathData = path.path;
             if (!Array.isArray(pathData)) continue;

             // Extract actual points
             const parsedPoints: {x: number, y: number}[] = [];
             for (const seg of pathData) {
               const cmd = seg[0] as string;
               if (cmd === 'M' || cmd === 'L') {
                 parsedPoints.push({ x: seg[1] as number, y: seg[2] as number });
               } else if (cmd === 'Q') {
                 parsedPoints.push({ x: seg[3] as number, y: seg[4] as number });
               } else if (cmd === 'C') {
                 parsedPoints.push({ x: seg[5] as number, y: seg[6] as number });
               }
             }

             // We assume closed path for edge bending, matching the structure
             for (let i = 0; i < parsedPoints.length; i++) {
                const nextIdx = (i + 1) % parsedPoints.length;

                // If it's a straight line
                const p1 = parsedPoints[i];
                const p2 = parsedPoints[nextIdx];

                const p1Transformed = fabric.util.transformPoint(new fabric.Point(p1.x, p1.y), matrix);
                const p2Transformed = fabric.util.transformPoint(new fabric.Point(p2.x, p2.y), matrix);

                // Right now, only allow bending of straight line segments
                // We'll calculate distance as if it's a line
                const dist = getDistanceToSegment(pointer, p1Transformed, p2Transformed);
                if (dist < minDistance) {
                  // Make sure the segment in path is actually a line (M or L), otherwise skip or replace later
                  const nextCmd = pathData[nextIdx][0];
                  if (nextCmd === 'L' || nextCmd === 'M' || nextIdx === 0) {
                      minDistance = dist;
                      bestMatch = {
                        target: path,
                        pointIndex: i,
                        p1: p1Transformed,
                        p2: p2Transformed,
                        isPolygon: false
                      };
                  }
                }
             }
          }
        }

        if (bestMatch) {
          // Find adjacent edges
          const adjacentEdges: typeof draggingInfo[] = [];
          for (const obj of objects) {
            if (obj === bestMatch.target) continue;

            const matrix = obj.calcTransformMatrix();
            if (obj.type === 'polygon') {
               const polygon = obj as InstanceType<typeof fabric.Polygon>;
               const points = polygon.points || [];
               for (let i = 0; i < points.length; i++) {
                 const p1 = points[i];
                 const p2 = points[(i + 1) % points.length];

                 const p1Transformed = fabric.util.transformPoint(new fabric.Point(p1.x, p1.y), matrix);
                 const p2Transformed = fabric.util.transformPoint(new fabric.Point(p2.x, p2.y), matrix);

                 // Check if it matches exactly or in reverse
                 const matchDirect = Math.abs(p1Transformed.x - bestMatch.p1.x) < 1 && Math.abs(p1Transformed.y - bestMatch.p1.y) < 1 &&
                                     Math.abs(p2Transformed.x - bestMatch.p2.x) < 1 && Math.abs(p2Transformed.y - bestMatch.p2.y) < 1;
                 const matchReverse = Math.abs(p1Transformed.x - bestMatch.p2.x) < 1 && Math.abs(p1Transformed.y - bestMatch.p2.y) < 1 &&
                                      Math.abs(p2Transformed.x - bestMatch.p1.x) < 1 && Math.abs(p2Transformed.y - bestMatch.p1.y) < 1;

                 if (matchDirect || matchReverse) {
                   adjacentEdges.push({
                     target: polygon,
                     pointIndex: i,
                     p1: p1Transformed,
                     p2: p2Transformed,
                     isPolygon: true
                   });
                 }
               }
            } else if (obj.type === 'path') {
               const path = obj as InstanceType<typeof fabric.Path>;
               const pathData = path.path;
               if (!Array.isArray(pathData)) continue;

               const parsedPoints: {x: number, y: number}[] = [];
               for (const seg of pathData) {
                 const cmd = seg[0] as string;
                 if (cmd === 'M' || cmd === 'L') {
                   parsedPoints.push({ x: seg[1] as number, y: seg[2] as number });
                 } else if (cmd === 'Q') {
                   parsedPoints.push({ x: seg[3] as number, y: seg[4] as number });
                 } else if (cmd === 'C') {
                   parsedPoints.push({ x: seg[5] as number, y: seg[6] as number });
                 }
               }

               for (let i = 0; i < parsedPoints.length; i++) {
                 const nextIdx = (i + 1) % parsedPoints.length;
                 const p1 = parsedPoints[i];
                 const p2 = parsedPoints[nextIdx];

                 const p1Transformed = fabric.util.transformPoint(new fabric.Point(p1.x, p1.y), matrix);
                 const p2Transformed = fabric.util.transformPoint(new fabric.Point(p2.x, p2.y), matrix);

                 const matchDirect = Math.abs(p1Transformed.x - bestMatch.p1.x) < 1 && Math.abs(p1Transformed.y - bestMatch.p1.y) < 1 &&
                                     Math.abs(p2Transformed.x - bestMatch.p2.x) < 1 && Math.abs(p2Transformed.y - bestMatch.p2.y) < 1;
                 const matchReverse = Math.abs(p1Transformed.x - bestMatch.p2.x) < 1 && Math.abs(p1Transformed.y - bestMatch.p2.y) < 1 &&
                                      Math.abs(p2Transformed.x - bestMatch.p1.x) < 1 && Math.abs(p2Transformed.y - bestMatch.p1.y) < 1;

                 if (matchDirect || matchReverse) {
                    const nextCmd = pathData[nextIdx][0];
                    if (nextCmd === 'L' || nextCmd === 'M' || nextIdx === 0) {
                      adjacentEdges.push({
                        target: path,
                        pointIndex: i,
                        p1: p1Transformed,
                        p2: p2Transformed,
                        isPolygon: false
                      });
                    }
                 }
               }
            }
          }

          draggingInfo = { ...bestMatch, adjacentEdges: adjacentEdges.filter((e): e is EdgeInfo => e !== null) };
        }
      }

      function convertPolygonToPath(polygon: InstanceType<typeof fabric.Polygon>): InstanceType<typeof fabric.Path> {
        const points = polygon.points || [];
        if (points.length === 0) return new fabric.Path('M 0 0');
        let pathData = `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
          pathData += ` L ${points[i].x} ${points[i].y}`;
        }
        pathData += ' Z';

        const path = new fabric.Path(pathData, {
           fill: polygon.fill,
           stroke: polygon.stroke,
           strokeWidth: polygon.strokeWidth,
           selectable: polygon.selectable,
           evented: polygon.evented,
           left: polygon.left,
           top: polygon.top,
           scaleX: polygon.scaleX,
           scaleY: polygon.scaleY,
           angle: polygon.angle,
           flipX: polygon.flipX,
           flipY: polygon.flipY,
        });
        return path;
      }

      function updatePathSegment(path: InstanceType<typeof fabric.Path>, pointIndex: number, cpX: number, cpY: number, endX: number, endY: number) {
         const pathData = [...(path.path || [])];
         const nextIdx = (pointIndex + 1) % pathData.length;

         // We convert the segment to a Q command
         // The pointIndex points to the START of the line, the NEXT command defines how we get to the END.
         // If nextIdx is 0, the path relies on 'Z' to close. We must explicitly add a command before Z.

         if (nextIdx === 0 && pathData[pathData.length - 1][0] === 'Z') {
             // It was a Z closing a path. Replace Z with Q to the first point, then add Z back.
             pathData[pathData.length - 1] = ['Q', cpX, cpY, endX, endY];
             pathData.push(['Z']);
         } else {
             // Regular segment
             pathData[nextIdx] = ['Q', cpX, cpY, endX, endY];
         }

         path.set({ path: pathData });
         path.setBoundingBox(true);
         path.setCoords();
      }

      function onMouseMove(e: { e: MouseEvent }) {
        if (!draggingInfo) return;
        const pointer = canvas.getScenePoint(e.e);

        const applyBend = (info: EdgeInfo, isPrimary: boolean) => {
            if (!info) return;
            let target = info.target;

            // Convert polygon to path if needed
            if (info.isPolygon) {
               const newPath = convertPolygonToPath(target as InstanceType<typeof fabric.Polygon>);
               canvas.remove(target);
               canvas.add(newPath);
               info.target = newPath;
               info.isPolygon = false;
               target = newPath;

               // Update parent dragging info reference if it was primary
               if (isPrimary) {
                  draggingInfo!.target = newPath;
                  draggingInfo!.isPolygon = false;
               }
            }

            const invMatrix = fabric.util.invertTransform(target.calcTransformMatrix());
            const localPointer = fabric.util.transformPoint(new fabric.Point(pointer.x, pointer.y), invMatrix);

            // To make a curve that passes THROUGH the pointer, we calculate the control point for a quadratic bezier.
            // P(t) = (1-t)^2 * P0 + 2t(1-t) * P1 + t^2 * P2
            // Let's assume t=0.5 (the middle of the curve).
            // P(0.5) = 0.25 * P0 + 0.5 * P1 + 0.25 * P2
            // We want P(0.5) = localPointer
            // localPointer = 0.25 * P0 + 0.5 * cp + 0.25 * P2
            // 0.5 * cp = localPointer - 0.25 * P0 - 0.25 * P2
            // cp = 2 * localPointer - 0.5 * P0 - 0.5 * P2

            const pathTarget = target as InstanceType<typeof fabric.Path>;
            const pathData = pathTarget.path;
            const p0x = (pathData[info.pointIndex][1] || pathData[info.pointIndex][3] || pathData[info.pointIndex][5]) as number;
            const p0y = (pathData[info.pointIndex][2] || pathData[info.pointIndex][4] || pathData[info.pointIndex][6]) as number;

            const nextIdx = (info.pointIndex + 1) % pathData.length;
            const cmd = pathData[nextIdx][0];
            let p2x: number, p2y: number;
            if (cmd === 'Z' || nextIdx === 0) {
               p2x = (pathData[0][1] || 0) as number;
               p2y = (pathData[0][2] || 0) as number;
            } else {
               p2x = (pathData[nextIdx][1] || pathData[nextIdx][3] || pathData[nextIdx][5]) as number;
               p2y = (pathData[nextIdx][2] || pathData[nextIdx][4] || pathData[nextIdx][6]) as number;
            }

            const cpX = 2 * localPointer.x - 0.5 * p0x - 0.5 * p2x;
            const cpY = 2 * localPointer.y - 0.5 * p0y - 0.5 * p2y;

            updatePathSegment(pathTarget, info.pointIndex, cpX, cpY, p2x, p2y);
        };

        applyBend(draggingInfo, true);

        if (draggingInfo.adjacentEdges) {
            for (const adj of draggingInfo.adjacentEdges) {
                applyBend(adj, false);
            }
        }

        canvas.renderAll();
      }

      function onMouseUp() {
        if (!draggingInfo) return;

        draggingInfo = null;

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
      };
    })();

    return () => {
      isMounted = false;
      cleanup?.();
    };
  }, [fabricCanvas, activeTool]);
}
