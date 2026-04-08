'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { BlockBuilderMode } from '@/components/blocks/BlockBuilderToolbar';
import {
  detectPatches,
  gridPointToPixel,
  type Segment,
  type DrawSegment,
  type ArcSegment,
  type Patch,
} from '@/lib/blockbuilder-utils';
import {
  generateTriangle,
  generateRectangle,
  pixelToGridCell,
  isValidCell,
  findNearestSegment,
} from '@/lib/block-builder-engine';
import { GRID_LINE_COLOR } from '@/lib/constants';

interface UseBlockBuilderOptions {
  draftCanvasRef: React.MutableRefObject<unknown>;
  isOpen: boolean;
  fillColor: string;
  strokeColor: string;
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
  clearSegments: () => void;
  undoSegment: () => void;
  redrawGrid: () => void;
}

const SNAP_RADIUS_FRACTION = 0.3;
const SEAM_LINE_COLOR = '#383831';
const SEAM_LINE_WIDTH = 2;
const CURVE_HIT_TOLERANCE = 12;

const PATCH_COLORS = [
  '#ffca9d',
  '#f5deb3',
  '#d4883c',
  '#8b4513',
  '#7b3f00',
  '#a0522d',
  '#2e4057',
  '#deb887',
  '#c9b896',
  '#e8d5b7',
  '#b8860b',
  '#cd853f',
];

export function useBlockBuilder({
  draftCanvasRef,
  isOpen,
  fillColor,
  strokeColor,
  gridCols,
  gridRows,
  canvasSize,
}: UseBlockBuilderOptions): UseBlockBuilderReturn {
  const [activeMode, setActiveMode] = useState<BlockBuilderMode>('freedraw');
  const [segments, setSegments] = useState<readonly DrawSegment[]>([]);
  const [patches, setPatches] = useState<readonly Patch[]>([]);
  const [patchFills, setPatchFills] = useState<Record<string, string>>({});
  const segmentsRef = useRef(segments);
  segmentsRef.current = segments;
  const startPointRef = useRef<{ row: number; col: number } | null>(null);
  const previewRef = useRef<unknown>(null);
  const bendStateRef = useRef<{
    segIdx: number;
    fromPx: { x: number; y: number };
    toPx: { x: number; y: number };
    isDragging: boolean;
    apexPx: { x: number; y: number } | null;
  } | null>(null);

  const gridSize = canvasSize / Math.max(gridCols, gridRows);

  // Snap mouse position to nearest grid point
  const snapToGridPoint = useCallback(
    (x: number, y: number): { row: number; col: number } | null => {
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

  // Add segments, deduplicating against existing
  const addShapeSegments = useCallback((newSegs: Segment[]) => {
    setSegments((prev) => {
      const existing = new Set(
        prev.map((s) => {
          if ('center' in s) return '';
          const f = s.from;
          const t = s.to;
          const [a, b] =
            f.row < t.row || (f.row === t.row && f.col < t.col) ? [f, t] : [t, f];
          return `${a.row},${a.col}-${b.row},${b.col}`;
        })
      );
      const toAdd = newSegs.filter((s) => {
        const f = s.from;
        const t = s.to;
        const [a, b] =
          f.row < t.row || (f.row === t.row && f.col < t.col) ? [f, t] : [t, f];
        return !existing.has(`${a.row},${a.col}-${b.row},${b.col}`);
      });
      if (toAdd.length === 0) return prev;
      return [...prev, ...toAdd];
    });
  }, []);

  // Recompute patches whenever segments change
  useEffect(() => {
    const lineSegments = segments.filter((s): s is Segment => !('center' in s));
    const newPatches = detectPatches(lineSegments, gridCols, gridRows);
    setPatches(newPatches);
  }, [segments, gridCols, gridRows]);

  // Redraw grid lines on canvas
  const redrawGrid = useCallback(() => {
    if (!draftCanvasRef.current || !isOpen) return;

    (async () => {
      const fabric = await import('fabric');
      const canvas = draftCanvasRef.current as InstanceType<typeof fabric.Canvas>;

      // Remove old grid lines
      const gridLines = canvas.getObjects().filter((o) => o.stroke === GRID_LINE_COLOR);
      for (const obj of gridLines) {
        canvas.remove(obj);
      }

      // Draw new grid
      const step = canvasSize / Math.max(gridCols, gridRows);
      const maxUnits = Math.max(gridCols, gridRows);
      for (let i = 0; i <= maxUnits; i++) {
        const pos = i * step;
        canvas.add(
          new fabric.Line([pos, 0, pos, canvasSize], {
            stroke: GRID_LINE_COLOR,
            strokeWidth: i === 0 || i === maxUnits ? 2 : 0.5,
            selectable: false,
            evented: false,
          })
        );
        canvas.add(
          new fabric.Line([0, pos, canvasSize, pos], {
            stroke: GRID_LINE_COLOR,
            strokeWidth: i === 0 || i === maxUnits ? 2 : 0.5,
            selectable: false,
            evented: false,
          })
        );
      }
      canvas.renderAll();
    })().catch(() => {
      // Grid redraw failed
    });
  }, [draftCanvasRef, isOpen, canvasSize, gridCols, gridRows]);

  // Draw seam lines, arcs, and patches on canvas + handle mouse events
  useEffect(() => {
    if (!draftCanvasRef.current || !isOpen) return;

    let isMounted = true;
    let cleanup: (() => void) | null = null;

    (async () => {
      const fabric = await import('fabric');
      if (!isMounted) return;
      const canvas = draftCanvasRef.current as InstanceType<typeof fabric.Canvas>;

      // Clear existing user objects (keep grid lines and overlay)
      const toRemove = canvas.getObjects().filter((o) => {
        if (o.stroke === GRID_LINE_COLOR) return false;
        if ((o as unknown as { name?: string }).name === 'overlay-ref') return false;
        return true;
      });
      for (const obj of toRemove) {
        canvas.remove(obj);
      }

      // Draw patch fills
      for (let i = 0; i < patches.length; i++) {
        const patch = patches[i];
        const pixelVerts = patch.vertices.map((v) => ({
          x: v.x * gridSize,
          y: v.y * gridSize,
        }));
        if (pixelVerts.length < 3) continue;

        const fill = patchFills[patch.id] ?? PATCH_COLORS[i % PATCH_COLORS.length];

        const polygon = new fabric.Polygon(pixelVerts, {
          fill,
          stroke: 'transparent',
          strokeWidth: 0,
          selectable: false,
          evented: false,
          opacity: 0.6,
        });
        canvas.add(polygon);
      }

      // Draw seam lines and arcs
      for (const seg of segmentsRef.current) {
        if ('center' in seg) {
          // Arc segment — draw as a Fabric.js path
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
      if (activeMode === 'curve' || activeMode === 'bend') {
        canvas.defaultCursor = 'pointer';
        // Use custom bend cursor
        const canvasEl = canvas.getElement();
        if (canvasEl && activeMode === 'bend') {
          canvasEl.style.cursor = 'url(/cursors/bend.cur) 10 10, pointer';
        }
      } else {
        canvas.defaultCursor = 'crosshair';
      }

      function onMouseDown(e: { e: MouseEvent }) {
        const pointer = canvas.getScenePoint(e.e);

        // ─── Bend tool: click and drag a segment to curve it ─────────────
        if (activeMode === 'bend') {
          const lineSegs = segmentsRef.current
            .map((s, i) => ({ seg: s, idx: i }))
            .filter((s) => !('center' in s.seg));

          const plainSegs = lineSegs.map((s) => s.seg as Segment);
          const hitIdx = findNearestSegment(
            pointer.x,
            pointer.y,
            plainSegs,
            gridSize,
            CURVE_HIT_TOLERANCE
          );
          if (hitIdx === -1) return;

          const originalIdx = lineSegs[hitIdx].idx;
          const seg = segmentsRef.current[originalIdx] as Segment;
          const fromPx = gridPointToPixel(seg.from, gridSize);
          const toPx = gridPointToPixel(seg.to, gridSize);

          bendStateRef.current = {
            segIdx: originalIdx,
            fromPx,
            toPx,
            isDragging: true,
            apexPx: { x: pointer.x, y: pointer.y },
          };
          return;
        }

        // ─── Curve tool: click near a straight segment to convert to arc ───
        if (activeMode === 'curve') {
          const lineSegs = segmentsRef.current
            .map((s, i) => ({ seg: s, idx: i }))
            .filter((s) => !('center' in s.seg));

          const plainSegs = lineSegs.map((s) => s.seg as Segment);
          const hitIdx = findNearestSegment(
            pointer.x,
            pointer.y,
            plainSegs,
            gridSize,
            CURVE_HIT_TOLERANCE
          );
          if (hitIdx === -1) return;

          const originalIdx = lineSegs[hitIdx].idx;
          const seg = segmentsRef.current[originalIdx] as Segment;

          // Compute arc center as midpoint offset perpendicular
          const midRow = (seg.from.row + seg.to.row) / 2;
          const midCol = (seg.from.col + seg.to.col) / 2;

          const arcSeg: ArcSegment = {
            from: seg.from,
            to: seg.to,
            center: { row: midRow, col: midCol },
            clockwise: true,
          };

          setSegments((prev) => {
            const updated = [...prev];
            updated[originalIdx] = arcSeg;
            return updated;
          });
          return;
        }

        // ─── Triangle tool: click a grid cell ─────────────────────────────
        if (activeMode === 'triangle') {
          const cell = pixelToGridCell(pointer.x, pointer.y, gridSize, gridCols, gridRows);
          if (!cell || !isValidCell(cell.row, cell.col, gridCols, gridRows)) return;
          addShapeSegments(generateTriangle(cell.row, cell.col));
          return;
        }

        // ─── Rectangle tool: two-click corners ───────────────────────────
        if (activeMode === 'rectangle') {
          const gridPt = snapToGridPoint(pointer.x, pointer.y);
          if (!gridPt) return;

          if (!startPointRef.current) {
            startPointRef.current = gridPt;
            const px = gridPointToPixel(gridPt, gridSize);
            const dot = new fabric.Circle({
              left: px.x - 4,
              top: px.y - 4,
              radius: 4,
              fill: '#8d4f00',
              selectable: false,
              evented: false,
              stroke: '',
            });
            canvas.add(dot);
            previewRef.current = dot;
            canvas.renderAll();
          } else {
            const start = startPointRef.current;
            if (start.row !== gridPt.row && start.col !== gridPt.col) {
              addShapeSegments(generateRectangle(start.row, start.col, gridPt.row, gridPt.col));
            }
            startPointRef.current = null;
            if (previewRef.current) {
              canvas.remove(previewRef.current as InstanceType<typeof fabric.FabricObject>);
              previewRef.current = null;
            }
          }
          return;
        }

        // ─── Freedraw: continuous grid-snapped segments ──────────────────
        const gridPt = snapToGridPoint(pointer.x, pointer.y);
        if (!gridPt) return;

        if (!startPointRef.current) {
          // First click: set start point
          startPointRef.current = gridPt;
          const px = gridPointToPixel(gridPt, gridSize);
          const dot = new fabric.Circle({
            left: px.x - 4,
            top: px.y - 4,
            radius: 4,
            fill: '#8d4f00',
            selectable: false,
            evented: false,
            stroke: '',
          });
          canvas.add(dot);
          previewRef.current = dot;
          canvas.renderAll();
        } else {
          const startPt = startPointRef.current;
          if (startPt.row === gridPt.row && startPt.col === gridPt.col) return;

          // Draw segment and continue chain from new point
          const newSeg: Segment = { from: startPt, to: gridPt };
          setSegments((prev) => [...prev, newSeg]);

          // Move start indicator to new point
          startPointRef.current = gridPt;
          if (previewRef.current) {
            canvas.remove(previewRef.current as InstanceType<typeof fabric.FabricObject>);
          }
          const px = gridPointToPixel(gridPt, gridSize);
          const dot = new fabric.Circle({
            left: px.x - 4,
            top: px.y - 4,
            radius: 4,
            fill: '#8d4f00',
            selectable: false,
            evented: false,
            stroke: '',
          });
          canvas.add(dot);
          previewRef.current = dot;
          canvas.renderAll();
        }
      }

      function onDoubleClick() {
        // End freedraw chain on double-click
        if (activeMode === 'freedraw') {
          startPointRef.current = null;
          if (previewRef.current) {
            canvas.remove(previewRef.current as InstanceType<typeof fabric.FabricObject>);
            previewRef.current = null;
          }
          canvas.renderAll();
        }
      }

      // ─── Bend: preview arc while dragging ────────────────────────────
      function onMouseMove(e: { e: MouseEvent }) {
        if (activeMode !== 'bend' || !bendStateRef.current?.isDragging) return;
        if (!fabric || !canvas) return;

        const pointer = canvas.getScenePoint(e.e);
        bendStateRef.current.apexPx = { x: pointer.x, y: pointer.y };

        // Remove old preview
        if (previewRef.current) {
          canvas.remove(previewRef.current as InstanceType<typeof fabric.FabricObject>);
          previewRef.current = null;
        }

        const { fromPx, toPx } = bendStateRef.current;

        // Draw preview arc through the apex
        const dx = toPx.x - fromPx.x;
        const dy = toPx.y - fromPx.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len === 0) return;

        // Midpoint of the segment
        const midX = (fromPx.x + toPx.x) / 2;
        const midY = (fromPx.y + toPx.y) / 2;

        // Perpendicular direction
        const perpX = -dy / len;
        const perpY = dx / len;

        // Distance from midpoint to apex along perpendicular
        const apexOffset = (pointer.x - midX) * perpX + (pointer.y - midY) * perpY;

        // Arc radius: distance from endpoints to center
        // The center is on the perpendicular bisector at distance |apexOffset|/2 from midpoint
        const centerDist = Math.abs(apexOffset) / 2;
        const halfLen = len / 2;
        const radius = Math.sqrt(centerDist * centerDist + halfLen * halfLen);

        // Determine sweep direction
        const sweepFlag = apexOffset > 0 ? 1 : 0;

        const pathStr = `M ${fromPx.x} ${fromPx.y} A ${radius} ${radius} 0 0 ${sweepFlag} ${toPx.x} ${toPx.y}`;
        const pathObj = new fabric.Path(pathStr, {
          fill: '',
          stroke: '#FF6B00',
          strokeWidth: SEAM_LINE_WIDTH,
          selectable: false,
          evented: false,
          strokeDashArray: [6, 3],
        });
        canvas.add(pathObj);
        previewRef.current = pathObj;
        canvas.renderAll();
      }

      function onMouseUp() {
        if (activeMode !== 'bend' || !bendStateRef.current) return;
        if (!fabric || !canvas) return;

        const state = bendStateRef.current;
        bendStateRef.current = null;

        // Remove preview
        if (previewRef.current) {
          canvas.remove(previewRef.current as InstanceType<typeof fabric.FabricObject>);
          previewRef.current = null;
        }

        // Calculate arc parameters from the final apex position
        const apexPx = state.apexPx!;
        const { fromPx, toPx } = state;

        const dx = toPx.x - fromPx.x;
        const dy = toPx.y - fromPx.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len === 0) return;

        const midX = (fromPx.x + toPx.x) / 2;
        const midY = (fromPx.y + toPx.y) / 2;
        const perpX = -dy / len;
        const perpY = dx / len;
        const apexOffset = (apexPx.x - midX) * perpX + (apexPx.y - midY) * perpY;

        // Only apply if there's significant bend
        if (Math.abs(apexOffset) < 5) return;

        // Convert back to grid coordinates to find the nearest arc center
        const seg = segmentsRef.current[state.segIdx] as Segment | undefined;
        if (!seg || 'center' in (seg as DrawSegment)) return;

        const midRow = (seg.from.row + seg.to.row) / 2;
        const midCol = (seg.from.col + seg.to.col) / 2;

        // Determine arc direction based on bend direction
        const sweepFlag = apexOffset > 0 ? 1 : 0;

        const arcSeg: ArcSegment = {
          from: seg.from,
          to: seg.to,
          center: { row: midRow, col: midCol },
          clockwise: sweepFlag === 1,
        };

        setSegments((prev) => {
          const updated = [...prev];
          updated[state.segIdx] = arcSeg;
          return updated;
        });

        canvas.renderAll();
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
    activeMode,
    gridSize,
    gridCols,
    gridRows,
    snapToGridPoint,
    addShapeSegments,
  ]);

  const clearSegments = useCallback(() => {
    setSegments([]);
    setPatchFills({});
    startPointRef.current = null;
  }, []);

  const undoSegment = useCallback(() => {
    setSegments((prev) => (prev.length > 0 ? prev.slice(0, -1) : prev));
    startPointRef.current = null;
  }, []);

  return {
    activeMode,
    setActiveMode,
    segments,
    patches,
    patchFills,
    clearSegments,
    undoSegment,
    redrawGrid,
  };
}
