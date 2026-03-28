'use client';

import { create } from 'zustand';
import type { LayoutType, SashingConfig, BorderConfig } from '@/lib/layout-engine';

interface LayoutStoreState {
  layoutType: LayoutType;
  rows: number;
  cols: number;
  blockSize: number;
  sashing: SashingConfig;
  borders: BorderConfig[];
  isPanelOpen: boolean;

  setLayoutType: (type: LayoutType) => void;
  setRows: (rows: number) => void;
  setCols: (cols: number) => void;
  setBlockSize: (size: number) => void;
  setSashing: (updates: Partial<SashingConfig>) => void;
  addBorder: () => void;
  updateBorder: (index: number, updates: Partial<BorderConfig>) => void;
  removeBorder: (index: number) => void;
  togglePanel: () => void;
  setPanelOpen: (open: boolean) => void;
  reset: () => void;
}

const DEFAULT_SASHING: SashingConfig = {
  width: 1,
  color: '#F5F0E8',
  fabricId: null,
};

function createBorder(overrides?: Partial<BorderConfig>): BorderConfig {
  return {
    id: crypto.randomUUID(),
    width: 2,
    color: '#2D2D2D',
    fabricId: null,
    type: 'solid',
    ...overrides,
  };
}

export const useLayoutStore = create<LayoutStoreState>((set) => ({
  layoutType: 'free-form',
  rows: 3,
  cols: 3,
  blockSize: 6,
  sashing: { ...DEFAULT_SASHING },
  borders: [],
  isPanelOpen: false,

  setLayoutType: (layoutType) => set({ layoutType }),

  setRows: (rows) => set({ rows: Math.max(1, Math.min(20, rows)) }),

  setCols: (cols) => set({ cols: Math.max(1, Math.min(20, cols)) }),

  setBlockSize: (blockSize) => set({ blockSize: Math.max(1, Math.min(24, blockSize)) }),

  setSashing: (updates) =>
    set((state) => ({
      sashing: { ...state.sashing, ...updates },
    })),

  addBorder: () =>
    set((state) => {
      if (state.borders.length >= 5) return state;
      return {
        borders: [...state.borders, createBorder()],
      };
    }),

  updateBorder: (index, updates) =>
    set((state) => ({
      borders: state.borders.map((b, i) => (i === index ? { ...b, ...updates } : b)),
    })),

  removeBorder: (index) =>
    set((state) => ({
      borders: state.borders.filter((_, i) => i !== index),
    })),

  togglePanel: () => set((state) => ({ isPanelOpen: !state.isPanelOpen })),

  setPanelOpen: (isPanelOpen) => set({ isPanelOpen }),

  reset: () =>
    set({
      layoutType: 'free-form',
      rows: 3,
      cols: 3,
      blockSize: 6,
      sashing: { ...DEFAULT_SASHING },
      borders: [],
      isPanelOpen: false,
    }),
}));
