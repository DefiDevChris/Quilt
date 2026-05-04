'use client';

import { SliderRow } from '@/components/ui/SliderRow';
import { getLayoutPreset } from '@/lib/layout-library';
import { LAYOUT_TYPE_CARDS } from '@/lib/layout-type-cards';
import { computeLayoutDimensions, type LayoutType } from '@/lib/layout-utils';
import { useLayoutStore } from '@/stores/layoutStore';

interface LayoutConfigPanelProps {
  readonly presetId: string;
  readonly onCommit: () => void;
}

export function LayoutConfigPanel({ presetId, onCommit }: LayoutConfigPanelProps) {
  const rows = useLayoutStore((s) => s.rows);
  const cols = useLayoutStore((s) => s.cols);
  const blockSize = useLayoutStore((s) => s.blockSize);
  const sashing = useLayoutStore((s) => s.sashing);
  const borders = useLayoutStore((s) => s.borders);
  const hasCornerstones = useLayoutStore((s) => s.hasCornerstones);
  const bindingWidth = useLayoutStore((s) => s.bindingWidth);

  const setRows = useLayoutStore((s) => s.setRows);
  const setCols = useLayoutStore((s) => s.setCols);
  const setBlockSize = useLayoutStore((s) => s.setBlockSize);
  const setSashing = useLayoutStore((s) => s.setSashing);
  const setHasCornerstones = useLayoutStore((s) => s.setHasCornerstones);
  const setBindingWidth = useLayoutStore((s) => s.setBindingWidth);
  const addBorder = useLayoutStore((s) => s.addBorder);
  const updateBorder = useLayoutStore((s) => s.updateBorder);
  const removeBorder = useLayoutStore((s) => s.removeBorder);

  const preset = getLayoutPreset(presetId);
  if (!preset) return null;

  const card = LAYOUT_TYPE_CARDS.find((c) => c.id === preset.category);

  const size = computeLayoutDimensions({
    type: preset.category as LayoutType,
    rows,
    cols,
    blockSize,
    sashingWidth: sashing.width,
    borders,
    bindingWidth,
  });

  return (
    <>
      <div className="flex items-center px-4 py-3 border-b border-[var(--color-border)]/50 flex-shrink-0">
        <div>
          <h2 className="text-[14px] font-semibold text-[var(--color-text)]">{preset.name}</h2>
          <p className="text-[11px] text-[var(--color-text-dim)]">Adjust your layout</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {card?.hasGridConfig && (
          <section className="space-y-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-dim)]">
              Grid
            </h3>
            <SliderRow label="Rows" value={rows} min={1} max={20} step={1} onChange={setRows} format={(v) => String(v)} />
            <SliderRow label="Columns" value={cols} min={1} max={20} step={1} onChange={setCols} format={(v) => String(v)} />
            <SliderRow label="Block Size" value={blockSize} min={2} max={24} step={0.5} onChange={setBlockSize} format={(v) => `${v}″`} />
          </section>
        )}

        {card?.hasSashing && (
          <section className="space-y-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-dim)]">
              Sashing
            </h3>
            <SliderRow
              label="Width"
              value={sashing.width}
              min={0}
              max={6}
              step={0.25}
              onChange={(v) => setSashing({ ...sashing, width: v })}
              format={(v) => `${v}″`}
            />
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hasCornerstones}
                onChange={(e) => setHasCornerstones(e.target.checked)}
                className="accent-[var(--color-primary)] h-3.5 w-3.5"
              />
              <span className="text-[11px] text-[var(--color-text)]">Cornerstones</span>
            </label>
          </section>
        )}

        {card?.hasBorders && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-dim)]">
                Borders
              </h3>
              {borders.length < 5 && (
                <button
                  type="button"
                  onClick={addBorder}
                  className="text-[10px] font-medium px-2 py-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] transition-colors duration-150"
                >
                  + Add
                </button>
              )}
            </div>
            {borders.map((border, i) => (
              <div key={border.id ?? i} className="flex items-center gap-2">
                <input
                  type="range"
                  min={0.5}
                  max={8}
                  step={0.5}
                  value={border.width}
                  onChange={(e) => updateBorder(i, { width: parseFloat(e.target.value) })}
                  className="flex-1 accent-[var(--color-primary)] h-1"
                />
                <span className="text-[11px] font-mono w-8 text-[var(--color-text-dim)] text-right">
                  {border.width}″
                </span>
                <button
                  type="button"
                  onClick={() => removeBorder(i)}
                  className="text-[var(--color-error)] text-xs font-bold px-1"
                >
                  ×
                </button>
              </div>
            ))}
            {borders.length === 0 && (
              <p className="text-[10px] text-[var(--color-text-dim)]/70">No borders added yet.</p>
            )}
          </section>
        )}

        {card?.hasBinding && (
          <section className="space-y-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-dim)]">
              Binding
            </h3>
            <SliderRow
              label="Width"
              value={bindingWidth}
              min={0}
              max={2}
              step={0.125}
              onChange={setBindingWidth}
              format={(v) => `${v}″`}
            />
          </section>
        )}

        <div className="rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]/30 p-3">
          <div className="text-[10px] uppercase tracking-[0.1em] text-[var(--color-text-dim)] mb-0.5">
            Finished Size
          </div>
          <div className="text-[14px] font-semibold text-[var(--color-text)] font-mono">
            {size.width}″ × {size.height}″
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-[var(--color-border)]/50 flex-shrink-0">
        <button type="button" onClick={onCommit} className="btn-primary w-full">
          Start Designing
        </button>
      </div>
    </>
  );
}
