import { useLayoutStore } from '@/stores/layoutStore';
import { useProjectStore } from '@/stores/projectStore';
import { useCanvasStore } from '@/stores/canvasStore';
import { computeFenceAreas, layoutSourceToTemplate } from '@/lib/fence-engine';
import { getPixelsPerUnit } from '@/lib/canvas-utils';
import type { FenceArea } from '@/types/fence';

/**
 * Read the current layout + project + canvas store state and compute the
 * resulting fence areas. Used by drop handlers, fabric layout, fence
 * renderer, and grid init so they stay in sync.
 */
export function getComputedLayoutAreas(): FenceArea[] {
  const layoutState = useLayoutStore.getState();
  const projectState = useProjectStore.getState();
  const { unitSystem } = useCanvasStore.getState();

  const template = layoutSourceToTemplate({
    layoutType: layoutState.layoutType,
    selectedPresetId: layoutState.selectedPresetId,
    rows: layoutState.rows,
    cols: layoutState.cols,
    blockSize: layoutState.blockSize,
    sashing: layoutState.sashing,
    borders: layoutState.borders,
    hasCornerstones: layoutState.hasCornerstones,
    bindingWidth: layoutState.bindingWidth,
  });

  if (!template) return [];

  return computeFenceAreas(
    template,
    projectState.canvasWidth,
    projectState.canvasHeight,
    getPixelsPerUnit(unitSystem)
  );
}

/**
 * Read layout store state and build the LayoutTemplate (without computing
 * fence areas). Used when only the template object is needed.
 */
export function getLayoutTemplateFromStores() {
  const layoutState = useLayoutStore.getState();
  return layoutSourceToTemplate({
    layoutType: layoutState.layoutType,
    selectedPresetId: layoutState.selectedPresetId,
    rows: layoutState.rows,
    cols: layoutState.cols,
    blockSize: layoutState.blockSize,
    sashing: layoutState.sashing,
    borders: layoutState.borders,
    hasCornerstones: layoutState.hasCornerstones,
    bindingWidth: layoutState.bindingWidth,
  });
}
