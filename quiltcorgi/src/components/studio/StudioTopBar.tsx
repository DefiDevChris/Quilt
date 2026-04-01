'use client';

import { useState } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { useCanvasStore } from '@/stores/canvasStore';
import { WorktableSwitcher } from '@/components/studio/WorktableSwitcher';
import { HamburgerDrawer } from '@/components/studio/HamburgerDrawer';
import { TooltipHint } from '@/components/ui/TooltipHint';

interface StudioTopBarProps {
  readonly onOpenImageExport?: () => void;
  readonly onOpenPdfExport?: () => void;
  readonly onOpenHelp?: () => void;
  readonly onSave?: () => void;
}

export function StudioTopBar({
  onOpenImageExport,
  onOpenPdfExport,
  onOpenHelp,
  onSave,
}: StudioTopBarProps) {
  const projectName = useProjectStore((s) => s.projectName);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isViewportLocked = useCanvasStore((s) => s.isViewportLocked);

  return (
    <>
      <div className="h-12 bg-surface border-b border-outline-variant/15 flex items-center justify-between px-5">
        {/* Left: Hamburger + Wordmark */}
        <div className="flex items-center gap-3">
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
              name={isViewportLocked ? 'Unlock Viewport' : 'Lock Viewport'}
              description={
                isViewportLocked ? 'Unlock to pan and zoom freely' : 'Lock viewport to centered fit'
              }
            >
              <button
                type="button"
                onClick={() =>
                  useCanvasStore.getState().setViewportLocked(!isViewportLocked)
                }
                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-surface-container transition-colors"
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
              <TooltipHint name="Recenter Viewport" description="Snap grid back to center of canvas">
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
            <div className="text-[13px] font-medium text-on-surface truncate max-w-48">
              {projectName}
            </div>
            <div className="text-[11px] text-on-surface/45">Quilt Canvas</div>
          </div>
          <button
            type="button"
            onClick={onOpenImageExport}
            className="bg-on-surface text-white rounded-md px-4 py-[6px] text-[12px] font-semibold tracking-wide hover:opacity-90 transition-opacity"
          >
            EXPORT
          </button>
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
