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
      <div className="h-12 bg-surface flex items-center justify-between px-4">
        {/* Left: Hamburger + Wordmark */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setDrawerOpen((prev) => !prev)}
            className="w-9 h-9 flex items-center justify-center rounded-md text-secondary hover:text-on-surface hover:bg-surface-container transition-colors"
            aria-label="Open menu"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M3 5H17M3 10H17M3 15H17"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <span className="font-semibold text-[1.125rem] text-on-surface">QuiltCorgi</span>
        </div>

        {/* Center: WorktableSwitcher */}
        <div className="absolute left-1/2 -translate-x-1/2" data-tour="worktable-switcher">
          <WorktableSwitcher />
        </div>

        {/* Right: Project info + Export */}
        <div className="flex items-center gap-3">
          <div className="text-right mr-2">
            <div className="text-label-lg font-medium text-secondary truncate max-w-40">
              {projectName}
            </div>
            <div className="text-body-sm text-outline-variant">Layer 1 Active</div>
          </div>
          <button
            type="button"
            onClick={onOpenImageExport}
            className="bg-on-surface text-white rounded-md px-[1rem] py-[0.5rem] text-sm font-medium hover:opacity-90 transition-opacity"
          >
            EXPORT
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
