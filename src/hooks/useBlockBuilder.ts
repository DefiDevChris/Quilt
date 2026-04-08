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
  activeMode: BlockBuilderMode;
}

interface UseBlockBuilderReturn {
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
const GRID_LINE_COLOR = '#E5E2DD';

export function useBlockBuilder({
  draftCanvasRef,
  isOpen,
  gridCols,
  gridRows,
  canvasSize,
  activeMode,
}: UseBlockBuilderOptions): UseBlockBuilderReturn {
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

  // Triangle state (right triangle: click to set right-angle corner, release to set opposite corner)
  const triangleStartRef = useRef<GridPoint | null>(null);
  const trianglePreviewRef = useRef<unknown>(null);

  // Bend state
  const bendSegmentRef = useRef<{ index: number; seg: Segment } | null>(null);
  const bendCenterRef = useRef<GridPoint | null>(null);
  const bendPreviewRef = useRef<unknown>(null);

  const gridSize = canvasSize / Math.max(gridCols, gridRows);

  // Snap mouse position to nearest grid point (with threshold — returns null if too far)
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

  // Snap mouse position to nearest grid point (always returns a valid grid point, no threshold)
  const snapToNearestGridPoint = useCallback(
    (x: number, y: number): GridPoint => {
      const col = Math.max(0, Math.min(gridCols, Math.round(x / gridSize)));
      const row = Math.max(0, Math.min(gridRows, Math.round(y / gridSize)));
      return { row, col };
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

  // Draw seam lines, patches, and grid on canvas + handle mouse events
  useEffect(() => {
    if (!isOpen) return;
    const canvas = draftCanvasRef.current as InstanceType<typeof import('fabric').Canvas> | null;
    if (!canvas) return;

    let isMounted = true;
    let cleanup: (() => void) | null = null;

    (async () => {
      const fabric = await import('fabric');
      if (!isMounted) return;
      const c = canvas as InstanceType<typeof fabric.Canvas>;

      // Clear existing user objects (keep overlay)
      const toRemove = c.getObjects().filter((o) => {
        if ((o as unknown as { name?: string }).name === 'overlay-ref') return false;
        // Also keep grid lines so we don't flicker
        if ((o as unknown as { _isGridLine?: boolean })._isGridLine) return false;
        return true;
      });
      for (const obj of toRemove) {
        c.remove(obj);
      }

      // Draw grid lines
      for (let row = 0; row <= gridRows; row++) {
        const y = row * gridSize;
        const line = new fabric.Line([0, y, canvasSize, y], {
          stroke: GRID_LINE_COLOR,
          strokeWidth: 1,
          selectable: false,
          evented: false,
        });
        (line as unknown as { _isGridLine?: boolean })._isGridLine = true;
        c.add(line);
      }
      for (let col = 0; col <= gridCols; col++) {
        const x = col * gridSize;
        const line = new fabric.Line([x, 0, x, canvasSize], {
          stroke: GRID_LINE_COLOR,
          strokeWidth: 1,
          selectable: false,
          evented: false,
        });
        (line as unknown as { _isGridLine?: boolean })._isGridLine = true;
        c.add(line);
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
        c.add(polygon);
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
            c.add(highlight);
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
          c.add(pathObj);
        } else {
          const fromPx = gridPointToPixel(seg.from, gridSize);
          const toPx = gridPointToPixel(seg.to, gridSize);
          const line = new fabric.Line([fromPx.x, fromPx.y, toPx.x, toPx.y], {
            stroke: SEAM_LINE_COLOR,
            strokeWidth: SEAM_LINE_WIDTH,
            selectable: false,
            evented: false,
          });
          c.add(line);
        }
      }

      c.renderAll();

      // Set cursor
      c.selection = false;
      c.defaultCursor = activeMode === 'bend' ? 'pointer' : 'crosshair';

      function clearPreviews() {
        const allRefs = [
          pencilPreviewRef,
          rectPreviewRef,
          circlePreviewRef,
          bendPreviewRef,
        ];
        for (const ref of allRefs) {
          if (ref.current) {
            c.remove(ref.current as InstanceType<typeof fabric.FabricObject>);
            ref.current = null;
          }
        }
      }

      // ─── Mouse Down ────────────────────────────────────────────────
      function onMouseDown(e: { e: MouseEvent }) {
        const pointer = c.getScenePoint(e.e);
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
            c.add(dot);
            pencilPreviewRef.current = dot;
            c.renderAll();
          } else {
            const startPt = pencilStartRef.current;
            if (startPt.row === gridPt.row && startPt.col === gridPt.col) return;

            addShapeSegments([{ from: startPt, to: gridPt }]);
            pencilStartRef.current = gridPt;

            // Move preview dot
            if (pencilPreviewRef.current) {
              c.remove(pencilPreviewRef.current as InstanceType<typeof fabric.FabricObject>);
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
            c.add(dot);
            pencilPreviewRef.current = dot;
            c.renderAll();
          }
          return;
        }

        // ─── Rectangle: first corner ─────────────────────────────────
        if (activeMode === 'rectangle') {
          if (rectStartRef.current) return; // Already drawing, wait for mouseUp
          const gridPt = snapToNearestGridPoint(pointer.x, pointer.y);
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
          c.add(dot);
          rectPreviewRef.current = dot;
          c.renderAll();
          return;
        }

        // ─── Circle: center point ────────────────────────────────────
        if (activeMode === 'circle') {
          if (!gridPt) return;
          if (circleCenterRef.current) return; // Already drawing, wait for mouseUp
          circleCenterRef.current = gridPt;
          circleRadiusRef.current = 0;
          c.renderAll();
          return;
        }

        // ─── Triangle: click to set right-angle corner ───────────────
        if (activeMode === 'triangle') {
          if (triangleStartRef.current) return; // Already drawing, wait for mouseUp
          const gridPt = snapToNearestGridPoint(pointer.x, pointer.y);
          triangleStartRef.current = gridPt;
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
          c.add(dot);
          trianglePreviewRef.current = dot;
          c.renderAll();
          return;
        }
      }

      // ─── Mouse Move ────────────────────────────────────────────────
      function onMouseMove(e: { e: MouseEvent }) {
        const pointer = c.getScenePoint(e.e);

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
            c.remove(bendPreviewRef.current as InstanceType<typeof fabric.FabricObject>);
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
          c.add(pathObj);
          bendPreviewRef.current = pathObj;
          c.renderAll();
          return;
        }

        // ─── Rectangle preview ───────────────────────────────────────
        if (activeMode === 'rectangle' && rectStartRef.current) {
          const gridPt = snapToNearestGridPoint(pointer.x, pointer.y);

          if (rectPreviewRef.current) {
            c.remove(rectPreviewRef.current as InstanceType<typeof fabric.FabricObject>);
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
          c.add(rect);
          rectPreviewRef.current = rect;
          c.renderAll();
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
            c.remove(circlePreviewRef.current as InstanceType<typeof fabric.FabricObject>);
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
          c.add(circle);
          circlePreviewRef.current = circle;
          c.renderAll();
          return;
        }

        // ─── Pencil preview line ─────────────────────────────────────
        if (activeMode === 'pencil' && pencilStartRef.current) {
          const gridPt = snapToGridPoint(pointer.x, pointer.y);
          if (!gridPt) return;

          if (pencilPreviewRef.current) {
            c.remove(pencilPreviewRef.current as InstanceType<typeof fabric.FabricObject>);
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
          c.add(line);
          pencilPreviewRef.current = line;
          c.renderAll();
        }

        // ─── Triangle preview (right triangle from corner to cursor) ─
        if (activeMode === 'triangle' && triangleStartRef.current) {
          const gridPt = snapToNearestGridPoint(pointer.x, pointer.y);
          const start = triangleStartRef.current;
          if (start.row === gridPt.row && start.col === gridPt.col) return; // Same point, no preview

          // Clear old preview
          if (trianglePreviewRef.current) {
            c.remove(trianglePreviewRef.current as InstanceType<typeof fabric.FabricObject>);
          }

          // Right triangle corners:
          //   A = start (right angle)
          //   B = (gridPt.row, start.col) — same col as start
          //   C = (start.row, gridPt.col) — same row as start
          const a = gridPointToPixel(start, gridSize);
          const b = gridPointToPixel({ row: gridPt.row, col: start.col }, gridSize);
          const cPt = gridPointToPixel({ row: start.row, col: gridPt.col }, gridSize);

          const pathStr = `M ${a.x} ${a.y} L ${b.x} ${b.y} L ${cPt.x} ${cPt.y} Z`;
          const path = new fabric.Path(pathStr, {
            fill: 'rgba(249, 115, 22, 0.1)',
            stroke: PENCIL_PREVIEW_COLOR,
            strokeWidth: 1.5,
            strokeDashArray: [6, 4],
            selectable: false,
            evented: false,
          });
          c.add(path);
          trianglePreviewRef.current = path;
          c.renderAll();
        }
      }

      // ─── Mouse Up ──────────────────────────────────────────────────
      function onMouseUp(e: { e: MouseEvent }) {
        const pointer = c.getScenePoint(e.e);

        // ─── Bend: commit ────────────────────────────────────────────
        if (activeMode === 'bend' && bendSegmentRef.current && bendCenterRef.current) {
          if (bendPreviewRef.current) {
            c.remove(bendPreviewRef.current as InstanceType<typeof fabric.FabricObject>);
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
          c.renderAll();
          return;
        }

        // ─── Rectangle: commit on mouseup ────────────────────────────
        if (activeMode === 'rectangle' && rectStartRef.current) {
          const gridPt = snapToNearestGridPoint(pointer.x, pointer.y);
          const start = rectStartRef.current;
          if (start.row !== gridPt.row || start.col !== gridPt.col) {
            addShapeSegments(
              generateRectangle(start.row, start.col, gridPt.row, gridPt.col)
            );
          }
          rectStartRef.current = null;
          clearPreviews();
          c.renderAll();
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
          c.renderAll();
          return;
        }

        // ─── Triangle: commit right triangle on release ──────────────
        if (activeMode === 'triangle' && triangleStartRef.current) {
          const gridPt = snapToNearestGridPoint(pointer.x, pointer.y);
          const start = triangleStartRef.current;
          if (start.row !== gridPt.row || start.col !== gridPt.col) {
            // Right triangle: 3 segments forming the right angle
            const cornerA = start;
            const cornerB = { row: gridPt.row, col: start.col };
            const cornerC = { row: start.row, col: gridPt.col };
            addShapeSegments([
              { from: cornerA, to: cornerB },
              { from: cornerB, to: cornerC },
              { from: cornerC, to: cornerA },
            ]);
          }
          triangleStartRef.current = null;
          clearPreviews();
          c.renderAll();
          return;
        }
      }

      // ─── Double Click ──────────────────────────────────────────────
      function onDoubleClick() {
        if (activeMode === 'pencil') {
          pencilStartRef.current = null;
          clearPreviews();
          c.renderAll();
        }
        if (activeMode === 'triangle' && triangleStartRef.current) {
          triangleStartRef.current = null;
          clearPreviews();
          c.renderAll();
        }
      }

      c.on('mouse:down', onMouseDown as never);
      c.on('mouse:move', onMouseMove as never);
      c.on('mouse:up', onMouseUp as never);
      c.on('mouse:dblclick', onDoubleClick as never);

      // ─── Escape key: cancel in-progress drawing ────────────────────
      function onKeyDown(e: KeyboardEvent) {
        if (e.key === 'Escape') {
          if (activeMode === 'pencil' && pencilStartRef.current) {
            pencilStartRef.current = null;
            clearPreviews();
            c.renderAll();
          }
          if (activeMode === 'rectangle' && rectStartRef.current) {
            rectStartRef.current = null;
            clearPreviews();
            c.renderAll();
          }
          if (activeMode === 'triangle' && triangleStartRef.current) {
            triangleStartRef.current = null;
            clearPreviews();
            c.renderAll();
          }
          if (activeMode === 'circle' && circleCenterRef.current) {
            circleCenterRef.current = null;
            circleRadiusRef.current = 0;
            clearPreviews();
            c.renderAll();
          }
          if (activeMode === 'bend' && bendSegmentRef.current) {
            bendSegmentRef.current = null;
            bendCenterRef.current = null;
            if (bendPreviewRef.current) {
              c.remove(bendPreviewRef.current as InstanceType<typeof fabric.FabricObject>);
              bendPreviewRef.current = null;
            }
            c.renderAll();
          }
        }
      }

      const canvasEl = c.getElement();
      canvasEl.addEventListener('keydown', onKeyDown);

      cleanup = () => {
        c.off('mouse:down', onMouseDown as never);
        c.off('mouse:move', onMouseMove as never);
        c.off('mouse:up', onMouseUp as never);
        c.off('mouse:dblclick', onDoubleClick as never);
        canvasEl.removeEventListener('keydown', onKeyDown);
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
    canvasSize,
    patches,
    patchFills,
    selectedPatchId,
    activeMode,
    gridSize,
    gridCols,
    gridRows,
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
    triangleStartRef.current = null;
    circleCenterRef.current = null;
    bendSegmentRef.current = null;
  }, []);

  const undoSegment = useCallback(() => {
    setSegments((prev) => (prev.length > 0 ? prev.slice(0, -1) : prev));
  }, []);

  return {
    segments,
    patches,
    patchFills,
    selectedPatchId,
    clearSegments,
    undoSegment,
    setPatchFill,
  };
}
