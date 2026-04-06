'use client';

import { useState } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';

interface Props {
  isOpen: boolean;
  onConfirm: (rows: number, cols: number, blockSize: number, cellSize: number) => void;
  onDismiss: () => void;
}

interface QuiltSizePreset {
  label: string;
  name: string;
  w: number; // inches
  h: number; // inches
}

const QUILT_PRESETS: QuiltSizePreset[] = [
  { label: 'Wall', name: 'Wall Hanging', w: 36, h: 36 },
  { label: 'Baby', name: 'Baby Quilt', w: 36, h: 45 },
  { label: 'Throw', name: 'Throw', w: 54, h: 72 },
  { label: 'Twin', name: 'Twin', w: 63, h: 87 },
  { label: 'Queen', name: 'Queen', w: 90, h: 108 },
  { label: 'King', name: 'King', w: 108, h: 108 },
];

const BLOCK_SIZES = [6, 9, 12] as const;
// Cell sizes in inches — ¼" minimum
const CELL_SIZES_IN = [0.25, 0.5, 1, 2, 3] as const;
// Cell sizes in mm for metric
const CELL_SIZES_MM = [5, 10, 20, 50, 75] as const;

const PREVIEW_MAX = 110;

// in → cm conversion
const IN_TO_CM = 2.54;

function inToCm(inches: number): number {
  return inches * IN_TO_CM;
}

function fmtIn(inches: number): string {
  if (inches === 0.25) return '¼"';
  if (inches === 0.5) return '½"';
  if (inches === 0.75) return '¾"';
  return `${inches}"`;
}

function fmtMm(mm: number): string {
  return `${mm}mm`;
}

function LayoutPreview({
  rows,
  cols,
  aspectW,
  aspectH,
}: {
  rows: number;
  cols: number;
  aspectW: number;
  aspectH: number;
}) {
  const ratio = aspectW / aspectH;
  const svgW = ratio >= 1 ? PREVIEW_MAX : PREVIEW_MAX * ratio;
  const svgH = ratio >= 1 ? PREVIEW_MAX / ratio : PREVIEW_MAX;

  const lines: React.ReactNode[] = [];
  for (let c = 1; c < cols; c++) {
    const x = (c / cols) * svgW;
    lines.push(
      <line key={`v${c}`} x1={x} y1={0} x2={x} y2={svgH} stroke="#E5E2DD" strokeWidth="1" />
    );
  }
  for (let r = 1; r < rows; r++) {
    const y = (r / rows) * svgH;
    lines.push(
      <line key={`h${r}`} x1={0} y1={y} x2={svgW} y2={y} stroke="#E5E2DD" strokeWidth="1" />
    );
  }

  return (
    <svg
      width={svgW}
      height={svgH}
      viewBox={`0 0 ${svgW} ${svgH}`}
      className="rounded-lg border border-outline-variant"
      style={{ minWidth: 60, minHeight: 60 }}
    >
      <rect width={svgW} height={svgH} fill="#F8F7F5" />
      {lines}
      <rect width={svgW} height={svgH} fill="none" stroke="#D0C8BF" strokeWidth="1.5" />
    </svg>
  );
}

export function NewLayoutSetupModal({ isOpen, onConfirm, onDismiss }: Props) {
  const unitSystem = useCanvasStore((s) => s.unitSystem);
  const isMetric = unitSystem === 'metric';

  // Dimensions in inches (always stored as inches internally)
  const [widthIn, setWidthIn] = useState(48);
  const [heightIn, setHeightIn] = useState(48);
  const [customW, setCustomW] = useState('');
  const [customH, setCustomH] = useState('');
  const [blockSize, setBlockSize] = useState(12);
  const [cellSize, setCellSize] = useState(isMetric ? 20 / IN_TO_CM : 1); // 20mm ≈ 1"
  const [activePresetLabel, setActivePresetLabel] = useState<string | null>(null);

  if (!isOpen) return null;

  const rows = Math.max(1, Math.round(heightIn / blockSize));
  const cols = Math.max(1, Math.round(widthIn / blockSize));

  function selectPreset(preset: QuiltSizePreset) {
    setWidthIn(preset.w);
    setHeightIn(preset.h);
    setActivePresetLabel(preset.label);
    setCustomW('');
    setCustomH('');
  }

  function commitCustom() {
    const w = isMetric ? parseFloat(customW) / IN_TO_CM : parseFloat(customW);
    const h = isMetric ? parseFloat(customH) / IN_TO_CM : parseFloat(customH);
    if (w > 0) { setWidthIn(w); setActivePresetLabel(null); }
    if (h > 0) { setHeightIn(h); setActivePresetLabel(null); }
  }

  const displayW = isMetric ? +(inToCm(widthIn)).toFixed(1) : widthIn;
  const displayH = isMetric ? +(inToCm(heightIn)).toFixed(1) : heightIn;
  const unit = isMetric ? 'cm' : '"';

  const cellOptions = isMetric
    ? CELL_SIZES_MM.map((mm) => ({ label: fmtMm(mm), value: mm / 10 / IN_TO_CM }))
    : CELL_SIZES_IN.map((i) => ({ label: fmtIn(i), value: i }));

  function handleConfirm() {
    onConfirm(rows, cols, blockSize, cellSize);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40">
      <div className="w-full max-w-xl rounded-2xl bg-surface shadow-elevation-3 p-6">
        {/* Header */}
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-on-surface">New Layout</h2>
          <p className="text-sm text-secondary mt-0.5">
            Set up your quilt layout before you start designing.
          </p>
        </div>

        <div className="flex gap-5 mb-5">
          {/* Left: options */}
          <div className="flex-1 flex flex-col gap-4">

            {/* Quilt Dimensions */}
            <div>
              <p className="text-xs font-medium text-secondary uppercase tracking-wide mb-2">
                Quilt Dimensions
              </p>
              {/* Preset chips */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {QUILT_PRESETS.map((preset) => {
                  const pw = isMetric ? +(inToCm(preset.w)).toFixed(0) : preset.w;
                  const ph = isMetric ? +(inToCm(preset.h)).toFixed(0) : preset.h;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      title={`${preset.name}: ${pw}${unit} × ${ph}${unit}`}
                      onClick={() => selectPreset(preset)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                        activePresetLabel === preset.label
                          ? 'bg-gradient-to-r from-orange-500 to-rose-400 text-white shadow-elevation-1'
                          : 'bg-surface-container text-secondary hover:bg-surface-container-high'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
              {/* Custom W × H */}
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="text-[10px] text-secondary mb-0.5 block">Width ({unit})</label>
                  <input
                    type="number"
                    min={1}
                    step={isMetric ? 1 : 0.25}
                    value={customW !== '' ? customW : displayW}
                    onChange={(e) => { setCustomW(e.target.value); setActivePresetLabel(null); }}
                    onBlur={commitCustom}
                    className="w-full rounded-lg border border-outline-variant bg-surface-container px-2.5 py-1.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <span className="text-secondary text-sm mt-4">×</span>
                <div className="flex-1">
                  <label className="text-[10px] text-secondary mb-0.5 block">Height ({unit})</label>
                  <input
                    type="number"
                    min={1}
                    step={isMetric ? 1 : 0.25}
                    value={customH !== '' ? customH : displayH}
                    onChange={(e) => { setCustomH(e.target.value); setActivePresetLabel(null); }}
                    onBlur={commitCustom}
                    className="w-full rounded-lg border border-outline-variant bg-surface-container px-2.5 py-1.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>
            </div>

            {/* Block Size */}
            <div>
              <p className="text-xs font-medium text-secondary uppercase tracking-wide mb-2">
                Block Size
              </p>
              <div className="flex flex-wrap gap-2">
                {BLOCK_SIZES.map((size) => {
                  const display = isMetric ? `${+(inToCm(size)).toFixed(1)}cm` : `${size}"`;
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setBlockSize(size)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        blockSize === size
                          ? 'bg-gradient-to-r from-orange-500 to-rose-400 text-white shadow-elevation-1'
                          : 'bg-surface-container text-secondary hover:bg-surface-container-high'
                      }`}
                    >
                      {display}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Grid Cell Size */}
            <div>
              <p className="text-xs font-medium text-secondary uppercase tracking-wide mb-2">
                Grid Cell Size
              </p>
              <div className="flex flex-wrap gap-2">
                {cellOptions.map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => setCellSize(opt.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      Math.abs(cellSize - opt.value) < 0.001
                        ? 'bg-gradient-to-r from-orange-500 to-rose-400 text-white shadow-elevation-1'
                        : 'bg-surface-container text-secondary hover:bg-surface-container-high'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="p-3 bg-surface-container rounded-xl">
              <p className="text-xs text-secondary mb-1">Layout</p>
              <p className="text-sm font-semibold text-on-surface">
                {rows} rows × {cols} cols &nbsp;·&nbsp; {displayW}{unit} × {displayH}{unit}
              </p>
              {!isMetric && (
                <p className="text-xs text-secondary mt-0.5">
                  {(widthIn / 12).toFixed(2)} ft × {(heightIn / 12).toFixed(2)} ft
                </p>
              )}
            </div>
          </div>

          {/* Right: preview */}
          <div className="flex flex-col items-center justify-start gap-2 pt-6">
            <LayoutPreview rows={rows} cols={cols} aspectW={widthIn} aspectH={heightIn} />
            <p className="text-xs text-secondary text-center">
              {rows} rows × {cols} cols
            </p>
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
            Create Layout
          </button>
        </div>
      </div>
    </div>
  );
}
