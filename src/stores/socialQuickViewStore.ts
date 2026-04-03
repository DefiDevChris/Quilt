'use client';

import { create } from 'zustand';

export type QuickViewItem =
  | {
      type: 'post';
      id: string;
      title: string;
      imageUrl?: string | null;
      creatorName: string;
      creatorUsername?: string | null;
      creatorAvatarUrl?: string | null;
      likeCount: number;
      commentCount: number;
      isLikedByUser?: boolean;
      description?: string | null;
      category?: string;
    }
  | {
      type: 'blog';
      slug: string;
      title: string;
      imageUrl?: string | null;
      authorName: string;
      authorAvatarUrl?: string | null;
      excerpt?: string | null;
      category: string;
      readTimeMinutes: number;
      publishedAt?: Date | string | null;
    }
  | {
      type: 'fabric';
      id: string;
      name: string;
      imageUrl: string;
      manufacturer?: string;
      colorFamily?: string;
    }
  | {
      type: 'pattern';
      id: string;
      name: string;
      previewUrl?: string;
      skillLevel?: string;
      category?: string;
    };

interface SocialQuickViewState {
  item: QuickViewItem | null;
  isOpen: boolean;
  open: (item: QuickViewItem) => void;
  close: () => void;
  reset: () => void;
}

const INITIAL_STATE = {
  item: null as QuickViewItem | null,
  isOpen: false,
};

export const useSocialQuickView = create<SocialQuickViewState>((set) => ({
  ...INITIAL_STATE,
  open: (item) => set({ item, isOpen: true }),
  close: () => set({ item: null, isOpen: false }),
  reset: () => set({ ...INITIAL_STATE }),
}));
