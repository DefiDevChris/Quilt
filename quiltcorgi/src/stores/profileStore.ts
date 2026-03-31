'use client';

import { create } from 'zustand';
import type { UserProfile, CommunityPostListItem } from '@/types/community';

interface ProfileState {
  profile: UserProfile | null;
  posts: CommunityPostListItem[];
  isLoading: boolean;
  error: string | null;
  fetchProfile: (username: string) => Promise<void>;
  reset: () => void;
}

let profileAbortController: AbortController | null = null;

const INITIAL_STATE = {
  profile: null as UserProfile | null,
  posts: [] as CommunityPostListItem[],
  isLoading: false,
  error: null as string | null,
};

export const useProfileStore = create<ProfileState>((set) => ({
  ...INITIAL_STATE,

  fetchProfile: async (username) => {
    profileAbortController?.abort();
    profileAbortController = new AbortController();
    set({ isLoading: true, error: null });

    try {
      const res = await fetch(`/api/members/${encodeURIComponent(username)}`, {
        signal: profileAbortController.signal,
      });
      const json = await res.json();

      if (!res.ok) {
        set({
          error: json.error ?? 'Failed to load profile',
          isLoading: false,
        });
        return;
      }

      const { profile, posts } = json.data;

      set({
        profile,
        posts,
        isLoading: false,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      set({ error: 'Failed to load profile', isLoading: false });
    }
  },

  reset: () => {
    profileAbortController?.abort();
    profileAbortController = null;
    set({ ...INITIAL_STATE });
  },
}));
