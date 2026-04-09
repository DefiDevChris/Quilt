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
            <div key={i} className="social-card rounded-2xl overflow-hidden animate-pulse">
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
        <div className="social-card rounded-2xl p-12 text-center border border-error/20 bg-error/5">
          <p className="text-secondary/80 text-sm mb-6 font-medium">{error}</p>
          <button
            onClick={() => fetchPosts(1, false)}
            className="px-8 py-3 bg-error text-white rounded-full text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-elevation-1"
          >
            Reconnect Studio
          </button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && posts.length === 0 && (
        <div className="social-card rounded-2xl p-16 text-center border border-outline-variant/30">
          {tab === 'saved' ? (
            <div className="space-y-4">
              <p className="text-xl font-black text-on-surface tracking-tight">No archived designs</p>
              <p className="text-secondary font-medium">Bookmark designs from the community to see them here.</p>
            </div>
          ) : search || category ? (
            <div className="space-y-4">
              <p className="text-xl font-black text-on-surface tracking-tight">Zero matches found</p>
              <p className="text-secondary font-medium">Try refining your filter or search terms.</p>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="space-y-3">
                <p className="text-2xl font-black text-on-surface tracking-tight leading-tight">The forum is quiet</p>
                <p className="text-secondary font-medium max-w-sm mx-auto">Be the first to publish a work-in-progress or a finished design to the collective.</p>
              </div>
              {user && (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 bg-on-surface text-surface px-8 py-3.5 rounded-full text-xs font-black uppercase tracking-widest transition-all shadow-elevation-2 hover:scale-[1.02] active:scale-95"
                >
                  Publish Design
                </Link>
              )}
            </div>
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
    <article className="glass-panel rounded-3xl overflow-hidden border-outline-variant/30 hover:border-primary/20 transition-all duration-500 group">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-5">
        <Link
          href={
            post.creatorUsername ? `/members/${post.creatorUsername}` : `/socialthreads/${post.id}`
          }
          className="relative w-12 h-12 rounded-2xl overflow-hidden ring-2 ring-white shadow-elevation-1 group-hover:shadow-elevation-2 transition-all shrink-0"
        >
          {post.creatorAvatarUrl ? (
            <img
              src={post.creatorAvatarUrl}
              alt={post.creatorName}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white font-black text-lg">
              {post.creatorName.charAt(0).toUpperCase()}
            </div>
          )}
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            href={`/socialthreads/${post.id}`}
            className="text-base font-black text-on-surface hover:text-primary transition-colors truncate block tracking-tight"
          >
            {post.creatorName}
          </Link>
          <div className="flex items-center gap-2 mt-0.5">
            {post.creatorUsername && (
              <span className="text-[10px] font-black uppercase tracking-widest text-primary-dark opacity-60">
                @{post.creatorUsername}
              </span>
            )}
            <span className="w-1 h-1 rounded-full bg-outline-variant" />
            <span className="text-[10px] font-bold text-secondary uppercase tracking-[0.1em]">
              {formatRelativeTime(post.createdAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Description above image */}
      {(post.description || post.title) && (
        <div className="px-6 pb-5">
          <p className="text-base font-medium text-on-surface leading-relaxed line-clamp-3">
            {post.description || post.title}
          </p>
        </div>
      )}

      {/* Image */}
      {post.thumbnailUrl && (
        <div className="px-6 pb-6">
          <button 
            onClick={openModal} 
            className="w-full cursor-pointer block relative rounded-2xl overflow-hidden shadow-elevation-2 group/img"
          >
            <img
              src={post.thumbnailUrl}
              alt={post.title}
              className="w-full h-auto max-h-[600px] object-cover transition-transform duration-700 group-hover/img:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/5 transition-colors" />
          </button>
        </div>
      )}

      {/* Actions row */}
      <div className="px-6 py-4 flex items-center justify-between border-t border-outline-variant/20 bg-surface-container/30">
        <div className="flex items-center gap-6">
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 transition-all active:scale-90 ${
              liked ? 'text-rose-500' : 'text-secondary hover:text-on-surface'
            }`}
          >
            <Heart size={20} fill={liked ? 'currentColor' : 'none'} strokeWidth={2} />
            {likeCount > 0 && <span className="text-sm font-black">{likeCount}</span>}
          </button>

          <button
            onClick={openModal}
            className="flex items-center gap-2 text-secondary hover:text-on-surface transition-all active:scale-90"
          >
            <MessageCircle size={20} strokeWidth={2} />
            {post.commentCount > 0 && (
              <span className="text-sm font-black">{post.commentCount}</span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleBookmark}
            className={`transition-all active:scale-90 ${
              bookmarked ? 'text-primary' : 'text-secondary hover:text-on-surface'
            }`}
            title="Sace for later"
          >
            <Bookmark size={20} fill={bookmarked ? 'currentColor' : 'none'} strokeWidth={2} />
          </button>

          <Link
            href={`/socialthreads/${post.id}`}
            className="text-secondary hover:text-on-surface transition-all active:scale-90"
            title="Share design"
          >
            <Share2 size={20} strokeWidth={2} />
          </Link>
        </div>
      </div>
    </article>
  );
}
