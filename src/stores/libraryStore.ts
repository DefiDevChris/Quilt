'use client';

import { create } from 'zustand';
import type { BlockListItem } from '@/types/block';
import type { FabricListItem } from '@/types/fabric';

interface LibraryStoreState {
  // Blocks
  blocks: BlockListItem[];
  userBlocks: BlockListItem[];
  blockSearch: string;
  blockCategory: string;
  blockPage: number;
  blockTotalPages: number;
  blockTotal: number;
  isBlockLoading: boolean;
  isUserBlocksLoading: boolean;
  blockError: string | null;
  isBlockPanelOpen: boolean;
  selectedBlockId: string | null;

  // Fabrics
  fabrics: FabricListItem[];
  userFabrics: FabricListItem[];
  fabricSearch: string;
  fabricManufacturer: string;
  fabricColorFamily: string;
  fabricValue: string;
  fabricSortBy: string;
  fabricPage: number;
  fabricTotalPages: number;
  fabricTotal: number;
  isFabricLoading: boolean;
  isUserFabricsLoading: boolean;
  fabricError: string | null;
  isFabricPanelOpen: boolean;
  selectedFabricId: string | null;
  selectedFabricUrl: string | null;
  whereUsedFabricId: string | null;
  whereUsedFabricUrl: string | null;

  // Block Actions
  setBlockSearch: (search: string) => void;
  setBlockCategory: (category: string) => void;
  setBlockPage: (page: number) => void;
  setBlockPanelOpen: (open: boolean) => void;
  toggleBlockPanel: () => void;
  fetchBlocks: () => Promise<void>;
  fetchUserBlocks: () => Promise<void>;
  deleteUserBlock: (blockId: string) => Promise<boolean>;
  setSelectedBlockId: (blockId: string | null) => void;

  // Fabric Actions
  setFabricSearch: (search: string) => void;
  setFabricManufacturer: (manufacturer: string) => void;
  setFabricColorFamily: (colorFamily: string) => void;
  setFabricValue: (value: string) => void;
  setFabricSortBy: (sortBy: string) => void;
  setFabricPage: (page: number) => void;
  setFabricPanelOpen: (open: boolean) => void;
  toggleFabricPanel: () => void;
  fetchFabrics: () => Promise<void>;
  fetchUserFabrics: () => Promise<void>;
  deleteUserFabric: (fabricId: string) => Promise<boolean>;
  setSelectedFabric: (fabricId: string | null, fabricUrl: string | null) => void;
  setWhereUsedFabric: (fabricId: string | null, fabricUrl: string | null) => void;
  
  resetLibrary: () => void;
}

let blockAbortController: AbortController | null = null;
let userBlockAbortController: AbortController | null = null;
let fabricAbortController: AbortController | null = null;
let userFabricAbortController: AbortController | null = null;

const INITIAL_STATE = {
  blocks: [] as BlockListItem[],
  userBlocks: [] as BlockListItem[],
  blockSearch: '',
  blockCategory: '',
  blockPage: 1,
  blockTotalPages: 1,
  blockTotal: 0,
  isBlockLoading: false,
  isUserBlocksLoading: false,
  blockError: null as string | null,
  isBlockPanelOpen: false,
  selectedBlockId: null as string | null,

  fabrics: [] as FabricListItem[],
  userFabrics: [] as FabricListItem[],
  fabricSearch: '',
  fabricManufacturer: '',
  fabricColorFamily: '',
  fabricValue: '',
  fabricSortBy: 'name',
  fabricPage: 1,
  fabricTotalPages: 1,
  fabricTotal: 0,
  isFabricLoading: false,
  isUserFabricsLoading: false,
  fabricError: null as string | null,
  isFabricPanelOpen: false,
  selectedFabricId: null as string | null,
  selectedFabricUrl: null as string | null,
  whereUsedFabricId: null as string | null,
  whereUsedFabricUrl: null as string | null,
};

export const useLibraryStore = create<LibraryStoreState>((set, get) => ({
  ...INITIAL_STATE,

  // --- BLOCK ACTIONS ---
  setBlockSearch: (blockSearch) => {
    set({ blockSearch, blockPage: 1 });
    get().fetchBlocks();
  },
  setBlockCategory: (blockCategory) => {
    set({ blockCategory, blockPage: 1 });
    get().fetchBlocks();
  },
  setBlockPage: (blockPage) => {
    set({ blockPage });
    get().fetchBlocks();
  },
  setBlockPanelOpen: (isBlockPanelOpen) => {
    set({ isBlockPanelOpen });
    if (isBlockPanelOpen && get().blocks.length === 0) {
      get().fetchBlocks();
    }
  },
  toggleBlockPanel: () => {
    const nextState = !get().isBlockPanelOpen;
    set({ isBlockPanelOpen: nextState });
    if (nextState && get().blocks.length === 0) {
      get().fetchBlocks();
    }
  },
  fetchBlocks: async () => {
    blockAbortController?.abort();
    blockAbortController = new AbortController();
    const { blockSearch, blockCategory, blockPage } = get();
    set({ isBlockLoading: true, blockError: null });

    try {
      const params = new URLSearchParams();
      if (blockSearch) params.set('search', blockSearch);
      if (blockCategory) params.set('category', blockCategory);
      params.set('page', String(blockPage));
      params.set('limit', '50');
      params.set('scope', 'system');

      const res = await fetch(`/api/blocks?${params.toString()}`, {
        signal: blockAbortController.signal,
      });
      const json = await res.json();

      if (!res.ok) {
        set({ blockError: json.error ?? 'Failed to load blocks', isBlockLoading: false });
        return;
      }

      const data = json.data;
      set({
        blocks: data.blocks,
        blockTotal: data.pagination.total,
        blockTotalPages: data.pagination.totalPages,
        blockPage: data.pagination.page,
        isBlockLoading: false,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      set({ blockError: 'Failed to load blocks', isBlockLoading: false });
    }
  },
  fetchUserBlocks: async () => {
    userBlockAbortController?.abort();
    userBlockAbortController = new AbortController();
    set({ isUserBlocksLoading: true });
    try {
      const params = new URLSearchParams();
      params.set('scope', 'user');
      params.set('limit', '100');

      const res = await fetch(`/api/blocks?${params.toString()}`, {
        signal: userBlockAbortController.signal,
      });
      const json = await res.json();

      if (!res.ok) {
        set({ blockError: json.error ?? 'Failed to load your blocks', isUserBlocksLoading: false });
        return;
      }

      set({ userBlocks: json.data.blocks, isUserBlocksLoading: false });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      set({ blockError: 'Failed to load your blocks', isUserBlocksLoading: false });
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
  setSelectedBlockId: (selectedBlockId) => {
    set({ selectedBlockId });
  },

  // --- FABRIC ACTIONS ---
  setFabricSearch: (fabricSearch) => {
    set({ fabricSearch, fabricPage: 1 });
    get().fetchFabrics();
  },
  setFabricManufacturer: (fabricManufacturer) => {
    set({ fabricManufacturer, fabricPage: 1 });
    get().fetchFabrics();
  },
  setFabricColorFamily: (fabricColorFamily) => {
    set({ fabricColorFamily, fabricPage: 1 });
    get().fetchFabrics();
  },
  setFabricValue: (fabricValue) => {
    set({ fabricValue, fabricPage: 1 });
    get().fetchFabrics();
  },
  setFabricSortBy: (fabricSortBy) => {
    set({ fabricSortBy, fabricPage: 1 });
    get().fetchFabrics();
  },
  setFabricPage: (fabricPage) => {
    set({ fabricPage });
    get().fetchFabrics();
  },
  setFabricPanelOpen: (isFabricPanelOpen) => {
    set({ isFabricPanelOpen });
    if (isFabricPanelOpen && get().fabrics.length === 0) {
      get().fetchFabrics();
    }
  },
  toggleFabricPanel: () => {
    const nextState = !get().isFabricPanelOpen;
    set({ isFabricPanelOpen: nextState });
    if (nextState && get().fabrics.length === 0) {
      get().fetchFabrics();
    }
  },
  fetchFabrics: async () => {
    fabricAbortController?.abort();
    fabricAbortController = new AbortController();
    const { fabricSearch, fabricManufacturer, fabricColorFamily, fabricValue, fabricSortBy, fabricPage } = get();
    set({ isFabricLoading: true, fabricError: null });

    try {
      const params = new URLSearchParams();
      if (fabricSearch) params.set('search', fabricSearch);
      if (fabricManufacturer) params.set('manufacturer', fabricManufacturer);
      if (fabricColorFamily) params.set('colorFamily', fabricColorFamily);
      if (fabricValue) params.set('value', fabricValue);
      if (fabricSortBy && fabricSortBy !== 'name') params.set('sortBy', fabricSortBy);
      params.set('page', String(fabricPage));
      params.set('limit', '50');
      params.set('scope', 'all');

      const res = await fetch(`/api/fabrics?${params.toString()}`, {
        signal: fabricAbortController.signal,
      });
      const json = await res.json();

      if (!res.ok) {
        set({ fabricError: json.error ?? 'Failed to load fabrics', isFabricLoading: false });
        return;
      }

      const data = json.data;
      set({
        fabrics: data.fabrics,
        fabricTotal: data.pagination.total,
        fabricTotalPages: data.pagination.totalPages,
        fabricPage: data.pagination.page,
        isFabricLoading: false,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      set({ fabricError: 'Failed to load fabrics', isFabricLoading: false });
    }
  },
  fetchUserFabrics: async () => {
    userFabricAbortController?.abort();
    userFabricAbortController = new AbortController();
    set({ isUserFabricsLoading: true });
    try {
      const params = new URLSearchParams();
      params.set('scope', 'user');
      params.set('limit', '100');

      const res = await fetch(`/api/fabrics?${params.toString()}`, {
        signal: userFabricAbortController.signal,
      });
      const json = await res.json();

      if (!res.ok) {
        set({ fabricError: json.error ?? 'Failed to load your fabrics', isUserFabricsLoading: false });
        return;
      }

      set({ userFabrics: json.data.fabrics, isUserFabricsLoading: false });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      set({ fabricError: 'Failed to load your fabrics', isUserFabricsLoading: false });
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
  setWhereUsedFabric: (whereUsedFabricId, whereUsedFabricUrl) => {
    set({ whereUsedFabricId, whereUsedFabricUrl });
  },

  resetLibrary: () => {
    blockAbortController?.abort();
    blockAbortController = null;
    userBlockAbortController?.abort();
    userBlockAbortController = null;
    fabricAbortController?.abort();
    fabricAbortController = null;
    userFabricAbortController?.abort();
    userFabricAbortController = null;
    set({ ...INITIAL_STATE });
  },
}));
