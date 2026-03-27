'use client';

import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface HamburgerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MenuItem {
  label: string;
  shortcut?: string;
  onClick?: () => void;
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

const MENU_GROUPS: MenuGroup[] = [
  {
    title: 'File',
    items: [
      { label: 'New', shortcut: 'Ctrl+N' },
      { label: 'Open', shortcut: 'Ctrl+O' },
      { label: 'Save', shortcut: 'Ctrl+S' },
      { label: 'Save As', shortcut: 'Ctrl+Shift+S' },
      { label: 'Import/Export Image' },
      { label: 'Export PDF' },
      { label: 'Print', shortcut: 'Ctrl+P' },
      { label: 'Properties' },
      { label: 'Close' },
    ],
  },
  {
    title: 'Edit',
    items: [
      { label: 'Undo', shortcut: 'Ctrl+Z' },
      { label: 'Redo', shortcut: 'Ctrl+Shift+Z' },
      { label: 'Cut', shortcut: 'Ctrl+X' },
      { label: 'Copy', shortcut: 'Ctrl+C' },
      { label: 'Paste', shortcut: 'Ctrl+V' },
      { label: 'Duplicate', shortcut: 'Ctrl+D' },
      { label: 'Delete', shortcut: 'Del' },
      { label: 'Select All', shortcut: 'Ctrl+A' },
      { label: 'Preferences' },
    ],
  },
  {
    title: 'View',
    items: [
      { label: 'Zoom In', shortcut: 'Ctrl+=' },
      { label: 'Zoom Out', shortcut: 'Ctrl+-' },
      { label: 'Fit to Screen' },
      { label: 'Show/Hide Grid' },
      { label: 'Show/Hide Rulers' },
      { label: 'Show/Hide Guides' },
    ],
  },
  {
    title: 'Libraries',
    items: [
      { label: 'Block Library', shortcut: 'B' },
      { label: 'Fabric Library', shortcut: 'F' },
      { label: 'Sketchbook' },
      { label: 'Import' },
    ],
  },
  {
    title: 'Help',
    items: [
      { label: 'Keyboard Shortcuts', shortcut: '?' },
      { label: 'Getting Started' },
      { label: 'About QuiltCorgi' },
    ],
  },
];

export function HamburgerDrawer({ isOpen, onClose }: HamburgerDrawerProps) {
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, handleEscape]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-on-surface/20 z-40"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
            className="fixed top-0 left-0 bottom-0 w-[280px] bg-surface shadow-elevation-3 z-50 overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 h-12">
              <span className="font-semibold text-[1.125rem] text-on-surface">
                QuiltCorgi
              </span>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-md text-secondary hover:text-on-surface hover:bg-surface-container transition-colors"
                aria-label="Close menu"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M4 4L14 14M14 4L4 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Menu Groups */}
            <nav className="px-2 pb-4">
              {MENU_GROUPS.map((group, groupIdx) => (
                <div key={group.title}>
                  {groupIdx > 0 && (
                    <div className="my-[2.75rem] mx-2 border-t border-outline-variant/[0.08]" />
                  )}
                  <div className="px-2 py-1.5 text-label-sm uppercase text-secondary tracking-[0.02em] font-medium">
                    {group.title}
                  </div>
                  {group.items.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => {
                        item.onClick?.();
                        onClose();
                      }}
                      className="w-full flex items-center justify-between px-2 py-[1rem] text-body-md text-on-surface rounded-md hover:bg-surface-container transition-colors"
                    >
                      <span>{item.label}</span>
                      {item.shortcut && (
                        <span className="font-mono text-secondary text-body-sm">
                          {item.shortcut}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              ))}
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
