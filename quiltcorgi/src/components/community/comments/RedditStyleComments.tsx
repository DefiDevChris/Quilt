'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCommentStore } from '@/stores/commentStore';
import { formatRelativeTime } from '@/lib/format-time';
import type { Comment } from '@/types/community';

type SortMode = 'recent' | 'top' | 'all';

interface CommentsProps {
  postId: string;
  currentUserId?: string;
  isAdmin?: boolean;
}

const PREVIEW_COUNT = 2;

export function RedditStyleComments({ postId, currentUserId, isAdmin }: CommentsProps) {
  const comments = useCommentStore((s) => s.comments);
  const isLoading = useCommentStore((s) => s.isLoading);
  const isSubmitting = useCommentStore((s) => s.isSubmitting);
  const fetchComments = useCommentStore((s) => s.fetchComments);
  const addComment = useCommentStore((s) => s.addComment);
  const deleteComment = useCommentStore((s) => s.deleteComment);
  const reset = useCommentStore((s) => s.reset);

  const [sort, setSort] = useState<SortMode>('recent');
  const [showAll, setShowAll] = useState(false);
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);

  const canComment = Boolean(currentUserId);

  useEffect(() => {
    fetchComments(postId);
    return () => {
      reset();
    };
  }, [postId, fetchComments, reset]);

  const flat = useMemo(() => {
    const all: Comment[] = [];
    for (const c of comments) {
      all.push(c);
      if (c.replies) {
        for (const r of c.replies) {
          all.push(r);
        }
      }
    }
    return all;
  }, [comments]);

  const sorted = useMemo(() => {
    const list = [...flat];
    if (sort === 'top') {
      list.sort((a, b) => b.likeCount - a.likeCount);
    } else {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return list;
  }, [flat, sort]);

  const visible = showAll || sort !== 'recent' ? sorted : sorted.slice(0, PREVIEW_COUNT);
  const hiddenCount = sorted.length - PREVIEW_COUNT;

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
      {flat.length > 0 && (
        <div className="flex items-center gap-4 mb-4">
          {(['recent', 'top'] as const).map((s) => (
            <button
              key={s}
              onClick={() => {
                setSort(s);
                setShowAll(s !== 'recent');
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
      {isLoading && flat.length === 0 && (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <CommentSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && flat.length === 0 && (
        <p className="text-sm text-secondary py-4">No comments yet</p>
      )}

      {/* Comments */}
      <div className="space-y-1">
        {visible.map((comment) => (
          <CommentRow
            key={comment.id}
            comment={comment}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
            onReply={() => setReplyTo({ id: comment.id, name: comment.authorName })}
            onDelete={() => handleDelete(comment.id)}
          />
        ))}
      </div>

      {/* View all */}
      {sort === 'recent' && !showAll && hiddenCount > 0 && (
        <button
          onClick={() => setShowAll(true)}
          className="text-sm font-semibold text-slate-500 hover:text-slate-800 mt-2 transition-colors"
        >
          View all {sorted.length} comments
        </button>
      )}

      {/* Input */}
      <div className="mt-4">
        {canComment ? (
          <CommentInput
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            placeholder={replyTo ? `Reply to ${replyTo.name}...` : 'Add a comment...'}
            onCancel={replyTo ? () => setReplyTo(null) : undefined}
          />
        ) : (
          <p className="text-xs text-slate-500">Sign in to comment</p>
        )}
      </div>
    </div>
  );
}

function CommentRow({
  comment,
  currentUserId,
  isAdmin,
  onReply,
  onDelete,
}: {
  comment: Comment;
  currentUserId?: string;
  isAdmin?: boolean;
  onReply: () => void;
  onDelete: () => void;
}) {
  const isOwn = currentUserId === comment.authorId;
  const profileHref = comment.authorUsername ? `/members/${comment.authorUsername}` : '#';

  return (
    <div className="flex gap-3 py-2 group">
      {/* Avatar */}
      <Link href={profileHref} className="shrink-0">
        {comment.authorAvatarUrl ? (
          <Image
            src={comment.authorAvatarUrl}
            alt=""
            width={32}
            height={32}
            className="w-8 h-8 rounded-full object-cover"
            unoptimized
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
            <span className="text-xs font-semibold text-orange-500">
              {comment.authorName.charAt(0)}
            </span>
          </div>
        )}
      </Link>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <p className="text-sm">
          <Link href={profileHref} className="font-semibold text-slate-800 hover:underline">
            {comment.authorName}
          </Link>{' '}
          <span className="text-slate-800">{comment.content}</span>
        </p>

        {/* Meta row */}
        <div className="flex items-center gap-4 mt-1">
          <span className="text-xs text-slate-500">{formatRelativeTime(comment.createdAt)}</span>

          {currentUserId && (
            <button
              onClick={onReply}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
            >
              Reply
            </button>
          )}

          {(isOwn || isAdmin) && (
            <button
              onClick={onDelete}
              className="text-xs text-slate-500 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
            >
              Delete
            </button>
          )}
        </div>
      </div>
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
        className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 border-b border-white/40 py-2 focus:outline-none focus:border-orange-400 transition-colors"
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
          className="text-xs text-slate-500 hover:text-slate-800 transition-colors"
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
