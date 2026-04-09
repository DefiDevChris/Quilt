'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { useCanvasStore } from '@/stores/canvasStore';
import { getUnitLabel } from '@/lib/canvas-utils';
import { parseFraction, toDecimal } from '@/lib/fraction-math';
import {
  GRID_CELL_SIZE_MIN,
  GRID_CELL_SIZE_MAX,
  GRID_CELL_SIZE_STEP,
  QUILT_SIZE_PRESETS,
} from '@/lib/constants';
import { TooltipHint } from '@/components/ui/TooltipHint';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';

/**
 * Dropdown menu in the top bar for quilt-level settings:
 * - Quilt dimensions (width/height inputs + presets)
 * - Grid cell size slider + snap toggle
 * 
 * Changes trigger confirmation modals before being applied.
 */
export function QuiltSettingsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const canvasWidth = useProjectStore((s) => s.canvasWidth);
  const canvasHeight = useProjectStore((s) => s.canvasHeight);
  const setCanvasWidth = useProjectStore((s) => s.setCanvasWidth);
  const setCanvasHeight = useProjectStore((s) => s.setCanvasHeight);
  const gridSettings = useCanvasStore((s) => s.gridSettings);
  const setGridSettings = useCanvasStore((s) => s.setGridSettings);
  const unitSystem = useCanvasStore((s) => s.unitSystem);
  const fabricCanvas = useCanvasStore((s) => s.fabricCanvas);
  const unit = getUnitLabel(unitSystem);

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

  const applyPreset = useCallback(
    (w: number, h: number) => {
      // Always show confirmation for preset changes
      setPendingWidth(w);
      setPendingHeight(h);
    },
    []
  );

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
      useCanvasStore.getState().centerAndFitViewport();
      setPendingWidth(null);
      setPendingHeight(null);
      setIsOpen(false);
    },
    [setCanvasWidth, setCanvasHeight, triggerRender]
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
      <TooltipHint
        name="Quilt Settings"
        description="Adjust quilt dimensions and grid settings"
      >
        <button
          type="button"
          onClick={() => setIsOpen((o) => !o)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${isOpen
            ? 'bg-surface-container-high text-on-surface'
            : 'text-on-surface/70 hover:text-on-surface hover:bg-surface-container'
            }`}
          aria-label="Quilt settings"
          aria-expanded={isOpen}
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
            <rect x="3" y="3" width="14" height="14" rx="1" stroke="currentColor" strokeWidth="1.4" />
            <path d="M3 10H17" stroke="currentColor" strokeWidth="1" strokeOpacity="0.5" />
            <path d="M10 3V17" stroke="currentColor" strokeWidth="1" strokeOpacity="0.5" />
          </svg>
          Quilt
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
        <div className="absolute right-0 top-full mt-1 w-80 bg-surface border border-outline-variant/20 rounded-xl shadow-elevation-2 py-3 z-50">
          {/* Quilt Size section */}
          <div className="px-3 pb-3 border-b border-outline-variant/15">
            <p className="text-label-sm uppercase text-secondary tracking-[0.02em] font-medium mb-3">
              Quilt Size ({unit})
            </p>
            <div className="flex gap-3 mb-3">
              <div className="flex-1">
                <label htmlFor="quilt-w" className="block text-xs text-secondary mb-1">
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
                  className={`w-full rounded-md bg-surface px-3 py-1.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 ${widthError ? 'ring-2 ring-error/50' : ''
                    }`}
                />
                {widthError && <p className="text-xs text-error mt-1">{widthError}</p>}
              </div>
              <div className="flex-1">
                <label htmlFor="quilt-h" className="block text-xs text-secondary mb-1">
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
                  className={`w-full rounded-md bg-surface px-3 py-1.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 ${heightError ? 'ring-2 ring-error/50' : ''
                    }`}
                />
                {heightError && <p className="text-xs text-error mt-1">{heightError}</p>}
              </div>
            </div>

            {/* Size presets */}
            <p className="text-[10px] uppercase text-secondary tracking-wider mb-1.5">Presets</p>
            <div className="grid grid-cols-2 gap-1.5">
              {QUILT_SIZE_PRESETS.map((p) => {
                const isActive = canvasWidth === p.width && canvasHeight === p.height;
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => applyPreset(p.width, p.height)}
                    className={`flex items-center justify-between rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${isActive
                      ? 'bg-gradient-to-r from-primary to-primary-dark text-white'
                      : 'bg-surface text-on-surface hover:bg-surface-container-high'
                      }`}
                  >
                    <span>{p.label}</span>
                    <span className={`font-mono text-[10px] ${isActive ? 'text-white/80' : 'text-secondary'}`}>
                      {p.width}×{p.height}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Grid section */}
          <div className="px-3 pt-3">
            <p className="text-label-sm uppercase text-secondary tracking-[0.02em] font-medium mb-3">
              Cell Grid
            </p>
            <div className="mb-2">
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="cell-size" className="text-xs text-secondary">
                  Cell size
                </label>
                <span className="text-xs text-on-surface font-medium font-mono">
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
                className="w-full accent-primary"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={gridSettings.snapToGrid}
                onChange={(e) => setGridSettings({ snapToGrid: e.target.checked })}
                className="rounded accent-primary"
              />
              <span className="text-xs text-secondary">Snap to grid</span>
            </label>
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
              <span className="font-medium text-on-surface">
                {canvasWidth}″ × {canvasHeight}″
              </span>{' '}
              to{' '}
              <span className="font-medium text-on-surface">
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
              <span className="font-medium text-on-surface">
                {gridSettings.size.toFixed(2)}″
              </span>{' '}
              to{' '}
              <span className="font-medium text-on-surface">
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
