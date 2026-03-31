'use client';

import { create } from 'zustand';
import type { PatternTemplateListItem, PatternTemplateDetail } from '@/types/pattern-template';
import { PATTERN_PAGINATION_DEFAULT_LIMIT } from '@/lib/constants';

interface PatternFilters {
  skillLevel: string | null;
  search: string;
  sort: 'popular' | 'name' | 'newest';
}

interface PatternPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface PatternState {
  patterns: PatternTemplateListItem[];
  selectedPattern: PatternTemplateDetail | null;
  isLoading: boolean;
  isImporting: boolean;
  error: string | null;
  filters: PatternFilters;
  pagination: PatternPagination;
  upgradeRequired: boolean;

  fetchPatterns: () => Promise<void>;
  fetchPatternDetail: (id: string) => Promise<void>;
  importPattern: (
    id: string
  ) => Promise<{ projectId: string; blockCount: number; fabricCount: number } | null>;
  setFilter: (key: keyof PatternFilters, value: PatternFilters[keyof PatternFilters]) => void;
  setPage: (page: number) => void;
  clearSelectedPattern: () => void;
  clearError: () => void;
  reset: () => void;
}

const INITIAL_STATE = {
  patterns: [] as PatternTemplateListItem[],
  selectedPattern: null as PatternTemplateDetail | null,
  isLoading: false,
  isImporting: false,
  error: null as string | null,
  filters: {
    skillLevel: null,
    search: '',
    sort: 'popular' as const,
  },
  pagination: {
    page: 1,
    limit: PATTERN_PAGINATION_DEFAULT_LIMIT,
    total: 0,
    totalPages: 0,
  },
  upgradeRequired: false,
};

let patternAbortController: AbortController | null = null;

export const usePatternStore = create<PatternState>((set, get) => ({
  ...INITIAL_STATE,

  fetchPatterns: async () => {
    patternAbortController?.abort();
    patternAbortController = new AbortController();
    const { filters, pagination } = get();
    set({ isLoading: true, error: null });

    try {
      const params = new URLSearchParams();
      params.set('page', String(pagination.page));
      params.set('limit', String(pagination.limit));
      params.set('sort', filters.sort);

      if (filters.skillLevel) {
        params.set('skillLevel', filters.skillLevel);
      }

      if (filters.search) {
        params.set('search', filters.search);
      }

      const res = await fetch(`/api/patterns?${params.toString()}`, {
        signal: patternAbortController.signal,
      });
      const json = await res.json();

      if (!res.ok) {
        set({
          error: json.error ?? 'Failed to load patterns',
          isLoading: false,
        });
        return;
      }

      set({
        patterns: json.data.patterns,
        pagination: {
          page: json.data.pagination.page,
          limit: json.data.pagination.limit,
          total: json.data.pagination.total,
          totalPages: json.data.pagination.totalPages,
        },
        upgradeRequired: json.data.upgradeRequired ?? false,
        isLoading: false,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      set({ error: 'Failed to load patterns', isLoading: false });
    }
  },

  fetchPatternDetail: async (id) => {
    set({ isLoading: true, error: null });

    try {
      const res = await fetch(`/api/patterns/${id}`);
      const json = await res.json();

      if (!res.ok) {
        set({
          error: json.error ?? 'Failed to load pattern details',
          isLoading: false,
        });
        return;
      }

      set({ selectedPattern: json.data, isLoading: false });
    } catch {
      set({ error: 'Failed to load pattern details', isLoading: false });
    }
  },

  importPattern: async (id) => {
    set({ isImporting: true, error: null });

    try {
      const res = await fetch(`/api/patterns/${id}/import`, {
        method: 'POST',
      });
      const json = await res.json();

      if (!res.ok) {
        set({
          error: json.error ?? 'Failed to import pattern',
          isImporting: false,
        });
        return null;
      }

      set({ isImporting: false });
      return json.data;
    } catch {
      set({ error: 'Failed to import pattern', isImporting: false });
      return null;
    }
  },

  setFilter: (key, value) => {
    set((state) => ({
      filters: { ...state.filters, [key]: value },
      pagination: { ...state.pagination, page: 1 },
    }));
    get().fetchPatterns();
  },

  setPage: (page) => {
    set((state) => ({
      pagination: { ...state.pagination, page },
    }));
    get().fetchPatterns();
  },

  clearSelectedPattern: () => set({ selectedPattern: null }),

  clearError: () => set({ error: null }),

  reset: () => {
    patternAbortController?.abort();
    patternAbortController = null;
    set({ ...INITIAL_STATE });
  },
}));
