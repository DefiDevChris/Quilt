'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useCanvasStore } from '@/stores/canvasStore';
import { LAYOUT } from '@/lib/design-system';
import {
  getContextualHelp,
  searchFaq,
  KEYBOARD_SHORTCUTS,
  FAQ_CATEGORY_LABELS,
  type FaqEntry,
  type FaqCategory,
} from '@/lib/help-content';
import { SUPPORT_EMAIL } from '@/lib/constants';

interface HelpPanelProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

function ContextualHelpSection() {
  const activeTool = useCanvasStore((s) => s.activeTool);
  const help = getContextualHelp(activeTool);

  return (
    <section className="mb-5">
      <h3 className="text-label-sm uppercase text-[var(--color-text-dim)] font-medium mb-2">
        About this tool
      </h3>
      <div className="bg-[var(--color-bg)] rounded-lg p-3">
        <div className="text-body-sm font-medium text-[var(--color-text)] capitalize mb-1">
          {activeTool} tool
        </div>
        <p className="text-body-sm text-[var(--color-text-dim)] leading-relaxed">{help}</p>
      </div>
    </section>
  );
}

function ShortcutsSection() {
  return (
    <section className="mb-5">
      <h3 className="text-label-sm uppercase text-[var(--color-text-dim)] font-medium mb-2">
        Keyboard Shortcuts
      </h3>
      <div className="bg-[var(--color-bg)] rounded-lg overflow-hidden">
        <table className="w-full text-body-sm">
          <tbody>
            {KEYBOARD_SHORTCUTS.map((shortcut) => (
              <tr
                key={shortcut.key}
                className="border-b border-[var(--color-border)]/[0.08] last:border-0"
              >
                <td className="px-3 py-1.5 text-[var(--color-text-dim)] w-[120px]">
                  <span className="font-mono bg-[var(--color-border)] px-1.5 py-0.5 rounded-lg text-[var(--color-text)]">
                    {shortcut.label}
                  </span>
                </td>
                <td className="px-3 py-1.5 text-[var(--color-text)]">{shortcut.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function FaqAccordion({ entries }: { readonly entries: readonly FaqEntry[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  const toggle = useCallback((id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  }, []);

  // Group entries by category
  const grouped = entries.reduce<Record<string, readonly FaqEntry[]>>((acc, entry) => {
    const existing = acc[entry.category] ?? [];
    return { ...acc, [entry.category]: [...existing, entry] };
  }, {});

  return (
    <section className="mb-5">
      <h3 className="text-label-sm uppercase text-[var(--color-text-dim)] font-medium mb-2">FAQ</h3>
      {Object.entries(grouped).map(([category, categoryEntries]) => (
        <div key={category} className="mb-3">
          <div className="text-body-sm font-medium text-[var(--color-text)] mb-1">
            {FAQ_CATEGORY_LABELS[category as FaqCategory]}
          </div>
          <div className="bg-[var(--color-bg)] rounded-lg overflow-hidden">
            {categoryEntries.map((entry) => {
              const isOpen = openId === entry.id;
              return (
                <div
                  key={entry.id}
                  className="border-b border-[var(--color-border)]/[0.08] last:border-0"
                >
                  <button
                    type="button"
                    onClick={() => toggle(entry.id)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${entry.id}`}
                    className="w-full flex items-center justify-between px-3 py-2.5 text-body-sm text-[var(--color-text)] hover:bg-[var(--color-border)] transition-colors text-left"
                  >
                    <span>{entry.title}</span>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      className={`flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    >
                      <path
                        d="M3 5L7 9L11 5"
                        stroke="currentColor"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  {isOpen && (
                    <div
                      id={`faq-answer-${entry.id}`}
                      className="px-3 pb-3 text-body-sm text-[var(--color-text-dim)] leading-relaxed"
                    >
                      {entry.content}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}

function LinksSection() {
  return (
    <section className="mb-5">
      <h3 className="text-label-sm uppercase text-[var(--color-text-dim)] font-medium mb-2">
        Learn More
      </h3>
      <div className="flex flex-col gap-1">
        <Link
          href="/help"
          className="text-body-sm text-[var(--color-primary)] hover:underline px-1 py-1"
        >
          Help Center
        </Link>
      </div>

      <h3 className="text-label-sm uppercase text-[var(--color-text-dim)] font-medium mt-4 mb-2">
        Contact Support
      </h3>
      <a
        href={`mailto:${SUPPORT_EMAIL}`}
        className="text-body-sm text-[var(--color-primary)] hover:underline px-1 py-1"
      >
        {SUPPORT_EMAIL}
      </a>
    </section>
  );
}

export function HelpPanel({ isOpen, onClose }: HelpPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

  // Escape key to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const faqResults = searchFaq(debouncedQuery);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-[var(--color-primary)]/20 z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: 360 }}
            animate={{ x: 0 }}
            exit={{ x: 360 }}
            transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
            className={`fixed top-0 right-0 bottom-0 w-[${LAYOUT.helpPanelWidth}] bg-[var(--color-bg)] shadow-[0_1px_2px_rgba(54,49,45,0.08)] z-50 flex flex-col`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 h-12 flex-shrink-0 border-b border-[var(--color-border)]/[0.08]">
              <span className="font-semibold text-[1.125rem] text-[var(--color-text)]">Help</span>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg)] transition-colors"
                aria-label="Close help panel"
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

            {/* Search */}
            <div className="px-4 py-3 flex-shrink-0">
              <div className="relative">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-dim)]"
                >
                  <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4" />
                  <path
                    d="M10.5 10.5L14 14"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Search help..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search help articles"
                  className="w-full pl-9 pr-3 py-2 text-body-sm bg-[var(--color-bg)] rounded-lg border-none outline-none placeholder:text-[var(--color-text-dim)]/60 text-[var(--color-text)] focus:ring-1 focus:ring-primary/40"
                />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              <ContextualHelpSection />
              <ShortcutsSection />
              <FaqAccordion entries={faqResults} />
              <LinksSection />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
