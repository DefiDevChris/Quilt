import { create } from 'zustand';
import { buildShapeKey } from '@/lib/photo-to-design/stages/canonicalize';
import type {
  EngineOutput,
  GridSpec,
  InteractivePatchCandidate,
  ModelDownloadProgress,
  Patch,
  Point,
} from '@/lib/photo-to-design/types';

type WizardStep = 'upload' | 'perspective' | 'grid' | 'review';

type ModelStatus = 'idle' | 'loading' | 'ready' | 'error' | 'webgpu-missing';

/** Cap on how deep the per-session interactive undo stack can grow. */
const UNDO_LIMIT = 50;

interface PhotoDesignState {
  // Wizard flow
  step: WizardStep;
  setStep: (step: WizardStep) => void;

  // Source image
  sourceImageUrl: string | null;
  sourceImageData: ImageData | null;
  setSourceImage: (url: string, data: ImageData) => void;

  // Perspective correction
  perspectiveCorners: [Point, Point, Point, Point] | null;
  setPerspectiveCorners: (corners: [Point, Point, Point, Point]) => void;
  correctedImageData: ImageData | null;
  setCorrectedImageData: (data: ImageData) => void;

  // Grid calibration
  gridSpec: GridSpec | null;
  setGridSpec: (spec: GridSpec) => void;

  // Model preload status (SAM2 weights via Transformers.js)
  modelStatus: ModelStatus;
  setModelStatus: (status: ModelStatus) => void;
  modelDownloadProgress: ModelDownloadProgress | null;
  setModelDownloadProgress: (progress: ModelDownloadProgress | null) => void;
  modelError: string | null;
  setModelError: (error: string | null) => void;

  // Engine result
  result: EngineOutput | null;
  setResult: (result: EngineOutput | null) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
  processingError: string | null;
  setProcessingError: (error: string | null) => void;
  processingProgress: { stage: number; stageName: string; percentage: number } | null;
  setProcessingProgress: (
    progress: { stage: number; stageName: string; percentage: number } | null
  ) => void;

  // Interactive correction (U6)
  isInteractiveProcessing: boolean;
  setIsInteractiveProcessing: (processing: boolean) => void;
  patchUndoStack: Patch[][];
  applyInteractivePatch: (candidate: InteractivePatchCandidate) => void;
  undoLastPatch: () => void;
  clearUndoHistory: () => void;

  // Reset
  reset: () => void;
}

const initialState = {
  step: 'upload' as WizardStep,
  sourceImageUrl: null,
  sourceImageData: null,
  perspectiveCorners: null,
  correctedImageData: null,
  gridSpec: null,
  modelStatus: 'idle' as ModelStatus,
  modelDownloadProgress: null,
  modelError: null,
  result: null,
  isProcessing: false,
  processingError: null,
  processingProgress: null,
  isInteractiveProcessing: false,
  patchUndoStack: [] as Patch[][],
};

export const usePhotoDesignStore = create<PhotoDesignState>((set) => ({
  ...initialState,

  setStep: (step) => set({ step }),

  setSourceImage: (url, data) =>
    set({ sourceImageUrl: url, sourceImageData: data, step: 'perspective' }),

  setPerspectiveCorners: (corners) => set({ perspectiveCorners: corners }),

  setCorrectedImageData: (data) => set({ correctedImageData: data }),

  setGridSpec: (spec) => set({ gridSpec: spec }),

  setModelStatus: (modelStatus) => set({ modelStatus }),
  setModelDownloadProgress: (modelDownloadProgress) => set({ modelDownloadProgress }),
  setModelError: (modelError) => set({ modelError }),

  setResult: (result) => set({ result, patchUndoStack: [] }),
  setIsProcessing: (processing) => set({ isProcessing: processing }),
  setProcessingError: (error) => set({ processingError: error }),
  setProcessingProgress: (progress) => set({ processingProgress: progress }),

  setIsInteractiveProcessing: (processing) => set({ isInteractiveProcessing: processing }),

  applyInteractivePatch: (candidate) =>
    set((state) => {
      if (!state.result) return state;
      const prevPatches = state.result.patches;
      const nextPatch = composeInteractivePatch(prevPatches, candidate);

      const nextUndo = [...state.patchUndoStack, prevPatches];
      // Cap the stack — pop the oldest if we exceed the limit.
      if (nextUndo.length > UNDO_LIMIT) nextUndo.shift();

      return {
        result: { ...state.result, patches: [...prevPatches, nextPatch] },
        patchUndoStack: nextUndo,
      };
    }),

  undoLastPatch: () =>
    set((state) => {
      if (!state.result || state.patchUndoStack.length === 0) return state;
      const stack = state.patchUndoStack.slice(0, -1);
      const restored = state.patchUndoStack[state.patchUndoStack.length - 1];
      return {
        result: { ...state.result, patches: restored },
        patchUndoStack: stack,
      };
    }),

  clearUndoHistory: () => set({ patchUndoStack: [] }),

  reset: () => set(initialState),
}));

if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  (window as unknown as { __photoStore?: typeof usePhotoDesignStore }).__photoStore =
    usePhotoDesignStore;
}

/**
 * Assign the next free numeric `id` and dedup `templateId` against existing
 * patches by shape key, so an interactive 2″×2″ square joins the same
 * template as the 49 auto-detected ones instead of creating a sibling.
 */
export function composeInteractivePatch(
  existing: Patch[],
  candidate: InteractivePatchCandidate
): Patch {
  let maxId = 0;
  let maxTemplateNum = 0;
  let matchedTemplateId: string | null = null;
  const candidateKey = buildShapeKey(candidate.vertices);

  for (const p of existing) {
    if (p.id > maxId) maxId = p.id;
    const n = parseTemplateNumber(p.templateId);
    if (n !== null && n > maxTemplateNum) maxTemplateNum = n;
    if (!matchedTemplateId && buildShapeKey(p.vertices) === candidateKey) {
      matchedTemplateId = p.templateId;
    }
  }

  return {
    id: maxId + 1,
    templateId: matchedTemplateId ?? `t${maxTemplateNum + 1}`,
    vertices: candidate.vertices,
    svgPath: candidate.svgPath,
  };
}

function parseTemplateNumber(templateId: string): number | null {
  const m = /^t(\d+)$/.exec(templateId);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return Number.isFinite(n) ? n : null;
}
