'use client';

import { create } from 'zustand';
import type {
  PhotoLayoutStep,
  DetectedPiece,
  ScaledPiece,
  PipelineStep,
  Point2D,
  QuiltDetectionConfig,
  QuiltStructure,
} from '@/lib/photo-layout-types';
import { DEFAULT_QUILT_DETECTION_CONFIG } from '@/lib/photo-layout-types';
import {
  PHOTO_PATTERN_SENSITIVITY_DEFAULT,
  DEFAULT_SEAM_ALLOWANCE_INCHES,
  DEFAULT_CANVAS_WIDTH,
  DEFAULT_CANVAS_HEIGHT,
} from '@/lib/constants';
import { terminateDetectionWorker } from '@/lib/photo-layout-utils';

/**
 * Stores a lightweight reference to the corrected image instead of raw ImageData.
 * The corrected image is converted to a Blob URL to avoid Zustand state bloat.
 */
interface CorrectedImageRef {
  /** Object URL pointing to the corrected image blob */
  url: string;
  /** Original width in pixels */
  width: number;
  /** Original height in pixels */
  height: number;
}

interface PhotoLayoutState {
  step: PhotoLayoutStep;
  originalImage: HTMLImageElement | null;
  originalImageUrl: string;
  /**
   * Lightweight reference to the corrected image (Blob URL + dimensions).
   * Previously stored raw ImageData which caused severe React reconciliation lag.
   */
  correctedImageRef: CorrectedImageRef | null;
  perspectiveCorners: [Point2D, Point2D, Point2D, Point2D] | null;
  detectedPieces: readonly DetectedPiece[];
  pipelineSteps: readonly PipelineStep[];
  sensitivity: number;
  targetWidth: number;
  targetHeight: number;
  seamAllowance: 0.25 | 0.375;
  lockAspectRatio: boolean;
  scaledPieces: readonly ScaledPiece[];
  scanConfig: QuiltDetectionConfig;
  quiltStructure: QuiltStructure | null;

  setStep: (step: PhotoLayoutStep) => void;
  setOriginalImage: (img: HTMLImageElement, url: string) => void;
  setCorrectedImageRef: (ref: CorrectedImageRef) => void;
  setPerspectiveCorners: (corners: [Point2D, Point2D, Point2D, Point2D] | null) => void;
  setDetectedPieces: (pieces: readonly DetectedPiece[]) => void;
  setPipelineSteps: (steps: readonly PipelineStep[]) => void;
  setSensitivity: (value: number) => void;
  setTargetDimensions: (width: number, height: number) => void;
  setSeamAllowance: (value: 0.25 | 0.375) => void;
  setLockAspectRatio: (locked: boolean) => void;
  setScaledPieces: (pieces: readonly ScaledPiece[]) => void;
  setScanConfig: (config: QuiltDetectionConfig) => void;
  setQuiltStructure: (structure: QuiltStructure | null) => void;
  reset: () => void;
}

const initialState = {
  step: 'upload' as PhotoLayoutStep,
  originalImage: null as HTMLImageElement | null,
  originalImageUrl: '',
  correctedImageRef: null as CorrectedImageRef | null,
  perspectiveCorners: null as [Point2D, Point2D, Point2D, Point2D] | null,
  detectedPieces: [] as readonly DetectedPiece[],
  pipelineSteps: [] as readonly PipelineStep[],
  sensitivity: PHOTO_PATTERN_SENSITIVITY_DEFAULT,
  targetWidth: DEFAULT_CANVAS_WIDTH,
  targetHeight: DEFAULT_CANVAS_HEIGHT,
  seamAllowance: DEFAULT_SEAM_ALLOWANCE_INCHES as 0.25 | 0.375,
  lockAspectRatio: true,
  scaledPieces: [] as readonly ScaledPiece[],
  scanConfig: DEFAULT_QUILT_DETECTION_CONFIG,
  quiltStructure: null as QuiltStructure | null,
};

/**
 * Revokes a Blob URL if it exists.
 */
function revokeUrl(url: string | undefined | null): void {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}

export const usePhotoLayoutStore = create<PhotoLayoutState>((set, get) => ({
  ...initialState,

  setStep: (step) => set({ step }),

  setOriginalImage: (img, url) => {
    // Revoke previous URL to prevent memory leaks
    revokeUrl(get().originalImageUrl);
    set({ originalImage: img, originalImageUrl: url });
  },

  setCorrectedImageRef: (ref) => {
    // Revoke previous corrected image URL to prevent memory leaks
    revokeUrl(get().correctedImageRef?.url);
    set({ correctedImageRef: ref });
  },

  setPerspectiveCorners: (corners) => set({ perspectiveCorners: corners }),

  setDetectedPieces: (pieces) => set({ detectedPieces: pieces }),

  setPipelineSteps: (steps) => set({ pipelineSteps: steps }),

  setSensitivity: (value) => set({ sensitivity: value }),

  setTargetDimensions: (width, height) => set({ targetWidth: width, targetHeight: height }),

  setSeamAllowance: (value) => set({ seamAllowance: value }),

  setLockAspectRatio: (locked) => set({ lockAspectRatio: locked }),

  setScaledPieces: (pieces) => set({ scaledPieces: pieces }),

  setScanConfig: (config) => set({ scanConfig: config }),

  setQuiltStructure: (structure) => set({ quiltStructure: structure }),

  reset: () => {
    const { originalImageUrl, correctedImageRef } = get();
    revokeUrl(originalImageUrl);
    revokeUrl(correctedImageRef?.url);
    terminateDetectionWorker();
    set({ ...initialState });
  },
}));

// Expose store for E2E testing in development
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  (window as unknown as Record<string, unknown>).__photoPatternStore = usePhotoLayoutStore;
}
