'use client';

import { SliderRow } from '@/components/ui/SliderRow';
import { FREEFORM_DIM_MAX, FREEFORM_DIM_MIN } from './layout-helpers';

interface FreeformConfigPanelProps {
  readonly width: number;
  readonly height: number;
  readonly bindingWidth: number;
  readonly onWidthChange: (v: number) => void;
  readonly onHeightChange: (v: number) => void;
  readonly onBindingWidthChange: (v: number) => void;
  readonly onCommit: () => void;
}

export function FreeformConfigPanel({
  width,
  height,
  bindingWidth,
  onWidthChange,
  onHeightChange,
  onBindingWidthChange,
  onCommit,
}: FreeformConfigPanelProps) {
  return (
    <>
      <div className="flex items-center px-4 py-3 border-b border-[var(--color-border)]/50 flex-shrink-0">
        <div>
          <h2 className="text-[14px] font-semibold text-[var(--color-text)]">Custom Size</h2>
          <p className="text-[11px] text-[var(--color-text-dim)]">
            Pick a preset or set width &amp; height directly.
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <section className="space-y-3">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-dim)]">
            Dimensions
          </h3>
          <SliderRow
            label="Width"
            value={width}
            min={FREEFORM_DIM_MIN}
            max={FREEFORM_DIM_MAX}
            step={1}
            onChange={onWidthChange}
            format={(v) => `${v}″`}
          />
          <SliderRow
            label="Height"
            value={height}
            min={FREEFORM_DIM_MIN}
            max={FREEFORM_DIM_MAX}
            step={1}
            onChange={onHeightChange}
            format={(v) => `${v}″`}
          />
        </section>

        <section className="space-y-3 pt-2 border-t border-[var(--color-border)]">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-dim)]">
            Binding
          </h3>
          <SliderRow
            label="Width"
            value={bindingWidth}
            min={0}
            max={2}
            step={0.125}
            onChange={onBindingWidthChange}
            format={(v) => `${v}″`}
          />
        </section>

        <div className="rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]/30 p-3">
          <div className="text-[10px] uppercase tracking-[0.1em] text-[var(--color-text-dim)] mb-0.5">
            Finished Size
          </div>
          <div className="text-[14px] font-semibold text-[var(--color-text)] font-mono">
            {width}″ × {height}″
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
