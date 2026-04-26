import { create } from 'zustand';
import type { LayoutType, SashingConfig, BorderConfig } from '@/lib/layout-utils';
import { DEFAULT_LAYOUT } from '@/lib/design-system';

interface LayoutStoreState {
  layoutType: LayoutType;
  selectedPresetId: string | null;
  /** Which layout type card is currently expanded in the selector */
  expandedCardId: string | null;
  rows: number;
  cols: number;
  blockSize: number;
  sashing: SashingConfig;
  borders: BorderConfig[];
  hasCornerstones: boolean;
  bindingWidth: number;
  /** True when fence overlay is in preview mode (40% opacity) */
  previewMode: boolean;
  /** True when a layout has been applied (fence is permanent) */
  hasAppliedLayout: boolean;
  /** True after user commits to template/layout — disables all layout setters */
  layoutLocked: boolean;

  setLayoutType: (type: LayoutType) => void;
  setSelectedPreset: (presetId: string | null) => void;
  setExpandedCardId: (id: string | null) => void;
  setRows: (rows: number) => void;
  setCols: (cols: number) => void;
  setBlockSize: (size: number) => void;
  setSashing: (updates: Partial<SashingConfig>) => void;
  setBorders: (borders: BorderConfig[]) => void;
  addBorder: () => void;
  updateBorder: (index: number, updates: Partial<BorderConfig>) => void;
  removeBorder: (index: number) => void;
  setHasCornerstones: (value: boolean) => void;
  setBindingWidth: (width: number) => void;
  setPreviewMode: (preview: boolean) => void;
  /** Apply the current layout preview — makes fence permanent */
  applyLayout: () => void;
  /** Commit layout/template and lock all layout setters (called on "Start Designing") */
  applyLayoutAndLock: () => void;
  /**
   * Commit a freeform mode (no fence) and lock the choice. Sets `layoutLocked`
   * to true to advance from configuring → designing phase, but unlike
   * `applyLayoutAndLock` does NOT set `hasAppliedLayout` (no fence is drawn,
   * so drawing tools remain available in the toolbar).
   */
  applyFreeformAndLock: () => void;
  /** Clear the applied layout — removes fence and resets state */
  clearLayout: () => void;
  reset: () => void;
}

const DEFAULT_SASHING: SashingConfig = {
  width: 1,
  color: DEFAULT_LAYOUT.sashing,
  fabricId: null,
};

function createBorder(overrides?: Partial<BorderConfig>): BorderConfig {
  return {
    id: crypto.randomUUID(),
    width: 2,
    color: DEFAULT_LAYOUT.border,
    fabricId: null,
    type: 'solid',
    ...overrides,
  };
}

const INITIAL_STATE = {
  layoutType: 'none' as LayoutType,
  selectedPresetId: null as string | null,
  expandedCardId: null as string | null,
  rows: 3,
  cols: 3,
  blockSize: 6,
  sashing: { ...DEFAULT_SASHING },
  borders: [] as BorderConfig[],
  hasCornerstones: true,
  bindingWidth: 0.25,
  previewMode: false,
  hasAppliedLayout: false,
  layoutLocked: false,
};

export const useLayoutStore = create<LayoutStoreState>((set, get) => ({
  ...INITIAL_STATE,

  setLayoutType: (layoutType) => {
    if (get().layoutLocked) return;
    set({ layoutType });
  },

  setSelectedPreset: (selectedPresetId) => {
    if (get().layoutLocked) return;
    set({ selectedPresetId });
  },

  setExpandedCardId: (expandedCardId) => {
    if (get().layoutLocked) return;
    set({ expandedCardId });
  },

  setRows: (rows) => {
    if (get().layoutLocked) return;
    set({ rows: Math.max(1, Math.min(20, rows)) });
  },

  setCols: (cols) => {
    if (get().layoutLocked) return;
    set({ cols: Math.max(1, Math.min(20, cols)) });
  },

  setBlockSize: (blockSize) => {
    if (get().layoutLocked) return;
    set({ blockSize: Math.max(1, Math.min(24, blockSize)) });
  },

  setSashing: (updates) => {
    if (get().layoutLocked) return;
    set((state) => ({
      sashing: { ...state.sashing, ...updates },
    }));
  },

  setBorders: (borders) => {
    if (get().layoutLocked) return;
    set({ borders });
  },

  addBorder: () => {
    if (get().layoutLocked) return;
    set((state) => {
      if (state.borders.length >= 5) return state;
      return { borders: [...state.borders, createBorder()] };
    });
  },

  updateBorder: (index, updates) => {
    if (get().layoutLocked) return;
    set((state) => ({
      borders: state.borders.map((b, i) => (i === index ? { ...b, ...updates } : b)),
    }));
  },

  removeBorder: (index) => {
    if (get().layoutLocked) return;
    set((state) => ({
      borders: state.borders.filter((_, i) => i !== index),
    }));
  },

  setHasCornerstones: (hasCornerstones) => {
    if (get().layoutLocked) return;
    set({ hasCornerstones });
  },

  setBindingWidth: (bindingWidth) => {
    if (get().layoutLocked) return;
    set({ bindingWidth: Math.max(0, Math.min(2, bindingWidth)) });
  },

  setPreviewMode: (previewMode) => set({ previewMode }),

  applyLayout: () => set({ previewMode: false, hasAppliedLayout: true }),

  applyLayoutAndLock: () =>
    set({ previewMode: false, hasAppliedLayout: true, layoutLocked: true }),

  applyFreeformAndLock: () =>
    set({ previewMode: false, hasAppliedLayout: false, layoutLocked: true }),

  clearLayout: () => {
    if (get().layoutLocked) return;
    set({ ...INITIAL_STATE });
  },

  reset: () => set({ ...INITIAL_STATE }),
}));
