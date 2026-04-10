'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useBlockStore } from '@/stores/blockStore';
import { useFabricStore } from '@/stores/fabricStore';
import { useCanvasStore } from '@/stores/canvasStore';
import { useLayoutStore } from '@/stores/layoutStore';
import { startStripeCheckout } from '@/lib/stripe-checkout';
import { PRO_PRICE_MONTHLY } from '@/lib/constants';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';

import { SimplePhotoBlockUpload } from '@/components/blocks/SimplePhotoBlockUpload';
import { FabricUploadDialog } from '@/components/fabrics/FabricUploadDialog';

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
  openPhotoToDesign: () => void;
  openResize: () => void;
  openPhotoBlockUpload: () => void;
  openFabricUpload: () => void;

  /** Show confirmation before changing to a different layout type (destructive). */
  confirmChangeLayout: (onConfirm: () => void) => void;
  /** Show confirmation before clearing the layout entirely. */
  confirmClearLayout: (onConfirm: () => void) => void;

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

  const [isPdfExportOpen, setIsPdfExportOpen] = useState(false);
  const [isImageExportOpen, setIsImageExportOpen] = useState(false);
  const [isPhotoPromoOpen, setIsPhotoPromoOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isResizeOpen, setIsResizeOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Pro upgrade prompt state
  const [proUpgradeFeature, setProUpgradeFeature] = useState<string | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);

  // Layout change/clear confirmation state
  const [pendingChangeLayoutFn, setPendingChangeLayoutFn] = useState<(() => void) | null>(null);
  const [pendingClearLayoutFn, setPendingClearLayoutFn] = useState<(() => void) | null>(null);

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

  const confirmChangeLayout = useCallback((onConfirm: () => void) => {
    const ls = useLayoutStore.getState();
    // If no layout applied yet, skip confirmation
    if (!ls.hasAppliedLayout) {
      onConfirm();
      return;
    }
    setPendingChangeLayoutFn(() => onConfirm);
  }, []);

  const confirmClearLayout = useCallback((onConfirm: () => void) => {
    setPendingClearLayoutFn(() => onConfirm);
  }, []);

  const api: StudioDialogsApi = {
    openImageExport,
    openPdfExport,
    openHelp: () => setIsHelpOpen(true),
    openHistory: () => setIsHistoryOpen(true),
    openGridDimensions,
    openPhotoToDesign: () => setIsPhotoPromoOpen(true),
    openResize: () => setIsResizeOpen(true),
    openPhotoBlockUpload,
    openFabricUpload,
    confirmChangeLayout,
    confirmClearLayout,
    promptUpgrade,
  };

  return (
    <StudioDialogsContext.Provider value={api}>
      {children}

      {/* ── Photo block upload (pro only) ─────────────────────── */}
      {isPro && isPhotoBlockUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-[560px] rounded-full bg-neutral p-5 shadow-elevation-3">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-800">Upload Block Photo</h2>
              <button
                type="button"
                onClick={() => setIsPhotoBlockUploadOpen(false)}
                className="text-neutral-500 hover:text-neutral-800"
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
        <ConfirmationDialog
          title=""
          message={
            <div className="text-center">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                className="text-neutral-500 mx-auto mb-3"
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
              <p className="text-lg font-semibold text-neutral-800 mb-1">{proUpgradeFeature}</p>
              <p className="text-sm text-neutral-500 mb-4">
                This feature requires a Pro subscription. Start at ${PRO_PRICE_MONTHLY}/month.
              </p>
            </div>
          }
          cancelLabel="Maybe Later"
          confirmLabel={isUpgrading ? 'Loading...' : 'Upgrade to Pro'}
          onConfirm={handleUpgrade}
          onCancel={() => setProUpgradeFeature(null)}
        />
      )}

      {/* ── Change Layout confirmation ───────────────────────── */}
      {pendingChangeLayoutFn && (
        <ConfirmationDialog
          title="Change Layout?"
          message="This will remove all placed blocks and reconfigure the fence. Fabric assignments will be lost."
          cancelLabel="Cancel"
          confirmLabel="Change Layout"
          onConfirm={() => {
            pendingChangeLayoutFn();
            setPendingChangeLayoutFn(null);
          }}
          onCancel={() => setPendingChangeLayoutFn(null)}
        />
      )}

      {/* ── Clear Layout confirmation ────────────────────────── */}
      {pendingClearLayoutFn && (
        <ConfirmationDialog
          title="Clear Layout?"
          message="Remove the layout fence and all placed blocks?"
          cancelLabel="Cancel"
          confirmLabel="Clear Layout"
          onConfirm={() => {
            pendingClearLayoutFn();
            setPendingClearLayoutFn(null);
          }}
          onCancel={() => setPendingClearLayoutFn(null)}
        />
      )}
    </StudioDialogsContext.Provider>
  );
}
