import { create } from 'zustand';

interface FabricPlacement {
  fabricId: string;
  imageUrl: string;
  x: number;
  y: number;
}

interface LayoutState {
  canvasJson: object | null;
  fabricPlacements: FabricPlacement[];
  selectedObjectIds: string[];

  setCanvasJson: (json: object) => void;
  addFabricToCanvas: (placement: FabricPlacement) => void;
  clearAllFabrics: () => void;
  setSelectedObjectIds: (ids: string[]) => void;
}

export const useLayoutStore = create<LayoutState>((set) => ({
  canvasJson: null,
  fabricPlacements: [],
  selectedObjectIds: [],

  setCanvasJson: (json) => set({ canvasJson: json }),

  addFabricToCanvas: (placement) =>
    set((state) => ({
      fabricPlacements: [...state.fabricPlacements, placement],
    })),

  clearAllFabrics: () => set({ fabricPlacements: [] }),

  setSelectedObjectIds: (ids) => set({ selectedObjectIds: ids }),
}));
