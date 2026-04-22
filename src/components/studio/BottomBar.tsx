'use client';

import { useCanvasStore } from '@/stores/canvasStore';
import { useLayoutStore } from '@/stores/layoutStore';
import { useProjectStore } from '@/stores/projectStore';
import { useShadeAssignment } from '@/hooks/useShadeAssignment';
import { performUndo, performRedo } from '@/lib/canvas-history';
import {
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Grid3X3,
  Layers,
  Lock,
  Unlock,
} from 'lucide-react';
import { TooltipHint } from '@/components/ui/TooltipHint';

type GridGranularity = 'inch' | 'half' | 'quarter';

function cn(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function BottomBar() {
  const zoom = useCanvasStore((s) => s.zoom ?? 1);
  const setZoom = useCanvasStore((s) => s.setZoom ?? (() => {}));
  const undoStack = useCanvasStore((s) => s.undoStack ?? []);
  const redoStack = useCanvasStore((s) => s.redoStack ?? []);
  const pushUndoState = useCanvasStore((s) => s.pushUndoState ?? (() => {}));
  const gridSettings = useCanvasStore((s) => s.gridSettings ?? { enabled: true, size: 1, snapToGrid: true, granularity: 'inch' });
  const setGridSettings = useCanvasStore((s) => s.setGridSettings ?? (() => {}));
  const shadeViewActive = useCanvasStore((s) => s.shadeViewActive ?? false);
  const isViewportLocked = useCanvasStore((s) => s.isViewportLocked ?? false);
  const setViewportLocked = useCanvasStore((s) => s.setViewportLocked ?? (() => {}));
  const hasAppliedLayout = useLayoutStore((s) => s.hasAppliedLayout ?? false);
  const layoutType = useLayoutStore((s) => s.layoutType ?? 'none');
  const { activateShadeView, deactivateShadeView } = useShadeAssignment();

  const projectMode = useProjectStore((s) => s.mode ?? 'free-form');
  const canvasWidth = useProjectStore((s) => s.canvasWidth ?? 60);
  const canvasHeight = useProjectStore((s) => s.canvasHeight ?? 60);
  const rows = useLayoutStore((s) => s.rows ?? 4);
  const cols = useLayoutStore((s) => s.cols ?? 4);
  const blockSize = useLayoutStore((s) => s.blockSize ?? 12);

  const isFreeForm = projectMode === 'free-form';
  const isLayoutOrTemplate = projectMode === 'layout' || projectMode === 'template';

  const canUndo = (undoStack?.length ?? 0) > 0;
  const canRedo = (redoStack?.length ?? 0) > 0;

  const granularity = gridSettings?.granularity ?? 'inch';
  const granularityLabel = granularity === 'inch' ? '1"' : granularity === 'half' ? '½"' : '¼"';

  const handleUndo = () => {
    const canvas = useCanvasStore.getState().fabricCanvas;
    if (canvas) {
      performUndo(canvas as never);
    }
  };

  const handleRedo = () => {
    const canvas = useCanvasStore.getState().fabricCanvas;
    if (canvas) {
      performRedo(canvas as never);
    }
  };

  const handleZoomIn = () => setZoom(Math.min(zoom * 1.25, 4));
  const handleZoomOut = () => setZoom(Math.max(zoom / 1.25, 0.1));
  const handleFit = () => {
    const canvas = useCanvasStore.getState().fabricCanvas;
    if (canvas) {
      const store = useCanvasStore.getState();
      store.centerAndFitViewport(canvas as never, canvasWidth, canvasHeight);
    }
  };
  const handle100 = () => setZoom(1);

  const toggleGrid = () => setGridSettings({ enabled: !gridSettings?.enabled });
  const toggleShade = () => {
    if (shadeViewActive) {
      deactivateShadeView();
    } else {
      activateShadeView();
    }
  };
  const toggleViewportLock = () => {
    const canvas = useCanvasStore.getState().fabricCanvas;
    setViewportLocked(!isViewportLocked, canvas, canvasWidth, canvasHeight);
  };

  const setGranularity = (g: GridGranularity) => {
    setGridSettings({ granularity: g });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (shadeViewActive) deactivateShadeView();
    }
  };

  const gridLabel = isFreeForm
    ? `Snap: ${granularityLabel} grid`
    : 'Snap: cells';

  const sizeLabel = isFreeForm
    ? `${canvasWidth} × ${canvasHeight} in · free-form`
    : `${canvasWidth} × ${canvasHeight} in · ${rows}×${cols} grid · ${blockSize}" blocks`;

  return (
    <div
      className="h-10 bg-[var(--color-bg)] border-t border-[var(--color-border)] flex items-center justify-between px-3"
      onKeyDown={handleKeyDown}
    >
      {/* Left cluster */}
      <div className="flex items-center gap-1">
        <TooltipHint name="Undo" description="Undo last action">
          <button
            type="button"
            onClick={handleUndo}
            disabled={!canUndo}
            className={cn(
              'w-7 h-7 flex items-center justify-center rounded-full transition-colors',
              canUndo
                ? 'text-[var(--color-text)] hover:bg-[var(--color-border)] cursor-pointer'
                : 'text-[var(--color-text)]/30 cursor-not-allowed'
            )}
            aria-label="Undo"
          >
            <Undo2 size={16} />
          </button>
        </TooltipHint>

        <TooltipHint name="Redo" description="Redo last action">
          <button
            type="button"
            onClick={handleRedo}
            disabled={!canRedo}
            className={cn(
              'w-7 h-7 flex items-center justify-center rounded-full transition-colors',
              canRedo
                ? 'text-[var(--color-text)] hover:bg-[var(--color-border)] cursor-pointer'
                : 'text-[var(--color-text)]/30 cursor-not-allowed'
            )}
            aria-label="Redo"
          >
            <Redo2 size={16} />
          </button>
        </TooltipHint>

        <div className="w-px h-5 bg-[var(--color-border)] mx-1" />

        <TooltipHint name="Zoom out" description="Decrease zoom level">
          <button
            type="button"
            onClick={handleZoomOut}
            className="w-7 h-7 flex items-center justify-center rounded-full text-[var(--color-text)] hover:bg-[var(--color-border)] transition-colors"
            aria-label="Zoom out"
          >
            <ZoomOut size={16} />
          </button>
        </TooltipHint>

        <div className="w-12 h-6 flex items-center justify-center text-[12px] text-[var(--color-text)]">
          {Math.round(zoom * 100)}%
        </div>

        <TooltipHint name="Zoom in" description="Increase zoom level">
          <button
            type="button"
            onClick={handleZoomIn}
            className="w-7 h-7 flex items-center justify-center rounded-full text-[var(--color-text)] hover:bg-[var(--color-border)] transition-colors"
            aria-label="Zoom in"
          >
            <ZoomIn size={16} />
          </button>
        </TooltipHint>

        <TooltipHint name="Fit to screen" description="Center and fit the canvas in the viewport">
          <button
            type="button"
            onClick={handleFit}
            aria-label="Fit canvas to screen"
            className="px-2 h-7 flex items-center justify-center text-[12px] text-[var(--color-text)] hover:bg-[var(--color-border)] rounded-full transition-colors"
          >
            Fit
          </button>
        </TooltipHint>

        <TooltipHint name="Actual size" description="Reset zoom to 100%">
          <button
            type="button"
            onClick={handle100}
            aria-label="Reset zoom to 100%"
            className="px-2 h-7 flex items-center justify-center text-[12px] text-[var(--color-text)] hover:bg-[var(--color-border)] rounded-full transition-colors"
          >
            100%
          </button>
        </TooltipHint>

        <div className="w-px h-5 bg-[var(--color-border)] mx-1" />

        <TooltipHint name={gridSettings?.enabled ? 'Hide grid' : 'Show grid'} description="Toggle grid visibility">
          <button
            type="button"
            onClick={toggleGrid}
            className={cn(
              'w-7 h-7 flex items-center justify-center rounded-full transition-colors',
              gridSettings?.enabled
                ? 'text-primary bg-primary/10'
                : 'text-[var(--color-text)] hover:bg-[var(--color-border)]'
            )}
            aria-label="Toggle grid"
            aria-pressed={gridSettings?.enabled}
          >
            <Grid3X3 size={16} />
          </button>
        </TooltipHint>

        {isFreeForm && (
          <div
            className="flex items-center gap-0.5 ml-1"
            role="group"
            aria-label="Grid snap granularity"
          >
            {(['inch', 'half', 'quarter'] as GridGranularity[]).map((g) => {
              const label = g === 'inch' ? '1"' : g === 'half' ? '½"' : '¼"';
              const srLabel =
                g === 'inch' ? '1 inch grid' : g === 'half' ? 'Half inch grid' : 'Quarter inch grid';
              const active = granularity === g;
              return (
                <TooltipHint key={g} name={srLabel} description="Set grid snap granularity">
                  <button
                    type="button"
                    onClick={() => setGranularity(g)}
                    aria-label={srLabel}
                    aria-pressed={active}
                    className={cn(
                      'px-1.5 h-6 flex items-center justify-center text-[11px] rounded-full transition-colors',
                      active
                        ? 'bg-primary text-[var(--color-text)] font-medium'
                        : 'text-[var(--color-text-dim)] hover:bg-[var(--color-border)]'
                    )}
                  >
                    <span aria-hidden="true">{label}</span>
                  </button>
                </TooltipHint>
              );
            })}
          </div>
        )}

        <div className="text-[11px] text-[var(--color-text-dim)] ml-2 tabular-nums">
          {gridLabel}
        </div>
      </div>

      {/* Right cluster */}
      <div className="flex items-center gap-1">
        <div className="text-[11px] text-[var(--color-text-dim)] mr-2 tabular-nums">
          {sizeLabel}
        </div>

        <div className="w-px h-5 bg-[var(--color-border)] mx-1" />

        {isLayoutOrTemplate && (
          <TooltipHint name={shadeViewActive ? 'Hide shades' : 'Show shades'} description="Toggle shade view">
            <button
              type="button"
              onClick={toggleShade}
              className={cn(
                'w-7 h-7 flex items-center justify-center rounded-full transition-colors',
                shadeViewActive
                  ? 'text-primary bg-primary/10'
                  : 'text-[var(--color-text)] hover:bg-[var(--color-border)]'
              )}
              aria-label="Toggle shades"
              aria-pressed={shadeViewActive}
            >
              <Layers size={16} />
            </button>
          </TooltipHint>
        )}

        <TooltipHint name={isViewportLocked ? 'Unlock viewport' : 'Lock viewport'} description="Toggle viewport lock">
          <button
            type="button"
            onClick={toggleViewportLock}
            className={cn(
              'w-7 h-7 flex items-center justify-center rounded-full transition-colors',
              isViewportLocked
                ? 'text-primary bg-primary/10'
                : 'text-[var(--color-text)] hover:bg-[var(--color-border)]'
            )}
            aria-label={isViewportLocked ? 'Unlock viewport' : 'Lock viewport'}
            aria-pressed={isViewportLocked}
          >
            {isViewportLocked ? <Lock size={16} /> : <Unlock size={16} />}
          </button>
        </TooltipHint>
      </div>
    </div>
  );
}