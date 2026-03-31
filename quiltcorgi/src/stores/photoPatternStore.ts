'use client';

import { create } from 'zustand';
import type {
  PhotoPatternStep,
  DetectedPiece,
  ScaledPiece,
  PipelineStep,
  Point2D,
  QuiltDetectionConfig,
} from '@/lib/photo-pattern-types';
import { DEFAULT_QUILT_DETECTION_CONFIG } from '@/lib/photo-pattern-types';
import {
  PHOTO_PATTERN_SENSITIVITY_DEFAULT,
  DEFAULT_SEAM_ALLOWANCE_INCHES,
  DEFAULT_CANVAS_WIDTH,
  DEFAULT_CANVAS_HEIGHT,
} from '@/lib/constants';
import { terminateDetectionWorker } from '@/lib/photo-pattern-engine';

interface PhotoPatternState {
  step: PhotoPatternStep;
  isModalOpen: boolean;
  /**
   * WARNING: Storing HTMLImageElement in Zustand state is an anti-pattern
   * as DOM objects break serialization and time-travel debugging.
   * Kept for pragmatic image processing workflow; consider using React
   * context or refs for future refactoring.
   */
  originalImage: HTMLImageElement | null;
  originalImageUrl: string;
  /**
   * WARNING: Storing ImageData in Zustand state is an anti-pattern
   * as it can be very large (width×height×4 bytes) and breaks serialization.
   * Consider processing in a Web Worker or using refs instead.
   */
  correctedImageData: ImageData | null;
  perspectiveCorners: [Point2D, Point2D, Point2D, Point2D] | null;
  detectedPieces: readonly DetectedPiece[];
  pipelineSteps: readonly PipelineStep[];
  sensitivity: number;
  targetWidth: number;
  targetHeight: number;
  seamAllowance: 0.25 | 0.375;
  lockAspectRatio: boolean;
  scaledPieces: readonly ScaledPiece[];
  /**
   * Scan configuration / Quilt Profile settings.
   * These "priors" help the CV engine make better decisions.
   */
  scanConfig: QuiltDetectionConfig;

  openModal: () => void;
  closeModal: () => void;
  setStep: (step: PhotoPatternStep) => void;
  setOriginalImage: (img: HTMLImageElement, url: string) => void;
  setCorrectedImage: (data: ImageData) => void;
  setPerspectiveCorners: (corners: [Point2D, Point2D, Point2D, Point2D]) => void;
  setDetectedPieces: (pieces: readonly DetectedPiece[]) => void;
  setPipelineSteps: (steps: readonly PipelineStep[]) => void;
  setSensitivity: (value: number) => void;
  setTargetDimensions: (width: number, height: number) => void;
  setSeamAllowance: (value: 0.25 | 0.375) => void;
  setLockAspectRatio: (locked: boolean) => void;
  setScaledPieces: (pieces: readonly ScaledPiece[]) => void;
  setScanConfig: (config: QuiltDetectionConfig) => void;
  reset: () => void;
}

const initialState = {
  step: 'upload' as PhotoPatternStep,
  isModalOpen: false,
  originalImage: null as HTMLImageElement | null,
  originalImageUrl: '',
  correctedImageData: null as ImageData | null,
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
};

export const usePhotoPatternStore = create<PhotoPatternState>((set, get) => ({
  ...initialState,

  openModal: () => set({ isModalOpen: true }),

  closeModal: () => {
    const { originalImageUrl } = get();
    if (originalImageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(originalImageUrl);
    }
    set({ ...initialState, isModalOpen: false });
  },

  setStep: (step) => set({ step }),

  setOriginalImage: (img, url) => set({ originalImage: img, originalImageUrl: url }),

  setCorrectedImage: (data) => set({ correctedImageData: data }),

  setPerspectiveCorners: (corners) => set({ perspectiveCorners: corners }),

  setDetectedPieces: (pieces) => set({ detectedPieces: pieces }),

  setPipelineSteps: (steps) => set({ pipelineSteps: steps }),

  setSensitivity: (value) => set({ sensitivity: value }),

  setTargetDimensions: (width, height) => set({ targetWidth: width, targetHeight: height }),

  setSeamAllowance: (value) => set({ seamAllowance: value }),

  setLockAspectRatio: (locked) => set({ lockAspectRatio: locked }),

  setScaledPieces: (pieces) => set({ scaledPieces: pieces }),

  setScanConfig: (config) => set({ scanConfig: config }),

  reset: () => {
    const { originalImageUrl } = get();
    if (originalImageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(originalImageUrl);
    }
    terminateDetectionWorker();
    set({ ...initialState });
  },
}));
