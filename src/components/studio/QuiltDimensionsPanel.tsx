'use client';

import { useState, useCallback } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { useCanvasStore } from '@/stores/canvasStore';
import { getUnitLabel } from '@/lib/canvas-utils';
import { parseFraction, toDecimal } from '@/lib/fraction-math';
import { GRID_CELL_SIZE_MIN, GRID_CELL_SIZE_MAX, GRID_CELL_SIZE_STEP } from '@/lib/constants';

interface QuiltDimensionsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

function parseDimensionInput(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === '') return null;

  try {
    const fraction = parseFraction(trimmed);
    const decimal = toDecimal(fraction);
    if (decimal > 0 && Number.isFinite(decimal)) {
      return decimal;
    }
    return null;
  } catch {
    return null;
  }
}

function formatGridSize(value: number): string {
  const wholeInches = Math.floor(value);
  const remainder = value - wholeInches;

  if (remainder === 0) {
    return `${wholeInches}"`;
  }

  // Common quilting fractions
  const eighths = Math.round(remainder * 8);
  const fractionStr =
    eighths === 4 ? '1/2' : eighths === 2 ? '1/4' : eighths === 6 ? '3/4' : `${eighths}/8`;

  if (wholeInches === 0) {
    return `${fractionStr}"`;
  }
  return `${wholeInches} ${fractionStr}"`;
}

export function QuiltDimensionsPanel({ isOpen, onClose }: QuiltDimensionsPanelProps) {
  const canvasWidth = useProjectStore((s) => s.canvasWidth);
  const canvasHeight = useProjectStore((s) => s.canvasHeight);
  const setCanvasWidth = useProjectStore((s) => s.setCanvasWidth);
  const setCanvasHeight = useProjectStore((s) => s.setCanvasHeight);
  const gridSettings = useCanvasStore((s) => s.gridSettings);
  const setGridSettings = useCanvasStore((s) => s.setGridSettings);
  const unitSystem = useCanvasStore((s) => s.unitSystem);
  const fabricCanvas = useCanvasStore((s) => s.fabricCanvas);
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

  const handleWidthBlur = useCallback(() => {
    const parsed = parseDimensionInput(widthInput);
    if (parsed === null) {
      setWidthError('Enter a valid dimension');
      return;
    }
    setWidthError('');
    setCanvasWidth(parsed);
    setWidthInput(String(parsed));
    triggerRender();
  }, [widthInput, setCanvasWidth, triggerRender]);

  const handleHeightBlur = useCallback(() => {
    const parsed = parseDimensionInput(heightInput);
    if (parsed === null) {
      setHeightError('Enter a valid dimension');
      return;
    }
    setHeightError('');
    setCanvasHeight(parsed);
    setHeightInput(String(parsed));
    triggerRender();
  }, [heightInput, setCanvasHeight, triggerRender]);

  const handleGridSizeChange = useCallback(
    (value: number) => {
      setGridSettings({ size: value });
      triggerRender();
    },
    [setGridSettings, triggerRender]
  );

  const handleSnapChange = useCallback(
    (snapToGrid: boolean) => {
      setGridSettings({ snapToGrid });
    },
    [setGridSettings]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40">
      <div className="w-full max-w-sm rounded-lg bg-surface shadow-elevation-3 p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold text-on-surface mb-5">Grid and Dimensions</h2>

        {/* Quilt Dimensions */}
        <div className="rounded-lg bg-surface-container p-4 shadow-elevation-1 mb-4">
          <p className="text-label-sm uppercase text-secondary tracking-[0.02em] font-medium mb-3">
            Quilt Size ({unit})
          </p>
          <div className="flex gap-3">
            <div className="flex-1">
              <label htmlFor="quilt-width-input" className="block text-xs text-secondary mb-1">
                Width
              </label>
              <input
                id="quilt-width-input"
                type="text"
                inputMode="decimal"
                value={widthInput}
                onChange={(e) => {
                  setWidthInput(e.target.value);
                  setWidthError('');
                }}
                onBlur={handleWidthBlur}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleWidthBlur();
                }}
                className={`w-full rounded-md bg-surface px-3 py-1.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                  widthError ? 'ring-2 ring-error/50' : ''
                }`}
              />
              {widthError && <p className="text-xs text-error mt-1">{widthError}</p>}
            </div>
            <div className="flex-1">
              <label htmlFor="quilt-height-input" className="block text-xs text-secondary mb-1">
                Height
              </label>
              <input
                id="quilt-height-input"
                type="text"
                inputMode="decimal"
                value={heightInput}
                onChange={(e) => {
                  setHeightInput(e.target.value);
                  setHeightError('');
                }}
                onBlur={handleHeightBlur}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleHeightBlur();
                }}
                className={`w-full rounded-md bg-surface px-3 py-1.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                  heightError ? 'ring-2 ring-error/50' : ''
                }`}
              />
              {heightError && <p className="text-xs text-error mt-1">{heightError}</p>}
            </div>
          </div>
        </div>

        {/* Cell Grid Settings */}
        <div className="rounded-lg bg-surface-container p-4 shadow-elevation-1 mb-4">
          <p className="text-label-sm uppercase text-secondary tracking-[0.02em] font-medium mb-3">
            Cell Grid
          </p>

          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="grid-cell-size-slider" className="text-xs text-secondary">
                Cell size
              </label>
              <span className="text-xs text-on-surface font-medium">
                {formatGridSize(gridSettings.size)}
              </span>
            </div>
            <input
              id="grid-cell-size-slider"
              type="range"
              min={GRID_CELL_SIZE_MIN}
              max={GRID_CELL_SIZE_MAX}
              step={GRID_CELL_SIZE_STEP}
              value={gridSettings.size}
              onChange={(e) => handleGridSizeChange(parseFloat(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-caption text-secondary mt-0.5">
              <span>{formatGridSize(GRID_CELL_SIZE_MIN)}</span>
              <span>{formatGridSize(GRID_CELL_SIZE_MAX)}</span>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={gridSettings.snapToGrid}
              onChange={(e) => handleSnapChange(e.target.checked)}
              className="rounded accent-primary"
            />
            <span className="text-sm text-secondary">Snap to grid</span>
          </label>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-gradient-to-r from-orange-500 to-rose-400 px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
