'use client';

import { useCallback } from 'react';
import { useLayoutStore } from '@/stores/layoutStore';
import type { ResolvedSelection } from '@/lib/canvas-selection';
import { AreaFabricControls } from './AreaFabricControls';

interface Props {
  readonly selection: ResolvedSelection;
}

export function BorderInspector({ selection }: Props) {
  const borders = useLayoutStore((s) => s.borders);
  const updateBorder = useLayoutStore((s) => s.updateBorder);
  const removeBorder = useLayoutStore((s) => s.removeBorder);
  const addBorder = useLayoutStore((s) => s.addBorder);

  const idx = selection.borderIndex ?? 0;
  const border = borders[idx];
  const target = selection.primary as unknown as Record<string, unknown> | null;

  const handleWidthChange = useCallback(
    (value: number) => {
      updateBorder(idx, { width: value });
    },
    [updateBorder, idx]
  );

  return (
    <div className="p-3 space-y-3">
      <section className="rounded-lg bg-surface-container p-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] uppercase text-secondary tracking-wider">Border #{idx + 1}</span>
          <button
            type="button"
            onClick={addBorder}
            className="text-[10px] font-medium text-primary hover:underline"
          >
            + Add Border
          </button>
        </div>
        {border && (
          <>
            <div className="flex items-center justify-between mb-1 mt-2">
              <label htmlFor="border-w" className="text-xs text-secondary">
                Width
              </label>
              <span className="text-xs font-mono text-on-surface">{border.width.toFixed(2)}&quot;</span>
            </div>
            <input
              id="border-w"
              type="range"
              min={0.5}
              max={8}
              step={0.25}
              value={border.width}
              onChange={(e) => handleWidthChange(parseFloat(e.target.value))}
              className="w-full accent-primary"
            />
          </>
        )}
      </section>

      <AreaFabricControls target={target} roleLabel="border fabric" />

      {border && (
        <button
          type="button"
          onClick={() => removeBorder(idx)}
          className="w-full rounded-md bg-error/10 hover:bg-error/20 text-error px-3 py-2 text-xs font-medium transition-colors"
        >
          Remove Border
        </button>
      )}
    </div>
  );
}
