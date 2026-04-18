'use client';

import { useEffect, useRef } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useCanvasContext } from '@/contexts/CanvasContext';
import { useProjectStore } from '@/stores/projectStore';
import { cursorForTool } from '@/lib/canvas-utils';
import { snapToGridCorner } from '@/lib/snap-utils';
import {
  createBentSegment,
  reBendSegment,
  segmentToSvgPath,
  closestPointOnSegment,
} from '@/lib/easydraw-engine';
import type { Point, Segment } from '@/lib/easydraw-engine';
import { CANVAS, COLORS } from '@/lib/design-system';
import type { CanvasGridSettings } from '@/types/grid';

/**
 * Bend Tool Hook — Simplified click-drag bend without bezier handles.
 *
 * Phase 8: Simplified Bend (no bezier handles, no anchor UI).
 *
 * Usage:
 * - Click down on a straight segment at point P1 (snapped to grid)
 * - Drag to point P2 (snapped to grid)
 * - On release: the segment transforms into a quadratic arc
 *
 * Re-bending: select a bent segment with Bend tool active, then click-drag again
 * to replace the curve.
 */

interface BendState {
  isDragging: boolean;
  targetPath: unknown | null;
  originalSegment: Segment | null;
  clickPoint: Point | null;
  previewPath: unknown | null;
}

export function useBendTool() {
  const { getCanvas } = useCanvasContext();
  const fabricCanvas = getCanvas();
  const activeTool = useCanvasStore((s) => s.activeTool);
  const mode = useProjectStore((s) => s.mode);

  const stateRef = useRef<{
    strokeColor: string;
    strokeWidth: number;
    gridSettings: CanvasGridSettings;
    zoom: number;
  }>({
    strokeColor: CANVAS.seamLine,
    strokeWidth: 2,
    gridSettings: { enabled: true, size: 1, snapToGrid: true, granularity: 'inch' },
    zoom: 1,
  });

  // Keep state in sync with store
  useEffect(() => {
    return useCanvasStore.subscribe((state) => {
      stateRef.current = {
        strokeColor: state.strokeColor,
        strokeWidth: Math.max(1, state.strokeWidth),
        gridSettings: state.gridSettings,
        zoom: state.zoom,
      };
    });
  }, []);

  useEffect(() => {
    if (!fabricCanvas || activeTool !== 'bend') return;

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
      canvas.defaultCursor = cursorForTool('bend');

      const bendState: BendState = {
        isDragging: false,
        targetPath: null,
        originalSegment: null,
        clickPoint: null,
        previewPath: null,
      };

      const HIT_THRESHOLD = 24; // pixels

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

      function isEasyDrawSegment(obj: unknown): boolean {
        return (
          typeof obj === 'object' &&
          obj !== null &&
          (obj as { __easyDrawSegment?: boolean }).__easyDrawSegment === true
        );
      }

      function isBentSegment(obj: unknown): boolean {
        return (
          typeof obj === 'object' &&
          obj !== null &&
          (obj as { __bentSegment?: boolean }).__bentSegment === true
        );
      }

      function getSegmentFromPath(path: unknown): Segment | null {
        if (!path) return null;
        const obj = path as { __segmentData?: Segment };
        return obj.__segmentData ?? null;
      }

      function findSegmentAtPoint(pointer: Point): { path: unknown; segment: Segment } | null {
        const objects = canvas.getObjects() as unknown as Array<{
          getBoundingRect?: () => { left: number; top: number; width: number; height: number };
        }>;

        for (const obj of objects) {
          if (!isEasyDrawSegment(obj) && !isBentSegment(obj)) continue;

          const segment = getSegmentFromPath(obj);
          if (!segment) continue;

          const bounds = obj.getBoundingRect?.();
          if (!bounds) continue;

          // Quick bounds check
          if (
            pointer.x < bounds.left - HIT_THRESHOLD ||
            pointer.x > bounds.left + bounds.width + HIT_THRESHOLD ||
            pointer.y < bounds.top - HIT_THRESHOLD ||
            pointer.y > bounds.top + bounds.height + HIT_THRESHOLD
          ) {
            continue;
          }

          // Precise hit test
          if (segment.type === 'straight') {
            const { distance } = closestPointOnSegment(
              pointer,
              segment.start,
              segment.end
            );
            if (distance <= HIT_THRESHOLD) {
              return { path: obj, segment };
            }
          } else {
            // Bent segment - check against curve
            const { a, b, controlPoint } = segment;
            // Sample points along the curve
            const subdivisions = 32;
            for (let i = 0; i < subdivisions; i++) {
              const t1 = i / subdivisions;
              const t2 = (i + 1) / subdivisions;
              const u1 = 1 - t1;
              const u2 = 1 - t2;

              const p1 = {
                x: u1 * u1 * a.x + 2 * u1 * t1 * controlPoint.x + t1 * t1 * b.x,
                y: u1 * u1 * a.y + 2 * u1 * t1 * controlPoint.y + t1 * t1 * b.y,
              };
              const p2 = {
                x: u2 * u2 * a.x + 2 * u2 * t2 * controlPoint.x + t2 * t2 * b.x,
                y: u2 * u2 * a.y + 2 * u2 * t2 * controlPoint.y + t2 * t2 * b.y,
              };

              const { distance } = closestPointOnSegment(pointer, p1, p2);
              if (distance <= HIT_THRESHOLD) {
                return { path: obj, segment };
              }
            }
          }
        }

        return null;
      }

      function createPreviewCurve(
        start: Point,
        end: Point,
        controlPoint: Point
      ): InstanceType<typeof fabric.Path> {
        const { strokeColor, strokeWidth, zoom } = stateRef.current;
        const scaledWidth = strokeWidth / zoom;

        const pathData = `M ${start.x} ${start.y} Q ${controlPoint.x} ${controlPoint.y} ${end.x} ${end.y}`;

        const path = new fabric.Path(pathData, {
          stroke: strokeColor,
          strokeWidth: scaledWidth,
          fill: '',
          selectable: false,
          evented: false,
          strokeDashArray: [6 / zoom, 4 / zoom],
        });

        return path;
      }

      function commitBentSegment(
        originalSegment: Segment,
        clickPoint: Point,
        dragPoint: Point,
        targetPath: unknown
      ) {
        const { strokeColor, strokeWidth, zoom } = stateRef.current;

        // Remove original path
        canvas.remove(targetPath as unknown as InstanceType<typeof fabric.FabricObject>);

        // Create new bent segment
        let bentSegment;
        if (originalSegment.type === 'straight') {
          bentSegment = createBentSegment(
            originalSegment.start,
            originalSegment.end,
            clickPoint,
            dragPoint
          );
        } else {
          // Re-bending: use original A, B but new click/drag points
          bentSegment = reBendSegment(originalSegment, clickPoint, dragPoint);
        }

        // Create path from bent segment
        const pathData = segmentToSvgPath(bentSegment);
        const scaledWidth = strokeWidth / zoom;

        const path = new fabric.Path(pathData, {
          stroke: strokeColor,
          strokeWidth: scaledWidth,
          fill: '',
          selectable: true,
          evented: true,
          objectCaching: false,
        });

        // Tag the object
        (path as unknown as { __bentSegment?: boolean }).__bentSegment = true;
        (path as unknown as { __segmentData?: typeof bentSegment }).__segmentData = bentSegment;

        canvas.add(path);
        canvas.setActiveObject(path);
        canvas.renderAll();

        // Push to undo stack
        const json = JSON.stringify(canvas.toJSON());
        useCanvasStore.getState().pushUndoState(json);
        useProjectStore.getState().setDirty(true);
      }

      function onMouseDown(e: { e: MouseEvent }) {
        if (e.e.button !== 0) return; // Only left click

        const pointer = canvas.getScenePoint(e.e);
        const hit = findSegmentAtPoint({ x: pointer.x, y: pointer.y });

        if (!hit) return;

        const snappedClick = snapPoint({ x: pointer.x, y: pointer.y });

        bendState.isDragging = true;
        bendState.targetPath = hit.path;
        bendState.originalSegment = hit.segment;
        bendState.clickPoint = snappedClick;
        bendState.previewPath = null;

        canvas.defaultCursor = 'move';
      }

      function onMouseMove(e: { e: MouseEvent }) {
        if (!bendState.isDragging || !bendState.originalSegment || !bendState.clickPoint) {
          return;
        }

        const pointer = canvas.getScenePoint(e.e);
        const snappedDrag = snapPoint({ x: pointer.x, y: pointer.y });

        // Calculate control point preview
        const segment = bendState.originalSegment;
        const { t } = closestPointOnSegment(
          bendState.clickPoint,
          segment.type === 'straight' ? segment.start : segment.a,
          segment.type === 'straight' ? segment.end : segment.b
        );

        // Quadratic Bezier control point: C = (P2 - (1-t)²·A - t²·B) / (2·t·(1-t))
        const A = segment.type === 'straight' ? segment.start : segment.a;
        const B = segment.type === 'straight' ? segment.end : segment.b;
        const P2 = snappedDrag;

        const EPSILON = 0.001;
        let controlPoint: Point;

        if (t < EPSILON || t > 1 - EPSILON) {
          // Fall back to midpoint control
          const midX = (A.x + B.x) / 2;
          const midY = (A.y + B.y) / 2;
          controlPoint = {
            x: midX + (P2.x - midX) * 2,
            y: midY + (P2.y - midY) * 2,
          };
        } else {
          const u = 1 - t;
          const u2 = u * u;
          const t2 = t * t;
          const twoUT = 2 * u * t;

          controlPoint = {
            x: (P2.x - u2 * A.x - t2 * B.x) / twoUT,
            y: (P2.y - u2 * A.y - t2 * B.y) / twoUT,
          };
        }

        // Remove old preview
        if (bendState.previewPath) {
          canvas.remove(bendState.previewPath as unknown as InstanceType<typeof fabric.FabricObject>);
        }

        // Create new preview
        const preview = createPreviewCurve(A, B, controlPoint);
        bendState.previewPath = preview;
        canvas.add(preview as unknown as InstanceType<typeof fabric.FabricObject>);
        canvas.renderAll();
      }

      function onMouseUp() {
        if (!bendState.isDragging || !bendState.originalSegment || !bendState.clickPoint) {
          return;
        }

        // Remove preview
        if (bendState.previewPath) {
          canvas.remove(bendState.previewPath as unknown as InstanceType<typeof fabric.FabricObject>);
        }

        // Get final drag point from preview or recalculate
        const { a, b, controlPoint } = bendState.previewPath
          ? (() => {
              const path = bendState.previewPath as { path?: Array<Array<string | number>> };
              // Parse Q command from path: M x y Q cx cy x y
              const p = path.path;
              if (p && p.length >= 2) {
                const start = { x: p[0][1] as number, y: p[0][2] as number };
                const q = p[1];
                if (q[0] === 'Q') {
                  return {
                    a: start,
                    b: { x: q[3] as number, y: q[4] as number },
                    controlPoint: { x: q[1] as number, y: q[2] as number },
                  };
                }
              }
              // Fallback to original segment endpoints
              const seg = bendState.originalSegment!;
              return {
                a: seg.type === 'straight' ? seg.start : seg.a,
                b: seg.type === 'straight' ? seg.end : seg.b,
                controlPoint: { x: 0, y: 0 },
              };
            })()
          : (() => {
              const seg = bendState.originalSegment!;
              return {
                a: seg.type === 'straight' ? seg.start : seg.a,
                b: seg.type === 'straight' ? seg.end : seg.b,
                controlPoint: { x: 0, y: 0 },
              };
            })();

        // Calculate P2 from control point formula inversion
        // P2 = (1-t)²·A + 2(1-t)t·C + t²·B
        const { t } = closestPointOnSegment(bendState.clickPoint, a, b);
        const u = 1 - t;
        const dragPoint = {
          x: u * u * a.x + 2 * u * t * controlPoint.x + t * t * b.x,
          y: u * u * a.y + 2 * u * t * controlPoint.y + t * t * b.y,
        };

        commitBentSegment(
          bendState.originalSegment,
          bendState.clickPoint,
          dragPoint,
          bendState.targetPath
        );

        // Reset state
        bendState.isDragging = false;
        bendState.targetPath = null;
        bendState.originalSegment = null;
        bendState.clickPoint = null;
        bendState.previewPath = null;

        canvas.defaultCursor = cursorForTool('bend');
      }

      function onKeyDown(e: KeyboardEvent) {
        if (e.key === 'Escape' && bendState.isDragging) {
          // Cancel current bend
          if (bendState.previewPath) {
            canvas.remove(bendState.previewPath as unknown as InstanceType<typeof fabric.FabricObject>);
          }
          bendState.isDragging = false;
          bendState.targetPath = null;
          bendState.originalSegment = null;
          bendState.clickPoint = null;
          bendState.previewPath = null;
          canvas.defaultCursor = cursorForTool('bend');
          canvas.renderAll();
        }
      }

      canvas.on('mouse:down', onMouseDown as never);
      canvas.on('mouse:move', onMouseMove as never);
      canvas.on('mouse:up', onMouseUp as never);
      window.addEventListener('keydown', onKeyDown);

      cleanup = () => {
        canvas.off('mouse:down', onMouseDown as never);
        canvas.off('mouse:move', onMouseMove as never);
        canvas.off('mouse:up', onMouseUp as never);
        window.removeEventListener('keydown', onKeyDown);
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

/**
 * Helper to make a bent segment straight again.
 * Used by the selection toolbar.
 */
export function makeSegmentStraight(
  path: unknown,
  canvas: unknown,
  segment: Segment
): void {
  if (segment.type !== 'bent') return;

  // Create straight segment from the bent segment's endpoints
  const straightSegment = {
    type: 'straight' as const,
    start: segment.a,
    end: segment.b,
  };

  // Update the path's data
  const pathObj = path as {
    set: (props: object) => void;
    setCoords: () => void;
    canvas?: { renderAll: () => void };
  };

  const pathData = segmentToSvgPath(straightSegment);
  pathObj.set({ path: pathData });

  // Update tags
  (path as unknown as { __easyDrawSegment?: boolean }).__easyDrawSegment = true;
  (path as unknown as { __bentSegment?: boolean }).__bentSegment = undefined;
  (path as unknown as { __segmentData?: Segment }).__segmentData = straightSegment;

  pathObj.setCoords();
  pathObj.canvas?.renderAll();
}

