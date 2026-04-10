'use client';

/**
 * StudioLayout — The Design Studio workspace
 *
 * Three-panel layout:
 * - Left sidebar (Toolbar): Narrow strip of tool buttons for interacting with the canvas
 * - Center (Canvas): Main design area where you build your quilt (the worktable)
 * - Right sidebar (Context Panel): Library tabs where you browse Layouts, Blocks, and Fabrics
 *
 * Top bar: Project name, viewport controls, settings, and actions like undo/redo/zoom
 * Bottom bar: Status info like cursor position and snap settings
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Project } from '@/types/project';

import { StudioTopBar } from '@/components/studio/StudioTopBar';
import { Toolbar } from '@/components/studio/Toolbar';
import { BottomBar } from '@/components/studio/BottomBar';
import { ContextPanel } from '@/components/studio/ContextPanel';
import { ContextMenu } from '@/components/canvas/ContextMenu';
import { QuickInfo } from '@/components/canvas/QuickInfo';
import { LayoutAdjuster } from '@/components/fabrics/LayoutAdjuster';
import { DuplicateOptionsPopup } from '@/components/studio/DuplicateOptionsPopup';
import { NewProjectWizard } from '@/components/projects/NewProjectWizard';
import { StudioDropZone } from '@/components/studio/StudioDropZone';

import { useStudioDialogs } from '@/components/studio/StudioDialogs';
import { BlockBuilderWorktable } from '@/components/studio/BlockBuilderWorktable';

import { useCanvasStore } from '@/stores/canvasStore';
import { useProjectStore } from '@/stores/projectStore';
import { useFabricDrop } from '@/hooks/useFabricLayout';
import { useBlockDrop } from '@/hooks/useBlockDrop';
import { usePhotoPatternImport } from '@/hooks/usePhotoLayoutImport';
import { saveProject } from '@/lib/save-project';

interface StudioLayoutProps {
  readonly project: Project;
}

export function StudioLayout({ project }: StudioLayoutProps) {
  const dialogs = useStudioDialogs();

  const activeWorktable = useCanvasStore((s) => s.activeWorktable);
  const fabricCanvas = useCanvasStore((s) => s.fabricCanvas);
  const showReferencePanel = useCanvasStore((s) => s.showReferencePanel);
  const referenceImageUrl = useCanvasStore((s) => s.referenceImageUrl);

  // First-visit setup detection
  // Uses the unified NewProjectWizard in studio mode.
  // Users coming from the Dashboard NewProjectWizard will have this suppressed.
  const [showQuiltSetup, setShowQuiltSetup] = useState(false);
  const quiltSetupShownRef = useRef(false);

  // First-visit detection for the QUILT worktable
  // Only show modal if user didn't come from the wizard (which already collects all info)
  useEffect(() => {
    if (activeWorktable !== 'quilt' || quiltSetupShownRef.current) return;
    const key = `qc-quilt-setup-shown-${project.id}`;
    if (typeof window !== 'undefined' && window.sessionStorage.getItem(key) === '1') {
      quiltSetupShownRef.current = true;
      return;
    }
    const hasContent = useProjectStore.getState().hasContent;
    if (!hasContent) {
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
        // Clean up the dimensions storage
        window.sessionStorage.removeItem(`qc-quilt-setup-dimensions-${project.id}`);
      }
      setShowQuiltSetup(false);
    },
    [project.id]
  );

  const handleQuiltSetupDismiss = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(`qc-quilt-setup-shown-${project.id}`, '1');
      // Clean up the dimensions storage
      window.sessionStorage.removeItem(`qc-quilt-setup-dimensions-${project.id}`);
    }
    setShowQuiltSetup(false);
  }, [project.id]);

  // Block/fabric drag-start callbacks for the ContextPanel libraries
  const { handleDragStart: handleBlockDragStart } = useBlockDrop();
  const { handleFabricDragStart } = useFabricDrop();

  // Mount supporting hooks
  usePhotoPatternImport();

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
    <div className="h-screen flex flex-col bg-neutral select-none">
      <StudioTopBar
        onOpenImageExport={dialogs.openImageExport}
        onOpenPdfExport={dialogs.openPdfExport}
        onOpenHelp={dialogs.openHelp}
        onOpenHistory={dialogs.openHistory}
        onSave={handleSave}
      />

      {/* ── Unified 3-pane layout for ALL modes ───────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar: mode-specific toolbar */}
        {activeWorktable === 'block-builder' ? (
          <BlockBuilderWorktable onDone={() => {
            useCanvasStore.getState().setActiveWorktable('quilt');
          }}
            toolbarOnly
          />
        ) : (
          <Toolbar
            onOpenImageExport={dialogs.openImageExport}
            onSaveBlock={() => useCanvasStore.getState().setActiveWorktable('block-builder')}
            onNewBlock={handleNewBlock}
          />
        )}

        {/* Center: Canvas area */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <div className="flex-1 flex overflow-hidden relative">
            {activeWorktable === 'block-builder' ? (
              <BlockBuilderWorktable
                onDone={() => {
                  useCanvasStore.getState().setActiveWorktable('quilt');
                }}
                canvasOnly
              />
            ) : (
              <>
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
                  <div className="w-1/2 border-l border-neutral-200/20 bg-neutral-container/30 flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-200/15">
                      <span className="text-[12px] font-semibold text-neutral-800/60 uppercase tracking-wider">
                        Reference Photo
                      </span>
                      <button
                        type="button"
                        onClick={() => useCanvasStore.getState().setShowReferencePanel(false)}
                        className="w-6 h-6 flex items-center justify-center rounded-full text-neutral-800/40 hover:text-neutral-800 hover:bg-neutral-100 transition-colors"
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
                        className="max-w-full max-h-full object-contain rounded-full shadow-elevation-2"
                        draggable={false}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right sidebar: mode-specific panel */}
        {activeWorktable === 'block-builder' ? (
          <BlockBuilderWorktable
            onDone={() => {
              useCanvasStore.getState().setActiveWorktable('quilt');
            }}
            panelOnly
          />
        ) : (
          <ContextPanel
            onBlockDragStart={handleBlockDragStart}
            onFabricDragStart={handleFabricDragStart}
            onOpenDrafting={() => useCanvasStore.getState().setActiveWorktable('block-builder')}
            onOpenPhotoUpload={dialogs.openPhotoBlockUpload}
            onOpenUpload={dialogs.openFabricUpload}
          />
        )}
      </div>

      <BottomBar />

      {/* Duplicate options popup */}
      <DuplicateOptionsPopup />

      {/* First-visit setup modal (unified wizard, studio mode) */}
      <NewProjectWizard
        mode="studio"
        open={showQuiltSetup}
        projectId={project.id}
        onConfirm={handleQuiltSetupConfirm}
        onClose={handleQuiltSetupDismiss}
        onDismiss={handleQuiltSetupDismiss}
      />
    </div>
  );
}
