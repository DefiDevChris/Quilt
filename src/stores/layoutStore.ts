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
  layoutType: 'free-form' as LayoutType,
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

/**
 * Some setters are off-limits once the user has clicked "Start Designing"
 * — namely the structural ones (rows/cols/blockSize/sashing). But in
 * free-form mode the user is expected to keep adding borders and edging
 * after the lock, so border/binding setters bypass the lock when the
 * layoutType is 'free-form'. See the three-mode spec, Phase 2 actions
 * for free-form ("Add Border" / "Add Edging").
 */
function isLockedForStructure(state: { layoutLocked: boolean }): boolean {
  return state.layoutLocked;
}

function isLockedForDecoration(state: { layoutLocked: boolean; layoutType: LayoutType }): boolean {
  if (!state.layoutLocked) return false;
  return state.layoutType !== 'free-form';
}

export const useLayoutStore = create<LayoutStoreState>((set, get) => {
  /** Generic guarded setter: skips update when guard returns true. */
  function makeSetter<T>(
    guard: (state: LayoutStoreState) => boolean,
    mapper: (value: T) => Partial<LayoutStoreState>
  ) {
    return (value: T) => {
      if (guard(get())) return;
      set(mapper(value));
    };
  }

  return {
    ...INITIAL_STATE,

    setLayoutType: makeSetter<LayoutType>(isLockedForStructure, (layoutType) => ({ layoutType })),
    setSelectedPreset: makeSetter<string | null>(isLockedForStructure, (selectedPresetId) => ({ selectedPresetId })),
    setExpandedCardId: makeSetter<string | null>(isLockedForStructure, (expandedCardId) => ({ expandedCardId })),
    setRows: makeSetter<number>(isLockedForStructure, (rows) => ({ rows: Math.max(1, Math.min(20, rows)) })),
    setCols: makeSetter<number>(isLockedForStructure, (cols) => ({ cols: Math.max(1, Math.min(20, cols)) })),
    setBlockSize: makeSetter<number>(isLockedForStructure, (blockSize) => ({ blockSize: Math.max(1, Math.min(24, blockSize)) })),

    setSashing: (updates) => {
      if (isLockedForStructure(get())) return;
      set((state) => ({
        sashing: { ...state.sashing, ...updates },
      }));
    },

    setBorders: makeSetter<BorderConfig[]>(isLockedForDecoration, (borders) => ({ borders })),

    addBorder: () => {
      if (isLockedForDecoration(get())) return;
      set((state) => {
        if (state.borders.length >= 5) return state;
        return { borders: [...state.borders, createBorder()] };
      });
    },

    updateBorder: (index, updates) => {
      if (isLockedForDecoration(get())) return;
      set((state) => ({
        borders: state.borders.map((b, i) => (i === index ? { ...b, ...updates } : b)),
      }));
    },

    removeBorder: (index) => {
      if (isLockedForDecoration(get())) return;
      set((state) => ({
        borders: state.borders.filter((_, i) => i !== index),
      }));
    },

    setHasCornerstones: makeSetter<boolean>(isLockedForStructure, (hasCornerstones) => ({ hasCornerstones })),
    setBindingWidth: makeSetter<number>(isLockedForDecoration, (bindingWidth) => ({ bindingWidth: Math.max(0, Math.min(2, bindingWidth)) })),

    setPreviewMode: (previewMode) => set({ previewMode }),

    applyLayout: () => set({ previewMode: false, hasAppliedLayout: true }),

    applyLayoutAndLock: () =>
      set({ previewMode: false, hasAppliedLayout: true, layoutLocked: true }),

    clearLayout: () => {
      if (get().layoutLocked) return;
      set({ ...INITIAL_STATE });
    },

    reset: () => set({ ...INITIAL_STATE }),
  };
});
