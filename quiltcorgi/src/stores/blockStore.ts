'use client';

import { create } from 'zustand';
import type { BlockListItem } from '@/types/block';

interface BlockStoreState {
  blocks: BlockListItem[];
  userBlocks: BlockListItem[];
  search: string;
  category: string;
  page: number;
  totalPages: number;
  total: number;
  isLoading: boolean;
  isLoadingUserBlocks: boolean;
  error: string | null;
  isPanelOpen: boolean;

  setSearch: (search: string) => void;
  setCategory: (category: string) => void;
  setPage: (page: number) => void;
  setPanelOpen: (open: boolean) => void;
  togglePanel: () => void;
  fetchBlocks: () => Promise<void>;
  fetchUserBlocks: () => Promise<void>;
  deleteUserBlock: (blockId: string) => Promise<boolean>;
}

let blockAbortController: AbortController | null = null;

export const useBlockStore = create<BlockStoreState>((set, get) => ({
  blocks: [],
  userBlocks: [],
  search: '',
  category: '',
  page: 1,
  totalPages: 1,
  total: 0,
  isLoading: false,
  isLoadingUserBlocks: false,
  error: null,
  isPanelOpen: false,

  setSearch: (search) => {
    set({ search, page: 1 });
    get().fetchBlocks();
  },

  setCategory: (category) => {
    set({ category, page: 1 });
    get().fetchBlocks();
  },

  setPage: (page) => {
    set({ page });
    get().fetchBlocks();
  },

  setPanelOpen: (isPanelOpen) => {
    set({ isPanelOpen });
    if (isPanelOpen && get().blocks.length === 0) {
      get().fetchBlocks();
    }
  },

  togglePanel: () => {
    const nextState = !get().isPanelOpen;
    set({ isPanelOpen: nextState });
    if (nextState && get().blocks.length === 0) {
      get().fetchBlocks();
    }
  },

  fetchBlocks: async () => {
    blockAbortController?.abort();
    blockAbortController = new AbortController();
    const { search, category, page } = get();
    set({ isLoading: true, error: null });

    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (category) params.set('category', category);
      params.set('page', String(page));
      params.set('limit', '50');
      params.set('scope', 'system');

      const res = await fetch(`/api/blocks?${params.toString()}`, {
        signal: blockAbortController.signal,
      });
      const json = await res.json();

      if (!res.ok) {
        set({ error: json.error ?? 'Failed to load blocks', isLoading: false });
        return;
      }

      const data = json.data;
      set({
        blocks: data.blocks,
        total: data.pagination.total,
        totalPages: data.pagination.totalPages,
        page: data.pagination.page,
        isLoading: false,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      set({ error: 'Failed to load blocks', isLoading: false });
    }
  },

  fetchUserBlocks: async () => {
    set({ isLoadingUserBlocks: true });
    try {
      const params = new URLSearchParams();
      params.set('scope', 'user');
      params.set('limit', '100');

      const res = await fetch(`/api/blocks?${params.toString()}`);
      const json = await res.json();

      if (!res.ok) {
        set({ isLoadingUserBlocks: false });
        return;
      }

      set({ userBlocks: json.data.blocks, isLoadingUserBlocks: false });
    } catch {
      set({ isLoadingUserBlocks: false });
    }
  },

  deleteUserBlock: async (blockId: string) => {
    try {
      const res = await fetch(`/api/blocks/${blockId}`, { method: 'DELETE' });
      if (res.ok || res.status === 204) {
        set((state) => ({
          userBlocks: state.userBlocks.filter((b) => b.id !== blockId),
        }));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },
}));
