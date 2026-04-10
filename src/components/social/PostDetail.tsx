'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Heart, MessageCircle, Share2, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { formatRelativeTime } from '@/lib/format-time';
import { RedditStyleComments } from '@/components/community/comments/RedditStyleComments';

interface PostDetail {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string;
  likeCount: number;
  commentCount: number;
  category: string;
  createdAt: string;
  creatorName: string;
  creatorUsername: string | null;
  creatorAvatarUrl: string | null;
  isLikedByUser: boolean;
  projectId: string | null;
  projectName: string | null;
  projectThumbnailUrl: string | null;
}

interface PostDetailProps {
  postId: string;
}

export function PostDetail({ postId }: PostDetailProps) {
  const user = useAuthStore((s) => s.user);
  const [post, setPost] = useState<PostDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [copied, setCopied] = useState(false);

  const fetchPost = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/social/${encodeURIComponent(postId)}`);
      const json = await res.json();

      if (!res.ok) {
        setError(res.status === 404 ? 'not_found' : 'Failed to load post');
        setIsLoading(false);
        return;
      }

      const found = json.data as PostDetail | undefined;
      if (found) {
        setPost(found);
        setLiked(found.isLikedByUser);
        setLikeCount(found.likeCount);
      } else {
        setError('not_found');
      }
    } catch {
      setError('Failed to load post');
    } finally {
      setIsLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  const handleLike = async () => {
    if (!user) return;
    const next = !liked;
    setLiked(next);
    setLikeCount(next ? likeCount + 1 : likeCount - 1);
    try {
      const method = next ? 'POST' : 'DELETE';
      await fetch(`/api/social/${encodeURIComponent(postId)}/like`, { method });
    } catch {
      setLiked(!next);
      setLikeCount(next ? likeCount - 1 : likeCount + 1);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/socialthreads/${postId}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  if (isLoading) {
    return <PostDetailSkeleton />;
  }

  if (error === 'not_found') {
    return <PostNotFound />;
  }

  if (error || !post) {
    return <PostLoadError onRetry={fetchPost} />;
  }

  const profileHref = post.creatorUsername ? `/members/${post.creatorUsername}` : '#';
  const timeAgo = formatRelativeTime(post.createdAt);

  return (
    <div className="post-detail-container">
      {/* Back button */}
      <Link href="/socialthreads" className="post-detail-back">
        <ArrowLeft size={18} />
        Back
      </Link>

      {/* Post */}
      <article className="post-card">
        {/* Header */}
        <div className="post-card-header">
          <Link href={profileHref} className="post-card-avatar">
            {post.creatorAvatarUrl ? (
              <img src={post.creatorAvatarUrl} alt={post.creatorName} />
            ) : (
              <div className="post-card-avatar-placeholder">
                {post.creatorName.charAt(0).toUpperCase()}
              </div>
            )}
          </Link>
          <div className="post-card-user-info">
            <Link href={profileHref} className="post-card-username">
              {post.creatorName}
            </Link>
            <span className="post-card-time">{timeAgo}</span>
          </div>
        </div>

        {/* Image */}
        {post.thumbnailUrl && (
          <div className="post-card-image-container">
            <img src={post.thumbnailUrl} alt={post.title} />
          </div>
        )}

        {/* Actions */}
        <div className="post-card-actions">
          <button onClick={handleLike} className={`post-card-action-btn ${liked ? 'liked' : ''}`}>
            <Heart size={24} fill={liked ? 'currentColor' : 'none'} strokeWidth={2} />
          </button>
          <button className="post-card-action-btn">
            <MessageCircle size={24} strokeWidth={2} />
          </button>
          <button onClick={handleShare} className="post-card-action-btn" title={copied ? 'Copied!' : 'Share'}>
            <Share2 size={24} strokeWidth={2} />
          </button>
          <div className="post-card-action-spacer" />
        </div>

        {/* Likes */}
        {likeCount > 0 && (
          <div className="post-card-likes">{likeCount.toLocaleString()} likes</div>
        )}

        {/* Caption */}
        {(post.description || post.title) && (
          <div className="post-card-caption">
            <Link href={profileHref} className="username">
              {post.creatorName}
            </Link>
            {post.description || post.title}
          </div>
        )}

        {/* Linked project */}
        {post.projectId && post.projectName && (
          <Link
            href={`/studio/${post.projectId}`}
            className="block mx-4 mb-4 p-3 bg-neutral-100 rounded-full hover:bg-neutral-200 transition-colors"
          >
            <p className="text-xs text-neutral-600 mb-1">Project</p>
            <p className="text-sm font-semibold text-neutral-800">{post.projectName}</p>
          </Link>
        )}
      </article>

      {/* Comments */}
      <div className="mt-4">
        <RedditStyleComments
          postId={post.id}
          currentUserId={user?.id}
          isAdmin={user?.role === 'admin'}
        />
      </div>
    </div>
  );
}

function PostDetailSkeleton() {
  return (
    <div className="post-detail-container">
      <div className="post-skeleton">
        <div className="post-skeleton-header">
          <div className="post-skeleton-avatar" />
          <div className="post-skeleton-user">
            <div className="post-skeleton-user-line" />
            <div className="post-skeleton-user-line short" />
          </div>
        </div>
        <div className="post-skeleton-image" />
      </div>
    </div>
  );
}

function PostNotFound() {
  return (
    <div className="post-detail-container">
      <div className="error-state">
        <p className="error-state-title">Post Not Found</p>
        <p className="error-state-text">This post may have been removed or is pending approval.</p>
        <Link href="/socialthreads" className="error-state-btn" style={{ display: 'inline-block', textDecoration: 'none' }}>
          Back to Feed
        </Link>
      </div>
    </div>
  );
}

function PostLoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="post-detail-container">
      <div className="error-state">
        <p className="error-state-title">Failed to Load</p>
        <p className="error-state-text">Something went wrong loading this post.</p>
        <button onClick={onRetry} className="error-state-btn">Try Again</button>
      </div>
    </div>
  );
}
