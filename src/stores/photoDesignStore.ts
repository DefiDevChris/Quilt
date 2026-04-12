import { create } from 'zustand';
import type { EngineOutput, GridSpec } from '@/lib/photo-to-design/types';
import type { Point } from '@/lib/photo-to-design/types';

type WizardStep = 'upload' | 'perspective' | 'grid' | 'review';

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
  result: null,
  isProcessing: false,
  processingError: null,
  processingProgress: null,
};

export const usePhotoDesignStore = create<PhotoDesignState>((set) => ({
  ...initialState,

  setStep: (step) => set({ step }),

  setSourceImage: (url, data) =>
    set({ sourceImageUrl: url, sourceImageData: data, step: 'perspective' }),

  setPerspectiveCorners: (corners) => set({ perspectiveCorners: corners }),

  setCorrectedImageData: (data) => set({ correctedImageData: data }),

  setGridSpec: (spec) => set({ gridSpec: spec }),

  setResult: (result) => set({ result }),
  setIsProcessing: (processing) => set({ isProcessing: processing }),
  setProcessingError: (error) => set({ processingError: error }),
  setProcessingProgress: (progress) => set({ processingProgress: progress }),

  reset: () => set(initialState),
}));
