'use client';

import { useEffect, useCallback } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useProjectStore } from '@/stores/projectStore';
import { TEXT_DEFAULT_FONT_SIZE, TEXT_DEFAULT_FONT_FAMILY } from '@/lib/constants';

/**
 * Hook that handles click-to-create-text behavior on the Fabric.js canvas.
 * When activeTool === 'text', clicking the canvas creates an editable IText object.
 */
export function useTextTool() {
  const fabricCanvas = useCanvasStore((s) => s.fabricCanvas);
  const activeTool = useCanvasStore((s) => s.activeTool);
  const fillColor = useCanvasStore((s) => s.fillColor);

  useEffect(() => {
    if (!fabricCanvas || activeTool !== 'text') return;

    let cleanup: (() => void) | null = null;

    (async () => {
      const fabric = await import('fabric');
      const canvas = fabricCanvas as InstanceType<typeof fabric.Canvas>;

      canvas.defaultCursor = 'text';
      canvas.selection = false;

      function onMouseDown(e: { e: MouseEvent }) {
        // Don't create text if clicking on an existing object
        const target = canvas.findTarget(e.e);
        if (target) return;

        const pointer = canvas.getScenePoint(e.e);
        const itext = new fabric.IText('Text', {
          left: pointer.x,
          top: pointer.y,
          fontFamily: TEXT_DEFAULT_FONT_FAMILY,
          fontSize: TEXT_DEFAULT_FONT_SIZE,
          fill: fillColor,
          selectable: true,
          editable: true,
        });

        canvas.add(itext);
        canvas.setActiveObject(itext);
        itext.enterEditing();
        itext.selectAll();
        canvas.renderAll();

        // Push undo state
        const json = JSON.stringify(canvas.toJSON());
        useCanvasStore.getState().pushUndoState(json);
        useProjectStore.getState().setDirty(true);

        // Switch back to select tool after placing text
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
  }, [fabricCanvas, activeTool, fillColor]);
}

/**
 * Hook to update properties of a selected text object.
 */
export function useTextProperties() {
  const fabricCanvas = useCanvasStore((s) => s.fabricCanvas);

  const updateTextProperty = useCallback(
    async (property: string, value: unknown) => {
      if (!fabricCanvas) return;
      const fabric = await import('fabric');
      const canvas = fabricCanvas as InstanceType<typeof fabric.Canvas>;
      const active = canvas.getActiveObject();
      if (!active || active.type !== 'i-text') return;

      active.set(property as keyof typeof active, value);
      canvas.renderAll();

      const json = JSON.stringify(canvas.toJSON());
      useCanvasStore.getState().pushUndoState(json);
      useProjectStore.getState().setDirty(true);
    },
    [fabricCanvas]
  );

  const getSelectedTextInfo = useCallback(async () => {
    if (!fabricCanvas) return null;
    const fabric = await import('fabric');
    const canvas = fabricCanvas as InstanceType<typeof fabric.Canvas>;
    const active = canvas.getActiveObject();
    if (!active || active.type !== 'i-text') return null;

    return {
      text: (active as InstanceType<typeof fabric.IText>).text ?? '',
      fontFamily: (active as unknown as { fontFamily?: string }).fontFamily ?? TEXT_DEFAULT_FONT_FAMILY,
      fontSize: (active as unknown as { fontSize?: number }).fontSize ?? TEXT_DEFAULT_FONT_SIZE,
      fill: typeof active.fill === 'string' ? active.fill : '#383831',
      fontWeight: (active as unknown as { fontWeight?: string }).fontWeight ?? 'normal',
      fontStyle: (active as unknown as { fontStyle?: string }).fontStyle ?? 'normal',
      textAlign: (active as unknown as { textAlign?: string }).textAlign ?? 'left',
    };
  }, [fabricCanvas]);

  return { updateTextProperty, getSelectedTextInfo };
}
