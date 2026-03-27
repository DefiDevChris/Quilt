'use client';

import { useEffect, useCallback } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useProjectStore } from '@/stores/projectStore';
import {
  spraycanRecolor,
  swapColors,
  randomizeColors,
  normalizeColor,
  type PatchColor,
  type ColorChange,
} from '@/lib/colorway-engine';

/**
 * Hook that handles colorway tool interactions on the Fabric.js canvas.
 * Spraycan and eyedropper tools override canvas click behavior.
 */
export function useColorwayTool() {
  const fabricCanvas = useCanvasStore((s) => s.fabricCanvas);
  const activeTool = useCanvasStore((s) => s.activeTool);
  const fillColor = useCanvasStore((s) => s.fillColor);

  // Spraycan: click a patch → all same-color patches get new color
  useEffect(() => {
    if (!fabricCanvas || activeTool !== 'spraycan') return;

    let cleanup: (() => void) | null = null;

    (async () => {
      const fabric = await import('fabric');
      const canvas = fabricCanvas as InstanceType<typeof fabric.Canvas>;

      canvas.defaultCursor = 'crosshair';
      canvas.selection = false;

      function onMouseDown(e: { e: MouseEvent }) {
        const target = canvas.findTarget(e.e) as unknown as InstanceType<
          typeof fabric.FabricObject
        > | null;
        if (!target) return;

        const targetFill = typeof target.fill === 'string' ? target.fill : null;
        if (!targetFill) return;

        const patches = extractPatchColors(canvas, fabric);
        const changes = spraycanRecolor(patches, targetFill, fillColor);
        applyChanges(canvas, fabric, changes);
      }

      canvas.on('mouse:down', onMouseDown as never);
      cleanup = () => {
        canvas.off('mouse:down', onMouseDown as never);
        canvas.defaultCursor = 'default';
      };
    })();

    return () => {
      cleanup?.();
    };
  }, [fabricCanvas, activeTool, fillColor]);

  // Eyedropper: click a patch → set fillColor to that patch's color
  useEffect(() => {
    if (!fabricCanvas || activeTool !== 'eyedropper') return;

    let cleanup: (() => void) | null = null;

    (async () => {
      const fabric = await import('fabric');
      const canvas = fabricCanvas as InstanceType<typeof fabric.Canvas>;

      canvas.defaultCursor = 'crosshair';
      canvas.selection = false;

      function onMouseDown(e: { e: MouseEvent }) {
        const target = canvas.findTarget(e.e) as unknown as InstanceType<
          typeof fabric.FabricObject
        > | null;
        if (!target) return;

        const targetFill = typeof target.fill === 'string' ? target.fill : null;
        if (!targetFill) return;

        useCanvasStore.getState().setFillColor(normalizeColor(targetFill));
        useCanvasStore.getState().setActiveTool('select');
      }

      canvas.on('mouse:down', onMouseDown as never);
      cleanup = () => {
        canvas.off('mouse:down', onMouseDown as never);
        canvas.defaultCursor = 'default';
      };
    })();

    return () => {
      cleanup?.();
    };
  }, [fabricCanvas, activeTool]);

  // Swap colors action
  const executeSwap = useCallback(
    async (colorA: string, colorB: string) => {
      if (!fabricCanvas) return;
      const fabric = await import('fabric');
      const canvas = fabricCanvas as InstanceType<typeof fabric.Canvas>;

      const patches = extractPatchColors(canvas, fabric);
      const changes = swapColors(patches, colorA, colorB);
      applyChanges(canvas, fabric, changes);
    },
    [fabricCanvas]
  );

  // Randomize colors action
  const executeRandomize = useCallback(
    async (palette: string[]) => {
      if (!fabricCanvas) return;
      const fabric = await import('fabric');
      const canvas = fabricCanvas as InstanceType<typeof fabric.Canvas>;

      const patches = extractPatchColors(canvas, fabric);
      const changes = randomizeColors(patches, palette);
      applyChanges(canvas, fabric, changes);
    },
    [fabricCanvas]
  );

  return { executeSwap, executeRandomize };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function extractPatchColors(
  canvas: { getObjects: () => { stroke?: unknown; fill?: unknown; id?: unknown }[] },
  _fabric: typeof import('fabric')
): PatchColor[] {
  return canvas
    .getObjects()
    .filter((obj) => obj.stroke !== '#E5E2DD') // skip grid lines
    .map((obj, idx) => ({
      objectId: String((obj as unknown as { id?: string }).id ?? `obj-${idx}`),
      currentFill: typeof obj.fill === 'string' ? obj.fill : '',
    }))
    .filter((p) => p.currentFill.length > 0);
}

function applyChanges(
  canvas: {
    getObjects: () => unknown[];
    renderAll: () => void;
    toJSON: () => unknown;
  },
  _fabric: typeof import('fabric'),
  changes: ColorChange[]
): void {
  if (changes.length === 0) return;

  const changeMap = new Map(changes.map((c) => [c.objectId, c.newFill]));
  const objects = canvas.getObjects() as {
    id?: string;
    fill?: unknown;
    set: (props: Record<string, unknown>) => void;
  }[];

  let idx = 0;
  for (const obj of objects) {
    if ((obj as unknown as { stroke?: string }).stroke === '#E5E2DD') continue;
    const id = obj.id ?? `obj-${idx}`;
    const newFill = changeMap.get(id);
    if (newFill !== undefined) {
      obj.set({ fill: newFill });
    }
    idx++;
  }

  canvas.renderAll();

  // Push single undo state for the entire operation
  const json = JSON.stringify(canvas.toJSON());
  useCanvasStore.getState().pushUndoState(json);
  useProjectStore.getState().setDirty(true);
}
