'use client';

import { useCallback, useState } from 'react';
import { ArrowLeft, Search } from 'lucide-react';
import { QUILT_TEMPLATES, type QuiltTemplate, type TemplateCategory } from '@/lib/templates';
import { useLayoutStore } from '@/stores/layoutStore';
import { useProjectStore } from '@/stores/projectStore';

interface TemplateGalleryModalProps {
  onCommit: (projectId: string) => void;
  onBack: () => void;
}

type CategoryFilter = TemplateCategory | 'all';

const CATEGORIES: { id: CategoryFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'traditional', label: 'Traditional' },
  { id: 'modern', label: 'Modern' },
  { id: 'baby', label: 'Baby' },
  { id: 'seasonal', label: 'Seasonal' },
];

export function TemplateGalleryModal({ onCommit, onBack }: TemplateGalleryModalProps) {
  const [filter, setFilter] = useState<CategoryFilter>('all');
  const [search, setSearch] = useState('');
  const [committing, setCommitting] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const setLayoutType = useLayoutStore((s) => s.setLayoutType);
  const setSelectedPreset = useLayoutStore((s) => s.setSelectedPreset);
  const setRows = useLayoutStore((s) => s.setRows);
  const setCols = useLayoutStore((s) => s.setCols);
  const setBlockSize = useLayoutStore((s) => s.setBlockSize);
  const setSashing = useLayoutStore((s) => s.setSashing);
  const setBorders = useLayoutStore((s) => s.setBorders);
  const applyLayoutAndLock = useLayoutStore((s) => s.applyLayoutAndLock);

  const projectName = useProjectStore((s) => s.projectName);
  const mode = useProjectStore((s) => s.mode);

  const filtered = QUILT_TEMPLATES.filter((t) => {
    if (filter !== 'all' && t.category !== filter) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const selected = selectedId ? QUILT_TEMPLATES.find((t) => t.id === selectedId) : null;

  const handleCommit = useCallback(async () => {
    if (!selected) return;
    setCommitting(true);
    try {
      const { layoutConfig } = selected;
      setLayoutType(layoutConfig.type);
      setRows(layoutConfig.rows);
      setCols(layoutConfig.cols);
      setBlockSize(layoutConfig.blockSize);
      if (layoutConfig.sashing) setSashing(layoutConfig.sashing);
      if (layoutConfig.borders) setBorders(layoutConfig.borders);
      applyLayoutAndLock();

      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: projectName,
          mode: 'template',
          unitSystem: 'imperial',
          canvasWidth: selected.canvasWidth,
          canvasHeight: selected.canvasHeight,
          gridSettings: { enabled: true, size: 1, snapToGrid: true },
          canvasData: {
            initialSetup: {
              kind: 'layout',
              presetId: selected.id,
              blockSize: layoutConfig.blockSize,
              rotated: false,
            },
            templateId: selected.id,
          },
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Failed to create project');
      }

      const { data } = await res.json();
      onCommit(data.id);
    } catch (err) {
      console.error('[TemplateGalleryModal] commit failed:', err);
      setCommitting(false);
    }
  }, [
    selected,
    setLayoutType,
    setRows,
    setCols,
    setBlockSize,
    setSashing,
    setBorders,
    applyLayoutAndLock,
    projectName,
    onCommit,
  ]);

  return (
    <div className="fixed inset-0 z-50 bg-[var(--color-bg)] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-[var(--color-border)] px-6 py-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-[var(--color-text-dim)] hover:text-[var(--color-text)] transition-colors duration-150"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <h1 className="font-heading text-lg font-bold text-[var(--color-text)]">Choose a Template</h1>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 border-b border-[var(--color-border)] px-6 py-3">
        <div className="flex gap-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilter(cat.id)}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors duration-150 ${
                filter === cat.id
                  ? 'bg-[var(--color-primary)] text-[var(--color-text-on-primary)]'
                  : 'text-[var(--color-text-dim)] hover:bg-[var(--color-border)]/30'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
        <div className="ml-auto relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--color-text-dim)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates…"
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] pl-8 pr-3 py-1.5 text-xs text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] focus:border-[var(--color-primary)] focus:outline-none transition-colors duration-150 w-48"
          />
        </div>
      </div>

      {/* Template grid + detail */}
      <div className="flex flex-1 overflow-hidden">
        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((template) => (
              <button
                key={template.id}
                onClick={() => setSelectedId(template.id)}
                className={`rounded-lg border p-3 text-left transition-colors duration-150 ${
                  selectedId === template.id
                    ? 'border-[var(--color-primary)] bg-[var(--color-secondary)]'
                    : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-strong)]'
                }`}
              >
                <div className="aspect-square rounded bg-[var(--color-border)]/20 mb-2 flex items-center justify-center text-[var(--color-text-dim)] text-xs">
                  {template.thumbnail}
                </div>
                <div className="text-sm font-semibold text-[var(--color-text)]">{template.name}</div>
                <div className="text-xs text-[var(--color-text-dim)] mt-0.5 line-clamp-2">{template.description}</div>
                <div className="text-[10px] text-[var(--color-text-dim)] mt-1">
                  {template.layoutConfig.rows}&times;{template.layoutConfig.cols} &middot; {template.layoutConfig.type}
                </div>
              </button>
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="flex items-center justify-center h-48 text-sm text-[var(--color-text-dim)]">
              No templates match your search.
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-[320px] shrink-0 border-l border-[var(--color-border)] bg-[var(--color-bg)] p-6 flex flex-col overflow-y-auto">
            <h2 className="font-heading text-lg font-bold text-[var(--color-text)]">{selected.name}</h2>
            <p className="text-sm text-[var(--color-text-dim)] mt-1">{selected.description}</p>

            <dl className="mt-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <dt className="text-[var(--color-text-dim)]">Layout</dt>
                <dd className="text-[var(--color-text)] capitalize">{selected.layoutConfig.type}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--color-text-dim)]">Grid</dt>
                <dd className="text-[var(--color-text)]">{selected.layoutConfig.rows}&times;{selected.layoutConfig.cols}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--color-text-dim)]">Block size</dt>
                <dd className="text-[var(--color-text)]">{selected.layoutConfig.blockSize}&Prime;</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--color-text-dim)]">Size</dt>
                <dd className="text-[var(--color-text)]">{selected.canvasWidth}&times;{selected.canvasHeight}&Prime;</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--color-text-dim)]">Category</dt>
                <dd className="text-[var(--color-text)] capitalize">{selected.category}</dd>
              </div>
            </dl>

            <button
              onClick={handleCommit}
              disabled={committing}
              className="btn-primary mt-auto w-full transition-colors duration-150 disabled:opacity-50"
            >
              {committing ? 'Creating…' : 'Start with This Template'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
