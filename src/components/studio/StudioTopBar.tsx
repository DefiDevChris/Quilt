'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Save,
  Eraser,
  Menu,
  ChevronLeft,
} from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';
import { useCanvasStore } from '@/stores/canvasStore';
import { useAuthStore } from '@/stores/authStore';
import { useLayoutStore } from '@/stores/layoutStore';

import { CommandPalette } from '@/components/studio/CommandPalette';
import { SaveAsTemplateModal } from '@/components/studio/SaveAsTemplateModal';
import { EditPreviewToggle } from '@/components/studio/EditPreviewToggle';
import { ReferenceImageToggle } from '@/components/studio/ReferenceImageToggle';
import { ModeChip } from '@/components/studio/ModeChip';
import { PrintListButton } from '@/components/photo-to-quilt/PrintListButton';
import { TooltipHint } from '@/components/ui/TooltipHint';
import { useToast } from '@/components/ui/ToastProvider';
import { clearAllFabricsOnCanvas } from '@/lib/canvas-clear-fabrics';
import { formatTimestamp } from '@/lib/date-format';

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
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [saveAsTemplateOpen, setSaveAsTemplateOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const { toast } = useToast();
  const getCanvas = () => useCanvasStore.getState().fabricCanvas;

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
              <Menu size={18} />
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
              <ChevronLeft size={14} />
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

      <EditPreviewToggle />
      <ReferenceImageToggle />
      <PrintListButton />
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
