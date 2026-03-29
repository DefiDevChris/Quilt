'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import Link from 'next/link';
import Mascot from '@/components/landing/Mascot';
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

export function FeedContent() {
  const user = useAuthStore((s) => s.user);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('tab', 'discover');
      params.set('sort', 'newest');
      params.set('page', '1');
      params.set('limit', '24');

      const res = await fetch(`/api/community?${params.toString()}`);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Failed to load posts');
      }

      setPosts(json.data?.posts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load community feed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Create Post Card */}
      {user && (
        <div className="glass-panel rounded-[1.5rem] p-4 shadow-sm">
          <div className="flex gap-4 items-center">
            <div className="w-12 h-12 rounded-full border-2 border-white bg-orange-100 flex items-center justify-center shadow-sm shrink-0">
              <span className="text-lg font-bold text-orange-500">
                {user.name?.charAt(0)?.toUpperCase() ?? '?'}
              </span>
            </div>
            <Link
              href="/dashboard"
              className="flex-1 bg-white/40 border border-white/50 rounded-2xl px-4 py-3 text-slate-500 font-medium hover:bg-white/60 transition-all"
            >
              Share your latest quilt design...
            </Link>
          </div>
        </div>
      )}

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
          <p className="text-slate-600 mb-4 font-medium">{error}</p>
          <button
            onClick={fetchPosts}
            className="bg-gradient-to-r from-orange-400 to-rose-400 hover:from-orange-500 hover:to-rose-500 text-white px-6 py-2.5 rounded-full font-bold shadow-md transition-all"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && posts.length === 0 && (
        <div className="glass-panel rounded-[2rem] p-10 text-center">
          <div className="w-24 h-24 mx-auto mb-6">
            <Mascot pose="sitting" size="lg" />
          </div>
          <p className="text-xl font-bold text-slate-800 mb-2">No designs yet</p>
          <p className="text-slate-500 mb-6 font-medium">Be the first to share your quilt!</p>
          {user && (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-400 to-rose-400 hover:from-orange-500 hover:to-rose-500 text-white px-6 py-2.5 rounded-full font-bold shadow-md transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
              Share Your Design
            </Link>
          )}
        </div>
      )}

      {/* Posts */}
      {!loading && !error && posts.length > 0 && (
        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}

function PostCard({ post }: { post: CommunityPost }) {
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
      isSavedByUser: false,
      description: post.description,
      category: post.category,
    });
  };

  const timeAgo = (date: string) => formatRelativeTime(date);

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
            <h4 className="font-bold text-slate-800 text-base group-hover:text-orange-500 transition-colors">
              {post.creatorName}
            </h4>
            <p className="text-xs text-slate-500 font-medium">
              {authorHandle} • {timeAgo(post.createdAt)}
            </p>
          </div>
        </Link>
      </div>

      <p className="text-slate-700 mb-3 text-[15px] leading-relaxed">
        {post.description || post.title}
      </p>

      {/* Clicking the image opens the quick-view modal */}
      {post.thumbnailUrl && (
        <button
          onClick={openModal}
          className="w-full rounded-2xl overflow-hidden shadow-sm border border-white/50 mb-3 block cursor-zoom-in"
        >
          <img
            src={post.thumbnailUrl}
            alt={post.title}
            className="w-full h-auto max-h-96 object-cover object-cover"
          />
        </button>
      )}

      <div className="flex gap-2 border-t border-white/40 pt-4">
        <button
          onClick={handleLike}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold transition-colors ${liked ? 'text-rose-500 bg-rose-50/50' : 'text-slate-600 hover:bg-white/50'}`}
        >
          <Heart size={20} fill={liked ? 'currentColor' : 'none'} />
          {likeCount}
        </button>
        <button
          onClick={openModal}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-white/50 transition-colors"
        >
          <MessageCircle size={20} /> {post.commentCount}
        </button>
        <Link
          href={`/socialthreads/${post.id}`}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-white/50 transition-colors"
        >
          <Share2 size={20} /> Full Post
        </Link>
      </div>
    </article>
  );
}
