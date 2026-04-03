'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
      <Image
        src={avatarUrl}
        alt={name}
        width={32}
        height={32}
        className="w-8 h-8 rounded-full object-cover"
        unoptimized
      />
    );
  }

  return (
    <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center">
      <span className="text-xs font-medium text-primary">{initials}</span>
    </div>
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
  const menuRef = useRef<HTMLDivElement>(null);

  const user = useAuthStore((s) => s.user);
  const deleteComment = useCommentStore((s) => s.deleteComment);

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

  function handleReply(e: React.MouseEvent) {
    e.stopPropagation();
    onReply(comment.id, comment.authorUsername ?? comment.authorName);
  }

  async function handleDelete() {
    setMenuOpen(false);
    await deleteComment(postId, comment.id);
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

          {/* Delete menu */}
          {canDelete && user && (
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
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="w-full text-left px-3 py-2 text-sm text-error hover:bg-surface-container-high transition-colors"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
