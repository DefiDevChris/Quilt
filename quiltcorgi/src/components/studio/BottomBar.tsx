'use client';

import { useCanvasStore } from '@/stores/canvasStore';
import { formatMeasurement } from '@/lib/canvas-utils';

export function BottomBar() {
  const cursorPosition = useCanvasStore((s) => s.cursorPosition);
  const unitSystem = useCanvasStore((s) => s.unitSystem);
  const gridSettings = useCanvasStore((s) => s.gridSettings);

  return (
    <div className="h-7 bg-surface flex items-center justify-between px-4 font-mono text-body-sm text-secondary">
      {/* Left side */}
      <div className="flex items-center gap-[2.75rem]">
        <span>
          Mouse H: {formatMeasurement(cursorPosition.x, unitSystem)} V:{' '}
          {formatMeasurement(cursorPosition.y, unitSystem)}
        </span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-[2.75rem]">
        <span className={gridSettings.snapToGrid ? 'text-success' : 'text-secondary'}>
          Snap to Grid: {gridSettings.snapToGrid ? 'ON' : 'OFF'}
        </span>
        <span className={gridSettings.snapToNodes ? 'text-success' : 'text-secondary'}>
          Snap to Nodes: {gridSettings.snapToNodes ? 'ON' : 'OFF'}
        </span>
      </div>
    </div>
  );
}
