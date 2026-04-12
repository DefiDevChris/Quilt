'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCommentStore } from '@/stores/commentStore';
import { useAuthStore } from '@/stores/authStore';
import { formatRelativeTime } from '@/lib/format-time';
import type { Comment } from '@/types/community';

type SortMode = 'recent' | 'all';

interface CommentsProps {
 postId: string;
 currentUserId?: string;
 isAdmin?: boolean;
}

const PREVIEW_COUNT = 3;

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
 const [showAll, setShowAll] = useState(false);
 const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);

 const canComment = Boolean(currentUserId) && !isPrivate;

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
 list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
 return list;
 }, [flat]);

 const visible = showAll || sort === 'all' ? sorted : sorted.slice(0, PREVIEW_COUNT);
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
 {flat.length > 2 && (
 <div className="comment-sort-tabs">
 {(['recent', 'all'] as const).map((s) => (
 <button
 key={s}
 onClick={() => {
 setSort(s);
 setShowAll(s === 'all');
 }}
 className={`comment-sort-tab ${sort === s ? 'active' : ''}`}
 >
 {s === 'recent' ? 'Newest' : 'All'}
 </button>
 ))}
 </div>
 )}

 {/* Loading */}
 {isLoading && flat.length === 0 && (
 <div className="space-y-1">
 {[1, 2, 3].map((i) => (
 <CommentSkeleton key={i} />
 ))}
 </div>
 )}

 {/* Empty */}
 {!isLoading && flat.length === 0 && (
 <p className="text-sm text-dim py-4 px-12">No comments yet</p>
 )}

 {/* Comments */}
 <div className="comments-section">
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
 className="text-sm font-medium text-dim hover:text-default px-12 py-2 transition-colors"
 >
 View all {sorted.length} comments
 </button>
 )}

 {/* Input */}
 <div>
 {canComment ? (
 <CommentInput
 onSubmit={handleSubmit}
 isSubmitting={isSubmitting}
 placeholder={replyTo ? `Reply to ${replyTo.name}...` : 'Add a comment...'}
 onCancel={replyTo ? () => setReplyTo(null) : undefined}
 />
 ) : isPrivate ? (
 <div className="text-sm text-dim py-4 px-12 text-center">
 Your account is set to private. Switch to public to comment.
 </div>
 ) : (
 <p className="text-xs text-dim py-4 px-12">Sign in to comment</p>
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
 <div className="comment-row">
 {/* Avatar */}
 <Link href={profileHref} className="comment-avatar">
 {comment.authorAvatarUrl ? (
 <Image
 src={comment.authorAvatarUrl}
 alt=""
 width={28}
 height={28}
 className="object-cover"
 unoptimized
 />
 ) : (
 <div className="comment-avatar-placeholder">
 {comment.authorName.charAt(0)}
 </div>
 )}
 </Link>

 {/* Body */}
 <div className="comment-body">
 <p className="comment-content">
 <Link href={profileHref} className="comment-author">
 {comment.authorName}
 </Link>
 {comment.content}
 </p>

 {/* Meta row */}
 <div className="comment-meta">
 <span className="comment-time">{formatRelativeTime(comment.createdAt)}</span>
 {currentUserId && (
 <button onClick={onReply} className="comment-reply-btn">
 Reply
 </button>
 )}
 {(isOwn || isAdmin) && (
 <button onClick={onDelete} className="comment-delete-btn">
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
 <form onSubmit={handleSubmit} className="comment-input-row">
 <input
 type="text"
 value={content}
 onChange={(e) => setContent(e.target.value)}
 placeholder={placeholder}
 disabled={isSubmitting}
 className="comment-input"
 />
 <div className="flex items-center gap-2">
 {onCancel && (
 <button
 type="button"
 onClick={onCancel}
 className="text-xs text-dim hover:text-default transition-colors"
 >
 Cancel
 </button>
 )}
 <button
 type="submit"
 disabled={isSubmitting || !content.trim()}
 className="comment-post-btn"
 >
 Post
 </button>
 </div>
 </form>
 );
}

function CommentSkeleton() {
 return (
 <div className="comment-row animate-pulse opacity-50">
 <div className="comment-avatar" />
 <div className="comment-body space-y-2">
 <div className="h-3 w-3/4 bg-default rounded-lg" />
 <div className="h-3 w-1/4 bg-default rounded-lg" />
 </div>
 </div>
 );
}
