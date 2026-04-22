import { create } from 'zustand';
import type { UnitSystem } from '@/types/canvas';
import type { CanvasGridSettings, GridGranularity } from '@/types/grid';
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
} from '@/lib/constants';
import { DEFAULT_CANVAS } from '@/lib/design-system';
import { clamp } from '@/lib/math-utils';
import { fitToScreenZoom, computeViewportTransform, clampPan } from '@/lib/canvas-utils';
import { useProjectStore } from '@/stores/projectStore';

/**
 * Lower bound for zoom: fit-to-screen for the current quilt in the given
 * canvas wrapper. Falls back to the hard-coded ZOOM_MIN when dimensions are
 * unavailable. Keeps the quilt from shrinking below fully-visible.
 */
function getDynamicMinZoom(canvas: unknown): number {
  const fabricCanvas = canvas as { wrapperEl?: HTMLElement } | null;
  const el = fabricCanvas?.wrapperEl;
  if (!el) return ZOOM_MIN;
  const { canvasWidth, canvasHeight } = useProjectStore.getState();
  const { unitSystem } = useCanvasStore.getState();
  const fit = fitToScreenZoom(
    el.clientWidth,
    el.clientHeight,
    canvasWidth,
    canvasHeight,
    unitSystem
  );
  return Math.max(ZOOM_MIN, fit);
}

export type ToolType =
  | 'select'
  | 'pan'
  | 'easydraw'
  | 'bend'
  | 'rectangle'
  | 'circle'
  | 'triangle'
  | 'polygon';

export type BlockDraftingMode = 'freeform' | 'blockbuilder';

export type WorktableType = 'quilt' | 'block-builder';

interface CanvasStoreState {
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
  referenceImageUrl: string;
  showReferencePanel: boolean;

  /** The currently selected patch sub-object inside a block group, or null. */
  selectedPatch: unknown | null;

  /** When true, patches are temporarily recolored by shade category. */
  shadeViewActive: boolean;

  /** The Fabric.js canvas instance, or null. */
  fabricCanvas: unknown | null;

  /** Target for fabric picker: 'selection' when coloring selected object, 'background' for quilt background, null when closed. */
  fabricPickerTarget: 'selection' | 'background' | null;

  /** When true, the user is in swap mode (tap another block to swap positions). */
  swapMode: boolean;

  /** The source block for swap mode (the one that initiated the swap). */
  swapSourceId: string | null;

  setZoom: (zoom: number) => void;
  setUnitSystem: (unit: UnitSystem) => void;
  setGridSettings: (settings: Partial<CanvasGridSettings>) => void;
  setGridGranularity: (granularity: GridGranularity) => void;
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

  setViewportLocked: (
    locked: boolean,
    canvas?: unknown,
    canvasWidth?: number,
    canvasHeight?: number
  ) => void;
  toggleSeamAllowance: () => void;
  setPrintScale: (scale: number) => void;
  setEasyDrawMode: (mode: 'straight' | 'smooth') => void;
  setBlockBuilderMode: (mode: 'straight' | 'smooth') => void;
  centerAndFitViewport: (canvas: unknown, canvasWidth: number, canvasHeight: number) => void;
  zoomAndCenter: (
    newZoom: number,
    canvas: unknown,
    canvasWidth: number,
    canvasHeight: number
  ) => void;
  zoomAtPoint: (newZoom: number, canvas: unknown, screenX?: number, screenY?: number) => void;
  saveToolSettings: (tool: ToolType) => void;
  loadToolSettings: (tool: ToolType) => void;
  setClipboard: (objects: unknown[]) => void;
  setReferenceImageUrl: (url: string) => void;
  setShowReferencePanel: (show: boolean) => void;
  toggleReferencePanel: () => void;
  setSelectedPatch: (patch: unknown | null) => void;
  setShadeViewActive: (active: boolean) => void;
  toggleShadeView: () => void;
  setFabricCanvas: (canvas: unknown | null) => void;
  setFabricPickerTarget: (target: 'selection' | 'background' | null) => void;
  setSwapMode: (active: boolean, sourceId?: string | null) => void;
  clearSwapMode: () => void;
  reset: () => void;
}

const INITIAL_STATE = {
  zoom: ZOOM_DEFAULT,
  unitSystem: 'imperial' as UnitSystem,
  gridSettings: {
    enabled: GRID_DEFAULT_ENABLED,
    size: GRID_DEFAULT_SIZE,
    snapToGrid: GRID_DEFAULT_SNAP,
    granularity: 'inch' as GridGranularity,
  },
  selectedObjectIds: [] as string[],
  activeTool: 'select' as ToolType,
  activeWorktable: 'quilt' as WorktableType,

  cursorPosition: { x: 0, y: 0 },
  isSpacePressed: false,
  fillColor: DEFAULT_CANVAS.fill,
  strokeColor: DEFAULT_CANVAS.stroke,
  strokeWidth: 1,
  undoStack: [] as string[],
  redoStack: [] as string[],
  blockDraftingMode: 'freeform' as BlockDraftingMode,
  referenceImageOpacity: REFERENCE_IMAGE_DEFAULT_OPACITY,

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
  referenceImageUrl: '',
  showReferencePanel: false,
  selectedPatch: null as unknown | null,
  shadeViewActive: false,
  fabricCanvas: null,
  fabricPickerTarget: null,
  swapMode: false,
  swapSourceId: null,
};

export const useCanvasStore = create<CanvasStoreState>((set, get) => ({
  ...INITIAL_STATE,

  setZoom: (zoom) => {
    const { fabricCanvas } = get();
    const min = getDynamicMinZoom(fabricCanvas);
    set({ zoom: clamp(zoom, min, ZOOM_MAX) });
  },

  setUnitSystem: (unitSystem) => set({ unitSystem }),

  setGridSettings: (updates) =>
    set((state) => ({
      gridSettings: { ...state.gridSettings, ...updates },
    })),

  setGridGranularity: (granularity) =>
    set((state) => ({
      gridSettings: { ...state.gridSettings, granularity },
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

  setViewportLocked: (locked, canvas, canvasWidth, canvasHeight) => {
    set({ isViewportLocked: locked });
    if (locked && canvas && canvasWidth !== undefined && canvasHeight !== undefined) {
      get().centerAndFitViewport(canvas, canvasWidth, canvasHeight);
    }
  },

  toggleSeamAllowance: () => set((state) => ({ showSeamAllowance: !state.showSeamAllowance })),

  setPrintScale: (scale) => set({ printScale: clamp(scale, 0.1, 2.0) }),

  setEasyDrawMode: (mode) => set({ easyDrawMode: mode }),

  setBlockBuilderMode: (mode) => set({ blockBuilderMode: mode }),

  centerAndFitViewport: (canvas: unknown, canvasWidth: number, canvasHeight: number) => {
    const { unitSystem } = get();
    const fabricCanvas = canvas as {
      wrapperEl: HTMLElement;
      setViewportTransform: (vp: number[]) => void;
      renderAll: () => void;
    } | null;
    if (!fabricCanvas) return;
    const el = fabricCanvas.wrapperEl;
    if (!el) return;
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

  zoomAndCenter: (newZoom: number, canvas: unknown, canvasWidth: number, canvasHeight: number) => {
    const { unitSystem } = get();
    const fabricCanvas = canvas as {
      wrapperEl: HTMLElement;
      setViewportTransform: (vp: number[]) => void;
      renderAll: () => void;
    } | null;
    if (!fabricCanvas) return;
    const el = fabricCanvas.wrapperEl;
    if (!el) return;
    const containerW = el.clientWidth;
    const containerH = el.clientHeight;
    const minZoom = Math.max(
      ZOOM_MIN,
      fitToScreenZoom(containerW, containerH, canvasWidth, canvasHeight, unitSystem)
    );
    const clamped = clamp(newZoom, minZoom, ZOOM_MAX);
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

  /**
   * Zoom toward a specific screen point (defaults to viewport center) without
   * recentering the canvas. Preserves the user's pan position so successive
   * zoom clicks feel smooth instead of jumping back to center.
   */
  zoomAtPoint: (newZoom: number, canvas: unknown, screenX?: number, screenY?: number) => {
    const fabricCanvas = canvas as { wrapperEl: HTMLElement } | null;
    if (!fabricCanvas) return;
    const el = fabricCanvas.wrapperEl;
    if (!el) return;
    const clamped = clamp(newZoom, getDynamicMinZoom(fabricCanvas), ZOOM_MAX);
    const px = screenX ?? el.clientWidth / 2;
    const py = screenY ?? el.clientHeight / 2;
    // Lazy import to avoid pulling fabric into the store at module load
    void import('fabric').then((fabric) => {
      const c = fabricCanvas as unknown as {
        zoomToPoint: (point: import('fabric').Point, zoom: number) => void;
        renderAll: () => void;
        viewportTransform: number[];
        setViewportTransform: (vp: number[]) => void;
      };
      c.zoomToPoint(new fabric.Point(px, py), clamped);
      const vt = c.viewportTransform;
      if (vt) {
        const { canvasWidth, canvasHeight } = useProjectStore.getState();
        const { unitSystem } = get();
        const clampedPan = clampPan(
          vt[4],
          vt[5],
          vt[0],
          el.clientWidth,
          el.clientHeight,
          canvasWidth,
          canvasHeight,
          unitSystem
        );
        c.setViewportTransform([vt[0], vt[1], vt[2], vt[3], clampedPan.panX, clampedPan.panY]);
      }
      set({ zoom: clamped });
      c.renderAll();
    });
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
        fillColor: saved.fillColor ?? DEFAULT_CANVAS.fill,
        strokeColor: saved.strokeColor ?? DEFAULT_CANVAS.stroke,
        strokeWidth: saved.strokeWidth ?? 1,
      });
    }
  },

  setClipboard: (clipboard) => set({ clipboard }),
  setSelectedPatch: (patch) => set({ selectedPatch: patch }),
  setShadeViewActive: (active) => set({ shadeViewActive: active }),
  toggleShadeView: () => set((s) => ({ shadeViewActive: !s.shadeViewActive })),
  setFabricCanvas: (canvas) => set({ fabricCanvas: canvas }),
  setFabricPickerTarget: (target) => set({ fabricPickerTarget: target }),
  setSwapMode: (active, sourceId = null) => set({ swapMode: active, swapSourceId: sourceId }),
  clearSwapMode: () => set({ swapMode: false, swapSourceId: null }),
  setReferenceImageUrl: (referenceImageUrl) => set({ referenceImageUrl }),
  setShowReferencePanel: (showReferencePanel) => set({ showReferencePanel }),
  toggleReferencePanel: () => set((s) => ({ showReferencePanel: !s.showReferencePanel })),

  reset: () => {
    // Canvas disposal is handled by useCanvasInit cleanup — only reset store state
    set({ ...INITIAL_STATE });
  },
}));
