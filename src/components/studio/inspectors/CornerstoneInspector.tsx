'use client';

import { useLayoutStore } from '@/stores/layoutStore';
import type { ResolvedSelection } from '@/lib/canvas-selection';
import { AreaFabricControls } from './AreaFabricControls';

interface Props {
  readonly selection: ResolvedSelection;
}

export function CornerstoneInspector({ selection }: Props) {
  const hasCornerstones = useLayoutStore((s) => s.hasCornerstones);
  const setHasCornerstones = useLayoutStore((s) => s.setHasCornerstones);
  const target = selection.primary as unknown as Record<string, unknown> | null;

  return (
    <div className="p-3 space-y-3">
      <section className="rounded-lg bg-surface-container p-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={hasCornerstones}
            onChange={(e) => setHasCornerstones(e.target.checked)}
            className="rounded accent-primary"
          />
          <span className="text-xs text-on-surface">Show cornerstones</span>
        </label>
      </section>

      <AreaFabricControls target={target} roleLabel="cornerstone fabric" />
    </div>
  );
}
