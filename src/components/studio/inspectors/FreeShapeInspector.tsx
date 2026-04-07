'use client';

import type { ResolvedSelection } from '@/lib/canvas-selection';
import { AreaFabricControls } from './AreaFabricControls';

interface Props {
  readonly selection: ResolvedSelection;
}

/**
 * Inspector for free-form shapes drawn with the drawing tools (rect, polygon,
 * path, line). Provides fabric assignment via drag-drop and a solid color
 * fallback. Other transform actions (rotate/scale) are handled by Fabric.js
 * controls directly on the canvas.
 */
export function FreeShapeInspector({ selection }: Props) {
  const target = selection.primary as unknown as Record<string, unknown> | null;
  return (
    <div className="p-3">
      <AreaFabricControls target={target} roleLabel="fabric" />
    </div>
  );
}
