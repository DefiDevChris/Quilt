'use client';

import { useMemo } from 'react';
import { X } from 'lucide-react';
import { useLayoutStore } from '@/stores/layoutStore';
import { useProjectStore } from '@/stores/projectStore';
import { useCanvasStore } from '@/stores/canvasStore';
import { useCanvasContext } from '@/contexts/CanvasContext';

/**
 * QuiltSizePanel — left-rail panel for editing the live quilt dimensions.
 *
 * Replaces the full-screen NewProjectWizard step-2 modal when the user is
 * already inside the studio. Every slider writes directly to `useLayoutStore`;
 * `LayoutAdjuster` (in src/components/fabrics/LayoutAdjuster.tsx) subscribes
 * to that store and repaints the canvas on every change, so the preview
 * updates in real time as the sliders move.
 *
 * Keeping this as a thin UI layer over layoutStore avoids duplicating the
 * size-math that lives in layoutStore.applyLayout() and prevents the two
 * sources of truth (wizard vs. store) from drifting apart.
 */
interface QuiltSizePanelProps {
  onDismiss: () => void;
}

const BLOCK_SIZE_MIN = 4;
const BLOCK_SIZE_MAX = 24;
const BLOCK_SIZE_STEP = 0.5;
const SASHING_MIN = 0;
const SASHING_MAX = 4;
const SASHING_STEP = 0.25;
const BORDER_MIN = 0;
const BORDER_MAX = 12;
const BORDER_STEP = 0.25;
const BINDING_MIN = 0;
const BINDING_MAX = 2;
const BINDING_STEP = 0.125;
const ROW_COL_MIN = 1;
const ROW_COL_MAX = 20;

function formatInches(value: number): string {
  if (Number.isInteger(value)) return `${value}"`;
  return `${value.toFixed(2).replace(/\.?0+$/, '')}"`;
}

export function QuiltSizePanel({ onDismiss }: QuiltSizePanelProps) {
  const rows = useLayoutStore((s) => s.rows);
  const cols = useLayoutStore((s) => s.cols);
  const blockSize = useLayoutStore((s) => s.blockSize);
  const sashing = useLayoutStore((s) => s.sashing);
  const borders = useLayoutStore((s) => s.borders);
  const bindingWidth = useLayoutStore((s) => s.bindingWidth);
  const hasCornerstones = useLayoutStore((s) => s.hasCornerstones);

  const setRows = useLayoutStore((s) => s.setRows);
  const setCols = useLayoutStore((s) => s.setCols);
  const setBlockSize = useLayoutStore((s) => s.setBlockSize);
  const setSashing = useLayoutStore((s) => s.setSashing);
  const setBorders = useLayoutStore((s) => s.setBorders);
  const setBindingWidth = useLayoutStore((s) => s.setBindingWidth);
  const setHasCornerstones = useLayoutStore((s) => s.setHasCornerstones);
  const applyLayout = useLayoutStore((s) => s.applyLayout);

  const { getCanvas } = useCanvasContext();

  const finishedSize = useMemo(() => {
    const sashingW = (sashing?.width ?? 0);
    const interiorW = cols * blockSize + Math.max(0, cols - 1) * sashingW;
    const interiorH = rows * blockSize + Math.max(0, rows - 1) * sashingW;
    const bordersW = (borders ?? []).reduce((sum: number, b) => sum + (b?.width ?? 0), 0);
    const width = interiorW + 2 * bordersW + 2 * bindingWidth;
    const height = interiorH + 2 * bordersW + 2 * bindingWidth;
    return { width, height };
  }, [rows, cols, blockSize, sashing, borders, bindingWidth]);

  const commit = () => {
    applyLayout();
    const canvas = getCanvas();
    if (canvas) {
      useCanvasStore
        .getState()
        .centerAndFitViewport(canvas, finishedSize.width, finishedSize.height);
    }
    useProjectStore.getState().setCanvasDimensions(finishedSize.width, finishedSize.height);
    useProjectStore.getState().setDirty(true);
  };

  const handleRowsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRows(parseInt(e.target.value, 10));
    commit();
  };
  const handleColsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCols(parseInt(e.target.value, 10));
    commit();
  };
  const handleBlockSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBlockSize(parseFloat(e.target.value));
    commit();
  };
  const handleSashingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSashing({ ...sashing, width: parseFloat(e.target.value) });
    commit();
  };
  const handleBorderChange = (index: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = [...(borders ?? [])];
    const width = parseFloat(e.target.value);
    next[index] = { ...(next[index] ?? { color: '#fff' }), width };
    setBorders(next);
    commit();
  };
  const handleBindingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBindingWidth(parseFloat(e.target.value));
    commit();
  };

  return (
    <aside
      className="w-[320px] h-full flex-shrink-0 flex flex-col bg-[var(--color-bg)] border-r border-[var(--color-border)]/15 overflow-hidden"
      aria-label="Quilt size panel"
    >
      <header className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]/15 flex-shrink-0">
        <div>
          <h2 className="text-[14px] font-semibold text-[var(--color-text)]">Set your quilt size</h2>
          <p className="text-[11px] text-[var(--color-text-dim)]">
            Live preview updates on the canvas.
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:bg-[var(--color-border)]/30 transition-colors"
          aria-label="Close quilt size panel"
        >
          <X size={14} strokeWidth={1.75} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        <section className="space-y-3">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-dim)]">
            Grid
          </h3>
          <SliderRow
            label="Rows"
            value={rows}
            min={ROW_COL_MIN}
            max={ROW_COL_MAX}
            step={1}
            onChange={handleRowsChange}
            format={(v) => String(v)}
          />
          <SliderRow
            label="Columns"
            value={cols}
            min={ROW_COL_MIN}
            max={ROW_COL_MAX}
            step={1}
            onChange={handleColsChange}
            format={(v) => String(v)}
          />
        </section>

        <section className="space-y-3">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-dim)]">
            Block
          </h3>
          <SliderRow
            label="Block size"
            value={blockSize}
            min={BLOCK_SIZE_MIN}
            max={BLOCK_SIZE_MAX}
            step={BLOCK_SIZE_STEP}
            onChange={handleBlockSizeChange}
            format={formatInches}
          />
        </section>

        <section className="space-y-3">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-dim)]">
            Sashing
          </h3>
          <SliderRow
            label="Width"
            value={sashing?.width ?? 0}
            min={SASHING_MIN}
            max={SASHING_MAX}
            step={SASHING_STEP}
            onChange={handleSashingChange}
            format={formatInches}
          />
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={hasCornerstones}
              onChange={(e) => {
                setHasCornerstones(e.target.checked);
                commit();
              }}
              className="accent-[var(--color-primary)] h-3.5 w-3.5"
            />
            <span className="text-[11px] text-[var(--color-text-dim)]">Cornerstones</span>
          </label>
        </section>

        <section className="space-y-3">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-dim)]">
            Borders
          </h3>
          {(borders ?? []).slice(0, 3).map((b, i) => (
            <SliderRow
              key={`border-${i}`}
              label={`Border ${i + 1}`}
              value={b?.width ?? 0}
              min={BORDER_MIN}
              max={BORDER_MAX}
              step={BORDER_STEP}
              onChange={handleBorderChange(i)}
              format={formatInches}
            />
          ))}
          {(borders ?? []).length === 0 && (
            <p className="text-[10px] text-[var(--color-text-dim)]/70">
              No borders defined — add one from the layout picker.
            </p>
          )}
        </section>

        <section className="space-y-3">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-dim)]">
            Binding
          </h3>
          <SliderRow
            label="Width"
            value={bindingWidth}
            min={BINDING_MIN}
            max={BINDING_MAX}
            step={BINDING_STEP}
            onChange={handleBindingChange}
            format={formatInches}
          />
        </section>
      </div>

      <footer className="border-t border-[var(--color-border)]/15 px-4 py-3 flex-shrink-0">
        <p className="text-[10px] uppercase tracking-[0.1em] text-[var(--color-text-dim)] mb-0.5">
          Finished size
        </p>
        <p className="text-[15px] font-semibold text-[var(--color-text)] font-mono">
          {formatInches(finishedSize.width)} × {formatInches(finishedSize.height)}
        </p>
      </footer>
    </aside>
  );
}

interface SliderRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  format: (v: number) => string;
}

function SliderRow({ label, value, min, max, step, onChange, format }: SliderRowProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-[var(--color-text)]">{label}</span>
        <span className="text-[10px] font-mono text-[var(--color-text-dim)] bg-[var(--color-bg)] border border-[var(--color-border)]/30 rounded px-1.5 py-0.5">
          {format(value)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
        className="w-full accent-[var(--color-primary)] h-1"
      />
    </div>
  );
}
