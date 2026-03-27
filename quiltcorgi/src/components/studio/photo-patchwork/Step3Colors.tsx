'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { StepProps } from '@/types/wizard';
import type { PatchworkWizardData } from '../PhotoPatchworkDialog';
import { kMeansClustering } from '@/lib/photo-patchwork-engine';
import { sampleGridColors } from '@/lib/photo-patchwork-engine';
import type { RGB } from '@/lib/color-math';

export function Step3Colors({
  data,
  onUpdate,
}: StepProps<PatchworkWizardData>) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runClustering = useCallback(() => {
    if (!data.imageData) return;

    const gridColors = sampleGridColors(
      data.imageData,
      data.gridWidth,
      data.gridHeight
    );

    const flatColors: RGB[] = [];
    for (const row of gridColors) {
      for (const color of row) {
        flatColors.push(color);
      }
    }

    const palette = kMeansClustering(flatColors, data.colorCount, 20);
    onUpdate({ palette });
  }, [data.imageData, data.gridWidth, data.gridHeight, data.colorCount, onUpdate]);

  // Debounced clustering on color count change
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(runClustering, 500);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [runClustering]);

  const handleColorCountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onUpdate({ colorCount: parseInt(e.target.value, 10) });
    },
    [onUpdate]
  );

  return (
    <div className="space-y-5">
      {/* Color count slider */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium text-on-surface">
            Number of Colors
          </label>
          <span className="text-sm font-mono text-secondary">
            {data.colorCount}
          </span>
        </div>
        <input
          type="range"
          min={2}
          max={24}
          step={1}
          value={data.colorCount}
          onChange={handleColorCountChange}
          className="w-full accent-primary"
        />
      </div>

      {/* Palette swatches */}
      {data.palette.length > 0 && (
        <div>
          <p className="text-xs text-secondary mb-2">
            Extracted palette ({data.palette.length} colors)
          </p>
          <div className="flex flex-wrap gap-2">
            {data.palette.map((cluster, index) => (
              <div
                key={`${cluster.hex}-${index}`}
                className="flex flex-col items-center gap-1"
              >
                <div
                  className="h-10 w-10 rounded-md border border-outline-variant/20 shadow-sm"
                  style={{ backgroundColor: cluster.hex }}
                  title={`${cluster.hex} (${cluster.percentage.toFixed(1)}%)`}
                />
                <span className="text-[10px] font-mono text-secondary">
                  {cluster.hex}
                </span>
                <span className="text-[10px] text-secondary">
                  {cluster.percentage.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.palette.length === 0 && data.imageData && (
        <p className="text-sm text-secondary text-center py-4">
          Analyzing colors...
        </p>
      )}
    </div>
  );
}
