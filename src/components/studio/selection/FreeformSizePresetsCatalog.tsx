'use client';

import { FREEFORM_SIZE_PRESETS, type FreeformSizePreset } from './layout-helpers';

interface FreeformSizePresetsCatalogProps {
  readonly selectedId: string | null;
  readonly onSelect: (preset: FreeformSizePreset) => void;
}

export function FreeformSizePresetsCatalog({ selectedId, onSelect }: FreeformSizePresetsCatalogProps) {
  return (
    <>
      <div className="flex items-center px-4 py-3 border-b border-[var(--color-border)]/50 flex-shrink-0">
        <h2 className="text-[16px] font-semibold text-[var(--color-text)]">Quilt Size</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-1 gap-3">
          {FREEFORM_SIZE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelect(preset)}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-colors duration-150 text-left ${
                selectedId === preset.id
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                  : 'bg-[var(--color-bg)] border-[var(--color-border)]/30 hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-surface)]'
              }`}
            >
              <div className="flex-1 min-w-0">
                <h3 className="text-[14px] font-semibold text-[var(--color-text)]">{preset.name}</h3>
                <p className="text-[12px] text-[var(--color-text-dim)] mt-0.5">
                  {preset.description}
                </p>
                <p className="text-[11px] font-mono text-[var(--color-text-dim)] mt-1">
                  {preset.width}″ × {preset.height}″
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
