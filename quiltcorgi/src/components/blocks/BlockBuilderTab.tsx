'use client';

import { BlockBuilderToolbar } from './BlockBuilderToolbar';
import { useBlockBuilder } from '@/hooks/useBlockBuilder';
import type { DraftTabProps } from './BlockDraftingShell';

const GRID_COLS = 12;
const GRID_ROWS = 12;
const CANVAS_SIZE = 400;

export function BlockBuilderTab({ draftCanvasRef, fillColor, strokeColor, isOpen }: DraftTabProps) {
  const { activeMode, setActiveMode, segments, clearSegments, undoSegment } = useBlockBuilder({
    draftCanvasRef,
    isOpen,
    fillColor,
    strokeColor,
    gridCols: GRID_COLS,
    gridRows: GRID_ROWS,
    canvasSize: CANVAS_SIZE,
  });

  return (
    <BlockBuilderToolbar
      activeMode={activeMode}
      onModeChange={setActiveMode}
      segmentCount={segments.length}
      onClear={clearSegments}
      onUndoSegment={undoSegment}
    />
  );
}
