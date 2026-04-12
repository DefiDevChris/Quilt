'use client';

import { create } from 'zustand';
import type { PhotoLayoutStep, QuadCorners, WarpedImageRef } from '@/lib/photo-layout-types';
import type { SegmentationResult } from '@/lib/quilt-segmentation-engine';
import type { PieceGroup } from '@/lib/shape-picker-engine';
import { buildPatchLabelMap } from '@/lib/shape-picker-engine';
import { DEFAULT_SEAM_ALLOWANCE_INCHES } from '@/lib/constants';

/** Default real-world block size. Matches the most common traditional block. */
const DEFAULT_BLOCK_SIZE_INCHES = 12;

/** Default fabric-count target for the Review slider. */
const DEFAULT_FABRIC_COUNT = 6;

/** Per-patch override the user applies in the Review step. */
export interface PatchOverride {
  readonly hex: string;
  readonly fabricId: string | null;
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

  /** Latest segmentation result — filled on the review step. */
  segmentation: SegmentationResult | null;
  /** k — target fabric count the Review slider drives. */
  fabricCount: number;
  /** Per-patch user overrides keyed by patch id. Empty by default. */
  patchOverrides: Record<string, PatchOverride>;

  /** Seam allowance (passed through to the studio import). */
  seamAllowance: 0.25 | 0.375;

  /** User-defined piece groups from the shape picker. */
  pieceGroups: readonly PieceGroup[];
  /** Fast lookup: patch ID → piece label. Derived from pieceGroups. */
  patchToPieceLabel: Record<string, string>;
  /** Whether shape-picker mode is active in the review step. */
  shapePickerActive: boolean;

  setStep: (step: PhotoLayoutStep) => void;
  setOriginalImage: (img: HTMLImageElement, url: string) => void;
  setCorners: (corners: QuadCorners | null) => void;
  setBlockSize: (widthInches: number, heightInches: number) => void;
  setWarpedImageRef: (ref: WarpedImageRef | null) => void;
  setSegmentation: (segmentation: SegmentationResult | null) => void;
  setFabricCount: (n: number) => void;
  setPatchOverride: (patchId: string, hex: string, fabricId: string | null) => void;
  clearPatchOverrides: () => void;
  setSeamAllowance: (value: 0.25 | 0.375) => void;
  addPieceGroup: (group: PieceGroup) => void;
  removePieceGroup: (label: string) => void;
  clearPieceGroups: () => void;
  setShapePickerActive: (active: boolean) => void;
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
  segmentation: null as SegmentationResult | null,
  fabricCount: DEFAULT_FABRIC_COUNT,
  patchOverrides: {} as Record<string, PatchOverride>,
  seamAllowance: DEFAULT_SEAM_ALLOWANCE_INCHES as 0.25 | 0.375,
  pieceGroups: [] as readonly PieceGroup[],
  patchToPieceLabel: {} as Record<string, string>,
  shapePickerActive: false,
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

  setSegmentation: (segmentation) => set({ segmentation }),

  setFabricCount: (n) => set({ fabricCount: Math.max(1, Math.round(n)) }),

  setPatchOverride: (patchId, hex, fabricId) =>
    set((s) => ({
      patchOverrides: { ...s.patchOverrides, [patchId]: { hex, fabricId } },
    })),

  clearPatchOverrides: () => set({ patchOverrides: {} }),

  setSeamAllowance: (value) => set({ seamAllowance: value }),

  addPieceGroup: (group) =>
    set((s) => {
      const groups = [...s.pieceGroups, group];
      return { pieceGroups: groups, patchToPieceLabel: buildPatchLabelMap(groups) };
    }),

  removePieceGroup: (label) =>
    set((s) => {
      const groups = s.pieceGroups.filter((g) => g.label !== label);
      return { pieceGroups: groups, patchToPieceLabel: buildPatchLabelMap(groups) };
    }),

  clearPieceGroups: () => set({ pieceGroups: [], patchToPieceLabel: {}, shapePickerActive: false }),

  setShapePickerActive: (active) => set({ shapePickerActive: active }),

  reset: () => {
    const { originalImageUrl, warpedImageRef } = get();
    revokeUrl(originalImageUrl);
    revokeUrl(warpedImageRef?.url);
    set({ ...initialState });
  },
}));

// Expose store for E2E testing in development.
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  (window as unknown as Record<string, unknown>).__photoPatternStore = usePhotoLayoutStore;
}
