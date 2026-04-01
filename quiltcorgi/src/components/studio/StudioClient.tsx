'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import type { Project } from '@/types/project';
import { CanvasWorkspace } from '@/components/canvas/CanvasWorkspace';
import { HorizontalRuler } from '@/components/canvas/HorizontalRuler';
import { VerticalRuler } from '@/components/canvas/VerticalRuler';
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
import { PRO_PRICE_MONTHLY } from '@/lib/constants';
import { LayoutSettingsPanel } from '@/components/studio/LayoutSettingsPanel';
import { SymmetryTool } from '@/components/generators/SymmetryTool';
import { YardagePanel } from '@/components/measurement/YardagePanel';
import { PrintlistPanel } from '@/components/export/PrintlistPanel';
import { PdfExportDialog } from '@/components/export/PdfExportDialog';
import { ImageExportDialog } from '@/components/export/ImageExportDialog';
import { useBlockDrop } from '@/hooks/useBlockDrop';
import { useFabricDrop } from '@/hooks/useFabricPattern';
import { useYardageCalculation } from '@/hooks/useYardageCalculation';
import { usePhotoPatternImport } from '@/hooks/usePhotoPatternImport';
import { saveProject } from '@/lib/save-project';
import { FussyCutDialog } from '@/components/studio/FussyCutDialog';
import { HelpPanel } from '@/components/studio/HelpPanel';
import { PieceInspectorPanel } from '@/components/studio/PieceInspectorPanel';
import { OnboardingTour } from '@/components/onboarding/OnboardingTour';
import { CanvasErrorBoundary } from '@/components/studio/CanvasErrorBoundary';
import { QuiltDimensionsPanel } from '@/components/studio/QuiltDimensionsPanel';
import { ResizeDialog } from '@/components/studio/ResizeDialog';

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
  const printOptions = [
    {
      label: 'Printlist',
      description: 'Block overview, patch count & cutting diagram',
      onClick: () => usePrintlistStore.getState().togglePanel(),
    },
    {
      label: 'Piece Templates',
      description: 'Inspect pieces & generate 1:1 PDF templates',
      onClick: () => {
        usePieceInspectorStore.getState().togglePuzzleView();
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
    <div className="w-[220px] bg-surface flex-shrink-0 overflow-y-auto border-r border-outline-variant/10">
      <div className="p-4">
        <h3 className="text-label-sm uppercase text-secondary tracking-[0.02em] font-medium mb-4">
          Print Options
        </h3>
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
  const [isSymmetryOpen, setIsSymmetryOpen] = useState(false);
  const [isPdfExportOpen, setIsPdfExportOpen] = useState(false);
  const [isImageExportOpen, setIsImageExportOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isGridDimensionsOpen, setIsGridDimensionsOpen] = useState(false);
  const [isResizeOpen, setIsResizeOpen] = useState(false);
  const [proUpgradeFeature, setProUpgradeFeature] = useState<string | null>(null);
  const isPro = useAuthStore((s) => s.isPro);
  const { handleDragStart, handleDragOver, handleDrop } = useBlockDrop();
  const { handleFabricDragStart, handleFabricDragOver, handleFabricDrop } = useFabricDrop();
  const { toast } = useToast();
  const [isUpgrading, setIsUpgrading] = useState(false);

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
        setProject(data.data);
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
            onOpenSymmetry={() => setIsSymmetryOpen(true)}
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
            <HorizontalRuler />

            <div
              className="flex-1 flex overflow-hidden relative"
              onDragOver={combinedDragOver}
              onDrop={combinedDrop}
            >
              <VerticalRuler />
              <CanvasWorkspace project={project} />
              <FloatingToolbar />
            </div>
          </CanvasErrorBoundary>

          {/* Context menu & info — available to all */}
          <ContextMenu />
          <QuickInfo />
          <PatternAdjuster />

          {/* Pro-only production panels */}
          {isPro && <YardagePanel />}
          {isPro && (
            <PrintlistPanel
              onGeneratePdf={() => setIsPdfExportOpen(true)}
              onExportImage={() => setIsImageExportOpen(true)}
            />
          )}

          {/* Grid & Dimensions Panel (Free tier) */}
          <QuiltDimensionsPanel
            isOpen={isGridDimensionsOpen}
            onClose={() => setIsGridDimensionsOpen(false)}
          />
        </div>

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
          <SymmetryTool isOpen={isSymmetryOpen} onClose={() => setIsSymmetryOpen(false)} />
          <PdfExportDialog isOpen={isPdfExportOpen} onClose={() => setIsPdfExportOpen(false)} />
          <ImageExportDialog
            isOpen={isImageExportOpen}
            onClose={() => setIsImageExportOpen(false)}
          />
          <FussyCutDialog />
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

      {/* Onboarding tour */}
      <OnboardingTour />
    </div>
  );
}
