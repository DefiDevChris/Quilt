'use client';

import { create } from 'zustand';
import type { UnitSystem } from '@/types/canvas';
import {
  ZOOM_DEFAULT,
  ZOOM_MIN,
  ZOOM_MAX,
  UNDO_HISTORY_MAX,
  GRID_DEFAULT_SIZE,
  GRID_DEFAULT_ENABLED,
  GRID_DEFAULT_SNAP,
  REFERENCE_IMAGE_DEFAULT_OPACITY,
} from '@/lib/constants';

export type ToolType =
  | 'select'
  | 'rectangle'
  | 'triangle'
  | 'polygon'
  | 'line'
  | 'curve'
  | 'easydraw'
  | 'text'
  | 'eyedropper'
  | 'spraycan';

export type BlockDraftingMode = 'freeform' | 'easydraw' | 'applique';

export type ColorwayTool = 'spraycan' | 'swap' | 'randomize' | 'eyedropper';

export interface FussyCutTarget {
  readonly objectId: string;
  readonly fabricId: string;
  readonly fabricImageUrl: string;
  readonly patchVertices: readonly { x: number; y: number }[];
}

export type WorktableType = 'quilt' | 'block' | 'image' | 'print';

interface GridSettings {
  enabled: boolean;
  size: number;
  snapToGrid: boolean;
  snapToNodes?: boolean;
}

interface CanvasStoreState {
  fabricCanvas: unknown;
  zoom: number;
  unitSystem: UnitSystem;
  gridSettings: GridSettings;
  selectedObjectIds: string[];
  activeTool: ToolType;
  activeWorktable: WorktableType;
  cursorPosition: { x: number; y: number };
  isSpacePressed: boolean;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  undoStack: string[];
  redoStack: string[];
  blockDraftingMode: BlockDraftingMode;
  referenceImageOpacity: number;
  activeColorwayTool: ColorwayTool | null;
  fussyCutTarget: FussyCutTarget | null;

  setFabricCanvas: (canvas: unknown) => void;
  setZoom: (zoom: number) => void;
  setUnitSystem: (unit: UnitSystem) => void;
  setGridSettings: (settings: Partial<GridSettings>) => void;
  setSelectedObjectIds: (ids: string[]) => void;
  setActiveTool: (tool: ToolType) => void;
  setActiveWorktable: (worktable: WorktableType) => void;
  setCursorPosition: (pos: { x: number; y: number }) => void;
  setIsSpacePressed: (pressed: boolean) => void;
  setFillColor: (color: string) => void;
  setStrokeColor: (color: string) => void;
  setStrokeWidth: (width: number) => void;
  pushUndoState: (json: string) => void;
  popUndo: (currentJson: string) => string | null;
  popRedo: (currentJson: string) => string | null;
  canUndo: () => boolean;
  canRedo: () => boolean;
  resetHistory: () => void;
  setBlockDraftingMode: (mode: BlockDraftingMode) => void;
  setReferenceImageOpacity: (opacity: number) => void;
  setActiveColorwayTool: (tool: ColorwayTool | null) => void;
  setFussyCutTarget: (target: FussyCutTarget | null) => void;
}

export const useCanvasStore = create<CanvasStoreState>((set, get) => ({
  fabricCanvas: null,
  zoom: ZOOM_DEFAULT,
  unitSystem: 'imperial',
  gridSettings: {
    enabled: GRID_DEFAULT_ENABLED,
    size: GRID_DEFAULT_SIZE,
    snapToGrid: GRID_DEFAULT_SNAP,
  },
  selectedObjectIds: [],
  activeTool: 'select',
  activeWorktable: 'quilt',
  cursorPosition: { x: 0, y: 0 },
  isSpacePressed: false,
  fillColor: '#8d4f00',
  strokeColor: '#383831',
  strokeWidth: 1,
  undoStack: [],
  redoStack: [],
  blockDraftingMode: 'freeform',
  referenceImageOpacity: REFERENCE_IMAGE_DEFAULT_OPACITY,
  activeColorwayTool: null,
  fussyCutTarget: null,

  setFabricCanvas: (canvas) => set({ fabricCanvas: canvas }),

  setZoom: (zoom) => set({ zoom: Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoom)) }),

  setUnitSystem: (unitSystem) => set({ unitSystem }),

  setGridSettings: (updates) =>
    set((state) => ({
      gridSettings: { ...state.gridSettings, ...updates },
    })),

  setSelectedObjectIds: (ids) => set({ selectedObjectIds: ids }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  setActiveWorktable: (worktable) => set({ activeWorktable: worktable }),
  setCursorPosition: (pos) => set({ cursorPosition: pos }),
  setIsSpacePressed: (pressed) => set({ isSpacePressed: pressed }),
  setFillColor: (color) => set({ fillColor: color }),
  setStrokeColor: (color) => set({ strokeColor: color }),
  setStrokeWidth: (width) => set({ strokeWidth: width }),

  pushUndoState: (json) =>
    set((state) => ({
      undoStack: [...state.undoStack.slice(-(UNDO_HISTORY_MAX - 1)), json],
      redoStack: [],
    })),

  popUndo: (currentJson) => {
    const { undoStack } = get();
    if (undoStack.length === 0) return null;
    const prevState = undoStack[undoStack.length - 1];
    set((state) => ({
      undoStack: state.undoStack.slice(0, -1),
      redoStack: [...state.redoStack, currentJson],
    }));
    return prevState;
  },

  popRedo: (currentJson) => {
    const { redoStack } = get();
    if (redoStack.length === 0) return null;
    const nextState = redoStack[redoStack.length - 1];
    set((state) => ({
      redoStack: state.redoStack.slice(0, -1),
      undoStack: [...state.undoStack, currentJson],
    }));
    return nextState;
  },

  canUndo: () => get().undoStack.length > 0,
  canRedo: () => get().redoStack.length > 0,
  resetHistory: () => set({ undoStack: [], redoStack: [] }),

  setBlockDraftingMode: (mode) => set({ blockDraftingMode: mode }),

  setReferenceImageOpacity: (opacity) =>
    set({ referenceImageOpacity: Math.max(0, Math.min(1, opacity)) }),

  setActiveColorwayTool: (tool) => set({ activeColorwayTool: tool }),

  setFussyCutTarget: (target) => set({ fussyCutTarget: target }),
}));
