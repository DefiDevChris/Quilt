'use client';

import { create } from 'zustand';
import type { UserProfile, CommunityPostListItem } from '@/types/community';

interface ProfileState {
  profile: UserProfile | null;
  posts: CommunityPostListItem[];
  isLoading: boolean;
  error: string | null;
  fetchProfile: (username: string) => Promise<void>;
  toggleFollow: (userId: string) => Promise<void>;
  reset: () => void;
}

const INITIAL_STATE = {
  profile: null as UserProfile | null,
  posts: [] as CommunityPostListItem[],
  isLoading: false,
  error: null as string | null,
};

export const useProfileStore = create<ProfileState>((set, get) => ({
  ...INITIAL_STATE,

  fetchProfile: async (username) => {
    set({ isLoading: true, error: null });

    try {
      const res = await fetch(`/api/members/${encodeURIComponent(username)}`);
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
    } catch {
      set({ error: 'Failed to load profile', isLoading: false });
    }
  },

  reset: () => set({ ...INITIAL_STATE }),

  toggleFollow: async (userId) => {
    const { profile } = get();
    if (!profile) return;

    const wasFollowing = profile.isFollowedByUser;
    const originalCount = profile.followerCount;

    set({
      profile: {
        ...profile,
        isFollowedByUser: !wasFollowing,
        followerCount: wasFollowing ? Math.max(0, originalCount - 1) : originalCount + 1,
      },
    });

    try {
      const res = await fetch('/api/follows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: userId }),
      });

      if (!res.ok) {
        const current = get().profile;
        if (current) {
          set({
            profile: {
              ...current,
              isFollowedByUser: wasFollowing,
              followerCount: originalCount,
            },
          });
        }
      }
    } catch {
      const current = get().profile;
      if (current) {
        set({
          profile: {
            ...current,
            isFollowedByUser: wasFollowing,
            followerCount: originalCount,
          },
        });
      }
    }
  },
}));
