'use client';

import { create } from 'zustand';
import type { FabricListItem } from '@/types/fabric';

interface FabricStoreState {
  fabrics: FabricListItem[];
  userFabrics: FabricListItem[];
  search: string;
  manufacturer: string;
  colorFamily: string;
  page: number;
  totalPages: number;
  total: number;
  isLoading: boolean;
  isLoadingUserFabrics: boolean;
  error: string | null;
  isPanelOpen: boolean;
  selectedFabricId: string | null;
  selectedFabricUrl: string | null;
  whereUsedFabricId: string | null;
  whereUsedFabricUrl: string | null;

  setSearch: (search: string) => void;
  setManufacturer: (manufacturer: string) => void;
  setColorFamily: (colorFamily: string) => void;
  setPage: (page: number) => void;
  setPanelOpen: (open: boolean) => void;
  togglePanel: () => void;
  fetchFabrics: () => Promise<void>;
  fetchUserFabrics: () => Promise<void>;
  deleteUserFabric: (fabricId: string) => Promise<boolean>;
  setSelectedFabric: (fabricId: string | null, fabricUrl: string | null) => void;
  setWhereUsedFabric: (fabricId: string | null, fabricUrl: string | null) => void;
  reset: () => void;
}

let fabricAbortController: AbortController | null = null;
let userFabricAbortController: AbortController | null = null;

const INITIAL_STATE = {
  fabrics: [] as FabricListItem[],
  userFabrics: [] as FabricListItem[],
  search: '',
  manufacturer: '',
  colorFamily: '',
  page: 1,
  totalPages: 1,
  total: 0,
  isLoading: false,
  isLoadingUserFabrics: false,
  error: null as string | null,
  isPanelOpen: false,
  selectedFabricId: null as string | null,
  selectedFabricUrl: null as string | null,
  whereUsedFabricId: null as string | null,
  whereUsedFabricUrl: null as string | null,
};

export const useFabricStore = create<FabricStoreState>((set, get) => ({
  ...INITIAL_STATE,

  setSearch: (search) => {
    set({ search, page: 1 });
    get().fetchFabrics();
  },

  setManufacturer: (manufacturer) => {
    set({ manufacturer, page: 1 });
    get().fetchFabrics();
  },

  setColorFamily: (colorFamily) => {
    set({ colorFamily, page: 1 });
    get().fetchFabrics();
  },

  setPage: (page) => {
    set({ page });
    get().fetchFabrics();
  },

  setPanelOpen: (isPanelOpen) => {
    set({ isPanelOpen });
    if (isPanelOpen && get().fabrics.length === 0) {
      get().fetchFabrics();
    }
  },

  togglePanel: () => {
    const nextState = !get().isPanelOpen;
    set({ isPanelOpen: nextState });
    if (nextState && get().fabrics.length === 0) {
      get().fetchFabrics();
    }
  },

  fetchFabrics: async () => {
    fabricAbortController?.abort();
    fabricAbortController = new AbortController();
    const { search, manufacturer, colorFamily, page } = get();
    set({ isLoading: true, error: null });

    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (manufacturer) params.set('manufacturer', manufacturer);
      if (colorFamily) params.set('colorFamily', colorFamily);
      params.set('page', String(page));
      params.set('limit', '50');
      params.set('scope', 'all');

      const res = await fetch(`/api/fabrics?${params.toString()}`, {
        signal: fabricAbortController.signal,
      });
      const json = await res.json();

      if (!res.ok) {
        set({ error: json.error ?? 'Failed to load fabrics', isLoading: false });
        return;
      }

      const data = json.data;
      set({
        fabrics: data.fabrics,
        total: data.pagination.total,
        totalPages: data.pagination.totalPages,
        page: data.pagination.page,
        isLoading: false,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      set({ error: 'Failed to load fabrics', isLoading: false });
    }
  },

  fetchUserFabrics: async () => {
    userFabricAbortController?.abort();
    userFabricAbortController = new AbortController();
    set({ isLoadingUserFabrics: true });
    try {
      const params = new URLSearchParams();
      params.set('scope', 'user');
      params.set('limit', '100');

      const res = await fetch(`/api/fabrics?${params.toString()}`, {
        signal: userFabricAbortController.signal,
      });
      const json = await res.json();

      if (!res.ok) {
        set({ error: json.error ?? 'Failed to load your fabrics', isLoadingUserFabrics: false });
        return;
      }

      set({ userFabrics: json.data.fabrics, isLoadingUserFabrics: false });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      set({ error: 'Failed to load your fabrics', isLoadingUserFabrics: false });
    }
  },

  deleteUserFabric: async (fabricId: string) => {
    try {
      const res = await fetch(`/api/fabrics/${fabricId}`, { method: 'DELETE' });
      if (res.ok || res.status === 204) {
        set((state) => ({
          userFabrics: state.userFabrics.filter((f) => f.id !== fabricId),
        }));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  setSelectedFabric: (selectedFabricId, selectedFabricUrl) => {
    set({ selectedFabricId, selectedFabricUrl });
  },

  setWhereUsedFabric: (fabricId, fabricUrl) => {
    set({ whereUsedFabricId: fabricId, whereUsedFabricUrl: fabricUrl });
  },

  reset: () => {
    fabricAbortController?.abort();
    fabricAbortController = null;
    userFabricAbortController?.abort();
    userFabricAbortController = null;
    set({ ...INITIAL_STATE });
  },
}));
