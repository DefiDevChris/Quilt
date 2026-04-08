'use client';

import { useMemo, useState } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { BlockLibrary } from '@/components/blocks/BlockLibrary';
import { FabricLibrary } from '@/components/fabrics/FabricLibrary';
import { resolveSelection, type SelectionKind } from '@/lib/canvas-selection';
import { DefaultInspector } from '@/components/studio/inspectors/DefaultInspector';
import { BlockCellInspector } from '@/components/studio/inspectors/BlockCellInspector';
import { BlockInspector } from '@/components/studio/inspectors/BlockInspector';
import { SashingInspector } from '@/components/studio/inspectors/SashingInspector';
import { CornerstoneInspector } from '@/components/studio/inspectors/CornerstoneInspector';
import { BorderInspector } from '@/components/studio/inspectors/BorderInspector';
import { BindingInspector } from '@/components/studio/inspectors/BindingInspector';
import { SettingTriangleInspector } from '@/components/studio/inspectors/SettingTriangleInspector';
import { PieceInspector } from '@/components/studio/inspectors/PieceInspector';
import { FreeShapeInspector } from '@/components/studio/inspectors/FreeShapeInspector';

type LibraryTab = 'blocks' | 'fabrics';

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
 * TOP HALF — Library tabs (user-driven, never auto-switches based on canvas
 * selection). Three tabs: Layouts, Blocks, Fabrics. Drag from here onto the
 * canvas to apply.
 *
 * BOTTOM HALF — Selection-driven inspector. Branches on `resolveSelection()`
 * to render the right panel for whatever the user has selected on the canvas.
 * When nothing is selected, shows the DefaultInspector (quilt dimensions,
 * background color, layout shortcuts).
 */
export function ContextPanel({
  onBlockDragStart,
  onFabricDragStart,
  onOpenDrafting,
  onOpenPhotoUpload,
  onOpenUpload,
}: ContextPanelProps) {
  const activeWorktable = useCanvasStore((s) => s.activeWorktable);
  const fabricCanvas = useCanvasStore((s) => s.fabricCanvas);
  const selectedObjectIds = useCanvasStore((s) => s.selectedObjectIds);

  const [activeTab, setActiveTab] = useState<LibraryTab>('blocks');

  const selection = useMemo(
    () => resolveSelection(fabricCanvas, selectedObjectIds),
    [fabricCanvas, selectedObjectIds]
  );

  if (activeWorktable === 'print' || activeWorktable === 'image') {
    return null;
  }

  return (
    <aside className="w-[320px] h-full flex-shrink-0 flex flex-col bg-surface border-l border-outline-variant/15 overflow-hidden">
      {/* ── TOP: Library tabs ─────────────────────────────────── */}
      <section className="flex flex-col" style={{ flex: '0 0 50%', minHeight: 0 }}>
        <div className="flex border-b border-outline-variant/40 flex-shrink-0">
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
      </section>

      {/* ── BOTTOM: Selection-driven inspector ────────────────── */}
      <section
        className="flex flex-col border-t-2 border-outline-variant/30"
        style={{ flex: '1 1 50%', minHeight: 0 }}
      >
        <div className="flex items-center justify-between px-3 py-2 bg-surface-container-high border-b border-outline-variant/40 flex-shrink-0">
          <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-on-surface">
            {inspectorTitle(selection.kind)}
          </span>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto">
          {renderInspector(selection.kind, selection)}
        </div>
      </section>
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

function inspectorTitle(kind: SelectionKind): string {
  switch (kind) {
    case 'none':
      return 'Quilt';
    case 'block-cell':
      return 'Block Cell';
    case 'block':
      return 'Block';
    case 'piece':
      return 'Piece';
    case 'sashing':
      return 'Sashing';
    case 'cornerstone':
      return 'Cornerstone';
    case 'border':
      return 'Border';
    case 'binding':
      return 'Binding';
    case 'setting-triangle':
      return 'Setting Triangle';
    case 'edging':
      return 'Edging';
    case 'free-shape':
      return 'Shape';
    case 'mixed':
      return 'Multiple';
    default:
      return 'Inspector';
  }
}

function renderInspector(
  kind: SelectionKind,
  selection: ReturnType<typeof resolveSelection>
): React.ReactNode {
  switch (kind) {
    case 'none':
      return <DefaultInspector />;
    case 'block-cell':
      return <BlockCellInspector selection={selection} />;
    case 'block':
      return <BlockInspector selection={selection} />;
    case 'piece':
      return <PieceInspector />;
    case 'sashing':
      return <SashingInspector selection={selection} />;
    case 'cornerstone':
      return <CornerstoneInspector selection={selection} />;
    case 'border':
      return <BorderInspector selection={selection} />;
    case 'binding':
      return <BindingInspector selection={selection} />;
    case 'setting-triangle':
      return <SettingTriangleInspector selection={selection} />;
    case 'edging':
      return <SettingTriangleInspector selection={selection} />;
    case 'free-shape':
      return <FreeShapeInspector selection={selection} />;
    case 'mixed':
      return (
        <div className="p-4 text-sm text-secondary">
          Multiple items selected. Click a single item to edit it.
        </div>
      );
    default:
      return (
        <div className="p-4 text-sm text-secondary">
          Selection type not recognized.
        </div>
      );
  }
}
