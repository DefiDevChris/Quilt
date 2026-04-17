import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { COLORS } from '@/lib/design-system';
import type { Project } from '@/types/project';

import { StudioTopBar } from '@/components/studio/StudioTopBar';
import { Toolbar } from '@/components/studio/Toolbar';
import { BottomBar } from '@/components/studio/BottomBar';
import { ContextPanel } from '@/components/studio/ContextPanel';
import { ContextMenu } from '@/components/canvas/ContextMenu';
import { QuickInfo } from '@/components/canvas/QuickInfo';
import { LayoutAdjuster } from '@/components/fabrics/LayoutAdjuster';
import { DuplicateOptionsPopup } from '@/components/studio/DuplicateOptionsPopup';
import { NewProjectWizard, type StudioQuiltSetup } from '@/components/projects/NewProjectWizard';
import { StudioDropZone } from '@/components/studio/StudioDropZone';

import { useStudioDialogs } from '@/components/studio/StudioDialogs';
import { BlockBuilderWorktable } from '@/components/studio/BlockBuilderWorktable';

import { useCanvasStore } from '@/stores/canvasStore';
import { useLayoutStore } from '@/stores/layoutStore';
import { useProjectStore } from '@/stores/projectStore';
import { useFabricDrop } from '@/hooks/useFabricLayout';
import { useBlockDrop } from '@/hooks/useBlockDrop';
import { saveProject } from '@/lib/save-project';
import { useCanvasContext } from '@/contexts/CanvasContext';

interface StudioLayoutProps {
  readonly project: Project;
}

function getSavedLayoutState(project: Project, activeWorktableId: string): Record<string, unknown> | null {
  const activeWorktable =
    project.worktables?.find((worktable) => worktable.id === activeWorktableId) ??
    project.worktables?.[0];
  const canvasData = activeWorktable?.canvasData ?? project.canvasData;
  const layoutData = (canvasData as Record<string, unknown> | undefined)?.__layoutState as
    | Record<string, unknown>
    | undefined;

  if (!layoutData?.layoutType || layoutData.layoutType === 'none') {
    return null;
  }

  return layoutData;
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

  const activeWorktable = useCanvasStore((s) => s.activeWorktable);
  const showReferencePanel = useCanvasStore((s) => s.showReferencePanel);
  const referenceImageUrl = useCanvasStore((s) => s.referenceImageUrl);
  const activeWorktableId = useProjectStore((s) => s.activeWorktableId);
  const hasAppliedLayout = useLayoutStore((s) => s.hasAppliedLayout);

  const [showQuiltSetup, setShowQuiltSetup] = useState(false);
  const [quiltSetupDismissible, setQuiltSetupDismissible] = useState(false);
  const quiltSetupShownRef = useRef(false);

  const { handleDragStart: handleBlockDragStart } = useBlockDrop();
  const { handleFabricDragStart } = useFabricDrop();

  useEffect(() => {
    setProjectState(project);
  }, [project]);

  const savedLayoutState = useMemo(
    () => getSavedLayoutState(projectState, activeWorktableId),
    [projectState, activeWorktableId]
  );

  useEffect(() => {
    if (activeWorktable !== 'quilt' || quiltSetupShownRef.current) return;

    const key = `qc-quilt-setup-shown-${project.id}`;
    if (typeof window !== 'undefined' && window.sessionStorage.getItem(key) === '1') {
      quiltSetupShownRef.current = true;
      return;
    }

    if (hasAppliedLayout || savedLayoutState) {
      quiltSetupShownRef.current = true;
      return;
    }

    const hasContent = useProjectStore.getState().hasContent;
    if (!hasContent) {
      queueMicrotask(() => setShowQuiltSetup(true));
    }
    quiltSetupShownRef.current = true;
  }, [activeWorktable, project.id, hasAppliedLayout, savedLayoutState]);

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

      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(`qc-quilt-setup-shown-${project.id}`, '1');
      }

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

  const shouldGateCanvas = activeWorktable === 'quilt' && showQuiltSetup;

  return (
    <div className="h-screen flex flex-col bg-[var(--color-bg)] select-none">
      <StudioTopBar
        onOpenImageExport={dialogs.openImageExport}
        onOpenPdfExport={dialogs.openPdfExport}
        onOpenHelp={dialogs.openHelp}
        onOpenHistory={dialogs.openHistory}
        onSave={handleSave}
        onEditQuiltSetup={() => {
          setQuiltSetupDismissible(true);
          setShowQuiltSetup(true);
        }}
      />

      <div className="flex-1 flex overflow-hidden">
        {activeWorktable === 'block-builder' ? (
          <BlockBuilderWorktable />
        ) : shouldGateCanvas ? (
          <div className="flex-1 flex items-center justify-center bg-[var(--color-bg)]/80">
            <div className="rounded-lg border border-[var(--color-border)]/20 bg-[var(--color-surface)] px-6 py-5 text-center shadow-[0_1px_2px_rgba(26,26,26,0.08)]">
              <h2
                className="text-[22px] leading-[30px] font-semibold text-[var(--color-text)]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Set up your quilt first
              </h2>
              <p className="mt-2 max-w-[420px] text-[14px] leading-[22px] text-[var(--color-text-dim)]">
                Choose the layout and quilt size before opening the canvas so your blocks and fabrics stay in place.
              </p>
            </div>
          </div>
        ) : (
          <>
            <Toolbar
              onOpenImageExport={dialogs.openImageExport}
              onSaveBlock={() => useCanvasStore.getState().setActiveWorktable('block-builder')}
              onNewBlock={handleNewBlock}
            />

            <div className="flex-1 flex flex-col overflow-hidden relative">
              <div className="flex-1 flex overflow-hidden relative">
                <div
                  className={`flex flex-col overflow-hidden relative ${
                    showReferencePanel && referenceImageUrl ? 'w-1/2' : 'flex-1'
                  }`}
                >
                  <StudioDropZone project={projectState} />
                  <ContextMenu />
                  <QuickInfo />
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
              onOpenPhotoUpload={dialogs.openPhotoBlockUpload}
              onOpenUpload={dialogs.openFabricUpload}
              onStartOverLayout={handleStartOverLayout}
            />
          </>
        )}
      </div>

      <BottomBar />
      <DuplicateOptionsPopup />

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
