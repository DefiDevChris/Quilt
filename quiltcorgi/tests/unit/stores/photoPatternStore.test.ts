import { describe, it, expect, beforeEach, vi } from 'vitest';
import { usePhotoPatternStore } from '@/stores/photoPatternStore';
import {
  PHOTO_PATTERN_SENSITIVITY_DEFAULT,
  DEFAULT_SEAM_ALLOWANCE_INCHES,
  DEFAULT_CANVAS_WIDTH,
  DEFAULT_CANVAS_HEIGHT,
} from '@/lib/constants';

vi.mock('@/lib/photo-pattern-utils', () => ({
  terminateDetectionWorker: vi.fn(),
}));

describe('photoPatternStore', () => {
  beforeEach(() => {
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    usePhotoPatternStore.getState().reset();
  });

  it('initializes with step=upload, isModalOpen=false, sensitivity=1.0', () => {
    const state = usePhotoPatternStore.getState();
    expect(state.step).toBe('upload');
    expect(state.isModalOpen).toBe(false);
    expect(state.sensitivity).toBe(PHOTO_PATTERN_SENSITIVITY_DEFAULT);
  });

  it('openModal() sets isModalOpen=true', () => {
    usePhotoPatternStore.getState().openModal();
    expect(usePhotoPatternStore.getState().isModalOpen).toBe(true);
  });

  it('closeModal() sets isModalOpen=false', () => {
    usePhotoPatternStore.getState().openModal();
    expect(usePhotoPatternStore.getState().isModalOpen).toBe(true);

    usePhotoPatternStore.getState().closeModal();
    expect(usePhotoPatternStore.getState().isModalOpen).toBe(false);
  });

  it('setStep(correction) changes step', () => {
    usePhotoPatternStore.getState().setStep('correction');
    expect(usePhotoPatternStore.getState().step).toBe('correction');
  });

  it('setSensitivity(1.5) changes sensitivity', () => {
    usePhotoPatternStore.getState().setSensitivity(1.5);
    expect(usePhotoPatternStore.getState().sensitivity).toBe(1.5);
  });

  it('setTargetDimensions(90, 108) changes both targetWidth and targetHeight', () => {
    usePhotoPatternStore.getState().setTargetDimensions(90, 108);
    const state = usePhotoPatternStore.getState();
    expect(state.targetWidth).toBe(90);
    expect(state.targetHeight).toBe(108);
  });

  it('setSeamAllowance(0.375) changes seamAllowance', () => {
    usePhotoPatternStore.getState().setSeamAllowance(0.375);
    expect(usePhotoPatternStore.getState().seamAllowance).toBe(0.375);
  });

  it('reset() restores all state to initial values', () => {
    usePhotoPatternStore.getState().openModal();
    usePhotoPatternStore.getState().setStep('results');
    usePhotoPatternStore.getState().setSensitivity(1.8);
    usePhotoPatternStore.getState().setTargetDimensions(90, 108);
    usePhotoPatternStore.getState().setSeamAllowance(0.375);
    usePhotoPatternStore.getState().setLockAspectRatio(false);

    usePhotoPatternStore.getState().reset();

    const state = usePhotoPatternStore.getState();
    expect(state.step).toBe('upload');
    expect(state.isModalOpen).toBe(false);
    expect(state.sensitivity).toBe(PHOTO_PATTERN_SENSITIVITY_DEFAULT);
    expect(state.targetWidth).toBe(DEFAULT_CANVAS_WIDTH);
    expect(state.targetHeight).toBe(DEFAULT_CANVAS_HEIGHT);
    expect(state.seamAllowance).toBe(DEFAULT_SEAM_ALLOWANCE_INCHES);
    expect(state.lockAspectRatio).toBe(true);
    expect(state.originalImage).toBeNull();
    expect(state.originalImageUrl).toBe('');
    expect(state.correctedImageData).toBeNull();
    expect(state.perspectiveCorners).toBeNull();
    expect(state.detectedPieces).toEqual([]);
    expect(state.pipelineSteps).toEqual([]);
    expect(state.scaledPieces).toEqual([]);
  });

  it('setPipelineSteps updates pipelineSteps', () => {
    const steps = [{ name: 'detect', status: 'complete' }] as const;
    usePhotoPatternStore.getState().setPipelineSteps(steps);
    expect(usePhotoPatternStore.getState().pipelineSteps).toEqual(steps);
  });

  it('setScaledPieces updates scaledPieces', () => {
    const pieces: readonly import('@/lib/photo-pattern-types').ScaledPiece[] = [{
      id: '1',
      contourInches: [],
      finishedWidth: '10',
      finishedHeight: '10',
      cutWidth: '10.5',
      cutHeight: '10.5',
      finishedWidthNum: 10,
      finishedHeightNum: 10,
      dominantColor: '#ffffff',
    }];
    usePhotoPatternStore.getState().setScaledPieces(pieces);
    expect(usePhotoPatternStore.getState().scaledPieces).toEqual(pieces);
  });

  it('setScanConfig updates scanConfig', () => {
    const config = { hasCurvedPiecing: false, hasApplique: false, hasLowContrastSeams: false, hasHeavyTopstitching: false, pieceScale: 'standard' as const, quiltShape: 'rectangular' as const };
    usePhotoPatternStore.getState().setScanConfig(config);
    expect(usePhotoPatternStore.getState().scanConfig).toEqual(config);
  });
});
