'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { useCanvasStore } from '@/stores/canvasStore';
import { useAuthStore } from '@/stores/authStore';
import { useLayoutStore } from '@/stores/layoutStore';
import { useCanvasContext } from '@/contexts/CanvasContext';
import { getUnitLabel } from '@/lib/canvas-utils';
import { parseFraction, toDecimal } from '@/lib/fraction-math';
import { computeLayoutSize } from '@/lib/layout-size-utils';
import {
  GRID_CELL_SIZE_MIN,
  GRID_CELL_SIZE_MAX,
  GRID_CELL_SIZE_STEP,
  QUILT_SIZE_PRESETS,
} from '@/lib/constants';
import { TooltipHint } from '@/components/ui/TooltipHint';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { useStudioDialogs } from '@/components/studio/StudioDialogs';
import { COLORS } from '@/lib/design-system';

interface QuiltSettingsDropdownProps {
  readonly onOpenImageExport?: () => void;
  readonly onOpenPdfExport?: () => void;
}

/**
 * Dropdown menu in the top bar for quilt-level settings:
 * - Quilt dimensions (width/height inputs + presets)
 * - Grid cell size slider + snap toggle
 * - Export buttons (Image / PDF)
 *
 * Changes trigger confirmation modals before being applied.
 */
export function QuiltSettingsDropdown({
  onOpenImageExport,
  onOpenPdfExport,
}: QuiltSettingsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { getCanvas } = useCanvasContext();
  const fabricCanvas = getCanvas();

  const canvasWidth = useProjectStore((s) => s.canvasWidth);
  const canvasHeight = useProjectStore((s) => s.canvasHeight);
  const setCanvasWidth = useProjectStore((s) => s.setCanvasWidth);
  const setCanvasHeight = useProjectStore((s) => s.setCanvasHeight);
  const gridSettings = useCanvasStore((s) => s.gridSettings);
  const setGridSettings = useCanvasStore((s) => s.setGridSettings);
  const unitSystem = useCanvasStore((s) => s.unitSystem);
  const layoutType = useLayoutStore((s) => s.layoutType);
  const rows = useLayoutStore((s) => s.rows);
  const cols = useLayoutStore((s) => s.cols);
  const blockSize = useLayoutStore((s) => s.blockSize);
  const sashing = useLayoutStore((s) => s.sashing);
  const borders = useLayoutStore((s) => s.borders);
  const bindingWidth = useLayoutStore((s) => s.bindingWidth);
  const hasAppliedLayout = useLayoutStore((s) => s.hasAppliedLayout);
  const user = useAuthStore((s) => s.user);
  const isPro = user?.role === 'pro' || user?.role === 'admin';
  const dialogs = useStudioDialogs();
  const unit = getUnitLabel(unitSystem);
  const isLayoutSized = hasAppliedLayout && layoutType !== 'none' && layoutType !== 'free-form';
  const layoutSize = isLayoutSized
    ? computeLayoutSize({
        type: layoutType,
        rows,
        cols,
        blockSize,
        sashingWidth: sashing.width,
        borders,
        bindingWidth,
      })
    : null;

  // Local state for inputs
  const [widthInput, setWidthInput] = useState(String(canvasWidth));
  const [heightInput, setHeightInput] = useState(String(canvasHeight));
  const [widthError, setWidthError] = useState('');
  const [heightError, setHeightError] = useState('');

  // Confirmation state
  const [pendingWidth, setPendingWidth] = useState<number | null>(null);
  const [pendingHeight, setPendingHeight] = useState<number | null>(null);
  const [pendingCellSize, setPendingCellSize] = useState<number | null>(null);

  const triggerRender = useCallback(() => {
    if (fabricCanvas) {
      (fabricCanvas as { renderAll: () => void }).renderAll();
    }
  }, [fabricCanvas]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync local state with store when dropdown opens
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (isOpen) {
      setWidthInput(String(canvasWidth));
      setHeightInput(String(canvasHeight));
      setWidthError('');
      setHeightError('');
    }
  }, [isOpen, canvasWidth, canvasHeight]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const commitWidth = useCallback(
    (raw: string) => {
      try {
        const decimal = toDecimal(parseFraction(raw.trim()));
        if (decimal > 0 && Number.isFinite(decimal)) {
          setWidthError('');
          // Show confirmation modal if dimensions changed
          if (decimal !== canvasWidth) {
            setPendingWidth(decimal);
          } else {
            setWidthInput(String(decimal));
          }
        } else {
          setWidthError('Enter a valid dimension');
        }
      } catch {
        setWidthError('Enter a valid dimension');
      }
    },
    [canvasWidth]
  );

  const commitHeight = useCallback(
    (raw: string) => {
      try {
        const decimal = toDecimal(parseFraction(raw.trim()));
        if (decimal > 0 && Number.isFinite(decimal)) {
          setHeightError('');
          // Show confirmation modal if dimensions changed
          if (decimal !== canvasHeight) {
            setPendingHeight(decimal);
          } else {
            setHeightInput(String(decimal));
          }
        } else {
          setHeightError('Enter a valid dimension');
        }
      } catch {
        setHeightError('Enter a valid dimension');
      }
    },
    [canvasHeight]
  );

  const applyPreset = useCallback((w: number, h: number) => {
    // Always show confirmation for preset changes
    setPendingWidth(w);
    setPendingHeight(h);
  }, []);

  const commitCellSize = useCallback(
    (newSize: number) => {
      if (newSize !== gridSettings.size) {
        setPendingCellSize(newSize);
      } else {
        setGridSettings({ size: newSize });
        triggerRender();
      }
    },
    [gridSettings.size, setGridSettings, triggerRender]
  );

  const confirmResize = useCallback(
    (newWidth: number, newHeight: number) => {
      setCanvasWidth(newWidth);
      setCanvasHeight(newHeight);
      setWidthInput(String(newWidth));
      setHeightInput(String(newHeight));
      setWidthError('');
      setHeightError('');
      triggerRender();
      useCanvasStore.getState().centerAndFitViewport(fabricCanvas, newWidth, newHeight);
      setPendingWidth(null);
      setPendingHeight(null);
      setIsOpen(false);
    },
    [setCanvasWidth, setCanvasHeight, triggerRender, fabricCanvas]
  );

  const confirmCellSizeChange = useCallback(
    (newSize: number) => {
      setGridSettings({ size: newSize });
      triggerRender();
      setPendingCellSize(null);
    },
    [setGridSettings, triggerRender]
  );

  const cancelPending = useCallback(() => {
    setPendingWidth(null);
    setPendingHeight(null);
    setPendingCellSize(null);
    // Reset inputs to current values
    setWidthInput(String(canvasWidth));
    setHeightInput(String(canvasHeight));
  }, [canvasWidth, canvasHeight]);

  return (
    <div ref={ref} className="relative">
      {/* Dropdown trigger button */}
      <TooltipHint name="Quilt Settings" description="Adjust quilt dimensions and grid settings">
        <button
          type="button"
          onClick={() => setIsOpen((o) => !o)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[14px] font-medium transition-colors ${
            isOpen
              ? 'bg-[var(--color-border)] text-[var(--color-text)]'
              : 'text-[var(--color-text)]/70 hover:text-[var(--color-text)] hover:bg-[var(--color-bg)]'
          }`}
          aria-label="Quilt settings"
          aria-expanded={isOpen}
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
            <rect
              x="3"
              y="3"
              width="14"
              height="14"
              rx="1"
              stroke="currentColor"
              strokeWidth="1.4"
            />
            <path d="M3 10H17" stroke="currentColor" strokeWidth="1" strokeOpacity="0.5" />
            <path d="M10 3V17" stroke="currentColor" strokeWidth="1" strokeOpacity="0.5" />
          </svg>
          Settings
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M3 4.5L6 7.5L9 4.5"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </TooltipHint>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-80 bg-[var(--color-bg)] border border-[var(--color-border)]/20 rounded-lg shadow-[0_1px_2px_rgba(26,26,26,0.08)] py-3 z-50">
          <div className="px-3 pb-3 border-b border-[var(--color-border)]/15">
            <p className="text-label-sm uppercase text-[var(--color-text-dim)] font-medium mb-3">
              {isLayoutSized ? 'Finished Size' : `Quilt Size (${unit})`}
            </p>

            {isLayoutSized && layoutSize ? (
              <div className="rounded-lg border border-[var(--color-border)]/20 bg-[var(--color-bg)] px-3 py-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--color-text-dim)]">Layout-driven size</span>
                  <span className="font-mono font-semibold text-[var(--color-text)]">
                    {layoutSize.width}″ × {layoutSize.height}″
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-[var(--color-text-dim)]">
                  Quilt layouts now keep block cells square. Change rows, columns, block size,
                  sashing, or borders from the Layouts tab.
                </p>
              </div>
            ) : (
              <>
                <div className="flex gap-3 mb-3">
                  <div className="flex-1">
                    <label
                      htmlFor="quilt-w"
                      className="block text-xs text-[var(--color-text-dim)] mb-1"
                    >
                      Width
                    </label>
                    <input
                      id="quilt-w"
                      type="text"
                      inputMode="decimal"
                      value={widthInput}
                      onChange={(e) => {
                        setWidthInput(e.target.value);
                        setWidthError('');
                      }}
                      onBlur={(e) => commitWidth(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitWidth((e.target as HTMLInputElement).value);
                      }}
                      className={`w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 text-sm text-[var(--color-text)] focus:border-black focus:outline-none ${
                        widthError ? 'border-[var(--color-accent)]' : ''
                      }`}
                    />
                    {widthError && (
                      <p className="text-xs text-[var(--color-accent)] mt-1">{widthError}</p>
                    )}
                  </div>
                  <div className="flex-1">
                    <label
                      htmlFor="quilt-h"
                      className="block text-xs text-[var(--color-text-dim)] mb-1"
                    >
                      Height
                    </label>
                    <input
                      id="quilt-h"
                      type="text"
                      inputMode="decimal"
                      value={heightInput}
                      onChange={(e) => {
                        setHeightInput(e.target.value);
                        setHeightError('');
                      }}
                      onBlur={(e) => commitHeight(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitHeight((e.target as HTMLInputElement).value);
                      }}
                      className={`w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 text-sm text-[var(--color-text)] focus:border-black focus:outline-none ${
                        heightError ? 'border-[var(--color-accent)]' : ''
                      }`}
                    />
                    {heightError && (
                      <p className="text-xs text-[var(--color-accent)] mt-1">{heightError}</p>
                    )}
                  </div>
                </div>

                <p className="text-[10px] uppercase text-[var(--color-text-dim)] mb-1.5">Presets</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {QUILT_SIZE_PRESETS.map((p) => {
                    const isActive = canvasWidth === p.width && canvasHeight === p.height;
                    return (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => applyPreset(p.width, p.height)}
                        className={`flex items-center justify-between rounded-full px-2 py-1.5 text-xs font-medium transition-colors ${
                          isActive
                            ? 'bg-[var(--color-primary)] text-[var(--color-text)]'
                            : 'bg-[var(--color-bg)] text-[var(--color-text)] hover:bg-[var(--color-border)]'
                        }`}
                      >
                        <span>{p.label}</span>
                        <span
                          className={`font-mono text-[10px] ${isActive ? 'text-[var(--color-text)]/80' : 'text-[var(--color-text-dim)]'}`}
                        >
                          {p.width}×{p.height}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Grid section */}
          <div className="px-3 pt-3">
            <p className="text-label-sm uppercase text-[var(--color-text-dim)] font-medium mb-3">
              Cell Grid
            </p>
            <div className="mb-2">
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="cell-size" className="text-xs text-[var(--color-text-dim)]">
                  Cell size
                </label>
                <span className="text-xs text-[var(--color-text)] font-medium font-mono">
                  {gridSettings.size.toFixed(2)}&quot;
                </span>
              </div>
              <input
                id="cell-size"
                type="range"
                min={GRID_CELL_SIZE_MIN}
                max={GRID_CELL_SIZE_MAX}
                step={GRID_CELL_SIZE_STEP}
                value={gridSettings.size}
                onChange={(e) => {
                  const newSize = parseFloat(e.target.value);
                  commitCellSize(newSize);
                }}
                onMouseUp={() => {
                  // Commit on mouse up for slider
                }}
                className="w-full accent-[var(--color-primary)]"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={gridSettings.snapToGrid}
                onChange={(e) => setGridSettings({ snapToGrid: e.target.checked })}
                className="rounded accent-[var(--color-primary)]"
              />
              <span className="text-xs text-[var(--color-text-dim)]">Snap to grid</span>
            </label>
          </div>

          {/* Export section */}
          <div className="px-3 pt-3 mt-3 border-t border-[var(--color-border)]/15">
            <p className="text-label-sm uppercase text-[var(--color-text-dim)] font-medium mb-2">
              Export
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  if (!isPro) {
                    dialogs.promptUpgrade('Image Export');
                    return;
                  }
                  setIsOpen(false);
                  onOpenImageExport?.();
                }}
                className="flex-1 bg-[var(--color-primary)] text-[var(--color-text)] rounded-full px-3 py-2 text-xs font-semibold hover:opacity-90 transition-colors duration-150"
              >
                Image
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!isPro) {
                    dialogs.promptUpgrade('PDF Export');
                    return;
                  }
                  setIsOpen(false);
                  onOpenPdfExport?.();
                }}
                className="flex-1 bg-[var(--color-primary)] text-[var(--color-text)] rounded-full px-3 py-2 text-xs font-semibold hover:opacity-90 transition-colors duration-150"
              >
                PDF
              </button>
            </div>
            {!isPro && (
              <p className="text-[10px] text-[var(--color-primary)] mt-1.5">
                Pro required for export
              </p>
            )}
          </div>
        </div>
      )}

      {/* Confirmation modal for resize */}
      {pendingWidth !== null && pendingHeight !== null && (
        <ConfirmationDialog
          title="Resize Quilt?"
          message={
            <>
              This will change the quilt dimensions from{' '}
              <span className="font-medium text-[var(--color-text)]">
                {canvasWidth}″ × {canvasHeight}″
              </span>{' '}
              to{' '}
              <span className="font-medium text-[var(--color-text)]">
                {pendingWidth}″ × {pendingHeight}″
              </span>
              . This action cannot be undone.
            </>
          }
          confirmLabel="Resize"
          onConfirm={() => confirmResize(pendingWidth, pendingHeight)}
          onCancel={cancelPending}
        />
      )}

      {/* Confirmation modal for cell size change */}
      {pendingCellSize !== null && (
        <ConfirmationDialog
          title="Change Grid Cell Size?"
          message={
            <>
              This will change the grid cell size from{' '}
              <span className="font-medium text-[var(--color-text)]">
                {gridSettings.size.toFixed(2)}″
              </span>{' '}
              to{' '}
              <span className="font-medium text-[var(--color-text)]">
                {pendingCellSize.toFixed(2)}″
              </span>
              . This may affect layout positioning.
            </>
          }
          confirmLabel="Change"
          onConfirm={() => confirmCellSizeChange(pendingCellSize)}
          onCancel={cancelPending}
        />
      )}
    </div>
  );
}
