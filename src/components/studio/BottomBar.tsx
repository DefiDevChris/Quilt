'use client';

import { useEffect, useRef, useState } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useLayoutStore } from '@/stores/layoutStore';
import { useProjectStore } from '@/stores/projectStore';
import {
  ZoomIn,
  ZoomOut,
  Grid3X3,
  Lock,
  Unlock,
  Settings,
} from 'lucide-react';
import { TooltipHint } from '@/components/ui/TooltipHint';

type GridGranularity = 'inch' | 'half' | 'quarter';

function cn(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * BottomBar — viewport / grid status row.
 *
 * Undo and Redo are intentionally NOT here — they live in the left Toolbar
 * (with keyboard shortcuts) so that the bottom row stays focused on
 * read-only viewport telemetry plus the few toggles that genuinely belong
 * to the canvas chrome (grid, viewport lock).
 *
 * In free-form mode the user can change snap granularity (¼″ / ½″ / 1″);
 * the controls live behind a gear popover so the bottom row is calm by
 * default. Default granularity is ¼″.
 */
export function BottomBar() {
  const zoom = useCanvasStore((s) => s.zoom ?? 1);
  const setZoom = useCanvasStore((s) => s.setZoom ?? (() => {}));
  const gridSettings = useCanvasStore(
    (s) => s.gridSettings ?? { enabled: true, size: 1, snapToGrid: true, granularity: 'quarter' as GridGranularity },
  );
  const setGridSettings = useCanvasStore((s) => s.setGridSettings ?? (() => {}));
  const isViewportLocked = useCanvasStore((s) => s.isViewportLocked ?? false);
  const setViewportLocked = useCanvasStore((s) => s.setViewportLocked ?? (() => {}));

  const projectMode = useProjectStore((s) => s.mode ?? 'free-form');
  const canvasWidth = useProjectStore((s) => s.canvasWidth ?? 60);
  const canvasHeight = useProjectStore((s) => s.canvasHeight ?? 60);
  const rows = useLayoutStore((s) => s.rows ?? 4);
  const cols = useLayoutStore((s) => s.cols ?? 4);
  const blockSize = useLayoutStore((s) => s.blockSize ?? 12);

  const isFreeForm = projectMode === 'free-form';

  const granularity = gridSettings?.granularity ?? 'quarter';
  const granularityLabel =
    granularity === 'inch' ? '1"' : granularity === 'half' ? '½"' : '¼"';

  const [granularityPopoverOpen, setGranularityPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close granularity popover on outside click
  useEffect(() => {
    if (!granularityPopoverOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setGranularityPopoverOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [granularityPopoverOpen]);

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
  const toggleViewportLock = () => {
    const canvas = useCanvasStore.getState().fabricCanvas;
    setViewportLocked(!isViewportLocked, canvas, canvasWidth, canvasHeight);
  };

  const setGranularity = (g: GridGranularity) => {
    setGridSettings({ granularity: g });
  };

  const gridLabel = isFreeForm ? `Snap: ${granularityLabel} grid` : 'Snap: cells';

  const sizeLabel = isFreeForm
    ? `${canvasWidth} × ${canvasHeight} in · free-form`
    : `${canvasWidth} × ${canvasHeight} in · ${rows}×${cols} grid · ${blockSize}" blocks`;

  return (
    <div className="h-10 bg-[var(--color-bg)] border-t border-[var(--color-border)] flex items-center justify-between px-3">
      {/* Left cluster — zoom + grid */}
      <div className="flex items-center gap-1">
        <TooltipHint name="Zoom out" description="Decrease zoom level">
          <button
            type="button"
            onClick={handleZoomOut}
            className="w-7 h-7 flex items-center justify-center rounded-full text-[var(--color-text)] hover:bg-[var(--color-border)] transition-colors duration-150"
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
            className="w-7 h-7 flex items-center justify-center rounded-full text-[var(--color-text)] hover:bg-[var(--color-border)] transition-colors duration-150"
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
            className="px-2 h-7 flex items-center justify-center text-[12px] text-[var(--color-text)] hover:bg-[var(--color-border)] rounded-full transition-colors duration-150"
          >
            Fit
          </button>
        </TooltipHint>

        <TooltipHint name="Actual size" description="Reset zoom to 100%">
          <button
            type="button"
            onClick={handle100}
            aria-label="Reset zoom to 100%"
            className="px-2 h-7 flex items-center justify-center text-[12px] text-[var(--color-text)] hover:bg-[var(--color-border)] rounded-full transition-colors duration-150"
          >
            100%
          </button>
        </TooltipHint>

        <div className="w-px h-5 bg-[var(--color-border)] mx-1" />

        <TooltipHint
          name={gridSettings?.enabled ? 'Hide grid' : 'Show grid'}
          description="Toggle grid visibility"
        >
          <button
            type="button"
            onClick={toggleGrid}
            className={cn(
              'w-7 h-7 flex items-center justify-center rounded-full transition-colors duration-150',
              gridSettings?.enabled
                ? 'text-primary bg-primary/10'
                : 'text-[var(--color-text)] hover:bg-[var(--color-border)]',
            )}
            aria-label="Toggle grid"
            aria-pressed={gridSettings?.enabled}
          >
            <Grid3X3 size={16} />
          </button>
        </TooltipHint>

        {isFreeForm && (
          <div ref={popoverRef} className="relative">
            <TooltipHint
              name="Snap granularity"
              description="Adjust how finely the grid snaps in free-form mode"
            >
              <button
                type="button"
                onClick={() => setGranularityPopoverOpen((o) => !o)}
                className={cn(
                  'w-7 h-7 flex items-center justify-center rounded-full transition-colors duration-150',
                  granularityPopoverOpen
                    ? 'text-primary bg-primary/10'
                    : 'text-[var(--color-text)] hover:bg-[var(--color-border)]',
                )}
                aria-label="Snap granularity settings"
                aria-expanded={granularityPopoverOpen}
                aria-haspopup="dialog"
              >
                <Settings size={16} />
              </button>
            </TooltipHint>

            {granularityPopoverOpen && (
              <div
                role="dialog"
                aria-label="Snap granularity"
                className="absolute bottom-full left-0 mb-2 w-44 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] shadow-elevated p-2 z-40"
              >
                <p className="px-2 pb-1.5 text-[10px] uppercase tracking-[0.08em] text-[var(--color-text-dim)] font-semibold">
                  Snap to
                </p>
                <div className="flex flex-col gap-0.5" role="group" aria-label="Snap granularity">
                  {(['quarter', 'half', 'inch'] as GridGranularity[]).map((g) => {
                    const label =
                      g === 'inch' ? '1"' : g === 'half' ? '½"' : '¼"';
                    const desc =
                      g === 'inch'
                        ? '1 inch grid'
                        : g === 'half'
                        ? 'Half inch grid'
                        : 'Quarter inch grid (default)';
                    const active = granularity === g;
                    return (
                      <button
                        key={g}
                        type="button"
                        onClick={() => {
                          setGranularity(g);
                          setGranularityPopoverOpen(false);
                        }}
                        aria-pressed={active}
                        className={cn(
                          'flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-[12px] transition-colors duration-150',
                          active
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-[var(--color-text)] hover:bg-[var(--color-border)]',
                        )}
                      >
                        <span aria-hidden="true">{label}</span>
                        <span className="text-[10px] text-[var(--color-text-dim)]">{desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="text-[11px] text-[var(--color-text-dim)] ml-2 tabular-nums">
          {gridLabel}
        </div>
      </div>

      {/* Right cluster — size telemetry + viewport lock */}
      <div className="flex items-center gap-1">
        <div className="text-[11px] text-[var(--color-text-dim)] mr-2 tabular-nums">
          {sizeLabel}
        </div>

        <div className="w-px h-5 bg-[var(--color-border)] mx-1" />

        <TooltipHint
          name={isViewportLocked ? 'Unlock viewport' : 'Lock viewport'}
          description="Toggle viewport lock"
        >
          <button
            type="button"
            onClick={toggleViewportLock}
            className={cn(
              'w-7 h-7 flex items-center justify-center rounded-full transition-colors duration-150',
              isViewportLocked
                ? 'text-primary bg-primary/10'
                : 'text-[var(--color-text)] hover:bg-[var(--color-border)]',
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
