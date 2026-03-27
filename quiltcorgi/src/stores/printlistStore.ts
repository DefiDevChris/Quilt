'use client';

import { create } from 'zustand';
import type { PrintlistItem } from '@/types/printlist';
import { DEFAULT_SEAM_ALLOWANCE_INCHES } from '@/lib/constants';
import type { PaperSize } from '@/lib/pdf-generator';

interface PrintlistStoreState {
  items: PrintlistItem[];
  paperSize: PaperSize;
  isPanelOpen: boolean;
  projectId: string | null;
  isSaving: boolean;
  isLoading: boolean;

  addItem: (item: Omit<PrintlistItem, 'seamAllowance'> & { seamAllowance?: number }) => void;
  removeItem: (shapeId: string) => void;
  updateQuantity: (shapeId: string, quantity: number) => void;
  updateSeamAllowance: (shapeId: string, seamAllowance: number) => void;
  setPaperSize: (size: PaperSize) => void;
  clear: () => void;
  togglePanel: () => void;

  loadFromServer: (projectId: string) => Promise<void>;
  saveToServer: (projectId: string) => Promise<void>;
  setProjectId: (id: string) => void;
}

export const usePrintlistStore = create<PrintlistStoreState>((set, get) => ({
  items: [],
  paperSize: 'letter',
  isPanelOpen: false,
  projectId: null,
  isSaving: false,
  isLoading: false,

  addItem: (item) => {
    const newItem: PrintlistItem = {
      ...item,
      seamAllowance: item.seamAllowance ?? DEFAULT_SEAM_ALLOWANCE_INCHES,
    };
    set((state) => {
      const existing = state.items.find((i) => i.shapeId === item.shapeId);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.shapeId === item.shapeId ? { ...i, quantity: i.quantity + item.quantity } : i
          ),
        };
      }
      return { items: [...state.items, newItem] };
    });
  },

  removeItem: (shapeId) =>
    set((state) => ({
      items: state.items.filter((i) => i.shapeId !== shapeId),
    })),

  updateQuantity: (shapeId, quantity) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.shapeId === shapeId ? { ...i, quantity: Math.max(1, quantity) } : i
      ),
    })),

  updateSeamAllowance: (shapeId, seamAllowance) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.shapeId === shapeId
          ? { ...i, seamAllowance: Math.max(0, Math.min(1, seamAllowance)) }
          : i
      ),
    })),

  setPaperSize: (size) => set({ paperSize: size }),

  clear: () => set({ items: [] }),

  togglePanel: () => set((state) => ({ isPanelOpen: !state.isPanelOpen })),

  setProjectId: (id) => set({ projectId: id }),

  loadFromServer: async (projectId: string) => {
    set({ isLoading: true });
    try {
      const res = await fetch(`/api/projects/${projectId}/printlist`);
      if (!res.ok) {
        if (res.status === 404) {
          // No printlist yet — that's fine
          set({ items: [], projectId, isLoading: false });
          return;
        }
        throw new Error('Failed to load printlist');
      }
      const data = await res.json();
      const printlist = data.data ?? data;
      set({
        items: Array.isArray(printlist.items) ? printlist.items : [],
        paperSize: printlist.paperSize ?? 'letter',
        projectId,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  saveToServer: async (projectId: string) => {
    const state = get();
    set({ isSaving: true });
    try {
      await fetch(`/api/projects/${projectId}/printlist`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: state.items,
          paperSize: state.paperSize,
        }),
      });
    } catch {
      // Silently fail — printlist save is not critical
    } finally {
      set({ isSaving: false });
    }
  },
}));
