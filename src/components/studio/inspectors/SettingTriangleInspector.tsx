'use client';

import type { ResolvedSelection } from '@/lib/canvas-selection';
import { AreaFabricControls } from './AreaFabricControls';

interface Props {
  readonly selection: ResolvedSelection;
}

export function SettingTriangleInspector({ selection }: Props) {
  const target = selection.primary as unknown as Record<string, unknown> | null;
  return (
    <div className="p-3">
      <AreaFabricControls target={target} roleLabel="setting triangle fabric" />
    </div>
  );
}
