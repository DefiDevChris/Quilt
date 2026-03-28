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
import { LayoutSettingsPanel } from '@/components/studio/LayoutSettingsPanel';
import { SymmetryTool } from '@/components/generators/SymmetryTool';
import { SerendipityTool } from '@/components/generators/SerendipityTool';
import { YardagePanel } from '@/components/measurement/YardagePanel';
import { FractionCalculator } from '@/components/measurement/FractionCalculator';
import { PrintlistPanel } from '@/components/export/PrintlistPanel';
import { PdfExportDialog } from '@/components/export/PdfExportDialog';
import { ImageExportDialog } from '@/components/export/ImageExportDialog';
import { ProGate } from '@/components/auth/ProGate';
import { useBlockDrop } from '@/hooks/useBlockDrop';
import { useFabricDrop } from '@/hooks/useFabricPattern';
import { useYardageCalculation } from '@/hooks/useYardageCalculation';
import { SmallScreenBanner } from '@/components/studio/SmallScreenBanner';
import { FussyCutDialog } from '@/components/studio/FussyCutDialog';
import { HelpButton } from '@/components/studio/HelpButton';
import { HelpPanel } from '@/components/studio/HelpPanel';
import { OnboardingTour } from '@/components/onboarding/OnboardingTour';
import { CanvasErrorBoundary } from '@/components/studio/CanvasErrorBoundary';
import { useBlockStore } from '@/stores/blockStore';
import { useFabricStore } from '@/stores/fabricStore';
import { useCanvasStore } from '@/stores/canvasStore';

function PrintOptionsPanel() {
  return (
    <div className="w-[220px] bg-surface flex-shrink-0 overflow-y-auto border-r border-outline-variant/10">
      <div className="p-4">
        <h3 className="text-label-sm uppercase text-secondary tracking-[0.02em] font-medium mb-4">
          Print Options
        </h3>
        <div className="flex flex-col gap-3">
          {[
            'Block Overview',
            'Cutting Diagram',
            'Patch Count',
            'Templates',
            'Fabric Requirements',
            'Yardage Summary',
          ].map((item) => (
            <button
              key={item}
              type="button"
              className="flex items-center justify-between py-2.5 px-3 text-body-md text-on-surface bg-surface-container rounded-md hover:bg-surface-container-high transition-colors"
            >
              <span>{item}</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
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
  const [isSerendipityOpen, setIsSerendipityOpen] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isPdfExportOpen, setIsPdfExportOpen] = useState(false);
  const [isImageExportOpen, setIsImageExportOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isPhotoPatchworkOpen, setIsPhotoPatchworkOpen] = useState(false);
  const [isQuiltOcrOpen, setIsQuiltOcrOpen] = useState(false);
  const { handleDragStart, handleDragOver, handleDrop } = useBlockDrop();
  const { handleFabricDragStart, handleFabricDragOver, handleFabricDrop } = useFabricDrop();

  const activeWorktable = useCanvasStore((s) => s.activeWorktable);

  useYardageCalculation();

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
      <SmallScreenBanner />
      <StudioTopBar />

      <div className="flex-1 flex overflow-hidden">
        {/* Left side: PRINT shows options panel, others show tool rail */}
        {activeWorktable === 'print' ? (
          <PrintOptionsPanel />
        ) : (
          <Toolbar
            onOpenLayoutSettings={() => setIsLayoutSettingsOpen(true)}
            onOpenSymmetry={() => setIsSymmetryOpen(true)}
            onOpenSerendipity={() => setIsSerendipityOpen(true)}
            onOpenCalculator={() => setIsCalculatorOpen(true)}
            onOpenImageExport={() => setIsImageExportOpen(true)}
            onOpenPhotoPatchwork={() => setIsPhotoPatchworkOpen(true)}
            onOpenQuiltOcr={() => setIsQuiltOcrOpen(true)}
          />
        )}

        <BlockLibrary
          onBlockDragStart={handleDragStart}
          onOpenDrafting={() => setIsDraftingOpen(true)}
        />

        {/* Pro-gated Fabric Library panel */}
        <ProGate fallback={null}>
          <FabricLibrary
            onFabricDragStart={handleFabricDragStart}
            onOpenUpload={() => setIsFabricUploadOpen(true)}
          />
        </ProGate>

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

          {/* Pro-gated floating panels */}
          <ProGate fallback={null}>
            <ContextMenu />
            <QuickInfo />
            <PatternAdjuster />
          </ProGate>

          {/* Pro-gated Yardage Panel */}
          <ProGate fallback={null}>
            <YardagePanel />
          </ProGate>

          {/* Pro-gated Printlist Panel */}
          <ProGate fallback={null}>
            <PrintlistPanel
              onGeneratePdf={() => setIsPdfExportOpen(true)}
              onExportImage={() => setIsImageExportOpen(true)}
            />
          </ProGate>

          {/* Fraction Calculator (Free tier) */}
          <FractionCalculator
            isOpen={isCalculatorOpen}
            onClose={() => setIsCalculatorOpen(false)}
          />
        </div>

        {/* Right context panel (hidden for PRINT) */}
        {activeWorktable !== 'print' && <ContextPanel />}
      </div>

      <BottomBar />

      {/* Pro-gated block drafting modal */}
      <ProGate fallback={null}>
        <BlockDraftingModal
          isOpen={isDraftingOpen}
          onClose={() => setIsDraftingOpen(false)}
          onSaved={handleBlockSaved}
        />
      </ProGate>

      {/* Pro-gated fabric upload dialog */}
      <ProGate fallback={null}>
        <FabricUploadDialog
          isOpen={isFabricUploadOpen}
          onClose={() => setIsFabricUploadOpen(false)}
          onUploaded={handleFabricUploaded}
        />
      </ProGate>

      {/* Pro-gated layout settings panel */}
      {isLayoutSettingsOpen && (
        <ProGate fallback={null}>
          <LayoutSettingsPanel onClose={() => setIsLayoutSettingsOpen(false)} />
        </ProGate>
      )}

      {/* Pro-gated symmetry tool */}
      <ProGate fallback={null}>
        <SymmetryTool isOpen={isSymmetryOpen} onClose={() => setIsSymmetryOpen(false)} />
      </ProGate>

      {/* Pro-gated serendipity tool */}
      <ProGate fallback={null}>
        <SerendipityTool isOpen={isSerendipityOpen} onClose={() => setIsSerendipityOpen(false)} />
      </ProGate>

      {/* Pro-gated PDF export dialog */}
      <ProGate fallback={null}>
        <PdfExportDialog isOpen={isPdfExportOpen} onClose={() => setIsPdfExportOpen(false)} />
      </ProGate>

      {/* Pro-gated image export dialog */}
      <ProGate fallback={null}>
        <ImageExportDialog isOpen={isImageExportOpen} onClose={() => setIsImageExportOpen(false)} />
      </ProGate>

      {/* Pro-gated Fussy Cut dialog */}
      <ProGate fallback={null}>
        <FussyCutDialog />
      </ProGate>

      {/* Help button + panel */}
      <HelpButton onClick={() => setIsHelpOpen(true)} />
      <HelpPanel isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      {/* Onboarding tour */}
      <OnboardingTour />
    </div>
  );
}
