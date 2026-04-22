/**
 * Templates Panel Component
 *
 * Contextual left panel for Template mode projects.
 * Shows a grid of 8 curated starter templates with previews.
 * Dismissible with X.
 */

import { useCallback, useMemo, useState } from 'react';
import { useLeftPanelStore } from '@/stores/leftPanelStore';
import { QUILT_TEMPLATES } from '@/lib/templates';
import { TemplateThumbnail } from '@/lib/template-thumbnail';
import type { QuiltTemplate, TemplateCategory } from '@/lib/templates';

interface TemplatesPanelProps {
  onDismiss: () => void;
}

type CategoryFilter = TemplateCategory | 'all';

const CATEGORIES: { id: CategoryFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'traditional', label: 'Traditional' },
  { id: 'modern', label: 'Modern' },
  { id: 'baby', label: 'Baby' },
  { id: 'seasonal', label: 'Seasonal' },
];

export function TemplatesPanel({ onDismiss }: TemplatesPanelProps) {
  const startPreview = useLeftPanelStore((s) => s.startPreview);
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');

  const handleTemplateClick = useCallback((template: QuiltTemplate) => {
    startPreview(JSON.stringify(template), template.name);
  }, [startPreview]);

  // Filter templates by selected category. Previously the category buttons
  // had no onClick and no filter logic, so clicking them did nothing and every
  // template was always shown regardless of which pill was "active".
  const visibleTemplates = useMemo(() => {
    if (selectedCategory === 'all') return QUILT_TEMPLATES;
    return QUILT_TEMPLATES.filter((t) => t.category === selectedCategory);
  }, [selectedCategory]);

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
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              aria-pressed={isActive}
              className={`px-3 py-1 text-[12px] font-medium rounded-full transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/30'
                  : 'text-[var(--color-text-dim)] bg-[var(--color-bg)] hover:bg-[var(--color-border)]/30'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {visibleTemplates.length === 0 ? (
          <p className="text-[12px] text-[var(--color-text-dim)] text-center py-8">
            No templates in this category yet.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {visibleTemplates.map((template) => (
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
        )}
      </div>
    </div>
  );
}