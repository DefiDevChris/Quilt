/**
 * Templates Panel Component
 *
 * Contextual left panel for Template mode projects.
 * Shows a grid of 8 curated starter templates with previews.
 * Dismissible with X.
 */

import { useCallback } from 'react';
import { useLeftPanelStore } from '@/stores/leftPanelStore';
import { QUILT_TEMPLATES, type QuiltTemplate, type TemplateCategory } from '@/lib/templates';
import { TemplateThumbnail } from '@/lib/layout-thumbnail';

interface TemplatesPanelProps {
  onDismiss: () => void;
}

const CATEGORIES: { id: TemplateCategory; label: string }[] = [
  { id: 'traditional', label: 'Traditional' },
  { id: 'modern', label: 'Modern' },
  { id: 'baby', label: 'Baby' },
  { id: 'seasonal', label: 'Seasonal' },
];

export function TemplatesPanel({ onDismiss }: TemplatesPanelProps) {
  const startPreview = useLeftPanelStore((s) => s.startPreview);

  const handleTemplateClick = useCallback((template: QuiltTemplate) => {
    startPreview(JSON.stringify(template), template.name);
  }, [startPreview]);

  return (
    <div className="w-[280px] h-full bg-[var(--color-surface)] border-r border-[var(--color-border)] flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]/50">
        <h2 className="text-[16px] font-semibold text-[var(--color-text)]">Templates</h2>
        <button
          type="button"
          onClick={onDismiss}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:bg-[var(--color-border)]/30 transition-colors"
          aria-label="Close"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="flex gap-2 px-4 py-2 border-b border-[var(--color-border)]/30 overflow-x-auto">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            className="px-3 py-1 text-[12px] font-medium text-[var(--color-text-dim)] bg-[var(--color-bg)] rounded-full hover:bg-[var(--color-border)]/30 transition-colors whitespace-nowrap"
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-2 gap-3">
          {QUILT_TEMPLATES.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => handleTemplateClick(template)}
              className="flex flex-col items-center p-2 rounded-lg border border-[var(--color-border)]/30 hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-bg)] transition-colors"
            >
              <div className="w-full aspect-square rounded-md overflow-hidden bg-[var(--color-bg)] mb-2">
                <TemplateThumbnail template={template} className="w-full h-full" />
              </div>
              <span className="text-[12px] font-medium text-[var(--color-text)] text-center truncate w-full">
                {template.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}