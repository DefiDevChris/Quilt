'use client';

import React, { useCallback, useRef } from 'react';

import { StudioTopBar } from '@/components/studio/StudioTopBar';
import { Toolbar } from '@/components/studio/Toolbar';
import { ContextPanel } from '@/components/studio/ContextPanel';
import { BottomBar } from '@/components/studio/BottomBar';
import { useCanvasStore } from '@/stores/canvasStore';
import { useProjectStore } from '@/stores/projectStore';
import { saveProject } from '@/lib/save-project';
import { useCanvasContext } from '@/contexts/CanvasContext';

/**
 * StudioLayout
 *
 * Design-phase shell. Renders the full studio chrome once a mode is
 * selected and (for layout/template) locked:
 *
 *   ┌─────────────────────────────────────┐
 *   │ StudioTopBar                        │
 *   ├──────┬──────────────────┬───────────┤
 *   │ Tool │                  │ Context   │
 *   │ bar  │  Canvas area     │ Panel     │
 *   │      │  (flex-1)        │ (320px)   │
 *   ├──────┴──────────────────┴───────────┤
 *   │ BottomBar                           │
 *   └─────────────────────────────────────┘
 *
 * The canvas itself (CanvasWorkspace) is not owned here — it will be
 * integrated via StudioDropZone once project hydration is wired up.
 * For now the center area is an empty flex-1 region.
 */
export function StudioLayout() {
  const { getCanvas } = useCanvasContext();
  const isSaving = useRef(false);

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

  // ── Block / fabric drag stubs (wired to drop zone later) ────────
  const handleBlockDragStart = useCallback(
    (_e: React.DragEvent, _blockId: string) => {
      // Handled by StudioDropZone once canvas is integrated
    },
    [],
  );

  const handleFabricDragStart = useCallback(
    (_e: React.DragEvent, _fabricId: string) => {
      // Handled by StudioDropZone once canvas is integrated
    },
    [],
  );

  return (
    <div className="studio-layout flex h-full flex-col">
      {/* ── Top bar ── */}
      <StudioTopBar onSave={handleSave} />

      {/* ── Main work area: Toolbar | Canvas | ContextPanel ── */}
      <div className="flex flex-1 overflow-hidden">
        <Toolbar />

        {/* Center: canvas placeholder (flex-1) */}
        <main className="flex-1 overflow-hidden" />

        <ContextPanel
          onBlockDragStart={handleBlockDragStart}
          onFabricDragStart={handleFabricDragStart}
        />
      </div>

      {/* ── Bottom bar ── */}
      <BottomBar />
    </div>
  );
}
