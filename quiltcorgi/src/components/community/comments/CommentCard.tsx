'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { formatRelativeTime } from '@/lib/format-time';
import { useAuthStore } from '@/stores/authStore';
import { useCommentStore } from '@/stores/commentStore';
import type { Comment } from '@/types/community';

interface CommentCardProps {
  comment: Comment;
  postId: string;
  currentUserId?: string;
  isAdmin?: boolean;
  onReply: (commentId: string, username: string) => void;
}

function AuthorAvatar({ name, avatarUrl }: { name: string; avatarUrl: string | null }) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        width={32}
        height={32}
        className="w-8 h-8 rounded-full object-cover"
      />
    );
  }

  return (
    <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center">
      <span className="text-xs font-medium text-primary">{initials}</span>
    </div>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  if (filled) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-4 h-4 text-error"
      >
        <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
      </svg>
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-4 h-4 text-secondary"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
      />
    </svg>
  );
}

export function CommentCard({
  comment,
  postId,
  currentUserId,
  isAdmin,
  onReply,
}: CommentCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const user = useAuthStore((s) => s.user);
  const likeComment = useCommentStore((s) => s.likeComment);
  const deleteComment = useCommentStore((s) => s.deleteComment);
  const reportComment = useCommentStore((s) => s.reportComment);

  const isOwn = currentUserId === comment.authorId;
  const canDelete = isOwn || isAdmin;
  const isRemoved = comment.status === 'hidden' || comment.status === 'deleted';

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen, closeMenu]);

  function handleLike(e: React.MouseEvent) {
    e.stopPropagation();
    if (!user) return;
    likeComment(postId, comment.id);
  }

  function handleReply(e: React.MouseEvent) {
    e.stopPropagation();
    onReply(comment.id, comment.authorUsername ?? comment.authorName);
  }

  async function handleDelete() {
    setMenuOpen(false);
    await deleteComment(postId, comment.id);
  }

  async function handleReport() {
    setMenuOpen(false);
    await reportComment(postId, comment.id, 'inappropriate');
    setReportSent(true);
  }

  const authorLink = comment.authorUsername ? `/members/${comment.authorUsername}` : undefined;

  return (
    <div className="rounded-lg bg-surface-2 p-4">
      {/* Header: avatar + name + time */}
      <div className="flex items-center gap-2 mb-2">
        <AuthorAvatar name={comment.authorName} avatarUrl={comment.authorAvatarUrl} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {authorLink ? (
              <Link
                href={authorLink}
                className="text-sm font-medium text-on-surface hover:text-primary transition-colors truncate"
              >
                {comment.authorName}
              </Link>
            ) : (
              <span className="text-sm font-medium text-on-surface truncate">
                {comment.authorName}
              </span>
            )}
            <span className="text-xs text-secondary flex-shrink-0">
              {formatRelativeTime(comment.createdAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <p
        className={`text-sm whitespace-pre-wrap break-words ${isRemoved ? 'text-secondary italic' : 'text-on-surface'}`}
      >
        {comment.content}
      </p>

      {/* Actions row */}
      {!isRemoved && (
        <div className="flex items-center gap-4 mt-3">
          {/* Like button */}
          <button
            type="button"
            onClick={handleLike}
            disabled={!user}
            className={`inline-flex items-center gap-1 text-xs transition-colors ${
              !user ? 'cursor-default opacity-60' : 'cursor-pointer hover:opacity-80'
            }`}
            title={!user ? 'Sign in to like' : comment.isLikedByUser ? 'Unlike' : 'Like'}
          >
            <HeartIcon filled={comment.isLikedByUser} />
            <span className={comment.isLikedByUser ? 'text-error font-medium' : 'text-secondary'}>
              {comment.likeCount > 0 ? comment.likeCount : ''}
            </span>
          </button>

          {/* Reply button */}
          {user && (
            <button
              type="button"
              onClick={handleReply}
              className="inline-flex items-center gap-1 text-xs text-secondary hover:text-on-surface transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z"
                />
              </svg>
              Reply
            </button>
          )}

          {/* More menu */}
          {user && (
            <div className="relative ml-auto" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className="p-1 text-secondary hover:text-on-surface transition-colors rounded"
                title="More actions"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
                  />
                </svg>
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 w-36 rounded-lg bg-surface shadow-elevation-2 border border-outline-variant py-1 z-10">
                  {!isOwn && (
                    <button
                      type="button"
                      onClick={handleReport}
                      disabled={reportSent}
                      className="w-full text-left px-3 py-2 text-sm text-secondary hover:bg-surface-container-high transition-colors disabled:opacity-50"
                    >
                      {reportSent ? 'Reported' : 'Report'}
                    </button>
                  )}
                  {canDelete && (
                    <>
                      {!isOwn && <div className="border-t border-outline-variant my-1" />}
                      <button
                        type="button"
                        onClick={handleDelete}
                        className="w-full text-left px-3 py-2 text-sm text-error hover:bg-surface-container-high transition-colors"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
