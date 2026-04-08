'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { BlockBuilderMode } from '@/components/studio/BlockBuilderWorktable';
import {
  detectPatches,
  gridPointToPixel,
  type Segment,
  type DrawSegment,
  type ArcSegment,
  type Patch,
  type GridPoint,
} from '@/lib/blockbuilder-utils';
import {
  generateRectangle,
  generateCircle,
  generateBend,
} from '@/lib/block-builder-engine';

interface UseBlockBuilderOptions {
  draftCanvasRef: React.MutableRefObject<unknown>;
  isOpen: boolean;
  gridCols: number;
  gridRows: number;
  canvasSize: number;
}

interface UseBlockBuilderReturn {
  activeMode: BlockBuilderMode;
  setActiveMode: (mode: BlockBuilderMode) => void;
  segments: readonly DrawSegment[];
  patches: readonly Patch[];
  patchFills: Readonly<Record<string, string>>;
  selectedPatchId: string | null;
  clearSegments: () => void;
  undoSegment: () => void;
  setPatchFill: (patchId: string, fabricId: string) => void;
}

const SNAP_RADIUS_FRACTION = 0.3;
const SEAM_LINE_COLOR = '#383831';
const SEAM_LINE_WIDTH = 2;
const PENCIL_PREVIEW_COLOR = '#f97316';

export function useBlockBuilder({
  draftCanvasRef,
  isOpen,
  gridCols,
  gridRows,
  canvasSize,
}: UseBlockBuilderOptions): UseBlockBuilderReturn {
  const [activeMode, setActiveMode] = useState<BlockBuilderMode>('pencil');
  const [segments, setSegments] = useState<readonly DrawSegment[]>([]);
  const [patches, setPatches] = useState<readonly Patch[]>([]);
  const [patchFills, setPatchFills] = useState<Record<string, string>>({});
  const [selectedPatchId, setSelectedPatchId] = useState<string | null>(null);
  const segmentsRef = useRef(segments);
  segmentsRef.current = segments;

  // Pencil state
  const pencilStartRef = useRef<GridPoint | null>(null);
  const pencilPreviewRef = useRef<unknown>(null);

  // Rectangle state
  const rectStartRef = useRef<GridPoint | null>(null);
  const rectPreviewRef = useRef<unknown>(null);

  // Circle state
  const circleCenterRef = useRef<GridPoint | null>(null);
  const circleRadiusRef = useRef<number>(0);
  const circlePreviewRef = useRef<unknown>(null);

  // Bend state
  const bendSegmentRef = useRef<{ index: number; seg: Segment } | null>(null);
  const bendCenterRef = useRef<GridPoint | null>(null);
  const bendPreviewRef = useRef<unknown>(null);

  const gridSize = canvasSize / Math.max(gridCols, gridRows);

  // Snap mouse position to nearest grid point
  const snapToGridPoint = useCallback(
    (x: number, y: number): GridPoint | null => {
      const col = Math.round(x / gridSize);
      const row = Math.round(y / gridSize);
      const snapX = col * gridSize;
      const snapY = row * gridSize;
      const dist = Math.sqrt((x - snapX) ** 2 + (y - snapY) ** 2);
      const snapThreshold = gridSize * SNAP_RADIUS_FRACTION;

      if (dist <= snapThreshold && row >= 0 && row <= gridRows && col >= 0 && col <= gridCols) {
        return { row, col };
      }
      return null;
    },
    [gridSize, gridCols, gridRows]
  );

  // Check if two segments intersect at a grid point (not at endpoints)
  const segmentsIntersectAtGridPoint = useCallback(
    (a: Segment, b: Segment): GridPoint | null => {
      const pointsA: GridPoint[] = [];
      const drA = a.to.row - a.from.row;
      const dcA = a.to.col - a.from.col;
      const stepsA = Math.max(Math.abs(drA), Math.abs(dcA));
      if (stepsA === 0) return null;
      for (let i = 1; i < stepsA; i++) {
        const t = i / stepsA;
        pointsA.push({
          row: Math.round(a.from.row + drA * t),
          col: Math.round(a.from.col + dcA * t),
        });
      }

      const pointsB: GridPoint[] = [];
      const drB = b.to.row - b.from.row;
      const dcB = b.to.col - b.from.col;
      const stepsB = Math.max(Math.abs(drB), Math.abs(dcB));
      if (stepsB === 0) return null;
      for (let i = 1; i < stepsB; i++) {
        const t = i / stepsB;
        pointsB.push({
          row: Math.round(b.from.row + drB * t),
          col: Math.round(b.from.col + dcB * t),
        });
      }

      for (const pa of pointsA) {
        for (const pb of pointsB) {
          if (pa.row === pb.row && pa.col === pb.col) {
            return pa;
          }
        }
      }
      return null;
    },
    []
  );

  // Split a segment at a grid intersection point
  const splitSegmentAtIntersection = useCallback(
    (seg: Segment, splitPoint: GridPoint): [Segment, Segment] | null => {
      const minR = Math.min(seg.from.row, seg.to.row);
      const maxR = Math.max(seg.from.row, seg.to.row);
      const minC = Math.min(seg.from.col, seg.to.col);
      const maxC = Math.max(seg.from.col, seg.to.col);

      if (splitPoint.row <= minR || splitPoint.row >= maxR) return null;
      if (splitPoint.col <= minC || splitPoint.col >= maxC) return null;

      return [
        { from: seg.from, to: splitPoint },
        { from: splitPoint, to: seg.to },
      ];
    },
    []
  );

  // Add segments, deduplicating against existing and splitting at intersections
  const addShapeSegments = useCallback((newSegs: Segment[]) => {
    setSegments((prev) => {
      const existingSegments = prev.filter((s): s is Segment => !('center' in s));
      let toAdd: Segment[] = [];

      for (const newSeg of newSegs) {
        let segmentsToProcess: Segment[] = [newSeg];
        const finalSegments: Segment[] = [];
        let changed = true;

        while (changed) {
          changed = false;
          const nextIteration: Segment[] = [];

          for (const seg of segmentsToProcess) {
            let splitFound = false;
            for (const existing of existingSegments) {
              const intersection = segmentsIntersectAtGridPoint(seg, existing);
              if (intersection) {
                const splitResult = splitSegmentAtIntersection(seg, intersection);
                if (splitResult) {
                  nextIteration.push(splitResult[0], splitResult[1]);
                  splitFound = true;
                  changed = true;
                  break;
                }
              }
            }
            if (!splitFound) {
              finalSegments.push(seg);
            }
          }

          segmentsToProcess = nextIteration;
        }

        toAdd = [...toAdd, ...finalSegments];
      }

      const existing = new Set(
        existingSegments.map((s) => {
          const f = s.from;
          const t = s.to;
          const [a, b] =
            f.row < t.row || (f.row === t.row && f.col < t.col) ? [f, t] : [t, f];
          return `${a.row},${a.col}-${b.row},${b.col}`;
        })
      );

      const uniqueToAdd = toAdd.filter((s) => {
        const f = s.from;
        const t = s.to;
        const [a, b] =
          f.row < t.row || (f.row === t.row && f.col < t.col) ? [f, t] : [t, f];
        return !existing.has(`${a.row},${a.col}-${b.row},${b.col}`);
      });

      if (uniqueToAdd.length === 0) return prev;
      return [...prev, ...uniqueToAdd];
    });
  }, [segmentsIntersectAtGridPoint, splitSegmentAtIntersection]);

  // Recompute patches whenever segments change
  useEffect(() => {
    const lineSegments = segments.filter((s): s is Segment => !('center' in s));
    const newPatches = detectPatches(lineSegments, gridCols, gridRows);
    setPatches(newPatches);
  }, [segments, gridCols, gridRows]);

  // Set patch fill from fabric
  const setPatchFill = useCallback((patchId: string, fabricId: string) => {
    setPatchFills((prev) => ({ ...prev, [patchId]: fabricId }));
  }, []);

  // Find nearest existing segment for bend tool
  const findNearestSegment = useCallback(
    (
      x: number,
      y: number,
      segs: readonly Segment[],
      tolerance: number
    ): { index: number; seg: Segment } | null => {
      let bestIdx = -1;
      let bestDist = Infinity;

      for (let i = 0; i < segs.length; i++) {
        const seg = segs[i];
        const fromPx = gridPointToPixel(seg.from, gridSize);
        const toPx = gridPointToPixel(seg.to, gridSize);

        // Distance from point to line segment
        const dx = toPx.x - fromPx.x;
        const dy = toPx.y - fromPx.y;
        const lenSq = dx * dx + dy * dy;
        if (lenSq === 0) {
          const d = Math.sqrt((x - fromPx.x) ** 2 + (y - fromPx.y) ** 2);
          if (d < bestDist) {
            bestDist = d;
            bestIdx = i;
          }
          continue;
        }

        let t = ((x - fromPx.x) * dx + (y - fromPx.y) * dy) / lenSq;
        t = Math.max(0, Math.min(1, t));
        const projX = fromPx.x + t * dx;
        const projY = fromPx.y + t * dy;
        const dist = Math.sqrt((x - projX) ** 2 + (y - projY) ** 2);

        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = i;
        }
      }

      if (bestDist <= tolerance && bestIdx >= 0) {
        return { index: bestIdx, seg: segs[bestIdx] };
      }
      return null;
    },
    [gridSize]
  );

  // Draw seam lines and patches on canvas + handle mouse events
  useEffect(() => {
    if (!isOpen) return;
    if (!draftCanvasRef.current) {
      // Canvas not ready yet, wait for next render
      return;
    }

    let isMounted = true;
    let cleanup: (() => void) | null = null;

    (async () => {
      const fabric = await import('fabric');
      if (!isMounted || !draftCanvasRef.current) return;
      const canvas = draftCanvasRef.current as InstanceType<typeof fabric.Canvas>;

      // Clear existing user objects (keep overlay)
      const toRemove = canvas.getObjects().filter((o) => {
        if ((o as unknown as { name?: string }).name === 'overlay-ref') return false;
        return true;
      });
      for (const obj of toRemove) {
        canvas.remove(obj);
      }

      // Draw patch fills
      for (const patch of patches) {
        const pixelVerts = patch.vertices.map((v) => ({
          x: v.x * gridSize,
          y: v.y * gridSize,
        }));
        if (pixelVerts.length < 3) continue;

        const fabricId = patchFills[patch.id];
        const fill = fabricId ? `url(#fabric-${fabricId})` : 'transparent';

        const polygon = new fabric.Polygon(pixelVerts, {
          fill,
          stroke: 'transparent',
          strokeWidth: 0,
          selectable: false,
          evented: false,
        });
        canvas.add(polygon);
      }

      // Draw selected patch highlight
      if (selectedPatchId) {
        const selectedPatch = patches.find((p) => p.id === selectedPatchId);
        if (selectedPatch) {
          const pixelVerts = selectedPatch.vertices.map((v) => ({
            x: v.x * gridSize,
            y: v.y * gridSize,
          }));
          if (pixelVerts.length >= 3) {
            const highlight = new fabric.Polygon(pixelVerts, {
              fill: 'transparent',
              stroke: PENCIL_PREVIEW_COLOR,
              strokeWidth: 2,
              selectable: false,
              evented: false,
            });
            canvas.add(highlight);
          }
        }
      }

      // Draw seam lines and arcs
      for (const seg of segmentsRef.current) {
        if ('center' in seg) {
          const arc = seg as ArcSegment;
          const fromPx = gridPointToPixel(arc.from, gridSize);
          const toPx = gridPointToPixel(arc.to, gridSize);
          const centerPx = gridPointToPixel(arc.center, gridSize);
          const dx = fromPx.x - centerPx.x;
          const dy = fromPx.y - centerPx.y;
          const radius = Math.sqrt(dx * dx + dy * dy);
          const sweepFlag = arc.clockwise ? 1 : 0;

          const pathStr = `M ${fromPx.x} ${fromPx.y} A ${radius} ${radius} 0 0 ${sweepFlag} ${toPx.x} ${toPx.y}`;
          const pathObj = new fabric.Path(pathStr, {
            fill: '',
            stroke: SEAM_LINE_COLOR,
            strokeWidth: SEAM_LINE_WIDTH,
            selectable: false,
            evented: false,
          });
          canvas.add(pathObj);
        } else {
          const fromPx = gridPointToPixel(seg.from, gridSize);
          const toPx = gridPointToPixel(seg.to, gridSize);
          const line = new fabric.Line([fromPx.x, fromPx.y, toPx.x, toPx.y], {
            stroke: SEAM_LINE_COLOR,
            strokeWidth: SEAM_LINE_WIDTH,
            selectable: false,
            evented: false,
          });
          canvas.add(line);
        }
      }

      canvas.renderAll();

      // Set cursor
      canvas.selection = false;
      canvas.defaultCursor = activeMode === 'bend' ? 'pointer' : 'crosshair';

      function clearPreviews() {
        const allRefs = [
          pencilPreviewRef,
          rectPreviewRef,
          circlePreviewRef,
          bendPreviewRef,
        ];
        for (const ref of allRefs) {
          if (ref.current) {
            canvas.remove(ref.current as InstanceType<typeof fabric.FabricObject>);
            ref.current = null;
          }
        }
      }

      // ─── Mouse Down ────────────────────────────────────────────────
      function onMouseDown(e: { e: MouseEvent }) {
        const pointer = canvas.getScenePoint(e.e);
        const gridPt = snapToGridPoint(pointer.x, pointer.y);

        // ─── Bend tool: click a segment ──────────────────────────────
        if (activeMode === 'bend') {
          const lineSegments = segmentsRef.current.filter(
            (s): s is Segment => !('center' in s)
          );
          const found = findNearestSegment(
            pointer.x,
            pointer.y,
            lineSegments,
            gridSize * 0.5
          );
          if (!found) return;
          bendSegmentRef.current = { index: found.index, seg: found.seg };
          return;
        }

        // ─── Pencil: start drawing chain ─────────────────────────────
        if (activeMode === 'pencil') {
          if (!gridPt) return;

          if (!pencilStartRef.current) {
            pencilStartRef.current = gridPt;
            const px = gridPointToPixel(gridPt, gridSize);
            const dot = new fabric.Circle({
              left: px.x - 3,
              top: px.y - 3,
              radius: 3,
              fill: PENCIL_PREVIEW_COLOR,
              selectable: false,
              evented: false,
              stroke: '',
            });
            canvas.add(dot);
            pencilPreviewRef.current = dot;
            canvas.renderAll();
          } else {
            const startPt = pencilStartRef.current;
            if (startPt.row === gridPt.row && startPt.col === gridPt.col) return;

            addShapeSegments([{ from: startPt, to: gridPt }]);
            pencilStartRef.current = gridPt;

            // Move preview dot
            if (pencilPreviewRef.current) {
              canvas.remove(pencilPreviewRef.current as InstanceType<typeof fabric.FabricObject>);
            }
            const px = gridPointToPixel(gridPt, gridSize);
            const dot = new fabric.Circle({
              left: px.x - 3,
              top: px.y - 3,
              radius: 3,
              fill: PENCIL_PREVIEW_COLOR,
              selectable: false,
              evented: false,
              stroke: '',
            });
            canvas.add(dot);
            pencilPreviewRef.current = dot;
            canvas.renderAll();
          }
          return;
        }

        // ─── Rectangle: first corner ─────────────────────────────────
        if (activeMode === 'rectangle') {
          if (!gridPt) return;
          rectStartRef.current = gridPt;
          const px = gridPointToPixel(gridPt, gridSize);
          const dot = new fabric.Circle({
            left: px.x - 4,
            top: px.y - 4,
            radius: 4,
            fill: PENCIL_PREVIEW_COLOR,
            selectable: false,
            evented: false,
            stroke: '',
          });
          canvas.add(dot);
          rectPreviewRef.current = dot;
          canvas.renderAll();
          return;
        }

        // ─── Circle: center point ────────────────────────────────────
        if (activeMode === 'circle') {
          if (!gridPt) return;
          circleCenterRef.current = gridPt;
          circleRadiusRef.current = 0;
          canvas.renderAll();
          return;
        }
      }

      // ─── Mouse Move ────────────────────────────────────────────────
      function onMouseMove(e: { e: MouseEvent }) {
        const pointer = canvas.getScenePoint(e.e);

        // ─── Bend preview ────────────────────────────────────────────
        if (activeMode === 'bend' && bendSegmentRef.current) {
          const gridPt = snapToGridPoint(pointer.x, pointer.y);
          if (!gridPt) return;

          bendCenterRef.current = gridPt;

          const { seg } = bendSegmentRef.current;
          const arc = generateBend(seg, gridPt);
          const fromPx = gridPointToPixel(arc.from, gridSize);
          const toPx = gridPointToPixel(arc.to, gridSize);
          const centerPx = gridPointToPixel(arc.center, gridSize);
          const dx = fromPx.x - centerPx.x;
          const dy = fromPx.y - centerPx.y;
          const radius = Math.sqrt(dx * dx + dy * dy);
          const sweepFlag = arc.clockwise ? 1 : 0;

          if (bendPreviewRef.current) {
            canvas.remove(bendPreviewRef.current as InstanceType<typeof fabric.FabricObject>);
          }

          const pathStr = `M ${fromPx.x} ${fromPx.y} A ${radius} ${radius} 0 0 ${sweepFlag} ${toPx.x} ${toPx.y}`;
          const pathObj = new fabric.Path(pathStr, {
            fill: '',
            stroke: PENCIL_PREVIEW_COLOR,
            strokeWidth: SEAM_LINE_WIDTH,
            strokeDashArray: [6, 4],
            selectable: false,
            evented: false,
          });
          canvas.add(pathObj);
          bendPreviewRef.current = pathObj;
          canvas.renderAll();
          return;
        }

        // ─── Rectangle preview ───────────────────────────────────────
        if (activeMode === 'rectangle' && rectStartRef.current) {
          const gridPt = snapToGridPoint(pointer.x, pointer.y);
          if (!gridPt) return;

          if (rectPreviewRef.current) {
            canvas.remove(rectPreviewRef.current as InstanceType<typeof fabric.FabricObject>);
          }

          const start = rectStartRef.current;
          const minR = Math.min(start.row, gridPt.row);
          const maxR = Math.max(start.row, gridPt.row);
          const minC = Math.min(start.col, gridPt.col);
          const maxC = Math.max(start.col, gridPt.col);

          const rect = new fabric.Rect({
            left: minC * gridSize,
            top: minR * gridSize,
            width: (maxC - minC) * gridSize,
            height: (maxR - minR) * gridSize,
            fill: 'transparent',
            stroke: PENCIL_PREVIEW_COLOR,
            strokeWidth: 1.5,
            strokeDashArray: [6, 4],
            selectable: false,
            evented: false,
          });
          canvas.add(rect);
          rectPreviewRef.current = rect;
          canvas.renderAll();
          return;
        }

        // ─── Circle preview ──────────────────────────────────────────
        if (activeMode === 'circle' && circleCenterRef.current) {
          const gridPt = snapToGridPoint(pointer.x, pointer.y);
          if (!gridPt) return;

          const center = circleCenterRef.current;
          const dr = Math.abs(gridPt.row - center.row);
          const dc = Math.abs(gridPt.col - center.col);
          const radius = Math.max(dr, dc);
          circleRadiusRef.current = radius;

          if (circlePreviewRef.current) {
            canvas.remove(circlePreviewRef.current as InstanceType<typeof fabric.FabricObject>);
          }

          const circle = new fabric.Circle({
            left: (center.col - radius) * gridSize,
            top: (center.row - radius) * gridSize,
            radius: radius * gridSize,
            fill: 'transparent',
            stroke: PENCIL_PREVIEW_COLOR,
            strokeWidth: 1.5,
            strokeDashArray: [6, 4],
            selectable: false,
            evented: false,
          });
          canvas.add(circle);
          circlePreviewRef.current = circle;
          canvas.renderAll();
          return;
        }

        // ─── Pencil preview line ─────────────────────────────────────
        if (activeMode === 'pencil' && pencilStartRef.current) {
          const gridPt = snapToGridPoint(pointer.x, pointer.y);
          if (!gridPt) return;

          if (pencilPreviewRef.current) {
            canvas.remove(pencilPreviewRef.current as InstanceType<typeof fabric.FabricObject>);
          }

          const startPx = gridPointToPixel(pencilStartRef.current, gridSize);
          const endPx = gridPointToPixel(gridPt, gridSize);
          const line = new fabric.Line([startPx.x, startPx.y, endPx.x, endPx.y], {
            stroke: PENCIL_PREVIEW_COLOR,
            strokeWidth: 1.5,
            strokeDashArray: [6, 4],
            selectable: false,
            evented: false,
          });
          canvas.add(line);
          pencilPreviewRef.current = line;
          canvas.renderAll();
        }
      }

      // ─── Mouse Up ──────────────────────────────────────────────────
      function onMouseUp(e: { e: MouseEvent }) {
        const pointer = canvas.getScenePoint(e.e);

        // ─── Bend: commit ────────────────────────────────────────────
        if (activeMode === 'bend' && bendSegmentRef.current && bendCenterRef.current) {
          if (bendPreviewRef.current) {
            canvas.remove(bendPreviewRef.current as InstanceType<typeof fabric.FabricObject>);
            bendPreviewRef.current = null;
          }

          const { index, seg } = bendSegmentRef.current;
          const center = bendCenterRef.current;
          const arc = generateBend(seg, center);

          setSegments((prev) => {
            const existing = prev[index];
            if (
              !existing ||
              'center' in existing ||
              existing.from.row !== seg.from.row ||
              existing.from.col !== seg.from.col ||
              existing.to.row !== seg.to.row ||
              existing.to.col !== seg.to.col
            ) {
              return prev;
            }
            const next = [...prev];
            next[index] = arc;
            return next;
          });

          bendSegmentRef.current = null;
          bendCenterRef.current = null;
          canvas.renderAll();
          return;
        }

        // ─── Rectangle: commit on second click ───────────────────────
        if (activeMode === 'rectangle' && rectStartRef.current) {
          const gridPt = snapToGridPoint(pointer.x, pointer.y);
          if (gridPt && rectStartRef.current) {
            const start = rectStartRef.current;
            if (start.row !== gridPt.row || start.col !== gridPt.col) {
              addShapeSegments(
                generateRectangle(start.row, start.col, gridPt.row, gridPt.col)
              );
            }
          }
          rectStartRef.current = null;
          clearPreviews();
          canvas.renderAll();
          return;
        }

        // ─── Circle: commit ──────────────────────────────────────────
        if (activeMode === 'circle' && circleCenterRef.current) {
          const gridPt = snapToGridPoint(pointer.x, pointer.y);
          if (gridPt && circleCenterRef.current) {
            const center = circleCenterRef.current;
            const dr = Math.abs(gridPt.row - center.row);
            const dc = Math.abs(gridPt.col - center.col);
            const radius = Math.max(dr, dc);
            if (radius > 0) {
              addShapeSegments(generateCircle(center.row, center.col, radius));
            }
          }
          circleCenterRef.current = null;
          circleRadiusRef.current = 0;
          clearPreviews();
          canvas.renderAll();
          return;
        }
      }

      // ─── Double Click ──────────────────────────────────────────────
      function onDoubleClick() {
        if (activeMode === 'pencil') {
          pencilStartRef.current = null;
          clearPreviews();
          canvas.renderAll();
        }
      }

      canvas.on('mouse:down', onMouseDown as never);
      canvas.on('mouse:move', onMouseMove as never);
      canvas.on('mouse:up', onMouseUp as never);
      canvas.on('mouse:dblclick', onDoubleClick as never);

      cleanup = () => {
        canvas.off('mouse:down', onMouseDown as never);
        canvas.off('mouse:move', onMouseMove as never);
        canvas.off('mouse:up', onMouseUp as never);
        canvas.off('mouse:dblclick', onDoubleClick as never);
      };
    })().catch(() => {
      // Block builder render failed
    });

    return () => {
      isMounted = false;
      cleanup?.();
    };
  }, [
    isOpen,
    draftCanvasRef,
    patches,
    patchFills,
    selectedPatchId,
    activeMode,
    gridSize,
    gridCols,
    gridRows,
    canvasSize,
    snapToGridPoint,
    addShapeSegments,
    findNearestSegment,
  ]);

  const clearSegments = useCallback(() => {
    setSegments([]);
    setPatchFills({});
    setSelectedPatchId(null);
    pencilStartRef.current = null;
    rectStartRef.current = null;
    circleCenterRef.current = null;
    bendSegmentRef.current = null;
  }, []);

  const undoSegment = useCallback(() => {
    setSegments((prev) => (prev.length > 0 ? prev.slice(0, -1) : prev));
  }, []);

  return {
    activeMode,
    setActiveMode,
    segments,
    patches,
    patchFills,
    selectedPatchId,
    clearSegments,
    undoSegment,
    setPatchFill,
  };
}
