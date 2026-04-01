'use client';

import { useState, useEffect } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { useCanvasStore } from '@/stores/canvasStore';
import { WorktableSwitcher } from '@/components/studio/WorktableSwitcher';
import { HamburgerDrawer } from '@/components/studio/HamburgerDrawer';
import { TooltipHint } from '@/components/ui/TooltipHint';
import { useToast } from '@/components/ui/ToastProvider';

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

interface StudioTopBarProps {
  readonly onOpenImageExport?: () => void;
  readonly onOpenPdfExport?: () => void;
  readonly onOpenHelp?: () => void;
  readonly onSave?: () => void;
  readonly onOpenHistory?: () => void;
}

export function StudioTopBar({
  onOpenImageExport,
  onOpenPdfExport,
  onOpenHelp,
  onSave,
  onOpenHistory,
}: StudioTopBarProps) {
  const projectName = useProjectStore((s) => s.projectName);
  const isDirty = useProjectStore((s) => s.isDirty);
  const lastSavedAt = useProjectStore((s) => s.lastSavedAt);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isViewportLocked = useCanvasStore((s) => s.isViewportLocked);
  const { toast } = useToast();

  // Listen for save success events
  useEffect(() => {
    function handleSaveSuccess() {
      toast({
        type: 'success',
        title: 'Saved',
        description: 'Your project has been saved',
      });
    }
    window.addEventListener('quiltcorgi:save-success', handleSaveSuccess);
    return () => window.removeEventListener('quiltcorgi:save-success', handleSaveSuccess);
  }, [toast]);

  return (
    <>
      <div className="h-12 bg-surface border-b border-outline-variant/15 flex items-center justify-between px-5">
        {/* Left: Hamburger + Wordmark */}
        <div className="flex items-center gap-3">
          <TooltipHint name="Menu" description="Access project settings and options" mascot="/mascots&avatars/corgi5.png">
            <button
              type="button"
              onClick={() => setDrawerOpen((prev) => !prev)}
              className="w-8 h-8 flex items-center justify-center rounded-md text-on-surface/50 hover:text-on-surface hover:bg-surface-container transition-colors"
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
          <span className="font-semibold text-[15px] text-on-surface tracking-[-0.01em]">
            QuiltCorgi
          </span>
        </div>

        {/* Center: WorktableSwitcher */}
        <div className="absolute left-1/2 -translate-x-1/2" data-tour="worktable-switcher">
          <WorktableSwitcher />
        </div>

        {/* Right: Viewport controls + Project info + Export */}
        <div className="flex items-center gap-4">
          {/* Viewport lock/unlock + recenter */}
          <div className="flex items-center gap-1">
            <TooltipHint
              name={isViewportLocked ? 'Viewport Locked' : 'Viewport Unlocked'}
              description={
                isViewportLocked 
                  ? 'Click to unlock and pan/zoom freely' 
                  : 'Click to lock viewport to centered fit'
              }
              mascot="/mascots&avatars/corgi29.png"
            >
              <button
                type="button"
                onClick={() =>
                  useCanvasStore.getState().setViewportLocked(!isViewportLocked)
                }
                className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors ${
                  isViewportLocked 
                    ? 'hover:bg-surface-container' 
                    : 'bg-primary/10 hover:bg-primary/20'
                }`}
                aria-label={isViewportLocked ? 'Unlock viewport' : 'Lock viewport'}
              >
                {isViewportLocked ? (
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="#4a3b32" strokeWidth="1.4">
                    <rect
                      x="4"
                      y="9"
                      width="12"
                      height="8"
                      rx="2"
                    />
                    <path
                      d="M7 9V6C7 4.34 8.34 3 10 3C11.66 3 13 4.34 13 6V9"
                      strokeLinecap="round"
                    />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="#4a3b32" strokeWidth="1.4">
                    <rect
                      x="4"
                      y="9"
                      width="12"
                      height="8"
                      rx="2"
                    />
                    <path
                      d="M7 9V6C7 4.34 8.34 3 10 3C11.66 3 13 4.34 13 6V7"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
              </button>
            </TooltipHint>

            {/* Quick recenter — only visible when unlocked */}
            {!isViewportLocked && (
              <TooltipHint name="Recenter Viewport" description="Snap grid back to center of canvas" mascot="/mascots&avatars/corgi1.png">
                <button
                  type="button"
                  onClick={() => useCanvasStore.getState().centerAndFitViewport()}
                  className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-surface-container transition-colors"
                  aria-label="Recenter viewport"
                >
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="#4a3b32" strokeWidth="1.4">
                    <circle
                      cx="10"
                      cy="10"
                      r="3"
                    />
                    <path
                      d="M10 3V7M10 13V17M3 10H7M13 10H17"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </TooltipHint>
            )}
          </div>

          <div className="text-right">
            <div className="flex items-center gap-2">
              <div className="text-[13px] font-medium text-on-surface truncate max-w-48">
                {projectName}
              </div>
              {isDirty && (
                <div className="w-1.5 h-1.5 rounded-full bg-warning" title="Unsaved changes" />
              )}
            </div>
            <div className="text-[11px] text-on-surface/45">
              {lastSavedAt ? `Saved ${formatTimestamp(lastSavedAt)}` : 'Quilt Canvas'}
            </div>
          </div>
          <TooltipHint name="Export" description="Export your quilt as PNG, SVG, or PDF" mascot="/mascots&avatars/corgi23.png">
            <button
              type="button"
              onClick={onOpenImageExport}
              className="bg-on-surface text-white rounded-md px-4 py-[6px] text-[12px] font-semibold tracking-wide hover:opacity-90 transition-opacity"
            >
              EXPORT
            </button>
          </TooltipHint>
          <TooltipHint name="History" description="View and restore previous states" mascot="/mascots&avatars/corgi25.png">
            <button
              type="button"
              onClick={onOpenHistory}
              aria-label="History"
              className="w-8 h-8 flex items-center justify-center rounded-md text-on-surface/45 hover:text-on-surface hover:bg-surface-container transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <path
                  d="M4 10C4 6.7 6.7 4 10 4C13.3 4 16 6.7 16 10C16 13.3 13.3 16 10 16C7.8 16 5.9 14.8 5 13"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M10 7V10L12 12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M5 13L3 11L5 9"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </TooltipHint>
          <TooltipHint name="Help" description="View keyboard shortcuts and tutorials" mascot="/mascots&avatars/corgi3.png">
            <button
              type="button"
              onClick={onOpenHelp}
              aria-label="Help"
              className="w-8 h-8 flex items-center justify-center rounded-md text-on-surface/45 hover:text-on-surface hover:bg-surface-container transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" />
                <path
                  d="M8 7.5C8 6.5 8.8 5.5 10 5.5C11.2 5.5 12 6.5 12 7.5C12 8.5 11 9 10 9.5V10.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <circle cx="10" cy="13" r="0.75" fill="currentColor" />
              </svg>
            </button>
          </TooltipHint>
        </div>
      </div>

      <HamburgerDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSave={onSave}
        onOpenImageExport={onOpenImageExport}
        onOpenPdfExport={onOpenPdfExport}
        onOpenHelp={onOpenHelp}
      />
    </>
  );
}
