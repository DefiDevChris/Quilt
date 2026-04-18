import { create } from 'zustand';
import type { LayoutType } from '@/lib/layout-utils';

export type LeftPanelMode = 'none' | 'layouts' | 'templates';
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