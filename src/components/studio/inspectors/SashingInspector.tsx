'use client';

import { useLayoutStore } from '@/stores/layoutStore';
import type { ResolvedSelection } from '@/lib/canvas-selection';
import { AreaFabricControls } from './AreaFabricControls';

interface Props {
  readonly selection: ResolvedSelection;
}

export function SashingInspector({ selection }: Props) {
  const sashing = useLayoutStore((s) => s.sashing);
  const setSashing = useLayoutStore((s) => s.setSashing);
  const target = selection.primary as unknown as Record<string, unknown> | null;

  return (
    <div className="p-3 space-y-3">
      <section className="rounded-lg bg-surface-container p-3">
        <div className="flex items-center justify-between mb-1">
          <label htmlFor="sashing-w" className="text-xs text-secondary">
            Sashing width
          </label>
          <span className="text-xs font-mono text-on-surface">{sashing.width.toFixed(2)}&quot;</span>
        </div>
        <input
          id="sashing-w"
          type="range"
          min={0.25}
          max={4}
          step={0.25}
          value={sashing.width}
          onChange={(e) => setSashing({ width: parseFloat(e.target.value) })}
          className="w-full accent-primary"
        />
      </section>

      <AreaFabricControls target={target} roleLabel="sashing fabric" />
    </div>
  );
}
