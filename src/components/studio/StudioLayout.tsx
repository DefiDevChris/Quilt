'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Project } from '@/types/project';
import { GRID_LINE_COLOR } from '@/lib/constants';

import { StudioTopBar } from '@/components/studio/StudioTopBar';
import { Toolbar } from '@/components/studio/Toolbar';
import { BottomBar } from '@/components/studio/BottomBar';
import { ContextPanel } from '@/components/studio/ContextPanel';
import { ContextMenu } from '@/components/canvas/ContextMenu';
import { QuickInfo } from '@/components/canvas/QuickInfo';
import { LayoutAdjuster } from '@/components/fabrics/LayoutAdjuster';
import { DuplicateOptionsPopup } from '@/components/studio/DuplicateOptionsPopup';
import { NewQuiltSetupModal } from '@/components/studio/NewQuiltSetupModal';
import { StudioDropZone } from '@/components/studio/StudioDropZone';
import { WorktableTabs } from '@/components/studio/WorktableTabs';
import { useStudioDialogs } from '@/components/studio/StudioDialogs';
import { BlockBuilderWorktable } from '@/components/studio/BlockBuilderWorktable';
import { LayoutCreatorWorktable } from '@/components/studio/LayoutCreatorWorktable';

import { YardagePanel } from '@/components/measurement/YardagePanel';
import { PrintlistPanel } from '@/components/export/PrintlistPanel';

import { useAuthStore } from '@/stores/authStore';
import { useCanvasStore } from '@/stores/canvasStore';
import { useProjectStore } from '@/stores/projectStore';
import { useFabricDrop } from '@/hooks/useFabricLayout';
import { useBlockDrop } from '@/hooks/useBlockDrop';
import { useYardageCalculation } from '@/hooks/useYardageCalculation';
import { usePhotoLayoutImport } from '@/hooks/usePhotoLayoutImport';
import { saveProject } from '@/lib/save-project';

interface StudioLayoutProps {
  readonly project: Project;
}

export function StudioLayout({ project }: StudioLayoutProps) {
  const dialogs = useStudioDialogs();
  const isPro = useAuthStore((s) => s.isPro);

  const activeWorktable = useCanvasStore((s) => s.activeWorktable);
  const fabricCanvas = useCanvasStore((s) => s.fabricCanvas);
  const showReferencePanel = useCanvasStore((s) => s.showReferencePanel);
  const referenceImageUrl = useCanvasStore((s) => s.referenceImageUrl);

  // First-visit setup detection
  const [showQuiltSetup, setShowQuiltSetup] = useState(false);
  const quiltSetupShownRef = useRef(false);

  // First-visit detection for the QUILT worktable
  useEffect(() => {
    if (activeWorktable !== 'quilt' || quiltSetupShownRef.current) return;
    const key = `qc-quilt-setup-shown-${project.id}`;
    if (typeof window !== 'undefined' && window.sessionStorage.getItem(key) === '1') {
      quiltSetupShownRef.current = true;
      return;
    }
    const canvas = useCanvasStore.getState().fabricCanvas;
    const objs = canvas?.getObjects() ?? [];
    const hasUserContent = objs.some((o) => {
      const r = o as unknown as Record<string, unknown>;
      if (r['_fenceElement']) return false;
      const stroke = (r['stroke'] as string | undefined) ?? '';
      return stroke !== GRID_LINE_COLOR;
    });
    if (!hasUserContent) {
      queueMicrotask(() => setShowQuiltSetup(true));
    }
    quiltSetupShownRef.current = true;
  }, [activeWorktable, project.id]);

  const handleQuiltSetupConfirm = useCallback(
    ({ width, height }: { width: number; height: number }) => {
      useProjectStore.getState().setCanvasWidth(width);
      useProjectStore.getState().setCanvasHeight(height);
      useCanvasStore.getState().centerAndFitViewport();
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(`qc-quilt-setup-shown-${project.id}`, '1');
      }
      setShowQuiltSetup(false);
    },
    [project.id]
  );

  const handleQuiltSetupDismiss = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(`qc-quilt-setup-shown-${project.id}`, '1');
    }
    setShowQuiltSetup(false);
  }, [project.id]);

  // Block/fabric drag-start callbacks for the ContextPanel libraries
  const { handleDragStart: handleBlockDragStart } = useBlockDrop();
  const { handleFabricDragStart } = useFabricDrop();

  // Mount supporting hooks
  useYardageCalculation();
  usePhotoLayoutImport();

  const handleSave = useCallback(() => {
    const { projectId } = useProjectStore.getState();
    if (projectId) {
      saveProject({ projectId, fabricCanvas });
    }
  }, [fabricCanvas]);

  const handleNewBlock = useCallback(() => {
    const canvas = useCanvasStore.getState().fabricCanvas;
    if (canvas) {
      canvas.clear();
      canvas.backgroundColor = '#FFFFFF';
      canvas.renderAll();
    }
    useCanvasStore.getState().resetHistory();
  }, []);

  return (
    <div className="h-screen flex flex-col bg-surface select-none">
      <StudioTopBar
        onOpenImageExport={dialogs.openImageExport}
        onOpenPdfExport={dialogs.openPdfExport}
        onOpenHelp={dialogs.openHelp}
        onOpenHistory={dialogs.openHistory}
        onSave={handleSave}
      />

      {/* ── Block Builder worktable ──────────────────────────── */}
      {activeWorktable === 'block-builder' ? (
        <BlockBuilderWorktable
          onDone={() => {
            useCanvasStore.getState().setActiveWorktable('quilt');
          }}
        />
      ) : activeWorktable === 'layout-creator' ? (
        /* ── Layout Creator worktable ──────────────────────── */
        <LayoutCreatorWorktable
          onDone={() => {
            useCanvasStore.getState().setActiveWorktable('quilt');
          }}
        />
      ) : (
        /* ── Normal quilt worktable (free-draw or layout) ───── */
        <div className="flex-1 flex overflow-hidden">
          {/* Left side: tools */}
          <Toolbar
            onOpenImageExport={dialogs.openImageExport}
            onSaveBlock={() => useCanvasStore.getState().setActiveWorktable('block-builder')}
            onNewBlock={handleNewBlock}
          />

          {/* Canvas area */}
          <div className="flex-1 flex flex-col overflow-hidden relative" data-tour="canvas">
            {/* Worktable tab bar */}
            <WorktableTabs />
            <div className="flex-1 flex overflow-hidden relative">
              <div
                className={`flex flex-col overflow-hidden relative ${showReferencePanel && referenceImageUrl ? 'w-1/2' : 'flex-1'
                  }`}
              >
                <StudioDropZone project={project} />
                <ContextMenu />
                <QuickInfo />
                <LayoutAdjuster />
              </div>

              {/* Reference photo split pane */}
              {showReferencePanel && referenceImageUrl && (
                <div className="w-1/2 border-l border-outline-variant/20 bg-surface-container/30 flex flex-col overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-outline-variant/15">
                    <span className="text-[12px] font-semibold text-on-surface/60 uppercase tracking-wider">
                      Reference Photo
                    </span>
                    <button
                      type="button"
                      onClick={() => useCanvasStore.getState().setShowReferencePanel(false)}
                      className="w-6 h-6 flex items-center justify-center rounded-md text-on-surface/40 hover:text-on-surface hover:bg-surface-container transition-colors"
                      aria-label="Close reference panel"
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path
                          d="M3 3L11 11M11 3L3 11"
                          stroke="currentColor"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  </div>
                  <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={referenceImageUrl}
                      alt="Original reference photo"
                      className="max-w-full max-h-full object-contain rounded-lg shadow-elevation-1"
                      draggable={false}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Pro-only production panels — flex siblings so they push the canvas, not cover it */}
            {isPro && <YardagePanel />}
            {isPro && (
              <PrintlistPanel
                onGeneratePdf={dialogs.openPdfExport}
                onExportImage={dialogs.openImageExport}
              />
            )}

            {/* Right context panel (libraries) */}
            <ContextPanel
              onBlockDragStart={handleBlockDragStart}
              onFabricDragStart={handleFabricDragStart}
              onOpenDrafting={() => useCanvasStore.getState().setActiveWorktable('block-builder')}
              onOpenPhotoUpload={dialogs.openPhotoBlockUpload}
              onOpenUpload={dialogs.openFabricUpload}
            />
          </div>
        </div>
      )}

      <BottomBar />

      {/* Duplicate options popup */}
      <DuplicateOptionsPopup />

      {/* First-visit setup modal */}
      <NewQuiltSetupModal
        isOpen={showQuiltSetup}
        onConfirm={handleQuiltSetupConfirm}
        onDismiss={handleQuiltSetupDismiss}
      />
    </div>
  );
}
