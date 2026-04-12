import { create } from 'zustand';

/**
 * Lightweight store for Block Builder canvas stats.
 * Written to by `useBlockBuilder` hook, read by `BottomBar` for status display.
 */
interface BlockBuilderStoreState {
  segmentCount: number;
  patchCount: number;
  setCounts: (segmentCount: number, patchCount: number) => void;
  reset: () => void;
}

export const useBlockBuilderStore = create<BlockBuilderStoreState>((set) => ({
  segmentCount: 0,
  patchCount: 0,
  setCounts: (segmentCount, patchCount) => set({ segmentCount, patchCount }),
  reset: () => set({ segmentCount: 0, patchCount: 0 }),
}));
