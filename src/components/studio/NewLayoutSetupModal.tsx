'use client';

import { useState, useMemo } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { LAYOUT_PRESETS, PRESET_SVG, type LayoutPreset } from '@/lib/layout-library';
import {
  getRecentLayoutConfigs,
  saveRecentLayoutConfig,
  getCellSizeQualityLabel,
} from '@/lib/recent-setup-configs';

interface Props {
  isOpen: boolean;
  onConfirm: (
    rows: number,
    cols: number,
    blockSize: number,
    cellSize: number,
    presetId?: string
  ) => void;
  onDismiss: () => void;
}

interface QuiltSizePreset {
  label: string;
  name: string;
  w: number;
  h: number;
}

const QUILT_PRESETS: QuiltSizePreset[] = [
  { label: 'Wall', name: 'Wall Hanging', w: 36, h: 36 },
  { label: 'Baby', name: 'Baby Quilt', w: 36, h: 45 },
  { label: 'Throw', name: 'Throw', w: 54, h: 72 },
  { label: 'Twin', name: 'Twin', w: 63, h: 87 },
  { label: 'Queen', name: 'Queen', w: 90, h: 108 },
  { label: 'King', name: 'King', w: 108, h: 108 },
];

const SMART_DEFAULTS: Record<string, { blockSize: number; cellSize: number }> = {
  Wall: { blockSize: 6, cellSize: 1 },
  Baby: { blockSize: 6, cellSize: 1 },
  Throw: { blockSize: 9, cellSize: 1 },
  Twin: { blockSize: 12, cellSize: 2 },
  Queen: { blockSize: 12, cellSize: 2 },
  King: { blockSize: 12, cellSize: 2 },
};

const BLOCK_SIZES = [6, 9, 12] as const;
const CELL_SIZES_IN = [0.25, 0.5, 1, 2, 3] as const;
const CELL_SIZES_MM = [5, 10, 20, 50, 75] as const;

const PREVIEW_MAX = 110;
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

const CATEGORY_LABELS: Record<string, string> = {
  grid: 'Straight Set',
  sashing: 'Sashing',
  'on-point': 'On-Point',
};

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

function TemplatePicker({
  onSelect,
}: {
  onSelect: (preset: LayoutPreset) => void;
}) {
  const grouped = useMemo(() => {
    return LAYOUT_PRESETS.reduce<Record<string, LayoutPreset[]>>((acc, p) => {
      const key = p.category;
      if (!acc[key]) acc[key] = [];
      acc[key].push(p);
      return acc;
    }, {});
  }, []);

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([category, presets]) => (
        <div key={category}>
          <p className="text-xs font-medium text-secondary uppercase tracking-wide mb-2">
            {CATEGORY_LABELS[category] ?? category}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {presets.map((preset) => {
              const svgSrc = PRESET_SVG[preset.id];
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onSelect(preset)}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors group"
                >
                  <div className="w-16 h-16 rounded-md overflow-hidden bg-surface flex items-center justify-center">
                    {svgSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={svgSrc}
                        alt={preset.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <span className="text-xs text-secondary">
                        {preset.config.cols}×{preset.config.rows}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-medium text-on-surface text-center leading-tight">
                    {preset.name}
                  </span>
                  <span className="text-[10px] text-secondary text-center leading-tight">
                    {preset.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export function NewLayoutSetupModal({ isOpen, onConfirm, onDismiss }: Props) {
  const unitSystem = useCanvasStore((s) => s.unitSystem);
  const isMetric = unitSystem === 'metric';

  const [activeTab, setActiveTab] = useState<'scratch' | 'template'>('scratch');
  const [widthIn, setWidthIn] = useState(48);
  const [heightIn, setHeightIn] = useState(48);
  const [customW, setCustomW] = useState('');
  const [customH, setCustomH] = useState('');
  const [blockSize, setBlockSize] = useState(12);
  const [cellSize, setCellSize] = useState(isMetric ? 20 / IN_TO_CM : 1);
  const [activePresetLabel, setActivePresetLabel] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  const recentConfigs = useMemo(() => (isOpen ? getRecentLayoutConfigs() : []), [isOpen]);

  if (!isOpen) return null;

  const rows = Math.max(1, Math.round(heightIn / blockSize));
  const cols = Math.max(1, Math.round(widthIn / blockSize));

  const displayW = isMetric ? +inToCm(widthIn).toFixed(1) : widthIn;
  const displayH = isMetric ? +inToCm(heightIn).toFixed(1) : heightIn;
  const unit = isMetric ? 'cm' : '"';

  const cellOptions = isMetric
    ? CELL_SIZES_MM.map((mm) => ({ label: fmtMm(mm), value: mm / 10 / IN_TO_CM }))
    : CELL_SIZES_IN.map((i) => ({ label: fmtIn(i), value: i }));

  const cellDivisions = blockSize / cellSize;
  const qualityLabel = getCellSizeQualityLabel(Math.round(cellDivisions));

  function selectPreset(preset: QuiltSizePreset) {
    setWidthIn(preset.w);
    setHeightIn(preset.h);
    setActivePresetLabel(preset.label);
    setSelectedTemplateId(null);
    setCustomW('');
    setCustomH('');

    const defaults = SMART_DEFAULTS[preset.label];
    if (defaults) {
      setBlockSize(defaults.blockSize);
      setCellSize(isMetric ? defaults.cellSize : defaults.cellSize);
    }
  }

  function handleTemplateSelect(preset: LayoutPreset) {
    const w = preset.config.cols * preset.config.blockSize;
    const h = preset.config.rows * preset.config.blockSize;
    setWidthIn(w);
    setHeightIn(h);
    setBlockSize(preset.config.blockSize);
    setCellSize(1);
    setSelectedTemplateId(preset.id);
    setActivePresetLabel(null);
    setCustomW('');
    setCustomH('');
    setActiveTab('scratch');
  }

  function handleRecentClick(config: {
    widthIn: number;
    heightIn: number;
    blockSize: number;
    cellSize: number;
    presetLabel: string | null;
  }) {
    setWidthIn(config.widthIn);
    setHeightIn(config.heightIn);
    setBlockSize(config.blockSize);
    setCellSize(config.cellSize);
    setActivePresetLabel(config.presetLabel);
    setSelectedTemplateId(null);
    setCustomW('');
    setCustomH('');
  }

  function commitCustom() {
    const w = isMetric ? parseFloat(customW) / IN_TO_CM : parseFloat(customW);
    const h = isMetric ? parseFloat(customH) / IN_TO_CM : parseFloat(customH);
    if (w > 0) {
      setWidthIn(w);
      setActivePresetLabel(null);
      setSelectedTemplateId(null);
    }
    if (h > 0) {
      setHeightIn(h);
      setActivePresetLabel(null);
      setSelectedTemplateId(null);
    }
  }

  function handleConfirm() {
    saveRecentLayoutConfig({
      widthIn,
      heightIn,
      blockSize,
      cellSize,
      presetLabel: activePresetLabel,
    });
    onConfirm(rows, cols, blockSize, cellSize, selectedTemplateId ?? undefined);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40">
      <div className="w-full max-w-xl rounded-2xl bg-surface shadow-elevation-3 p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-on-surface">New Layout</h2>
          <p className="text-sm text-secondary mt-0.5">
            Pick a starting point — you can always change it later.
          </p>
        </div>

        {/* Tab toggle */}
        <div className="flex rounded-full bg-surface-container p-1 mb-4">
          <button
            type="button"
            onClick={() => setActiveTab('scratch')}
            className={`flex-1 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'scratch'
                ? 'bg-gradient-to-r from-orange-500 to-rose-400 text-white shadow-elevation-1'
                : 'text-secondary hover:text-on-surface'
            }`}
          >
            From Scratch
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('template')}
            className={`flex-1 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'template'
                ? 'bg-gradient-to-r from-orange-500 to-rose-400 text-white shadow-elevation-1'
                : 'text-secondary hover:text-on-surface'
            }`}
          >
            From Template
          </button>
        </div>

        {activeTab === 'template' ? (
          /* ── Template Picker ── */
          <div className="mb-5">
            <TemplatePicker onSelect={handleTemplateSelect} />
          </div>
        ) : (
          /* ── From Scratch ── */
          <>
            {/* Recent configs */}
            {recentConfigs.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-medium text-secondary uppercase tracking-wide mb-1.5">
                  Recent
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {recentConfigs.map((config) => {
                    const dW = isMetric
                      ? `${+inToCm(config.widthIn).toFixed(0)}cm`
                      : `${config.widthIn}"`;
                    const dH = isMetric
                      ? `${+inToCm(config.heightIn).toFixed(0)}cm`
                      : `${config.heightIn}"`;
                    const label = config.presetLabel ?? 'Custom';
                    return (
                      <button
                        key={`${config.widthIn}-${config.heightIn}-${config.blockSize}`}
                        type="button"
                        onClick={() => handleRecentClick(config)}
                        className="px-3 py-1.5 rounded-full text-xs font-medium bg-surface-container text-secondary hover:bg-surface-container-high transition-colors border border-outline-variant/40"
                      >
                        {label} · {dW}×{dH}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex gap-5 mb-5">
              {/* Left: options */}
              <div className="flex-1 flex flex-col gap-4">
                {/* Quilt Dimensions */}
                <div>
                  <p className="text-xs font-medium text-secondary uppercase tracking-wide mb-2">
                    What are you making?
                  </p>
                  {/* Preset chips */}
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {QUILT_PRESETS.map((preset) => {
                      const pw = isMetric ? +inToCm(preset.w).toFixed(0) : preset.w;
                      const ph = isMetric ? +inToCm(preset.h).toFixed(0) : preset.h;
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
                  {/* Dimension hint for active preset */}
                  {activePresetLabel && (
                    <p className="text-[10px] text-secondary mb-2">
                      {QUILT_PRESETS.find((p) => p.label === activePresetLabel)?.name}:{' '}
                      {displayW}
                      {unit} × {displayH}
                      {unit}
                    </p>
                  )}
                  {/* Custom W × H */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <label className="text-[10px] text-secondary mb-0.5 block">
                        Width ({unit})
                      </label>
                      <input
                        type="number"
                        min={1}
                        step={isMetric ? 1 : 0.25}
                        value={customW !== '' ? customW : displayW}
                        onChange={(e) => {
                          setCustomW(e.target.value);
                          setActivePresetLabel(null);
                          setSelectedTemplateId(null);
                        }}
                        onBlur={commitCustom}
                        className="w-full rounded-lg border border-outline-variant bg-surface-container px-2.5 py-1.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                    <span className="text-secondary text-sm mt-4">×</span>
                    <div className="flex-1">
                      <label className="text-[10px] text-secondary mb-0.5 block">
                        Height ({unit})
                      </label>
                      <input
                        type="number"
                        min={1}
                        step={isMetric ? 1 : 0.25}
                        value={customH !== '' ? customH : displayH}
                        onChange={(e) => {
                          setCustomH(e.target.value);
                          setActivePresetLabel(null);
                          setSelectedTemplateId(null);
                        }}
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
                      const display = isMetric ? `${+inToCm(size).toFixed(1)}cm` : `${size}"`;
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => {
                            setBlockSize(size);
                            setSelectedTemplateId(null);
                          }}
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
                        onClick={() => {
                          setCellSize(opt.value);
                          setSelectedTemplateId(null);
                        }}
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
                  <p className="text-xs text-secondary mb-1">Layout Summary</p>
                  <p className="text-sm font-semibold text-on-surface">
                    {rows} rows × {cols} cols &nbsp;·&nbsp; {displayW}
                    {unit} × {displayH}
                    {unit}
                  </p>
                  <p className="text-xs text-secondary mt-0.5">
                    {isMetric
                      ? `${+inToCm(blockSize).toFixed(1)}cm blocks`
                      : `${blockSize}" blocks`}{' '}
                    · {qualityLabel} grid
                    {!isMetric &&
                      ` · ${(widthIn / 12).toFixed(1)} ft × ${(heightIn / 12).toFixed(1)} ft`}
                  </p>
                  {selectedTemplateId && (
                    <p className="text-[10px] text-primary mt-1">
                      Based on{' '}
                      {LAYOUT_PRESETS.find((p) => p.id === selectedTemplateId)?.name ?? 'template'}
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
          </>
        )}

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
