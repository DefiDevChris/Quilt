'use client';

import { useState, useEffect } from 'react';
import type { DraftTabProps } from './BlockDraftingShell';
import { BlockBuilderToolbar } from './BlockBuilderToolbar';
import { useBlockBuilder } from '@/hooks/useBlockBuilder';
import { GRID_UNIT_PRESETS, type GridUnitPreset } from '@/lib/block-builder-engine';

const DRAFT_CANVAS_SIZE = 400;

interface BlockBuilderTabProps extends DraftTabProps {
  gridUnits: number;
  onGridUnitsChange: (units: number) => void;
}

export function BlockBuilderTab({
  draftCanvasRef,
  fillColor,
  strokeColor,
  isOpen,
  gridUnits,
  onGridUnitsChange,
}: BlockBuilderTabProps) {
  const [customUnits, setCustomUnits] = useState('');

  const { activeMode, setActiveMode, segments, clearSegments, undoSegment, redrawGrid } =
    useBlockBuilder({
      draftCanvasRef,
      isOpen,
      fillColor,
      strokeColor,
      gridCols: gridUnits,
      gridRows: gridUnits,
      canvasSize: DRAFT_CANVAS_SIZE,
    });

  // Redraw grid when units change
  useEffect(() => {
    if (isOpen) {
      redrawGrid();
    }
  }, [isOpen, gridUnits, redrawGrid]);

  const handlePresetChange = (preset: GridUnitPreset) => {
    onGridUnitsChange(preset.cols);
    setCustomUnits('');
  };

  const handleCustomUnitsSubmit = () => {
    const val = parseInt(customUnits, 10);
    if (val >= 2 && val <= 24) {
      onGridUnitsChange(val);
    }
  };

  const isCustom = !GRID_UNIT_PRESETS.some((p) => p.cols === gridUnits);

  return (
    <div className="mb-2 space-y-2 px-1">
      {/* Grid unit selector */}
      <div className="flex items-center gap-1">
        <span className="text-xs font-medium text-secondary">Grid:</span>
        <div className="flex gap-1">
          {GRID_UNIT_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => handlePresetChange(preset)}
              className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                gridUnits === preset.cols && !isCustom
                  ? 'bg-primary text-white'
                  : 'bg-background text-secondary hover:text-on-surface'
              }`}
            >
              {preset.label}
            </button>
          ))}
          <input
            type="number"
            min={2}
            max={24}
            value={isCustom ? gridUnits : customUnits}
            onChange={(e) => setCustomUnits(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCustomUnitsSubmit();
            }}
            onBlur={handleCustomUnitsSubmit}
            placeholder="#"
            className={`w-10 rounded-md border px-1.5 py-1 text-xs ${
              isCustom
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-outline-variant bg-white text-secondary'
            } focus:border-primary focus:outline-none`}
          />
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
          'Click grid points to draw straight seam lines. Double-click to end.'}
        {activeMode === 'rectangle' && 'Click two grid corners to draw a rectangle.'}
        {activeMode === 'triangle' && 'Click a grid cell to split it diagonally.'}
        {activeMode === 'curve' && 'Click a straight seam line to curve it.'}
      </div>
    </div>
  );
}
