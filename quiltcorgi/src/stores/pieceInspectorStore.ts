'use client';

import { create } from 'zustand';
import type { PieceGeometry, PieceDimensions } from '@/lib/piece-inspector-utils';

interface PieceInspectorState {
  readonly isOpen: boolean;
  readonly selectedPieceId: string | null;
  readonly seamAllowance: number;
  readonly pieceGeometry: PieceGeometry | null;
  readonly pieceDimensions: PieceDimensions | null;

  setOpen: (open: boolean) => void;
  selectPiece: (
    pieceId: string | null,
    geometry: PieceGeometry | null,
    dimensions: PieceDimensions | null
  ) => void;
  setSeamAllowance: (allowance: number) => void;
  clearSelection: () => void;
  reset: () => void;
}

const INITIAL_STATE = {
  isOpen: false,
  selectedPieceId: null,
  seamAllowance: 0.25,
  pieceGeometry: null,
  pieceDimensions: null,
} as const;

export const usePieceInspectorStore = create<PieceInspectorState>((set) => ({
  ...INITIAL_STATE,

  setOpen: (isOpen) => set({ isOpen }),

  selectPiece: (selectedPieceId, pieceGeometry, pieceDimensions) =>
    set({
      selectedPieceId,
      pieceGeometry,
      pieceDimensions,
      isOpen: selectedPieceId !== null,
    }),

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
