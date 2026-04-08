'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import Link from 'next/link';
import Mascot from '@/components/landing/Mascot';
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
  sort?: 'newest' | 'popular';
  search?: string;
  category?: string;
  tab?: 'discover' | 'saved';
}

export function FeedContent({
  sort = 'newest',
  search = '',
  category,
  tab = 'discover',
}: FeedContentProps) {
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
        params.set('sort', sort);
        params.set('page', String(page));
        params.set('limit', '24');
        if (search) params.set('search', search);
        if (category) params.set('category', category);

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
    [sort, search, category, tab]
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
    <div className="space-y-5">
      {tab === 'discover' && <CreatePostComposer onSuccess={() => fetchPosts(1, false)} />}

      {/* Loading */}
      {loading && (
        <div className="space-y-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass-panel rounded-2xl overflow-hidden animate-pulse">
              <div className="flex items-center gap-3 p-4">
                <div className="w-10 h-10 rounded-full bg-primary-container/40" />
                <div className="space-y-1.5">
                  <div className="h-3.5 bg-primary-container/30 rounded w-28" />
                  <div className="h-3 bg-primary-container/20 rounded w-16" />
                </div>
              </div>
              <div className="h-72 bg-primary-container/20" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-primary-container/30 rounded w-24" />
                <div className="h-3 bg-primary-container/20 rounded w-48" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="glass-panel rounded-2xl p-10 text-center">
          <p className="text-secondary text-sm mb-4">{error}</p>
          <button
            onClick={() => fetchPosts(1, false)}
            className="bg-gradient-to-r from-orange-500 to-rose-400 text-white px-5 py-2 rounded-full text-sm font-semibold hover:opacity-90 transition-all shadow-elevation-1"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && posts.length === 0 && (
        <div className="glass-panel rounded-2xl p-10 text-center">
          <div className="w-16 h-16 mx-auto mb-4">
            <Mascot pose="sitting" size="lg" />
          </div>
          {tab === 'saved' ? (
            <>
              <p className="text-base font-semibold text-on-surface mb-1">No saved posts</p>
              <p className="text-secondary text-sm">Bookmark posts to see them here</p>
            </>
          ) : search || category ? (
            <>
              <p className="text-base font-semibold text-on-surface mb-1">No matching posts</p>
              <p className="text-secondary text-sm">Try a different search or category</p>
            </>
          ) : (
            <>
              <p className="text-base font-semibold text-on-surface mb-1">No designs yet</p>
              <p className="text-secondary text-sm mb-6">Be the first to share your quilt!</p>
              {user && (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-rose-400 text-white px-6 py-2.5 rounded-full text-sm font-semibold transition-all shadow-elevation-1 hover:shadow-elevation-2"
                >
                  Share Your Design
                </Link>
              )}
            </>
          )}
        </div>
      )}

      {/* Posts */}
      {!loading && !error && posts.length > 0 && (
        <div className="space-y-5">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}

          {/* Load more */}
          {hasMore && (
            <div className="flex justify-center pt-2">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="glass-panel rounded-full px-6 py-2.5 text-sm font-medium text-on-surface hover:shadow-elevation-1 transition-all disabled:opacity-50"
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

  return (
    <article className="glass-panel rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <Link
          href={
            post.creatorUsername ? `/members/${post.creatorUsername}` : `/socialthreads/${post.id}`
          }
          className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center shrink-0 overflow-hidden"
        >
          {post.creatorAvatarUrl ? (
            <img
              src={post.creatorAvatarUrl}
              alt={post.creatorName}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <span className="text-sm font-bold text-primary-dark">
              {post.creatorName.charAt(0).toUpperCase()}
            </span>
          )}
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            href={`/socialthreads/${post.id}`}
            className="text-sm font-semibold text-on-surface hover:text-primary transition-colors truncate block"
          >
            {post.creatorName}
          </Link>
          <p className="text-[11px] text-secondary">
            {post.creatorUsername && <span className="mr-1.5">@{post.creatorUsername}</span>}
            <span>{formatRelativeTime(post.createdAt)}</span>
          </p>
        </div>
      </div>

      {/* Description above image */}
      {(post.description || post.title) && (
        <div className="px-4 pb-3">
          <p className="text-sm text-on-surface">{post.description || post.title}</p>
        </div>
      )}

      {/* Image */}
      {post.thumbnailUrl && (
        <button onClick={openModal} className="w-full cursor-pointer block">
          <img
            src={post.thumbnailUrl}
            alt={post.title}
            className="w-full h-auto max-h-[500px] object-cover"
          />
        </button>
      )}

      {/* Actions row */}
      <div className="px-4 py-3 flex items-center border-t border-white/40">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 flex-1 justify-center transition-colors ${liked ? 'text-rose-500' : 'text-secondary hover:text-on-surface'
            }`}
        >
          <Heart size={18} fill={liked ? 'currentColor' : 'none'} strokeWidth={1.5} />
          {likeCount > 0 && <span className="text-sm font-medium">{likeCount}</span>}
        </button>

        <button
          onClick={openModal}
          className="flex items-center gap-1.5 flex-1 justify-center text-secondary hover:text-on-surface transition-colors"
        >
          <MessageCircle size={18} strokeWidth={1.5} />
          {post.commentCount > 0 && (
            <span className="text-sm font-medium">{post.commentCount}</span>
          )}
        </button>

        <button
          onClick={handleBookmark}
          className={`flex items-center gap-1.5 flex-1 justify-center transition-colors ${bookmarked ? 'text-primary' : 'text-secondary hover:text-on-surface'
            }`}
        >
          <Bookmark size={18} fill={bookmarked ? 'currentColor' : 'none'} strokeWidth={1.5} />
        </button>

        <Link
          href={`/socialthreads/${post.id}`}
          className="flex items-center gap-1.5 flex-1 justify-center text-secondary hover:text-on-surface transition-colors"
        >
          <Share2 size={18} strokeWidth={1.5} />
        </Link>
      </div>
    </article>
  );
}
