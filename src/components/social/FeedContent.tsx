'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import Link from 'next/link';
import { Heart, MessageCircle, Share2, Bookmark } from 'lucide-react';
import { useSocialQuickView } from '@/stores/socialQuickViewStore';
import { formatRelativeTime } from '@/lib/format-time';
import { CreatePostComposer } from './CreatePostComposer';

interface SocialPost {
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
  isBookmarkedByUser: boolean;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface FeedContentProps {
  tab?: 'discover' | 'saved';
}

export function FeedContent({ tab = 'discover' }: FeedContentProps) {
  const user = useAuthStore((s) => s.user);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPosts = useCallback(
    async (page = 1, append = false) => {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set('tab', tab);
        params.set('sort', 'newest');
        params.set('page', String(page));
        params.set('limit', '24');

        const res = await fetch(`/api/social?${params.toString()}`);
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.error || 'Failed to load posts');
        }

        const incoming = json.data?.posts || [];
        setPosts((prev) => (append ? [...prev, ...incoming] : incoming));
        setPagination(json.data?.pagination ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load feed');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [tab]
  );

  useEffect(() => {
    fetchPosts(1, false);
  }, [fetchPosts]);

  const handleLoadMore = () => {
    if (!pagination || pagination.page >= pagination.totalPages || loadingMore) return;
    fetchPosts(pagination.page + 1, true);
  };

  const hasMore = pagination ? pagination.page < pagination.totalPages : false;

  return (
    <div>
      {tab === 'discover' && <CreatePostComposer onSuccess={() => fetchPosts(1, false)} />}

      {/* Loading */}
      {loading && (
        <div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="post-skeleton">
              <div className="post-skeleton-header">
                <div className="post-skeleton-avatar" />
                <div className="post-skeleton-user">
                  <div className="post-skeleton-user-line" />
                  <div className="post-skeleton-user-line short" />
                </div>
              </div>
              <div className="post-skeleton-image" />
              <div className="post-skeleton-actions">
                <div className="post-skeleton-action" />
                <div className="post-skeleton-action" />
                <div className="post-skeleton-action" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="error-state">
          <p className="error-state-title">Couldn't load the feed</p>
          <p className="error-state-text">{error}</p>
          <button onClick={() => fetchPosts(1, false)} className="error-state-btn">
            Try Again
          </button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && posts.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">
            {tab === 'saved' ? <Bookmark size={28} /> : <Heart size={28} />}
          </div>
          <p className="empty-state-title">
            {tab === 'saved' ? 'No saved posts' : 'Nothing here yet'}
          </p>
          <p className="empty-state-text">
            {tab === 'saved'
              ? 'Save posts you love to find them easily later.'
              : 'Be the first to share a quilt design with the community.'}
          </p>
        </div>
      )}

      {/* Posts */}
      {!loading && !error && posts.length > 0 && (
        <div>
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}

          {hasMore && (
            <div className="flex justify-center py-6">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="text-sm font-medium text-[#6b655e] hover:text-[#2d2a26] disabled:opacity-50 transition-colors duration-150"
              >
                {loadingMore ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PostCard({ post }: { post: SocialPost }) {
  const { open } = useSocialQuickView();
  const [liked, setLiked] = useState(post.isLikedByUser);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [bookmarked, setBookmarked] = useState(post.isBookmarkedByUser);
  const [shareCopied, setShareCopied] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const response = await fetch(`/api/social/${post.id}/like`, { method: 'POST' });
      if (response.ok) {
        setLiked(!liked);
        setLikeCount(liked ? likeCount - 1 : likeCount + 1);
      }
    } catch {
      /* ignore */
    }
  };

  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const response = await fetch(`/api/social/${post.id}/bookmark`, { method: 'POST' });
      if (response.ok) {
        const json = await response.json();
        setBookmarked(json.data.bookmarked);
      }
    } catch {
      /* ignore */
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/socialthreads/${post.id}`
      );
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  const openModal = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    open({
      type: 'post',
      id: post.id,
      title: post.title,
      imageUrl: post.thumbnailUrl,
      creatorName: post.creatorName,
      creatorUsername: post.creatorUsername,
      creatorAvatarUrl: post.creatorAvatarUrl,
      likeCount,
      commentCount: post.commentCount,
      isLikedByUser: liked,
      description: post.description,
      category: post.category,
    });
  };

  const profileHref = post.creatorUsername ? `/members/${post.creatorUsername}` : '#';

  return (
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
          <span className="post-card-time">{formatRelativeTime(post.createdAt)}</span>
        </div>
      </div>

      {/* Image */}
      {post.thumbnailUrl && (
        <button onClick={openModal} className="post-card-image-container">
          <img src={post.thumbnailUrl} alt={post.title} />
        </button>
      )}

      {/* Actions */}
      <div className="post-card-actions">
        <button
          onClick={handleLike}
          className={`post-card-action-btn ${liked ? 'liked' : ''}`}
        >
          <Heart size={24} fill={liked ? 'currentColor' : 'none'} strokeWidth={2} />
        </button>
        <button onClick={openModal} className="post-card-action-btn">
          <MessageCircle size={24} strokeWidth={2} />
        </button>
        <button
          onClick={handleShare}
          className="post-card-action-btn"
          title={shareCopied ? 'Link copied!' : 'Share'}
        >
          <Share2 size={24} strokeWidth={2} />
        </button>
        <div className="post-card-action-spacer" />
        <button
          onClick={handleBookmark}
          className={`post-card-action-btn ${bookmarked ? 'bookmarked' : ''}`}
        >
          <Bookmark size={24} fill={bookmarked ? 'currentColor' : 'none'} strokeWidth={2} />
        </button>
      </div>

      {/* Likes count */}
      {likeCount > 0 && <div className="post-card-likes">{likeCount.toLocaleString()} likes</div>}

      {/* Caption */}
      {(post.description || post.title) && (
        <div className="post-card-caption">
          <Link href={profileHref} className="username">
            {post.creatorName}
          </Link>
          {post.description || post.title}
        </div>
      )}

      {/* Comments link */}
      {post.commentCount > 0 && (
        <button onClick={openModal} className="post-card-comments-btn">
          View all {post.commentCount} comments
        </button>
      )}
    </article>
  );
}
