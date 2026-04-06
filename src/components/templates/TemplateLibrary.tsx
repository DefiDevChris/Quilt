'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { LAYOUT_PRESETS, type LayoutPreset } from '@/lib/layout-library';

interface DbTemplate {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  skillLevel: string | null;
  finishedWidth: number | null;
  finishedHeight: number | null;
  blockCount: number | null;
  fabricCount: number | null;
  thumbnailUrl: string | null;
  templateData: unknown;
  tags: string[] | null;
  importCount: number | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  grid: 'Straight Set',
  sashing: 'Sashing',
  'on-point': 'On-Point',
};

function PresetThumbnail({ preset }: { readonly preset: LayoutPreset }) {
  const { rows, cols } = preset.config;
  const isSashing = preset.category === 'sashing';
  const isOnPoint = preset.category === 'on-point';
  const gridCols = Math.min(cols, 6);
  const gridRows = Math.min(rows, 6);

  return (
    <div className="w-full aspect-square bg-surface-container rounded-xl flex items-center justify-center">
      <div
        className={`grid ${isSashing ? 'gap-1' : 'gap-0.5'}`}
        style={{
          gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
          gridTemplateRows: `repeat(${gridRows}, 1fr)`,
          transform: isOnPoint ? 'rotate(45deg) scale(0.7)' : undefined,
          width: '60%',
          height: '60%',
        }}
      >
        {Array.from({ length: gridRows * gridCols }).map((_, i) => (
          <div
            key={i}
            className="rounded-sm"
            style={{
              backgroundColor: 'var(--color-primary)',
              opacity: 0.5,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function TemplateDetailModal({
  preset,
  onClose,
  onUse,
  isCreating,
}: {
  readonly preset: LayoutPreset;
  readonly onClose: () => void;
  readonly onUse: () => void;
  readonly isCreating: boolean;
}) {
  const config = preset.config;
  const totalWidth =
    config.cols * config.blockSize +
    config.sashing.width * (config.cols - 1) +
    config.borders.reduce((sum, b) => sum + b.width * 2, 0);
  const totalHeight =
    config.rows * config.blockSize +
    config.sashing.width * (config.rows - 1) +
    config.borders.reduce((sum, b) => sum + b.width * 2, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40">
      <div className="w-full max-w-sm rounded-xl bg-surface shadow-elevation-3 p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold text-on-surface">{preset.name}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-secondary hover:text-on-surface transition-colors"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="mb-4">
          <PresetThumbnail preset={preset} />
        </div>

        <p className="text-sm text-secondary mb-4">{preset.description}</p>

        <div className="grid grid-cols-2 gap-3 text-xs text-secondary mb-6">
          <div className="bg-surface-container rounded-lg p-2.5">
            <span className="block text-on-surface font-medium">
              {config.rows} x {config.cols}
            </span>
            <span>Grid Size</span>
          </div>
          <div className="bg-surface-container rounded-lg p-2.5">
            <span className="block text-on-surface font-medium">{config.blockSize}&quot;</span>
            <span>Block Size</span>
          </div>
          <div className="bg-surface-container rounded-lg p-2.5">
            <span className="block text-on-surface font-medium">
              {totalWidth}&quot; x {totalHeight}&quot;
            </span>
            <span>Finished Size</span>
          </div>
          <div className="bg-surface-container rounded-lg p-2.5">
            <span className="block text-on-surface font-medium capitalize">
              {CATEGORY_LABELS[preset.category] ?? preset.category}
            </span>
            <span>Layout Type</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-md px-4 py-2.5 text-sm font-medium text-secondary hover:bg-surface-container transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onUse}
            disabled={isCreating}
            className="flex-1 rounded-md bg-gradient-to-r from-orange-500 to-rose-400 px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isCreating ? 'Creating...' : 'Use This Template'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function TemplateLibrary() {
  const router = useRouter();
  const [dbTemplates, setDbTemplates] = useState<DbTemplate[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<LayoutPreset | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [filter, setFilter] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/layout-templates')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.data) setDbTemplates(data.data);
      })
      .catch(() => {
        /* DB templates optional */
      });
  }, []);

  const handleUseTemplate = useCallback(async () => {
    if (!selectedPreset || isCreating) return;
    setIsCreating(true);

    const config = selectedPreset.config;
    const totalWidth =
      config.cols * config.blockSize +
      config.sashing.width * (config.cols - 1) +
      config.borders.reduce((sum, b) => sum + b.width * 2, 0);
    const totalHeight =
      config.rows * config.blockSize +
      config.sashing.width * (config.rows - 1) +
      config.borders.reduce((sum, b) => sum + b.width * 2, 0);

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: selectedPreset.name,
          unitSystem: 'imperial',
          canvasWidth: totalWidth,
          canvasHeight: totalHeight,
          gridSettings: { enabled: true, size: 1, snapToGrid: true },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/studio/${data.data.id}`);
      }
    } catch {
      /* handled by studio */
    } finally {
      setIsCreating(false);
    }
  }, [selectedPreset, isCreating, router]);

  const categories = ['grid', 'sashing', 'on-point'] as const;
  const filteredPresets = filter
    ? LAYOUT_PRESETS.filter((p) => p.category === filter)
    : LAYOUT_PRESETS;

  return (
    <div>
      {/* Filter chips */}
      <div className="flex gap-2 mb-5">
        <button
          type="button"
          onClick={() => setFilter(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            filter === null
              ? 'bg-gradient-to-r from-orange-500 to-rose-400 text-white shadow-elevation-1'
              : 'bg-white/50 text-secondary hover:bg-white/70'
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === cat
                ? 'bg-gradient-to-r from-orange-500 to-rose-400 text-white shadow-elevation-1'
                : 'bg-white/50 text-secondary hover:bg-white/70'
            }`}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Template grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredPresets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => setSelectedPreset(preset)}
            className="glass-panel rounded-2xl p-3 text-left transition-all hover:shadow-elevation-2 hover:scale-[1.02] group"
          >
            <PresetThumbnail preset={preset} />
            <div className="mt-2.5 px-0.5">
              <p className="text-sm font-medium text-on-surface group-hover:text-primary transition-colors">
                {preset.name}
              </p>
              <p className="text-xs text-secondary mt-0.5 line-clamp-2">{preset.description}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] text-secondary bg-surface-container px-1.5 py-0.5 rounded-full">
                  {CATEGORY_LABELS[preset.category]}
                </span>
                <span className="text-[10px] text-secondary">
                  {preset.config.rows}x{preset.config.cols}
                </span>
              </div>
            </div>
          </button>
        ))}

        {/* DB templates (if any) */}
        {dbTemplates.map((t) => (
          <div key={t.id} className="glass-panel rounded-2xl p-3 text-left">
            <div className="w-full aspect-square bg-surface-container rounded-xl flex items-center justify-center">
              {t.thumbnailUrl ? (
                <img
                  src={t.thumbnailUrl}
                  alt={t.name}
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <span className="text-xs text-secondary">No preview</span>
              )}
            </div>
            <div className="mt-2.5 px-0.5">
              <p className="text-sm font-medium text-on-surface">{t.name}</p>
              {t.description && (
                <p className="text-xs text-secondary mt-0.5 line-clamp-2">{t.description}</p>
              )}
              {t.skillLevel && (
                <span className="inline-block text-[10px] text-secondary bg-surface-container px-1.5 py-0.5 rounded-full mt-2">
                  {t.skillLevel}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredPresets.length === 0 && dbTemplates.length === 0 && (
        <div className="text-center py-12 text-secondary">
          <p className="text-sm">No templates found for this category.</p>
        </div>
      )}

      {/* Detail modal */}
      {selectedPreset && (
        <TemplateDetailModal
          preset={selectedPreset}
          onClose={() => setSelectedPreset(null)}
          onUse={handleUseTemplate}
          isCreating={isCreating}
        />
      )}
    </div>
  );
}
