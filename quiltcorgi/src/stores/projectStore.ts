'use client';

import { create } from 'zustand';
import { DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT } from '@/lib/constants';

export type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error';

interface ProjectStoreState {
  projectId: string | null;
  projectName: string;
  saveStatus: SaveStatus;
  canvasWidth: number;
  canvasHeight: number;
  isDirty: boolean;
  lastSavedAt: Date | null;

  setProject: (data: { id: string; name: string; width: number; height: number }) => void;
  setProjectName: (name: string) => void;
  setSaveStatus: (status: SaveStatus) => void;
  setDirty: (dirty: boolean) => void;
  setLastSavedAt: (date: Date) => void;
  setCanvasDimensions: (width: number, height: number) => void;
  setCanvasWidth: (width: number) => void;
  setCanvasHeight: (height: number) => void;
  reset: () => void;
}

export const useProjectStore = create<ProjectStoreState>((set) => ({
  projectId: null,
  projectName: 'Untitled Quilt',
  saveStatus: 'saved',
  canvasWidth: DEFAULT_CANVAS_WIDTH,
  canvasHeight: DEFAULT_CANVAS_HEIGHT,
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
  setCanvasDimensions: (canvasWidth, canvasHeight) => set({ canvasWidth, canvasHeight }),
  setCanvasWidth: (canvasWidth) => set({ canvasWidth }),
  setCanvasHeight: (canvasHeight) => set({ canvasHeight }),
  reset: () =>
    set({
      projectId: null,
      projectName: 'Untitled Quilt',
      saveStatus: 'saved',
      canvasWidth: DEFAULT_CANVAS_WIDTH,
      canvasHeight: DEFAULT_CANVAS_HEIGHT,
      isDirty: false,
      lastSavedAt: null,
    }),
}));
