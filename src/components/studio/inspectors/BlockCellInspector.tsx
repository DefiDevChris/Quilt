'use client';

import { useCallback } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import type { ResolvedSelection } from '@/lib/canvas-selection';
import { PIXELS_PER_INCH } from '@/lib/constants';

interface Props {
  readonly selection: ResolvedSelection;
}

/**
 * Empty layout cell inspector. Shows the cell dimensions, hints the user to
 * drag a block in, and provides a "Clear cell" action that removes any block
 * already placed via `_inLayoutCellId` tag.
 */
export function BlockCellInspector({ selection }: Props) {
  const fabricCanvas = useCanvasStore((s) => s.fabricCanvas);
  const cell = selection.primary;
  const cellId = selection.layoutAreaId;

  const cellWidthPx = (cell as { width?: number; scaleX?: number } | null)?.width ?? 0;
  const cellHeightPx = (cell as { height?: number; scaleY?: number } | null)?.height ?? 0;
  const cellScaleX = (cell as { scaleX?: number } | null)?.scaleX ?? 1;
  const cellScaleY = (cell as { scaleY?: number } | null)?.scaleY ?? 1;
  const widthIn = (cellWidthPx * cellScaleX) / PIXELS_PER_INCH;
  const heightIn = (cellHeightPx * cellScaleY) / PIXELS_PER_INCH;

  const handleClearCell = useCallback(() => {
    if (!fabricCanvas || !cellId) return;
    const canvas = fabricCanvas as unknown as {
      getObjects: () => Array<Record<string, unknown>>;
      remove: (...objs: unknown[]) => void;
      requestRenderAll: () => void;
    };
    const occupant = canvas
      .getObjects()
      .find((o) => o['_inLayoutCellId'] === cellId);
    if (occupant) {
      canvas.remove(occupant);
      canvas.requestRenderAll();
    }
  }, [fabricCanvas, cellId]);

  return (
    <div className="p-3 space-y-3">
      <section className="rounded-lg bg-surface-container p-3">
        <p className="text-[10px] uppercase text-secondary tracking-wider mb-1.5">Cell</p>
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-secondary">Size</span>
            <span className="font-mono text-on-surface">
              {widthIn.toFixed(1)}&quot; × {heightIn.toFixed(1)}&quot;
            </span>
          </div>
          {cellId && (
            <div className="flex justify-between text-xs">
              <span className="text-secondary">ID</span>
              <span className="font-mono text-on-surface text-[10px]">{cellId}</span>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-lg bg-primary-container/30 p-3 border border-primary/20">
        <p className="text-xs text-on-surface font-medium mb-1">Drag a block here</p>
        <p className="text-xs text-secondary">
          Open the <span className="font-medium">Blocks</span> tab above and drag any block onto
          this cell. It will scale to fit automatically.
        </p>
      </section>

      <button
        type="button"
        onClick={handleClearCell}
        className="w-full rounded-md bg-surface-container px-3 py-2 text-xs font-medium text-secondary hover:bg-surface-container-high hover:text-on-surface transition-colors"
      >
        Clear Cell
      </button>
    </div>
  );
}
