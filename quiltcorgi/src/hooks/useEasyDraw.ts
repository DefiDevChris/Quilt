'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { EasyDrawMode } from '@/components/blocks/EasyDrawToolbar';
import {
  detectPatches,
  gridPointToPixel,
  type Segment,
  type DrawSegment,
  type Patch,
} from '@/lib/easydraw-utils';

interface UseEasyDrawOptions {
  draftCanvasRef: React.MutableRefObject<unknown>;
  isOpen: boolean;
  fillColor: string;
  strokeColor: string;
  gridCols: number;
  gridRows: number;
  canvasSize: number;
}

interface UseEasyDrawReturn {
  activeMode: EasyDrawMode;
  setActiveMode: (mode: EasyDrawMode) => void;
  segments: readonly DrawSegment[];
  patches: readonly Patch[];
  clearSegments: () => void;
  undoSegment: () => void;
}

const SNAP_RADIUS_FRACTION = 0.3;
const SEAM_LINE_COLOR = '#383831';
const SEAM_LINE_WIDTH = 2;

// Default patch fill colors for auto-coloring
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

export function useEasyDraw({
  draftCanvasRef,
  isOpen,
  fillColor,
  strokeColor,
  gridCols,
  gridRows,
  canvasSize,
}: UseEasyDrawOptions): UseEasyDrawReturn {
  const [activeMode, setActiveMode] = useState<EasyDrawMode>('line');
  const [segments, setSegments] = useState<readonly DrawSegment[]>([]);
  const [patches, setPatches] = useState<readonly Patch[]>([]);
  const segmentsRef = useRef(segments);
  segmentsRef.current = segments;
  const startPointRef = useRef<{ row: number; col: number } | null>(null);
  const previewLineRef = useRef<unknown>(null);

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

  // Recompute patches whenever segments change
  useEffect(() => {
    const lineSegments = segments.filter((s): s is Segment => !('center' in s));
    const newPatches = detectPatches(lineSegments, gridCols, gridRows);
    setPatches(newPatches);
  }, [segments, gridCols, gridRows]);

  // Draw seam lines and patches on canvas
  useEffect(() => {
    if (!draftCanvasRef.current || !isOpen) return;

    let isMounted = true;
    let cleanup: (() => void) | null = null;

    (async () => {
      const fabric = await import('fabric');
      if (!isMounted) return;
      const canvas = draftCanvasRef.current as InstanceType<typeof fabric.Canvas>;

      // Clear existing user objects (keep grid lines)
      const toRemove = canvas.getObjects().filter((o) => o.stroke !== '#E5E2DD');
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

        const polygon = new fabric.Polygon(pixelVerts, {
          fill: PATCH_COLORS[i % PATCH_COLORS.length],
          stroke: 'transparent',
          strokeWidth: 0,
          selectable: true,
          evented: true,
          opacity: 0.6,
        });
        canvas.add(polygon);
      }

      // Draw seam lines
      for (const seg of segmentsRef.current) {
        if ('center' in seg) continue;
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

      canvas.renderAll();

      // Mouse interaction for drawing new segments
      if (activeMode === 'select') {
        canvas.selection = true;
        canvas.defaultCursor = 'default';
        return;
      }

      canvas.selection = false;
      canvas.defaultCursor = 'crosshair';

      function onMouseDown(e: { e: MouseEvent }) {
        const pointer = canvas.getScenePoint(e.e);
        const gridPt = snapToGridPoint(pointer.x, pointer.y);
        if (!gridPt) return;

        if (!startPointRef.current) {
          // First click — set start point
          startPointRef.current = gridPt;

          // Draw snap indicator
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
          previewLineRef.current = dot;
          canvas.renderAll();
        } else {
          // Second click — complete segment
          const startPt = startPointRef.current;
          if (startPt.row === gridPt.row && startPt.col === gridPt.col) return;

          const newSeg: Segment = { from: startPt, to: gridPt };
          setSegments((prev) => [...prev, newSeg]);

          startPointRef.current = null;
          if (previewLineRef.current) {
            canvas.remove(previewLineRef.current as InstanceType<typeof fabric.FabricObject>);
            previewLineRef.current = null;
          }
        }
      }

      canvas.on('mouse:down', onMouseDown as never);

      cleanup = () => {
        canvas.off('mouse:down', onMouseDown as never);
      };
    })();

    return () => {
      isMounted = false;
      cleanup?.();
    };
  }, [
    isOpen,
    draftCanvasRef,
    patches,
    activeMode,
    gridSize,
    gridCols,
    gridRows,
    snapToGridPoint,
  ]);

  const clearSegments = useCallback(() => {
    setSegments([]);
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
    clearSegments,
    undoSegment,
  };
}
