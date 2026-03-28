'use client';

import { create } from 'zustand';
import type { PieceGeometry, PieceDimensions } from '@/lib/piece-inspector-engine';

interface PieceInspectorState {
  readonly isOpen: boolean;
  readonly isPuzzleViewActive: boolean;
  readonly selectedPieceId: string | null;
  readonly hoveredPieceId: string | null;
  readonly seamAllowance: number;
  readonly pieceGeometry: PieceGeometry | null;
  readonly pieceDimensions: PieceDimensions | null;

  setOpen: (open: boolean) => void;
  togglePuzzleView: () => void;
  setPuzzleViewActive: (active: boolean) => void;
  selectPiece: (
    pieceId: string | null,
    geometry: PieceGeometry | null,
    dimensions: PieceDimensions | null
  ) => void;
  setHoveredPiece: (pieceId: string | null) => void;
  setSeamAllowance: (allowance: number) => void;
  clearSelection: () => void;
  reset: () => void;
}

const INITIAL_STATE = {
  isOpen: false,
  isPuzzleViewActive: false,
  selectedPieceId: null,
  hoveredPieceId: null,
  seamAllowance: 0.25,
  pieceGeometry: null,
  pieceDimensions: null,
} as const;

export const usePieceInspectorStore = create<PieceInspectorState>((set) => ({
  ...INITIAL_STATE,

  setOpen: (isOpen) => set({ isOpen }),

  togglePuzzleView: () =>
    set((state) => {
      const next = !state.isPuzzleViewActive;
      return {
        isPuzzleViewActive: next,
        isOpen: next ? state.isOpen : false,
        selectedPieceId: next ? state.selectedPieceId : null,
        hoveredPieceId: null,
        pieceGeometry: next ? state.pieceGeometry : null,
        pieceDimensions: next ? state.pieceDimensions : null,
      };
    }),

  setPuzzleViewActive: (isPuzzleViewActive) =>
    set(() => {
      if (!isPuzzleViewActive) {
        return {
          isPuzzleViewActive: false,
          isOpen: false,
          selectedPieceId: null,
          hoveredPieceId: null,
          pieceGeometry: null,
          pieceDimensions: null,
        };
      }
      return { isPuzzleViewActive };
    }),

  selectPiece: (selectedPieceId, pieceGeometry, pieceDimensions) =>
    set({
      selectedPieceId,
      pieceGeometry,
      pieceDimensions,
      isOpen: selectedPieceId !== null,
    }),

  setHoveredPiece: (hoveredPieceId) => set({ hoveredPieceId }),

  setSeamAllowance: (seamAllowance) => set({ seamAllowance }),

  clearSelection: () =>
    set({
      selectedPieceId: null,
      pieceGeometry: null,
      pieceDimensions: null,
      isOpen: false,
    }),

  reset: () => set({ ...INITIAL_STATE }),
}));
