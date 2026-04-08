'use client';

import { useState, useEffect } from 'react';
import type { DraftTabProps } from './BlockDraftingShell';
import { BlockBuilderToolbar } from './BlockBuilderToolbar';
import { useBlockBuilder } from '@/hooks/useBlockBuilder';
import { GRID_UNIT_PRESETS, type GridUnitPreset } from '@/lib/block-builder-engine';

const DRAFT_CANVAS_SIZE = 400;

interface BlockBuilderTabProps extends DraftTabProps {
  cellSizeIn?: number;
  onCellSizeInChange?: (units: number) => void;
}

export function BlockBuilderTab({
  draftCanvasRef,
  fillColor,
  strokeColor,
  isOpen,
  cellSizeIn = 3,
  onCellSizeInChange,
  blockWidthIn = 12,
  blockHeightIn = 12,
}: BlockBuilderTabProps) {
  const [customUnits, setCustomUnits] = useState('');

  const gridCols = Math.max(1, Math.round(blockWidthIn / cellSizeIn));
  const gridRows = Math.max(1, Math.round(blockHeightIn / cellSizeIn));

  const { activeMode, setActiveMode, segments, clearSegments, undoSegment, redrawGrid } =
    useBlockBuilder({
      draftCanvasRef,
      isOpen,
      fillColor,
      strokeColor,
      gridCols,
      gridRows,
      canvasSize: DRAFT_CANVAS_SIZE,
    });

  // Redraw grid when units change
  useEffect(() => {
    if (isOpen) {
      redrawGrid();
    }
  }, [isOpen, gridCols, gridRows, redrawGrid]);

  const presetCells = [1.5, 2, 3, 4];

  const handlePresetChange = (size: number) => {
    if (onCellSizeInChange) onCellSizeInChange(size);
    setCustomUnits('');
  };

  const handleCustomUnitsSubmit = () => {
    const val = parseFloat(customUnits);
    if (val >= 0.5 && val <= 24 && onCellSizeInChange) {
      onCellSizeInChange(val);
    }
  };

  const isCustom = !presetCells.includes(cellSizeIn);

  return (
    <div className="mb-2 space-y-2 px-1">
      {/* Grid unit selector */}
      <div className="flex items-center gap-1">
        <span className="text-xs font-medium text-secondary">Cell Size (in):</span>
        <div className="flex gap-1">
          {presetCells.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => handlePresetChange(size)}
              className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${cellSizeIn === size && !isCustom
                ? 'bg-gradient-to-r from-orange-500 to-rose-400 text-white'
                : 'bg-background text-secondary hover:text-on-surface'
                }`}
            >
              {size}&quot;
            </button>
          ))}
          <input
            type="number"
            step={0.5}
            min={0.5}
            max={24}
            value={isCustom ? cellSizeIn : customUnits}
            onChange={(e) => setCustomUnits(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCustomUnitsSubmit();
            }}
            onBlur={handleCustomUnitsSubmit}
            placeholder="#"
            className={`w-10 rounded-md border px-1.5 py-1 text-xs ${isCustom
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-outline-variant bg-white text-secondary'
              } focus:border-primary focus:outline-none`}
          />
        </div>
        <div className="ml-auto text-[10px] text-secondary font-mono tracking-tight bg-surface-container py-0.5 px-1.5 rounded">
          Grid: {gridCols} × {gridRows}
        </div>
      </div>

      {/* Tools toolbar */}
      <BlockBuilderToolbar
        activeMode={activeMode}
        onModeChange={setActiveMode}
        segmentCount={segments.length}
        onClear={clearSegments}
        onUndoSegment={undoSegment}
      />

      {/* Tool hint */}
      <div className="text-[10px] text-secondary">
        {activeMode === 'freedraw' &&
          'Click and drag to draw freehand. Lines snap to grid on release.'}
        {activeMode === 'rectangle' && 'Click two grid corners to draw a rectangle.'}
        {activeMode === 'triangle' && 'Click a grid cell to split it diagonally.'}
        {activeMode === 'curve' && 'Click a straight seam line to curve it.'}
      </div>
    </div>
  );
}
