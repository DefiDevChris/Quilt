import { create } from 'zustand';

export interface DesignerBlock {
  id: string;
  imageUrl: string;
  thumbnailUrl: string;
  name: string;
}

export interface DesignerBorder {
  width: number;
  fabricId: string | null;
  fabricUrl: string | null;
}

interface DesignerState {
  rows: number;
  cols: number;
  blockSize: number;
  sashingWidth: number;
  sashingFabricId: string | null;
  sashingFabricUrl: string | null;
  borders: DesignerBorder[];
  userBlocks: DesignerBlock[];
  realisticMode: boolean;
  isDirty: boolean;
  lastSavedAt: Date | null;

  setRows: (rows: number) => void;
  setCols: (cols: number) => void;
  setBlockSize: (blockSize: number) => void;
  setSashing: (sashingWidth: number, fabricId?: string | null, fabricUrl?: string | null) => void;
  setBorders: (borders: DesignerBorder[]) => void;
  addBorder: (border: DesignerBorder) => void;
  removeBorder: (index: number) => void;
  setUserBlocks: (blocks: DesignerBlock[]) => void;
  setRealisticMode: (realisticMode: boolean) => void;
  setDirty: (isDirty: boolean) => void;
  setLastSavedAt: (date: Date) => void;
  reset: () => void;
}

const INITIAL_STATE = {
  rows: 3,
  cols: 3,
  blockSize: 12,
  sashingWidth: 0,
  sashingFabricId: null,
  sashingFabricUrl: null,
  borders: [] as DesignerBorder[],
  userBlocks: [] as DesignerBlock[],
  realisticMode: false,
  isDirty: false,
  lastSavedAt: null,
};

export const useDesignerStore = create<DesignerState>((set) => ({
  ...INITIAL_STATE,

  setRows: (rows) => set({ rows, isDirty: true }),

  setCols: (cols) => set({ cols, isDirty: true }),

  setBlockSize: (blockSize) => set({ blockSize, isDirty: true }),

  setSashing: (sashingWidth, fabricId, fabricUrl) =>
    set({
      sashingWidth,
      ...(fabricId !== undefined && { sashingFabricId: fabricId }),
      ...(fabricUrl !== undefined && { sashingFabricUrl: fabricUrl }),
      isDirty: true,
    }),

  setBorders: (borders) => set({ borders, isDirty: true }),

  addBorder: (border) =>
    set((state) => ({
      borders: [...state.borders, border],
      isDirty: true,
    })),

  removeBorder: (index) =>
    set((state) => ({
      borders: state.borders.filter((_, i) => i !== index),
      isDirty: true,
    })),

  setUserBlocks: (userBlocks) => set({ userBlocks, isDirty: true }),

  setRealisticMode: (realisticMode) => set({ realisticMode, isDirty: true }),

  setDirty: (isDirty) => set({ isDirty }),

  setLastSavedAt: (lastSavedAt) => set({ lastSavedAt }),

  reset: () => set({ ...INITIAL_STATE }),
}));
