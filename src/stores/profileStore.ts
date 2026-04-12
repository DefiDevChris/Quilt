import { create } from 'zustand';

interface MemberPost {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  likeCount: number;
  commentCount: number;
  category: string;
  createdAt: string;
  isLikedByUser: boolean;
}

interface MemberProfile {
  id: string;
  userId: string;
  displayName: string;
  username: string;
  bio: string | null;
  avatarUrl: string | null;
  location: string | null;
  websiteUrl: string | null;
  instagramHandle: string | null;
  youtubeHandle: string | null;
  tiktokHandle: string | null;
  publicEmail: string | null;
  isPro: boolean;
  privacyMode: 'public' | 'private';
  createdAt: string;
  followerCount: number;
  followingCount: number;
  isFollowedByCurrentUser: boolean;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ProfileState {
  profile: MemberProfile | null;
  posts: MemberPost[];
  pagination: PaginationInfo | null;
  isLoading: boolean;
  error: string | null;
  fetchProfile: (username: string, page?: number) => Promise<void>;
  loadMore: () => Promise<void>;
  reset: () => void;
}

let profileAbortController: AbortController | null = null;

const INITIAL_STATE = {
  profile: null as MemberProfile | null,
  posts: [] as MemberPost[],
  pagination: null as PaginationInfo | null,
  isLoading: false,
  error: null as string | null,
};

export const useProfileStore = create<ProfileState>((set, get) => ({
  ...INITIAL_STATE,

  fetchProfile: async (username, page = 1) => {
    profileAbortController?.abort();
    profileAbortController = new AbortController();
    set({ isLoading: true, error: null });

    try {
      const res = await fetch(
        `/api/members/${encodeURIComponent(username)}?page=${page}&limit=12`,
        {
          signal: profileAbortController.signal,
        }
      );
      const json = await res.json();

      if (!res.ok) {
        set({
          error: json.error ?? 'Failed to load profile',
          isLoading: false,
        });
        return;
      }

      const { profile, posts, pagination } = json.data;

      set({
        profile,
        posts,
        pagination,
        isLoading: false,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      set({ error: 'Failed to load profile', isLoading: false });
    }
  },

  loadMore: async () => {
    const state = get();
    if (!state.pagination || state.pagination.page >= state.pagination.totalPages) return;

    const nextPage = state.pagination.page + 1;
    const username = state.profile?.username;
    if (!username) return;

    profileAbortController?.abort();
    profileAbortController = new AbortController();
    set({ isLoading: true });

    try {
      const res = await fetch(
        `/api/members/${encodeURIComponent(username)}?page=${nextPage}&limit=12`,
        {
          signal: profileAbortController.signal,
        }
      );
      const json = await res.json();

      if (!res.ok) {
        set({
          error: json.error ?? 'Failed to load more posts',
          isLoading: false,
        });
        return;
      }

      const { posts, pagination } = json.data;

      set({
        posts: [...state.posts, ...posts],
        pagination,
        isLoading: false,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      set({ error: 'Failed to load more posts', isLoading: false });
    }
  },

  reset: () => {
    profileAbortController?.abort();
    profileAbortController = null;
    set({ ...INITIAL_STATE });
  },
}));
