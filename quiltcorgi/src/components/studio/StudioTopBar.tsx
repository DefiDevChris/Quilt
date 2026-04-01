'use client';

import { useState } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { WorktableSwitcher } from '@/components/studio/WorktableSwitcher';
import { HamburgerDrawer } from '@/components/studio/HamburgerDrawer';

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

  return (
    <>
      <div className="h-12 bg-surface border-b border-outline-variant/8 flex items-center justify-between px-5">
        {/* Left: Hamburger + Wordmark */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setDrawerOpen((prev) => !prev)}
            className="w-8 h-8 flex items-center justify-center rounded-md text-on-surface/40 hover:text-on-surface hover:bg-surface-container transition-colors"
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

        {/* Right: Project info + Export */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-[13px] font-medium text-on-surface truncate max-w-48">
              {projectName}
            </div>
            <div className="text-[11px] text-on-surface/35">Quilt Canvas</div>
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
            className="w-8 h-8 flex items-center justify-center rounded-md text-on-surface/35 hover:text-on-surface hover:bg-surface-container transition-colors"
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
