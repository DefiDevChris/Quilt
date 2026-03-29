'use client';

import { create } from 'zustand';
import type {
  PhotoPatternStep,
  DetectedPiece,
  ScaledPiece,
  PipelineStep,
  Point2D,
} from '@/lib/photo-pattern-types';
import {
  PHOTO_PATTERN_SENSITIVITY_DEFAULT,
  DEFAULT_SEAM_ALLOWANCE_INCHES,
  DEFAULT_CANVAS_WIDTH,
  DEFAULT_CANVAS_HEIGHT,
} from '@/lib/constants';

interface PhotoPatternState {
  step: PhotoPatternStep;
  isModalOpen: boolean;
  originalImage: HTMLImageElement | null;
  originalImageUrl: string;
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
};

export const usePhotoPatternStore = create<PhotoPatternState>((set) => ({
  ...initialState,

  openModal: () => set({ isModalOpen: true }),

  closeModal: () => set({ isModalOpen: false }),

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

  reset: () => set({ ...initialState }),
}));
