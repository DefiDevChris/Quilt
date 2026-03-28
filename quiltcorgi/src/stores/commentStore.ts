'use client';

import { create } from 'zustand';
import type { Comment } from '@/types/community';

interface CommentWithReplies extends Comment {
  replies: Comment[];
  totalReplyCount: number;
}

interface CommentState {
  comments: CommentWithReplies[];
  commentMap: Record<string, Comment>;
  isLoading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  isSubmitting: boolean;

  fetchComments: (postId: string, append?: boolean) => Promise<void>;
  addComment: (postId: string, content: string, replyToId?: string) => Promise<void>;
  likeComment: (postId: string, commentId: string) => Promise<void>;
  deleteComment: (postId: string, commentId: string) => Promise<void>;
  reportComment: (
    postId: string,
    commentId: string,
    reason: string,
    details?: string
  ) => Promise<void>;
  reset: () => void;
}

const INITIAL_STATE = {
  comments: [] as CommentWithReplies[],
  commentMap: {} as Record<string, Comment>,
  isLoading: false,
  error: null as string | null,
  page: 1,
  totalPages: 1,
  isSubmitting: false,
};

function updateCommentLike(comment: Comment, commentId: string): Comment {
  if (comment.id !== commentId) return comment;
  return {
    ...comment,
    isLikedByUser: !comment.isLikedByUser,
    likeCount: comment.isLikedByUser ? Math.max(0, comment.likeCount - 1) : comment.likeCount + 1,
  };
}

export const useCommentStore = create<CommentState>((set, get) => ({
  ...INITIAL_STATE,

  fetchComments: async (postId, append = false) => {
    const { page } = get();
    set({ isLoading: true, error: null });

    try {
      const params = new URLSearchParams();
      params.set('page', String(append ? page : 1));
      params.set('limit', '20');

      const res = await fetch(`/api/community/${postId}/comments?${params.toString()}`);
      const json = await res.json();

      if (!res.ok) {
        set({ error: json.error ?? 'Failed to load comments', isLoading: false });
        return;
      }

      const data = json.data;
      set((state) => {
        const incoming: CommentWithReplies[] = data.comments;
        const merged = append ? [...state.comments, ...incoming] : incoming;
        const commentMap: Record<string, Comment> = {};
        for (const c of merged) {
          commentMap[c.id] = c;
          for (const r of c.replies) {
            commentMap[r.id] = r;
          }
        }
        return {
          comments: merged,
          commentMap,
          totalPages: data.pagination.totalPages,
          page: data.pagination.page,
          isLoading: false,
        };
      });
    } catch {
      set({ error: 'Failed to load comments', isLoading: false });
    }
  },

  addComment: async (postId, content, replyToId) => {
    set({ isSubmitting: true, error: null });

    try {
      const res = await fetch(`/api/community/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, replyToId }),
      });

      const json = await res.json();

      if (!res.ok) {
        set({ error: json.error ?? 'Failed to post comment', isSubmitting: false });
        return;
      }

      const newComment = json.data;

      if (replyToId) {
        const parentExists = get().commentMap[replyToId] !== undefined;
        if (!parentExists) {
          console.warn(
            `[commentStore] Reply saved server-side but parent comment "${replyToId}" not found in local state. Displaying reply as top-level comment.`
          );
          set((state) => ({
            isSubmitting: false,
            error: 'Your reply was saved, but the parent comment is not visible yet.',
            comments: [{ ...newComment, replies: [], totalReplyCount: 0 }, ...state.comments],
          }));
          return;
        }
        // Insert reply under the parent comment
        set((state) => ({
          isSubmitting: false,
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
        // Insert top-level comment at the beginning
        set((state) => ({
          isSubmitting: false,
          comments: [{ ...newComment, replies: [], totalReplyCount: 0 }, ...state.comments],
        }));
      }
    } catch {
      set({ error: 'Failed to post comment', isSubmitting: false });
    }
  },

  likeComment: async (postId, commentId) => {
    const existing = get().commentMap[commentId];
    if (!existing) return;

    // Optimistic update (toggle)
    set({
      comments: get().comments.map((c) => ({
        ...(updateCommentLike(c, commentId) as CommentWithReplies),
        replies: c.replies.map((r) => updateCommentLike(r, commentId)),
        totalReplyCount: c.totalReplyCount,
      })),
    });

    try {
      const res = await fetch(`/api/community/${postId}/comments/${commentId}/like`, {
        method: 'POST',
      });

      if (!res.ok) {
        // Revert by toggling again on current state (avoids stale closure)
        set({
          comments: get().comments.map((c) => ({
            ...(updateCommentLike(c, commentId) as CommentWithReplies),
            replies: c.replies.map((r) => updateCommentLike(r, commentId)),
            totalReplyCount: c.totalReplyCount,
          })),
        });
      }
    } catch {
      set({
        comments: get().comments.map((c) => ({
          ...(updateCommentLike(c, commentId) as CommentWithReplies),
          replies: c.replies.map((r) => updateCommentLike(r, commentId)),
          totalReplyCount: c.totalReplyCount,
        })),
      });
    }
  },

  deleteComment: async (postId, commentId) => {
    try {
      const res = await fetch(`/api/community/${postId}/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const json = await res.json();
        set({ error: json.error ?? 'Failed to delete comment' });
        return;
      }

      // Mark as deleted in local state
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
      set({ error: 'Failed to delete comment' });
    }
  },

  reportComment: async (postId, commentId, reason, details) => {
    try {
      const res = await fetch(`/api/community/${postId}/comments/${commentId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, details }),
      });

      if (!res.ok) {
        const json = await res.json();
        set({ error: json.error ?? 'Failed to report comment' });
      }
    } catch {
      set({ error: 'Failed to report comment' });
    }
  },

  reset: () => set({ ...INITIAL_STATE }),
}));
