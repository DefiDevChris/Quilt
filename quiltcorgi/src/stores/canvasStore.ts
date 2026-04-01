'use client';

import { create } from 'zustand';
import type { Canvas as FabricCanvas } from 'fabric';
import type { UnitSystem } from '@/types/canvas';
import {
  ZOOM_DEFAULT,
  ZOOM_MIN,
  ZOOM_MAX,
  UNDO_HISTORY_MAX,
  UNDO_SNAPSHOT_SIZE_LIMIT,
  GRID_DEFAULT_SIZE,
  GRID_DEFAULT_ENABLED,
  GRID_DEFAULT_SNAP,
  REFERENCE_IMAGE_DEFAULT_OPACITY,
  DEFAULT_FILL_COLOR,
  DEFAULT_STROKE_COLOR,
} from '@/lib/constants';
import { clamp } from '@/lib/math-utils';
import { fitToScreenZoom, getPixelsPerUnit } from '@/lib/canvas-utils';

export type ToolType =
  | 'select'
  | 'pan'
  | 'rectangle'
  | 'circle'
  | 'triangle'
  | 'polygon'
  | 'line'
  | 'curve'
  | 'ruler'
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
  showBlockGrid?: boolean;
}

interface CanvasStoreState {
  fabricCanvas: FabricCanvas | null;
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
  isViewportLocked: boolean;
  showSeamAllowance: boolean;
  printScale: number;

  setFabricCanvas: (canvas: FabricCanvas | null) => void;
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
  pushUndoState: (json: string) => boolean;
  popUndo: (currentJson: string) => string | null;
  popRedo: (currentJson: string) => string | null;
  canUndo: () => boolean;
  canRedo: () => boolean;
  resetHistory: () => void;
  setBlockDraftingMode: (mode: BlockDraftingMode) => void;
  setReferenceImageOpacity: (opacity: number) => void;
  setActiveColorwayTool: (tool: ColorwayTool | null) => void;
  setFussyCutTarget: (target: FussyCutTarget | null) => void;
  setViewportLocked: (locked: boolean) => void;
  toggleSeamAllowance: () => void;
  setPrintScale: (scale: number) => void;
  centerAndFitViewport: () => void;
  reset: () => void;
}

const INITIAL_STATE = {
  // WARNING: fabricCanvas is a mutable DOM object. Storing it in Zustand
  // breaks serialization and time-travel debugging. This is a known
  // anti-pattern but kept for pragmatic canvas state management.
  // Consider using React context or a ref for future refactoring.
  fabricCanvas: null as FabricCanvas | null,
  zoom: ZOOM_DEFAULT,
  unitSystem: 'imperial' as UnitSystem,
  gridSettings: {
    enabled: GRID_DEFAULT_ENABLED,
    size: GRID_DEFAULT_SIZE,
    snapToGrid: GRID_DEFAULT_SNAP,
  },
  selectedObjectIds: [] as string[],
  activeTool: 'select' as ToolType,
  activeWorktable: 'quilt' as WorktableType,
  cursorPosition: { x: 0, y: 0 },
  isSpacePressed: false,
  fillColor: DEFAULT_FILL_COLOR,
  strokeColor: DEFAULT_STROKE_COLOR,
  strokeWidth: 1,
  undoStack: [] as string[],
  redoStack: [] as string[],
  blockDraftingMode: 'freeform' as BlockDraftingMode,
  referenceImageOpacity: REFERENCE_IMAGE_DEFAULT_OPACITY,
  activeColorwayTool: null as ColorwayTool | null,
  fussyCutTarget: null as FussyCutTarget | null,
  isViewportLocked: true,
  showSeamAllowance: true,
  printScale: 1.0,
};

export const useCanvasStore = create<CanvasStoreState>((set, get) => ({
  ...INITIAL_STATE,

  setFabricCanvas: (canvas) => set({ fabricCanvas: canvas }),

  setZoom: (zoom) => set({ zoom: clamp(zoom, ZOOM_MIN, ZOOM_MAX) }),

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

  pushUndoState: (json) => {
    if (json.length > UNDO_SNAPSHOT_SIZE_LIMIT) {
      console.warn(
        `Undo snapshot exceeds size limit (${UNDO_SNAPSHOT_SIZE_LIMIT / 1024 / 1024}MB). ` +
          `Snapshot size: ${(json.length / 1024 / 1024).toFixed(2)}MB. ` +
          'Undo disabled for this action. Consider reducing canvas complexity.'
      );
      return false;
    }
    set((state) => ({
      undoStack: [...state.undoStack.slice(-(UNDO_HISTORY_MAX - 1)), json],
      redoStack: [],
    }));
    return true;
  },

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

  setReferenceImageOpacity: (opacity) => set({ referenceImageOpacity: clamp(opacity, 0, 1) }),

  setActiveColorwayTool: (tool) => set({ activeColorwayTool: tool }),

  setFussyCutTarget: (target) => set({ fussyCutTarget: target }),

  setViewportLocked: (locked) => {
    set({ isViewportLocked: locked });
    if (locked) {
      get().centerAndFitViewport();
    }
  },

  toggleSeamAllowance: () => set((state) => ({ showSeamAllowance: !state.showSeamAllowance })),

  setPrintScale: (scale) => set({ printScale: clamp(scale, 0.1, 2.0) }),

  centerAndFitViewport: () => {
    const { fabricCanvas, unitSystem } = get();
    if (!fabricCanvas) return;
    const el = (fabricCanvas as unknown as { wrapperEl: HTMLElement }).wrapperEl;
    if (!el) return;
    // Lazy import to avoid circular dependency with projectStore
    const { useProjectStore } = require('@/stores/projectStore') as {
      useProjectStore: { getState: () => { canvasWidth: number; canvasHeight: number } };
    };
    const { canvasWidth, canvasHeight } = useProjectStore.getState();
    const pxPerUnit = getPixelsPerUnit(unitSystem);
    const containerW = el.clientWidth;
    const containerH = el.clientHeight;
    const zoom = fitToScreenZoom(containerW, containerH, canvasWidth, canvasHeight, unitSystem);
    const quiltWPx = canvasWidth * pxPerUnit;
    const quiltHPx = canvasHeight * pxPerUnit;
    const panX = (containerW - quiltWPx * zoom) / 2;
    const panY = (containerH - quiltHPx * zoom) / 2;
    fabricCanvas.setViewportTransform([zoom, 0, 0, zoom, panX, panY]);
    set({ zoom });
    fabricCanvas.renderAll();
  },

  reset: () => {
    // Canvas disposal is handled by useCanvasInit cleanup — only reset store state
    set({ ...INITIAL_STATE });
  },
}));
