'use client';

import { BlockBuilderToolbar } from './BlockBuilderToolbar';
import type { DraftTabProps } from '@/components/studio/BlockBuilderWorktable';

type BlockBuilderTabProps = DraftTabProps;

const MODE_HINTS: Record<BlockBuilderTabProps['activeMode'], string> = {
  pencil: 'Click to start drawing. Click again to add segments. Double-click to finish.',
  rectangle: 'Click 2 grid points for opposite corners.',
  circle: 'Click for center, drag outward for radius.',
  bend: 'Click a seam line, then click a grid point to curve it.',
};

export function BlockBuilderTab({
  cellSizeIn = 1,
  onCellSizeInChange,
  activeMode,
  setActiveMode,
  segmentCount,
  onClear,
  onUndoSegment,
}: BlockBuilderTabProps) {
  // Slider value: 0.25 to 2.0 in 0.25 increments (1 to 8 steps)
  const sliderValue = Math.round(cellSizeIn / 0.25);
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value) * 0.25;
    if (onCellSizeInChange) onCellSizeInChange(val);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Grid unit slider */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-secondary">Grid Unit</span>
          <span className="text-[10px] font-mono text-secondary bg-surface-container py-0.5 px-1.5 rounded">
            {cellSizeIn < 1 ? `${cellSizeIn * 16}"` : `${cellSizeIn}"`}
          </span>
        </div>
        <input
          type="range"
          min={1}
          max={8}
          step={1}
          value={sliderValue}
          onChange={handleSliderChange}
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-[9px] text-secondary mt-0.5">
          <span>¼&quot;</span>
          <span>½&quot;</span>
          <span>1&quot;</span>
          <span>1½&quot;</span>
          <span>2&quot;</span>
        </div>
      </div>

      {/* Tools toolbar */}
      <BlockBuilderToolbar
        activeMode={activeMode}
        onModeChange={setActiveMode}
        segmentCount={segmentCount}
        onClear={onClear}
        onUndoSegment={onUndoSegment}
      />

      {/* Tool hint */}
      <div className="text-[10px] text-secondary">{MODE_HINTS[activeMode]}</div>
    </div>
  );
}
