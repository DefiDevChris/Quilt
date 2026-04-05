'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCommentStore } from '@/stores/commentStore';
import { useAuthStore } from '@/stores/authStore';
import { formatRelativeTime } from '@/lib/format-time';
import type { Comment } from '@/types/community';

type SortMode = 'recent' | 'top' | 'all';

interface CommentsProps {
  postId: string;
  currentUserId?: string;
  isAdmin?: boolean;
}

export function RedditStyleComments({ postId, currentUserId, isAdmin }: CommentsProps) {
  const comments = useCommentStore((s) => s.comments);
  const isLoading = useCommentStore((s) => s.isLoading);
  const isSubmitting = useCommentStore((s) => s.isSubmitting);
  const fetchComments = useCommentStore((s) => s.fetchComments);
  const addComment = useCommentStore((s) => s.addComment);
  const deleteComment = useCommentStore((s) => s.deleteComment);
  const reset = useCommentStore((s) => s.reset);
  const isPrivate = useAuthStore((s) => s.isPrivate);

  const [sort, setSort] = useState<SortMode>('recent');
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);

  const canComment = Boolean(currentUserId) && !isPrivate;

  useEffect(() => {
    fetchComments(postId);
    return () => {
      reset();
    };
  }, [postId, fetchComments, reset]);

  const sortedComments = useMemo(() => {
    const list = [...comments];
    if (sort === 'top') {
      list.sort((a, b) => b.likeCount - a.likeCount);
    } else {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return list;
  }, [comments, sort]);

  const handleSubmit = useCallback(
    async (content: string) => {
      if (replyTo) {
        await addComment(postId, content, replyTo.id);
        setReplyTo(null);
      } else {
        await addComment(postId, content);
      }
    },
    [postId, replyTo, addComment]
  );

  function handleDelete(commentId: string) {
    deleteComment(postId, commentId);
  }

  return (
    <div>
      {/* Sort tabs */}
      {comments.length > 0 && (
        <div className="flex items-center gap-4 mb-4">
          {(['recent', 'top'] as const).map((s) => (
            <button
              key={s}
              onClick={() => {
                setSort(s);
              }}
              className={`text-sm font-semibold transition-colors ${
                sort === s ? 'text-on-surface' : 'text-secondary hover:text-on-surface'
              }`}
            >
              {s === 'recent' ? 'Recent' : 'Top'}
            </button>
          ))}
        </div>
      )}

      {/* Loading */}
      {isLoading && comments.length === 0 && (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <CommentSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && comments.length === 0 && (
        <p className="text-sm text-secondary py-4">No comments yet</p>
      )}

      {/* Comments */}
      <div className="space-y-4">
        {sortedComments.map((comment) => (
          <CommentNode
            key={comment.id}
            comment={comment}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
            onReply={(id, name) => setReplyTo({ id, name })}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {/* Input */}
      <div className="mt-6 border-t border-white/20 pt-4">
        {canComment ? (
          <CommentInput
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            placeholder={replyTo ? `Reply to ${replyTo.name}...` : 'Add a comment...'}
            onCancel={replyTo ? () => setReplyTo(null) : undefined}
          />
        ) : isPrivate ? (
          <div className="rounded-lg bg-surface-container-high p-4 text-center">
            <p className="text-sm text-secondary">
              Your account is set to private. Switch to public to comment on posts.
            </p>
          </div>
        ) : (
          <p className="text-xs text-secondary/80">Sign in to comment</p>
        )}
      </div>
    </div>
  );
}

function CommentNode({
  comment,
  currentUserId,
  isAdmin,
  onReply,
  onDelete,
}: {
  comment: Comment;
  currentUserId?: string;
  isAdmin?: boolean;
  onReply: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isOwn = currentUserId === comment.authorId;
  const profileHref = comment.authorUsername ? `/members/${comment.authorUsername}` : '#';

  const hasReplies = comment.replies && comment.replies.length > 0;

  return (
    <div className="flex flex-col group">
      <div className="flex gap-3 py-1">
        {/* Collapse toggle or Avatar */}
        <div className="flex flex-col items-center shrink-0">
          <Link href={profileHref} className="shrink-0 mb-1 z-10">
            {comment.authorAvatarUrl ? (
              <Image
                src={comment.authorAvatarUrl}
                alt=""
                width={28}
                height={28}
                className="w-7 h-7 rounded-full object-cover shadow-sm"
                unoptimized
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center shadow-sm">
                <span className="text-xs font-bold text-orange-500">
                  {comment.authorName.charAt(0)}
                </span>
              </div>
            )}
          </Link>

          {!isCollapsed && hasReplies && (
            <button
              onClick={() => setIsCollapsed(true)}
              className="flex-1 w-0.5 bg-border/40 hover:bg-primary/50 hover:w-1 transition-all mt-1 mb-[-4px] z-0 rounded-full"
              aria-label="Collapse comment thread"
            />
          )}
        </div>

        {/* Body */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link
              href={profileHref}
              className="text-sm font-bold text-on-surface hover:text-primary transition-colors"
            >
              {comment.authorName}
            </Link>
            <span className="text-xs font-medium text-secondary/70">
              {formatRelativeTime(comment.createdAt)}
            </span>
            {isCollapsed && hasReplies && (
              <button
                onClick={() => setIsCollapsed(false)}
                className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full ml-2"
              >
                +{comment.replies!.length} replies
              </button>
            )}
          </div>

          {!isCollapsed && (
            <>
              <p className="text-body-lg text-on-surface/90 mt-0.5 leading-snug">
                {comment.content}
              </p>

              {/* Meta row */}
              <div className="flex items-center gap-4 mt-1.5">
                {currentUserId && (
                  <button
                    onClick={() => onReply(comment.id, comment.authorName)}
                    className="text-xs font-bold text-secondary hover:text-primary transition-colors flex items-center gap-1"
                  >
                    Reply
                  </button>
                )}

                {(isOwn || isAdmin) && (
                  <button
                    onClick={() => onDelete(comment.id)}
                    className="text-xs font-bold text-error/70 hover:text-error transition-colors"
                  >
                    Delete
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recursive Replies */}
      {!isCollapsed && hasReplies && (
        <div className="ml-3 pl-3 sm:ml-4 sm:pl-4 border-l-2 border-border/40 mt-1 space-y-2">
          {comment.replies!.map((reply) => (
            <CommentNode
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              onReply={onReply}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CommentInput({
  onSubmit,
  isSubmitting,
  placeholder,
  onCancel,
}: {
  onSubmit: (content: string) => Promise<void>;
  isSubmitting: boolean;
  placeholder: string;
  onCancel?: () => void;
}) {
  const [content, setContent] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;
    await onSubmit(content.trim());
    setContent('');
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        disabled={isSubmitting}
        className="flex-1 bg-transparent text-sm text-on-surface placeholder:text-tertiary border-b border-white/40 py-2 focus:outline-none focus:border-orange-400 transition-colors"
      />
      {content.trim() && (
        <button
          type="submit"
          disabled={isSubmitting}
          className="text-sm font-semibold text-orange-500 hover:opacity-80 disabled:opacity-50 transition-opacity"
        >
          Post
        </button>
      )}
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-secondary/80 hover:text-on-surface transition-colors"
        >
          Cancel
        </button>
      )}
    </form>
  );
}

function CommentSkeleton() {
  return (
    <div className="flex gap-3 py-2 animate-pulse">
      <div className="w-8 h-8 rounded-full bg-white/50 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-3/4 bg-white/50 rounded" />
        <div className="h-3 w-1/3 bg-white/50 rounded" />
      </div>
    </div>
  );
}
