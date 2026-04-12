/**
 * Canvas undo/redo helpers — single source of truth for undo/redo execution.
 *
 * Eliminates duplicate undo/redo logic across FloatingToolbar, Toolbar,
 * HamburgerDrawer, and useCanvasKeyboard.
 */

import { useCanvasStore } from '@/stores/canvasStore';
import { useProjectStore } from '@/stores/projectStore';

/** Minimal canvas interface needed for undo/redo (avoids Fabric.js import). */
interface UndoableCanvas {
  toJSON: () => unknown;
  loadFromJSON: (json: unknown) => Promise<void>;
  renderAll: () => void;
}

/**
 * Get the current canvas cast to the undo-able interface, or null.
 * Returns null — callers must pass the canvas explicitly.
 */
function getCanvas(): UndoableCanvas | null {
  return null;
}

/**
 * Undo the last canvas action. Returns true if undo was applied.
 */
export async function performUndo(canvas?: UndoableCanvas | null): Promise<boolean> {
  const c = canvas ?? getCanvas();
  if (!c) return false;

  // Deactivate shade view before undo to prevent stale Pattern references
  if (useCanvasStore.getState().shadeViewActive) {
    useCanvasStore.getState().setShadeViewActive(false);
  }

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

  // Deactivate shade view before redo to prevent stale Pattern references
  if (useCanvasStore.getState().shadeViewActive) {
    useCanvasStore.getState().setShadeViewActive(false);
  }

  const currentJson = JSON.stringify(c.toJSON());
  const nextJson = useCanvasStore.getState().popRedo(currentJson);
  if (!nextJson) return false;

  await c.loadFromJSON(JSON.parse(nextJson));
  c.renderAll();
  useProjectStore.getState().setDirty(true);
  return true;
}
