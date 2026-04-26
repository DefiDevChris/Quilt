'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Eraser } from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';
import { useCanvasStore } from '@/stores/canvasStore';
import { useAuthStore } from '@/stores/authStore';
import { useLayoutStore } from '@/stores/layoutStore';

import { CommandPalette } from '@/components/studio/CommandPalette';
import { SaveAsTemplateModal } from '@/components/studio/SaveAsTemplateModal';
import { TooltipHint } from '@/components/ui/TooltipHint';
import { useToast } from '@/components/ui/ToastProvider';
import { ProUpgradeButton } from '@/components/billing/ProUpgradeButton';
import { useCanvasContext } from '@/contexts/CanvasContext';
import { clearAllFabricsOnCanvas } from '@/lib/canvas-clear-fabrics';

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
  const setShowReferencePanel = useCanvasStore((s) => s.setShowReferencePanel);

  if (!referenceImageUrl) return null;

  return (
    <TooltipHint
      name={showReferencePanel ? 'Hide Reference Photo' : 'Show Reference Photo'}
      description="Side-by-side view of the original photo used in Photo to Design"
    >
      <button
        type="button"
        onClick={() => setShowReferencePanel(!showReferencePanel)}
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
 * Read-only chip showing the current mode and grid summary so the user
 * always knows which locked mode they are in.
 */
function ModeChip() {
  const layoutType = useLayoutStore((s) => s.layoutType);
  const rows = useLayoutStore((s) => s.rows);
  const cols = useLayoutStore((s) => s.cols);
  const canvasWidth = useProjectStore((s) => s.canvasWidth);
  const canvasHeight = useProjectStore((s) => s.canvasHeight);
  const projectMode = useProjectStore((s) => s.mode);

  const sizeLabel = `${canvasWidth}″×${canvasHeight}″`;

  if (projectMode === 'free-form') {
    return (
      <span
        className="rounded-full border border-[var(--color-border)]/40 bg-[var(--color-surface)] px-3 py-1 text-[12px] leading-[18px] text-[var(--color-text)]/75"
        title={`Mode: Freeform · ${sizeLabel}`}
      >
        <span className="font-semibold text-[var(--color-text)]">Freeform</span>
        <span className="text-[var(--color-text-dim)]"> · {sizeLabel}</span>
      </span>
    );
  }

  if (projectMode === 'template') {
    return (
      <span
        className="rounded-full border border-[var(--color-border)]/40 bg-[var(--color-surface)] px-3 py-1 text-[12px] leading-[18px] text-[var(--color-text)]/75"
        title={`Mode: Template · ${sizeLabel}`}
      >
        <span className="font-semibold text-[var(--color-text)]">Template</span>
        <span className="text-[var(--color-text-dim)]"> · {sizeLabel}</span>
      </span>
    );
  }

  // Layout mode
  const MODE_LABELS: Record<string, string> = {
    'free-form': 'Free-form',
    medallion: 'Medallion',
    'on-point': 'On-point',
    strippy: 'Strippy',
    sashing: 'Sashing',
    grid: 'Grid',
  };
  const modeLabel = MODE_LABELS[layoutType] ?? 'Grid';
  const gridLabel = `${rows}×${cols}`;

  return (
    <span
      className="rounded-full border border-[var(--color-border)]/40 bg-[var(--color-surface)] px-3 py-1 text-[12px] leading-[18px] text-[var(--color-text)]/75"
      title={`Mode: Layout · ${modeLabel} · ${gridLabel} · ${sizeLabel}`}
    >
      <span className="font-semibold text-[var(--color-text)]">Layout</span>
      <span className="text-[var(--color-text-dim)]"> · {modeLabel} · {gridLabel}</span>
      <span className="text-[var(--color-text-dim)]"> · {sizeLabel}</span>
    </span>
  );
}

interface StudioTopBarProps {
  readonly onOpenImageExport?: () => void;
  readonly onOpenPdfExport?: () => void;
  readonly onOpenHelp?: () => void;
  readonly onOpenHistory?: () => void;
  /**
   * Save handler. May be synchronous or return a Promise. The top bar awaits
   * the returned value before navigating away (e.g. on Back to Dashboard) so
   * that users do not lose work if the save fails or takes longer than the
   * navigation.
   */
  readonly onSave?: () => void | Promise<void>;
}

export function StudioTopBar({
  onOpenImageExport,
  onOpenPdfExport,
  onOpenHelp,
  onOpenHistory,
  onSave,
}: StudioTopBarProps) {
  const router = useRouter();
  const projectName = useProjectStore((s) => s.projectName);
  const projectMode = useProjectStore((s) => s.mode);
  const hasContent = useProjectStore((s) => s.hasContent);
  const isDirty = useProjectStore((s) => s.isDirty);
  const lastSavedAt = useProjectStore((s) => s.lastSavedAt);
  const layoutLocked = useLayoutStore((s) => s.layoutLocked);
  const [tick, setTick] = useState(0);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [saveAsTemplateOpen, setSaveAsTemplateOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const isPro = user?.role === 'pro' || user?.role === 'admin';
  const { toast } = useToast();
  const { getCanvas } = useCanvasContext();

  // Save-as-Template is offered for layout/free-form projects with content.
  // Template-mode users save via "Save Project" instead — re-saving a
  // template-based design as a new template would invite confusion.
  const showSaveAsTemplate = projectMode !== 'template' && layoutLocked && hasContent;

  // Clear-fabrics is only meaningful in template mode where the canvas
  // arrives pre-populated with bundled fabrics. Layout/free-form modes
  // start blank, so clearing fabrics there is a no-op.
  const showClearFabrics = projectMode === 'template' && layoutLocked;

  const handleClearFabrics = useCallback(() => {
    const canvas = getCanvas();
    if (!canvas) return;
    const ok = window.confirm(
      'Remove all fabric fills from this template? Shapes will remain — you can re-apply fabrics afterwards.'
    );
    if (!ok) return;
    const mutated = clearAllFabricsOnCanvas(canvas);
    if (mutated) {
      useProjectStore.getState().setDirty(true);
      toast({
        type: 'success',
        title: 'Fabrics cleared',
        description: 'All shapes have been stripped back to outlines.',
      });
    }
  }, [getCanvas, toast]);

  const handleBackToDashboard = useCallback(async () => {
    if (isDirty && onSave) {
      try {
        await onSave();
      } catch (err) {
        console.error('[StudioTopBar] Save before navigation threw:', err);
        toast({
          type: 'error',
          title: "Couldn't save",
          description:
            'Your project has unsaved changes that failed to save. Please try again before leaving.',
        });
        return;
      }

      const status = useProjectStore.getState().saveStatus;
      if (status === 'error') {
        toast({
          type: 'error',
          title: "Couldn't save",
          description:
            'Your project has unsaved changes. Please resolve the save error before leaving.',
        });
        return;
      }
    }
    router.push('/dashboard');
  }, [isDirty, onSave, router, toast]);

  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  // Cmd+K / Ctrl+K toggles the command palette globally so users don't
  // have to mouse over to the hamburger icon to discover commands.
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        // Don't fight the OS / browser when an input element is in focus
        // for a different purpose — but DO accept it inside our own
        // components, where Cmd+K is unambiguously "command palette".
        e.preventDefault();
        setPaletteOpen((open) => !open);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

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
    // Throttle fence-rejection toasts so rapid repeated rejections (e.g. dragging
    // across the canvas in layout mode) don't flood the UI with duplicates.
    let lastFenceToastAt = 0;
    function handleFenceRejection(e: Event) {
      const now = Date.now();
      if (now - lastFenceToastAt < 1500) return;
      lastFenceToastAt = now;
      const detail = (e as CustomEvent).detail as { message?: string } | undefined;
      toast({
        type: 'warning',
        title: 'Outside block cell',
        description: detail?.message ?? 'Drawing is restricted to block cells in this mode.',
      });
    }
    window.addEventListener('quiltstudio:save-success', handleSaveSuccess);
    window.addEventListener('quiltstudio:invalid-drop', handleInvalidDrop);
    window.addEventListener('quiltstudio:fence-rejection', handleFenceRejection);
    return () => {
      window.removeEventListener('quiltstudio:save-success', handleSaveSuccess);
      window.removeEventListener('quiltstudio:invalid-drop', handleInvalidDrop);
      window.removeEventListener('quiltstudio:fence-rejection', handleFenceRejection);
    };
  }, [toast]);

  return (
    <>
      <div className="h-12 bg-[var(--color-bg)] border-b border-[var(--color-border)]/15 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <TooltipHint
            name="Command palette"
            shortcut="Ctrl+K"
            description="Search every action — Save, Export, Yardage, Zoom, libraries, and more."
          >
            <button
              type="button"
              onClick={() => setPaletteOpen((prev) => !prev)}
              className="w-8 h-8 flex items-center justify-center rounded-full text-[var(--color-text-dim)]/50 hover:text-[var(--color-text)] hover:bg-[var(--color-border)] transition-colors duration-150"
              aria-label="Open command palette"
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
                <span
                  className="text-[14px] leading-[20px] text-[var(--color-text-dim)]/60 ml-1"
                  title={lastSavedAt.toLocaleString()}
                >
                  Saved {formatTimestamp(lastSavedAt)}
                </span>
              )}
            </div>
            <ModeChip />
          </div>
        </div>

        {/* Center: empty spacer */}
        <div className="absolute left-1/2 -translate-x-1/2" />

        {/* Right: mode actions + viewport controls + settings */}
        <div className="flex items-center gap-2">
          {showClearFabrics && (
            <TooltipHint
              name="Clear all fabrics"
              description="Strip every fabric fill from this template, leaving only the shape outlines."
            >
              <button
                type="button"
                onClick={handleClearFabrics}
                className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] leading-[18px] font-medium text-[var(--color-text)]/80 hover:text-[var(--color-text)] hover:bg-[var(--color-border)] transition-colors duration-150"
                aria-label="Clear all fabrics"
              >
                <Eraser size={14} />
                Clear fabrics
              </button>
            </TooltipHint>
          )}

          {showSaveAsTemplate && (
            <TooltipHint
              name="Save as Template"
              description="Snapshot this design as a reusable template in My Templates."
            >
              <button
                type="button"
                onClick={() => setSaveAsTemplateOpen(true)}
                className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] leading-[18px] font-medium text-[var(--color-text)]/80 hover:text-[var(--color-text)] hover:bg-[var(--color-border)] transition-colors duration-150"
                aria-label="Save as Template"
              >
                <Save size={14} />
                Save as Template
              </button>
            </TooltipHint>
          )}

          {!isPro && <ProUpgradeButton variant="studio" />}

          <EditPreviewToggle />
          <ReferenceImageToggle />
        </div>
      </div>

      <CommandPalette
        isOpen={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onSave={onSave ? () => void onSave() : undefined}
        onOpenImageExport={onOpenImageExport}
        onOpenPdfExport={onOpenPdfExport}
        onOpenHelp={onOpenHelp}
        onOpenHistory={onOpenHistory}
      />

      <SaveAsTemplateModal
        isOpen={saveAsTemplateOpen}
        onClose={() => setSaveAsTemplateOpen(false)}
      />
    </>
  );
}
