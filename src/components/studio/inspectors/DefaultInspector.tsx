'use client';

import { useCallback, useState } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { useCanvasStore } from '@/stores/canvasStore';
import { useLayoutStore } from '@/stores/layoutStore';
import { getUnitLabel } from '@/lib/canvas-utils';
import { parseFraction, toDecimal } from '@/lib/fraction-math';
import {
  GRID_CELL_SIZE_MIN,
  GRID_CELL_SIZE_MAX,
  GRID_CELL_SIZE_STEP,
  QUILT_SIZE_PRESETS,
} from '@/lib/constants';

/**
 * The "nothing selected" inspector. Quilt-level controls: dimensions,
 * size presets, grid cell size, snap toggle. Replaces the old modal
 * QuiltDimensionsPanel — these controls are now docked permanently in
 * the right pane and visible whenever no canvas object is selected.
 */
export function DefaultInspector() {
  const canvasWidth = useProjectStore((s) => s.canvasWidth);
  const canvasHeight = useProjectStore((s) => s.canvasHeight);
  const setCanvasWidth = useProjectStore((s) => s.setCanvasWidth);
  const setCanvasHeight = useProjectStore((s) => s.setCanvasHeight);
  const gridSettings = useCanvasStore((s) => s.gridSettings);
  const setGridSettings = useCanvasStore((s) => s.setGridSettings);
  const unitSystem = useCanvasStore((s) => s.unitSystem);
  const fabricCanvas = useCanvasStore((s) => s.fabricCanvas);
  const layoutType = useLayoutStore((s) => s.layoutType);
  const unit = getUnitLabel(unitSystem);

  const [widthInput, setWidthInput] = useState(String(canvasWidth));
  const [heightInput, setHeightInput] = useState(String(canvasHeight));
  const [widthError, setWidthError] = useState('');
  const [heightError, setHeightError] = useState('');

  const triggerRender = useCallback(() => {
    if (fabricCanvas) {
      (fabricCanvas as { renderAll: () => void }).renderAll();
    }
  }, [fabricCanvas]);

  const commitWidth = useCallback(
    (raw: string) => {
      try {
        const decimal = toDecimal(parseFraction(raw.trim()));
        if (decimal > 0 && Number.isFinite(decimal)) {
          setWidthError('');
          setCanvasWidth(decimal);
          setWidthInput(String(decimal));
          triggerRender();
        } else {
          setWidthError('Enter a valid dimension');
        }
      } catch {
        setWidthError('Enter a valid dimension');
      }
    },
    [setCanvasWidth, triggerRender]
  );

  const commitHeight = useCallback(
    (raw: string) => {
      try {
        const decimal = toDecimal(parseFraction(raw.trim()));
        if (decimal > 0 && Number.isFinite(decimal)) {
          setHeightError('');
          setCanvasHeight(decimal);
          setHeightInput(String(decimal));
          triggerRender();
        } else {
          setHeightError('Enter a valid dimension');
        }
      } catch {
        setHeightError('Enter a valid dimension');
      }
    },
    [setCanvasHeight, triggerRender]
  );

  const applyPreset = useCallback(
    (w: number, h: number) => {
      setCanvasWidth(w);
      setCanvasHeight(h);
      setWidthInput(String(w));
      setHeightInput(String(h));
      setWidthError('');
      setHeightError('');
      triggerRender();
      useCanvasStore.getState().centerAndFitViewport();
    },
    [setCanvasWidth, setCanvasHeight, triggerRender]
  );

  return (
    <div className="p-3 space-y-4">
      {/* ── Quilt Dimensions ───────────────────────────────── */}
      <section className="rounded-lg bg-surface-container p-3 shadow-elevation-1">
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
              className={`w-full rounded-md bg-surface px-3 py-1.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                widthError ? 'ring-2 ring-error/50' : ''
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
              className={`w-full rounded-md bg-surface px-3 py-1.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                heightError ? 'ring-2 ring-error/50' : ''
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
                className={`flex items-center justify-between rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-gradient-to-r from-orange-500 to-rose-400 text-white'
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
      </section>

      {/* ── Grid ───────────────────────────────────────────── */}
      <section className="rounded-lg bg-surface-container p-3 shadow-elevation-1">
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
              setGridSettings({ size: parseFloat(e.target.value) });
              triggerRender();
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
      </section>

      {/* ── Hint when no layout is set ─────────────────────── */}
      {(layoutType === 'none' || layoutType === 'free-form') && (
        <section className="rounded-lg bg-primary-container/30 p-3 border border-primary/20">
          <p className="text-xs text-on-surface mb-1 font-medium">Add a layout</p>
          <p className="text-xs text-secondary">
            Pick a layout from the <span className="font-medium">Layouts</span> tab above to drop a
            grid onto your quilt. Blocks will snap into the layout cells.
          </p>
        </section>
      )}
    </div>
  );
}
