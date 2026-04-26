import { create } from 'zustand';
import { DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT } from '@/lib/constants';
import type { Worktable } from '@/types/project';

export type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error';

export interface FabricPreset {
  readonly id: string;
  readonly name: string;
  readonly imageUrl: string;
}

export type { Worktable } from '@/types/project';

interface ProjectStoreState {
  projectId: string | null;
  projectName: string;
  mode: 'free-form' | 'layout' | 'template';
  /** True after user explicitly selects a mode in the mode-selection modal */
  modeSelected: boolean;
  saveStatus: SaveStatus;
  canvasWidth: number;
  canvasHeight: number;
  isDirty: boolean;
  hasContent: boolean;
  lastSavedAt: Date | null;
  fabricPresets: FabricPreset[];
  worktables: Worktable[];
  activeWorktableId: string;
  version: number;

  setProject: (data: {
    id: string;
    name: string;
    mode?: 'free-form' | 'layout' | 'template';
    width: number;
    height: number;
    worktables?: Worktable[];
    version?: number;
  }) => void;
  setProjectName: (name: string) => void;
  setMode: (mode: 'free-form' | 'layout' | 'template') => void;
  setSaveStatus: (status: SaveStatus) => void;
  setDirty: (dirty: boolean) => void;
  setHasContent: (has: boolean) => void;
  setLastSavedAt: (date: Date) => void;
  setCanvasDimensions: (width: number, height: number) => void;
  setCanvasWidth: (width: number) => void;
  setCanvasHeight: (height: number) => void;
  addFabricPreset: (fabric: FabricPreset) => void;
  removeFabricPreset: (fabricId: string) => void;
  setFabricPresets: (presets: FabricPreset[]) => void;
  setWorktables: (worktables: Worktable[]) => void;
  setActiveWorktableId: (id: string) => void;
  addWorktable: (name: string) => void;
  deleteWorktable: (id: string) => void;
  renameWorktable: (id: string, name: string) => void;
  duplicateWorktable: (id: string) => void;
  updateWorktableCanvas: (id: string, canvasData: Record<string, unknown>) => void;
  reset: () => void;
}

export const useProjectStore = create<ProjectStoreState>((set) => ({
  projectId: null,
  projectName: 'Untitled Quilt',
  mode: 'layout',
  modeSelected: false,
  saveStatus: 'saved',
  canvasWidth: DEFAULT_CANVAS_WIDTH,
  canvasHeight: DEFAULT_CANVAS_HEIGHT,
  isDirty: false,
  hasContent: false,
  lastSavedAt: null,
  fabricPresets: [],
  worktables: [{ id: 'main', name: 'Main', canvasData: {}, order: 0 }],
  activeWorktableId: 'main',
  version: 1,

  setProject: ({ id, name, mode, width, height, worktables, version }) =>
    set({
      projectId: id,
      projectName: name,
      mode: mode ?? 'layout',
      modeSelected: true,
      canvasWidth: width,
      canvasHeight: height,
      worktables: worktables ?? [{ id: 'main', name: 'Main', canvasData: {}, order: 0 }],
      activeWorktableId: worktables?.[0]?.id ?? 'main',
      version: version ?? 1,
      isDirty: false,
      saveStatus: 'saved',
    }),

  setProjectName: (projectName) => set({ projectName }),
  setMode: (mode) => set({ mode, modeSelected: true, isDirty: true }),
  setSaveStatus: (saveStatus) => set({ saveStatus }),
  setDirty: (isDirty) => set({ isDirty }),
  setHasContent: (hasContent) => set({ hasContent }),
  setLastSavedAt: (lastSavedAt) => set({ lastSavedAt }),
  setCanvasDimensions: (canvasWidth, canvasHeight) => set({ canvasWidth, canvasHeight }),
  setCanvasWidth: (canvasWidth) => set({ canvasWidth }),
  setCanvasHeight: (canvasHeight) => set({ canvasHeight }),
  addFabricPreset: (fabric) =>
    set((state) => {
      if (state.fabricPresets.some((f) => f.id === fabric.id)) return state;
      return { fabricPresets: [...state.fabricPresets, fabric], isDirty: true };
    }),
  removeFabricPreset: (fabricId) =>
    set((state) => ({
      fabricPresets: state.fabricPresets.filter((f) => f.id !== fabricId),
      isDirty: true,
    })),
  setFabricPresets: (fabricPresets) => set({ fabricPresets }),
  setWorktables: (worktables) => set({ worktables }),
  setActiveWorktableId: (id) => set({ activeWorktableId: id }),
  addWorktable: (name) =>
    set((state) => {
      if (state.worktables.length >= 10) return state;
      const newId = `wt-${Date.now()}`;
      const newWorktable: Worktable = {
        id: newId,
        name,
        canvasData: {},
        order: state.worktables.length,
      };
      return {
        worktables: [...state.worktables, newWorktable],
        activeWorktableId: newId,
        isDirty: true,
      };
    }),
  deleteWorktable: (id) =>
    set((state) => {
      if (state.worktables.length <= 1) return state;
      const filtered = state.worktables.filter((w) => w.id !== id);
      const newActive =
        state.activeWorktableId === id ? (filtered[0]?.id ?? 'main') : state.activeWorktableId;
      return { worktables: filtered, activeWorktableId: newActive, isDirty: true };
    }),
  renameWorktable: (id, name) =>
    set((state) => ({
      worktables: state.worktables.map((w) => (w.id === id ? { ...w, name } : w)),
      isDirty: true,
    })),
  duplicateWorktable: (id) =>
    set((state) => {
      if (state.worktables.length >= 10) return state;
      const source = state.worktables.find((w) => w.id === id);
      if (!source) return state;
      const newId = `wt-${Date.now()}`;
      const newWorktable: Worktable = {
        id: newId,
        name: `${source.name} Copy`,
        canvasData: JSON.parse(JSON.stringify(source.canvasData)),
        order: state.worktables.length,
      };
      return {
        worktables: [...state.worktables, newWorktable],
        activeWorktableId: newId,
        isDirty: true,
      };
    }),
  updateWorktableCanvas: (id, canvasData) =>
    set((state) => ({
      worktables: state.worktables.map((w) => (w.id === id ? { ...w, canvasData } : w)),
      isDirty: true,
    })),
  reset: () =>
    set({
      projectId: null,
      projectName: 'Untitled Quilt',
      mode: 'layout',
      modeSelected: false,
      saveStatus: 'saved',
      canvasWidth: DEFAULT_CANVAS_WIDTH,
      canvasHeight: DEFAULT_CANVAS_HEIGHT,
      isDirty: false,
      hasContent: false,
      lastSavedAt: null,
      fabricPresets: [],
      worktables: [{ id: 'main', name: 'Main', canvasData: {}, order: 0 }],
      activeWorktableId: 'main',
      version: 1,
    }),
}));
