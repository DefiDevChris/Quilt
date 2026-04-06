'use client';

import { create } from 'zustand';
import type { Comment } from '@/types/community';

interface CommentWithReplies extends Comment {
  replies: Comment[];
  totalReplyCount: number;
}

interface CommentState {
  comments: CommentWithReplies[];
  isLoading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  isSubmitting: boolean;

  fetchComments: (postId: string, append?: boolean) => Promise<void>;
  addComment: (postId: string, content: string, replyToId?: string) => Promise<void>;
  deleteComment: (postId: string, commentId: string) => Promise<void>;
  reset: () => void;
}

// Internal map for O(1) lookups - not part of public state
let commentMap: Record<string, Comment> = {};
let commentAbortController: AbortController | null = null;

const INITIAL_STATE = {
  comments: [] as CommentWithReplies[],
  isLoading: false,
  error: null as string | null,
  page: 1,
  totalPages: 1,
  isSubmitting: false,
};

function rebuildCommentMap(comments: CommentWithReplies[]): void {
  commentMap = {};
  for (const c of comments) {
    commentMap[c.id] = c;
    for (const r of c.replies) {
      commentMap[r.id] = r;
    }
  }
}

export const useCommentStore = create<CommentState>((set, get) => ({
  ...INITIAL_STATE,

  fetchComments: async (postId, append = false) => {
    commentAbortController?.abort();
    commentAbortController = new AbortController();
    const { page } = get();
    set({ isLoading: true, error: null });

    try {
      const params = new URLSearchParams();
      params.set('page', String(append ? page : 1));
      params.set('limit', '20');

      const res = await fetch(`/api/social/${postId}/comments?${params.toString()}`, {
        signal: commentAbortController.signal,
      });
      const json = await res.json();

      if (!res.ok) {
        set({ error: json.error ?? 'Failed to load comments', isLoading: false });
        return;
      }

      const data = json.data;
      set((state) => {
        const incoming: CommentWithReplies[] = data.comments;
        const merged = append ? [...state.comments, ...incoming] : incoming;
        rebuildCommentMap(merged);
        return {
          comments: merged,
          totalPages: data.pagination.totalPages,
          page: data.pagination.page,
          isLoading: false,
        };
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      set({ error: 'Failed to load comments', isLoading: false });
    }
  },

  addComment: async (postId, content, replyToId) => {
    set({ isSubmitting: true, error: null });

    try {
      const res = await fetch(`/api/social/${postId}/comments`, {
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
        const parentExists = commentMap[replyToId] !== undefined;
        if (!parentExists) {
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

  deleteComment: async (postId, commentId) => {
    try {
      const res = await fetch(`/api/social/${postId}/comments/${commentId}`, {
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

  reset: () => {
    commentAbortController?.abort();
    commentAbortController = null;
    commentMap = {};
    set({ ...INITIAL_STATE });
  },
}));
