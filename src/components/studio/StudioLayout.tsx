import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { COLORS } from '@/lib/design-system';
import type { Project } from '@/types/project';

import { StudioTopBar } from '@/components/studio/StudioTopBar';
import { Toolbar } from '@/components/studio/Toolbar';
import { BottomBar } from '@/components/studio/BottomBar';
import { ContextPanel } from '@/components/studio/ContextPanel';
import { ContextMenu } from '@/components/canvas/ContextMenu';
import { QuickInfo } from '@/components/canvas/QuickInfo';
import { CanvasSelectionToolbar } from '@/components/canvas/CanvasSelectionToolbar';
import { LayoutAdjuster } from '@/components/fabrics/LayoutAdjuster';
import { DuplicateOptionsPopup } from '@/components/studio/DuplicateOptionsPopup';
import { NewProjectWizard, type StudioQuiltSetup } from '@/components/projects/NewProjectWizard';
import { ProjectModeModal } from '@/components/studio/ProjectModeModal';
import { StudioDropZone } from '@/components/studio/StudioDropZone';
import { LayoutsPanel } from '@/components/studio/LayoutsPanel';
import { TemplatesPanel } from '@/components/studio/TemplatesPanel';
import { QuiltSizePanel } from '@/components/studio/QuiltSizePanel';
import { PreviewBanner } from '@/components/canvas/PreviewBanner';
import { DrawingHud } from '@/components/studio/DrawingHud';

import { useStudioDialogs } from '@/components/studio/StudioDialogs';
import { BlockBuilderWorktable } from '@/components/studio/BlockBuilderWorktable';

import { useCanvasStore } from '@/stores/canvasStore';
import { useLayoutStore } from '@/stores/layoutStore';
import { useProjectStore } from '@/stores/projectStore';
import { useLeftPanelStore } from '@/stores/leftPanelStore';
import { useFabricDrop } from '@/hooks/useFabricLayout';
import { useBlockDrop } from '@/hooks/useBlockDrop';
import { saveProject } from '@/lib/save-project';
import { useCanvasContext } from '@/contexts/CanvasContext';
import { X } from 'lucide-react';

interface StudioLayoutProps {
  readonly project: Project;
}

function buildLayoutStatePayload(setup: StudioQuiltSetup): Record<string, unknown> {
  return {
    layoutType: setup.layoutType,
    selectedPresetId: setup.presetId,
    rows: setup.rows,
    cols: setup.cols,
    blockSize: setup.blockSize,
    sashing: setup.sashing,
    borders: setup.borders,
    hasCornerstones: setup.hasCornerstones,
    bindingWidth: setup.bindingWidth,
    hasAppliedLayout: true,
  };
}

export function StudioLayout({ project }: StudioLayoutProps) {
  const dialogs = useStudioDialogs();
  const { getCanvas } = useCanvasContext();
  const fabricCanvas = getCanvas();
  const [projectState, setProjectState] = useState(project);
  const searchParams = useSearchParams();

  const activeWorktable = useCanvasStore((s) => s.activeWorktable);
  const showReferencePanel = useCanvasStore((s) => s.showReferencePanel);
  const referenceImageUrl = useCanvasStore((s) => s.referenceImageUrl);
  const activeWorktableId = useProjectStore((s) => s.activeWorktableId);
  const projectMode = useProjectStore((s) => s.mode);

  const panelMode = useLeftPanelStore((s) => s.panelMode);
  const openLayouts = useLeftPanelStore((s) => s.openLayouts);
  const openTemplates = useLeftPanelStore((s) => s.openTemplates);
  const openQuiltSetup = useLeftPanelStore((s) => s.openQuiltSetup);
  const dismiss = useLeftPanelStore((s) => s.dismiss);

  // The full-screen setup modal is now a first-run experience only. Once the
  // user is in the studio, size edits happen via QuiltSizePanel in the left
  // rail. This flag is still used for brand-new projects that land on the
  // studio without a layout applied yet.
  const [showQuiltSetup, setShowQuiltSetup] = useState(false);
  const [quiltSetupDismissible, setQuiltSetupDismissible] = useState(false);
  const [showModeModal, setShowModeModal] = useState(() => {
    const hasCanvasContent =
      project.canvasData && Object.keys(project.canvasData).length > 0;
    if (hasCanvasContent) return false;
    if (typeof window === 'undefined') return true;
    return window.localStorage.getItem(`qc:studio:modeChosen:${project.id}`) !== '1';
  });

  const { handleDragStart: handleBlockDragStart } = useBlockDrop();
  const { handleFabricDragStart } = useFabricDrop();

  useEffect(() => {
    setProjectState(project);
  }, [project]);

  useEffect(() => {
    const from = searchParams.get('from');
    if (projectMode === 'free-form') {
      dismiss();
      return;
    }
    if (from === 'layouts' && projectMode === 'layout') {
      openLayouts();
    } else if (from === 'templates' && projectMode === 'template') {
      openTemplates();
    }
  }, [searchParams, projectMode, openLayouts, openTemplates, dismiss]);

  const handleModeSelect = useCallback(
    (mode: 'template' | 'layout' | 'free-form') => {
      setShowModeModal(false);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(`qc:studio:modeChosen:${project.id}`, '1');
      }
      useProjectStore.getState().setMode(mode);
      if (mode === 'layout') {
        openLayouts();
      } else if (mode === 'template') {
        openTemplates();
      } else {
        dismiss();
      }
    },
    [project.id, openLayouts, openTemplates, dismiss]
  );

  const handleModeModalDismiss = useCallback(() => {
    setShowModeModal(false);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(`qc:studio:modeChosen:${project.id}`, '1');
    }
  }, [project.id]);

  const syncProjectLayoutState = useCallback(
    (setup: StudioQuiltSetup) => {
      const layoutState = buildLayoutStatePayload(setup);
      const canvasData = { __layoutState: layoutState } as Project['canvasData'];

      setProjectState((current) => {
        const nextWorktables =
          current.worktables?.map((worktable, index) => {
            const shouldUpdate =
              worktable.id === activeWorktableId ||
              (!current.worktables?.some((item) => item.id === activeWorktableId) && index === 0);

            return shouldUpdate ? { ...worktable, canvasData } : worktable;
          }) ?? current.worktables;

        return {
          ...current,
          canvasWidth: setup.width,
          canvasHeight: setup.height,
          canvasData,
          worktables: nextWorktables,
        };
      });
    },
    [activeWorktableId]
  );

  const clearProjectLayoutState = useCallback(() => {
    setProjectState((current) => {
      const clearedCanvasData = {} as Project['canvasData'];
      const nextWorktables =
        current.worktables?.map((worktable, index) => {
          const shouldUpdate =
            worktable.id === activeWorktableId ||
            (!current.worktables?.some((item) => item.id === activeWorktableId) && index === 0);

          return shouldUpdate ? { ...worktable, canvasData: clearedCanvasData } : worktable;
        }) ?? current.worktables;

      return {
        ...current,
        canvasData: clearedCanvasData,
        worktables: nextWorktables,
      };
    });
  }, [activeWorktableId]);

  const handleQuiltSetupConfirm = useCallback(
    ({ setup }: { setup: StudioQuiltSetup }) => {
      const layoutStore = useLayoutStore.getState();
      layoutStore.reset();
      layoutStore.setLayoutType(setup.layoutType);
      layoutStore.setSelectedPreset(setup.presetId);
      layoutStore.setRows(setup.rows);
      layoutStore.setCols(setup.cols);
      layoutStore.setBlockSize(setup.blockSize);
      layoutStore.setSashing(setup.sashing);
      layoutStore.setBorders(setup.borders);
      layoutStore.setHasCornerstones(setup.hasCornerstones);
      layoutStore.setBindingWidth(setup.bindingWidth);
      layoutStore.setExpandedCardId(null);
      layoutStore.setPreviewMode(false);
      layoutStore.applyLayout();

      syncProjectLayoutState(setup);
      useProjectStore.getState().setCanvasDimensions(setup.width, setup.height);
      useProjectStore.getState().setHasContent(false);
      useProjectStore.getState().setDirty(true);

      requestAnimationFrame(() => {
        useCanvasStore.getState().centerAndFitViewport(getCanvas(), setup.width, setup.height);
      });

      setShowQuiltSetup(false);
    },
    [project.id, getCanvas, syncProjectLayoutState]
  );

  const handleStartOverLayout = useCallback(() => {
    dialogs.confirmClearLayout(() => {
      const canvas = getCanvas();
      if (canvas) {
        const layoutCanvas = canvas as unknown as {
          clear: () => void;
          backgroundColor: string;
          renderAll: () => void;
        };
        layoutCanvas.clear();
        layoutCanvas.backgroundColor = COLORS.surface;
        layoutCanvas.renderAll();
      }

      useCanvasStore.getState().resetHistory();
      useProjectStore.getState().setHasContent(false);
      useProjectStore.getState().setDirty(true);
      useLayoutStore.getState().reset();
      clearProjectLayoutState();
      setShowQuiltSetup(true);
    });
  }, [clearProjectLayoutState, dialogs, getCanvas]);

  const handleSave = useCallback(() => {
    const { projectId } = useProjectStore.getState();
    if (projectId) {
      saveProject({ projectId, fabricCanvas });
    }
  }, [fabricCanvas]);

  const handleNewBlock = useCallback(() => {
    const canvas = getCanvas();
    if (canvas) {
      const layoutCanvas = canvas as unknown as {
        clear: () => void;
        backgroundColor: string;
        renderAll: () => void;
      };
      layoutCanvas.clear();
      layoutCanvas.backgroundColor = COLORS.surface;
      layoutCanvas.renderAll();
    }
    useCanvasStore.getState().resetHistory();
  }, [getCanvas]);

  return (
    <div className="h-full flex flex-col bg-[var(--color-bg)] select-none">
      <StudioTopBar
        onOpenImageExport={dialogs.openImageExport}
        onOpenPdfExport={dialogs.openPdfExport}
        onOpenHelp={dialogs.openHelp}
        onOpenHistory={dialogs.openHistory}
        onSave={handleSave}
        onEditQuiltSetup={openQuiltSetup}
      />

      <div className="flex-1 flex overflow-hidden">
        {activeWorktable === 'block-builder' ? (
          <BlockBuilderWorktable />
        ) : (
          <>
            {panelMode === 'layouts' && projectMode === 'layout' && (
              <LayoutsPanel onDismiss={dismiss} />
            )}
            {panelMode === 'templates' && projectMode === 'template' && (
              <TemplatesPanel onDismiss={dismiss} />
            )}
            {panelMode === 'quilt-setup' && <QuiltSizePanel onDismiss={dismiss} />}

            {activeWorktable === 'quilt' &&
              projectMode === 'free-form' &&
              panelMode !== 'quilt-setup' && (
                <Toolbar
                  onOpenImageExport={dialogs.openImageExport}
                  onSaveBlock={() => useCanvasStore.getState().setActiveWorktable('block-builder')}
                  onNewBlock={handleNewBlock}
                />
              )}

            <div className="flex-1 flex flex-col overflow-hidden relative">
              <PreviewBanner />
              <div className="flex-1 flex overflow-hidden relative">
                <div
                  className={`flex flex-col overflow-hidden relative ${
                    showReferencePanel && referenceImageUrl ? 'w-1/2' : 'flex-1'
                  }`}
                >
                  <StudioDropZone project={projectState} />
                  <ContextMenu />
                  <QuickInfo />
                  <CanvasSelectionToolbar />
                  <LayoutAdjuster />
                </div>

                {showReferencePanel && referenceImageUrl && (
                  <div className="w-1/2 border-l border-[var(--color-border)]/20 bg-[var(--color-bg)]/30 flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--color-border)]/15">
                      <span className="text-[14px] leading-[20px] font-semibold text-[var(--color-text)]/60">
                        Reference Photo
                      </span>
                      <button
                        type="button"
                        onClick={() => useCanvasStore.getState().setShowReferencePanel(false)}
                        className="w-6 h-6 flex items-center justify-center rounded-lg text-[var(--color-text)]/40 hover:text-[var(--color-text)] hover:bg-[var(--color-border)] transition-colors"
                        aria-label="Close reference panel"
                      >
                        <X size={14} strokeWidth={1.75} />
                      </button>
                    </div>
                    <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
                      <img
                        src={referenceImageUrl}
                        alt="Original reference photo"
                        className="max-w-full max-h-full object-contain rounded-lg shadow-[0_1px_2px_rgba(26,26,26,0.08)]"
                        draggable={false}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <ContextPanel
              onBlockDragStart={handleBlockDragStart}
              onFabricDragStart={handleFabricDragStart}
              onOpenDrafting={() => useCanvasStore.getState().setActiveWorktable('block-builder')}
              onOpenUpload={dialogs.openFabricUpload}
            />
          </>
        )}
      </div>

      <BottomBar />
      <DuplicateOptionsPopup />
      <DrawingHud />

      <ProjectModeModal
        open={showModeModal}
        onSelect={handleModeSelect}
        onDismiss={handleModeModalDismiss}
      />

      <NewProjectWizard
        mode="studio"
        open={showQuiltSetup}
        projectId={project.id}
        onConfirm={handleQuiltSetupConfirm}
        onClose={() => {
          setShowQuiltSetup(false);
          setQuiltSetupDismissible(false);
        }}
        onDismiss={() => {
          setShowQuiltSetup(false);
          setQuiltSetupDismissible(false);
        }}
        allowDismiss={quiltSetupDismissible}
      />
    </div>
  );
}
