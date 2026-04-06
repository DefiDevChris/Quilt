import { describe, it, expect, beforeEach, vi } from 'vitest';
import { usePhotoLayoutStore } from '@/stores/photoLayoutStore';
import {
  PHOTO_PATTERN_SENSITIVITY_DEFAULT,
  DEFAULT_SEAM_ALLOWANCE_INCHES,
  DEFAULT_CANVAS_WIDTH,
  DEFAULT_CANVAS_HEIGHT,
} from '@/lib/constants';

vi.mock('@/lib/photo-layout-utils', () => ({
  terminateDetectionWorker: vi.fn(),
}));

describe('photoPatternStore', () => {
  beforeEach(() => {
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    usePhotoLayoutStore.getState().reset();
  });

  it('initializes with step=upload and default sensitivity', () => {
    const state = usePhotoLayoutStore.getState();
    expect(state.step).toBe('upload');
    expect(state.sensitivity).toBe(PHOTO_PATTERN_SENSITIVITY_DEFAULT);
  });

  it('setStep(correction) changes step', () => {
    usePhotoLayoutStore.getState().setStep('correction');
    expect(usePhotoLayoutStore.getState().step).toBe('correction');
  });

  it('setSensitivity(1.5) changes sensitivity', () => {
    usePhotoLayoutStore.getState().setSensitivity(1.5);
    expect(usePhotoLayoutStore.getState().sensitivity).toBe(1.5);
  });

  it('setTargetDimensions(90, 108) changes both targetWidth and targetHeight', () => {
    usePhotoLayoutStore.getState().setTargetDimensions(90, 108);
    const state = usePhotoLayoutStore.getState();
    expect(state.targetWidth).toBe(90);
    expect(state.targetHeight).toBe(108);
  });

  it('setSeamAllowance(0.375) changes seamAllowance', () => {
    usePhotoLayoutStore.getState().setSeamAllowance(0.375);
    expect(usePhotoLayoutStore.getState().seamAllowance).toBe(0.375);
  });

  it('reset() restores all state to initial values', () => {
    usePhotoLayoutStore.getState().setStep('results');
    usePhotoLayoutStore.getState().setSensitivity(1.8);
    usePhotoLayoutStore.getState().setTargetDimensions(90, 108);
    usePhotoLayoutStore.getState().setSeamAllowance(0.375);
    usePhotoLayoutStore.getState().setLockAspectRatio(false);

    usePhotoLayoutStore.getState().reset();

    const state = usePhotoLayoutStore.getState();
    expect(state.step).toBe('upload');
    expect(state.sensitivity).toBe(PHOTO_PATTERN_SENSITIVITY_DEFAULT);
    expect(state.targetWidth).toBe(DEFAULT_CANVAS_WIDTH);
    expect(state.targetHeight).toBe(DEFAULT_CANVAS_HEIGHT);
    expect(state.seamAllowance).toBe(DEFAULT_SEAM_ALLOWANCE_INCHES);
    expect(state.lockAspectRatio).toBe(true);
    expect(state.originalImage).toBeNull();
    expect(state.originalImageUrl).toBe('');
    expect(state.correctedImageRef).toBeNull();
    expect(state.perspectiveCorners).toBeNull();
    expect(state.detectedPieces).toEqual([]);
    expect(state.pipelineSteps).toEqual([]);
    expect(state.scaledPieces).toEqual([]);
  });

  it('setPipelineSteps updates pipelineSteps', () => {
    const steps = [{ name: 'detect', status: 'complete' }] as const;
    usePhotoLayoutStore.getState().setPipelineSteps(steps);
    expect(usePhotoLayoutStore.getState().pipelineSteps).toEqual(steps);
  });

  it('setScaledPieces updates scaledPieces', () => {
    const pieces: readonly import('@/lib/photo-layout-types').ScaledPiece[] = [{
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
    usePhotoLayoutStore.getState().setScaledPieces(pieces);
    expect(usePhotoLayoutStore.getState().scaledPieces).toEqual(pieces);
  });

  it('setScanConfig updates scanConfig', () => {
    const config = { hasCurvedPiecing: false, hasApplique: false, hasLowContrastSeams: false, hasHeavyTopstitching: false, pieceScale: 'standard' as const, quiltShape: 'rectangular' as const };
    usePhotoLayoutStore.getState().setScanConfig(config);
    expect(usePhotoLayoutStore.getState().scanConfig).toEqual(config);
  });
});
