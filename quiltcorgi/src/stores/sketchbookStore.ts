'use client';

import { create } from 'zustand';
import type { DesignVariation } from '@/types/sketchbook';

interface SketchbookStoreState {
  variations: DesignVariation[];
  activeVariationId: string | null;
  isPanelOpen: boolean;
  isLoading: boolean;
  isSaving: boolean;
  compareMode: boolean;
  compareVariationId: string | null;
  error: string | null;

  togglePanel: () => void;
  setPanelOpen: (open: boolean) => void;
  setActiveVariation: (id: string) => void;
  setCompareMode: (on: boolean, compareId?: string) => void;

  loadVariations: (projectId: string) => Promise<void>;
  saveVariation: (
    projectId: string,
    name: string,
    canvasData: Record<string, unknown>
  ) => Promise<void>;
  duplicateVariation: (projectId: string, variationId: string) => Promise<void>;
  deleteVariation: (projectId: string, variationId: string) => Promise<void>;
  renameVariation: (projectId: string, variationId: string, name: string) => Promise<void>;
}

function isValidVariationRecord(v: Record<string, unknown>): boolean {
  return (
    typeof v.id === 'string' &&
    v.id.length > 0 &&
    typeof v.name === 'string' &&
    (v.canvasData === null || v.canvasData === undefined || typeof v.canvasData === 'object') &&
    (v.createdAt === null || typeof v.createdAt === 'string')
  );
}

export const useSketchbookStore = create<SketchbookStoreState>((set, get) => ({
  variations: [],
  activeVariationId: null,
  isPanelOpen: false,
  isLoading: false,
  isSaving: false,
  compareMode: false,
  compareVariationId: null,
  error: null,

  togglePanel: () => set((state) => ({ isPanelOpen: !state.isPanelOpen })),
  setPanelOpen: (open) => set({ isPanelOpen: open }),
  setActiveVariation: (id) => set({ activeVariationId: id }),

  setCompareMode: (on, compareId) =>
    set({
      compareMode: on,
      compareVariationId: on ? (compareId ?? null) : null,
    }),

  loadVariations: async (projectId) => {
    set({ isLoading: true });
    try {
      const res = await fetch(`/api/projects/${projectId}/variations`);
      if (!res.ok) {
        set({ variations: [], isLoading: false });
        return;
      }
      const json = await res.json();
      if (json.success) {
        const raw: Array<Record<string, unknown>> = Array.isArray(json.data) ? json.data : [];
        const variations = raw
          .filter((v) => {
            if (!isValidVariationRecord(v)) {
              console.warn('[sketchbookStore] Skipping malformed variation record:', v);
              return false;
            }
            return true;
          })
          .map((v) => ({
            id: v.id as string,
            projectId,
            userId: typeof v.userId === 'string' ? v.userId : '',
            name: v.name as string,
            canvasData: (v.canvasData as Record<string, unknown>) ?? {},
            thumbnailUrl: typeof v.thumbnailUrl === 'string' ? v.thumbnailUrl : null,
            createdAt: new Date(v.createdAt as string),
          }));
        set({ variations, isLoading: false });
      } else {
        set({ variations: [], isLoading: false });
      }
    } catch {
      set({ variations: [], isLoading: false });
    }
  },

  saveVariation: async (projectId, name, canvasData) => {
    set({ isSaving: true, error: null });
    try {
      const res = await fetch(`/api/projects/${projectId}/variations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, canvasData }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          const v = json.data as Record<string, unknown>;
          if (!isValidVariationRecord(v)) {
            console.warn('[sketchbookStore] saveVariation: invalid response record', v);
            set({ isSaving: false });
            return;
          }
          const newVariation: DesignVariation = {
            id: v.id as string,
            projectId,
            userId: typeof v.userId === 'string' ? v.userId : '',
            name: v.name as string,
            canvasData: (v.canvasData as Record<string, unknown>) ?? {},
            thumbnailUrl: typeof v.thumbnailUrl === 'string' ? v.thumbnailUrl : null,
            createdAt: new Date(v.createdAt as string),
          };
          set((state) => ({
            variations: [...state.variations, newVariation],
            isSaving: false,
          }));
          return;
        }
      }
      set({ isSaving: false });
    } catch {
      set({ isSaving: false });
    }
  },

  duplicateVariation: async (projectId, variationId) => {
    const { variations } = get();
    const original = variations.find((v) => v.id === variationId);
    if (!original) return;

    set({ isSaving: true, error: null });
    try {
      const res = await fetch(`/api/projects/${projectId}/variations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${original.name} (Copy)`,
          canvasData: original.canvasData,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          const v = json.data as Record<string, unknown>;
          if (!isValidVariationRecord(v)) {
            console.warn('[sketchbookStore] duplicateVariation: invalid response record', v);
            set({ isSaving: false });
            return;
          }
          const dup: DesignVariation = {
            id: v.id as string,
            projectId,
            userId: typeof v.userId === 'string' ? v.userId : '',
            name: v.name as string,
            canvasData: (v.canvasData as Record<string, unknown>) ?? {},
            thumbnailUrl: typeof v.thumbnailUrl === 'string' ? v.thumbnailUrl : null,
            createdAt: new Date(v.createdAt as string),
          };
          set((state) => ({
            variations: [...state.variations, dup],
            isSaving: false,
          }));
          return;
        }
      }
      set({ isSaving: false });
    } catch {
      set({ isSaving: false });
    }
  },

  deleteVariation: async (projectId, variationId) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/variations/${variationId}`, {
        method: 'DELETE',
      });
      if (res.ok || res.status === 204) {
        set((state) => ({
          variations: state.variations.filter((v) => v.id !== variationId),
          activeVariationId:
            state.activeVariationId === variationId ? null : state.activeVariationId,
          compareVariationId:
            state.compareVariationId === variationId ? null : state.compareVariationId,
        }));
      } else {
        set({ error: 'Failed to delete variation. Please try again.' });
      }
    } catch {
      set({ error: 'Failed to delete variation. Check your connection.' });
    }
  },

  renameVariation: async (projectId, variationId, name) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/variations/${variationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        set((state) => ({
          variations: state.variations.map((v) => (v.id === variationId ? { ...v, name } : v)),
        }));
      } else {
        set({ error: 'Failed to rename variation. Please try again.' });
      }
    } catch {
      set({ error: 'Failed to rename variation. Check your connection.' });
    }
  },
}));
