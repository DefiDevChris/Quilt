'use client';

import React from 'react';
import { Grid3X3, Layers } from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';

interface ProjectModeModalProps {
  onModeSelected: () => void;
}

/**
 * ProjectModeModal
 *
 * Gate modal rendered when no project mode has been chosen yet. Presents two
 * cards — Quilt Design and Fabric Library — and writes the choice into the
 * project store before calling `onModeSelected` to let the parent unmount it.
 *
 * Brand notes (enforced here):
 *  - Panel: rounded-lg (rounded-2xl banned), bg-[var(--color-surface)] (bg-white banned)
 *  - Cards: rounded-lg (rounded-xl banned), transition-colors duration-150 (no scale/shadow pop)
 *  - Shadow: shadow-elevated (shadow-elevation-* utilities are undefined)
 *  - Backdrop: no role attribute (ARIA 1.2 deprecates role="presentation" on decorative divs)
 */
export function ProjectModeModal({ onModeSelected }: ProjectModeModalProps) {
  const setProjectMode = useProjectStore((s) => s.setProjectMode);

  const handleModeSelect = (mode: 'quilt' | 'fabric-library') => {
    setProjectMode(mode);
    onModeSelected();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onModeSelected();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Dialog panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="mode-modal-title"
        className="relative z-10 w-full max-w-md rounded-lg bg-[var(--color-surface)] p-8 shadow-elevated"
      >
        <h2
          id="mode-modal-title"
          className="mb-2 text-center text-2xl font-semibold text-[var(--color-text)]"
        >
          Choose Project Type
        </h2>
        <p className="mb-6 text-center text-sm text-[var(--color-text-muted)]">Select how you want to work</p>

        <div className="grid grid-cols-2 gap-4">
          {/* Quilt Design card */}
          <button
            onClick={() => handleModeSelect('quilt')}
            className="
              flex flex-col items-center gap-3 rounded-lg border-2 border-transparent
              bg-[var(--color-surface-alt)] p-6
              transition-colors duration-150
              hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-light)]
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]
            "
          >
            <Grid3X3 className="h-8 w-8 text-[var(--color-primary)]" />
            <div className="text-center">
              <div className="font-medium text-[var(--color-text)]">Quilt Design</div>
              <div className="text-xs text-[var(--color-text-muted)]">Design quilts block by block</div>
            </div>
          </button>

          {/* Fabric Library card */}
          <button
            onClick={() => handleModeSelect('fabric-library')}
            className="
              flex flex-col items-center gap-3 rounded-lg border-2 border-transparent
              bg-[var(--color-surface-alt)] p-6
              transition-colors duration-150
              hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-light)]
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]
            "
          >
            <Layers className="h-8 w-8 text-[var(--color-primary)]" />
            <div className="text-center">
              <div className="font-medium text-[var(--color-text)]">Fabric Library</div>
              <div className="text-xs text-[var(--color-text-muted)]">Manage your fabric stash</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
