'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { NewProjectWizard } from '@/components/projects/NewProjectWizard';
import { useCanvasStore } from '@/stores/canvasStore';
import { useLayoutStore } from '@/stores/layoutStore';
import { useProjectStore } from '@/stores/projectStore';
import { clearFabricCanvas } from '@/lib/canvas/clearFabricCanvas';
import { applyLayoutConfig } from '@/lib/layout/applyLayoutConfig';
import type { ApplyableLayoutConfig } from '@/lib/layout/applyLayoutConfig';

/**
 * StudioLayout
 *
 * Shell component that wraps the Design Studio chrome: toolbar, side-panels,
 * and the new-project wizard overlay. Does NOT own the canvas — that lives in
 * CanvasWorkspace (rendered by StudioClient as a sibling).
 *
 * Key design decisions:
 *  - Wizard is shown for new quilts; `allowDismiss` is hardcoded to false
 *    because there is no dismiss affordance in the studio entry path.
 *    (quiltSetupDismissible was removed — it was always false.)
 *  - Canvas clear + layout reset is delegated to clearFabricCanvas() and
 *    applyLayoutConfig() helpers to avoid duplicating the ritual here.
 */
export function StudioLayout({
  onSave,
  onBack,
}: {
  onSave: () => Promise<void>;
  onBack: () => void;
}) {
  const fabricCanvas = useCanvasStore((s) => s.fabricCanvas);
  const projectId = useProjectStore((s) => s.projectId);
  const projectMode = useProjectStore((s) => s.projectMode);
  const projectName = useProjectStore((s) => s.projectName);

  const [showWizard, setShowWizard] = useState(!projectId);

  const isSaving = useRef(false);

  // ── handlers ────────────────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    if (isSaving.current) return;
    isSaving.current = true;
    try {
      await onSave();
    } finally {
      isSaving.current = false;
    }
  }, [onSave]);

  /**
   * "Start over" — clear the canvas and reset to a blank layout.
   * clearFabricCanvas is a no-op when fabricCanvas is null.
   */
  const handleStartOverLayout = useCallback(() => {
    clearFabricCanvas(fabricCanvas);

    const store = useLayoutStore.getState();
    store.resetLayout();

    setShowWizard(true);
  }, [fabricCanvas]);

  /**
   * Wizard confirmation — apply the chosen layout and close the wizard.
   */
  const handleWizardConfirm = useCallback(
    (layoutConfig: ApplyableLayoutConfig) => {
      const store = useLayoutStore.getState();
      applyLayoutConfig(store, layoutConfig);
      setShowWizard(false);
    },
    [],
  );

  const handleNewBlock = useCallback(() => {
    clearFabricCanvas(fabricCanvas);
  }, [fabricCanvas]);

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <div className="studio-layout flex h-full flex-col">
      {/* ── Top toolbar ── */}
      <header className="studio-toolbar flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="btn-ghost flex items-center gap-1 text-sm"
            aria-label="Back to dashboard"
          >
            ← Back
          </button>
          <span className="text-sm font-medium text-[var(--color-text)]">
            {projectName ?? 'New Quilt'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleNewBlock}
            className="btn-secondary text-sm"
          >
            New Block
          </button>
          <button
            onClick={handleStartOverLayout}
            className="btn-secondary text-sm"
          >
            Start Over
          </button>
          <button
            onClick={handleSave}
            className="btn-primary text-sm"
          >
            Save
          </button>
        </div>
      </header>

      {/* ── Wizard overlay ── */}
      {showWizard && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/30">
          <NewProjectWizard
            onConfirm={handleWizardConfirm}
            allowDismiss={false}
            /* allowDismiss is always false in the studio entry path —
               the dismiss affordance was removed along with the dead
               quiltSetupDismissible state that was never set to true. */
          />
        </div>
      )}

      {/* ── Main content area (panels live here in follow-up PRs) ── */}
      <main className="flex-1 overflow-hidden" />
    </div>
  );
}
