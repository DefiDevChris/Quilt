'use client';

import { useState } from 'react';
import { BlockLibrary } from '@/components/blocks/BlockLibrary';
import { FabricLibrary } from '@/components/fabrics/FabricLibrary';
import { LayoutSelector } from '@/components/studio/LayoutSelector';

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

  return (
    <aside className="w-[320px] h-full flex-shrink-0 flex flex-col bg-surface border-l border-outline-variant/15 overflow-hidden">
      {/* ── Library tabs ─────────────────────────────────── */}
      <div className="flex border-b border-outline-variant/40 flex-shrink-0">
        <LibraryTabButton
          label="Layouts"
          active={activeTab === 'layouts'}
          onClick={() => setActiveTab('layouts')}
        />
        <LibraryTabButton
          label="Blocks"
          active={activeTab === 'blocks'}
          onClick={() => setActiveTab('blocks')}
        />
        <LibraryTabButton
          label="Fabrics"
          active={activeTab === 'fabrics'}
          onClick={() => setActiveTab('fabrics')}
        />
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        {activeTab === 'layouts' && <LayoutSelector onLayoutSelect={() => {/* handled by LayoutSelector */ }} />}
        {activeTab === 'blocks' && (
          <BlockLibrary
            onBlockDragStart={onBlockDragStart}
            onOpenDrafting={onOpenDrafting}
            onOpenPhotoUpload={onOpenPhotoUpload}
          />
        )}
        {activeTab === 'fabrics' && (
          <FabricLibrary onFabricDragStart={onFabricDragStart} onOpenUpload={onOpenUpload} />
        )}
      </div>
    </aside>
  );
}

function LibraryTabButton({
  label,
  active,
  onClick,
}: {
  readonly label: string;
  readonly active: boolean;
  readonly onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${active
        ? 'border-b-2 border-primary text-primary'
        : 'text-on-surface/60 hover:text-on-surface'
        }`}
    >
      {label}
    </button>
  );
}
