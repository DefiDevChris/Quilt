'use client';

import { useState, useCallback } from 'react';
import { BlockLibrary } from '@/components/blocks/BlockLibrary';
import { FabricLibrary } from '@/components/fabrics/FabricLibrary';
import { LayoutSelector } from '@/components/studio/LayoutSelector';
import { ShadeBreakdownPanel } from '@/components/studio/ShadeBreakdownPanel';
import { useShadeAssignment } from '@/hooks/useShadeAssignment';
import { getRecentFabrics } from '@/lib/recent-fabrics';
import type { Shade } from '@/types/shade';

type LibraryTab = 'layouts' | 'blocks' | 'fabrics';

interface ContextPanelProps {
  readonly onBlockDragStart: (e: React.DragEvent, blockId: string) => void;
  readonly onFabricDragStart: (e: React.DragEvent, fabricId: string) => void;
  readonly onOpenDrafting?: () => void;
  readonly onOpenPhotoUpload?: () => void;
  readonly onOpenUpload?: () => void;
}

/**
 * Studio right pane.
 *
 * Library tabs (user-driven, never auto-switches based on canvas
 * selection). Three tabs: Layouts, Blocks, Fabrics. Drag from here onto the
 * canvas to apply.
 */
export function ContextPanel({
  onBlockDragStart,
  onFabricDragStart,
  onOpenDrafting,
  onOpenPhotoUpload,
  onOpenUpload,
}: ContextPanelProps) {
  const [activeTab, setActiveTab] = useState<LibraryTab>('layouts');
  const [isApplying, setIsApplying] = useState(false);
  const { getBreakdown, bulkApply, hasShadeData, isBlockGroupSelected } = useShadeAssignment();

  const showShadePanel = isBlockGroupSelected && hasShadeData;
  const breakdown = showShadePanel ? getBreakdown('selected') : null;

  const handleBulkApply = useCallback(
    async (shade: Shade) => {
      const recents = getRecentFabrics();
      if (recents.length === 0) {
        setActiveTab('fabrics');
        return;
      }
      const recent = recents[0];
      setIsApplying(true);
      try {
        await bulkApply(shade, recent.imageUrl, { id: recent.id, name: recent.name });
      } finally {
        setIsApplying(false);
      }
    },
    [bulkApply]
  );

  return (
    <aside className="w-[320px] h-full flex-shrink-0 flex flex-col bg-[var(--color-bg)] border-l border-[var(--color-border)]/15 overflow-hidden">
      {/* ── Shade breakdown (contextual, above tabs) ───── */}
      {showShadePanel && breakdown && (
        <ShadeBreakdownPanel
          breakdown={breakdown}
          onBulkApply={handleBulkApply}
          isApplying={isApplying}
        />
      )}

      {/* ── Library tabs ─────────────────────────────────── */}
      <div
        role="tablist"
        aria-label="Library"
        className="flex border-b border-[var(--color-border)]/40 flex-shrink-0"
      >
        <LibraryTabButton
          id="tab-layouts"
          panelId="tabpanel-layouts"
          label="Layouts"
          active={activeTab === 'layouts'}
          onClick={() => setActiveTab('layouts')}
        />
        <LibraryTabButton
          id="tab-blocks"
          panelId="tabpanel-blocks"
          label="Blocks"
          active={activeTab === 'blocks'}
          onClick={() => setActiveTab('blocks')}
        />
        <LibraryTabButton
          id="tab-fabrics"
          panelId="tabpanel-fabrics"
          label="Fabrics"
          active={activeTab === 'fabrics'}
          onClick={() => setActiveTab('fabrics')}
        />
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        {activeTab === 'layouts' && (
          <div id="tabpanel-layouts" role="tabpanel" aria-labelledby="tab-layouts" tabIndex={0}>
            <LayoutSelector
              onLayoutSelect={() => {
                /* handled by LayoutSelector */
              }}
            />
          </div>
        )}
        {activeTab === 'blocks' && (
          <div id="tabpanel-blocks" role="tabpanel" aria-labelledby="tab-blocks" tabIndex={0}>
            <BlockLibrary
              onBlockDragStart={onBlockDragStart}
              onOpenDrafting={onOpenDrafting}
              onOpenPhotoUpload={onOpenPhotoUpload}
            />
          </div>
        )}
        {activeTab === 'fabrics' && (
          <div id="tabpanel-fabrics" role="tabpanel" aria-labelledby="tab-fabrics" tabIndex={0}>
            <FabricLibrary onFabricDragStart={onFabricDragStart} onOpenUpload={onOpenUpload} />
          </div>
        )}
      </div>
    </aside>
  );
}

function LibraryTabButton({
  id,
  panelId,
  label,
  active,
  onClick,
}: {
  readonly id: string;
  readonly panelId: string;
  readonly label: string;
  readonly active: boolean;
  readonly onClick: () => void;
}) {
  return (
    <button
      type="button"
      id={id}
      role="tab"
      aria-selected={active}
      aria-controls={panelId}
      tabIndex={active ? 0 : -1}
      onClick={onClick}
      className={`flex-1 px-3 py-2 text-[14px] leading-[20px] font-medium transition-colors ${
        active
          ? 'border-b-2 border-primary text-primary'
          : 'text-[var(--color-text)]/60 hover:text-[var(--color-text)]'
      }`}
    >
      {label}
    </button>
  );
}
