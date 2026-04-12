import { describe, it, expect, beforeEach, vi } from 'vitest';
import { usePhotoLayoutStore } from '@/stores/photoLayoutStore';
import { DEFAULT_SEAM_ALLOWANCE_INCHES } from '@/lib/constants';
import type { QuadCorners } from '@/lib/photo-layout-types';
import type { SegmentationResult } from '@/lib/quilt-segmentation-engine';

function makeSegmentation(): SegmentationResult {
  return {
    width: 100,
    height: 100,
    palette: [
      {
        index: 0,
        lab: { l: 50, a: 0, b: 0 },
        rgb: { r: 128, g: 128, b: 128 },
        hex: '#808080',
        pixelCount: 10,
        libraryFabricId: null,
        libraryFabricDistance: Infinity,
      },
    ],
    patches: [
      {
        id: 'patch-0',
        clusterIndex: 0,
        polygonPx: [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
          { x: 100, y: 100 },
          { x: 0, y: 100 },
        ],
        centroidPx: { x: 50, y: 50 },
        areaPx: 10_000,
        bboxPx: { minX: 0, minY: 0, maxX: 100, maxY: 100 },
      },
    ],
  };
}

describe('photoLayoutStore (fabric-first)', () => {
  beforeEach(() => {
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    usePhotoLayoutStore.getState().reset();
  });

  it('initializes with step=upload, default block size, empty segmentation', () => {
    const state = usePhotoLayoutStore.getState();
    expect(state.step).toBe('upload');
    expect(state.blockWidthInches).toBe(12);
    expect(state.blockHeightInches).toBe(12);
    expect(state.seamAllowance).toBe(DEFAULT_SEAM_ALLOWANCE_INCHES);
    expect(state.segmentation).toBeNull();
    expect(state.fabricCount).toBe(6);
    expect(state.patchOverrides).toEqual({});
    expect(state.corners).toBeNull();
    expect(state.warpedImageRef).toBeNull();
  });

  it('setStep updates the wizard step', () => {
    usePhotoLayoutStore.getState().setStep('calibrate');
    expect(usePhotoLayoutStore.getState().step).toBe('calibrate');
    usePhotoLayoutStore.getState().setStep('review');
    expect(usePhotoLayoutStore.getState().step).toBe('review');
  });

  it('setCorners stores the pinned calibration quadrilateral', () => {
    const corners: QuadCorners = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ];
    usePhotoLayoutStore.getState().setCorners(corners);
    expect(usePhotoLayoutStore.getState().corners).toEqual(corners);
  });

  it('setBlockSize updates both dimensions at once', () => {
    usePhotoLayoutStore.getState().setBlockSize(14, 10);
    const state = usePhotoLayoutStore.getState();
    expect(state.blockWidthInches).toBe(14);
    expect(state.blockHeightInches).toBe(10);
  });

  it('setSegmentation + setFabricCount round-trip the review-step state', () => {
    const seg = makeSegmentation();
    usePhotoLayoutStore.getState().setSegmentation(seg);
    usePhotoLayoutStore.getState().setFabricCount(8);
    const state = usePhotoLayoutStore.getState();
    expect(state.segmentation).toBe(seg);
    expect(state.fabricCount).toBe(8);
  });

  it('setFabricCount clamps to 1 and rounds non-integers', () => {
    usePhotoLayoutStore.getState().setFabricCount(0);
    expect(usePhotoLayoutStore.getState().fabricCount).toBe(1);
    usePhotoLayoutStore.getState().setFabricCount(5.7);
    expect(usePhotoLayoutStore.getState().fabricCount).toBe(6);
  });

  it('setPatchOverride merges into the overrides map without touching siblings', () => {
    const store = usePhotoLayoutStore.getState();
    store.setPatchOverride('patch-0', '#ff0000', 'fabric-42');
    store.setPatchOverride('patch-1', '#00ff00', null);

    const state = usePhotoLayoutStore.getState();
    expect(state.patchOverrides['patch-0']).toEqual({ hex: '#ff0000', fabricId: 'fabric-42' });
    expect(state.patchOverrides['patch-1']).toEqual({ hex: '#00ff00', fabricId: null });
  });

  it('clearPatchOverrides empties the overrides map', () => {
    const store = usePhotoLayoutStore.getState();
    store.setPatchOverride('patch-0', '#ff0000', null);
    store.clearPatchOverrides();
    expect(usePhotoLayoutStore.getState().patchOverrides).toEqual({});
  });

  it('setSeamAllowance accepts the two legal values', () => {
    usePhotoLayoutStore.getState().setSeamAllowance(0.375);
    expect(usePhotoLayoutStore.getState().seamAllowance).toBe(0.375);
    usePhotoLayoutStore.getState().setSeamAllowance(0.25);
    expect(usePhotoLayoutStore.getState().seamAllowance).toBe(0.25);
  });

  it('reset() restores every field to its initial value', () => {
    const corners: QuadCorners = [
      { x: 5, y: 5 },
      { x: 50, y: 5 },
      { x: 50, y: 50 },
      { x: 5, y: 50 },
    ];
    const seg = makeSegmentation();
    const store = usePhotoLayoutStore.getState();
    store.setStep('review');
    store.setCorners(corners);
    store.setBlockSize(16, 20);
    store.setSeamAllowance(0.375);
    store.setSegmentation(seg);
    store.setFabricCount(10);
    store.setPatchOverride('patch-0', '#ff0000', null);

    usePhotoLayoutStore.getState().reset();

    const state = usePhotoLayoutStore.getState();
    expect(state.step).toBe('upload');
    expect(state.corners).toBeNull();
    expect(state.blockWidthInches).toBe(12);
    expect(state.blockHeightInches).toBe(12);
    expect(state.seamAllowance).toBe(DEFAULT_SEAM_ALLOWANCE_INCHES);
    expect(state.segmentation).toBeNull();
    expect(state.fabricCount).toBe(6);
    expect(state.patchOverrides).toEqual({});
    expect(state.warpedImageRef).toBeNull();
    expect(state.originalImage).toBeNull();
    expect(state.originalImageUrl).toBe('');
  });
});
