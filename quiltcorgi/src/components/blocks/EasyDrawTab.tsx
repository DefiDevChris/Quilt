'use client';

import { EasyDrawToolbar } from './EasyDrawToolbar';
import { useEasyDraw } from '@/hooks/useEasyDraw';
import type { DraftTabProps } from './BlockDraftingShell';

const GRID_COLS = 12;
const GRID_ROWS = 12;
const CANVAS_SIZE = 400;

export function EasyDrawTab({
  draftCanvasRef,
  fillColor,
  strokeColor,
  isOpen,
}: DraftTabProps) {
  const {
    activeMode,
    setActiveMode,
    segments,
    clearSegments,
    undoSegment,
  } = useEasyDraw({
    draftCanvasRef,
    isOpen,
    fillColor,
    strokeColor,
    gridCols: GRID_COLS,
    gridRows: GRID_ROWS,
    canvasSize: CANVAS_SIZE,
  });

  return (
    <EasyDrawToolbar
      activeMode={activeMode}
      onModeChange={setActiveMode}
      segmentCount={segments.length}
      onClear={clearSegments}
      onUndoSegment={undoSegment}
    />
  );
}
