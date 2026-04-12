'use client';

/**
 * Hook bridging the shade-assignment engine to the Fabric.js canvas.
 *
 * Provides bulk fabric application by shade, shade breakdown queries,
 * and a non-destructive shade visualization toggle.
 */

import { useCallback, useRef, useMemo, useEffect } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useCanvasContext } from '@/contexts/CanvasContext';
import { useProjectStore } from '@/stores/projectStore';
import {
  findPatchesByShade,
  getShadeBreakdown,
  hasShadeMetadata,
  EMPTY_BREAKDOWN,
} from '@/lib/shade-assignment-engine';
import { loadImage } from '@/lib/image-processing';
import { saveRecentFabric } from '@/lib/recent-fabrics';
import { SHADE } from '@/lib/design-system';
import type { Shade, ShadeBreakdown, PatchDescriptor } from '@/types/shade';

/** Shade visualization colors (not part of the design palette — data display only). */
const SHADE_COLORS: Record<Shade, string> = {
  dark: SHADE.dark,
  light: SHADE.light,
  background: SHADE.background,
  unknown: SHADE.unknown,
};

/**
 * Map a Fabric.js object to a PatchDescriptor the engine can consume.
 */
function objectToDescriptor(obj: unknown): PatchDescriptor {
  const meta = obj as Record<string, unknown>;
  const descriptor: PatchDescriptor = {
    __isBlockGroup: meta.__isBlockGroup === true ? true : undefined,
    __pieceRole: typeof meta.__pieceRole === 'string' ? meta.__pieceRole : undefined,
    __shade: typeof meta.__shade === 'string' ? (meta.__shade as Shade) : undefined,
    __blockPatchIndex:
      typeof meta.__blockPatchIndex === 'number' ? meta.__blockPatchIndex : undefined,
    __blockId: typeof meta.__blockId === 'string' ? meta.__blockId : undefined,
  };

  // If this is a block group, read its children
  if (descriptor.__isBlockGroup) {
    const group = obj as { getObjects?: () => unknown[] };
    if (typeof group.getObjects === 'function') {
      return {
        ...descriptor,
        children: group.getObjects().map(objectToDescriptor),
      };
    }
  }

  return descriptor;
}

/**
 * Build a stable key for a patch to use in the fill save/restore map.
 */
function patchKey(obj: unknown): string {
  const meta = obj as Record<string, unknown>;
  return `${meta.__blockId ?? 'unknown'}:${meta.__blockPatchIndex ?? 'unknown'}`;
}

export function useShadeAssignment() {
  const { getCanvas } = useCanvasContext();
  const fabricCanvas = getCanvas();
  const selectedObjectIds = useCanvasStore((s) => s.selectedObjectIds);
  const activeWorktable = useCanvasStore((s) => s.activeWorktable);
  const shadeViewActive = useCanvasStore((s) => s.shadeViewActive);

  /** Stores original fills when shade view is active, keyed by patchKey. */
  const savedFillsRef = useRef<Map<string, unknown>>(new Map());

  /**
   * Map all canvas objects to PatchDescriptors for the engine.
   */
  const canvasToDescriptors = useCallback((): readonly PatchDescriptor[] => {
    if (!fabricCanvas) return [];
    const canvas = fabricCanvas as unknown as { getObjects: () => unknown[] };
    return canvas.getObjects().map(objectToDescriptor);
  }, [fabricCanvas]);

  /**
   * Get the currently selected block group descriptors.
   */
  const getSelectedGroupDescriptors = useCallback((): readonly PatchDescriptor[] => {
    if (!fabricCanvas) return [];
    const canvas = fabricCanvas as unknown as {
      getActiveObject: () => unknown | null;
      getActiveObjects: () => unknown[];
    };

    // Check single active object first
    const active = canvas.getActiveObject();
    if (active) {
      const meta = active as Record<string, unknown>;
      if (meta.__isBlockGroup === true) {
        return [objectToDescriptor(active)];
      }
    }

    // Check multi-selection
    const actives = canvas.getActiveObjects();
    return actives
      .filter((obj) => (obj as Record<string, unknown>).__isBlockGroup === true)
      .map(objectToDescriptor);
  }, [fabricCanvas]);

  /**
   * Whether the currently selected object(s) include at least one block group.
   */
  const isBlockGroupSelected = useMemo(() => {
    if (!fabricCanvas) return false;
    const canvas = fabricCanvas as unknown as {
      getActiveObject: () => unknown | null;
      getActiveObjects: () => unknown[];
    };
    const active = canvas.getActiveObject();
    if (active && (active as Record<string, unknown>).__isBlockGroup === true) return true;
    const actives = canvas.getActiveObjects();
    return actives.some((obj) => (obj as Record<string, unknown>).__isBlockGroup === true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fabricCanvas, selectedObjectIds]);

  /**
   * Whether any block group on the canvas has shade metadata.
   */
  const hasShadeData = useMemo(() => {
    const descriptors = canvasToDescriptors();
    return hasShadeMetadata(descriptors);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fabricCanvas, selectedObjectIds]);

  /**
   * Get shade breakdown for the given scope.
   */
  const getBreakdown = useCallback(
    (scope: 'selected' | 'all'): ShadeBreakdown => {
      const descriptors = canvasToDescriptors();
      if (scope === 'selected') {
        const selected = getSelectedGroupDescriptors();
        if (selected.length === 0) return EMPTY_BREAKDOWN;
        return getShadeBreakdown(descriptors, 'selected', selected);
      }
      return getShadeBreakdown(descriptors, 'all');
    },
    [canvasToDescriptors, getSelectedGroupDescriptors]
  );

  /**
   * Apply a fabric pattern to all patches matching the given shade.
   * Pushes a single undo state. Returns count of patches modified.
   */
  const bulkApply = useCallback(
    async (
      shade: Shade,
      imageUrl: string,
      fabricMeta: { id: string; name: string }
    ): Promise<number> => {
      if (!fabricCanvas) return 0;

      const fabric = await import('fabric');
      const canvas = fabricCanvas as InstanceType<typeof fabric.Canvas>;

      // Resolve matches via the engine
      const descriptors = canvasToDescriptors();
      const selected = getSelectedGroupDescriptors();
      const scope = selected.length > 0 ? 'selected' : 'all';
      const sourceDescriptors = scope === 'selected' ? selected : descriptors;
      const matches = findPatchesByShade(descriptors, shade, scope, sourceDescriptors);

      if (matches.length === 0) return 0;

      // Push ONE undo state before mutations
      const currentJson = JSON.stringify(canvas.toJSON());
      useCanvasStore.getState().pushUndoState(currentJson);

      // Load the image once
      const img = await loadImage(imageUrl);

      // Resolve the actual Fabric.js group objects matching the engine's source list
      const allObjects = canvas.getObjects();
      const groups =
        scope === 'selected'
          ? allObjects.filter((obj) => {
              const meta = obj as unknown as Record<string, unknown>;
              return (
                meta.__isBlockGroup === true &&
                selected.some((sd) => sd.__blockId === meta.__blockId)
              );
            })
          : allObjects.filter(
              (obj) => (obj as unknown as Record<string, unknown>).__isBlockGroup === true
            );

      let applied = 0;
      for (const match of matches) {
        const group = groups[match.groupIndex] as unknown as
          | { getObjects: () => unknown[] }
          | undefined;
        if (!group) continue;

        // Get the patch children (same filter the engine uses)
        const children = group.getObjects();
        const patches = children.filter(
          (c) => (c as Record<string, unknown>).__pieceRole === 'patch'
        );
        const patch = patches[match.patchIndex] as unknown as
          | {
              set: (key: string, value: unknown) => void;
            }
          | undefined;
        if (!patch) continue;

        // Each patch gets its own Pattern instance (Fabric.js mutates pattern state)
        const pattern = new fabric.Pattern({ source: img, repeat: 'repeat' });
        patch.set('fill', pattern);
        applied++;
      }

      canvas.renderAll();
      saveRecentFabric({ id: fabricMeta.id, name: fabricMeta.name, imageUrl });
      useProjectStore.getState().setDirty(true);

      return applied;
    },
    [fabricCanvas, canvasToDescriptors, getSelectedGroupDescriptors]
  );

  /**
   * Restore original fills from the savedFillsRef map.
   */
  const restoreFills = useCallback(() => {
    if (!fabricCanvas || savedFillsRef.current.size === 0) return;
    const canvas = fabricCanvas as unknown as {
      getObjects: () => unknown[];
      renderAll: () => void;
    };
    const allObjects = canvas.getObjects();

    for (const obj of allObjects) {
      const meta = obj as Record<string, unknown>;
      if (meta.__isBlockGroup !== true) continue;

      const group = obj as unknown as { getObjects: () => unknown[] };
      for (const child of group.getObjects()) {
        const childMeta = child as Record<string, unknown>;
        if (childMeta.__pieceRole !== 'patch') continue;

        const key = patchKey(child);
        if (savedFillsRef.current.has(key)) {
          (child as { set: (k: string, v: unknown) => void }).set(
            'fill',
            savedFillsRef.current.get(key)
          );
        }
      }
    }

    savedFillsRef.current.clear();
    canvas.renderAll();
  }, [fabricCanvas]);

  /**
   * Activate shade visualization mode.
   * Saves current fills and recolors all patches by shade category.
   */
  const activateShadeView = useCallback(() => {
    if (!fabricCanvas) return;
    const canvas = fabricCanvas as unknown as {
      getObjects: () => unknown[];
      renderAll: () => void;
    };
    const allObjects = canvas.getObjects();

    savedFillsRef.current.clear();

    for (const obj of allObjects) {
      const meta = obj as Record<string, unknown>;
      if (meta.__isBlockGroup !== true) continue;

      const group = obj as unknown as { getObjects: () => unknown[] };
      for (const child of group.getObjects()) {
        const childMeta = child as Record<string, unknown>;
        if (childMeta.__pieceRole !== 'patch') continue;

        const key = patchKey(child);
        // Save original fill (may be string, Pattern object, or null)
        savedFillsRef.current.set(key, (child as { fill?: unknown }).fill);

        const shade = (
          typeof childMeta.__shade === 'string' ? childMeta.__shade : 'unknown'
        ) as Shade;
        (child as { set: (k: string, v: unknown) => void }).set('fill', SHADE_COLORS[shade]);
      }
    }

    canvas.renderAll();
    useCanvasStore.getState().setShadeViewActive(true);
  }, [fabricCanvas]);

  /**
   * Deactivate shade visualization mode, restoring original fills.
   */
  const deactivateShadeView = useCallback(() => {
    restoreFills();
    useCanvasStore.getState().setShadeViewActive(false);
  }, [restoreFills]);

  // Auto-deactivate shade view when leaving quilt worktable
  useEffect(() => {
    if (activeWorktable !== 'quilt' && shadeViewActive) {
      deactivateShadeView();
    }
  }, [activeWorktable, shadeViewActive, deactivateShadeView]);

  // Cleanup on unmount: restore fills if shade view was active
  useEffect(() => {
    return () => {
      if (savedFillsRef.current.size > 0) {
        restoreFills();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    getBreakdown,
    bulkApply,
    activateShadeView,
    deactivateShadeView,
    hasShadeData,
    isBlockGroupSelected,
  };
}
