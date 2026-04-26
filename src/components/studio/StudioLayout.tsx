'use client';

import React, { useCallback, useRef } from 'react';
import { motion } from 'framer-motion';

import { StudioTopBar } from '@/components/studio/StudioTopBar';
import { Toolbar } from '@/components/studio/Toolbar';
import { ContextPanel } from '@/components/studio/ContextPanel';
import { BottomBar } from '@/components/studio/BottomBar';
import { StudioDropZone } from '@/components/studio/StudioDropZone';
import { BlockBuilderWorktable } from '@/components/studio/BlockBuilderWorktable';
import { YardagePanel } from '@/components/studio/YardagePanel';
import { useCanvasStore } from '@/stores/canvasStore';
import { useProjectStore } from '@/stores/projectStore';
import { saveProject } from '@/lib/save-project';
import { useCanvasContext } from '@/contexts/CanvasContext';
import { useTemplateHydration } from '@/hooks/useTemplateHydration';
import type { Project } from '@/types/project';

/**
 * StudioLayout
 *
 * Design-phase shell. Renders the full studio chrome once the project is
 * loaded:
 *
 *   ┌────────────────────────────────────────────┐
 *   │ StudioTopBar                               │
 *   ├────────────────────────────────────────────┤
 *   │ Worktable tabs  (Quilt | Block Builder)    │
 *   │   — hidden when mode === 'template' —      │
 *   ├──────┬───────────────────────┬─────────────┤
 *   │ Tool │  Canvas / BlockBuilder │ Context    │
 *   │ bar  │       (flex-1)         │ Panel      │
 *   ├──────┴───────────────────────┴─────────────┤
 *   │ BottomBar                                  │
 *   └────────────────────────────────────────────┘
 *
 * The center area renders one of:
 *   - <StudioDropZone> wrapping <CanvasWorkspace>  (active worktable: 'quilt')
 *   - <BlockBuilderWorktable />                    (active worktable: 'block-builder')
 *
 * Block Builder is hidden in Template mode entirely — template users may
 * only swap fabrics on a pre-built quilt.
 */
interface StudioLayoutProps {
  readonly project: Project;
  /**
   * True while the SelectionShell (Phase 1 catalogs + sliders) is on top.
   * The studio chrome stays mounted underneath so the canvas is continuous
   * between phases — but the side rails (Toolbar + ContextPanel) fade in
   * once the SelectionShell has slid away, instead of appearing abruptly.
   */
  readonly configuring?: boolean;
}

export function StudioLayout({ project, configuring = false }: StudioLayoutProps) {
  const { getCanvas } = useCanvasContext();
  const isSaving = useRef(false);

  const projectMode = useProjectStore((s) => s.mode);
  const activeWorktable = useCanvasStore((s) => s.activeWorktable);
  const setActiveWorktable = useCanvasStore((s) => s.setActiveWorktable);

  // Apply selected template (system or user-saved) to the canvas once the
  // user has clicked "Start Designing" in template mode.
  useTemplateHydration();

  // ── Manual save handler ──────────────────────────────────────────
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

  // ── Block / fabric drag stubs ───────────────────────────────────
  // The actual drop targets live inside StudioDropZone (see useBlockDrop /
  // useFabricLayout hooks). The ContextPanel only needs these to wire up
  // dataTransfer on dragstart so the dispatcher in StudioDropZone can route.
  const handleBlockDragStart = useCallback(
    (e: React.DragEvent, blockId: string) => {
      e.dataTransfer.setData('application/quiltcorgi-block-id', blockId);
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

  const showWorktableTabs = projectMode !== 'template';

  return (
    <div className="studio-layout flex h-full flex-col">
      {/* ── Top bar ── */}
      <StudioTopBar onSave={handleSave} />

      {/* ── Worktable tab strip (hidden in template mode) ── */}
      {showWorktableTabs && (
        <div
          role="tablist"
          aria-label="Worktable"
          className="flex h-9 flex-shrink-0 items-end gap-0 border-b border-[var(--color-border)]/15 bg-[var(--color-bg)] px-3"
        >
          <WorktableTab
            label="Quilt"
            active={activeWorktable === 'quilt'}
            onClick={() => setActiveWorktable('quilt')}
          />
          <WorktableTab
            label="Block Builder"
            active={activeWorktable === 'block-builder'}
            onClick={() => setActiveWorktable('block-builder')}
          />
        </div>
      )}

      {/* ── Main work area: Toolbar | Center | ContextPanel ──
       *
       * Toolbar and ContextPanel fade in on the Phase 1 → Phase 2 boundary
       * (driven by `configuring`). The center column is NOT animated — the
       * canvas inside StudioDropZone is the constant anchor that the spec
       * requires to stay visually continuous across phases.
       */}
      <div className="flex flex-1 overflow-hidden">
        <motion.div
          initial={false}
          animate={{
            opacity: configuring ? 0 : 1,
            x: configuring ? -16 : 0,
          }}
          transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1], delay: configuring ? 0 : 0.18 }}
          className="flex"
        >
          <Toolbar />
        </motion.div>

        <main className="flex flex-1 overflow-hidden">
          {activeWorktable === 'block-builder' && showWorktableTabs ? (
            <BlockBuilderWorktable />
          ) : (
            <StudioDropZone project={project} />
          )}
        </main>

        <motion.div
          initial={false}
          animate={{
            opacity: configuring ? 0 : 1,
            x: configuring ? 16 : 0,
          }}
          transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1], delay: configuring ? 0 : 0.18 }}
          className="flex"
        >
          <ContextPanel
            onBlockDragStart={handleBlockDragStart}
            onFabricDragStart={handleFabricDragStart}
          />
        </motion.div>
      </div>

      {/* ── Bottom bar ── */}
      <BottomBar />

      {/* ── Yardage Calculator (modal — driven by useYardageStore) ── */}
      <YardagePanel />
    </div>
  );
}

function WorktableTab({
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
      className={`px-4 py-1.5 text-[13px] leading-[20px] font-semibold rounded-t-lg transition-colors duration-150 ${
        active
          ? 'border-b-2 border-[var(--color-primary)] text-[var(--color-text)] bg-[var(--color-border)]/20'
          : 'text-[var(--color-text)]/60 hover:text-[var(--color-text)] hover:bg-[var(--color-border)]/10'
      }`}
    >
      {label}
    </button>
  );
}
