'use client';

import { useEffect } from 'react';
import type { StepProps } from '@/types/wizard';
import type { PatchworkWizardData } from '../PhotoPatchworkDialog';
import { generatePatchworkGrid } from '@/lib/photo-patchwork-engine';

export function Step5Preview({
  data,
  onUpdate,
}: StepProps<PatchworkWizardData>) {
  // Generate final grid on mount
  useEffect(() => {
    if (!data.imageData || data.grid) return;

    const grid = generatePatchworkGrid(data.imageData, {
      gridWidth: data.gridWidth,
      gridHeight: data.gridHeight,
      colorCount: data.colorCount,
    });

    onUpdate({ grid });
  }, [
    data.imageData,
    data.gridWidth,
    data.gridHeight,
    data.colorCount,
    data.grid,
    onUpdate,
  ]);

  if (!data.grid) {
    return (
      <p className="text-sm text-secondary text-center py-8">
        Generating preview...
      </p>
    );
  }

  const cellSize = Math.min(
    Math.floor(400 / data.grid.cols),
    Math.floor(300 / data.grid.rows),
    24
  );

  return (
    <div className="space-y-4">
      {/* Grid preview */}
      <div className="flex justify-center overflow-auto">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${data.grid.cols}, ${cellSize}px)`,
            gridTemplateRows: `repeat(${data.grid.rows}, ${cellSize}px)`,
            gap: '0px',
          }}
        >
          {data.grid.cells.map((cell) => (
            <div
              key={`${cell.row}-${cell.col}`}
              style={{
                width: cellSize,
                height: cellSize,
                backgroundColor: cell.color,
              }}
              title={`Row ${cell.row + 1}, Col ${cell.col + 1}: ${cell.color}${
                cell.fabricName ? ` (${cell.fabricName})` : ''
              }`}
            />
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="rounded-lg border border-outline-variant/20 bg-surface-container px-4 py-3">
        <div className="grid grid-cols-2 gap-y-2 text-sm">
          <div className="text-secondary">Grid size</div>
          <div className="text-on-surface font-medium text-right">
            {data.grid.cols} x {data.grid.rows}
          </div>

          <div className="text-secondary">Total patches</div>
          <div className="text-on-surface font-medium text-right">
            {data.grid.totalPatches}
          </div>

          <div className="text-secondary">Colors used</div>
          <div className="text-on-surface font-medium text-right">
            {data.grid.palette.length}
          </div>
        </div>
      </div>

      {/* Palette summary */}
      <div>
        <p className="text-xs text-secondary mb-2">Color palette</p>
        <div className="flex flex-wrap gap-1.5">
          {data.grid.palette.map((cluster, i) => (
            <div
              key={`preview-swatch-${i}`}
              className="h-6 w-6 rounded-sm border border-outline-variant/20"
              style={{ backgroundColor: cluster.hex }}
              title={`${cluster.hex} (${cluster.percentage.toFixed(1)}%)`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
