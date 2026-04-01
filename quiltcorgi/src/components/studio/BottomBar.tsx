'use client';

import { useCanvasStore } from '@/stores/canvasStore';
import { formatMeasurement } from '@/lib/canvas-utils';
import { ZOOM_DEFAULT } from '@/lib/constants';

export function BottomBar() {
  const cursorPosition = useCanvasStore((s) => s.cursorPosition);
  const unitSystem = useCanvasStore((s) => s.unitSystem);
  const gridSettings = useCanvasStore((s) => s.gridSettings);
  const zoom = useCanvasStore((s) => s.zoom);
  const isSpacePressed = useCanvasStore((s) => s.isSpacePressed);
  const activeTool = useCanvasStore((s) => s.activeTool);

  const zoomPercent = Math.round(zoom * 100);
  const isPanMode = isSpacePressed || activeTool === 'pan';

  return (
    <div className="h-7 bg-surface flex items-center justify-between px-4 font-mono text-body-sm text-secondary">
      {/* Left side */}
      <div className="flex items-center gap-[2.75rem]">
        <span>
          Mouse H: {formatMeasurement(cursorPosition.x, unitSystem)} V:{' '}
          {formatMeasurement(cursorPosition.y, unitSystem)}
        </span>
        <button
          type="button"
          onClick={() => {
            useCanvasStore.getState().setZoom(ZOOM_DEFAULT);
            useCanvasStore.getState().centerAndFitViewport();
          }}
          className="hover:text-on-surface transition-colors"
          title="Reset zoom to 100%"
        >
          Zoom: {zoomPercent}%
        </button>
        {isPanMode && (
          <span className="text-primary">
            Pan Mode Active
          </span>
        )}
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
