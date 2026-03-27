'use client';

import { create } from 'zustand';
import type { CommunityCategory } from '@/types/community';

export type FeedTab = 'discover' | 'following' | 'featured';

export interface CommunityPost {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string;
  likeCount: number;
  commentCount: number;
  category: CommunityCategory;
  creatorName: string;
  creatorUsername: string | null;
  creatorAvatarUrl: string | null;
  createdAt: string;
  isLikedByUser: boolean;
  isSavedByUser: boolean;
}

interface CommunityState {
  posts: CommunityPost[];
  search: string;
  sort: 'newest' | 'popular';
  tab: FeedTab;
  category: CommunityCategory | undefined;
  page: number;
  totalPages: number;
  total: number;
  isLoading: boolean;
  error: string | null;

  setSearch: (search: string) => void;
  setSort: (sort: 'newest' | 'popular') => void;
  setTab: (tab: FeedTab) => void;
  setCategory: (category: CommunityCategory | undefined) => void;
  fetchPosts: (append?: boolean) => Promise<void>;
  loadMore: () => Promise<void>;
  likePost: (postId: string) => void;
  unlikePost: (postId: string) => void;
  savePost: (postId: string) => void;
  unsavePost: (postId: string) => void;
  reset: () => void;
}

const INITIAL_STATE = {
  posts: [] as CommunityPost[],
  search: '',
  sort: 'newest' as const,
  tab: 'discover' as FeedTab,
  category: undefined as CommunityCategory | undefined,
  page: 1,
  totalPages: 1,
  total: 0,
  isLoading: false,
  error: null as string | null,
};

export const useCommunityStore = create<CommunityState>((set, get) => ({
  ...INITIAL_STATE,

  setSearch: (search) => {
    set({ search, page: 1 });
    get().fetchPosts();
  },

  setSort: (sort) => {
    set({ sort, page: 1 });
    get().fetchPosts();
  },

  setTab: (tab) => {
    set({ tab, page: 1 });
    get().fetchPosts();
  },

  setCategory: (category) => {
    set({ category, page: 1 });
    get().fetchPosts();
  },

  fetchPosts: async (append = false) => {
    const { search, sort, tab, category, page } = get();
    set({ isLoading: true, error: null });

    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      params.set('sort', sort);
      params.set('tab', tab);
      if (category) params.set('category', category);
      params.set('page', String(page));
      params.set('limit', '24');

      const res = await fetch(`/api/community?${params.toString()}`);
      const json = await res.json();

      if (!res.ok) {
        set({ error: json.error ?? 'Failed to load community posts', isLoading: false });
        return;
      }

      const data = json.data;
      set((state) => ({
        posts: append ? [...state.posts, ...data.posts] : data.posts,
        total: data.pagination.total,
        totalPages: data.pagination.totalPages,
        page: data.pagination.page,
        isLoading: false,
      }));
    } catch {
      set({ error: 'Failed to load community posts', isLoading: false });
    }
  },

  loadMore: async () => {
    const { page } = get();
    set({ page: page + 1 });
    return get().fetchPosts(true);
  },

  likePost: (postId) => {
    const { posts } = get();
    const original = posts.find((p) => p.id === postId);
    if (!original) return;

    set({
      posts: posts.map((p) =>
        p.id === postId ? { ...p, likeCount: p.likeCount + 1, isLikedByUser: true } : p
      ),
    });

    fetch(`/api/community/${postId}/like`, { method: 'POST' })
      .then((res) => {
        if (!res.ok) {
          set({
            posts: get().posts.map((p) =>
              p.id === postId
                ? { ...p, likeCount: original.likeCount, isLikedByUser: original.isLikedByUser }
                : p
            ),
          });
        }
      })
      .catch(() => {
        set({
          posts: get().posts.map((p) =>
            p.id === postId
              ? { ...p, likeCount: original.likeCount, isLikedByUser: original.isLikedByUser }
              : p
          ),
        });
      });
  },

  unlikePost: (postId) => {
    const { posts } = get();
    const original = posts.find((p) => p.id === postId);
    if (!original) return;

    set({
      posts: posts.map((p) =>
        p.id === postId
          ? { ...p, likeCount: Math.max(0, p.likeCount - 1), isLikedByUser: false }
          : p
      ),
    });

    fetch(`/api/community/${postId}/like`, { method: 'DELETE' })
      .then((res) => {
        if (!res.ok) {
          set({
            posts: get().posts.map((p) =>
              p.id === postId
                ? { ...p, likeCount: original.likeCount, isLikedByUser: original.isLikedByUser }
                : p
            ),
          });
        }
      })
      .catch(() => {
        set({
          posts: get().posts.map((p) =>
            p.id === postId
              ? { ...p, likeCount: original.likeCount, isLikedByUser: original.isLikedByUser }
              : p
          ),
        });
      });
  },

  savePost: (postId) => {
    const { posts } = get();
    const original = posts.find((p) => p.id === postId);
    if (!original) return;

    set({
      posts: posts.map((p) => (p.id === postId ? { ...p, isSavedByUser: true } : p)),
    });

    fetch(`/api/community/${postId}/save`, { method: 'POST' })
      .then((res) => {
        if (!res.ok) {
          set({
            posts: get().posts.map((p) =>
              p.id === postId ? { ...p, isSavedByUser: original.isSavedByUser } : p
            ),
          });
        }
      })
      .catch(() => {
        set({
          posts: get().posts.map((p) =>
            p.id === postId ? { ...p, isSavedByUser: original.isSavedByUser } : p
          ),
        });
      });
  },

  unsavePost: (postId) => {
    const { posts } = get();
    const original = posts.find((p) => p.id === postId);
    if (!original) return;

    set({
      posts: posts.map((p) => (p.id === postId ? { ...p, isSavedByUser: false } : p)),
    });

    fetch(`/api/community/${postId}/save`, { method: 'DELETE' })
      .then((res) => {
        if (!res.ok) {
          set({
            posts: get().posts.map((p) =>
              p.id === postId ? { ...p, isSavedByUser: original.isSavedByUser } : p
            ),
          });
        }
      })
      .catch(() => {
        set({
          posts: get().posts.map((p) =>
            p.id === postId ? { ...p, isSavedByUser: original.isSavedByUser } : p
          ),
        });
      });
  },

  reset: () => set({ ...INITIAL_STATE }),
}));
