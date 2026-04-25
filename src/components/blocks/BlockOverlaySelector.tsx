'use client';

import { useState } from 'react';
import { BLOCK_OVERLAYS, LAYOUT_OVERLAYS, type BlockOverlay } from '@/lib/quilt-overlay-registry';
import { RecommendedDimensionsModal } from './RecommendedDimensionsModal';
import { useFocusTrap } from '@/hooks/useFocusTrap';

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
  const dialogRef = useFocusTrap<HTMLDivElement>(true, onClose);

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-text)]/60"
      role="presentation"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="overlay-selector-title"
        tabIndex={-1}
        className="flex w-[800px] max-h-[85vh] flex-col rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[0_1px_2px_rgba(54,49,45,0.08)] outline-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)] p-4">
          <h2
            id="overlay-selector-title"
            className="text-[24px] leading-[32px] text-[var(--color-text)]"
          >
            Overlay Templates
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-lg hover:bg-[var(--color-primary)]/10 transition-colors duration-150"
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
            <div className="flex bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg">
              <button
                type="button"
                onClick={() => setActiveType('block')}
                className={`flex-1 p-3 text-[14px] leading-[20px] transition-colors duration-150 rounded-l-lg ${
                  activeType === 'block'
                    ? 'bg-[var(--color-primary)] text-[var(--color-text)]'
                    : 'text-[var(--color-text-dim)] hover:bg-[var(--color-primary)]/10'
                }`}
              >
                Blocks ({BLOCK_OVERLAYS.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveType('layout')}
                className={`flex-1 p-3 text-[14px] leading-[20px] transition-colors duration-150 rounded-r-lg ${
                  activeType === 'layout'
                    ? 'bg-[var(--color-primary)] text-[var(--color-text)]'
                    : 'text-[var(--color-text-dim)] hover:bg-[var(--color-primary)]/10'
                }`}
              >
                Layouts ({LAYOUT_OVERLAYS.length})
              </button>
            </div>

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search blocks and layouts..."
              aria-label="Search blocks and layouts"
              className="w-full border border-[var(--color-border)] bg-[var(--color-surface)] rounded-lg p-4 text-[16px] leading-[24px] text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] focus:outline-2 focus:outline-[var(--color-primary)] transition-colors duration-150"
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
                  className={`border border-[var(--color-border)] px-4 py-2 text-[14px] leading-[20px] rounded-full transition-colors duration-150 ${
                    difficultyFilter === d
                      ? 'bg-[var(--color-primary)] text-[var(--color-text)] border-[var(--color-primary)]'
                      : 'bg-[var(--color-surface)] text-[var(--color-text-dim)] hover:border-[var(--color-primary)]/50'
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
                    className={`group flex flex-col items-start border rounded-lg p-4 text-left transition-colors duration-150 ${
                      currentOverlay === block.svgPath
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                        : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-primary)]/50'
                    }`}
                  >
                    <div className="mb-4 w-full aspect-square border border-[var(--color-border)] bg-[var(--color-surface)] rounded-lg">
                      <img
                        src={block.svgPath}
                        alt={block.displayName}
                        className="h-full w-full object-contain p-2"
                      />
                    </div>
                    <span className="text-[16px] leading-[24px] text-[var(--color-text)]">
                      {block.displayName}
                    </span>
                    <p className="mt-2 text-[14px] leading-[20px] text-[var(--color-text-dim)]">
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
                    className={`group flex flex-col items-start border rounded-lg p-4 text-left transition-colors duration-150 ${
                      currentOverlay === layout.svgPath
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                        : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-primary)]/50'
                    }`}
                  >
                    <div className="mb-4 w-full aspect-[3/4] border border-[var(--color-border)] bg-[var(--color-surface)] rounded-lg">
                      <img
                        src={layout.svgPath}
                        alt={layout.displayName}
                        className="h-full w-full object-contain p-2"
                      />
                    </div>
                    <span className="text-[16px] leading-[24px] text-[var(--color-text)]">
                      {layout.displayName}
                    </span>
                    <p className="mt-2 text-[14px] leading-[20px] text-[var(--color-text-dim)]">
                      {layout.dimensions.width}&quot; &times; {layout.dimensions.height}&quot;
                    </p>
                  </button>
                ))}
              </div>
            )}

            {((activeType === 'block' && filteredBlocks.length === 0) ||
              (activeType === 'layout' && filteredLayouts.length === 0)) && (
              <div className="py-12 text-center text-[16px] leading-[24px] text-[var(--color-text-dim)]">
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
