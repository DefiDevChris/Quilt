'use client';

import { useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  KEYBOARD_SHORTCUTS,
  SHORTCUT_CATEGORY_LABELS,
  type ShortcutCategory,
} from '@/lib/help-content';

interface KeyboardShortcutsModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

const CATEGORY_ORDER: readonly ShortcutCategory[] = ['tools', 'panels', 'editing', 'canvas'];

function groupByCategory() {
  const grouped = new Map<ShortcutCategory, typeof KEYBOARD_SHORTCUTS>();

  for (const shortcut of KEYBOARD_SHORTCUTS) {
    const existing = grouped.get(shortcut.category) ?? [];
    grouped.set(shortcut.category, [...existing, shortcut]);
  }

  return grouped;
}

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  const grouped = groupByCategory();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-on-surface/30 z-50"
            style={{ backdropFilter: 'blur(4px)' }}
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Keyboard shortcuts"
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: 'tween', duration: 0.2, ease: 'easeOut' }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-xl bg-surface shadow-elevation-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/[0.08]">
              <h2 className="text-lg font-semibold text-on-surface">Keyboard Shortcuts</h2>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-md text-secondary hover:text-on-surface hover:bg-surface-container transition-colors"
                aria-label="Close"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path
                    d="M4 4L14 14M14 4L4 14"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            {/* Shortcuts grid */}
            <div className="p-5 space-y-5">
              {CATEGORY_ORDER.map((category) => {
                const shortcuts = grouped.get(category);
                if (!shortcuts?.length) return null;
                return (
                  <div key={category}>
                    <h3 className="text-xs uppercase tracking-wider text-secondary font-medium mb-2">
                      {SHORTCUT_CATEGORY_LABELS[category]}
                    </h3>
                    <div className="bg-surface-container rounded-lg overflow-hidden">
                      {shortcuts.map((shortcut, i) => (
                        <div
                          key={shortcut.key}
                          className={`flex items-center justify-between px-3 py-2 text-sm ${
                            i > 0 ? 'border-t border-outline-variant/[0.06]' : ''
                          }`}
                        >
                          <span className="text-on-surface">{shortcut.description}</span>
                          <kbd className="font-mono text-xs bg-surface-container-high px-2 py-0.5 rounded text-on-surface">
                            {shortcut.label}
                          </kbd>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
