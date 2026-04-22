'use client';

import { useEffect, useRef } from 'react';
import { Palette, LayoutGrid, PencilRuler, X } from 'lucide-react';

interface ProjectModeModalProps {
  readonly open: boolean;
  readonly onSelect: (mode: 'template' | 'layout' | 'free-form') => void;
  readonly onDismiss: () => void;
}

const MODES = [
  {
    id: 'template' as const,
    name: 'Start from Template',
    Icon: Palette,
    description: 'Start with a fully designed quilt and tweak it',
  },
  {
    id: 'layout' as const,
    name: 'Start with Layout',
    Icon: LayoutGrid,
    description: 'Start with a grid or shape layout, then fill in',
  },
  {
    id: 'free-form' as const,
    name: 'Start Free-form',
    Icon: PencilRuler,
    description: 'Start with a blank canvas and draw or place blocks anywhere',
  },
];

/**
 * Modal shown on first entry into an empty project that prompts the user to
 * pick the studio interaction mode. Dismissible via ESC, backdrop click, or
 * the close button — dismissing is equivalent to "decide later" and the modal
 * will not re-appear thanks to a per-project localStorage flag in
 * `StudioLayout`.
 */
export function ProjectModeModal({ open, onSelect, onDismiss }: ProjectModeModalProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const firstBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    // Move initial focus into the dialog for keyboard users.
    requestAnimationFrame(() => firstBtnRef.current?.focus());
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onDismiss]);

  if (!open) return null;

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onDismiss();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-mode-modal-title"
        aria-describedby="project-mode-modal-description"
        className="relative bg-white rounded-2xl shadow-elevation-4 w-full max-w-3xl p-6 sm:p-8"
      >
        <button
          type="button"
          onClick={onDismiss}
          className="absolute right-4 top-4 w-8 h-8 flex items-center justify-center rounded-full text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:bg-[var(--color-border)] transition-colors"
          aria-label="Dismiss mode selector"
        >
          <X size={16} strokeWidth={1.75} />
        </button>

        <h2
          id="project-mode-modal-title"
          className="text-2xl font-semibold text-[var(--color-text)] mb-2 text-center pr-8"
        >
          How would you like to start?
        </h2>
        <p
          id="project-mode-modal-description"
          className="text-sm text-[var(--color-text-dim)] mb-6 text-center"
        >
          Choose how you want to begin your design. This sets the project mode
          and cannot be changed later — pick the approach that fits what
          you&apos;re making.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {MODES.map((mode, index) => {
            const Icon = mode.Icon;
            return (
              <button
                key={mode.id}
                ref={index === 0 ? firstBtnRef : null}
                type="button"
                onClick={() => onSelect(mode.id)}
                className="group flex flex-col items-center gap-4 rounded-xl border-2 border-[var(--color-border)]/20 bg-white p-6 text-center transition-all hover:border-primary hover:shadow-elevation-2 focus:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <span
                  className="w-12 h-12 flex items-center justify-center rounded-full bg-[var(--color-surface)] text-[var(--color-text)] group-hover:bg-primary/10 group-hover:text-primary transition-colors"
                  aria-hidden="true"
                >
                  <Icon size={24} strokeWidth={1.75} />
                </span>
                <div>
                  <h3 className="text-base font-semibold text-[var(--color-text)] mb-2">
                    {mode.name}
                  </h3>
                  <p className="text-sm text-[var(--color-text-dim)] leading-relaxed">
                    {mode.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
