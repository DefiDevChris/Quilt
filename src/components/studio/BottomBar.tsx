'use client';

import { useCanvasStore } from '@/stores/canvasStore';
import { useLayoutStore } from '@/stores/layoutStore';
import { useBlockBuilderStore } from '@/stores/blockBuilderStore';
import { formatMeasurement } from '@/lib/canvas-utils';
import { useShadeAssignment } from '@/hooks/useShadeAssignment';

export function BottomBar() {
  const cursorPosition = useCanvasStore((s) => s.cursorPosition);
  const unitSystem = useCanvasStore((s) => s.unitSystem);
  const gridSettings = useCanvasStore((s) => s.gridSettings);
  const selectedObjectIds = useCanvasStore((s) => s.selectedObjectIds);
  const activeWorktable = useCanvasStore((s) => s.activeWorktable);
  const shadeViewActive = useCanvasStore((s) => s.shadeViewActive);
  const hasAppliedLayout = useLayoutStore((s) => s.hasAppliedLayout);
  const layoutType = useLayoutStore((s) => s.layoutType);
  const segmentCount = useBlockBuilderStore((s) => s.segmentCount);
  const patchCount = useBlockBuilderStore((s) => s.patchCount);
  const { activateShadeView, deactivateShadeView } = useShadeAssignment();

  return (
    <div className="h-7 bg-neutral flex items-center justify-between px-4 font-mono text-body-sm text-neutral-500">
      {/* Left side - cursor position */}
      <div className="flex items-center gap-[2.75rem]">
        <span>
          Mouse H: {formatMeasurement(cursorPosition.x, unitSystem)} V:{' '}
          {formatMeasurement(cursorPosition.y, unitSystem)}
        </span>
        {activeWorktable === 'quilt' && (
          <button
            type="button"
            onClick={() => {
              if (shadeViewActive) {
                deactivateShadeView();
              } else {
                activateShadeView();
              }
            }}
            className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${
              shadeViewActive
                ? 'bg-primary/20 text-primary'
                : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100'
            }`}
            title="Toggle shade visualization"
          >
            Shades {shadeViewActive ? 'ON' : 'OFF'}
          </button>
        )}
        {selectedObjectIds.length > 1 && (
          <span className="text-primary font-medium">
            {selectedObjectIds.length} objects selected
          </span>
        )}
      </div>

      {/* Right side - context-aware status */}
      <div className="flex items-center gap-[2.75rem]">
        {activeWorktable === 'block-builder' ? (
          /* Block Builder stats */
          <span className="text-primary/70">
            Grid: {gridSettings.snapToGrid ? `${gridSettings.size}"` : 'OFF'} | Snap:{' '}
            {gridSettings.snapToGrid ? 'ON' : 'OFF'} | {segmentCount} segments, {patchCount} patches
          </span>
        ) : (
          /* Quilt mode stats */
          <>
            {hasAppliedLayout && layoutType !== 'none' && layoutType !== 'free-form' && (
              <span className="text-on-surface/50">
                Layout: {layoutType.charAt(0).toUpperCase() + layoutType.slice(1)}
              </span>
            )}
            <span className={gridSettings.snapToGrid ? 'text-success' : 'text-neutral-500'}>
              Snap to Grid: {gridSettings.snapToGrid ? 'ON' : 'OFF'}
            </span>
            <span className={gridSettings.snapToNodes ? 'text-success' : 'text-neutral-500'}>
              Snap to Nodes: {gridSettings.snapToNodes ? 'ON' : 'OFF'}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
