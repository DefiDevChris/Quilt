'use client';

import { useEffect, useState, useCallback } from 'react';
import { useCommentStore } from '@/stores/commentStore';
import { CommentCard } from '@/components/community/comments/CommentCard';
import { CommentInput } from '@/components/community/comments/CommentInput';

interface CommentThreadProps {
  postId: string;
  currentUserId?: string;
  isAdmin?: boolean;
}

const MAX_VISIBLE_REPLIES = 3;

export function CommentThread({ postId, currentUserId, isAdmin }: CommentThreadProps) {
  const comments = useCommentStore((s) => s.comments);
  const isLoading = useCommentStore((s) => s.isLoading);
  const isSubmitting = useCommentStore((s) => s.isSubmitting);
  const page = useCommentStore((s) => s.page);
  const totalPages = useCommentStore((s) => s.totalPages);
  const fetchComments = useCommentStore((s) => s.fetchComments);
  const addComment = useCommentStore((s) => s.addComment);
  const reset = useCommentStore((s) => s.reset);

  const [replyTarget, setReplyTarget] = useState<{ commentId: string; username: string } | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());

  const canComment = Boolean(currentUserId);

  useEffect(() => {
    fetchComments(postId);
    return () => { reset(); };
  }, [postId, fetchComments, reset]);

  const handleTopLevelSubmit = useCallback(
    async (content: string) => {
      await addComment(postId, content);
    },
    [postId, addComment]
  );

  const handleReplySubmit = useCallback(
    async (content: string) => {
      if (!replyTarget) return;
      await addComment(postId, content, replyTarget.commentId);
      setReplyTarget(null);
    },
    [postId, replyTarget, addComment]
  );

  function handleReply(commentId: string, username: string) {
    setReplyTarget({ commentId, username });
  }

  function handleCancelReply() {
    setReplyTarget(null);
  }

  function toggleExpandReplies(commentId: string) {
    setExpandedReplies((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  }

  async function handleLoadMore() {
    useCommentStore.setState({ page: page + 1 });
    await fetchComments(postId, true);
  }

  const disabledMessage = !currentUserId
    ? 'Sign in to join the conversation.'
    : undefined;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-on-surface">Comments</h3>

      {/* Top-level comment input */}
      <CommentInput
        onSubmit={handleTopLevelSubmit}
        isSubmitting={isSubmitting && !replyTarget}
        disabled={!canComment}
        disabledMessage={disabledMessage}
      />

      {/* Loading state */}
      {isLoading && comments.length === 0 && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-lg bg-surface-container-high p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-surface-container" />
                <div className="h-3 w-24 bg-surface-container rounded" />
              </div>
              <div className="h-3 w-full bg-surface-container rounded mb-1" />
              <div className="h-3 w-3/4 bg-surface-container rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && comments.length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-secondary">No comments yet. Be the first to share your thoughts!</p>
        </div>
      )}

      {/* Comment list */}
      {comments.length > 0 && (
        <div className="space-y-3">
          {comments.map((comment) => {
            const isExpanded = expandedReplies.has(comment.id);
            const replies = comment.replies ?? [];
            const totalReplyCount = comment.totalReplyCount ?? replies.length;
            const visibleReplies = isExpanded ? replies : replies.slice(0, MAX_VISIBLE_REPLIES);
            const hiddenCount = totalReplyCount - MAX_VISIBLE_REPLIES;

            return (
              <div key={comment.id}>
                {/* Top-level comment */}
                <CommentCard
                  comment={comment}
                  postId={postId}
                  currentUserId={currentUserId}
                  isAdmin={isAdmin}
                  onReply={handleReply}
                />

                {/* Replies */}
                {visibleReplies.length > 0 && (
                  <div className="ml-10 border-l-2 border-outline-variant pl-4 mt-2 space-y-2">
                    {visibleReplies.map((reply) => (
                      <CommentCard
                        key={reply.id}
                        comment={reply}
                        postId={postId}
                        currentUserId={currentUserId}
                        isAdmin={isAdmin}
                        onReply={handleReply}
                      />
                    ))}

                    {/* Expand replies button */}
                    {!isExpanded && hiddenCount > 0 && (
                      <button
                        type="button"
                        onClick={() => toggleExpandReplies(comment.id)}
                        className="text-sm text-primary hover:underline py-1"
                      >
                        View {hiddenCount} more {hiddenCount === 1 ? 'reply' : 'replies'}
                      </button>
                    )}

                    {isExpanded && hiddenCount > 0 && (
                      <button
                        type="button"
                        onClick={() => toggleExpandReplies(comment.id)}
                        className="text-sm text-primary hover:underline py-1"
                      >
                        Show fewer replies
                      </button>
                    )}
                  </div>
                )}

                {/* Inline reply input */}
                {replyTarget?.commentId === comment.id && (
                  <div className="ml-10 mt-2">
                    <CommentInput
                      replyToId={replyTarget.commentId}
                      replyToUsername={replyTarget.username}
                      onCancel={handleCancelReply}
                      onSubmit={handleReplySubmit}
                      isSubmitting={isSubmitting}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Load more pagination */}
      {page < totalPages && (
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={isLoading}
            className="rounded-md border border-outline-variant px-4 py-2 text-sm text-secondary hover:text-on-surface hover:border-on-surface transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Load more comments'}
          </button>
        </div>
      )}
    </div>
  );
}
