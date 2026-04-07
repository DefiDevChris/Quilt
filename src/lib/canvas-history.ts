/**
 * Canvas undo/redo helpers — single source of truth for undo/redo execution.
 *
 * Eliminates duplicate undo/redo logic across FloatingToolbar, Toolbar,
 * HamburgerDrawer, and useCanvasKeyboard.
 */

import { useCanvasStore } from '@/stores/canvasStore';
import { useProjectStore } from '@/stores/projectStore';
import { create } from 'zustand';

interface HistoryStoreState {
  init: () => void;
  undo: () => Promise<boolean>;
  redo: () => Promise<boolean>;
}

export const useHistoryStore = create<HistoryStoreState>((set, get) => ({
  init: () => {
    console.log('History system initialized');
    useCanvasStore.getState().resetHistory();
  },
  undo: async () => performUndo(),
  redo: async () => performRedo(),
}));

/** Minimal canvas interface needed for undo/redo (avoids Fabric.js import). */
interface UndoableCanvas {
  toJSON: () => unknown;
  loadFromJSON: (json: unknown) => Promise<void>;
  renderAll: () => void;
}

/**
 * Get the current canvas cast to the undo-able interface, or null.
 */
function getCanvas(): UndoableCanvas | null {
  return useCanvasStore.getState().fabricCanvas as UndoableCanvas | null;
}

/**
 * Undo the last canvas action. Returns true if undo was applied.
 */
export async function performUndo(canvas?: UndoableCanvas | null): Promise<boolean> {
  const c = canvas ?? getCanvas();
  if (!c) return false;

  const currentJson = JSON.stringify(c.toJSON());
  const prevJson = useCanvasStore.getState().popUndo(currentJson);
  if (!prevJson) return false;

  await c.loadFromJSON(JSON.parse(prevJson));
  c.renderAll();
  useProjectStore.getState().setDirty(true);
  return true;
}

/**
 * Redo the last undone canvas action. Returns true if redo was applied.
 */
export async function performRedo(canvas?: UndoableCanvas | null): Promise<boolean> {
  const c = canvas ?? getCanvas();
  if (!c) return false;

  const currentJson = JSON.stringify(c.toJSON());
  const nextJson = useCanvasStore.getState().popRedo(currentJson);
  if (!nextJson) return false;

  await c.loadFromJSON(JSON.parse(nextJson));
  c.renderAll();
  useProjectStore.getState().setDirty(true);
  return true;
}
