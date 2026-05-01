'use client';

import { Blocks, LayoutTemplate } from 'lucide-react';

interface NewDesignModalProps {
  onBuildYourOwn: () => void;
  onUseTemplate: () => void;
}

const PATHS = [
  {
    id: 'template' as const,
    label: 'Use a Template',
    description: 'Start with a pre-designed quilt layout — customize it to make it yours.',
    icon: LayoutTemplate,
  },
  {
    id: 'build-your-own' as const,
    label: 'Build Your Own',
    description: 'Start from scratch. Pick a layout guide, set your size, and design block by block.',
    icon: Blocks,
  },
];

export function NewDesignModal({ onBuildYourOwn, onUseTemplate }: NewDesignModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-bg)]/80 backdrop-blur-sm">
      <div className="card shadow-elevated p-8 max-w-lg w-full mx-4">
        <h1 className="font-heading text-2xl font-bold text-[var(--color-text)] mb-2">
          New Design
        </h1>
        <p className="text-sm text-[var(--color-text-dim)] mb-6">
          How would you like to start?
        </p>

        <div className="grid gap-4">
          {PATHS.map((path) => {
            const Icon = path.icon;
            const onClick = path.id === 'template' ? onUseTemplate : onBuildYourOwn;

            return (
              <button
                key={path.id}
                onClick={onClick}
                className="group flex items-start gap-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-left transition-colors duration-150 hover:border-[var(--color-primary)] hover:bg-[var(--color-secondary)]"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-secondary)] text-[var(--color-primary)] transition-colors duration-150 group-hover:bg-[var(--color-primary)] group-hover:text-[var(--color-text-on-primary)]">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-heading text-base font-semibold text-[var(--color-text)]">
                    {path.label}
                  </div>
                  <div className="mt-1 text-sm text-[var(--color-text-dim)]">
                    {path.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
