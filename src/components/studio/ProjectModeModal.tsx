'use client';

import React from 'react';
import { LayoutTemplate, Grid3X3, PenTool } from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';

const MODES = [
  {
    id: 'template' as const,
    label: 'Template',
    description: 'Start from a complete quilt with bundled fabrics — swap or clear them',
    icon: LayoutTemplate,
  },
  {
    id: 'layout' as const,
    label: 'Layout',
    description: 'Pick a structure with block, sashing, and border areas to fill',
    icon: Grid3X3,
  },
  {
    id: 'free-form' as const,
    label: 'Freeform',
    description: 'Pick a quilt size, then build the whole thing with shape tools',
    icon: PenTool,
  },
] as const;

/**
 * Mode-selection modal — the first thing users see when creating a new project.
 * Calls setMode() which sets modeSelected: true, triggering the phase
 * transition in StudioClient automatically via store subscription.
 */
export function ProjectModeModal() {
  const setMode = useProjectStore((s) => s.setMode);

  const handleSelect = (mode: 'template' | 'layout' | 'free-form') => {
    setMode(mode);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div className="absolute inset-0 bg-black/40" />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="mode-modal-title"
        className="relative z-10 w-full max-w-xl rounded-lg bg-[var(--color-surface)] p-8 shadow-elevated"
      >
        <h2
          id="mode-modal-title"
          className="mb-2 text-center text-2xl font-semibold text-[var(--color-text)]"
        >
          Choose Your Mode
        </h2>
        <p className="mb-6 text-center text-sm text-[var(--color-text-dim)]">
          How would you like to start designing?
        </p>

        <div className="grid grid-cols-3 gap-4">
          {MODES.map((mode) => (
            <button
              key={mode.id}
              onClick={() => handleSelect(mode.id)}
              className="
                flex flex-col items-center gap-3 rounded-lg border-2 border-transparent
                bg-[var(--color-bg)] p-6
                transition-colors duration-150
                hover:border-[var(--color-primary)] hover:bg-[var(--color-secondary)]
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]
              "
            >
              <mode.icon className="h-10 w-10 text-[var(--color-primary)]" />
              <div className="text-center">
                <div className="font-semibold text-[var(--color-text)]">{mode.label}</div>
                <div className="mt-1 text-xs leading-snug text-[var(--color-text-dim)]">
                  {mode.description}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
