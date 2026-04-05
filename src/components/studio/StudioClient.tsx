'use client';

import { useEffect, useState, useCallback } from 'react';
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
import { BlockLibrary } from '@/components/blocks/BlockLibrary';
import { BlockDraftingModal } from '@/components/blocks/BlockDraftingModal';
import { FabricLibrary } from '@/components/fabrics/FabricLibrary';
import { FabricUploadDialog } from '@/components/fabrics/FabricUploadDialog';
import { PatternAdjuster } from '@/components/fabrics/PatternAdjuster';
import { useTempProjectMigration } from '@/hooks/useTempProjectMigration';
import { cleanupExpiredProjects } from '@/lib/temp-project-storage';
import { PRO_PRICE_MONTHLY } from '@/lib/constants';
import { LayoutSettingsPanel } from '@/components/studio/LayoutSettingsPanel';

import { YardagePanel } from '@/components/measurement/YardagePanel';
import { PrintlistPanel } from '@/components/export/PrintlistPanel';
import { ExportOptionsDialog } from '@/components/export/ExportOptionsDialog';
import { PdfExportDialog } from '@/components/export/PdfExportDialog';
import { ImageExportDialog } from '@/components/export/ImageExportDialog';
import { useBlockDrop } from '@/hooks/useBlockDrop';
import { useFabricDrop } from '@/hooks/useFabricPattern';
import { useYardageCalculation } from '@/hooks/useYardageCalculation';
import { usePhotoPatternImport } from '@/hooks/usePhotoPatternImport';
import { saveProject } from '@/lib/save-project';

import { HelpPanel } from '@/components/studio/HelpPanel';
import { KeyboardShortcutsModal } from '@/components/studio/KeyboardShortcutsModal';
import { TourOverlay } from '@/components/onboarding/TourOverlay';
import { useOnboardingTour } from '@/hooks/useOnboardingTour';
import { PieceInspectorPanel } from '@/components/studio/PieceInspectorPanel';
import { CanvasErrorBoundary } from '@/components/studio/CanvasErrorBoundary';
import { QuiltDimensionsPanel } from '@/components/studio/QuiltDimensionsPanel';
import { ResizeDialog } from '@/components/studio/ResizeDialog';
import { DuplicateOptionsPopup } from '@/components/studio/DuplicateOptionsPopup';

import { HistoryPanel } from '@/components/studio/HistoryPanel';

import { useAuthStore } from '@/stores/authStore';
import { useBlockStore } from '@/stores/blockStore';
import { useFabricStore } from '@/stores/fabricStore';
import { useCanvasStore } from '@/stores/canvasStore';
import { useProjectStore } from '@/stores/projectStore';
import { usePhotoPatternStore } from '@/stores/photoPatternStore';
import { usePieceInspectorStore } from '@/stores/pieceInspectorStore';
import { usePrintlistStore } from '@/stores/printlistStore';
import { useYardageStore } from '@/stores/yardageStore';
import { useToast } from '@/components/ui/ToastProvider';

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
                className={`inline-block h-4 w-4 mt-0.5 rounded-full bg-white shadow transition-transform ${
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
            <div className="flex justify-between text-caption text-secondary mt-0.5">
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
  const [isFabricUploadOpen, setIsFabricUploadOpen] = useState(false);
  const [isLayoutSettingsOpen, setIsLayoutSettingsOpen] = useState(false);

  const [isPdfExportOpen, setIsPdfExportOpen] = useState(false);
  const [isImageExportOpen, setIsImageExportOpen] = useState(false);
  const [isExportOptionsOpen, setIsExportOptionsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isGridDimensionsOpen, setIsGridDimensionsOpen] = useState(false);
  const [isResizeOpen, setIsResizeOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [proUpgradeFeature, setProUpgradeFeature] = useState<string | null>(null);
  const isPro = useAuthStore((s) => s.isPro);
  const { handleDragStart, handleDragOver, handleDrop } = useBlockDrop();
  const { handleFabricDragStart, handleFabricDragOver, handleFabricDrop } = useFabricDrop();
  const { toast } = useToast();
  const [isUpgrading, setIsUpgrading] = useState(false);

  // Cleanup expired temp projects on mount
  useEffect(() => {
    cleanupExpiredProjects();
  }, []);

  // ? key opens keyboard shortcuts modal
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        e.key === '?' &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)
      ) {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Migrate temp project to server when user upgrades to Pro
  useTempProjectMigration();

  async function handleUpgrade() {
    setIsUpgrading(true);
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.data.checkoutUrl) {
        window.location.href = data.data.checkoutUrl;
      } else {
        toast({
          type: 'error',
          title: 'Checkout failed',
          description: data.error ?? 'Unable to start checkout. Please try again.',
        });
      }
    } catch {
      toast({
        type: 'error',
        title: 'Connection error',
        description: 'Unable to connect. Please check your connection and try again.',
      });
    } finally {
      setIsUpgrading(false);
    }
  }

  const activeWorktable = useCanvasStore((s) => s.activeWorktable);
  const fabricCanvas = useCanvasStore((s) => s.fabricCanvas);
  const isInspectorOpen = usePieceInspectorStore((s) => s.isOpen);

  useYardageCalculation();
  usePhotoPatternImport();

  const { shouldShowTour, tourActive, startTour, completeTour, dismissTour } = useOnboardingTour();

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
      if (e.dataTransfer.getData('application/quiltcorgi-fabric-id')) {
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
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
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
        {/* Left side: PRINT shows options panel, others show tool rail */}
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
            onOpenPhotoToPattern={() =>
              isPro
                ? usePhotoPatternStore.getState().openModal()
                : setProUpgradeFeature('Photo to Pattern')
            }
            onOpenResize={() => setIsResizeOpen(true)}
          />
        )}

        <BlockLibrary
          onBlockDragStart={handleDragStart}
          onOpenDrafting={() => setIsDraftingOpen(true)}
        />

        {/* Fabric Library — visible to all, upload gated to pro */}
        <FabricLibrary
          onFabricDragStart={handleFabricDragStart}
          onOpenUpload={() =>
            isPro ? setIsFabricUploadOpen(true) : setProUpgradeFeature('Fabric Upload')
          }
        />

        {/* Canvas area */}
        <div className="flex-1 flex flex-col overflow-hidden relative" data-tour="canvas">
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

          {/* Context menu & info — available to all */}
          <ContextMenu />
          <QuickInfo />
          <PatternAdjuster />

          {/* Grid & Dimensions Panel (Free tier) */}
          <QuiltDimensionsPanel
            isOpen={isGridDimensionsOpen}
            onClose={() => setIsGridDimensionsOpen(false)}
          />
        </div>

        {/* Pro-only production panels — flex siblings so they push the canvas, not cover it */}
        {isPro && <YardagePanel />}
        {isPro && (
          <PrintlistPanel
            onGeneratePdf={() => setIsPdfExportOpen(true)}
            onExportImage={() => setIsImageExportOpen(true)}
          />
        )}

        {/* Right context panel (hidden for PRINT) */}
        {activeWorktable !== 'print' && (
          <div className="relative">
            <ContextPanel />
            {isInspectorOpen && <PieceInspectorPanel />}
          </div>
        )}
      </div>

      <BottomBar />

      {/* Block drafting — pro only */}
      {isPro && (
        <BlockDraftingModal
          isOpen={isDraftingOpen}
          onClose={() => setIsDraftingOpen(false)}
          onSaved={handleBlockSaved}
        />
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

          <PdfExportDialog isOpen={isPdfExportOpen} onClose={() => setIsPdfExportOpen(false)} />
          <ImageExportDialog
            isOpen={isImageExportOpen}
            onClose={() => setIsImageExportOpen(false)}
          />
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
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-on hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isUpgrading ? 'Loading...' : 'Upgrade to Pro'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resize quilt dialog */}
      <ResizeDialog isOpen={isResizeOpen} onClose={() => setIsResizeOpen(false)} />

      {/* Help panel (opened from top bar) */}
      <HelpPanel isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      {/* Keyboard shortcuts modal (? key) */}
      <KeyboardShortcutsModal isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />

      {/* Unified export options dialog */}
      <ExportOptionsDialog
        isOpen={isExportOptionsOpen}
        onClose={() => setIsExportOptionsOpen(false)}
        onOpenPdfExport={() => setIsPdfExportOpen(true)}
        onOpenImageExport={() => setIsImageExportOpen(true)}
      />

      {/* History panel (opened from top bar) */}
      <HistoryPanel isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />

      {/* Duplicate options popup */}
      <DuplicateOptionsPopup />

      {/* Onboarding: start prompt for new users */}
      {shouldShowTour && !tourActive && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="bg-surface rounded-xl shadow-elevation-3 p-4 max-w-xs border border-outline-variant/20">
            <p className="text-sm font-medium text-on-surface mb-1">New here?</p>
            <p className="text-xs text-secondary mb-3">
              Take a quick tour to learn your way around the studio.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={dismissTour}
                className="px-3 py-1.5 text-xs text-secondary hover:text-on-surface transition-colors"
              >
                No thanks
              </button>
              <button
                type="button"
                onClick={startTour}
                className="px-4 py-1.5 text-xs font-semibold rounded-md hover:opacity-90 transition-opacity"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: 'var(--color-primary-on)',
                }}
              >
                Show me around
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Onboarding: guided tour overlay */}
      {tourActive && <TourOverlay onComplete={completeTour} onDismiss={dismissTour} />}
    </div>
  );
}
