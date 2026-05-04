'use client';

import type { UserLayoutTemplate } from '@/types/layoutTemplate';

interface UserTemplateConfigPanelProps {
  readonly template: UserLayoutTemplate;
  readonly onCommit: () => void;
}

export function UserTemplateConfigPanel({ template, onCommit }: UserTemplateConfigPanelProps) {
  return (
    <>
      <div className="flex items-center px-4 py-3 border-b border-[var(--color-border)]/50 flex-shrink-0">
        <div>
          <h2 className="text-[14px] font-semibold text-[var(--color-text)]">{template.name}</h2>
          {template.description && (
            <p className="text-[11px] text-[var(--color-text-dim)]">{template.description}</p>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
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
