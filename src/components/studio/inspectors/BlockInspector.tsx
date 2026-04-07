'use client';

import { useCallback } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import type { ResolvedSelection } from '@/lib/canvas-selection';

interface Props {
  readonly selection: ResolvedSelection;
}

/**
 * Inspector for a placed user block. Provides rotate / flip / delete /
 * layer-order actions. Replaces the previous toolbar locations for these
 * actions; the right-click ContextMenu still mirrors them for power users.
 */
export function BlockInspector({ selection }: Props) {
  const fabricCanvas = useCanvasStore((s) => s.fabricCanvas);
  const pushUndoState = useCanvasStore((s) => s.pushUndoState);
  const block = selection.primary as
    | (Record<string, unknown> & {
        angle?: number;
        flipX?: boolean;
        flipY?: boolean;
        set: (props: Record<string, unknown>) => void;
        setCoords: () => void;
      })
    | null;

  const inCellId = selection.inLayoutCellId;

  const withUndo = useCallback(
    (fn: () => void) => {
      if (!fabricCanvas) return;
      const canvas = fabricCanvas as unknown as { toJSON: () => unknown; requestRenderAll: () => void };
      const json = JSON.stringify(canvas.toJSON());
      pushUndoState(json);
      fn();
      canvas.requestRenderAll();
    },
    [fabricCanvas, pushUndoState]
  );

  const handleRotate = useCallback(
    (delta: number) => {
      if (!block) return;
      withUndo(() => {
        const current = block.angle ?? 0;
        block.set({ angle: (current + delta) % 360 });
        block.setCoords();
      });
    },
    [block, withUndo]
  );

  const handleFlip = useCallback(
    (axis: 'x' | 'y') => {
      if (!block) return;
      withUndo(() => {
        if (axis === 'x') {
          block.set({ flipX: !block.flipX });
        } else {
          block.set({ flipY: !block.flipY });
        }
        block.setCoords();
      });
    },
    [block, withUndo]
  );

  const handleDelete = useCallback(() => {
    if (!block || !fabricCanvas) return;
    const canvas = fabricCanvas as unknown as {
      remove: (obj: unknown) => void;
      discardActiveObject: () => void;
      requestRenderAll: () => void;
    };
    withUndo(() => {
      canvas.remove(block);
      canvas.discardActiveObject();
    });
    useCanvasStore.getState().setSelectedObjectIds([]);
  }, [block, fabricCanvas, withUndo]);

  const handleLayer = useCallback(
    (direction: 'forward' | 'backward' | 'front' | 'back') => {
      if (!block || !fabricCanvas) return;
      const canvas = fabricCanvas as unknown as {
        bringObjectForward: (o: unknown) => void;
        sendObjectBackwards: (o: unknown) => void;
        bringObjectToFront: (o: unknown) => void;
        sendObjectToBack: (o: unknown) => void;
        requestRenderAll: () => void;
      };
      withUndo(() => {
        if (direction === 'forward') canvas.bringObjectForward(block);
        else if (direction === 'backward') canvas.sendObjectBackwards(block);
        else if (direction === 'front') canvas.bringObjectToFront(block);
        else canvas.sendObjectToBack(block);
      });
    },
    [block, fabricCanvas, withUndo]
  );

  if (!block) {
    return <div className="p-4 text-sm text-secondary">No block selected.</div>;
  }

  return (
    <div className="p-3 space-y-3">
      {inCellId && (
        <section className="rounded-lg bg-primary-container/20 p-2 border border-primary/20">
          <p className="text-[10px] uppercase text-secondary tracking-wider mb-0.5">In layout</p>
          <p className="text-xs font-mono text-on-surface">{inCellId}</p>
        </section>
      )}

      {/* Transform actions */}
      <section className="rounded-lg bg-surface-container p-3 space-y-2">
        <p className="text-[10px] uppercase text-secondary tracking-wider">Transform</p>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => handleRotate(-90)}
            className="rounded-md bg-surface px-2 py-1.5 text-xs font-medium text-on-surface hover:bg-surface-container-high transition-colors"
          >
            ↺ Rotate -90°
          </button>
          <button
            type="button"
            onClick={() => handleRotate(90)}
            className="rounded-md bg-surface px-2 py-1.5 text-xs font-medium text-on-surface hover:bg-surface-container-high transition-colors"
          >
            ↻ Rotate 90°
          </button>
          <button
            type="button"
            onClick={() => handleFlip('x')}
            className="rounded-md bg-surface px-2 py-1.5 text-xs font-medium text-on-surface hover:bg-surface-container-high transition-colors"
          >
            ⇆ Flip H
          </button>
          <button
            type="button"
            onClick={() => handleFlip('y')}
            className="rounded-md bg-surface px-2 py-1.5 text-xs font-medium text-on-surface hover:bg-surface-container-high transition-colors"
          >
            ⇅ Flip V
          </button>
        </div>
      </section>

      {/* Layer order */}
      <section className="rounded-lg bg-surface-container p-3 space-y-2">
        <p className="text-[10px] uppercase text-secondary tracking-wider">Layer Order</p>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => handleLayer('front')}
            className="rounded-md bg-surface px-2 py-1.5 text-xs font-medium text-on-surface hover:bg-surface-container-high transition-colors"
          >
            To Front
          </button>
          <button
            type="button"
            onClick={() => handleLayer('back')}
            className="rounded-md bg-surface px-2 py-1.5 text-xs font-medium text-on-surface hover:bg-surface-container-high transition-colors"
          >
            To Back
          </button>
          <button
            type="button"
            onClick={() => handleLayer('forward')}
            className="rounded-md bg-surface px-2 py-1.5 text-xs font-medium text-on-surface hover:bg-surface-container-high transition-colors"
          >
            Forward
          </button>
          <button
            type="button"
            onClick={() => handleLayer('backward')}
            className="rounded-md bg-surface px-2 py-1.5 text-xs font-medium text-on-surface hover:bg-surface-container-high transition-colors"
          >
            Backward
          </button>
        </div>
      </section>

      {/* Delete */}
      <button
        type="button"
        onClick={handleDelete}
        className="w-full rounded-md bg-error/10 hover:bg-error/20 text-error px-3 py-2 text-xs font-medium transition-colors"
      >
        Delete Block
      </button>
    </div>
  );
}
