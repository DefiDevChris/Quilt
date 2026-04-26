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
import {
  getQuiltScaleOptions,
  applyScaleOption,
  type QuiltScaleOption,
} from '@/lib/quilt-scale-utils';
import { TooltipHint } from '@/components/ui/TooltipHint';
import { useStudioDialogs } from '@/components/studio/StudioDialogs';

interface QuiltSettingsDropdownProps {
  readonly onOpenImageExport?: () => void;
  readonly onOpenPdfExport?: () => void;
}

/**
 * Quilt-level settings dropdown in the top bar.
 *
 * Pre-lock (configuring phase) — full editing surface (legacy behaviour)
 *   • Width / height inputs + preset list
 *   • Grid cell size slider + snap toggle
 *   • Export buttons
 *
 * Post-lock — read-only sizing
 *   • Layout/Template modes: only "Layout-driven size" callout, grid + export.
 *   • Free-form mode: proportional ¼″-aligned scale options that preserve
 *     aspect ratio. No more confirmation dialogs — the spec says "just
 *     apply it" once we've validated the option keeps every piece on the
 *     ¼″ grid (which the option list guarantees by construction).
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
  const projectMode = useProjectStore((s) => s.mode);
  const baseQuiltWidth = useProjectStore((s) => s.baseQuiltWidth ?? canvasWidth);
  const baseQuiltHeight = useProjectStore((s) => s.baseQuiltHeight ?? canvasHeight);
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
  const layoutLocked = useLayoutStore((s) => s.layoutLocked);
  const user = useAuthStore((s) => s.user);
  const isPro = user?.role === 'pro' || user?.role === 'admin';
  const dialogs = useStudioDialogs();
  const unit = getUnitLabel(unitSystem);

  const isLayoutSized =
    hasAppliedLayout && layoutType !== 'none' && layoutType !== 'free-form';
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

  // Local state for inputs (pre-lock only)
  const [widthInput, setWidthInput] = useState(String(canvasWidth));
  const [heightInput, setHeightInput] = useState(String(canvasHeight));
  const [widthError, setWidthError] = useState('');
  const [heightError, setHeightError] = useState('');

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

  const applyDimensions = useCallback(
    (newWidth: number, newHeight: number) => {
      setCanvasWidth(newWidth);
      setCanvasHeight(newHeight);
      setWidthInput(String(newWidth));
      setHeightInput(String(newHeight));
      setWidthError('');
      setHeightError('');
      triggerRender();
      useCanvasStore.getState().centerAndFitViewport(fabricCanvas, newWidth, newHeight);
    },
    [setCanvasWidth, setCanvasHeight, triggerRender, fabricCanvas],
  );

  const commitWidth = useCallback(
    (raw: string) => {
      try {
        const decimal = toDecimal(parseFraction(raw.trim()));
        if (decimal > 0 && Number.isFinite(decimal)) {
          setWidthError('');
          if (decimal !== canvasWidth) applyDimensions(decimal, canvasHeight);
          else setWidthInput(String(decimal));
        } else {
          setWidthError('Enter a valid dimension');
        }
      } catch {
        setWidthError('Enter a valid dimension');
      }
    },
    [canvasWidth, canvasHeight, applyDimensions],
  );

  const commitHeight = useCallback(
    (raw: string) => {
      try {
        const decimal = toDecimal(parseFraction(raw.trim()));
        if (decimal > 0 && Number.isFinite(decimal)) {
          setHeightError('');
          if (decimal !== canvasHeight) applyDimensions(canvasWidth, decimal);
          else setHeightInput(String(decimal));
        } else {
          setHeightError('Enter a valid dimension');
        }
      } catch {
        setHeightError('Enter a valid dimension');
      }
    },
    [canvasWidth, canvasHeight, applyDimensions],
  );

  const applyPreset = useCallback(
    (w: number, h: number) => {
      applyDimensions(w, h);
    },
    [applyDimensions],
  );

  const commitCellSize = useCallback(
    (newSize: number) => {
      setGridSettings({ size: newSize });
      triggerRender();
    },
    [setGridSettings, triggerRender],
  );

  // Post-lock free-form scale options. We compute them from the recorded
  // base dimensions (set when the user clicked Start Designing) so repeated
  // scaling stays referenced to the original quilt.
  const scaleOptions: QuiltScaleOption[] =
    layoutLocked && projectMode === 'free-form'
      ? getQuiltScaleOptions(baseQuiltWidth, baseQuiltHeight, canvasWidth, canvasHeight)
      : [];

  const handleScaleSelect = useCallback(
    (factor: number) => {
      const result = applyScaleOption(baseQuiltWidth, baseQuiltHeight, factor);
      if (!result) return;
      applyDimensions(result.width, result.height);
    },
    [baseQuiltWidth, baseQuiltHeight, applyDimensions],
  );

  // ── Section visibility ──────────────────────────────────────────
  // Pre-lock: full editing (inputs + presets), as before.
  // Post-lock layout/template: read-only "Finished Size" callout.
  // Post-lock free-form: proportional scale options.
  const showFreeEditDimensions = !layoutLocked;
  const showLayoutSizeCallout = layoutLocked && isLayoutSized;
  const showFreeformScaleOptions =
    layoutLocked && projectMode === 'free-form' && scaleOptions.length > 0;

  return (
    <div ref={ref} className="relative">
      {/* Dropdown trigger button */}
      <TooltipHint name="Quilt Settings" description="Adjust quilt dimensions and grid settings">
        <button
          type="button"
          onClick={() => setIsOpen((o) => !o)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[14px] font-medium transition-colors duration-150 ${
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
        <div className="absolute right-0 top-full mt-1 w-80 bg-[var(--color-bg)] border border-[var(--color-border)]/20 rounded-lg shadow-elevated py-3 z-50">
          {/* ── Sizing section ── */}
          {showFreeEditDimensions && (
            <div className="px-3 pb-3 border-b border-[var(--color-border)]/15">
              <p className="text-label-sm uppercase text-[var(--color-text-dim)] font-medium mb-3">
                {`Quilt Size (${unit})`}
              </p>

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
                      if (e.key === 'Enter')
                        commitWidth((e.target as HTMLInputElement).value);
                    }}
                    className={`w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none ${
                      widthError ? 'border-[var(--color-error)]' : ''
                    }`}
                  />
                  {widthError && (
                    <p className="text-xs text-[var(--color-error)] mt-1">{widthError}</p>
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
                      if (e.key === 'Enter')
                        commitHeight((e.target as HTMLInputElement).value);
                    }}
                    className={`w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none ${
                      heightError ? 'border-[var(--color-error)]' : ''
                    }`}
                  />
                  {heightError && (
                    <p className="text-xs text-[var(--color-error)] mt-1">{heightError}</p>
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
                      className={`flex items-center justify-between rounded-full px-2 py-1.5 text-xs font-medium transition-colors duration-150 ${
                        isActive
                          ? 'bg-[var(--color-primary)] text-[var(--color-text-on-primary)]'
                          : 'bg-[var(--color-bg)] text-[var(--color-text)] hover:bg-[var(--color-border)]'
                      }`}
                    >
                      <span>{p.label}</span>
                      <span
                        className={`font-mono text-[10px] ${
                          isActive
                            ? 'text-[var(--color-text-on-primary)]/80'
                            : 'text-[var(--color-text-dim)]'
                        }`}
                      >
                        {p.width}×{p.height}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {showLayoutSizeCallout && layoutSize && (
            <div className="px-3 pb-3 border-b border-[var(--color-border)]/15">
              <p className="text-label-sm uppercase text-[var(--color-text-dim)] font-medium mb-3">
                Finished Size
              </p>
              <div className="rounded-lg border border-[var(--color-border)]/20 bg-[var(--color-bg)] px-3 py-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--color-text-dim)]">Layout-driven size</span>
                  <span className="font-mono font-semibold text-[var(--color-text)]">
                    {layoutSize.width}″ × {layoutSize.height}″
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-[var(--color-text-dim)]">
                  Dimensions are derived from your locked-in layout. To change the size,
                  start a new project with a different layout or template.
                </p>
              </div>
            </div>
          )}

          {showFreeformScaleOptions && (
            <div className="px-3 pb-3 border-b border-[var(--color-border)]/15">
              <p className="text-label-sm uppercase text-[var(--color-text-dim)] font-medium mb-1">
                Scale Quilt
              </p>
              <p className="text-[11px] leading-relaxed text-[var(--color-text-dim)] mb-2">
                Scales the whole quilt proportionally. Every option keeps every piece
                aligned to the ¼″ grid.
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {scaleOptions.map((opt) => (
                  <button
                    key={opt.factor}
                    type="button"
                    onClick={() => handleScaleSelect(opt.factor)}
                    aria-pressed={opt.isCurrent}
                    className={`flex flex-col items-start rounded-lg px-2 py-1.5 text-left transition-colors duration-150 border ${
                      opt.isCurrent
                        ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)]/40 text-[var(--color-primary)]'
                        : 'bg-[var(--color-bg)] border-[var(--color-border)]/30 text-[var(--color-text)] hover:bg-[var(--color-border)]/30'
                    }`}
                  >
                    <span className="text-[12px] font-semibold">
                      {Math.round(opt.factor * 100)}%
                    </span>
                    <span className="text-[10px] font-mono text-[var(--color-text-dim)]">
                      {opt.width}″ × {opt.height}″
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Grid section — always visible */}
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
                  {gridSettings.size.toFixed(2)}″
                </span>
              </div>
              <input
                id="cell-size"
                type="range"
                min={GRID_CELL_SIZE_MIN}
                max={GRID_CELL_SIZE_MAX}
                step={GRID_CELL_SIZE_STEP}
                value={gridSettings.size}
                onChange={(e) => commitCellSize(parseFloat(e.target.value))}
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

          {/* Export section — always visible */}
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
                className="flex-1 bg-[var(--color-primary)] text-[var(--color-text-on-primary)] rounded-full px-3 py-2 text-xs font-semibold hover:bg-[var(--color-primary-hover)] transition-colors duration-150"
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
                className="flex-1 bg-[var(--color-primary)] text-[var(--color-text-on-primary)] rounded-full px-3 py-2 text-xs font-semibold hover:bg-[var(--color-primary-hover)] transition-colors duration-150"
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
    </div>
  );
}
