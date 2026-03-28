'use client';

import { create } from 'zustand';
import type { PrintlistItem } from '@/types/printlist';
import { DEFAULT_SEAM_ALLOWANCE_INCHES } from '@/lib/constants';
import type { PaperSize } from '@/lib/pdf-generator';

const QUANTITY_MIN = 1;
const QUANTITY_MAX = 9999;

interface PrintlistStoreState {
  items: PrintlistItem[];
  paperSize: PaperSize;
  isPanelOpen: boolean;
  projectId: string | null;
  isSaving: boolean;
  isLoading: boolean;
  lastSaveError: string | null;

  addItem: (
    item: Omit<PrintlistItem, 'seamAllowance' | 'seamAllowanceEnabled'> & {
      seamAllowance?: number;
      seamAllowanceEnabled?: boolean;
    }
  ) => void;
  removeItem: (shapeId: string) => void;
  updateQuantity: (shapeId: string, quantity: number) => void;
  updateSeamAllowance: (shapeId: string, seamAllowance: number) => void;
  toggleSeamAllowance: (shapeId: string) => void;
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
  lastSaveError: null,

  addItem: (item) => {
    const clampedQuantity = Math.min(Math.max(item.quantity, QUANTITY_MIN), QUANTITY_MAX);
    const newItem: PrintlistItem = {
      ...item,
      quantity: clampedQuantity,
      seamAllowance: item.seamAllowance ?? DEFAULT_SEAM_ALLOWANCE_INCHES,
      seamAllowanceEnabled: item.seamAllowanceEnabled ?? true,
    };
    set((state) => {
      const existing = state.items.find((i) => i.shapeId === item.shapeId);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.shapeId === item.shapeId
              ? { ...i, quantity: Math.min(i.quantity + clampedQuantity, QUANTITY_MAX) }
              : i
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
        i.shapeId === shapeId
          ? { ...i, quantity: Math.min(Math.max(quantity, QUANTITY_MIN), QUANTITY_MAX) }
          : i
      ),
    })),

  updateSeamAllowance: (shapeId, seamAllowance) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.shapeId === shapeId ? { ...i, seamAllowance: Math.max(0, Math.min(1, seamAllowance)) } : i
      ),
    })),

  toggleSeamAllowance: (shapeId) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.shapeId === shapeId ? { ...i, seamAllowanceEnabled: !i.seamAllowanceEnabled } : i
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
    set({ isSaving: true, lastSaveError: null });
    try {
      const res = await fetch(`/api/projects/${projectId}/printlist`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: state.items,
          paperSize: state.paperSize,
        }),
      });
      if (!res.ok) {
        set({ lastSaveError: 'Failed to save print list. Your changes are not synced.' });
      }
    } catch {
      set({ lastSaveError: 'Failed to save print list. Check your connection.' });
    } finally {
      set({ isSaving: false });
    }
  },
}));
