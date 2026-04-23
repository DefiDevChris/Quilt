import { COLORS } from '@/lib/design-system';

/**
 * Minimal structural type for the Fabric.js surface we actually touch when
 * clearing the canvas. Keeps callers free of `as unknown as { ... }` casts
 * while staying deliberately narrower than Fabric's full Canvas type so we
 * don't pull its declarations into consumers that don't need them.
 */
export interface ClearableFabricCanvas {
  clear(): void;
  backgroundColor: string;
  renderAll(): void;
}

/**
 * Clears a Fabric.js canvas and resets its background to the brand surface
 * color. No-op when the canvas ref is null — safe to call before the canvas
 * has mounted. Replaces the duplicated clear-ritual inline blocks in
 * StudioLayout's start-over and new-block handlers.
 */
export function clearFabricCanvas(canvas: unknown | null | undefined): void {
  if (!canvas) return;
  const layoutCanvas = canvas as ClearableFabricCanvas;
  layoutCanvas.clear();
  layoutCanvas.backgroundColor = COLORS.surface;
  layoutCanvas.renderAll();
}
