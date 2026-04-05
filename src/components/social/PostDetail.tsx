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
      const res = await fetch(`/api/community/${encodeURIComponent(postId)}`);
      const json = await res.json();

      if (!res.ok) {
        setError(res.status === 404 ? 'not_found' : 'Failed to load design');
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
      setError('Failed to load design');
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
      await fetch(`/api/community/${encodeURIComponent(postId)}/like`, { method });
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

  const timeAgo = formatRelativeTime(post.createdAt);
  const authorHandle =
    post.creatorUsername || `@${post.creatorName.toLowerCase().replace(/\s/g, '')}`;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Back button */}
      <Link
        href="/socialthreads"
        className="inline-flex items-center gap-2 text-secondary hover:text-primary transition-colors"
      >
        <ArrowLeft size={18} />
        <span className="font-medium">Back to Feed</span>
      </Link>

      {/* Post Card */}
      <article className="glass-panel rounded-[1.5rem] p-6">
        {/* Author */}
        <div className="flex items-center justify-between mb-3">
          <Link href={`/members/${post.creatorUsername}`} className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-full border-2 border-white bg-orange-100 flex items-center justify-center shadow-elevation-1">
              <span className="text-sm font-bold text-orange-500">
                {post.creatorName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h4 className="font-bold text-on-surface text-base group-hover:text-primary transition-colors">
                {post.creatorName}
              </h4>
              <p className="text-xs text-secondary font-medium">
                {authorHandle} • {timeAgo}
              </p>
            </div>
          </Link>
        </div>

        {/* Title & Description */}
        <h1 className="text-2xl font-bold text-on-surface mb-2">{post.title}</h1>
        <p className="text-on-surface/80 mb-4 text-body-lg leading-relaxed">
          {post.description || post.title}
        </p>

        {/* Category badge */}
        {post.category && (
          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary mb-3">
            {post.category.replace('-', ' ')}
          </span>
        )}

        {/* Image */}
        {post.thumbnailUrl && (
          <div className="rounded-2xl overflow-hidden shadow-elevation-1 border border-white/50 mb-4">
            <img
              src={post.thumbnailUrl}
              alt={post.title}
              className="w-full h-auto max-h-[500px] object-contain bg-black/5"
            />
          </div>
        )}

        {/* Linked Project */}
        {post.projectId && post.projectName && (
          <div className="mb-4">
            <p className="text-xs font-bold text-secondary mb-2 uppercase tracking-wider">
              Attached Project
            </p>
            <Link
              href={`/studio/${post.projectId}`}
              className="block w-full max-w-sm rounded-xl overflow-hidden border border-white/50 shadow-elevation-1 hover:shadow-elevation-2 transition-shadow"
            >
              <div className="aspect-video bg-background flex items-center justify-center overflow-hidden">
                {post.projectThumbnailUrl ? (
                  <img
                    src={post.projectThumbnailUrl}
                    alt={post.projectName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-secondary text-sm">No preview</span>
                )}
              </div>
              <div className="px-3 py-2 bg-surface-container">
                <p className="text-sm font-medium text-on-surface truncate">{post.projectName}</p>
              </div>
            </Link>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 border-t border-white/40 pt-4">
          <button
            onClick={handleLike}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold transition-colors ${
              liked ? 'text-rose-500 bg-rose-50/50' : 'text-secondary hover:bg-white/50'
            }`}
          >
            <Heart size={20} fill={liked ? 'currentColor' : 'none'} />
            {likeCount}
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold text-secondary hover:bg-white/50 transition-colors">
            <MessageCircle size={20} /> {post.commentCount}
          </button>
          <button
            onClick={handleShare}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold text-secondary hover:bg-white/50 transition-colors"
          >
            <Share2 size={20} /> {copied ? 'Copied!' : 'Share'}
          </button>
        </div>
      </article>

      {/* Comments Section */}
      <div className="glass-panel rounded-[1.5rem] p-6">
        <h2 className="text-lg font-bold text-on-surface mb-4">Comments ({post.commentCount})</h2>
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
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="glass-panel rounded-[1.5rem] p-6 animate-pulse">
        <div className="h-6 w-24 bg-white/50 rounded mb-4" />
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-white/50" />
          <div className="space-y-2">
            <div className="h-4 bg-white/50 rounded w-32" />
            <div className="h-3 bg-white/50 rounded w-20" />
          </div>
        </div>
        <div className="h-8 bg-white/50 rounded w-3/4 mb-2" />
        <div className="h-4 bg-white/50 rounded w-full mb-4" />
        <div className="h-64 bg-white/50 rounded-2xl mb-4" />
        <div className="flex gap-2">
          <div className="h-10 flex-1 bg-white/50 rounded-xl" />
          <div className="h-10 flex-1 bg-white/50 rounded-xl" />
          <div className="h-10 flex-1 bg-white/50 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

function PostNotFound() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="glass-panel rounded-[2rem] p-10 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-container-high flex items-center justify-center">
          <span className="text-2xl">🔍</span>
        </div>
        <h2 className="text-xl font-bold text-on-surface mb-2">Post Not Found</h2>
        <p className="text-secondary mb-6">
          This post may have been removed or is pending approval.
        </p>
        <Link href="/socialthreads" className="btn-primary-sm inline-flex items-center gap-2">
          <ArrowLeft size={18} />
          Back to Feed
        </Link>
      </div>
    </div>
  );
}

function PostLoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="glass-panel rounded-[2rem] p-10 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-100 flex items-center justify-center">
          <span className="text-2xl">⚠️</span>
        </div>
        <h2 className="text-xl font-bold text-on-surface mb-2">Failed to Load</h2>
        <p className="text-secondary mb-6">Something went wrong loading this post.</p>
        <button onClick={onRetry} className="btn-primary-sm">
          Try Again
        </button>
      </div>
    </div>
  );
}
