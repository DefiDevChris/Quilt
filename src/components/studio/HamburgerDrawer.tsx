'use client';

/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useCanvasStore } from '@/stores/canvasStore';
import { useProjectStore } from '@/stores/projectStore';
import { useBlockStore } from '@/stores/blockStore';
import { useFabricStore } from '@/stores/fabricStore';
import { LAYOUT } from '@/lib/design-system';
import { useCanvasContext } from '@/contexts/CanvasContext';

import { ZOOM_FACTOR } from '@/lib/constants';
import { performUndo, performRedo } from '@/lib/canvas-history';

interface HamburgerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
  onOpenImageExport?: () => void;
  onOpenPdfExport?: () => void;
  onOpenHelp?: () => void;
  onOpenHistory?: () => void;
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

export function HamburgerDrawer({
  isOpen,
  onClose,
  onSave,
  onOpenImageExport,
  onOpenPdfExport,
  onOpenHelp,
  onOpenHistory,
}: HamburgerDrawerProps) {
  const router = useRouter();
  const { getCanvas } = useCanvasContext();
  const fabricCanvas = getCanvas();
  const canUndo = useCanvasStore((s) => s.canUndo());
  const canRedo = useCanvasStore((s) => s.canRedo());
  const undoCount = useCanvasStore((s) => s.undoStack.length);
  const redoCount = useCanvasStore((s) => s.redoStack.length);

  const handleUndo = useCallback(() => performUndo(), []);

  const handleRedo = useCallback(() => performRedo(), []);

  const handleDelete = useCallback(async () => {
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
  }, [fabricCanvas]);

  const handleSelectAll = useCallback(async () => {
    if (!fabricCanvas) return;
    const fabric = await import('fabric');
    const canvas = fabricCanvas as InstanceType<typeof fabric.Canvas>;
    const allObjects = canvas.getObjects();
    const userObjects = allObjects.filter(
      (obj) => !(obj as unknown as { _layoutElement?: boolean })._layoutElement
    );
    if (userObjects.length > 0) {
      const selection = new fabric.ActiveSelection(userObjects, { canvas });
      canvas.setActiveObject(selection);
      canvas.requestRenderAll();
    }
  }, [fabricCanvas]);

  const handleDuplicate = useCallback(async () => {
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
  }, [fabricCanvas]);

  const handleZoomIn = useCallback(() => {
    const { zoom, zoomAtPoint } = useCanvasStore.getState();
    zoomAtPoint(zoom * ZOOM_FACTOR, fabricCanvas);
  }, [fabricCanvas]);

  const handleZoomOut = useCallback(() => {
    const { zoom, zoomAtPoint } = useCanvasStore.getState();
    zoomAtPoint(zoom / ZOOM_FACTOR, fabricCanvas);
  }, [fabricCanvas]);

  const handleFitToScreen = useCallback(() => {
    const { canvasWidth, canvasHeight } = useProjectStore.getState();
    useCanvasStore.getState().centerAndFitViewport(fabricCanvas, canvasWidth, canvasHeight);
  }, [fabricCanvas]);

  const menuGroups: MenuGroup[] = [
    {
      title: 'File',
      items: [
        { label: 'Save', shortcut: 'Ctrl+S', onClick: onSave },
        { label: 'Import/Export Image', onClick: onOpenImageExport },
        { label: 'Export PDF', onClick: onOpenPdfExport },
        {
          label: 'Close',
          onClick: () => {
            const isDirty = useProjectStore.getState().isDirty;
            if (isDirty && onSave) {
              onSave();
            }
            router.push('/dashboard');
          },
        },
      ],
    },
    {
      title: 'Edit',
      items: [
        {
          label: `Undo${canUndo ? ` (${undoCount})` : ''}`,
          shortcut: 'Ctrl+Z',
          onClick: handleUndo,
        },
        {
          label: `Redo${canRedo ? ` (${redoCount})` : ''}`,
          shortcut: 'Ctrl+Shift+Z',
          onClick: handleRedo,
        },
        { label: 'Duplicate', shortcut: 'Ctrl+D', onClick: handleDuplicate },
        { label: 'Delete', shortcut: 'Del', onClick: handleDelete },
        { label: 'Select All', shortcut: 'Ctrl+A', onClick: handleSelectAll },
      ],
    },
    {
      title: 'View',
      items: [
        { label: 'Zoom In', shortcut: 'Ctrl+=', onClick: handleZoomIn },
        { label: 'Zoom Out', shortcut: 'Ctrl+-', onClick: handleZoomOut },
        { label: 'Fit to Screen', onClick: handleFitToScreen },
      ],
    },
    {
      title: 'Libraries',
      items: [
        {
          label: 'Block Library',
          shortcut: 'B',
          onClick: () => useBlockStore.getState().togglePanel(),
        },
        {
          label: 'Fabric Library',
          shortcut: 'F',
          onClick: () => useFabricStore.getState().togglePanel(),
        },
      ],
    },
    {
      title: 'Help',
      items: [
        { label: 'History', onClick: onOpenHistory },
        { label: 'Keyboard Shortcuts', shortcut: '?', onClick: onOpenHelp },
      ],
    },
  ];

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
            className="fixed inset-0 bg-[var(--color-primary)]/20 z-40"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
            className={`fixed top-0 left-0 bottom-0 w-[${LAYOUT.sidebarWidth}] bg-[var(--color-bg)] shadow-[0_1px_2px_rgba(26,26,26,0.08)] z-50 overflow-y-auto`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 h-12">
              <span className="font-semibold text-[1.125rem] text-[var(--color-text)]">Quilt Studio</span>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg)] transition-colors"
                aria-label="Close menu"
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

            {/* Menu Groups */}
            <nav className="px-2 pb-4">
              {menuGroups.map((group, groupIdx) => (
                <div key={group.title}>
                  {groupIdx > 0 && (
                    <div className="my-[2.75rem] mx-2 border-t border-[var(--color-border)]/15" />
                  )}
                  <div className="px-2 py-1.5 text-label-sm uppercase text-[var(--color-text)]/70 font-medium">
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
                      className="w-full flex items-center justify-between px-2 py-[1rem] text-body-md text-[var(--color-text)] rounded-lg hover:bg-[var(--color-bg)] transition-colors"
                    >
                      <span>{item.label}</span>
                      {item.shortcut && (
                        <span className="font-mono text-[var(--color-text-dim)] text-body-sm">
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
