'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useBlockStore } from '@/stores/blockStore';
import { useFabricStore } from '@/stores/fabricStore';
import { useCanvasStore } from '@/stores/canvasStore';
import { startStripeCheckout } from '@/lib/stripe-checkout';
import { PRO_PRICE_MONTHLY } from '@/lib/constants';

import { SimplePhotoBlockUpload } from '@/components/blocks/SimplePhotoBlockUpload';
import { FabricUploadDialog } from '@/components/fabrics/FabricUploadDialog';
import { LayoutSettingsPanel } from '@/components/studio/LayoutSettingsPanel';
import { PdfExportDialog } from '@/components/export/PdfExportDialog';
import { ImageExportDialog } from '@/components/export/ImageExportDialog';
import { PhotoToDesignPromo } from '@/components/photo-layout/PhotoToLayoutPromo';
import { ResizeDialog } from '@/components/studio/ResizeDialog';
import { HelpPanel } from '@/components/studio/HelpPanel';
import { HistoryPanel } from '@/components/studio/HistoryPanel';

/**
 * Centralized open/close API for every studio dialog. Components consume this
 * via `useStudioDialogs()` instead of receiving 12+ open callbacks via props.
 *
 * Pro-gating: methods that are pro-only delegate to `requirePro()`, which
 * either calls the open method or surfaces the upgrade modal.
 */
interface StudioDialogsApi {
  // Open methods (free + pro mixed; pro gating handled inside)
  openImageExport: () => void;
  openPdfExport: () => void;
  openHelp: () => void;
  openHistory: () => void;
  openGridDimensions: () => void;
  openLayoutSettings: () => void;
  openPhotoToDesign: () => void;
  openResize: () => void;
  openPhotoBlockUpload: () => void;
  openFabricUpload: () => void;

  // Pro upgrade prompt
  promptUpgrade: (featureName: string) => void;
}

const StudioDialogsContext = createContext<StudioDialogsApi | null>(null);

export function useStudioDialogs(): StudioDialogsApi {
  const ctx = useContext(StudioDialogsContext);
  if (!ctx) {
    throw new Error('useStudioDialogs must be used inside <StudioDialogsProvider>');
  }
  return ctx;
}

interface StudioDialogsProviderProps {
  readonly children: ReactNode;
}

export function StudioDialogsProvider({ children }: StudioDialogsProviderProps) {
  const isPro = useAuthStore((s) => s.isPro);

  // Dialog open/close state
  const [isPhotoBlockUploadOpen, setIsPhotoBlockUploadOpen] = useState(false);
  const [isFabricUploadOpen, setIsFabricUploadOpen] = useState(false);
  const [isLayoutSettingsOpen, setIsLayoutSettingsOpen] = useState(false);
  const [isPdfExportOpen, setIsPdfExportOpen] = useState(false);
  const [isImageExportOpen, setIsImageExportOpen] = useState(false);
  const [isPhotoPromoOpen, setIsPhotoPromoOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isResizeOpen, setIsResizeOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Pro upgrade prompt state
  const [proUpgradeFeature, setProUpgradeFeature] = useState<string | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);

  const promptUpgrade = useCallback((feature: string) => {
    setProUpgradeFeature(feature);
  }, []);

  // Open quilt-dimensions clears selection so the default panel shows dimensions controls.
  const openGridDimensions = useCallback(() => {
    useCanvasStore.getState().setSelectedObjectIds([]);
    const canvas = useCanvasStore.getState().fabricCanvas;
    if (canvas) {
      (
        canvas as unknown as { discardActiveObject: () => unknown; requestRenderAll: () => void }
      ).discardActiveObject();
      (canvas as unknown as { requestRenderAll: () => void }).requestRenderAll();
    }
  }, []);

  const handleUpgrade = useCallback(async () => {
    setIsUpgrading(true);
    try {
      await startStripeCheckout();
    } finally {
      setIsUpgrading(false);
    }
  }, []);

  const handleBlockSaved = useCallback(() => {
    useBlockStore.getState().fetchUserBlocks();
  }, []);

  const handleFabricUploaded = useCallback(() => {
    useFabricStore.getState().fetchUserFabrics();
  }, []);

  // Pro-gated openers — surface upgrade prompt for free users
  const openImageExport = useCallback(() => {
    if (!isPro) return promptUpgrade('Image Export');
    setIsImageExportOpen(true);
  }, [isPro, promptUpgrade]);

  const openPdfExport = useCallback(() => {
    if (!isPro) return promptUpgrade('PDF Export');
    setIsPdfExportOpen(true);
  }, [isPro, promptUpgrade]);

  const openPhotoBlockUpload = useCallback(() => {
    if (!isPro) return promptUpgrade('Photo Block Upload');
    setIsPhotoBlockUploadOpen(true);
  }, [isPro, promptUpgrade]);

  const openFabricUpload = useCallback(() => {
    if (!isPro) return promptUpgrade('Fabric Upload');
    setIsFabricUploadOpen(true);
  }, [isPro, promptUpgrade]);

  const api: StudioDialogsApi = {
    openImageExport,
    openPdfExport,
    openHelp: () => setIsHelpOpen(true),
    openHistory: () => setIsHistoryOpen(true),
    openGridDimensions,
    openLayoutSettings: () => setIsLayoutSettingsOpen(true),
    openPhotoToDesign: () => setIsPhotoPromoOpen(true),
    openResize: () => setIsResizeOpen(true),
    openPhotoBlockUpload,
    openFabricUpload,
    promptUpgrade,
  };

  return (
    <StudioDialogsContext.Provider value={api}>
      {children}

      {/* ── Photo block upload (pro only) ─────────────────────── */}
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

      {/* ── Pro-only dialogs ──────────────────────────────────── */}
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
          {isPhotoPromoOpen && (
            <PhotoToDesignPromo isPro={isPro} onClose={() => setIsPhotoPromoOpen(false)} />
          )}
        </>
      )}

      {/* ── Always-available dialogs ──────────────────────────── */}
      <ResizeDialog isOpen={isResizeOpen} onClose={() => setIsResizeOpen(false)} />
      <HelpPanel isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      <HistoryPanel isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />

      {/* ── Pro upgrade prompt ────────────────────────────────── */}
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
    </StudioDialogsContext.Provider>
  );
}
