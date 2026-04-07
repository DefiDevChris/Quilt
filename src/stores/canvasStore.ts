'use client';

import { create } from 'zustand';
import type { Canvas as FabricCanvas } from 'fabric';
import type { UnitSystem } from '@/types/canvas';
import type { CanvasGridSettings } from '@/types/grid';
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
import { fitToScreenZoom, computeViewportTransform } from '@/lib/canvas-utils';
import { getProjectDimensions } from '@/stores/store-bridge';

export type ToolType =
  | 'select'
  | 'pan'
  | 'rectangle'
  | 'circle'
  | 'triangle'
  | 'polygon'
  | 'line'
  | 'blockbuilder'
  | 'easydraw'
  | 'text'
  | 'spraycan'
  | 'bend'
  | 'curve'
  | 'eyedropper';

export type BlockDraftingMode = 'freeform' | 'blockbuilder';

export type ColorThemeTool = 'spraycan' | 'swap' | 'randomize';

export type WorktableType = 'quilt' | 'layout' | 'block' | 'image' | 'print';

interface CanvasStoreState {
  fabricCanvas: FabricCanvas | null;
  zoom: number;
  unitSystem: UnitSystem;
  gridSettings: CanvasGridSettings;
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
  activeColorwayTool: ColorThemeTool | null;

  isViewportLocked: boolean;
  showSeamAllowance: boolean;
  printScale: number;
  easyDrawMode: 'straight' | 'smooth';
  blockBuilderMode: 'straight' | 'smooth';
  toolSettings: Record<
    ToolType,
    { fillColor?: string; strokeColor?: string; strokeWidth?: number }
  >;
  clipboard: unknown[];
  showLayoutOverlay: boolean;
  autoAlignToPattern: boolean;
  referenceImageUrl: string;
  showReferencePanel: boolean;
  backgroundColor: string;

  setFabricCanvas: (canvas: FabricCanvas | null) => void;
  setZoom: (zoom: number) => void;
  setUnitSystem: (unit: UnitSystem) => void;
  setGridSettings: (settings: Partial<CanvasGridSettings>) => void;
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
  setActiveColorwayTool: (tool: ColorThemeTool | null) => void;

  setViewportLocked: (locked: boolean) => void;
  toggleSeamAllowance: () => void;
  setPrintScale: (scale: number) => void;
  setEasyDrawMode: (mode: 'straight' | 'smooth') => void;
  setBlockBuilderMode: (mode: 'straight' | 'smooth') => void;
  centerAndFitViewport: () => void;
  zoomAndCenter: (newZoom: number) => void;
  saveToolSettings: (tool: ToolType) => void;
  loadToolSettings: (tool: ToolType) => void;
  setClipboard: (objects: unknown[]) => void;
  setShowLayoutOverlay: (show: boolean) => void;
  setAutoAlignToPattern: (auto: boolean) => void;
  setBackgroundColor: (color: string) => void;
  setReferenceImageUrl: (url: string) => void;
  setShowReferencePanel: (show: boolean) => void;
  toggleReferencePanel: () => void;
  initFromProject: (project: any) => void;
  setDimensions: (width: number, height: number) => void;
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
  activeColorwayTool: null as ColorThemeTool | null,

  isViewportLocked: false,
  showSeamAllowance: true,
  printScale: 1.0,
  easyDrawMode: 'straight' as const,
  blockBuilderMode: 'straight' as const,
  toolSettings: {} as Record<
    ToolType,
    { fillColor?: string; strokeColor?: string; strokeWidth?: number }
  >,
  clipboard: [] as unknown[],
  showLayoutOverlay: true,
  autoAlignToPattern: true,
  referenceImageUrl: '',
  showReferencePanel: false,
  backgroundColor: '#FFFFFF',
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
  setActiveTool: (tool) => {
    const { saveToolSettings, loadToolSettings } = get();
    saveToolSettings(get().activeTool);
    set({ activeTool: tool });
    loadToolSettings(tool);
  },
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

  setViewportLocked: (locked) => {
    set({ isViewportLocked: locked });
    if (locked) {
      get().centerAndFitViewport();
    }
  },

  toggleSeamAllowance: () => set((state) => ({ showSeamAllowance: !state.showSeamAllowance })),

  setPrintScale: (scale) => set({ printScale: clamp(scale, 0.1, 2.0) }),

  setEasyDrawMode: (mode) => set({ easyDrawMode: mode }),

  setBlockBuilderMode: (mode) => set({ blockBuilderMode: mode }),

  centerAndFitViewport: () => {
    const { fabricCanvas, unitSystem } = get();
    if (!fabricCanvas) return;
    const el = (fabricCanvas as unknown as { wrapperEl: HTMLElement }).wrapperEl;
    if (!el) return;
    const { canvasWidth, canvasHeight } = getProjectDimensions();
    const containerW = el.clientWidth;
    const containerH = el.clientHeight;
    const zoom = fitToScreenZoom(containerW, containerH, canvasWidth, canvasHeight, unitSystem);
    const vp = computeViewportTransform(
      containerW,
      containerH,
      canvasWidth,
      canvasHeight,
      zoom,
      unitSystem
    );
    fabricCanvas.setViewportTransform([vp.zoom, 0, 0, vp.zoom, vp.panX, vp.panY]);
    set({ zoom: vp.zoom });
    fabricCanvas.renderAll();
  },

  zoomAndCenter: (newZoom: number) => {
    const { fabricCanvas, unitSystem } = get();
    if (!fabricCanvas) return;
    const clamped = clamp(newZoom, ZOOM_MIN, ZOOM_MAX);
    const el = (fabricCanvas as unknown as { wrapperEl: HTMLElement }).wrapperEl;
    if (!el) return;
    const { canvasWidth, canvasHeight } = getProjectDimensions();
    const containerW = el.clientWidth;
    const containerH = el.clientHeight;
    const vp = computeViewportTransform(
      containerW,
      containerH,
      canvasWidth,
      canvasHeight,
      clamped,
      unitSystem
    );
    fabricCanvas.setViewportTransform([vp.zoom, 0, 0, vp.zoom, vp.panX, vp.panY]);
    set({ zoom: vp.zoom });
    fabricCanvas.renderAll();
  },

  saveToolSettings: (tool) => {
    const { fillColor, strokeColor, strokeWidth, toolSettings } = get();
    set({
      toolSettings: {
        ...toolSettings,
        [tool]: { fillColor, strokeColor, strokeWidth },
      },
    });
  },

  loadToolSettings: (tool) => {
    const { toolSettings } = get();
    const saved = toolSettings[tool];
    if (saved) {
      set({
        fillColor: saved.fillColor ?? DEFAULT_FILL_COLOR,
        strokeColor: saved.strokeColor ?? DEFAULT_STROKE_COLOR,
        strokeWidth: saved.strokeWidth ?? 1,
      });
    }
  },

  setClipboard: (clipboard) => set({ clipboard }),

  setShowLayoutOverlay: (showLayoutOverlay) => set({ showLayoutOverlay }),

  setAutoAlignToPattern: (autoAlignToPattern) => set({ autoAlignToPattern }),

  setBackgroundColor: (backgroundColor) => set({ backgroundColor }),
  setReferenceImageUrl: (referenceImageUrl) => set({ referenceImageUrl }),
  setShowReferencePanel: (showReferencePanel) => set({ showReferencePanel }),
  toggleReferencePanel: () => set((s) => ({ showReferencePanel: !s.showReferencePanel })),

  initFromProject: (project) => {
    // Basic hydration from project model
    set({
      unitSystem: project.unitSystem || 'imperial',
      gridSettings: project.gridSettings || INITIAL_STATE.gridSettings,
      backgroundColor: project.canvasData?.backgroundColor || '#FFFFFF',
    });
  },

  setDimensions: (width, height) => {
    // This typically triggers on-canvas resizing or informs the bridge
    // For now, update local state if we had it, but mostly this is for the layout engine
    // which reads from projectState or bridge.
    console.log(`Setting dimensions: ${width}x${height}`);
    // If the schema was also updated to have these columns, we'd set them here.
  },

  reset: () => {
    // Canvas disposal is handled by useCanvasInit cleanup — only reset store state
    set({ ...INITIAL_STATE });
  },
}));
