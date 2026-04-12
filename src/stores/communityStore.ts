import { create } from 'zustand';
export type FeedTab = 'discover' | 'saved';

export interface CommunityPost {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string;
  likeCount: number;
  commentCount: number;
  category: string;
  creatorName: string;
  creatorUsername: string | null;
  creatorAvatarUrl: string | null;
  creatorId: string | null;
  isPro: boolean;
  projectId: string | null;
  projectName: string | null;
  projectThumbnailUrl: string | null;
  createdAt: string;
  isLikedByUser: boolean;
  isSavedByUser: boolean;
}

interface CommunityState {
  posts: CommunityPost[];
  search: string;
  sort: 'newest' | 'popular';
  tab: FeedTab;
  category: string | undefined;
  hasNextPage: boolean;
  nextCursor: string | null;
  isLoading: boolean;
  error: string | null;

  setSearch: (search: string) => void;
  setSort: (sort: 'newest' | 'popular') => void;
  setTab: (tab: FeedTab) => void;
  setCategory: (category: string | undefined) => void;
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
  tab: 'discover' as FeedTab,
  category: undefined as string | undefined,
  hasNextPage: false,
  nextCursor: null as string | null,
  isLoading: false,
  error: null as string | null,
};

let communityAbortController: AbortController | null = null;
const inFlightActions = new Set<string>();

// Helper to revert optimistic like update on failure
function revertPostLike(
  postId: string,
  original: CommunityPost
): (state: CommunityState) => CommunityState {
  return (state) => ({
    ...state,
    posts: state.posts.map((p) =>
      p.id === postId
        ? { ...p, likeCount: original.likeCount, isLikedByUser: original.isLikedByUser }
        : p
    ),
  });
}

export const useCommunityStore = create<CommunityState>((set, get) => ({
  ...INITIAL_STATE,

  setSearch: (search) => {
    set({ search, hasNextPage: false, nextCursor: null });
    get().fetchPosts();
  },

  setSort: (sort) => {
    set({ sort, hasNextPage: false, nextCursor: null });
    get().fetchPosts();
  },

  setTab: (tab) => {
    set({ tab, hasNextPage: false, nextCursor: null });
    get().fetchPosts();
  },

  setCategory: (category) => {
    set({ category, hasNextPage: false, nextCursor: null });
    get().fetchPosts();
  },

  fetchPosts: async (append = false) => {
    communityAbortController?.abort();
    communityAbortController = new AbortController();
    const { search, sort, tab, category, nextCursor } = get();

    // Only use cursor if appending
    const cursor = append ? nextCursor : null;

    set({ isLoading: true, error: null });

    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      params.set('sort', sort);
      params.set('tab', tab);
      if (category) params.set('category', category);
      if (cursor) params.set('cursor', cursor);
      params.set('limit', '24');

      const res = await fetch(`/api/social?${params.toString()}`, {
        signal: communityAbortController.signal,
      });
      const json = await res.json();

      if (!res.ok) {
        set({ error: json.error ?? 'Failed to load community posts', isLoading: false });
        return;
      }

      const data = json.data;
      const returnedNextCursor = data.pagination.nextCursor;

      set((state) => ({
        posts: append ? [...state.posts, ...data.posts] : data.posts,
        nextCursor: returnedNextCursor,
        hasNextPage: returnedNextCursor !== null,
        isLoading: false,
      }));
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      set({ error: 'Failed to load community posts', isLoading: false });
    }
  },

  loadMore: async () => {
    const state = get();
    if (state.isLoading || !state.nextCursor) return;
    await get().fetchPosts(true);
  },

  likePost: (postId) => {
    if (inFlightActions.has(`like:${postId}`)) return;
    const { posts } = get();
    const original = posts.find((p) => p.id === postId);
    if (!original) return;
    inFlightActions.add(`like:${postId}`);

    set({
      posts: posts.map((p) =>
        p.id === postId ? { ...p, likeCount: p.likeCount + 1, isLikedByUser: true } : p
      ),
    });

    fetch(`/api/social/${postId}/like`, { method: 'POST' })
      .then((res) => {
        inFlightActions.delete(`like:${postId}`);
        if (!res.ok) {
          set(revertPostLike(postId, original));
        }
      })
      .catch(() => {
        inFlightActions.delete(`like:${postId}`);
        set(revertPostLike(postId, original));
      });
  },

  unlikePost: (postId) => {
    if (inFlightActions.has(`like:${postId}`)) return;
    const { posts } = get();
    const original = posts.find((p) => p.id === postId);
    if (!original) return;
    inFlightActions.add(`like:${postId}`);

    set({
      posts: posts.map((p) =>
        p.id === postId
          ? { ...p, likeCount: Math.max(0, p.likeCount - 1), isLikedByUser: false }
          : p
      ),
    });

    fetch(`/api/social/${postId}/like`, { method: 'DELETE' })
      .then((res) => {
        inFlightActions.delete(`like:${postId}`);
        if (!res.ok) {
          set(revertPostLike(postId, original));
        }
      })
      .catch(() => {
        inFlightActions.delete(`like:${postId}`);
        set(revertPostLike(postId, original));
      });
  },

  reset: () => {
    communityAbortController?.abort();
    communityAbortController = null;
    inFlightActions.clear();
    set({ ...INITIAL_STATE });
  },
}));
