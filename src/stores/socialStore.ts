'use client';

import { create } from 'zustand';

// --- Type definitions from community, comment, and socialQuickView ---
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

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string | null;
  content: string;
  createdAt: string;
  status?: 'active' | 'deleted';
}

export interface CommentWithReplies extends Comment {
  replies: Comment[];
  totalReplyCount: number;
}

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
      type: 'layout';
      id: string;
      name: string;
      previewUrl?: string;
      skillLevel?: string;
      category?: string;
    };

interface SocialStoreState {
  // --- Community State ---
  posts: CommunityPost[];
  feedSearch: string;
  feedSort: 'newest' | 'popular';
  feedTab: FeedTab;
  feedCategory: string | undefined;
  feedHasNextPage: boolean;
  feedNextCursor: string | null;
  isFeedLoading: boolean;
  feedError: string | null;

  // --- Comments State ---
  comments: CommentWithReplies[];
  isCommentsLoading: boolean;
  commentsError: string | null;
  commentsPage: number;
  commentsTotalPages: number;
  isSubmittingComment: boolean;

  // --- QuickView State ---
  quickViewItem: QuickViewItem | null;
  isQuickViewOpen: boolean;

  // --- Community Actions ---
  setFeedSearch: (search: string) => void;
  setFeedSort: (sort: 'newest' | 'popular') => void;
  setFeedTab: (tab: FeedTab) => void;
  setFeedCategory: (category: string | undefined) => void;
  fetchPosts: (append?: boolean) => Promise<void>;
  loadMorePosts: () => Promise<void>;
  likePost: (postId: string) => void;
  unlikePost: (postId: string) => void;

  // --- Comments Actions ---
  fetchComments: (postId: string, append?: boolean) => Promise<void>;
  addComment: (postId: string, content: string, replyToId?: string) => Promise<void>;
  deleteComment: (postId: string, commentId: string) => Promise<void>;

  // --- QuickView Actions ---
  openQuickView: (item: QuickViewItem) => void;
  closeQuickView: () => void;

  resetSocial: () => void;
}

const INITIAL_STATE = {
  // Community
  posts: [] as CommunityPost[],
  feedSearch: '',
  feedSort: 'newest' as const,
  feedTab: 'discover' as FeedTab,
  feedCategory: undefined as string | undefined,
  feedHasNextPage: false,
  feedNextCursor: null as string | null,
  isFeedLoading: false,
  feedError: null as string | null,

  // Comments
  comments: [] as CommentWithReplies[],
  isCommentsLoading: false,
  commentsError: null as string | null,
  commentsPage: 1,
  commentsTotalPages: 1,
  isSubmittingComment: false,

  // QuickView
  quickViewItem: null as QuickViewItem | null,
  isQuickViewOpen: false,
};

let communityAbortController: AbortController | null = null;
const inFlightActions = new Set<string>();

let commentMap: Record<string, Comment> = {};
let commentAbortController: AbortController | null = null;

function rebuildCommentMap(comments: CommentWithReplies[]): void {
  commentMap = {};
  for (const c of comments) {
    commentMap[c.id] = c;
    for (const r of c.replies) {
      commentMap[r.id] = r;
    }
  }
}

function revertPostLike(
  postId: string,
  original: CommunityPost
): (state: SocialStoreState) => Partial<SocialStoreState> {
  return (state) => ({
    posts: state.posts.map((p) =>
      p.id === postId
        ? { ...p, likeCount: original.likeCount, isLikedByUser: original.isLikedByUser }
        : p
    ),
  });
}

export const useSocialStore = create<SocialStoreState>((set, get) => ({
  ...INITIAL_STATE,

  // --- Community Actions ---
  setFeedSearch: (feedSearch) => {
    set({ feedSearch, feedHasNextPage: false, feedNextCursor: null });
    get().fetchPosts();
  },
  setFeedSort: (feedSort) => {
    set({ feedSort, feedHasNextPage: false, feedNextCursor: null });
    get().fetchPosts();
  },
  setFeedTab: (feedTab) => {
    set({ feedTab, feedHasNextPage: false, feedNextCursor: null });
    get().fetchPosts();
  },
  setFeedCategory: (feedCategory) => {
    set({ feedCategory, feedHasNextPage: false, feedNextCursor: null });
    get().fetchPosts();
  },
  fetchPosts: async (append = false) => {
    communityAbortController?.abort();
    communityAbortController = new AbortController();
    const { feedSearch, feedSort, feedTab, feedCategory, feedNextCursor } = get();

    const cursor = append ? feedNextCursor : null;

    set({ isFeedLoading: true, feedError: null });

    try {
      const params = new URLSearchParams();
      if (feedSearch) params.set('search', feedSearch);
      params.set('sort', feedSort);
      params.set('tab', feedTab);
      if (feedCategory) params.set('category', feedCategory);
      if (cursor) params.set('cursor', cursor);
      params.set('limit', '24');

      const res = await fetch(`/api/social?${params.toString()}`, {
        signal: communityAbortController.signal,
      });
      const json = await res.json();

      if (!res.ok) {
        set({ feedError: json.error ?? 'Failed to load community posts', isFeedLoading: false });
        return;
      }

      const data = json.data;
      const returnedNextCursor = data.pagination.nextCursor;

      set((state) => ({
        posts: append ? [...state.posts, ...data.posts] : data.posts,
        feedNextCursor: returnedNextCursor,
        feedHasNextPage: returnedNextCursor !== null,
        isFeedLoading: false,
      }));
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      set({ feedError: 'Failed to load community posts', isFeedLoading: false });
    }
  },
  loadMorePosts: async () => {
    const state = get();
    if (state.isFeedLoading || !state.feedNextCursor) return;
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

  // --- Comments Actions ---
  fetchComments: async (postId, append = false) => {
    commentAbortController?.abort();
    commentAbortController = new AbortController();
    const { commentsPage } = get();
    set({ isCommentsLoading: true, commentsError: null });

    try {
      const params = new URLSearchParams();
      params.set('page', String(append ? commentsPage : 1));
      params.set('limit', '20');

      const res = await fetch(`/api/social/${postId}/comments?${params.toString()}`, {
        signal: commentAbortController.signal,
      });
      const json = await res.json();

      if (!res.ok) {
        set({ commentsError: json.error ?? 'Failed to load comments', isCommentsLoading: false });
        return;
      }

      const data = json.data;
      set((state) => {
        const incoming: CommentWithReplies[] = data.comments;
        const merged = append ? [...state.comments, ...incoming] : incoming;
        rebuildCommentMap(merged);
        return {
          comments: merged,
          commentsTotalPages: data.pagination.totalPages,
          commentsPage: data.pagination.page,
          isCommentsLoading: false,
        };
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      set({ commentsError: 'Failed to load comments', isCommentsLoading: false });
    }
  },
  addComment: async (postId, content, replyToId) => {
    set({ isSubmittingComment: true, commentsError: null });

    try {
      const res = await fetch(`/api/social/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, replyToId }),
      });

      const json = await res.json();

      if (!res.ok) {
        set({ commentsError: json.error ?? 'Failed to post comment', isSubmittingComment: false });
        return;
      }

      const newComment = json.data;

      if (replyToId) {
        const parentExists = commentMap[replyToId] !== undefined;
        if (!parentExists) {
          set((state) => ({
            isSubmittingComment: false,
            commentsError: 'Your reply was saved, but the parent comment is not visible yet.',
            comments: [{ ...newComment, replies: [], totalReplyCount: 0 }, ...state.comments],
          }));
          return;
        }
        set((state) => ({
          isSubmittingComment: false,
          comments: state.comments.map((c) =>
            c.id === replyToId
              ? {
                  ...c,
                  replies: [...c.replies, newComment],
                  totalReplyCount: c.totalReplyCount + 1,
                }
              : c
          ),
        }));
      } else {
        set((state) => ({
          isSubmittingComment: false,
          comments: [{ ...newComment, replies: [], totalReplyCount: 0 }, ...state.comments],
        }));
      }
    } catch {
      set({ commentsError: 'Failed to post comment', isSubmittingComment: false });
    }
  },
  deleteComment: async (postId, commentId) => {
    try {
      const res = await fetch(`/api/social/${postId}/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const json = await res.json();
        set({ commentsError: json.error ?? 'Failed to delete comment' });
        return;
      }

      set({
        comments: get().comments.map((c) => {
          if (c.id === commentId) {
            return {
              ...c,
              status: 'deleted' as const,
              content: '[This comment has been deleted.]',
            };
          }
          return {
            ...c,
            replies: c.replies.map((r) =>
              r.id === commentId
                ? { ...r, status: 'deleted' as const, content: '[This comment has been deleted.]' }
                : r
            ),
          };
        }),
      });
    } catch {
      set({ commentsError: 'Failed to delete comment' });
    }
  },

  // --- QuickView Actions ---
  openQuickView: (quickViewItem) => set({ quickViewItem, isQuickViewOpen: true }),
  closeQuickView: () => set({ quickViewItem: null, isQuickViewOpen: false }),

  resetSocial: () => {
    communityAbortController?.abort();
    communityAbortController = null;
    inFlightActions.clear();

    commentAbortController?.abort();
    commentAbortController = null;
    commentMap = {};

    set({ ...INITIAL_STATE });
  },
}));
