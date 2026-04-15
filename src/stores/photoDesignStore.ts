import { create } from 'zustand';
import type { Point, Patch, ShapeTemplate, DetectedGrid } from '@/types/photo-to-design';

export type Stage = 'upload' | 'perspective' | 'calibrate' | 'review' | 'export';

export interface PhotoDesignState {
  // ── Stage ──────────────────────────────────────────────────────────
  stage: Stage;

  // ── Upload ─────────────────────────────────────────────────────────
  sourceFile: File | null;
  sourceObjectUrl: string | null; // original file URL (for display)
  downscaledObjectUrl: string | null; // downscaled URL (for CV operations)
  sourceDimensions: { width: number; height: number } | null;

  // ── Perspective ────────────────────────────────────────────────────
  corners: [Point, Point, Point, Point] | null;
  correctedImageUrl: string | null;

  // ── Calibration ────────────────────────────────────────────────────
  calibrationPoints: [Point, Point] | null;
  calibrationDistance: number;
  calibrationUnit: 'in' | 'cm';
  pixelsPerUnit: number | null;

  // ── Sliders ────────────────────────────────────────────────────────
  sliders: {
    lighting: number;
    smoothing: number;
    heavyPrints: boolean;
    colors: number;
    minPatchSize: number;
    edgeEnhance: boolean;
    edgeSensitivity: number;
    gridSnap: number;
  };

  // ── Processing ─────────────────────────────────────────────────────
  isProcessing: boolean;
  processingStage: string;
  processingPercent: number;

  // ── Review ─────────────────────────────────────────────────────────
  viewMode: 'photo+outlines' | 'colorFill' | 'outlinesOnly' | 'photoOnly';
  previewOutlines: Float32Array | null;
  previewColors: string[] | null;
  previewPatchCount: number;

  patches: Patch[] | null;
  templates: ShapeTemplate[] | null;
  grid: DetectedGrid | null;

  selectedPatchId: number | null;
  hoveredPatchId: number | null;
  activeTool: 'select' | 'drawSeam' | 'eraseSeam' | 'floodFill' | null;
  canUndo: boolean;
  canRedo: boolean;

  // ── Worker ─────────────────────────────────────────────────────────
  workerReady: boolean;
  error: { stage: string; message: string; recoverable: boolean } | null;
}

// ── Default state ──────────────────────────────────────────────────────────

const defaultSliders = {
  lighting: 30,
  smoothing: 50,
  heavyPrints: false,
  colors: 0,
  minPatchSize: 30,
  edgeEnhance: false,
  edgeSensitivity: 50,
  gridSnap: 50,
};

function createDefaultState(): PhotoDesignState {
  return {
    stage: 'upload',
    sourceFile: null,
    sourceObjectUrl: null,
    downscaledObjectUrl: null,
    sourceDimensions: null,
    corners: null,
    correctedImageUrl: null,
    calibrationPoints: null,
    calibrationDistance: 0,
    calibrationUnit: 'in',
    pixelsPerUnit: null,
    sliders: { ...defaultSliders },
    isProcessing: false,
    processingStage: '',
    processingPercent: 0,
    viewMode: 'photo+outlines',
    previewOutlines: null,
    previewColors: null,
    previewPatchCount: 0,
    patches: null,
    templates: null,
    grid: null,
    selectedPatchId: null,
    hoveredPatchId: null,
    activeTool: null,
    canUndo: false,
    canRedo: false,
    workerReady: false,
    error: null,
  };
}

// ── Store ──────────────────────────────────────────────────────────────────

interface PhotoDesignActions {
  setStage: (stage: Stage) => void;
  canAdvance: (target: Stage) => boolean;

  setSourceFile: (
    file: File,
    objectUrl: string,
    dimensions: { width: number; height: number },
    downscaledUrl: string
  ) => void;
  setCorners: (corners: [Point, Point, Point, Point]) => void;
  setCorrectedImageUrl: (url: string | null) => void;
  setCalibration: (
    points: [Point, Point],
    distance: number,
    unit: 'in' | 'cm',
    pixelsPerUnit: number
  ) => void;

  setSlider: <K extends keyof PhotoDesignState['sliders']>(
    key: K,
    value: PhotoDesignState['sliders'][K]
  ) => void;

  setProcessing: (isProcessing: boolean, stage?: string, percent?: number) => void;
  setPreviewResult: (outlines: Float32Array, colors: string[], patchCount: number) => void;
  setFullResult: (patches: Patch[], templates: ShapeTemplate[], grid: DetectedGrid) => void;
  applyEditResult: (changedPatches: Patch[], removedIds: number[]) => void;
  setUndoRedoState: (canUndo: boolean, canRedo: boolean) => void;

  setSelectedPatchId: (id: number | null) => void;
  setHoveredPatchId: (id: number | null) => void;
  setActiveTool: (tool: PhotoDesignState['activeTool']) => void;

  setWorkerReady: (ready: boolean) => void;
  setError: (error: PhotoDesignState['error']) => void;
  clearError: () => void;

  reset: () => void;
  dispose: () => void;
}

export type PhotoDesignStore = PhotoDesignState & PhotoDesignActions;

export const usePhotoDesignStore = create<PhotoDesignStore>()((set, get) => ({
  ...createDefaultState(),

  // ── Stage ────────────────────────────────────────────────────────
  setStage: (stage) => set({ stage }),

  canAdvance: (target: Stage) => {
    const s = get();
    switch (target) {
      case 'upload':
        return true;
      case 'perspective':
        return s.sourceFile !== null;
      case 'calibrate':
        return s.corners !== null;
      case 'review':
        return s.pixelsPerUnit !== null && s.pixelsPerUnit > 0;
      case 'export':
        return s.patches !== null && s.patches.length > 0;
      default:
        return false;
    }
  },

  // ── Upload ───────────────────────────────────────────────────────
  setSourceFile: (file, objectUrl, dimensions, downscaledUrl) =>
    set({
      sourceFile: file,
      sourceObjectUrl: objectUrl,
      downscaledObjectUrl: downscaledUrl,
      sourceDimensions: dimensions,
    }),

  // ── Perspective ──────────────────────────────────────────────────
  setCorners: (corners) => set({ corners }),
  setCorrectedImageUrl: (url) => set({ correctedImageUrl: url }),

  // ── Calibration ──────────────────────────────────────────────────
  setCalibration: (points, distance, unit, pixelsPerUnit) =>
    set({
      calibrationPoints: points,
      calibrationDistance: distance,
      calibrationUnit: unit,
      pixelsPerUnit,
    }),

  // ── Sliders ──────────────────────────────────────────────────────
  setSlider: (key, value) =>
    set((state) => ({
      sliders: { ...state.sliders, [key]: value },
    })),

  // ── Processing ───────────────────────────────────────────────────
  setProcessing: (isProcessing, stage = '', percent = 0) =>
    set({ isProcessing, processingStage: stage, processingPercent: percent }),

  setPreviewResult: (outlines, colors, patchCount) =>
    set({
      previewOutlines: outlines,
      previewColors: colors,
      previewPatchCount: patchCount,
    }),

  setFullResult: (patches, templates, grid) =>
    set({ patches, templates, grid, previewPatchCount: patches.length }),

  applyEditResult: (changedPatches, removedIds) =>
    set((state) => {
      const current = state.patches ?? [];
      const removedSet = new Set(removedIds);
      const byId = new Map<number, Patch>();
      for (const p of current) {
        if (!removedSet.has(p.id)) byId.set(p.id, p);
      }
      for (const p of changedPatches) byId.set(p.id, p);
      const nextPatches = Array.from(byId.values());

      // Update template instance counts from the new patch set so the
      // right sidebar stays in sync without a full re-classification.
      const existing = state.templates ?? [];
      const idsByTemplate = new Map<string, number[]>();
      for (const p of nextPatches) {
        const arr = idsByTemplate.get(p.templateId) ?? [];
        arr.push(p.id);
        idsByTemplate.set(p.templateId, arr);
      }
      const nextTemplates: ShapeTemplate[] = existing.map((t) => ({
        ...t,
        instanceIds: idsByTemplate.get(t.id) ?? [],
        instanceCount: (idsByTemplate.get(t.id) ?? []).length,
      }));

      // If an edit produced a brand-new templateId (e.g. "custom-123"), add a
      // synthetic template so the Studio export keeps a row for it.
      for (const [tid, ids] of idsByTemplate) {
        if (!nextTemplates.some((t) => t.id === tid)) {
          nextTemplates.push({
            id: tid,
            name: tid.startsWith('custom-') ? 'Custom' : tid,
            normalizedPolygon: [],
            realWorldSize: { w: 0, h: 0 },
            instanceCount: ids.length,
            instanceIds: ids,
          });
        }
      }

      return {
        patches: nextPatches,
        templates: nextTemplates,
        previewPatchCount: nextPatches.length,
        selectedPatchId:
          state.selectedPatchId !== null && removedSet.has(state.selectedPatchId)
            ? null
            : state.selectedPatchId,
        hoveredPatchId:
          state.hoveredPatchId !== null && removedSet.has(state.hoveredPatchId)
            ? null
            : state.hoveredPatchId,
      };
    }),

  setUndoRedoState: (canUndo, canRedo) => set({ canUndo, canRedo }),

  // ── Review ───────────────────────────────────────────────────────
  setSelectedPatchId: (id) => set({ selectedPatchId: id }),
  setHoveredPatchId: (id) => set({ hoveredPatchId: id }),
  setActiveTool: (tool) => set({ activeTool: tool }),

  // ── Worker ───────────────────────────────────────────────────────
  setWorkerReady: (ready) => set({ workerReady: ready }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  // ── Reset / Dispose ──────────────────────────────────────────────
  reset: () => set(createDefaultState()),

  dispose: () => {
    const state = get();
    // Revoke object URLs if present
    if (state.sourceObjectUrl) {
      URL.revokeObjectURL(state.sourceObjectUrl);
    }
    if (state.downscaledObjectUrl) {
      URL.revokeObjectURL(state.downscaledObjectUrl);
    }
    if (state.correctedImageUrl) {
      URL.revokeObjectURL(state.correctedImageUrl);
    }
    set(createDefaultState());
  },
}));
