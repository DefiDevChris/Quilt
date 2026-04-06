'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import type { Project } from '@/types/project';
import { CanvasWorkspace } from '@/components/canvas/CanvasWorkspace';

import { ContextMenu } from '@/components/canvas/ContextMenu';
import { QuickInfo } from '@/components/canvas/QuickInfo';
import { StudioTopBar } from '@/components/studio/StudioTopBar';
import { Toolbar } from '@/components/studio/Toolbar';
import { BottomBar } from '@/components/studio/BottomBar';
import { ContextPanel } from '@/components/studio/ContextPanel';
import { FloatingToolbar } from '@/components/studio/FloatingToolbar';
import { BlockDraftingModal } from '@/components/blocks/BlockDraftingModal';
import { SimplePhotoBlockUpload } from '@/components/blocks/SimplePhotoBlockUpload';
import { FabricUploadDialog } from '@/components/fabrics/FabricUploadDialog';
import { LayoutAdjuster } from '@/components/fabrics/LayoutAdjuster';
import { useTempProjectMigration } from '@/hooks/useTempProjectMigration';
import { cleanupExpiredProjects } from '@/lib/temp-project-storage';
import { startStripeCheckout } from '@/lib/stripe-checkout';
import { PRO_PRICE_MONTHLY, GRID_LINE_COLOR } from '@/lib/constants';
import { LayoutSettingsPanel } from '@/components/studio/LayoutSettingsPanel';
import { LayoutOverlayPanel } from '@/components/studio/LayoutOverlayPanel';

import { YardagePanel } from '@/components/measurement/YardagePanel';
import { PrintlistPanel } from '@/components/export/PrintlistPanel';
import { PdfExportDialog } from '@/components/export/PdfExportDialog';
import { ImageExportDialog } from '@/components/export/ImageExportDialog';
import { PhotoToDesignPromo } from '@/components/photo-layout/PhotoToLayoutPromo';
import { useFabricDrop } from '@/hooks/useFabricLayout';
import { usePhotoLayoutImport } from '@/hooks/usePhotoLayoutImport';
import { useBlockDrop } from '@/hooks/useBlockDrop';
import { useYardageCalculation } from '@/hooks/useYardageCalculation';
import { saveProject } from '@/lib/save-project';

import { HelpPanel } from '@/components/studio/HelpPanel';
import { PieceInspectorPanel } from '@/components/studio/PieceInspectorPanel';
import { CanvasErrorBoundary } from '@/components/studio/CanvasErrorBoundary';
import { QuiltDimensionsPanel } from '@/components/studio/QuiltDimensionsPanel';
import { ResizeDialog } from '@/components/studio/ResizeDialog';
import { DuplicateOptionsPopup } from '@/components/studio/DuplicateOptionsPopup';

import { ReferenceImageDialog } from '@/components/studio/ReferenceImageDialog';
import { HistoryPanel } from '@/components/studio/HistoryPanel';

import { BlockPlacementPanel } from '@/components/studio/panels/BlockPlacementPanel';
import { BorderPanel } from '@/components/studio/panels/BorderPanel';
import { HedgingPanel } from '@/components/studio/panels/HedgingPanel';
import { SashingPanel } from '@/components/studio/panels/SashingPanel';

import { useAuthStore } from '@/stores/authStore';
import { useBlockStore } from '@/stores/blockStore';
import { useFabricStore } from '@/stores/fabricStore';
import { useCanvasStore } from '@/stores/canvasStore';
import { useProjectStore } from '@/stores/projectStore';
import { useLayoutStore } from '@/stores/layoutStore';
import { usePieceInspectorStore } from '@/stores/pieceInspectorStore';
import { usePrintlistStore } from '@/stores/printlistStore';
import { useYardageStore } from '@/stores/yardageStore';
import { NewBlockSetupModal } from '@/components/studio/NewBlockSetupModal';
import { NewLayoutSetupModal } from '@/components/studio/NewLayoutSetupModal';

function PrintOptionsPanel({
  onOpenPdfExport,
  onOpenImageExport,
}: {
  onOpenPdfExport: () => void;
  onOpenImageExport: () => void;
}) {
  const showSeamAllowance = useCanvasStore((s) => s.showSeamAllowance);
  const toggleSeamAllowance = useCanvasStore((s) => s.toggleSeamAllowance);
  const printScale = useCanvasStore((s) => s.printScale);
  const setPrintScale = useCanvasStore((s) => s.setPrintScale);

  const printOptions = [
    {
      label: 'Printlist',
      description: 'Block overview, patch count & cutting diagram',
      onClick: () => usePrintlistStore.getState().togglePanel(),
    },
    {
      label: 'Piece Templates',
      description: 'Select pieces to inspect & generate 1:1 PDF templates',
      onClick: () => {
        usePieceInspectorStore.getState().setOpen(true);
      },
    },
    {
      label: 'Yardage Summary',
      description: 'Fabric requirements & yardage calculations',
      onClick: () => useYardageStore.getState().togglePanel(),
    },
    {
      label: 'Export PDF',
      description: 'Full printable PDF package',
      onClick: onOpenPdfExport,
    },
    {
      label: 'Export Image',
      description: 'Save as PNG or JPEG',
      onClick: onOpenImageExport,
    },
  ];

  return (
    <div className="w-[220px] bg-surface flex-shrink-0 overflow-y-auto border-r border-outline-variant/15">
      <div className="p-4">
        <h3 className="text-label-sm uppercase text-on-surface/70 tracking-[0.02em] font-medium mb-4">
          Print Options
        </h3>

        {/* Print Preview Settings */}
        <div className="mb-4 p-3 bg-surface-container rounded-md space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-body-sm text-on-surface">Seam Allowance</span>
            <button
              type="button"
              role="switch"
              aria-checked={showSeamAllowance}
              onClick={toggleSeamAllowance}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors ${
                showSeamAllowance ? 'bg-primary' : 'bg-outline-variant'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 mt-0.5 rounded-full bg-white shadow-elevation-1 transition-transform ${
                  showSeamAllowance ? 'translate-x-4' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          <div>
            <label className="text-body-sm text-on-surface block mb-1">
              Print Scale: {printScale.toFixed(1)}x
            </label>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={printScale}
              onChange={(e) => setPrintScale(parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-secondary mt-0.5">
              <span>50%</span>
              <span>1:1</span>
              <span>200%</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {printOptions.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={item.onClick}
              className="flex items-center justify-between py-2.5 px-3 text-body-md text-on-surface bg-surface-container rounded-md hover:bg-surface-container-high transition-colors"
            >
              <div className="text-left">
                <span className="block">{item.label}</span>
                <span className="text-body-sm text-secondary">{item.description}</span>
              </div>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className="flex-shrink-0 ml-2"
              >
                <path
                  d="M6 4L10 8L6 12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

interface StudioClientProps {
  projectId: string;
}

export function StudioClient({ projectId }: StudioClientProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isDraftingOpen, setIsDraftingOpen] = useState(false);
  const [isPhotoBlockUploadOpen, setIsPhotoBlockUploadOpen] = useState(false);
  const [isFabricUploadOpen, setIsFabricUploadOpen] = useState(false);
  const [isLayoutSettingsOpen, setIsLayoutSettingsOpen] = useState(false);
  const [isLayoutOverlayOpen, setIsLayoutOverlayOpen] = useState(false);

  const [isPdfExportOpen, setIsPdfExportOpen] = useState(false);
  const [isImageExportOpen, setIsImageExportOpen] = useState(false);
  const [isPhotoPromoOpen, setIsPhotoPromoOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isGridDimensionsOpen, setIsGridDimensionsOpen] = useState(false);
  const [isResizeOpen, setIsResizeOpen] = useState(false);
  const [isReferenceImageOpen, setIsReferenceImageOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [proUpgradeFeature, setProUpgradeFeature] = useState<string | null>(null);
  const isPro = useAuthStore((s) => s.isPro);
  const { handleDragStart, handleDragOver, handleDrop } = useBlockDrop();
  const { handleFabricDragStart, handleFabricDragOver, handleFabricDrop } = useFabricDrop();
  const [isUpgrading, setIsUpgrading] = useState(false);

  // Cleanup expired temp projects on mount
  useEffect(() => {
    cleanupExpiredProjects();
  }, []);

  // Migrate temp project to server when user upgrades to Pro
  useTempProjectMigration();

  async function handleUpgrade() {
    setIsUpgrading(true);
    await startStripeCheckout();
    setIsUpgrading(false);
  }

  const [showBlockSetup, setShowBlockSetup] = useState(false);
  const [showLayoutSetup, setShowLayoutSetup] = useState(false);
  const blockSetupShownRef = useRef(false);
  const layoutSetupShownRef = useRef(false);

  const activeWorktable = useCanvasStore((s) => s.activeWorktable);
  const fabricCanvas = useCanvasStore((s) => s.fabricCanvas);
  const isInspectorOpen = usePieceInspectorStore((s) => s.isOpen);
  const showReferencePanel = useCanvasStore((s) => s.showReferencePanel);
  const referenceImageUrl = useCanvasStore((s) => s.referenceImageUrl);

  useEffect(() => {
    if (activeWorktable === 'block' && !blockSetupShownRef.current) {
      const canvas = useCanvasStore.getState().fabricCanvas;
      const hasContent = (canvas?.getObjects() ?? []).some(
        (o) => (o as { stroke?: string }).stroke !== GRID_LINE_COLOR
      );
      if (!hasContent) setShowBlockSetup(true);
      blockSetupShownRef.current = true;
    }
    if (activeWorktable === 'layout' && !layoutSetupShownRef.current) {
      const { layoutType } = useLayoutStore.getState();
      const hasContent = layoutType !== 'none';
      if (!hasContent) setShowLayoutSetup(true);
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
    (rows: number, cols: number, blockSize: number, _cellSize: number) => {
      useLayoutStore.getState().setRows(rows);
      useLayoutStore.getState().setCols(cols);
      useLayoutStore.getState().setBlockSize(blockSize);
      setShowLayoutSetup(false);
    },
    []
  );

  useYardageCalculation();
  usePhotoLayoutImport();

  const handleSave = useCallback(() => {
    const { projectId } = useProjectStore.getState();
    if (projectId) {
      saveProject({ projectId, fabricCanvas });
    }
  }, [fabricCanvas]);

  const handleBlockSaved = useCallback(() => {
    useBlockStore.getState().fetchUserBlocks();
  }, []);

  const handleFabricUploaded = useCallback(() => {
    useFabricStore.getState().fetchUserFabrics();
  }, []);

  const combinedDragOver = useCallback(
    (e: React.DragEvent) => {
      handleDragOver(e);
      handleFabricDragOver(e);
    },
    [handleDragOver, handleFabricDragOver]
  );

  const combinedDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const layoutPresetId = e.dataTransfer.getData('application/quiltcorgi-layout-preset');
      const fabricId = e.dataTransfer.getData('application/quiltcorgi-fabric-id');

      if (layoutPresetId) {
        // Layout drop
        import('@/stores/layoutStore').then(({ useLayoutStore }) => {
          import('@/lib/layout-library').then(({ LAYOUT_PRESETS }) => {
            const preset = LAYOUT_PRESETS.find((p) => p.id === layoutPresetId);
            if (preset) {
              const store = useLayoutStore.getState();
              store.setLayoutType(preset.config.type as any);
              store.setSelectedPreset(preset.id);
              store.setRows(preset.config.rows);
              store.setCols(preset.config.cols);
              store.setBlockSize(preset.config.blockSize);
              store.setSashing(preset.config.sashing);
            }
          });
        });
      } else if (fabricId) {
        handleFabricDrop(e);
      } else {
        handleDrop(e);
      }
    },
    [handleDrop, handleFabricDrop]
  );

  useEffect(() => {
    let cancelled = false;

    async function fetchProject() {
      try {
        const res = await fetch(`/api/projects/${projectId}`);
        const data = await res.json();
        if (cancelled) return;

        if (!res.ok) {
          setError(data.error ?? 'Failed to load project');
          return;
        }

        const projectData = data.data;

        // For free users, check if there's a newer temp version in localStorage
        if (!isPro) {
          const { loadTempProject } = await import('@/lib/temp-project-storage');
          const tempData = loadTempProject(projectId);
          if (tempData && tempData.savedAt > new Date(projectData.lastSavedAt).getTime()) {
            // Use temp data if it's newer
            projectData.canvasData = tempData.canvasData;
            projectData.unitSystem = tempData.unitSystem;
            projectData.gridSettings = tempData.gridSettings;
            projectData.fabricPresets = tempData.fabricPresets;
            projectData.canvasWidth = tempData.canvasWidth;
            projectData.canvasHeight = tempData.canvasHeight;
          }
        }

        setProject(projectData);
      } catch {
        if (!cancelled) setError('Failed to load project');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchProject();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-surface">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-secondary">Loading your design...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="h-screen flex items-center justify-center bg-surface">
        <div className="text-center">
          <p className="text-sm text-error mb-4">{error || 'Failed to load project.'}</p>
          <Link
            href="/dashboard"
            className="rounded-md bg-gradient-to-r from-orange-500 to-rose-400 px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-surface select-none">
      <StudioTopBar
        onOpenImageExport={() => setIsImageExportOpen(true)}
        onOpenPdfExport={() => setIsPdfExportOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenGridDimensions={() => setIsGridDimensionsOpen(true)}
        onSave={handleSave}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left side: mode-dependent panels */}
        {activeWorktable === 'print' ? (
          <PrintOptionsPanel
            onOpenPdfExport={() => setIsPdfExportOpen(true)}
            onOpenImageExport={() => setIsImageExportOpen(true)}
          />
        ) : (
          <Toolbar
            onOpenLayoutSettings={() => setIsLayoutSettingsOpen(true)}
            onOpenGridDimensions={() => setIsGridDimensionsOpen(true)}
            onOpenImageExport={() =>
              isPro ? setIsImageExportOpen(true) : setProUpgradeFeature('Image Export')
            }
            onOpenPhotoToDesign={() => setIsPhotoPromoOpen(true)}
            onOpenResize={() => setIsResizeOpen(true)}
            onOpenReferenceImage={() => setIsReferenceImageOpen(true)}
            onOpenLayoutOverlay={() => setIsLayoutOverlayOpen(true)}
            onSaveBlock={() => setIsDraftingOpen(true)}
            onNewBlock={() => {
              const canvas = useCanvasStore.getState().fabricCanvas;
              if (canvas) {
                canvas.clear();
                canvas.backgroundColor = '#FFFFFF';
                canvas.renderAll();
              }
              useCanvasStore.getState().resetHistory();
            }}
          />
        )}

        {/* Block & Fabric Libraries moved to ContextPanel */}

        {/* Pattern builder panels — visible on quilt worktable */}
        {activeWorktable === 'quilt' && (
          <>
            <BlockPlacementPanel />
            <BorderPanel />
            <HedgingPanel />
            <SashingPanel />
          </>
        )}

        {/* Canvas area — splits side-by-side when reference image is shown */}
        <div className="flex-1 flex overflow-hidden relative" data-tour="canvas">
          {/* Left: Worktable canvas */}
          <div
            className={`flex flex-col overflow-hidden relative ${showReferencePanel && referenceImageUrl ? 'w-1/2' : 'flex-1'}`}
          >
            <CanvasErrorBoundary>
              <div
                className="flex-1 flex overflow-hidden relative"
                onDragOver={combinedDragOver}
                onDrop={combinedDrop}
              >
                <CanvasWorkspace project={project} />
                <FloatingToolbar />
              </div>
            </CanvasErrorBoundary>

            <ContextMenu />
            <QuickInfo />
            <LayoutAdjuster />

            <QuiltDimensionsPanel
              isOpen={isGridDimensionsOpen}
              onClose={() => setIsGridDimensionsOpen(false)}
            />
          </div>

          {/* Right: Reference photo panel */}
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
            onGeneratePdf={() => setIsPdfExportOpen(true)}
            onExportImage={() => setIsImageExportOpen(true)}
          />
        )}

        {/* Right context panel (hidden for PRINT only) */}
        {activeWorktable !== 'print' && (
          <div className="relative h-full">
            <ContextPanel
              onBlockDragStart={handleDragStart}
              onFabricDragStart={handleFabricDragStart}
              onOpenDrafting={() => setIsDraftingOpen(true)}
              onOpenPhotoUpload={() =>
                isPro ? setIsPhotoBlockUploadOpen(true) : setProUpgradeFeature('Photo Block Upload')
              }
              onOpenUpload={() =>
                isPro ? setIsFabricUploadOpen(true) : setProUpgradeFeature('Fabric Upload')
              }
            />
            {isInspectorOpen && <PieceInspectorPanel />}
          </div>
        )}
      </div>

      <BottomBar />

      {/* Block drafting — pro only */}
      {isPro && (
        <CanvasErrorBoundary>
          <BlockDraftingModal
            isOpen={isDraftingOpen}
            onClose={() => setIsDraftingOpen(false)}
            onSaved={handleBlockSaved}
          />
        </CanvasErrorBoundary>
      )}

      {/* Photo block upload — pro only */}
      {isPro && isPhotoBlockUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-[560px] rounded-xl bg-surface p-5 shadow-elevation-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-on-surface">Upload Block Photo</h2>
              <button
                type="button"
                onClick={() => setIsPhotoBlockUploadOpen(false)}
                className="text-secondary hover:text-on-surface"
              >
                {'\u2715'}
              </button>
            </div>
            <SimplePhotoBlockUpload
              isOpen={isPhotoBlockUploadOpen}
              onClose={() => setIsPhotoBlockUploadOpen(false)}
              onSaved={handleBlockSaved}
            />
          </div>
        </div>
      )}

      {/* Pro-only dialogs — only rendered for pro users */}
      {isPro && (
        <>
          <FabricUploadDialog
            isOpen={isFabricUploadOpen}
            onClose={() => setIsFabricUploadOpen(false)}
            onUploaded={handleFabricUploaded}
          />
          {isLayoutSettingsOpen && (
            <LayoutSettingsPanel onClose={() => setIsLayoutSettingsOpen(false)} />
          )}
          {isLayoutOverlayOpen && (
            <LayoutOverlayPanel onClose={() => setIsLayoutOverlayOpen(false)} />
          )}

          <PdfExportDialog isOpen={isPdfExportOpen} onClose={() => setIsPdfExportOpen(false)} />
          <ImageExportDialog
            isOpen={isImageExportOpen}
            onClose={() => setIsImageExportOpen(false)}
          />
          {isPhotoPromoOpen && (
            <PhotoToDesignPromo isPro={isPro} onClose={() => setIsPhotoPromoOpen(false)} />
          )}
        </>
      )}

      {/* Pro upgrade dialog — shown when free users try pro features */}
      {proUpgradeFeature && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40">
          <div className="w-full max-w-sm rounded-xl bg-surface shadow-elevation-3 p-6 text-center">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              className="text-secondary mx-auto mb-3"
              aria-hidden="true"
            >
              <rect
                x="5"
                y="11"
                width="14"
                height="10"
                rx="2"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M8 11V7a4 4 0 0 1 8 0v4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <p className="text-lg font-semibold text-on-surface mb-1">{proUpgradeFeature}</p>
            <p className="text-sm text-secondary mb-4">
              This feature requires a Pro subscription. Start at ${PRO_PRICE_MONTHLY}/month.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={() => setProUpgradeFeature(null)}
                className="rounded-md px-4 py-2 text-sm font-medium text-secondary hover:bg-surface-container transition-colors"
              >
                Maybe Later
              </button>
              <button
                type="button"
                onClick={handleUpgrade}
                disabled={isUpgrading}
                className="rounded-md bg-gradient-to-r from-orange-500 to-rose-400 px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isUpgrading ? 'Loading...' : 'Upgrade to Pro'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resize quilt dialog */}
      <ResizeDialog isOpen={isResizeOpen} onClose={() => setIsResizeOpen(false)} />

      {/* Reference image dialog */}
      <ReferenceImageDialog
        isOpen={isReferenceImageOpen}
        onClose={() => setIsReferenceImageOpen(false)}
      />

      {/* Help panel (opened from top bar) */}
      <HelpPanel isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      {/* History panel (opened from top bar) */}
      <HistoryPanel isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />

      {/* Duplicate options popup */}
      <DuplicateOptionsPopup />

      {/* New block setup modal — shown on first visit to block worktable with no content */}
      <NewBlockSetupModal
        isOpen={showBlockSetup}
        onConfirm={handleBlockSetupConfirm}
        onDismiss={() => setShowBlockSetup(false)}
      />

      {/* New layout setup modal — shown on first visit to layout worktable with no content */}
      <NewLayoutSetupModal
        isOpen={showLayoutSetup}
        onConfirm={handleLayoutSetupConfirm}
        onDismiss={() => setShowLayoutSetup(false)}
      />
    </div>
  );
}
