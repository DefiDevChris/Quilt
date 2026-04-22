'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { CanvasWorkspace } from '@/components/canvas/CanvasWorkspace';
import { ProjectModeModal } from '@/components/studio/ProjectModeModal';
import { StudioLayout } from '@/components/studio/StudioLayout';
import { useCanvasStore } from '@/stores/canvasStore';
import { useLayoutStore } from '@/stores/layoutStore';
import { useProjectStore } from '@/stores/projectStore';
import { applyLayoutConfig } from '@/lib/layout/applyLayoutConfig';
import type { ApplyableLayoutConfig } from '@/lib/layout/applyLayoutConfig';
import { DEFAULT_LAYOUT } from '@/lib/constants';

/**
 * StudioClient
 *
 * Top-level client component for the Design Studio. Owns:
 *  - Project-mode gate (shows ProjectModeModal until a mode is chosen)
 *  - Default-layout bootstrap for new projects
 *  - Viewport centering once CanvasWorkspace has mounted and exposed fabricCanvas
 */
export default function StudioClient() {
  const router = useRouter();

  // ── store slices ────────────────────────────────────────────────────────────
  const fabricCanvas = useCanvasStore((s) => s.fabricCanvas);
  const projectMode = useProjectStore((s) => s.projectMode);
  const projectId = useProjectStore((s) => s.projectId);
  const hasUnsavedChanges = useProjectStore((s) => s.hasUnsavedChanges);

  // ── local state ─────────────────────────────────────────────────────────────
  const [showModeModal, setShowModeModal] = useState(!projectMode);

  /**
   * pendingFit: true while we are waiting for fabricCanvas to become non-null
   * so we can call centerAndFitViewport. Set to true after default-layout is
   * applied (new-project path) or on initial mount when a project already has
   * a canvas (existing-project path). Reset to false the moment the fit runs.
   *
   * Replaces the prior requestAnimationFrame approach which fired before
   * CanvasWorkspace committed, leaving fabricCanvas null and the fit a no-op.
   */
  const [pendingFit, setPendingFit] = useState(false);

  // ── refs ────────────────────────────────────────────────────────────────────
  const hasAppliedDefaultLayout = useRef(false);

  // ── callbacks ───────────────────────────────────────────────────────────────
  const handleModeSelected = useCallback(() => {
    setShowModeModal(false);
  }, []);

  const handleSave = useCallback(async () => {
    try {
      // Project auto-saves via store middleware; this surfaces a toast.
      toast.success('Project saved');
    } catch {
      toast.error('Failed to save project');
    }
  }, []);

  const handleBack = useCallback(() => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        'You have unsaved changes. Leave anyway?',
      );
      if (!confirmed) return;
    }
    router.push('/dashboard');
  }, [hasUnsavedChanges, router]);

  // ── effects ─────────────────────────────────────────────────────────────────

  /**
   * Bootstrap default layout for brand-new projects (no projectId yet).
   * Runs once; sets pendingFit so the viewport-fit effect below knows to fire
   * once fabricCanvas becomes available.
   */
  useEffect(() => {
    if (hasAppliedDefaultLayout.current) return;
    if (projectId) return; // existing project — layout comes from persisted state

    hasAppliedDefaultLayout.current = true;

    const store = useLayoutStore.getState();
    const config: ApplyableLayoutConfig = {
      layoutType: DEFAULT_LAYOUT.layoutType,
      rows: DEFAULT_LAYOUT.rows,
      cols: DEFAULT_LAYOUT.cols,
      blockSize: DEFAULT_LAYOUT.blockSize,
      sashing: DEFAULT_LAYOUT.sashing,
      borders: DEFAULT_LAYOUT.borders,
      hasCornerStones: DEFAULT_LAYOUT.hasCornerStones,
      bindingWidth: DEFAULT_LAYOUT.bindingWidth,
    };
    applyLayoutConfig(store, config);
    setPendingFit(true);
  }, [projectId]);

  /**
   * Viewport-fit effect.
   *
   * Subscribes to fabricCanvas via the Zustand selector already declared at
   * the top of the component (re-renders whenever fabricCanvas changes).
   * When pendingFit is true AND fabricCanvas is non-null we call
   * centerAndFitViewport and clear the pending flag.
   *
   * This replaces the previous requestAnimationFrame approach that fired
   * before CanvasWorkspace had a chance to mount, leaving fabricCanvas null
   * and the fit silently ignored.
   */
  useEffect(() => {
    if (!pendingFit) return;
    if (!fabricCanvas) return;

    // fabricCanvas is now available — perform the fit.
    const canvasStore = useCanvasStore.getState();
    if (canvasStore.centerAndFitViewport) {
      canvasStore.centerAndFitViewport();
    }
    setPendingFit(false);
  }, [pendingFit, fabricCanvas]);

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <>
      {showModeModal && (
        <ProjectModeModal onModeSelected={handleModeSelected} />
      )}

      <StudioLayout
        onSave={handleSave}
        onBack={handleBack}
      />

      <CanvasWorkspace />
    </>
  );
}
