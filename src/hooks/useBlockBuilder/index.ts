'use client';

import { useEffect, useCallback } from 'react';
import { detectPatches, gridPointToPixel } from '@/lib/blockbuilder-utils';
import type { BlockBuilderMode } from '@/components/studio/BlockBuilderWorktable';
import type { DrawSegment, Patch, Segment } from './types';
import { useSegments } from './useSegments';
import { usePencilTool } from './usePencilTool';
import { useRectangleTool } from './useRectangleTool';
import { useCircleTool } from './useCircleTool';
import { useTriangleTool } from './useTriangleTool';
import { useBendTool } from './useBendTool';
import { useBlockBuilderCanvas } from './useBlockBuilderCanvas';

const SNAP_RADIUS_FRACTION = 0.3;

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

export function useBlockBuilder({
  draftCanvasRef,
  isOpen,
  gridCols,
  gridRows,
  canvasSize,
  activeMode,
}: UseBlockBuilderOptions): UseBlockBuilderReturn {
  const gridSize = canvasSize / Math.max(gridCols, gridRows);

  // ── Snap helpers ──────────────────────────────────────────────────────────
  const snapToGridPoint = useCallback(
    (x: number, y: number) => {
      const col = Math.round(x / gridSize);
      const row = Math.round(y / gridSize);
      const snapX = col * gridSize;
      const snapY = row * gridSize;
      const dist = Math.sqrt((x - snapX) ** 2 + (y - snapY) ** 2);
      if (dist <= gridSize * SNAP_RADIUS_FRACTION && row >= 0 && row <= gridRows && col >= 0 && col <= gridCols) {
        return { row, col };
      }
      return null;
    },
    [gridSize, gridCols, gridRows]
  );

  const snapToNearestGridPoint = useCallback(
    (x: number, y: number) => ({
      col: Math.max(0, Math.min(gridCols, Math.round(x / gridSize))),
      row: Math.max(0, Math.min(gridRows, Math.round(y / gridSize))),
    }),
    [gridSize, gridCols, gridRows]
  );

  const snap = { gridSize, gridCols, gridRows, snapToGridPoint, snapToNearestGridPoint };

  // ── Segment state ─────────────────────────────────────────────────────────
  const {
    segments, patches, setPatches, patchFills, selectedPatchId,
    segmentsRef, addShapeSegments, setPatchFill,
    clearSegments: baseClear, undoSegment, replaceSegmentAt,
  } = useSegments(gridCols, gridRows);

  // ── Patch detection ───────────────────────────────────────────────────────
  useEffect(() => {
    const lineSegments = segments.filter((s): s is Segment => !('center' in s));
    const newPatches = detectPatches(lineSegments, gridCols, gridRows);
    setPatches(newPatches);
    import('@/stores/blockBuilderStore').then(({ useBlockBuilderStore }) => {
      useBlockBuilderStore.getState().setCounts(segments.length, newPatches.length);
    });
  }, [segments, gridCols, gridRows, setPatches]);

  // ── Nearest segment finder (for bend tool) ────────────────────────────────
  const findNearestSegment = useCallback(
    (x: number, y: number, segsArr: readonly Segment[], tolerance: number) => {
      let bestIdx = -1;
      let bestDist = Infinity;
      for (let i = 0; i < segsArr.length; i++) {
        const seg = segsArr[i];
        const fromPx = gridPointToPixel(seg.from, gridSize);
        const toPx = gridPointToPixel(seg.to, gridSize);
        const dx = toPx.x - fromPx.x;
        const dy = toPx.y - fromPx.y;
        const lenSq = dx * dx + dy * dy;
        let dist: number;
        if (lenSq === 0) {
          dist = Math.sqrt((x - fromPx.x) ** 2 + (y - fromPx.y) ** 2);
        } else {
          const t = Math.max(0, Math.min(1, ((x - fromPx.x) * dx + (y - fromPx.y) * dy) / lenSq));
          dist = Math.sqrt((x - (fromPx.x + t * dx)) ** 2 + (y - (fromPx.y + t * dy)) ** 2);
        }
        if (dist < bestDist) { bestDist = dist; bestIdx = i; }
      }
      return bestDist <= tolerance && bestIdx >= 0 ? { index: bestIdx, seg: segsArr[bestIdx] } : null;
    },
    [gridSize]
  );

  const segHelpers = { segmentsRef, addShapeSegments, findNearestSegment, replaceSegmentAt };

  // ── Tool hooks ────────────────────────────────────────────────────────────
  const pencil = usePencilTool(snap, segHelpers);
  const rectangle = useRectangleTool(snap, segHelpers);
  const circle = useCircleTool(snap, segHelpers);
  const triangle = useTriangleTool(snap, segHelpers);
  const bend = useBendTool(snap, segHelpers);

  type AnyTool = typeof pencil | typeof rectangle | typeof circle | typeof triangle | typeof bend | null;
  const tools: Record<BlockBuilderMode, AnyTool> = {
    select: null,
    pencil,
    rectangle,
    circle,
    triangle,
    bend,
  };

  // ── Canvas rendering + event wiring ───────────────────────────────────────
  useBlockBuilderCanvas({
    draftCanvasRef, isOpen, canvasSize, gridCols, gridRows,
    activeMode, segments, patches, patchFills, selectedPatchId,
    snap, segs: segHelpers, tools,
  });

  // ── Clear resets all tool state ───────────────────────────────────────────
  const clearSegments = useCallback(() => {
    baseClear();
    pencil.reset();
    rectangle.reset();
    circle.reset();
    triangle.reset();
    bend.reset();
  }, [baseClear, pencil, rectangle, circle, triangle, bend]);

  return { segments, patches, patchFills, selectedPatchId, clearSegments, undoSegment, setPatchFill };
}
