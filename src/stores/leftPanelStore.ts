import { create } from 'zustand';
import type { LayoutType } from '@/lib/layout-utils';

export type LeftPanelMode = 'none' | 'layouts' | 'templates' | 'quilt-setup';
export type LayoutBrowserView = 'families' | 'presets';

interface LeftPanelStoreState {
  panelMode: LeftPanelMode;
  layoutBrowserView: LayoutBrowserView;
  selectedFamily: LayoutType | null;
  selectedPresetId: string | null;
  previewCache: string | null;
  previewName: string | null;

  openLayouts: () => void;
  openTemplates: () => void;
  /**
   * Mount the Quilt Size panel in the left rail. This replaces the modal
   * step-2 of the New Project Wizard for in-studio edits of rows / columns /
   * block size / borders / sashing / binding.
   */
  openQuiltSetup: () => void;
  dismiss: () => void;
  drillIntoFamily: (family: LayoutType) => void;
  backToFamilies: () => void;
  selectPreset: (presetId: string) => void;
  startPreview: (canvasJson: string, name: string) => void;
  applyPreview: () => void;
  cancelPreview: () => void;
}

export const useLeftPanelStore = create<LeftPanelStoreState>((set, get) => ({
  panelMode: 'none',
  layoutBrowserView: 'families',
  selectedFamily: null,
  selectedPresetId: null,
  previewCache: null,
  previewName: null,

  openLayouts: () => set({ panelMode: 'layouts', layoutBrowserView: 'families', selectedFamily: null, selectedPresetId: null }),

  openTemplates: () => set({ panelMode: 'templates' }),

  openQuiltSetup: () => set({ panelMode: 'quilt-setup' }),

  dismiss: () => set({
    panelMode: 'none',
    layoutBrowserView: 'families',
    selectedFamily: null,
    selectedPresetId: null,
    previewCache: null,
    previewName: null,
  }),

  drillIntoFamily: (family: LayoutType) => {
    set({ selectedFamily: family, layoutBrowserView: 'presets' });
  },

  backToFamilies: () => {
    const { previewCache } = get();
    set({
      layoutBrowserView: 'families',
      selectedFamily: null,
      selectedPresetId: null,
      previewCache: null,
      previewName: null,
    });
  },

  selectPreset: (presetId: string) => set({ selectedPresetId: presetId }),

  startPreview: (canvasJson: string, name: string) => set({ previewCache: canvasJson, previewName: name }),

  applyPreview: () => set({ previewCache: null, previewName: null }),

  cancelPreview: () => {
    const { previewCache, panelMode } = get();
    set({
      previewCache: null,
      previewName: null,
      selectedPresetId: null,
    });
    if (panelMode === 'layouts') {
      set({ layoutBrowserView: 'families', selectedFamily: null });
    }
  },
}));
