'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useProjectStore } from '@/stores/projectStore';
import { useCanvasStore } from '@/stores/canvasStore';
import { useAuthStore } from '@/stores/authStore';
import { useLayoutStore } from '@/stores/layoutStore';
import { useCanvasContext } from '@/contexts/CanvasContext';
import { CANVAS } from '@/lib/design-system';

import { HamburgerDrawer } from '@/components/studio/HamburgerDrawer';
import { TooltipHint } from '@/components/ui/TooltipHint';
import { useToast } from '@/components/ui/ToastProvider';
import { ProUpgradeButton } from '@/components/billing/ProUpgradeButton';
import { QuiltSettingsDropdown } from '@/components/studio/QuiltSettingsDropdown';

function formatTimestamp(date: Date | null): string {
  if (!date) return '';
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString();
}

/**
 * Toggle between edit mode (full fence visible, blocks selectable) and
 * preview mode (fence faded, blocks locked, WYSIWYG view).
 * Only visible when a layout has been applied.
 */
function EditPreviewToggle() {
  const hasAppliedLayout = useLayoutStore((s) => s.hasAppliedLayout);
  const previewMode = useLayoutStore((s) => s.previewMode);

  if (!hasAppliedLayout) return null;

  return (
    <TooltipHint
      name={previewMode ? 'Switch to Edit Mode' : 'Switch to Preview Mode'}
      description={
        previewMode
          ? 'Show fence areas and enable editing'
          : 'Hide fence overlay for a clean preview'
      }
    >
      <button
        type="button"
        onClick={() => useLayoutStore.getState().setPreviewMode(!previewMode)}
        className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
          previewMode
            ? 'bg-primary/12 text-primary ring-1 ring-primary/30'
            : 'text-[var(--color-text-dim)]/50 hover:text-[var(--color-text)] hover:bg-[var(--color-border)]'
        }`}
        aria-label={previewMode ? 'Switch to edit mode' : 'Switch to preview mode'}
        aria-pressed={previewMode}
      >
        {previewMode ? (
          /* Eye-off icon for preview mode (fence hidden) */
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <path
              d="M3 3L17 17M10 5C13.9 5 16.8 8 17.8 10C17.3 11 16.5 12.3 15.3 13.3M14 14C12.9 14.7 11.5 15 10 15C6.1 15 3.2 12 2.2 10C2.7 9 3.5 7.7 4.7 6.7"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          /* Eye icon for edit mode (fence visible) */
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <path
              d="M2.2 10C3.2 8 6.1 5 10 5C13.9 5 16.8 8 17.8 10C16.8 12 13.9 15 10 15C6.1 15 3.2 12 2.2 10Z"
              stroke="currentColor"
              strokeWidth="1.4"
            />
            <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        )}
      </button>
    </TooltipHint>
  );
}

function ReferenceImageToggle() {
  const referenceImageUrl = useCanvasStore((s) => s.referenceImageUrl);
  const showReferencePanel = useCanvasStore((s) => s.showReferencePanel);
  const toggleReferencePanel = useCanvasStore((s) => s.toggleReferencePanel);

  if (!referenceImageUrl) return null;

  return (
    <TooltipHint
      name={showReferencePanel ? 'Hide Reference Photo' : 'Show Reference Photo'}
      description="Side-by-side view of the original photo used in Photo to Design"
    >
      <button
        type="button"
        onClick={toggleReferencePanel}
        className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
          showReferencePanel
            ? 'bg-primary/12 text-primary ring-1 ring-primary/30'
            : 'text-[var(--color-text-dim)]/50 hover:text-[var(--color-text)] hover:bg-[var(--color-border)]'
        }`}
        aria-label={showReferencePanel ? 'Hide reference photo' : 'Show reference photo'}
        aria-pressed={showReferencePanel}
      >
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
          <rect
            x="1"
            y="3"
            width="8"
            height="14"
            rx="1.5"
            stroke="currentColor"
            strokeWidth="1.4"
          />
          <rect
            x="11"
            y="3"
            width="8"
            height="14"
            rx="1.5"
            stroke="currentColor"
            strokeWidth="1.4"
          />
          <circle cx="15" cy="8" r="1.5" stroke="currentColor" strokeWidth="1" />
          <path
            d="M11 14L13 11L15 13L17 10L19 12"
            stroke="currentColor"
            strokeWidth="0.8"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </TooltipHint>
  );
}

/**
 * Compact chip showing the current canvas mode and grid summary so the user
 * always knows whether they are in a constrained grid layout or free-form.
 */
function ModeChip({ onEditQuiltSetup }: { readonly onEditQuiltSetup?: () => void }) {
  const hasAppliedLayout = useLayoutStore((s) => s.hasAppliedLayout);
  const layoutType = useLayoutStore((s) => s.layoutType);
  const rows = useLayoutStore((s) => s.rows);
  const cols = useLayoutStore((s) => s.cols);
  const canvasWidth = useProjectStore((s) => s.canvasWidth);
  const canvasHeight = useProjectStore((s) => s.canvasHeight);
  const projectMode = useProjectStore((s) => s.mode);

  if (projectMode === 'free-form') {
    const modeLabel = 'Free-form';
    const sizeLabel = `${canvasWidth}″×${canvasHeight}″`;

    const content = (
      <>
        <span className="font-semibold text-[var(--color-text)]">{modeLabel}</span>
        <span className="text-[var(--color-text-dim)]"> · {sizeLabel}</span>
      </>
    );

    const title = `Mode: ${modeLabel} · ${sizeLabel}${onEditQuiltSetup ? ' (Click to edit canvas settings)' : ''}`;

    if (onEditQuiltSetup) {
      return (
        <button
          type="button"
          onClick={onEditQuiltSetup}
          className="rounded-full border border-[var(--color-border)]/40 bg-[var(--color-surface)] px-3 py-1 text-[12px] leading-[18px] text-[var(--color-text)]/75 hover:bg-[var(--color-border)]/20 hover:text-[var(--color-text)] hover:border-[var(--color-primary)]/40 transition-colors"
          title={title}
        >
          {content}
        </button>
      );
    }

    return (
      <span
        className="rounded-full border border-[var(--color-border)]/40 bg-[var(--color-surface)] px-3 py-1 text-[12px] leading-[18px] text-[var(--color-text)]/75"
        title={title}
      >
        {content}
      </span>
    );
  }

  if (!hasAppliedLayout) {
    return (
      <span className="rounded-full border border-[var(--color-border)]/40 bg-[var(--color-surface)] px-3 py-1 text-[12px] leading-[18px] text-[var(--color-text-dim)]">
        No layout yet
      </span>
    );
  }

  const isFreeForm = layoutType === 'free-form';
  const MODE_LABELS: Record<string, string> = {
    'free-form': 'Free-form',
    medallion: 'Medallion',
    'on-point': 'On-point',
    strippy: 'Strippy',
    sashing: 'Sashing',
    grid: 'Grid',
  };
  const modeLabel = MODE_LABELS[layoutType] ?? 'Grid';
  const gridLabel = isFreeForm ? '' : `${rows}×${cols}`;
  const sizeLabel = `${canvasWidth}″×${canvasHeight}″`;

  const content = (
    <>
      <span className="font-semibold text-[var(--color-text)]">{modeLabel}</span>
      {gridLabel && <span className="text-[var(--color-text-dim)]"> · {gridLabel}</span>}
      <span className="text-[var(--color-text-dim)]"> · {sizeLabel}</span>
    </>
  );

  const title = `Mode: ${modeLabel} · ${gridLabel ? gridLabel + ' · ' : ''}${sizeLabel}${onEditQuiltSetup ? ' (Click to edit layout)' : ''}`;

  if (onEditQuiltSetup) {
    return (
      <button
        type="button"
        onClick={onEditQuiltSetup}
        className="rounded-full border border-[var(--color-border)]/40 bg-[var(--color-surface)] px-3 py-1 text-[12px] leading-[18px] text-[var(--color-text)]/75 hover:bg-[var(--color-border)]/20 hover:text-[var(--color-text)] hover:border-[var(--color-primary)]/40 transition-colors"
        title={title}
      >
        {content}
      </button>
    );
  }

  return (
    <span
      className="rounded-full border border-[var(--color-border)]/40 bg-[var(--color-surface)] px-3 py-1 text-[12px] leading-[18px] text-[var(--color-text)]/75"
      title={title}
    >
      {content}
    </span>
  );
}

interface StudioTopBarProps {
  readonly onOpenImageExport?: () => void;
  readonly onOpenPdfExport?: () => void;
  readonly onOpenHelp?: () => void;
  readonly onOpenHistory?: () => void;
  readonly onSave?: () => void;
  /** Re-opens the quilt setup wizard (layout & size) for editing. */
  readonly onEditQuiltSetup?: () => void;
}

export function StudioTopBar({
  onOpenImageExport,
  onOpenPdfExport,
  onOpenHelp,
  onOpenHistory,
  onSave,
  onEditQuiltSetup,
}: StudioTopBarProps) {
  const router = useRouter();
  const projectName = useProjectStore((s) => s.projectName);
  const isDirty = useProjectStore((s) => s.isDirty);
  const lastSavedAt = useProjectStore((s) => s.lastSavedAt);
  const canvasWidth = useProjectStore((s) => s.canvasWidth);
  const canvasHeight = useProjectStore((s) => s.canvasHeight);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isViewportLocked = useCanvasStore((s) => s.isViewportLocked);
  const activeWorktable = useCanvasStore((s) => s.activeWorktable);
  const user = useAuthStore((s) => s.user);
  const isPro = user?.role === 'pro' || user?.role === 'admin';
  const isQuiltMode = activeWorktable === 'quilt';
  const { toast } = useToast();
  const { getCanvas } = useCanvasContext();

  const handleBackToDashboard = () => {
    if (isDirty && onSave) {
      onSave();
    }
    router.push('/dashboard');
  };

  useEffect(() => {
    function handleSaveSuccess() {
      toast({
        type: 'success',
        title: 'Saved',
        description: 'Your project has been saved',
      });
    }
    function handleInvalidDrop(e: Event) {
      const detail = (e as CustomEvent).detail as { message?: string } | undefined;
      toast({
        type: 'error',
        title: 'Invalid drop',
        description: detail?.message ?? 'Cannot drop here',
      });
    }
    window.addEventListener('quiltstudio:save-success', handleSaveSuccess);
    window.addEventListener('quiltstudio:invalid-drop', handleInvalidDrop);
    return () => {
      window.removeEventListener('quiltstudio:save-success', handleSaveSuccess);
      window.removeEventListener('quiltstudio:invalid-drop', handleInvalidDrop);
    };
  }, [toast]);

  return (
    <>
      <div className="h-12 bg-[var(--color-bg)] border-b border-[var(--color-border)]/15 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <TooltipHint name="Menu" description="Access project settings and options">
            <button
              type="button"
              onClick={() => setDrawerOpen((prev) => !prev)}
              className="w-8 h-8 flex items-center justify-center rounded-full text-[var(--color-text-dim)]/50 hover:text-[var(--color-text)] hover:bg-[var(--color-border)] transition-colors"
              aria-label="Open menu"
            >
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <path
                  d="M3 5H17M3 10H17M3 15H17"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </TooltipHint>
          <TooltipHint
            name="Back to Dashboard"
            description={isDirty ? 'Save and return to dashboard' : 'Return to dashboard'}
          >
            <button
              type="button"
              onClick={handleBackToDashboard}
              className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[14px] leading-[20px] text-[var(--color-text)]/70 hover:text-[var(--color-text)] hover:bg-[var(--color-border)] transition-colors"
              aria-label="Back to Dashboard"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M9 3L5 7L9 11"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Dashboard
            </button>
          </TooltipHint>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              {isDirty && (
                <span
                  className="w-2 h-2 rounded-full bg-primary/80 flex-shrink-0"
                  title="Unsaved changes"
                />
              )}
              <span className="font-semibold text-[15px] leading-[20px] text-[var(--color-text)] tracking-[-0.01em]">
                {projectName || 'Quilt Studio'}
              </span>
              {lastSavedAt && (
                <span className="text-[14px] leading-[20px] text-[var(--color-text-dim)]/60 ml-1">
                  Saved {formatTimestamp(lastSavedAt)}
                </span>
              )}
            </div>
            {activeWorktable === 'quilt' && <ModeChip onEditQuiltSetup={onEditQuiltSetup} />}
          </div>
        </div>

        {/* Center: empty spacer */}
        <div className="absolute left-1/2 -translate-x-1/2" />

        {/* Right: Viewport controls + Project info + Settings */}
        <div className="flex items-center gap-4">
          {!isPro && <ProUpgradeButton variant="studio" />}

          {isQuiltMode && (
            <>
              <EditPreviewToggle />

              <div className="flex items-center gap-1">
                <TooltipHint
                  name={isViewportLocked ? 'Viewport Locked' : 'Viewport Unlocked'}
                  description={
                    isViewportLocked
                      ? 'Click to unlock and pan/zoom freely'
                      : 'Click to lock viewport to centered fit'
                  }
                >
                  <button
                    type="button"
                    onClick={() =>
                      useCanvasStore
                        .getState()
                        .setViewportLocked(
                          !isViewportLocked,
                          getCanvas(),
                          canvasWidth,
                          canvasHeight
                        )
                    }
                    className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                      isViewportLocked
                        ? 'hover:bg-[var(--color-border)]'
                        : 'bg-primary/10 hover:bg-primary/20'
                    }`}
                    aria-label={isViewportLocked ? 'Unlock viewport' : 'Lock viewport'}
                  >
                    {isViewportLocked ? (
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 20 20"
                        fill="none"
                        stroke={CANVAS.seamLine}
                        strokeWidth="1.4"
                      >
                        <rect x="4" y="9" width="12" height="8" rx="2" />
                        <path
                          d="M7 9V6C7 4.34 8.34 3 10 3C11.66 3 13 4.34 13 6V9"
                          strokeLinecap="round"
                        />
                      </svg>
                    ) : (
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 20 20"
                        fill="none"
                        stroke={CANVAS.seamLine}
                        strokeWidth="1.4"
                      >
                        <rect x="4" y="9" width="12" height="8" rx="2" />
                        <path
                          d="M7 9V6C7 4.34 8.34 3 10 3C11.66 3 13 4.34 13 6V7"
                          strokeLinecap="round"
                        />
                      </svg>
                    )}
                  </button>
                </TooltipHint>

                {!isViewportLocked && (
                  <TooltipHint
                    name="Recenter Viewport"
                    description="Snap grid back to center of canvas"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        useCanvasStore
                          .getState()
                          .centerAndFitViewport(getCanvas(), canvasWidth, canvasHeight)
                      }
                      className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--color-border)] transition-colors"
                      aria-label="Recenter viewport"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 20 20"
                        fill="none"
                        stroke={CANVAS.seamLine}
                        strokeWidth="1.4"
                      >
                        <circle cx="10" cy="10" r="3" />
                        <path d="M10 3V7M10 13V17M3 10H7M13 10H17" strokeLinecap="round" />
                      </svg>
                    </button>
                  </TooltipHint>
                )}
              </div>

              <ReferenceImageToggle />

              <div className="h-6 w-px bg-[var(--color-border)]/30" />

              <QuiltSettingsDropdown
                onOpenImageExport={onOpenImageExport}
                onOpenPdfExport={onOpenPdfExport}
              />
            </>
          )}
        </div>
      </div>

      <HamburgerDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSave={onSave}
        onOpenImageExport={onOpenImageExport}
        onOpenPdfExport={onOpenPdfExport}
        onOpenHelp={onOpenHelp}
        onOpenHistory={onOpenHistory}
      />
    </>
  );
}
