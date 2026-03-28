'use client';

import { create } from 'zustand';
import type { WOF, YardageResult } from '@/lib/yardage-engine';
import { DEFAULT_WOF, DEFAULT_WASTE_MARGIN } from '@/lib/constants';

interface YardageStoreState {
  isPanelOpen: boolean;
  wof: WOF;
  wasteMargin: number;
  results: YardageResult[];

  togglePanel: () => void;
  setPanelOpen: (open: boolean) => void;
  setWof: (wof: WOF) => void;
  setWasteMargin: (margin: number) => void;
  setResults: (results: YardageResult[]) => void;
}

export const useYardageStore = create<YardageStoreState>((set) => ({
  isPanelOpen: false,
  wof: DEFAULT_WOF,
  wasteMargin: DEFAULT_WASTE_MARGIN,
  results: [],

  togglePanel: () => set((state) => ({ isPanelOpen: !state.isPanelOpen })),
  setPanelOpen: (isPanelOpen) => set({ isPanelOpen }),
  setWof: (wof) => set({ wof }),
  setWasteMargin: (wasteMargin) =>
    set({ wasteMargin: Math.max(0.05, Math.min(0.25, wasteMargin)) }),
  setResults: (results) => set({ results }),
}));
