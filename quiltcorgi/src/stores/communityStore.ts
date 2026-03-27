'use client';

import { create } from 'zustand';

export interface CommunityPost {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string;
  likeCount: number;
  creatorName: string;
  createdAt: string;
  isLikedByUser: boolean;
}

interface CommunityState {
  posts: CommunityPost[];
  search: string;
  sort: 'newest' | 'popular';
  page: number;
  totalPages: number;
  total: number;
  isLoading: boolean;
  error: string | null;

  setSearch: (search: string) => void;
  setSort: (sort: 'newest' | 'popular') => void;
  fetchPosts: (append?: boolean) => Promise<void>;
  loadMore: () => Promise<void>;
  likePost: (postId: string) => void;
  unlikePost: (postId: string) => void;
  reset: () => void;
}

const INITIAL_STATE = {
  posts: [] as CommunityPost[],
  search: '',
  sort: 'newest' as const,
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

  fetchPosts: async (append = false) => {
    const { search, sort, page } = get();
    set({ isLoading: true, error: null });

    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      params.set('sort', sort);
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
        p.id === postId
          ? { ...p, likeCount: p.likeCount + 1, isLikedByUser: true }
          : p
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

  reset: () => set({ ...INITIAL_STATE }),
}));
