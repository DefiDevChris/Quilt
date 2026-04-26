'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import { LayoutGrid, Layers } from 'lucide-react';

import { StudioTopBar } from '@/components/studio/StudioTopBar';
import { Toolbar } from '@/components/studio/Toolbar';
import { ContextPanel } from '@/components/studio/ContextPanel';
import { BottomBar } from '@/components/studio/BottomBar';
import { StudioDropZone } from '@/components/studio/StudioDropZone';
import { BlockBuilderWorktable } from '@/components/studio/BlockBuilderWorktable';
import { useCanvasStore } from '@/stores/canvasStore';
import { useProjectStore } from '@/stores/projectStore';
import { saveProject } from '@/lib/save-project';
import { useCanvasContext } from '@/contexts/CanvasContext';
import { useTemplateHydration } from '@/hooks/useTemplateHydration';
import type { Project } from '@/types/project';

interface StudioLayoutProps {
  /** The fully-loaded project from the API. Required for canvas hydration. */
  project: Project;
}

/**
 * StudioLayout — the Phase 2 (designing) studio chrome.
 *
 * Per the design studio spec, this layout is identical for all three modes
 * (template, layout, freeform), with two structural differences:
 *
 *   1. The Block Builder tab is only available in `template` and `layout`
 *      modes. Freeform mode treats the whole canvas as a giant block
 *      builder, so a separate block builder tab is redundant and hidden.
 *
 *   2. When the user switches to the Block Builder tab, the entire work
 *      area (toolbar + canvas + library panel) is replaced with
 *      `BlockBuilderWorktable` — its own self-contained editor with its
 *      own toolbar, canvas, and right panel.
 *
 *   ┌───────────────────────────────────────────────────────┐
 *   │ StudioTopBar                                             │
 *   ├───────────────────────────────────────────────────────┤
 *   │ [Quilt] [Block Builder]   ← tabs (template/layout only)  │
 *   ├───────────────────────────────────────────────────────┤
 *   │ Toolbar │  Canvas  │ ContextPanel  ← Quilt worktable     │
 *   │   88px  │  flex-1  │     320px        OR                 │
 *   │         │          │                BlockBuilderWorktable│
 *   ├───────────────────────────────────────────────────────┤
 *   │ BottomBar                                                │
 *   └───────────────────────────────────────────────────────┘
 */
export function StudioLayout({ project }: StudioLayoutProps) {
  const { getCanvas } = useCanvasContext();
  const isSaving = useRef(false);

  const projectMode = useProjectStore((s) => s.mode);
  const activeWorktable = useCanvasStore((s) => s.activeWorktable);
  const setActiveWorktable = useCanvasStore((s) => s.setActiveWorktable);

  // Per spec: Block Builder is available in Layout and Freeform — NOT
  // Template. Templates are pre-baked complete quilts; there's no block
  // authoring needed in that mode. Layout has block cells to fill, and
  // Freeform users may want to author standalone blocks for reuse.
  const showBlockBuilderTab = projectMode === 'layout' || projectMode === 'free-form';

  // One-shot template stamp once the canvas is ready.
  useTemplateHydration();

  // Safety: if the tab isn't allowed in this mode (template), force back to
  // the quilt worktable. Defends against stale state from a previous session.
  useEffect(() => {
    if (!showBlockBuilderTab && activeWorktable !== 'quilt') {
      setActiveWorktable('quilt');
    }
  }, [showBlockBuilderTab, activeWorktable, setActiveWorktable]);

  // ── Manual save handler ────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (isSaving.current) return;
    isSaving.current = true;
    try {
      const { projectId } = useProjectStore.getState();
      const fabricCanvas = getCanvas();
      if (!projectId || !fabricCanvas) return;
      await saveProject({ projectId, fabricCanvas, source: 'manual' });
    } finally {
      isSaving.current = false;
    }
  }, [getCanvas]);

  // ── Drag start handlers — emit the dataTransfer payloads that the
  // unified drop dispatcher in StudioDropZone routes to either the
  // fabric or block drop hooks. ───────────────────────────────
  const handleBlockDragStart = useCallback(
    (e: React.DragEvent, blockId: string) => {
      e.dataTransfer.setData('application/quiltcorgi+block-id', blockId);
      e.dataTransfer.effectAllowed = 'copy';
    },
    [],
  );

  const handleFabricDragStart = useCallback(
    (e: React.DragEvent, fabricId: string) => {
      e.dataTransfer.setData('application/quiltcorgi-fabric-id', fabricId);
      e.dataTransfer.effectAllowed = 'copy';
    },
    [],
  );

  return (
    <div className="studio-layout flex h-full flex-col">
      {/* ── Top bar ── */}
      <StudioTopBar onSave={handleSave} />

      {/* ── Worktable tabs (template + layout modes only) ── */}
      {showBlockBuilderTab && (
        <div
          role="tablist"
          aria-label="Studio worktable"
          className="flex items-center gap-1 px-3 py-1.5 bg-[var(--color-bg)] border-b border-[var(--color-border)]/15 flex-shrink-0"
        >
          <WorktableTab
            label="Quilt"
            icon={<LayoutGrid size={14} strokeWidth={2} />}
            active={activeWorktable === 'quilt'}
            onClick={() => setActiveWorktable('quilt')}
          />
          <WorktableTab
            label="Block Builder"
            icon={<Layers size={14} strokeWidth={2} />}
            active={activeWorktable === 'block-builder'}
            onClick={() => setActiveWorktable('block-builder')}
          />
        </div>
      )}

      {/* ── Main work area: switches between Quilt and Block Builder ── */}
      <div className="flex flex-1 overflow-hidden">
        {activeWorktable === 'quilt' ? (
          <>
            <Toolbar />
            <StudioDropZone project={project} />
            <ContextPanel
              onBlockDragStart={handleBlockDragStart}
              onFabricDragStart={handleFabricDragStart}
            />
          </>
        ) : (
          <BlockBuilderWorktable />
        )}
      </div>

      {/* ── Bottom bar ── */}
      <BottomBar />
    </div>
  );
}

function WorktableTab({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold transition-colors ${
        active
          ? 'bg-[var(--color-primary)] text-[var(--color-text-on-primary)] shadow-[0_1px_2px_rgba(54,49,45,0.08)]'
          : 'text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:bg-[var(--color-border)]/20'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
