'use client';

import { useCanvasStore } from '@/stores/canvasStore';
import { getUnitLabel } from '@/lib/canvas-utils';

interface GridSettingsPanelProps {
  onClose: () => void;
}

export function GridSettingsPanel({ onClose }: GridSettingsPanelProps) {
  const gridSettings = useCanvasStore((s) => s.gridSettings);
  const setGridSettings = useCanvasStore((s) => s.setGridSettings);
  const unitSystem = useCanvasStore((s) => s.unitSystem);
  const fabricCanvas = useCanvasStore((s) => s.fabricCanvas);
  const unit = getUnitLabel(unitSystem);

  function update(updates: Partial<typeof gridSettings>) {
    setGridSettings(updates);
    if (fabricCanvas) {
      (fabricCanvas as { renderAll: () => void }).renderAll();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40">
      <div className="w-full max-w-sm rounded-xl bg-surface shadow-elevation-3 p-6">
        <h2 className="text-lg font-semibold text-on-surface mb-4">Grid Settings</h2>

        <div className="space-y-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={gridSettings.enabled}
              onChange={(e) => update({ enabled: e.target.checked })}
              className="rounded accent-primary"
            />
            <span className="text-sm text-secondary">Show grid</span>
          </label>

          {gridSettings.enabled && (
            <>
              <div>
                <label htmlFor="grid-size-input" className="block text-xs text-secondary mb-1">
                  Grid size ({unit})
                </label>
                <input
                  id="grid-size-input"
                  type="number"
                  min={0.125}
                  max={12}
                  step={0.125}
                  value={gridSettings.size}
                  onChange={(e) => update({ size: parseFloat(e.target.value) || 1 })}
                  className="w-24 rounded-sm border border-outline-variant bg-surface px-3 py-1.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={gridSettings.snapToGrid}
                  onChange={(e) => update({ snapToGrid: e.target.checked })}
                  className="rounded accent-primary"
                />
                <span className="text-sm text-secondary">Snap to grid</span>
              </label>
            </>
          )}
        </div>

        <div className="flex justify-end mt-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
