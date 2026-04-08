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
  type GridPoint,
} from '@/lib/blockbuilder-utils';
import {
  generateTriangle,
  generateRectangle,
  generateBend,
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

  // Bend tool state
  const bendStateRef = useRef<{
    segmentIndex: number;
    segment: Segment;
  } | null>(null);
  const bendCenterRef = useRef<GridPoint | null>(null);
  const bendPreviewRef = useRef<unknown>(null);

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

      // Set cursor based on mode
      canvas.selection = false;
      canvas.defaultCursor = activeMode === 'bend' ? 'pointer' : 'crosshair';

      function onMouseDown(e: { e: MouseEvent }) {
        const pointer = canvas.getScenePoint(e.e);

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

        // ─── Bend tool: click a segment, drag to curve it ────────────────
        if (activeMode === 'bend') {
          const lineSegments = segmentsRef.current.filter((s): s is Segment => !('center' in s));
          const SNAP_TOLERANCE = gridSize * 0.5;
          const filteredIdx = findNearestSegment(pointer.x, pointer.y, lineSegments, gridSize, SNAP_TOLERANCE);
          if (filteredIdx < 0) return;

          const seg = lineSegments[filteredIdx];
          // Find the actual index in the full segments array
          const realIdx = segmentsRef.current.findIndex(
            (s) =>
              !('center' in s) &&
              s.from.row === seg.from.row &&
              s.from.col === seg.from.col &&
              s.to.row === seg.to.row &&
              s.to.col === seg.to.col
          );
          if (realIdx < 0) return;

          bendStateRef.current = { segmentIndex: realIdx, segment: seg };
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

      function onMouseMove(e: { e: MouseEvent }) {
        // ─── Bend tool preview ───────────────────────────────────────────
        if (activeMode !== 'bend' || !bendStateRef.current) return;

        const pointer = canvas.getScenePoint(e.e);
        const centerGridPt = snapToGridPoint(pointer.x, pointer.y);
        if (!centerGridPt) return;

        bendCenterRef.current = centerGridPt;

        const { segment } = bendStateRef.current;
        const arc = generateBend(segment, centerGridPt);
        const fromPx = gridPointToPixel(arc.from, gridSize);
        const toPx = gridPointToPixel(arc.to, gridSize);
        const centerPx = gridPointToPixel(arc.center, gridSize);
        const dx = fromPx.x - centerPx.x;
        const dy = fromPx.y - centerPx.y;
        const radius = Math.sqrt(dx * dx + dy * dy);
        const sweepFlag = arc.clockwise ? 1 : 0;

        // Remove old preview
        if (bendPreviewRef.current) {
          canvas.remove(bendPreviewRef.current as InstanceType<typeof fabric.FabricObject>);
        }

        // Draw preview arc
        const pathStr = `M ${fromPx.x} ${fromPx.y} A ${radius} ${radius} 0 0 ${sweepFlag} ${toPx.x} ${toPx.y}`;
        const pathObj = new fabric.Path(pathStr, {
          fill: '',
          stroke: '#f97316',
          strokeWidth: SEAM_LINE_WIDTH,
          strokeDashArray: [6, 4],
          selectable: false,
          evented: false,
        });
        canvas.add(pathObj);
        bendPreviewRef.current = pathObj;
        canvas.renderAll();
      }

      function onMouseUp() {
        // ─── Bend tool commit ────────────────────────────────────────────
        if (activeMode !== 'bend' || !bendStateRef.current || !bendCenterRef.current) {
          bendStateRef.current = null;
          bendCenterRef.current = null;
          return;
        }

        // Remove preview
        if (bendPreviewRef.current) {
          canvas.remove(bendPreviewRef.current as InstanceType<typeof fabric.FabricObject>);
          bendPreviewRef.current = null;
        }

        const { segmentIndex, segment } = bendStateRef.current;
        const center = bendCenterRef.current;
        bendStateRef.current = null;
        bendCenterRef.current = null;

        // Generate the arc and replace the straight segment at the known index
        const arc = generateBend(segment, center);
        setSegments((prev) => {
          // Verify the segment still exists at this index
          const existing = prev[segmentIndex];
          if (
            !existing ||
            'center' in existing ||
            existing.from.row !== segment.from.row ||
            existing.from.col !== segment.from.col ||
            existing.to.row !== segment.to.row ||
            existing.to.col !== segment.to.col
          ) {
            return prev;
          }
          const next = [...prev];
          next[segmentIndex] = arc;
          return next;
        });

        canvas.renderAll();
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
