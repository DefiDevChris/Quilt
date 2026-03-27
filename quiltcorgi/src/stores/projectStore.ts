'use client';

import { create } from 'zustand';

export type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error';

interface ProjectStoreState {
  projectId: string | null;
  projectName: string;
  saveStatus: SaveStatus;
  canvasWidth: number;
  canvasHeight: number;
  isDirty: boolean;
  lastSavedAt: Date | null;

  setProject: (data: {
    id: string;
    name: string;
    width: number;
    height: number;
  }) => void;
  setProjectName: (name: string) => void;
  setSaveStatus: (status: SaveStatus) => void;
  setDirty: (dirty: boolean) => void;
  setLastSavedAt: (date: Date) => void;
  setCanvasDimensions: (width: number, height: number) => void;
  reset: () => void;
}

export const useProjectStore = create<ProjectStoreState>((set) => ({
  projectId: null,
  projectName: 'Untitled Quilt',
  saveStatus: 'saved',
  canvasWidth: 48,
  canvasHeight: 48,
  isDirty: false,
  lastSavedAt: null,

  setProject: ({ id, name, width, height }) =>
    set({
      projectId: id,
      projectName: name,
      canvasWidth: width,
      canvasHeight: height,
      isDirty: false,
      saveStatus: 'saved',
    }),

  setProjectName: (projectName) => set({ projectName }),
  setSaveStatus: (saveStatus) => set({ saveStatus }),
  setDirty: (isDirty) => set({ isDirty }),
  setLastSavedAt: (lastSavedAt) => set({ lastSavedAt }),
  setCanvasDimensions: (canvasWidth, canvasHeight) =>
    set({ canvasWidth, canvasHeight }),
  reset: () =>
    set({
      projectId: null,
      projectName: 'Untitled Quilt',
      saveStatus: 'saved',
      canvasWidth: 48,
      canvasHeight: 48,
      isDirty: false,
      lastSavedAt: null,
    }),
}));
