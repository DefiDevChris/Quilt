/**
 * Selection Utilities — Detect the type of selected canvas object.
 *
 * Used by the floating selection toolbar to determine which actions
 * are available for the current selection.
 */

export type SelectionType =
  | 'block'
  | 'border'
  | 'sashing'
  | 'patch'
  | 'easydraw'
  | 'bent'
  | null;

/**
 * Determine the selection type from the active Fabric.js object.
 *
 * @param canvas - The Fabric.js canvas instance (or null)
 * @returns The selection type, or null if no valid selection
 */
export function getSelectionType(canvas: unknown): SelectionType {
  if (!canvas) return null;

  const c = canvas as {
    getActiveObject?: () => unknown | null;
  };

  const active = c.getActiveObject?.();
  if (!active) return null;

  const obj = active as Record<string, unknown>;

  // Block: a group with __isBlockGroup flag
  if (obj.__isBlockGroup === true) {
    return 'block';
  }

  // Border: fence role 'border'
  if (obj._fenceRole === 'border') {
    return 'border';
  }

  // Sashing: fence role 'sashing'
  if (obj._fenceRole === 'sashing') {
    return 'sashing';
  }

  // Patch: piece role 'patch' (within a block)
  if (obj.__pieceRole === 'patch') {
    return 'patch';
  }

  // Bent segment (quadratic arc)
  if (obj.__bentSegment === true) {
    return 'bent';
  }

  // EasyDraw segment (straight line)
  if (obj.__easyDrawSegment === true) {
    return 'easydraw';
  }

  // Check if it's a group containing patches (block with single selection)
  if (obj.type === 'group') {
    const group = obj as { getObjects?: () => unknown[] };
    if (typeof group.getObjects === 'function') {
      const children = group.getObjects();
      // If all children are patches, treat as block
      if (
        children.length > 0 &&
        children.every((child) => (child as Record<string, unknown>).__pieceRole === 'patch')
      ) {
        return 'block';
      }
    }
  }

  return null;
}

/**
 * Check if the selection is a multi-selection (ActiveSelection).
 *
 * @param canvas - The Fabric.js canvas instance (or null)
 * @returns true if multiple objects are selected
 */
export function isMultiSelection(canvas: unknown): boolean {
  if (!canvas) return false;

  const c = canvas as {
    getActiveObjects?: () => unknown[];
  };

  const objects = c.getActiveObjects?.();
  return Array.isArray(objects) && objects.length > 1;
}

/**
 * Get the bounding rect of the active selection in canvas coordinates.
 *
 * @param canvas - The Fabric.js canvas instance (or null)
 * @returns Bounding rect or null if no selection
 */
export function getSelectionBounds(canvas: unknown): {
  left: number;
  top: number;
  width: number;
  height: number;
} | null {
  if (!canvas) return null;

  const c = canvas as {
    getActiveObject?: () => unknown | null;
  };

  const active = c.getActiveObject?.();
  if (!active) return null;

  const obj = active as {
    getBoundingRect?: () => { left: number; top: number; width: number; height: number };
  };

  return obj.getBoundingRect?.() ?? null;
}
