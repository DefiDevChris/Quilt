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

  const filteredLayouts = LAYOUT_OVERLAYS.filter(
    (l) =>
      l.displayName.toLowerCase().includes(search.toLowerCase()) ||
      l.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/80">
      <div className="flex w-[800px] max-h-[85vh] flex-col border-2 border-on-surface bg-surface shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-on-surface bg-on-surface p-4 text-surface">
          <h2 className="text-[14px] font-black uppercase tracking-[0.2em]">Overlay Templates</h2>
          <button
            type="button"
            onClick={onClose}
            className="transition-transform hover:scale-110"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M5 5l10 10M15 5L5 15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="p-6 flex flex-col gap-6 overflow-hidden">
          {/* Type tabs and search */}
          <div className="flex flex-col gap-4">
            <div className="flex bg-surface border-2 border-on-surface">
              <button
                type="button"
                onClick={() => setActiveType('block')}
                className={`flex-1 p-3 text-[11px] font-black uppercase tracking-[0.2em] transition-colors ${activeType === 'block'
                  ? 'bg-on-surface text-surface'
                  : 'text-on-surface hover:bg-on-surface/10'
                  }`}
              >
                Blocks ({BLOCK_OVERLAYS.length})
              </button>
              <div className="w-0.5 bg-on-surface" />
              <button
                type="button"
                onClick={() => setActiveType('layout')}
                className={`flex-1 p-3 text-[11px] font-black uppercase tracking-[0.2em] transition-colors ${activeType === 'layout'
                  ? 'bg-on-surface text-surface'
                  : 'text-on-surface hover:bg-on-surface/10'
                  }`}
              >
                Layouts ({LAYOUT_OVERLAYS.length})
              </button>
            </div>

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="SEARCH ASSETS..."
              className="w-full border-2 border-on-surface bg-surface p-4 text-[13px] font-black uppercase tracking-[0.1em] text-on-surface placeholder:text-on-surface/30 focus:outline-none"
            />
          </div>

          {/* Difficulty filter (blocks only) */}
          {activeType === 'block' && (
            <div className="flex flex-wrap gap-2">
              {(['all', 'beginner', 'intermediate', 'advanced'] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDifficultyFilter(d)}
                  className={`border-2 border-on-surface px-4 py-2 text-[10px] font-black uppercase tracking-[0.15em] transition-colors ${difficultyFilter === d
                    ? 'bg-on-surface text-surface'
                    : 'bg-surface text-on-surface hover:bg-on-surface/10'
                    }`}
                >
                  {d}
                </button>
              ))}
            </div>
          )}

          {/* Grid of overlays */}
          <div className="flex-1 overflow-y-auto min-h-0 pr-2 pb-2">
            {activeType === 'block' ? (
              <div className="grid grid-cols-3 gap-4">
                {filteredBlocks.map((block) => (
                  <button
                    key={block.id}
                    type="button"
                    onClick={() => onSelect(block.svgPath, 'block')}
                    className={`group flex flex-col items-start border-2 border-on-surface bg-surface p-4 text-left transition-all hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${currentOverlay === block.svgPath
                      ? 'bg-on-surface text-surface'
                      : ''
                      }`}
                  >
                    <div className="mb-4 w-full aspect-square border-2 border-on-surface bg-white">
                      <img
                        src={block.svgPath}
                        alt={block.displayName}
                        className="h-full w-full object-contain p-2"
                      />
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-[0.1em]">
                      {block.displayName}
                    </span>
                    <p className={`mt-2 text-[10px] font-bold uppercase tracking-wider ${currentOverlay === block.svgPath ? 'text-surface/70' : 'text-on-surface/70'}`}>
                      {block.commonSizes.join(', ')}
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {filteredLayouts.map((layout) => (
                  <button
                    key={layout.id}
                    type="button"
                    onClick={() => {
                      setPendingOverlay({ path: layout.svgPath, type: 'layout' });
                      setShowDimensions(true);
                    }}
                    className={`group flex flex-col items-start border-2 border-on-surface bg-surface p-4 text-left transition-all hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${currentOverlay === layout.svgPath
                      ? 'bg-on-surface text-surface'
                      : ''
                      }`}
                  >
                    <div className="mb-4 w-full aspect-[3/4] border-2 border-on-surface bg-white">
                      <img
                        src={layout.svgPath}
                        alt={layout.displayName}
                        className="h-full w-full object-contain p-2"
                      />
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-[0.1em]">
                      {layout.displayName}
                    </span>
                    <p className={`mt-2 text-[10px] font-bold uppercase tracking-wider ${currentOverlay === layout.svgPath ? 'text-surface/70' : 'text-on-surface/70'}`}>
                      {layout.dimensions.width}&quot; &times; {layout.dimensions.height}&quot;
                    </p>
                  </button>
                ))}
              </div>
            )}

            {((activeType === 'block' && filteredBlocks.length === 0) ||
              (activeType === 'layout' && filteredLayouts.length === 0)) && (
                <div className="py-12 text-center text-[11px] font-black uppercase tracking-[0.2em] text-on-surface/50">
                  No matches found
                </div>
              )}
          </div>
        </div>
      </div>

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
