'use client';

import { useCallback, useState } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useFabricLayout } from '@/hooks/useFabricLayout';
import { loadImage } from '@/lib/image-processing';

interface Props {
  /** Currently-selected canvas object (the layout area) */
  readonly target: Record<string, unknown> | null;
  /** Optional area role label for the empty-state hint */
  readonly roleLabel?: string;
}

/**
 * Shared fabric-assignment controls used by Sashing/Cornerstone/Border/
 * Binding/SettingTriangle inspectors.
 *
 * Renders:
 *  - The current fill (image preview if pattern-fill, color swatch if solid)
 *  - "Drag a fabric here" hint
 *  - Solid color picker fallback
 *  - Clear-fill button
 */
export function AreaFabricControls({ target, roleLabel }: Props) {
  const fabricCanvas = useCanvasStore((s) => s.fabricCanvas);
  const { applyFabricToObject } = useFabricLayout();
  const [colorInput, setColorInput] = useState<string>(() => {
    const fill = target?.['fill'];
    return typeof fill === 'string' ? fill : '#E8E2D8';
  });

  const fill = target?.['fill'];
  const hasPatternFill = fill && typeof fill !== 'string';
  const hasSolidFill = typeof fill === 'string';

  const handleColorCommit = useCallback(
    (color: string) => {
      if (!target || !fabricCanvas) return;
      (target as { set: (props: Record<string, unknown>) => void }).set({ fill: color });
      const canvas = fabricCanvas as unknown as { requestRenderAll: () => void };
      canvas.requestRenderAll();
    },
    [target, fabricCanvas]
  );

  const handleClear = useCallback(() => {
    if (!target || !fabricCanvas) return;
    (target as { set: (props: Record<string, unknown>) => void }).set({ fill: 'transparent' });
    const canvas = fabricCanvas as unknown as { requestRenderAll: () => void };
    canvas.requestRenderAll();
  }, [target, fabricCanvas]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('application/quiltcorgi-fabric-id')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    }
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      const imageUrl = e.dataTransfer.getData('application/quiltcorgi-fabric-url');
      const fabricId = e.dataTransfer.getData('application/quiltcorgi-fabric-id');
      if (!imageUrl || !fabricId || !target || !fabricCanvas) return;

      // Mark the target active so applyFabricToObject can find it.
      (
        fabricCanvas as unknown as { setActiveObject: (o: unknown) => void }
      ).setActiveObject(target);
      await applyFabricToObject(null, imageUrl);
    },
    [target, fabricCanvas, applyFabricToObject]
  );

  return (
    <section className="space-y-3">
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="rounded-lg bg-surface-container p-3 border-2 border-dashed border-outline-variant/40 hover:border-primary/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-md bg-surface flex-shrink-0 overflow-hidden border border-outline-variant/30">
            {hasPatternFill ? (
              <PatternPreview pattern={fill} />
            ) : hasSolidFill ? (
              <div className="w-full h-full" style={{ backgroundColor: fill as string }} />
            ) : (
              <div className="w-full h-full" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-on-surface mb-0.5">
              {hasPatternFill ? 'Fabric assigned' : hasSolidFill ? 'Solid color' : 'No fill'}
            </p>
            <p className="text-[10px] text-secondary">
              Drag a {roleLabel ?? 'fabric'} from the Fabrics tab onto this area.
            </p>
          </div>
        </div>
      </div>

      {/* Solid color fallback */}
      <div className="rounded-lg bg-surface-container p-3">
        <p className="text-[10px] uppercase text-secondary tracking-wider mb-2">Or pick a color</p>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={typeof fill === 'string' ? fill : colorInput}
            onChange={(e) => {
              setColorInput(e.target.value);
              handleColorCommit(e.target.value);
            }}
            className="h-8 w-12 rounded cursor-pointer border border-outline-variant/30"
          />
          <input
            type="text"
            value={typeof fill === 'string' ? fill : colorInput}
            onChange={(e) => {
              setColorInput(e.target.value);
              if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) {
                handleColorCommit(e.target.value);
              }
            }}
            className="flex-1 rounded-md bg-surface px-2 py-1 text-xs font-mono text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleClear}
        className="w-full rounded-md bg-surface-container px-3 py-2 text-xs font-medium text-secondary hover:text-on-surface hover:bg-surface-container-high transition-colors"
      >
        Clear Fill
      </button>
    </section>
  );
}

function PatternPreview({ pattern }: { readonly pattern: unknown }) {
  // Best-effort: pull the source image URL out of the Fabric.js Pattern.
  // Pattern.source can be an HTMLImageElement, HTMLCanvasElement, or SVG node.
  const source = (pattern as { source?: unknown }).source as
    | HTMLImageElement
    | HTMLCanvasElement
    | undefined;

  if (source && 'src' in source) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={(source as HTMLImageElement).src} alt="" className="w-full h-full object-cover" />
    );
  }
  return <div className="w-full h-full bg-surface-container-high" />;
}

// Export loadImage so it isn't tree-shaken when callers might need it later
export { loadImage };
