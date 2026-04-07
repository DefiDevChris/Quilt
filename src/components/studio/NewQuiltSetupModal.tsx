'use client';

import { useCallback, useState } from 'react';
import { QUILT_SIZE_PRESETS } from '@/lib/constants';

interface Props {
  readonly isOpen: boolean;
  readonly onConfirm: (args: { width: number; height: number; openLayouts: boolean }) => void;
  readonly onDismiss: () => void;
}

/**
 * First-visit setup modal for a brand-new quilt project. The user picks
 * a finished quilt size (preset or custom) and optionally jumps straight
 * to the Layouts library tab. The chosen dimensions become the source of
 * truth — layouts dropped onto the canvas later will fit inside this size.
 */
export function NewQuiltSetupModal({ isOpen, onConfirm, onDismiss }: Props) {
  const [selectedPreset, setSelectedPreset] = useState<string>('Throw');
  const [customW, setCustomW] = useState('');
  const [customH, setCustomH] = useState('');
  const [openLayouts, setOpenLayouts] = useState(true);

  const isCustom = selectedPreset === 'Custom';

  const handleConfirm = useCallback(() => {
    let width: number;
    let height: number;
    if (isCustom) {
      width = parseFloat(customW);
      height = parseFloat(customH);
      if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
        return;
      }
    } else {
      const preset = QUILT_SIZE_PRESETS.find((p) => p.label === selectedPreset);
      if (!preset) return;
      width = preset.width;
      height = preset.height;
    }
    onConfirm({ width, height, openLayouts });
  }, [isCustom, customW, customH, selectedPreset, openLayouts, onConfirm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40">
      <div className="w-full max-w-lg rounded-xl bg-surface shadow-elevation-3 p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-on-surface mb-1">New Quilt</h2>
          <p className="text-sm text-secondary">
            Pick the finished size of your quilt. You can change this any time from the right
            pane.
          </p>
        </div>

        {/* Preset grid */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {QUILT_SIZE_PRESETS.map((preset) => {
            const isActive = selectedPreset === preset.label;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => setSelectedPreset(preset.label)}
                className={`flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors ${
                  isActive
                    ? 'bg-gradient-to-r from-orange-500 to-rose-400 text-white shadow-elevation-1'
                    : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                }`}
              >
                <span className="text-sm font-medium">{preset.label}</span>
                <span
                  className={`text-xs font-mono ${isActive ? 'text-white/80' : 'text-secondary'}`}
                >
                  {preset.width}″ × {preset.height}″
                </span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setSelectedPreset('Custom')}
            className={`col-span-2 flex items-center justify-center rounded-lg px-3 py-2.5 transition-colors ${
              isCustom
                ? 'bg-gradient-to-r from-orange-500 to-rose-400 text-white shadow-elevation-1'
                : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
            }`}
          >
            <span className="text-sm font-medium">Custom Size</span>
          </button>
        </div>

        {/* Custom inputs */}
        {isCustom && (
          <div className="flex gap-3 mb-4">
            <div className="flex-1">
              <label htmlFor="custom-w" className="block text-xs text-secondary mb-1">
                Width (inches)
              </label>
              <input
                id="custom-w"
                type="number"
                min={1}
                max={144}
                step={0.5}
                value={customW}
                onChange={(e) => setCustomW(e.target.value)}
                placeholder="e.g. 60"
                className="w-full rounded-md bg-surface-container px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="custom-h" className="block text-xs text-secondary mb-1">
                Height (inches)
              </label>
              <input
                id="custom-h"
                type="number"
                min={1}
                max={144}
                step={0.5}
                value={customH}
                onChange={(e) => setCustomH(e.target.value)}
                placeholder="e.g. 72"
                className="w-full rounded-md bg-surface-container px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>
        )}

        {/* Layout shortcut */}
        <label className="flex items-center gap-2 mb-5 cursor-pointer">
          <input
            type="checkbox"
            checked={openLayouts}
            onChange={(e) => setOpenLayouts(e.target.checked)}
            className="rounded accent-primary"
          />
          <span className="text-sm text-secondary">
            Open the Layouts library after I create my quilt
          </span>
        </label>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-md px-4 py-2 text-sm font-medium text-secondary hover:bg-surface-container transition-colors"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isCustom && (!customW || !customH)}
            className="rounded-md bg-gradient-to-r from-orange-500 to-rose-400 px-5 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            Create Quilt
          </button>
        </div>
      </div>
    </div>
  );
}
