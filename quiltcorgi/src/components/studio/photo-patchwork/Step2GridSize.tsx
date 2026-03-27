'use client';

import { useCallback, useState } from 'react';
import type { StepProps } from '@/types/wizard';
import type { PatchworkWizardData } from '../PhotoPatchworkDialog';

export function Step2GridSize({
  data,
  onUpdate,
}: StepProps<PatchworkWizardData>) {
  const [lockAspect, setLockAspect] = useState(false);

  const handleWidthChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newWidth = parseInt(e.target.value, 10);
      if (lockAspect && data.gridWidth > 0) {
        const ratio = data.gridHeight / data.gridWidth;
        const newHeight = Math.max(4, Math.min(48, Math.round(newWidth * ratio)));
        onUpdate({ gridWidth: newWidth, gridHeight: newHeight });
      } else {
        onUpdate({ gridWidth: newWidth });
      }
    },
    [data.gridWidth, data.gridHeight, lockAspect, onUpdate]
  );

  const handleHeightChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newHeight = parseInt(e.target.value, 10);
      if (lockAspect && data.gridHeight > 0) {
        const ratio = data.gridWidth / data.gridHeight;
        const newWidth = Math.max(4, Math.min(48, Math.round(newHeight * ratio)));
        onUpdate({ gridHeight: newHeight, gridWidth: newWidth });
      } else {
        onUpdate({ gridHeight: newHeight });
      }
    },
    [data.gridWidth, data.gridHeight, lockAspect, onUpdate]
  );

  const toggleAspectLock = useCallback(() => {
    setLockAspect((prev) => !prev);
  }, []);

  return (
    <div className="space-y-5">
      {/* Sliders */}
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-on-surface">
              Columns
            </label>
            <span className="text-sm font-mono text-secondary">
              {data.gridWidth}
            </span>
          </div>
          <input
            type="range"
            min={4}
            max={48}
            step={1}
            value={data.gridWidth}
            onChange={handleWidthChange}
            className="w-full accent-primary"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-on-surface">
              Rows
            </label>
            <span className="text-sm font-mono text-secondary">
              {data.gridHeight}
            </span>
          </div>
          <input
            type="range"
            min={4}
            max={48}
            step={1}
            value={data.gridHeight}
            onChange={handleHeightChange}
            className="w-full accent-primary"
          />
        </div>

        {/* Aspect ratio lock */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={lockAspect}
            onChange={toggleAspectLock}
            className="accent-primary"
          />
          <span className="text-sm text-secondary">Lock aspect ratio</span>
        </label>
      </div>

      {/* Grid overlay preview */}
      {data.imagePreviewUrl && (
        <div className="relative flex justify-center rounded-lg border border-outline-variant/20 bg-surface-container p-2">
          <div className="relative max-h-[200px] overflow-hidden">
            <img
              src={data.imagePreviewUrl}
              alt="Grid overlay preview"
              className="max-h-[200px] rounded object-contain"
            />
            {/* Grid lines overlay */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${data.gridWidth}, 1fr)`,
                gridTemplateRows: `repeat(${data.gridHeight}, 1fr)`,
              }}
            >
              {Array.from(
                { length: data.gridWidth * data.gridHeight },
                (_, i) => (
                  <div
                    key={i}
                    className="border border-white/30"
                  />
                )
              )}
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-secondary text-center">
        Total patches: {data.gridWidth * data.gridHeight}
      </p>
    </div>
  );
}
