'use client';

import { SliderRow } from '@/components/ui/SliderRow';
import { QUILT_TEMPLATES } from '@/lib/templates';
import { useLayoutStore } from '@/stores/layoutStore';

interface TemplateConfigPanelProps {
  readonly templateId: string;
  readonly onCommit: () => void;
}

export function TemplateConfigPanel({ templateId, onCommit }: TemplateConfigPanelProps) {
  const bindingWidth = useLayoutStore((s) => s.bindingWidth);
  const setBindingWidth = useLayoutStore((s) => s.setBindingWidth);

  const template = QUILT_TEMPLATES.find((t) => t.id === templateId);
  if (!template) return null;

  return (
    <>
      <div className="flex items-center px-4 py-3 border-b border-[var(--color-border)]/50 flex-shrink-0">
        <div>
          <h2 className="text-[14px] font-semibold text-[var(--color-text)]">{template.name}</h2>
          <p className="text-[11px] text-[var(--color-text-dim)]">{template.description}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <section className="space-y-3">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-dim)]">
            Settings
          </h3>
          <SliderRow
            label="Binding Width"
            value={bindingWidth}
            min={0}
            max={2}
            step={0.125}
            onChange={setBindingWidth}
            format={(v) => `${v}″`}
          />
        </section>

        <div className="rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]/30 p-3">
          <div className="text-[10px] uppercase tracking-[0.1em] text-[var(--color-text-dim)] mb-0.5">
            Template Size
          </div>
          <div className="text-[14px] font-semibold text-[var(--color-text)] font-mono">
            {template.canvasWidth}″ × {template.canvasHeight}″
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
