import type { useLayoutStore } from '@/stores/layoutStore';

type LayoutStoreState = ReturnType<typeof useLayoutStore.getState>;

/**
 * Structural shape of a layout payload accepted by {@link applyLayoutConfig}.
 * Typed against the layoutStore setter signatures so callers get a compile
 * error if a new store field is added without a corresponding config field.
 */
export interface ApplyableLayoutConfig {
  layoutType: Parameters<LayoutStoreState['setLayoutType']>[0];
  rows: number;
  cols: number;
  blockSize: number;
  sashing: Parameters<LayoutStoreState['setSashing']>[0];
  borders: Parameters<LayoutStoreState['setBorders']>[0];
  hasCornerStones: boolean;
  bindingWidth: number;
  /**
   * Optional preset id to bind the layout to. When omitted, the existing
   * selected preset is cleared (pass explicitly for wizard flows that know
   * the source preset).
   */
  selectedPresetId?: string | null;
}

/**
 * Applies a layout configuration object to the layout store in the canonical
 * order: reset → individual setters → applyLayout(). Extracted from the
 * duplicated sequences in StudioClient (default-layout path) and StudioLayout
 * (wizard-confirm path).
 *
 * @param store   Live layoutStore state slice (call useLayoutStore.getState())
 * @param config  The layout values to apply
 */
export function applyLayoutConfig(
  store: LayoutStoreState,
  config: ApplyableLayoutConfig,
): void {
  store.resetLayout();
  store.setLayoutType(config.layoutType);
  store.setRows(config.rows);
  store.setCols(config.cols);
  store.setBlockSize(config.blockSize);
  store.setSashing(config.sashing);
  store.setBorders(config.borders);
  store.setHasCornerStones(config.hasCornerStones);
  store.setBindingWidth(config.bindingWidth);
  if (config.selectedPresetId !== undefined) {
    store.setSelectedPresetId(config.selectedPresetId);
  }
  store.applyLayout();
}
