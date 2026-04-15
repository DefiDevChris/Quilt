import { create } from 'zustand';
import type { Point, Patch, ShapeTemplate, DetectedGrid } from '@/types/photo-to-design';

export type Stage = 'upload' | 'perspective' | 'calibrate' | 'review' | 'export';

export interface PhotoDesignState {
  // ── Stage ──────────────────────────────────────────────────────────
  stage: Stage;

  // ── Upload ─────────────────────────────────────────────────────────
  sourceFile: File | null;
  sourceObjectUrl: string | null;
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

  setSourceFile: (file: File, objectUrl: string, dimensions: { width: number; height: number }) => void;
  setCorners: (corners: [Point, Point, Point, Point]) => void;
  setCorrectedImageUrl: (url: string | null) => void;
  setCalibration: (points: [Point, Point], distance: number, unit: 'in' | 'cm', pixelsPerUnit: number) => void;

  setSlider: <K extends keyof PhotoDesignState['sliders']>(key: K, value: PhotoDesignState['sliders'][K]) => void;

  setProcessing: (isProcessing: boolean, stage?: string, percent?: number) => void;
  setPreviewResult: (outlines: Float32Array, colors: string[], patchCount: number) => void;
  setFullResult: (patches: Patch[], templates: ShapeTemplate[], grid: DetectedGrid) => void;
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
  setSourceFile: (file, objectUrl, dimensions) =>
    set({ sourceFile: file, sourceObjectUrl: objectUrl, sourceDimensions: dimensions }),

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
    // Revoke object URL if present
    if (state.sourceObjectUrl) {
      URL.revokeObjectURL(state.sourceObjectUrl);
    }
    set(createDefaultState());
  },
}));
