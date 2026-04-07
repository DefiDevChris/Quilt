'use client';

import { useLayoutStore } from '@/stores/layoutStore';
import type { ResolvedSelection } from '@/lib/canvas-selection';
import { AreaFabricControls } from './AreaFabricControls';

interface Props {
  readonly selection: ResolvedSelection;
}

export function BindingInspector({ selection }: Props) {
  const bindingWidth = useLayoutStore((s) => s.bindingWidth);
  const setBindingWidth = useLayoutStore((s) => s.setBindingWidth);
  const target = selection.primary as unknown as Record<string, unknown> | null;

  return (
    <div className="p-3 space-y-3">
      <section className="rounded-lg bg-surface-container p-3">
        <div className="flex items-center justify-between mb-1">
          <label htmlFor="binding-w" className="text-xs text-secondary">
            Binding width
          </label>
          <span className="text-xs font-mono text-on-surface">{bindingWidth.toFixed(2)}&quot;</span>
        </div>
        <input
          id="binding-w"
          type="range"
          min={0}
          max={2}
          step={0.125}
          value={bindingWidth}
          onChange={(e) => setBindingWidth(parseFloat(e.target.value))}
          className="w-full accent-primary"
        />
      </section>

      <AreaFabricControls target={target} roleLabel="binding fabric" />
    </div>
  );
}
