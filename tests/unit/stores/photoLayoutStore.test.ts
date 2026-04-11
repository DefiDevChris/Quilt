import { describe, it, expect, beforeEach, vi } from 'vitest';
import { usePhotoLayoutStore } from '@/stores/photoLayoutStore';
import { DEFAULT_SEAM_ALLOWANCE_INCHES } from '@/lib/constants';
import {
  BLOCK_GRID_PRESETS,
  DEFAULT_BLOCK_GRID_PRESET_ID,
} from '@/lib/block-grid-presets';
import type {
  GridCell,
  QuadCorners,
} from '@/lib/photo-layout-types';

describe('photoLayoutStore (perspective-first)', () => {
  beforeEach(() => {
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    usePhotoLayoutStore.getState().reset();
  });

  it('initializes with step=upload, default block size, and default preset', () => {
    const state = usePhotoLayoutStore.getState();
    expect(state.step).toBe('upload');
    expect(state.blockWidthInches).toBe(12);
    expect(state.blockHeightInches).toBe(12);
    expect(state.selectedPreset.id).toBe(DEFAULT_BLOCK_GRID_PRESET_ID);
    expect(state.seamAllowance).toBe(DEFAULT_SEAM_ALLOWANCE_INCHES);
    expect(state.cells).toEqual([]);
    expect(state.corners).toBeNull();
    expect(state.warpedImageRef).toBeNull();
  });

  it('setStep updates the wizard step', () => {
    usePhotoLayoutStore.getState().setStep('calibrate');
    expect(usePhotoLayoutStore.getState().step).toBe('calibrate');
    usePhotoLayoutStore.getState().setStep('layout');
    expect(usePhotoLayoutStore.getState().step).toBe('layout');
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

  it('setSelectedPreset swaps the active block grid', () => {
    const hst = BLOCK_GRID_PRESETS.find((p) => p.id === 'hst-2x2');
    expect(hst).toBeDefined();
    usePhotoLayoutStore.getState().setSelectedPreset(hst!);
    expect(usePhotoLayoutStore.getState().selectedPreset.id).toBe('hst-2x2');
  });

  it('setCells replaces the full cell list', () => {
    const cells: readonly GridCell[] = [
      {
        id: 'cell-r0c0',
        row: 0,
        col: 0,
        polygonInches: [
          { x: 0, y: 0 },
          { x: 6, y: 0 },
          { x: 6, y: 6 },
          { x: 0, y: 6 },
        ],
        centroidInches: { x: 3, y: 3 },
        fabricColor: '#cc0000',
        assignedFabricId: null,
      },
    ];
    usePhotoLayoutStore.getState().setCells(cells);
    expect(usePhotoLayoutStore.getState().cells).toEqual(cells);
  });

  it('updateCellColor rewrites a single cell without touching the others', () => {
    const cells: readonly GridCell[] = [
      {
        id: 'a',
        row: 0,
        col: 0,
        polygonInches: [],
        centroidInches: { x: 0, y: 0 },
        fabricColor: '#aaaaaa',
        assignedFabricId: null,
      },
      {
        id: 'b',
        row: 0,
        col: 1,
        polygonInches: [],
        centroidInches: { x: 1, y: 0 },
        fabricColor: '#bbbbbb',
        assignedFabricId: null,
      },
    ];
    usePhotoLayoutStore.getState().setCells(cells);
    usePhotoLayoutStore.getState().updateCellColor('b', '#ff0000', 'fabric-42');

    const updated = usePhotoLayoutStore.getState().cells;
    expect(updated[0].fabricColor).toBe('#aaaaaa');
    expect(updated[1].fabricColor).toBe('#ff0000');
    expect(updated[1].assignedFabricId).toBe('fabric-42');
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
    usePhotoLayoutStore.getState().setStep('review');
    usePhotoLayoutStore.getState().setCorners(corners);
    usePhotoLayoutStore.getState().setBlockSize(16, 20);
    usePhotoLayoutStore.getState().setSeamAllowance(0.375);

    usePhotoLayoutStore.getState().reset();

    const state = usePhotoLayoutStore.getState();
    expect(state.step).toBe('upload');
    expect(state.corners).toBeNull();
    expect(state.blockWidthInches).toBe(12);
    expect(state.blockHeightInches).toBe(12);
    expect(state.seamAllowance).toBe(DEFAULT_SEAM_ALLOWANCE_INCHES);
    expect(state.cells).toEqual([]);
    expect(state.warpedImageRef).toBeNull();
    expect(state.originalImage).toBeNull();
    expect(state.originalImageUrl).toBe('');
  });
});
