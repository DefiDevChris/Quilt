import { create } from 'zustand';

export type PatternPiece = {
  colorIndex: number;
  kind: 'square' | 'triangle-a' | 'triangle-b';
  spanW?: number;
  spanH?: number;
  isBackground?: boolean;
};

export type PatternCell = {
  x: number;
  y: number;
  pieces: PatternPiece[];
  blockId?: number;
};

export type BlockInfo = {
  blockId: number;
  blockX: number;
  blockY: number;
  isSolid: boolean;
  dominantColorIndex: number;
  pieces: { colorIndex: number; kind: string; count: number }[];
  totalPieces: number;
};

export type CutListRow = {
  colorIndex: number;
  hex: string;
  squareCount: number;
  triangleCount: number;
  totalCount: number;
};

export type PatternResult = {
  cols: number;
  rows: number;
  blockSize: number;
  blockCols: number;
  blockRows: number;
  pieceSizeInches: number;
  palette: string[];
  cutList: CutListRow[];
  totalPieces: number;
  totalBlocks: number;
  solidBlocks: number;
  piecedBlocks: number;
  cells: PatternCell[];
  blocks: BlockInfo[];
  svgMarkup: string;
  backgroundFabric?: string;
};

export type WizardStep = 'upload' | 'background' | 'canvas';

type PhotoToQuiltState = {
  wizardStep: WizardStep;
  pendingFile: File | null;
  image: HTMLImageElement | null;
  previewUrl: string | null;
  imageName: string;
  workingSize: { width: number; height: number };
  mask: Uint8Array | null;
  removeBackground: boolean;
  isRemovingBg: boolean;
  bgProgress: number;

  pieceSizeDetail: number;
  colorCount: number;
  enhance: number;
  showGrid: boolean;
  showBlockGrid: boolean;

  editMode: 'view' | 'paint' | 'erase';
  paintColorIdx: number;

  result: PatternResult | null;
  history: PatternResult[];
  historyIndex: number;
  generating: boolean;

  showSaveModal: boolean;
  saveName: string;
  isSaving: boolean;
  saveError: string | null;

  showStartOverConfirm: boolean;
};

type PhotoToQuiltActions = {
  setWizardStep: (step: WizardStep) => void;
  setPendingFile: (file: File | null) => void;
  setImage: (img: HTMLImageElement | null) => void;
  setPreviewUrl: (url: string | null) => void;
  setImageName: (name: string) => void;
  setWorkingSize: (size: { width: number; height: number }) => void;
  setMask: (mask: Uint8Array | null) => void;
  setRemoveBackground: (val: boolean) => void;
  setIsRemovingBg: (val: boolean) => void;
  setBgProgress: (val: number) => void;

  setPieceSizeDetail: (val: number) => void;
  setColorCount: (val: number) => void;
  setEnhance: (val: number) => void;
  setShowGrid: (val: boolean) => void;
  setShowBlockGrid: (val: boolean) => void;

  setEditMode: (mode: 'view' | 'paint' | 'erase') => void;
  setPaintColorIdx: (idx: number) => void;

  setResult: (result: PatternResult | null) => void;
  setHistory: (history: PatternResult[]) => void;
  setHistoryIndex: (idx: number) => void;
  setGenerating: (val: boolean) => void;

  setShowSaveModal: (val: boolean) => void;
  setSaveName: (name: string) => void;
  setIsSaving: (val: boolean) => void;
  setSaveError: (err: string | null) => void;

  setShowStartOverConfirm: (val: boolean) => void;

  updatePaletteColor: (idx: number, hex: string) => void;
  resetAll: () => void;
};

const initialState: PhotoToQuiltState = {
  wizardStep: 'upload',
  pendingFile: null,
  image: null,
  previewUrl: null,
  imageName: '',
  workingSize: { width: 0, height: 0 },
  mask: null,
  removeBackground: true,
  isRemovingBg: false,
  bgProgress: 0,

  pieceSizeDetail: 2,
  colorCount: 16,
  enhance: 0,
  showGrid: true,
  showBlockGrid: true,

  editMode: 'view',
  paintColorIdx: 0,

  result: null,
  history: [],
  historyIndex: -1,
  generating: false,

  showSaveModal: false,
  saveName: '',
  isSaving: false,
  saveError: null,

  showStartOverConfirm: false,
};

export const usePhotoToQuiltStore = create<PhotoToQuiltState & PhotoToQuiltActions>((set) => ({
  ...initialState,

  setWizardStep: (wizardStep) => set({ wizardStep }),
  setPendingFile: (pendingFile) => set({ pendingFile }),
  setImage: (image) => set({ image }),
  setPreviewUrl: (previewUrl) => set({ previewUrl }),
  setImageName: (imageName) => set({ imageName }),
  setWorkingSize: (workingSize) => set({ workingSize }),
  setMask: (mask) => set({ mask }),
  setRemoveBackground: (removeBackground) => set({ removeBackground }),
  setIsRemovingBg: (isRemovingBg) => set({ isRemovingBg }),
  setBgProgress: (bgProgress) => set({ bgProgress }),

  setPieceSizeDetail: (pieceSizeDetail) => set({ pieceSizeDetail }),
  setColorCount: (colorCount) => set({ colorCount }),
  setEnhance: (enhance) => set({ enhance }),
  setShowGrid: (showGrid) => set({ showGrid }),
  setShowBlockGrid: (showBlockGrid) => set({ showBlockGrid }),

  setEditMode: (editMode) => set({ editMode }),
  setPaintColorIdx: (paintColorIdx) => set({ paintColorIdx }),

  setResult: (result) => set({ result }),
  setHistory: (history) => set({ history }),
  setHistoryIndex: (historyIndex) => set({ historyIndex }),
  setGenerating: (generating) => set({ generating }),

  setShowSaveModal: (showSaveModal) => set({ showSaveModal }),
  setSaveName: (saveName) => set({ saveName }),
  setIsSaving: (isSaving) => set({ isSaving }),
  setSaveError: (saveError) => set({ saveError }),

  setShowStartOverConfirm: (showStartOverConfirm) => set({ showStartOverConfirm }),

  updatePaletteColor: (idx, nextHex) =>
    set((state) => {
      if (!state.result) return state;
      const newPal = state.result.palette.map((c, i) =>
        i === idx ? nextHex.toUpperCase() : c,
      );
      const newCut = state.result.cutList.map((r) =>
        r.colorIndex === idx ? { ...r, hex: nextHex.toUpperCase() } : r,
      );
      return {
        result: {
          ...state.result,
          palette: newPal,
          cutList: newCut,
        },
      };
    }),

  resetAll: () => {
    const prev = usePhotoToQuiltStore.getState();
    if (prev.previewUrl) {
      try {
        URL.revokeObjectURL(prev.previewUrl);
      } catch {}
    }
    set({ ...initialState });
  },
}));
