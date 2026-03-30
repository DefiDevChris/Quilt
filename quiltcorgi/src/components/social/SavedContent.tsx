'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import Link from 'next/link';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import { useSocialQuickView } from '@/stores/socialQuickViewStore';
import { formatRelativeTime } from '@/lib/format-time';

interface CommunityPost {
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
}

export function SavedContent() {
  const user = useAuthStore((s) => s.user);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSavedPosts = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/community?saved=true&limit=24');
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Failed to load saved posts');
      }

      setPosts(json.data?.posts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load saved posts');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSavedPosts();
  }, [fetchSavedPosts]);

  // Guest state
  if (!user) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="glass-panel rounded-[2rem] p-10 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-100 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-orange-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z"
              />
            </svg>
          </div>
          <p className="text-xl font-bold text-on-surface mb-2">Your saved posts</p>
          <p className="text-secondary text-sm font-medium mb-6">
            Sign in to see your saved posts
          </p>
          <Link
            href="/auth/signin"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-400 to-rose-400 hover:from-orange-500 hover:to-rose-500 text-white px-6 py-2.5 rounded-full font-bold shadow-md transition-all"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Loading State */}
      {loading && (
        <div className="space-y-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass-panel rounded-[2rem] p-6 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-white/50" />
                <div className="space-y-2">
                  <div className="h-4 bg-white/50 rounded-full w-32" />
                  <div className="h-3 bg-white/50 rounded-full w-20" />
                </div>
              </div>
              <div className="h-64 bg-white/50 rounded-2xl mb-4" />
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="glass-panel rounded-[2rem] p-10 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-100 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-rose-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
          </div>
          <p className="text-secondary mb-4 font-medium">{error}</p>
          <button
            onClick={fetchSavedPosts}
            className="bg-gradient-to-r from-orange-400 to-rose-400 hover:from-orange-500 hover:to-rose-500 text-white px-6 py-2.5 rounded-full font-bold shadow-md transition-all"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && posts.length === 0 && (
        <div className="glass-panel rounded-[2rem] p-10 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-100 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-orange-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z"
              />
            </svg>
          </div>
          <p className="text-xl font-bold text-on-surface mb-2">No saved posts yet</p>
          <p className="text-secondary text-sm font-medium mb-6">
            Save posts you love by tapping the bookmark icon
          </p>
          <Link
            href="/socialthreads"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-400 to-rose-400 hover:from-orange-500 hover:to-rose-500 text-white px-6 py-2.5 rounded-full font-bold shadow-md transition-all"
          >
            Browse the Feed
          </Link>
        </div>
      )}

      {/* Posts */}
      {!loading && !error && posts.length > 0 && (
        <div className="space-y-6">
          {posts.map((post) => (
            <SavedPostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}

function SavedPostCard({ post }: { post: CommunityPost }) {
  const { open } = useSocialQuickView();
  const [liked, setLiked] = useState(post.isLikedByUser);
  const [likeCount, setLikeCount] = useState(post.likeCount);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const response = await fetch(`/api/community/${post.id}/like`, { method: 'POST' });
      if (response.ok) {
        setLiked(!liked);
        setLikeCount(liked ? likeCount - 1 : likeCount + 1);
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
      isSavedByUser: true,
      description: post.description,
      category: post.category,
    });
  };

  const authorHandle =
    post.creatorUsername || `@${post.creatorName.toLowerCase().replace(/\s/g, '')}`;

  return (
    <article className="glass-panel feed-post-hover rounded-[1.5rem] p-6">
      <div className="flex items-center justify-between mb-3">
        <Link href={`/socialthreads/${post.id}`} className="flex items-center gap-3 group">
          <div className="w-12 h-12 rounded-full border-2 border-white bg-orange-100 flex items-center justify-center shadow-sm">
            <span className="text-sm font-bold text-orange-500">
              {post.creatorName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h4 className="font-bold text-on-surface text-base group-hover:text-primary transition-colors">
              {post.creatorName}
            </h4>
            <p className="text-xs text-secondary font-medium">
              {authorHandle} • {formatRelativeTime(post.createdAt)}
            </p>
          </div>
        </Link>
      </div>

      <p className="text-on-surface/80 mb-3 text-[15px] leading-relaxed">
        {post.description || post.title}
      </p>

      {post.thumbnailUrl && (
        <button
          onClick={openModal}
          className="w-full rounded-2xl overflow-hidden shadow-sm border border-white/50 mb-3 block cursor-zoom-in"
        >
          <img
            src={post.thumbnailUrl}
            alt={post.title}
            className="w-full h-auto max-h-96 object-cover"
          />
        </button>
      )}

      <div className="flex gap-2 border-t border-white/40 pt-4">
        <button
          onClick={handleLike}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold transition-colors ${liked ? 'text-rose-500 bg-rose-50/50' : 'text-secondary hover:bg-white/50'}`}
        >
          <Heart size={20} fill={liked ? 'currentColor' : 'none'} />
          {likeCount}
        </button>
        <button
          onClick={openModal}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold text-secondary hover:bg-white/50 transition-colors"
        >
          <MessageCircle size={20} /> {post.commentCount}
        </button>
        <Link
          href={`/socialthreads/${post.id}`}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold text-secondary hover:bg-white/50 transition-colors"
        >
          <Share2 size={20} /> Full Post
        </Link>
      </div>
    </article>
  );
}
