'use client';

import { create } from 'zustand';
import type {
  PhotoLayoutStep,
  QuadCorners,
  GridCell,
  WarpedImageRef,
  BlockGridPreset,
} from '@/lib/photo-layout-types';
import { DEFAULT_SEAM_ALLOWANCE_INCHES } from '@/lib/constants';
import {
  BLOCK_GRID_PRESETS,
  DEFAULT_BLOCK_GRID_PRESET_ID,
} from '@/lib/block-grid-presets';

/** Default real-world block size. Matches the most common traditional block. */
const DEFAULT_BLOCK_SIZE_INCHES = 12;

function getDefaultPreset(): BlockGridPreset {
  return (
    BLOCK_GRID_PRESETS.find((p) => p.id === DEFAULT_BLOCK_GRID_PRESET_ID) ??
    BLOCK_GRID_PRESETS[0]
  );
}

interface PhotoLayoutState {
  step: PhotoLayoutStep;
  originalImage: HTMLImageElement | null;
  originalImageUrl: string;

  /** Pinned four corners in source-image pixel space. */
  corners: QuadCorners | null;
  /** Real-world size of the pinned block in inches. */
  blockWidthInches: number;
  blockHeightInches: number;

  /** Blob URL reference to the flattened (warped) block image. */
  warpedImageRef: WarpedImageRef | null;

  /** User-selected block grid preset (4-Patch, 9-Patch, HST, ...). */
  selectedPreset: BlockGridPreset;

  /** Final grid cells with sampled fabric colors. */
  cells: readonly GridCell[];

  /** Seam allowance (passed through to the studio import). */
  seamAllowance: 0.25 | 0.375;

  setStep: (step: PhotoLayoutStep) => void;
  setOriginalImage: (img: HTMLImageElement, url: string) => void;
  setCorners: (corners: QuadCorners | null) => void;
  setBlockSize: (widthInches: number, heightInches: number) => void;
  setWarpedImageRef: (ref: WarpedImageRef | null) => void;
  setSelectedPreset: (preset: BlockGridPreset) => void;
  setCells: (cells: readonly GridCell[]) => void;
  updateCellColor: (id: string, fabricColor: string, fabricId?: string | null) => void;
  setSeamAllowance: (value: 0.25 | 0.375) => void;
  reset: () => void;
}

const initialState = {
  step: 'upload' as PhotoLayoutStep,
  originalImage: null as HTMLImageElement | null,
  originalImageUrl: '',
  corners: null as QuadCorners | null,
  blockWidthInches: DEFAULT_BLOCK_SIZE_INCHES,
  blockHeightInches: DEFAULT_BLOCK_SIZE_INCHES,
  warpedImageRef: null as WarpedImageRef | null,
  selectedPreset: getDefaultPreset(),
  cells: [] as readonly GridCell[],
  seamAllowance: DEFAULT_SEAM_ALLOWANCE_INCHES as 0.25 | 0.375,
};

function revokeUrl(url: string | undefined | null): void {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}

export const usePhotoLayoutStore = create<PhotoLayoutState>((set, get) => ({
  ...initialState,

  setStep: (step) => set({ step }),

  setOriginalImage: (img, url) => {
    revokeUrl(get().originalImageUrl);
    set({ originalImage: img, originalImageUrl: url });
  },

  setCorners: (corners) => set({ corners }),

  setBlockSize: (widthInches, heightInches) =>
    set({ blockWidthInches: widthInches, blockHeightInches: heightInches }),

  setWarpedImageRef: (ref) => {
    revokeUrl(get().warpedImageRef?.url);
    set({ warpedImageRef: ref });
  },

  setSelectedPreset: (preset) => set({ selectedPreset: preset }),

  setCells: (cells) => set({ cells }),

  updateCellColor: (id, fabricColor, fabricId = null) =>
    set((s) => ({
      cells: s.cells.map((c) =>
        c.id === id ? { ...c, fabricColor, assignedFabricId: fabricId } : c
      ),
    })),

  setSeamAllowance: (value) => set({ seamAllowance: value }),

  reset: () => {
    const { originalImageUrl, warpedImageRef } = get();
    revokeUrl(originalImageUrl);
    revokeUrl(warpedImageRef?.url);
    set({ ...initialState, selectedPreset: getDefaultPreset() });
  },
}));

// Expose store for E2E testing in development.
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  (window as unknown as Record<string, unknown>).__photoPatternStore = usePhotoLayoutStore;
}
