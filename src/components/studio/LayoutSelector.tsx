'use client';

import { useLayoutStore } from '@/stores/layoutStore';
import { LAYOUT_PRESETS, type LayoutPreset } from '@/lib/layout-library';
import type { LayoutType } from '@/lib/layout-utils';

interface LayoutSelectorProps {
  onSelect?: (preset: LayoutPreset | null) => void;
  onClose?: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  grid: 'Straight Set',
  sashing: 'Sashing',
  'on-point': 'On-Point',
};

function LayoutThumbnail({ preset }: { readonly preset: LayoutPreset }) {
  const { rows, cols } = preset.config;
  const isSashing = preset.category === 'sashing';
  const isOnPoint = preset.category === 'on-point';
  const gridCols = Math.min(cols, 5);
  const gridRows = Math.min(rows, 5);

  return (
    <div className="w-10 h-10 bg-surface-container rounded-md flex items-center justify-center p-1">
      <div
        className={`grid ${isSashing ? 'gap-[3px]' : 'gap-px'}`}
        style={{
          gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
          gridTemplateRows: `repeat(${gridRows}, 1fr)`,
          transform: isOnPoint ? 'rotate(45deg) scale(0.75)' : undefined,
        }}
      >
        {Array.from({ length: gridRows * gridCols }).map((_, i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-[1px]"
            style={{
              backgroundColor: 'var(--color-primary)',
              opacity: 0.7,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function FreeCanvasThumbnail() {
  return (
    <div className="w-10 h-10 bg-surface-container rounded-md flex items-center justify-center">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-primary">
        <rect x="2" y="2" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" />
        <path d="M10 6v8M6 10h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export function LayoutSelector({ onSelect, onClose }: LayoutSelectorProps) {
  const setLayoutType = useLayoutStore((s) => s.setLayoutType);
  const setSelectedPreset = useLayoutStore((s) => s.setSelectedPreset);
  const setRows = useLayoutStore((s) => s.setRows);
  const setCols = useLayoutStore((s) => s.setCols);
  const setBlockSize = useLayoutStore((s) => s.setBlockSize);
  const setSashing = useLayoutStore((s) => s.setSashing);
  const selectedPresetId = useLayoutStore((s) => s.selectedPresetId);
  const layoutType = useLayoutStore((s) => s.layoutType);

  const handleSelectPreset = (preset: LayoutPreset) => {
    setLayoutType(preset.config.type as LayoutType);
    setSelectedPreset(preset.id);
    setRows(preset.config.rows);
    setCols(preset.config.cols);
    setBlockSize(preset.config.blockSize);
    setSashing(preset.config.sashing);
    onSelect?.(preset);
  };

  const handleFreeCanvas = () => {
    setLayoutType('free-form');
    setSelectedPreset(null);
    onSelect?.(null);
  };

  const isActive = (presetId: string) =>
    selectedPresetId === presetId && layoutType !== 'free-form' && layoutType !== 'none';

  const isFreeActive = layoutType === 'free-form';

  const grouped = LAYOUT_PRESETS.reduce<Record<string, LayoutPreset[]>>((acc, p) => {
    const key = p.category;
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* Free Canvas option */}
      <button
        type="button"
        onClick={handleFreeCanvas}
        className={`w-full flex items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${
          isFreeActive
            ? 'bg-primary/10 border-2 border-primary'
            : 'bg-surface-container hover:bg-surface-container-high border-2 border-transparent'
        }`}
      >
        <FreeCanvasThumbnail />
        <div>
          <p className="text-sm font-medium text-on-surface">No Layout (Free Canvas)</p>
          <p className="text-xs text-secondary">Place blocks anywhere on the canvas</p>
        </div>
      </button>

      {/* Layout presets grouped by category */}
      {Object.entries(grouped).map(([category, presets]) => (
        <div key={category}>
          <h4 className="text-xs font-semibold text-secondary uppercase tracking-wider mb-2 px-1">
            {CATEGORY_LABELS[category] ?? category}
          </h4>
          <div className="space-y-1.5">
            {presets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`w-full flex items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${
                  isActive(preset.id)
                    ? 'bg-primary/10 border-2 border-primary'
                    : 'bg-surface-container hover:bg-surface-container-high border-2 border-transparent'
                }`}
              >
                <LayoutThumbnail preset={preset} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-on-surface">{preset.name}</p>
                  <p className="text-xs text-secondary truncate">{preset.description}</p>
                </div>
                {preset.config.sashing.width > 0 && (
                  <span className="text-[10px] text-secondary bg-surface-container-high px-1.5 py-0.5 rounded-full shrink-0">
                    Sashing
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      ))}

      {onClose && (
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-4 py-2 text-sm font-medium text-secondary hover:bg-surface-container transition-colors"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
