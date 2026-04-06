'use client';

import { useState } from 'react';
import { BLOCK_OVERLAYS, LAYOUT_OVERLAYS, type BlockOverlay } from '@/lib/quilt-overlay-registry';
import { RecommendedDimensionsModal } from './RecommendedDimensionsModal';

type OverlayType = 'block' | 'layout';

interface BlockOverlaySelectorProps {
  onSelect: (svgPath: string, type: OverlayType, width?: number, height?: number) => void;
  onClose: () => void;
  currentOverlay?: string | null;
}

export function BlockOverlaySelector({
  onSelect,
  onClose,
  currentOverlay,
}: BlockOverlaySelectorProps) {
  const [activeType, setActiveType] = useState<OverlayType>('block');
  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<BlockOverlay['difficulty'] | 'all'>(
    'all'
  );
  const [showDimensions, setShowDimensions] = useState(false);
  const [pendingOverlay, setPendingOverlay] = useState<{ path: string; type: OverlayType } | null>(
    null
  );

  const filteredBlocks = BLOCK_OVERLAYS.filter((b) => {
    const matchesSearch =
      b.displayName.toLowerCase().includes(search.toLowerCase()) ||
      b.description.toLowerCase().includes(search.toLowerCase());
    const matchesDifficulty = difficultyFilter === 'all' || b.difficulty === difficultyFilter;
    return matchesSearch && matchesDifficulty;
  });

  const filteredPatterns = LAYOUT_OVERLAYS.filter(
    (p) =>
      p.displayName.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40">
      <div className="w-[700px] max-h-[80vh] rounded-xl bg-surface p-5 shadow-elevation-4 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-on-surface">Choose Overlay Template</h2>
          <button type="button" onClick={onClose} className="text-secondary hover:text-on-surface">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M5 5l10 10M15 5L5 15"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Type tabs */}
        <div className="mb-3 flex gap-1 rounded-lg bg-background p-1">
          <button
            type="button"
            onClick={() => setActiveType('block')}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              activeType === 'block'
                ? 'bg-primary text-white'
                : 'text-secondary hover:text-on-surface'
            }`}
          >
            Blocks ({BLOCK_OVERLAYS.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveType('layout')}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              activeType === 'layout'
                ? 'bg-primary text-white'
                : 'text-secondary hover:text-on-surface'
            }`}
          >
            Layouts ({LAYOUT_OVERLAYS.length})
          </button>
        </div>

        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search blocks or layouts..."
          className="mb-3 w-full rounded-sm border border-outline-variant bg-white px-2.5 py-1.5 text-sm focus:border-primary focus:outline-none"
        />

        {/* Difficulty filter (blocks only) */}
        {activeType === 'block' && (
          <div className="mb-3 flex gap-2">
            {(['all', 'beginner', 'intermediate', 'advanced'] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDifficultyFilter(d)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  difficultyFilter === d
                    ? 'bg-primary text-white'
                    : 'bg-background text-secondary hover:text-on-surface'
                }`}
              >
                {d === 'all' ? 'All' : d.charAt(0).toUpperCase() + d.slice(1)}
              </button>
            ))}
          </div>
        )}

        {/* Grid of overlays */}
        <div className="flex-1 overflow-y-auto">
          {activeType === 'block' ? (
            <div className="grid grid-cols-3 gap-3">
              {filteredBlocks.map((block) => (
                <button
                  key={block.id}
                  type="button"
                  onClick={() => onSelect(block.svgPath, 'block')}
                  className={`group rounded-lg border p-3 text-left transition-all hover:shadow-elevation-2 ${
                    currentOverlay === block.svgPath
                      ? 'border-primary bg-primary/5'
                      : 'border-outline-variant bg-white hover:border-primary/50'
                  }`}
                >
                  <div className="mb-2 aspect-square overflow-hidden rounded bg-background">
                    <img
                      src={block.svgPath}
                      alt={block.displayName}
                      className="h-full w-full object-contain p-1"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-on-surface">{block.displayName}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-secondary line-clamp-2">
                    {block.description}
                  </p>
                  <p className="mt-1 text-[10px] text-secondary">
                    Sizes: {block.commonSizes.join(', ')}
                  </p>
                </button>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredPatterns.map((pattern) => (
                <button
                  key={pattern.id}
                  type="button"
                  onClick={() => {
                    setPendingOverlay({ path: pattern.svgPath, type: 'layout' });
                    setShowDimensions(true);
                  }}
                  className={`group rounded-lg border p-3 text-left transition-all hover:shadow-elevation-2 ${
                    currentOverlay === pattern.svgPath
                      ? 'border-primary bg-primary/5'
                      : 'border-outline-variant bg-white hover:border-primary/50'
                  }`}
                >
                  <div className="mb-2 aspect-[3/4] overflow-hidden rounded bg-background">
                    <img
                      src={pattern.svgPath}
                      alt={pattern.displayName}
                      className="h-full w-full object-contain p-1"
                    />
                  </div>
                  <span className="text-sm font-medium text-on-surface">{pattern.displayName}</span>
                  <p className="mt-1 text-[11px] text-secondary line-clamp-2">
                    {pattern.description}
                  </p>
                  <p className="mt-1 text-[10px] text-secondary">
                    {pattern.dimensions.width}&quot; &times; {pattern.dimensions.height}&quot;
                  </p>
                </button>
              ))}
            </div>
          )}

          {((activeType === 'block' && filteredBlocks.length === 0) ||
            (activeType === 'layout' && filteredPatterns.length === 0)) && (
            <div className="py-12 text-center text-secondary">
              No overlays found matching your search.
            </div>
          )}
        </div>
      </div>

      {/* Recommended dimensions modal */}
      {showDimensions && pendingOverlay && (
        <RecommendedDimensionsModal
          onSelect={(width, height) => {
            onSelect(pendingOverlay.path, pendingOverlay.type, width, height);
            setShowDimensions(false);
            setPendingOverlay(null);
          }}
          onClose={() => {
            setShowDimensions(false);
            setPendingOverlay(null);
          }}
          selectedOverlay={pendingOverlay.path}
          selectedType={pendingOverlay.type}
        />
      )}
    </div>
  );
}
