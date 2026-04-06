'use client';

import { useState } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';

interface Props {
  isOpen: boolean;
  onConfirm: (blockSize: number, cellSize: number) => void;
  onDismiss: () => void;
}

interface BlockPreset {
  inches: number;
}

interface CellPreset {
  labelIn: string;
  labelMm: string;
  cellSize: number; // inches
}

const IN_TO_CM = 2.54;

function fmtIn(inches: number): string {
  if (inches === 0.25) return '¼"';
  if (inches === 0.5) return '½"';
  if (inches === 0.75) return '¾"';
  if (inches === 1.5) return '1½"';
  if (inches === 4.5) return '4½"';
  return `${inches}"`;
}

const BLOCK_PRESETS: BlockPreset[] = [{ inches: 6 }, { inches: 9 }, { inches: 12 }, { inches: 15 }];

function buildCellOptions(blockIn: number): CellPreset[] {
  const candidates = [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4, 4.5, 5, 6];
  return candidates
    .filter((c) => blockIn % c === 0)
    .map((c) => {
      const divs = blockIn / c;
      const mm = Math.round(c * IN_TO_CM * 10);
      return {
        labelIn: `${fmtIn(c)} (${divs}×${divs})`,
        labelMm: `${mm}mm (${divs}×${divs})`,
        cellSize: c,
      };
    });
}

const DEFAULT_BLOCK_SIZE = 12;
const DEFAULT_CELL_SIZE = 3;

const PREVIEW_SIZE = 120;

function GridPreview({ blockSize, cellSize }: { blockSize: number; cellSize: number }) {
  const divisions = blockSize / cellSize;
  const step = PREVIEW_SIZE / divisions;
  const lines: React.ReactNode[] = [];

  for (let i = 1; i < divisions; i++) {
    const pos = i * step;
    lines.push(
      <line
        key={`v${i}`}
        x1={pos}
        y1={0}
        x2={pos}
        y2={PREVIEW_SIZE}
        stroke="#E5E2DD"
        strokeWidth="1"
      />
    );
    lines.push(
      <line
        key={`h${i}`}
        x1={0}
        y1={pos}
        x2={PREVIEW_SIZE}
        y2={pos}
        stroke="#E5E2DD"
        strokeWidth="1"
      />
    );
  }

  return (
    <svg
      width={PREVIEW_SIZE}
      height={PREVIEW_SIZE}
      viewBox={`0 0 ${PREVIEW_SIZE} ${PREVIEW_SIZE}`}
      className="rounded-lg border border-outline-variant"
      aria-label={`${divisions}×${divisions} grid preview`}
    >
      <rect width={PREVIEW_SIZE} height={PREVIEW_SIZE} fill="#F8F7F5" />
      {lines}
      <rect
        width={PREVIEW_SIZE}
        height={PREVIEW_SIZE}
        fill="none"
        stroke="#D0C8BF"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function NewBlockSetupModal({ isOpen, onConfirm, onDismiss }: Props) {
  const unitSystem = useCanvasStore((s) => s.unitSystem);
  const isMetric = unitSystem === 'metric';

  const [selectedBlockSize, setSelectedBlockSize] = useState(DEFAULT_BLOCK_SIZE);
  const [selectedCellSize, setSelectedCellSize] = useState(DEFAULT_CELL_SIZE);

  if (!isOpen) return null;

  const cellOptions = buildCellOptions(selectedBlockSize);
  const isCellValid = cellOptions.some((o) => o.cellSize === selectedCellSize);
  const activeCellSize = isCellValid
    ? selectedCellSize
    : (cellOptions[2]?.cellSize ?? DEFAULT_CELL_SIZE);

  function handleBlockSizeChange(size: number) {
    setSelectedBlockSize(size);
    const options = buildCellOptions(size);
    const stillValid = options.some((o) => o.cellSize === selectedCellSize);
    if (!stillValid && options.length > 0) {
      setSelectedCellSize(options[2]?.cellSize ?? options[0].cellSize);
    }
  }

  function handleConfirm() {
    onConfirm(selectedBlockSize, activeCellSize);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40">
      <div className="w-full max-w-lg rounded-2xl bg-surface shadow-elevation-3 p-6">
        {/* Header */}
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-on-surface">New Block</h2>
          <p className="text-sm text-secondary mt-0.5">
            Choose your block size and drawing grid resolution.
          </p>
        </div>

        {/* Two-column layout */}
        <div className="flex gap-5 mb-5">
          {/* Left: Block Size */}
          <div className="flex-1">
            <p className="text-xs font-medium text-secondary uppercase tracking-wide mb-2">
              Block Size
            </p>
            <div className="flex flex-col gap-2">
              {BLOCK_PRESETS.map((preset) => {
                const display = isMetric
                  ? `${+(preset.inches * IN_TO_CM).toFixed(1)}cm`
                  : `${preset.inches}"`;
                return (
                  <button
                    key={preset.inches}
                    type="button"
                    onClick={() => handleBlockSizeChange(preset.inches)}
                    className={`w-full py-4 rounded-xl text-sm font-semibold transition-all ${
                      selectedBlockSize === preset.inches
                        ? 'bg-gradient-to-r from-orange-500 to-rose-400 text-white shadow-elevation-1'
                        : 'bg-surface-container text-secondary hover:bg-surface-container-high'
                    }`}
                  >
                    {display} Block
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Cell Size + Preview */}
          <div className="flex-1 flex flex-col gap-3">
            <div>
              <p className="text-xs font-medium text-secondary uppercase tracking-wide mb-2">
                Grid Cell Size
              </p>
              <div className="flex flex-wrap gap-2">
                {cellOptions.map((opt) => (
                  <button
                    key={opt.cellSize}
                    type="button"
                    onClick={() => setSelectedCellSize(opt.cellSize)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      activeCellSize === opt.cellSize
                        ? 'bg-gradient-to-r from-orange-500 to-rose-400 text-white shadow-elevation-1'
                        : 'bg-surface-container text-secondary hover:bg-surface-container-high'
                    }`}
                  >
                    {isMetric ? opt.labelMm : opt.labelIn}
                  </button>
                ))}
              </div>
            </div>

            {/* Mini grid preview */}
            <div className="flex flex-col items-center gap-1.5 mt-auto pt-2">
              <GridPreview blockSize={selectedBlockSize} cellSize={activeCellSize} />
              <p className="text-xs text-secondary">
                {selectedBlockSize / activeCellSize}×{selectedBlockSize / activeCellSize} grid
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-2 border-t border-outline-variant">
          <button
            type="button"
            onClick={onDismiss}
            className="px-5 py-2 rounded-full text-sm font-medium bg-surface-container text-secondary hover:bg-surface-container-high transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-orange-500 to-rose-400 text-white hover:opacity-90 transition-opacity"
          >
            Start Building
          </button>
        </div>
      </div>
    </div>
  );
}
