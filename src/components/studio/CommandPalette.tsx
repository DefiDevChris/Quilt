'use client';

/**
 * CommandPalette — Cmd+K / Ctrl+K searchable action palette.
 *
 * A centered modal containing a fuzzy-filterable list of every action a
 * user might reach for: Save, Export, Zoom, Yardage, Block / Fabric
 * libraries, etc.
 *
 * Conventions:
 *  • Keyboard nav: ↑ / ↓ moves selection, Enter triggers, Esc closes.
 *  • The hamburger icon in StudioTopBar opens this palette (not a drawer).
 *  • Cmd+K (Mac) or Ctrl+K (Windows/Linux) toggles globally.
 *  • Each command has an optional shortcut that we surface but do not
 *    re-bind here — the canvas already owns those bindings.
 *  • Undo/Redo intentionally NOT included as commands. They live in the
 *    left toolbar + keyboard shortcuts only — keeping them out of the
 *    palette removes the duplication that the cleanup brief flagged.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Save,
  Download,
  FileText,
  Palette,
  Boxes,
  Calculator,
  ZoomIn,
  ZoomOut,
  Maximize2,
  HelpCircle,
  History as HistoryIcon,
  Copy,
  Trash2,
  CheckSquare,
  LogOut,
  Search,
} from 'lucide-react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useProjectStore } from '@/stores/projectStore';
import { useBlockStore } from '@/stores/blockStore';
import { useFabricStore } from '@/stores/fabricStore';
import { useYardageStore } from '@/stores/yardageStore';
import { useCanvasContext } from '@/contexts/CanvasContext';
import { ZOOM_FACTOR } from '@/lib/constants';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
  onOpenImageExport?: () => void;
  onOpenPdfExport?: () => void;
  onOpenHelp?: () => void;
  onOpenHistory?: () => void;
}

interface CommandDefinition {
  id: string;
  label: string;
  /** Comma-separated keywords used by the fuzzy filter (lower-cased). */
  keywords: string;
  group: 'File' | 'Edit' | 'View' | 'Libraries' | 'Help';
  shortcut?: string;
  icon: React.ReactNode;
  /** Returning true keeps the palette open; falsy/void closes it. */
  onSelect: () => boolean | void;
}

export function CommandPalette({
  isOpen,
  onClose,
  onSave,
  onOpenImageExport,
  onOpenPdfExport,
  onOpenHelp,
  onOpenHistory,
}: CommandPaletteProps) {
  const router = useRouter();
  const { getCanvas } = useCanvasContext();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  // Reset state on every open so the palette feels fresh
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIndex(0);
      // Defer focus to the next paint so the input mounts first
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // ── Command definitions ─────────────────────────────────────────
  const commands = useMemo<CommandDefinition[]>(() => {
    const fabricCanvas = getCanvas();

    const handleDuplicate = async () => {
      if (!fabricCanvas) return;
      const fabric = await import('fabric');
      const canvas = fabricCanvas as InstanceType<typeof fabric.Canvas>;
      const active = canvas.getActiveObjects();
      if (active.length === 0) return;
      const json = JSON.stringify(canvas.toJSON());
      useCanvasStore.getState().pushUndoState(json);
      const clones = await Promise.all(active.map((obj) => obj.clone()));
      canvas.discardActiveObject();
      const OFFSET = 20;
      clones.forEach((clone) => {
        clone.set({ left: (clone.left ?? 0) + OFFSET, top: (clone.top ?? 0) + OFFSET });
        canvas.add(clone);
      });
      canvas.requestRenderAll();
      useProjectStore.getState().setDirty(true);
    };

    const handleDelete = async () => {
      if (!fabricCanvas) return;
      const fabric = await import('fabric');
      const canvas = fabricCanvas as InstanceType<typeof fabric.Canvas>;
      const active = canvas.getActiveObjects();
      if (active.length === 0) return;
      active.forEach((obj) => canvas.remove(obj));
      canvas.discardActiveObject();
      const json = JSON.stringify(canvas.toJSON());
      useCanvasStore.getState().pushUndoState(json);
      useProjectStore.getState().setDirty(true);
      canvas.renderAll();
    };

    const handleSelectAll = async () => {
      if (!fabricCanvas) return;
      const fabric = await import('fabric');
      const canvas = fabricCanvas as InstanceType<typeof fabric.Canvas>;
      const allObjects = canvas.getObjects();
      const userObjects = allObjects.filter(
        (obj) => !(obj as unknown as { _layoutElement?: boolean })._layoutElement,
      );
      if (userObjects.length > 0) {
        const selection = new fabric.ActiveSelection(userObjects, { canvas });
        canvas.setActiveObject(selection);
        canvas.requestRenderAll();
      }
    };

    const handleZoomIn = () => {
      const { zoom, zoomAtPoint } = useCanvasStore.getState();
      zoomAtPoint(zoom * ZOOM_FACTOR, fabricCanvas);
    };

    const handleZoomOut = () => {
      const { zoom, zoomAtPoint } = useCanvasStore.getState();
      zoomAtPoint(zoom / ZOOM_FACTOR, fabricCanvas);
    };

    const handleFitToScreen = () => {
      const { canvasWidth, canvasHeight } = useProjectStore.getState();
      useCanvasStore.getState().centerAndFitViewport(fabricCanvas, canvasWidth, canvasHeight);
    };

    const list: CommandDefinition[] = [
      // ── File ──
      {
        id: 'save',
        label: 'Save Project',
        keywords: 'save store persist write',
        group: 'File',
        shortcut: 'Ctrl+S',
        icon: <Save size={16} />,
        onSelect: () => onSave?.(),
      },
      {
        id: 'export-image',
        label: 'Export Image…',
        keywords: 'export image png jpg picture render',
        group: 'File',
        icon: <Download size={16} />,
        onSelect: () => onOpenImageExport?.(),
      },
      {
        id: 'export-pdf',
        label: 'Export PDF…',
        keywords: 'export pdf print pattern cutting template',
        group: 'File',
        icon: <FileText size={16} />,
        onSelect: () => onOpenPdfExport?.(),
      },
      {
        id: 'back-to-dashboard',
        label: 'Back to Dashboard',
        keywords: 'close exit dashboard home leave',
        group: 'File',
        icon: <LogOut size={16} />,
        onSelect: () => {
          const isDirty = useProjectStore.getState().isDirty;
          if (isDirty && onSave) onSave();
          router.push('/dashboard');
        },
      },
      // ── Edit (no Undo/Redo — those live in the toolbar + shortcuts only) ──
      {
        id: 'duplicate',
        label: 'Duplicate Selection',
        keywords: 'duplicate copy clone repeat',
        group: 'Edit',
        shortcut: 'Ctrl+D',
        icon: <Copy size={16} />,
        onSelect: () => {
          void handleDuplicate();
        },
      },
      {
        id: 'delete',
        label: 'Delete Selection',
        keywords: 'delete remove erase trash',
        group: 'Edit',
        shortcut: 'Del',
        icon: <Trash2 size={16} />,
        onSelect: () => {
          void handleDelete();
        },
      },
      {
        id: 'select-all',
        label: 'Select All',
        keywords: 'select all everything pick',
        group: 'Edit',
        shortcut: 'Ctrl+A',
        icon: <CheckSquare size={16} />,
        onSelect: () => {
          void handleSelectAll();
        },
      },
      // ── View ──
      {
        id: 'zoom-in',
        label: 'Zoom In',
        keywords: 'zoom in larger bigger magnify',
        group: 'View',
        shortcut: 'Ctrl+=',
        icon: <ZoomIn size={16} />,
        onSelect: handleZoomIn,
      },
      {
        id: 'zoom-out',
        label: 'Zoom Out',
        keywords: 'zoom out smaller shrink',
        group: 'View',
        shortcut: 'Ctrl+-',
        icon: <ZoomOut size={16} />,
        onSelect: handleZoomOut,
      },
      {
        id: 'fit-screen',
        label: 'Fit to Screen',
        keywords: 'fit screen center reset view all',
        group: 'View',
        icon: <Maximize2 size={16} />,
        onSelect: handleFitToScreen,
      },
      // ── Libraries ──
      {
        id: 'block-library',
        label: 'Toggle Block Library',
        keywords: 'block library blocks panel show',
        group: 'Libraries',
        shortcut: 'B',
        icon: <Boxes size={16} />,
        onSelect: () => useBlockStore.getState().togglePanel(),
      },
      {
        id: 'fabric-library',
        label: 'Toggle Fabric Library',
        keywords: 'fabric library fabrics panel swatches',
        group: 'Libraries',
        shortcut: 'F',
        icon: <Palette size={16} />,
        onSelect: () => useFabricStore.getState().togglePanel(),
      },
      {
        id: 'yardage-calculator',
        label: 'Yardage Calculator',
        keywords: 'yardage fabric requirements yards calculator material shopping',
        group: 'Libraries',
        icon: <Calculator size={16} />,
        onSelect: () => useYardageStore.getState().setPanelOpen(true),
      },
      // ── Help ──
      {
        id: 'history',
        label: 'Project History',
        keywords: 'history versions timeline log',
        group: 'Help',
        icon: <HistoryIcon size={16} />,
        onSelect: () => onOpenHistory?.(),
      },
      {
        id: 'shortcuts',
        label: 'Keyboard Shortcuts',
        keywords: 'shortcuts hotkeys help cheatsheet',
        group: 'Help',
        shortcut: '?',
        icon: <HelpCircle size={16} />,
        onSelect: () => onOpenHelp?.(),
      },
    ];

    return list;
  }, [getCanvas, onSave, onOpenImageExport, onOpenPdfExport, onOpenHelp, onOpenHistory, router]);

  // ── Filter ───────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    const tokens = q.split(/\s+/);
    return commands.filter((cmd) => {
      const haystack = `${cmd.label} ${cmd.keywords} ${cmd.group}`.toLowerCase();
      return tokens.every((t) => haystack.includes(t));
    });
  }, [query, commands]);

  // Keep activeIndex within bounds when the filter result shrinks
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (activeIndex >= filtered.length) {
      setActiveIndex(Math.max(0, filtered.length - 1));
    }
  }, [filtered.length, activeIndex]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Group filtered results for display while preserving global index for nav
  const grouped = useMemo(() => {
    const out: Array<{ group: string; items: Array<{ cmd: CommandDefinition; index: number }> }> = [];
    filtered.forEach((cmd, index) => {
      const last = out[out.length - 1];
      if (last && last.group === cmd.group) {
        last.items.push({ cmd, index });
      } else {
        out.push({ group: cmd.group, items: [{ cmd, index }] });
      }
    });
    return out;
  }, [filtered]);

  // Trigger the active command and close
  const triggerActive = useCallback(() => {
    const cmd = filtered[activeIndex];
    if (!cmd) return;
    const keepOpen = cmd.onSelect();
    if (!keepOpen) onClose();
  }, [filtered, activeIndex, onClose]);

  const handleKey = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        triggerActive();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    },
    [filtered.length, triggerActive, onClose],
  );

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
            className="fixed inset-0 bg-[var(--color-text)]/40 z-50"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Palette */}
          <motion.div
            role="dialog"
            aria-label="Command palette"
            aria-modal="true"
            initial={{ opacity: 0, y: -16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
            className="fixed left-1/2 top-[15%] -translate-x-1/2 w-[min(560px,calc(100vw-32px))] max-h-[70vh] z-50 flex flex-col bg-[var(--color-bg)] border border-[var(--color-border)]/40 rounded-lg shadow-elevated overflow-hidden"
          >
            {/* Search bar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--color-border)]/30">
              <Search size={16} className="text-[var(--color-text-dim)]" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={handleKey}
                placeholder="Type a command…"
                className="flex-1 bg-transparent outline-none text-[14px] text-[var(--color-text)] placeholder:text-[var(--color-text-dim)]"
                aria-label="Search commands"
                aria-autocomplete="list"
              />
              <kbd className="text-[10px] font-mono text-[var(--color-text-dim)] px-1.5 py-0.5 rounded border border-[var(--color-border)]/40">
                Esc
              </kbd>
            </div>

            {/* Results list */}
            <div ref={listRef} className="flex-1 overflow-y-auto py-1" role="listbox">
              {filtered.length === 0 ? (
                <div className="px-4 py-8 text-center text-[13px] text-[var(--color-text-dim)]">
                  No commands match &quot;{query}&quot;
                </div>
              ) : (
                grouped.map(({ group, items }) => (
                  <div key={group} className="py-1">
                    <div className="px-4 py-1 text-[10px] uppercase tracking-[0.08em] text-[var(--color-text-dim)] font-semibold">
                      {group}
                    </div>
                    {items.map(({ cmd, index }) => {
                      const isActive = index === activeIndex;
                      return (
                        <button
                          key={cmd.id}
                          type="button"
                          role="option"
                          aria-selected={isActive}
                          onMouseEnter={() => setActiveIndex(index)}
                          onClick={() => {
                            const keepOpen = cmd.onSelect();
                            if (!keepOpen) onClose();
                          }}
                          className={`w-full flex items-center justify-between gap-3 px-4 py-2 text-left transition-colors duration-150 ${
                            isActive
                              ? 'bg-[var(--color-primary)]/10 text-[var(--color-text)]'
                              : 'text-[var(--color-text)] hover:bg-[var(--color-border)]/30'
                          }`}
                        >
                          <span className="flex items-center gap-3 min-w-0">
                            <span
                              aria-hidden="true"
                              className={
                                isActive ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-dim)]'
                              }
                            >
                              {cmd.icon}
                            </span>
                            <span className="text-[13px] truncate">{cmd.label}</span>
                          </span>
                          {cmd.shortcut && (
                            <kbd className="font-mono text-[10px] text-[var(--color-text-dim)] px-1.5 py-0.5 rounded border border-[var(--color-border)]/40">
                              {cmd.shortcut}
                            </kbd>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer hint */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-[var(--color-border)]/30 text-[10px] text-[var(--color-text-dim)]">
              <span className="flex items-center gap-2">
                <kbd className="font-mono px-1.5 py-0.5 rounded border border-[var(--color-border)]/40">↑</kbd>
                <kbd className="font-mono px-1.5 py-0.5 rounded border border-[var(--color-border)]/40">↓</kbd>
                Navigate
              </span>
              <span className="flex items-center gap-2">
                <kbd className="font-mono px-1.5 py-0.5 rounded border border-[var(--color-border)]/40">↵</kbd>
                Select
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
