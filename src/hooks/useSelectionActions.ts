/**
 * Selection Actions Hook — Shared handlers for selection manipulation.
 *
 * Provides actions that can be invoked from both ContextMenu and
 * CanvasSelectionToolbar. Keeps logic DRY and consistent across
 * interaction patterns.
 */

import { useCallback } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useProjectStore } from '@/stores/projectStore';
import { getRecentFabrics, type RecentFabric, saveRecentFabric } from '@/lib/recent-fabrics';
import { loadImage } from '@/lib/image-processing';
import { makeSegmentStraight } from '@/hooks/useBendTool';
import type { Segment } from '@/lib/easydraw-engine';

export interface SelectionActions {
  /** Rotate the selected object by 90 degrees. */
  rotate: () => Promise<void>;

  /** Delete the selected object. */
  delete: () => Promise<void>;

  /** Initiate swap mode for the selected block. */
  initiateSwap: () => void;

  /** Complete a swap between two blocks. */
  completeSwap: (targetId: string) => Promise<void>;

  /** Cancel swap mode. */
  cancelSwap: () => void;

  /** Open the fabric picker for the current selection. */
  openFabricPicker: () => void;

  /** Apply a fabric to the current selection. */
  applyFabric: (fabricId: string, imageUrl: string, fabricName: string) => Promise<void>;

  /** Get recent fabrics for quick selection. */
  getRecentFabrics: () => RecentFabric[];

  /** Activate the Bend tool for the selected segment. */
  activateBendTool: () => void;

  /** Convert a bent segment back to straight. */
  makeStraight: () => Promise<void>;
}

/**
 * Hook providing selection action handlers.
 *
 * @param getCanvas - Function returning the Fabric.js canvas instance
 * @returns SelectionActions object
 */
export function useSelectionActions(getCanvas: () => unknown | null): SelectionActions {
  const pushUndo = useCallback((canvas: unknown) => {
    const c = canvas as { toJSON: () => unknown };
    const json = JSON.stringify(c.toJSON());
    useCanvasStore.getState().pushUndoState(json);
    useProjectStore.getState().setDirty(true);
  }, []);

  const rotate = useCallback(async () => {
    const canvas = getCanvas();
    if (!canvas) return;

    const fabric = await import('fabric');
    const c = canvas as InstanceType<typeof fabric.Canvas>;
    const active = c.getActiveObject();
    if (!active) return;

    const angle = (active.angle ?? 0) + 90;
    active.rotate(angle);
    active.setCoords();
    c.renderAll();
    pushUndo(c);
  }, [getCanvas, pushUndo]);

  const deleteAction = useCallback(async () => {
    const canvas = getCanvas();
    if (!canvas) return;

    const fabric = await import('fabric');
    const c = canvas as InstanceType<typeof fabric.Canvas>;
    const active = c.getActiveObject();
    if (!active) return;

    c.remove(active);
    c.discardActiveObject();
    c.renderAll();
    pushUndo(c);
  }, [getCanvas, pushUndo]);

  const initiateSwap = useCallback(() => {
    const canvas = getCanvas();
    if (!canvas) return;

    const c = canvas as {
      getActiveObject: () => unknown | null;
    };
    const active = c.getActiveObject();
    if (!active) return;

    const obj = active as { id?: string; __isBlockGroup?: boolean };
    if (!obj.__isBlockGroup) return;

    const sourceId = obj.id ?? `block-${Date.now()}`;
    useCanvasStore.getState().setSwapMode(true, sourceId);
  }, [getCanvas]);

  const completeSwap = useCallback(
    async (targetId: string) => {
      const canvas = getCanvas();
      if (!canvas) return;

      const fabric = await import('fabric');
      const c = canvas as InstanceType<typeof fabric.Canvas>;

      const sourceId = useCanvasStore.getState().swapSourceId;
      if (!sourceId) return;

      // Find both blocks by ID
      const objects = c.getObjects();
      const sourceBlock = objects.find(
        (o) => (o as unknown as { id?: string }).id === sourceId
      ) as unknown as
        | { left: number; top: number; set: (props: object) => void; setCoords: () => void }
        | undefined;

      const targetBlock = objects.find(
        (o) => (o as unknown as { id?: string }).id === targetId
      ) as unknown as
        | { left: number; top: number; set: (props: object) => void; setCoords: () => void }
        | undefined;

      if (!sourceBlock || !targetBlock) {
        useCanvasStore.getState().clearSwapMode();
        return;
      }

      // Swap positions
      const sourceLeft = sourceBlock.left;
      const sourceTop = sourceBlock.top;
      const targetLeft = targetBlock.left;
      const targetTop = targetBlock.top;

      pushUndo(c);

      sourceBlock.set({ left: targetLeft, top: targetTop });
      targetBlock.set({ left: sourceLeft, top: sourceTop });

      sourceBlock.setCoords();
      targetBlock.setCoords();

      c.renderAll();
      useCanvasStore.getState().clearSwapMode();
    },
    [getCanvas, pushUndo]
  );

  const cancelSwap = useCallback(() => {
    useCanvasStore.getState().clearSwapMode();
  }, []);

  const openFabricPicker = useCallback(() => {
    useCanvasStore.getState().setFabricPickerTarget('selection');
    // TODO: In Phase 3, this will also activate the Fabrics tab in ContextPanel
  }, []);

  const applyFabric = useCallback(
    async (fabricId: string, imageUrl: string, fabricName: string) => {
      const canvas = getCanvas();
      if (!canvas) return;

      const fabric = await import('fabric');
      const c = canvas as InstanceType<typeof fabric.Canvas>;
      const active = c.getActiveObject();
      if (!active) return;

      const img = await loadImage(imageUrl);
      const pattern = new fabric.Pattern({ source: img, repeat: 'repeat' });

      // Apply to block group (all patches) or single object
      if (active.type === 'group') {
        const g = active as InstanceType<typeof fabric.Group>;
        for (const obj of g.getObjects()) {
          obj.set('fill', pattern);
          (obj as unknown as Record<string, unknown>).fabricId = fabricId;
        }
      } else {
        active.set('fill', pattern);
        (active as unknown as Record<string, unknown>).fabricId = fabricId;
      }

      c.renderAll();
      pushUndo(c);
      saveRecentFabric({ id: fabricId, name: fabricName, imageUrl });
    },
    [getCanvas, pushUndo]
  );

  const getRecentFabricsList = useCallback((): RecentFabric[] => {
    return getRecentFabrics();
  }, []);

  const activateBendTool = useCallback(() => {
    useCanvasStore.getState().setActiveTool('bend');
  }, []);

  const makeStraight = useCallback(async () => {
    const canvas = getCanvas();
    if (!canvas) return;

    const fabric = await import('fabric');
    const c = canvas as InstanceType<typeof fabric.Canvas>;
    const active = c.getActiveObject();
    if (!active) return;

    // Check if this is a bent segment
    const obj = active as unknown as { __bentSegment?: boolean; __segmentData?: unknown };
    if (!obj.__bentSegment || !obj.__segmentData) return;

    // Make it straight
    makeSegmentStraight(active, c, obj.__segmentData as Segment);

    // Update tags on the object
    (active as unknown as { __easyDrawSegment?: boolean }).__easyDrawSegment = true;
    (active as unknown as { __bentSegment?: boolean }).__bentSegment = undefined;

    pushUndo(c);
    c.renderAll();
  }, [getCanvas, pushUndo]);

  return {
    rotate,
    delete: deleteAction,
    initiateSwap,
    completeSwap,
    cancelSwap,
    openFabricPicker,
    applyFabric,
    getRecentFabrics: getRecentFabricsList,
    activateBendTool,
    makeStraight,
  };
}
