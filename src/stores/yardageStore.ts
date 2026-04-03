'use client';

import { create } from 'zustand';
import type { WOF, YardageResult } from '@/lib/yardage-utils';
import { DEFAULT_WOF, DEFAULT_WASTE_MARGIN } from '@/lib/constants';
import { clamp } from '@/lib/math-utils';

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
  reset: () => void;
}

const INITIAL_STATE = {
  isPanelOpen: false,
  wof: DEFAULT_WOF,
  wasteMargin: DEFAULT_WASTE_MARGIN,
  results: [] as YardageResult[],
};

export const useYardageStore = create<YardageStoreState>((set) => ({
  ...INITIAL_STATE,

  togglePanel: () => set((state) => ({ isPanelOpen: !state.isPanelOpen })),
  setPanelOpen: (isPanelOpen) => set({ isPanelOpen }),
  setWof: (wof) => set({ wof }),
  setWasteMargin: (wasteMargin) => set({ wasteMargin: clamp(wasteMargin, 0.05, 0.25) }),
  setResults: (results) => set({ results }),
  reset: () => set({ ...INITIAL_STATE }),
}));
