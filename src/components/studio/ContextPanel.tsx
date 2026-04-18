'use client';

import { useCallback, useState, useEffect } from 'react';
import { BlockLibrary } from '@/components/blocks/BlockLibrary';
import { FabricLibrary } from '@/components/fabrics/FabricLibrary';
import { ShadeBreakdownPanel } from '@/components/studio/ShadeBreakdownPanel';
import { useShadeAssignment } from '@/hooks/useShadeAssignment';
import { useCanvasStore } from '@/stores/canvasStore';
import { getRecentFabrics } from '@/lib/recent-fabrics';
import type { Shade } from '@/types/shade';

type PanelTab = 'blocks' | 'fabrics';

interface ContextPanelProps {
  readonly onBlockDragStart: (e: React.DragEvent, blockId: string) => void;
  readonly onFabricDragStart: (e: React.DragEvent, fabricId: string) => void;
  readonly onOpenDrafting?: () => void;
  readonly onOpenUpload?: () => void;
}

export function ContextPanel({
  onBlockDragStart,
  onFabricDragStart,
  onOpenDrafting,
  onOpenUpload,
}: ContextPanelProps) {
  const [activeTab, setActiveTab] = useState<PanelTab>('blocks');
  const [isApplying, setIsApplying] = useState(false);
  const { getBreakdown, bulkApply, hasShadeData, isBlockGroupSelected } = useShadeAssignment();

  const fabricPickerTarget = useCanvasStore((s) => s.fabricPickerTarget);

  useEffect(() => {
    if (fabricPickerTarget) {
      setActiveTab('fabrics');
    }
  }, [fabricPickerTarget]);

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
      {showShadePanel && breakdown && (
        <ShadeBreakdownPanel
          breakdown={breakdown}
          onBulkApply={handleBulkApply}
          isApplying={isApplying}
        />
      )}

      <div
        role="tablist"
        aria-label="Library"
        className="flex border-b border-[var(--color-border)]/40 flex-shrink-0"
      >
        <TabButton
          label="Blocks"
          active={activeTab === 'blocks'}
          onClick={() => setActiveTab('blocks')}
        />
        <TabButton
          label="Fabrics"
          active={activeTab === 'fabrics'}
          onClick={() => setActiveTab('fabrics')}
        />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
        {activeTab === 'blocks' ? (
          <BlockLibrary onBlockDragStart={onBlockDragStart} onOpenDrafting={onOpenDrafting} />
        ) : (
          <FabricLibrary onFabricDragStart={onFabricDragStart} onOpenUpload={onOpenUpload} />
        )}
      </div>
    </aside>
  );
}

function TabButton({
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
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex-1 py-2.5 text-[14px] leading-[20px] font-semibold transition-colors ${
        active
          ? 'border-b-2 border-[var(--color-primary)] text-[var(--color-primary)]'
          : 'text-[var(--color-text)]/60 hover:text-[var(--color-text)]'
      }`}
    >
      {label}
    </button>
  );
}
