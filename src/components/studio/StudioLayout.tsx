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
import { NewBlockSetupModal } from '@/components/studio/NewBlockSetupModal';
import { NewLayoutSetupModal } from '@/components/studio/NewLayoutSetupModal';
import { NewQuiltSetupModal } from '@/components/studio/NewQuiltSetupModal';
import { PrintOptionsPanel } from '@/components/studio/PrintOptionsPanel';
import { StudioDropZone } from '@/components/studio/StudioDropZone';
import { useStudioDialogs } from '@/components/studio/StudioDialogs';

import { YardagePanel } from '@/components/measurement/YardagePanel';
import { PrintlistPanel } from '@/components/export/PrintlistPanel';

import { useAuthStore } from '@/stores/authStore';
import { useCanvasStore } from '@/stores/canvasStore';
import { useProjectStore } from '@/stores/projectStore';
import { useLayoutStore } from '@/stores/layoutStore';
import { LAYOUT_PRESETS } from '@/lib/layout-library';
import type { LayoutType } from '@/lib/layout-utils';
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
  const [showBlockSetup, setShowBlockSetup] = useState(false);
  const [showLayoutSetup, setShowLayoutSetup] = useState(false);
  const [showQuiltSetup, setShowQuiltSetup] = useState(false);
  const blockSetupShownRef = useRef(false);
  const layoutSetupShownRef = useRef(false);
  const quiltSetupShownRef = useRef(false);

  // First-visit detection for the QUILT worktable: brand-new projects with
  // an empty canvas open the NewQuiltSetupModal so the user picks a finished
  // size before doing anything else.
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
      if (r['_layoutRendererElement']) return false;
      const stroke = (r['stroke'] as string | undefined) ?? '';
      return stroke !== GRID_LINE_COLOR;
    });
    if (!hasUserContent) {
      queueMicrotask(() => setShowQuiltSetup(true));
    }
    quiltSetupShownRef.current = true;
  }, [activeWorktable, project.id]);

  const handleQuiltSetupConfirm = useCallback(
    ({ width, height, openLayouts }: { width: number; height: number; openLayouts: boolean }) => {
      useProjectStore.getState().setCanvasWidth(width);
      useProjectStore.getState().setCanvasHeight(height);
      useCanvasStore.getState().centerAndFitViewport();
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(`qc-quilt-setup-shown-${project.id}`, '1');
      }
      setShowQuiltSetup(false);
      // The library is always visible — no need to programmatically open
      // anything; just dismiss the modal. The "openLayouts" preference is
      // honored on a follow-up by the user clicking the Layouts tab.
      void openLayouts;
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

  // Mount supporting hooks (yardage calc, photo-layout import) at this scope
  useYardageCalculation();
  usePhotoLayoutImport();

  useEffect(() => {
    if (activeWorktable === 'block' && !blockSetupShownRef.current) {
      const canvas = useCanvasStore.getState().fabricCanvas;
      const hasContent = (canvas?.getObjects() ?? []).some(
        (o) => (o as { stroke?: string }).stroke !== GRID_LINE_COLOR
      );
      if (!hasContent) queueMicrotask(() => setShowBlockSetup(true));
      blockSetupShownRef.current = true;
    }
    if (activeWorktable === 'layout' && !layoutSetupShownRef.current) {
      const { layoutType } = useLayoutStore.getState();
      const hasContent = layoutType !== 'none';
      if (!hasContent) queueMicrotask(() => setShowLayoutSetup(true));
      layoutSetupShownRef.current = true;
    }
  }, [activeWorktable]);

  const handleBlockSetupConfirm = useCallback((blockSize: number, cellSize: number) => {
    useProjectStore.getState().setCanvasWidth(blockSize);
    useProjectStore.getState().setCanvasHeight(blockSize);
    useCanvasStore.getState().setGridSettings({ size: cellSize, snapToGrid: true });
    useCanvasStore.getState().fabricCanvas?.renderAll();
    setShowBlockSetup(false);
  }, []);

  const handleLayoutSetupConfirm = useCallback(
    (rows: number, cols: number, blockSize: number, _cellSize: number, presetId?: string) => {
      const store = useLayoutStore.getState();
      store.setRows(rows);
      store.setCols(cols);
      store.setBlockSize(blockSize);

      if (presetId) {
        const preset = LAYOUT_PRESETS.find((p) => p.id === presetId);
        if (preset) {
          store.setLayoutType(preset.config.type as LayoutType);
          store.setSelectedPreset(preset.id);
          store.setSashing(preset.config.sashing);
        }
      } else {
        store.setLayoutType('grid');
      }

      // Update canvas dimensions for the LAYOUT worktable (the editing surface
      // for layout templates themselves). The QUILT worktable does NOT resize.
      useProjectStore.getState().setCanvasWidth(cols * blockSize);
      useProjectStore.getState().setCanvasHeight(rows * blockSize);
      useCanvasStore.getState().setGridSettings({ size: _cellSize, snapToGrid: true });
      useCanvasStore.getState().centerAndFitViewport();

      setShowLayoutSetup(false);
    },
    []
  );

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
        onOpenGridDimensions={dialogs.openGridDimensions}
        onOpenBlockBuilder={dialogs.openDrafting}
        onSave={handleSave}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left side: tools (or print options when in print mode) */}
        {activeWorktable === 'print' ? (
          <PrintOptionsPanel />
        ) : (
          <Toolbar
            onOpenLayoutSettings={dialogs.openLayoutSettings}
            onOpenGridDimensions={dialogs.openGridDimensions}
            onOpenImageExport={dialogs.openImageExport}
            onOpenPhotoToDesign={dialogs.openPhotoToDesign}
            onOpenResize={dialogs.openResize}
            onOpenReferenceImage={dialogs.openReferenceImage}
            onOpenLayoutOverlay={dialogs.openLayoutOverlay}
            onSaveBlock={dialogs.openDrafting}
            onNewBlock={handleNewBlock}
          />
        )}

        {/* Canvas area — splits side-by-side when reference image is shown */}
        <div className="flex-1 flex overflow-hidden relative" data-tour="canvas">
          <div
            className={`flex flex-col overflow-hidden relative ${
              showReferencePanel && referenceImageUrl ? 'w-1/2' : 'flex-1'
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

        {/* Right context panel (libraries + selection-driven inspector). Hidden in print mode. */}
        {activeWorktable !== 'print' && (
          <ContextPanel
            onBlockDragStart={handleBlockDragStart}
            onFabricDragStart={handleFabricDragStart}
            onOpenDrafting={dialogs.openDrafting}
            onOpenPhotoUpload={dialogs.openPhotoBlockUpload}
            onOpenUpload={dialogs.openFabricUpload}
          />
        )}
      </div>

      <BottomBar />

      {/* Duplicate options popup */}
      <DuplicateOptionsPopup />

      {/* First-visit setup modals — quilt, block, and layout worktables */}
      <NewQuiltSetupModal
        isOpen={showQuiltSetup}
        onConfirm={handleQuiltSetupConfirm}
        onDismiss={handleQuiltSetupDismiss}
      />
      <NewBlockSetupModal
        isOpen={showBlockSetup}
        onConfirm={handleBlockSetupConfirm}
        onDismiss={() => setShowBlockSetup(false)}
      />
      <NewLayoutSetupModal
        isOpen={showLayoutSetup}
        onConfirm={handleLayoutSetupConfirm}
        onDismiss={() => setShowLayoutSetup(false)}
      />
    </div>
  );
}
