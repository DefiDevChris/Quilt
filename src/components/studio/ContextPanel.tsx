'use client';

import { useState } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { LayoutSelector } from '@/components/studio/LayoutSelector';
import { BlockLibrary } from '@/components/blocks/BlockLibrary';
import { FabricLibrary } from '@/components/fabrics/FabricLibrary';
import { LayoutRolePanel } from '@/components/studio/LayoutRolePanel';

type SectionKey = 'layout' | 'block' | 'fabric' | 'role';

function CollapsibleSection({
  title,
  isOpen,
  onToggle,
  children,
}: {
  readonly title: string;
  readonly isOpen: boolean;
  readonly onToggle: () => void;
  readonly children: React.ReactNode;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between py-2.5 px-3 bg-surface-container-high border-b border-outline-variant/50 text-[11px] font-semibold uppercase tracking-[0.06em] text-on-surface hover:bg-surface-container-highest transition-colors"
      >
        {title}
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        >
          <path d="M3 4.5L6 7.5L9 4.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {isOpen && <div className="pb-0 bg-surface">{children}</div>}
    </div>
  );
}

interface ContextPanelProps {
  onBlockDragStart: (e: React.DragEvent, blockId: string) => void;
  onFabricDragStart: (e: React.DragEvent, fabricId: string) => void;
  onOpenDrafting?: () => void;
  onOpenPhotoUpload?: () => void;
  onOpenUpload?: () => void;
}

export function ContextPanel({
  onBlockDragStart,
  onFabricDragStart,
  onOpenDrafting,
  onOpenPhotoUpload,
  onOpenUpload,
}: ContextPanelProps) {
  const activeWorktable = useCanvasStore((s) => s.activeWorktable);
  const [openSection, setOpenSection] = useState<SectionKey>('layout');

  const toggle = (key: SectionKey) =>
    setOpenSection((prev) => (prev === key ? ('' as SectionKey) : key));

  if (activeWorktable === 'print' || activeWorktable === 'image') {
    return null;
  }

  // Layout worktable: show role assignment panel + fabric library
  if (activeWorktable === 'layout') {
    return (
      <div className="w-[300px] h-full bg-surface flex-shrink-0 overflow-y-auto overflow-x-hidden border-l border-outline-variant/15 flex flex-col">
        <CollapsibleSection
          title="Piece Role"
          isOpen={openSection === 'role' || openSection === 'layout'}
          onToggle={() => toggle('role')}
        >
          <LayoutRolePanel />
        </CollapsibleSection>
        <CollapsibleSection
          title="Fabric Library"
          isOpen={openSection === 'fabric'}
          onToggle={() => toggle('fabric')}
        >
          <FabricLibrary onFabricDragStart={onFabricDragStart} onOpenUpload={onOpenUpload} />
        </CollapsibleSection>
      </div>
    );
  }

  return (
    <div className="w-[300px] h-full bg-surface flex-shrink-0 overflow-y-auto overflow-x-hidden border-l border-outline-variant/15 flex flex-col">
      {activeWorktable !== 'block' && (
        <CollapsibleSection
          title="Layout Library"
          isOpen={openSection === 'layout'}
          onToggle={() => toggle('layout')}
        >
          <div className="p-3">
            <LayoutSelector />
          </div>
        </CollapsibleSection>
      )}
      <CollapsibleSection
        title="Block Library"
        isOpen={openSection === 'block'}
        onToggle={() => toggle('block')}
      >
        <BlockLibrary
          onBlockDragStart={onBlockDragStart}
          onOpenDrafting={onOpenDrafting}
          onOpenPhotoUpload={onOpenPhotoUpload}
        />
      </CollapsibleSection>
      <CollapsibleSection
        title="Fabric Library"
        isOpen={openSection === 'fabric'}
        onToggle={() => toggle('fabric')}
      >
        <FabricLibrary onFabricDragStart={onFabricDragStart} onOpenUpload={onOpenUpload} />
      </CollapsibleSection>
    </div>
  );
}
