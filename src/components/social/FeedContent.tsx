'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import Link from 'next/link';
import Mascot from '@/components/landing/Mascot';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import { useSocialQuickView } from '@/stores/socialQuickViewStore';
import { formatRelativeTime } from '@/lib/format-time';
import { CreatePostComposer } from './CreatePostComposer';
import { TemplateDetailModal } from '@/components/studio/TemplateDetailModal';
import { ReportModal } from './ReportModal';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { PatternCard } from '@/components/patterns/PatternCard';

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
  templateId: string | null;
  projectId?: string | null;
  patternId?: string | null;
  projectName?: string | null;
  projectThumbnailUrl?: string | null;
}

const PAGE_SIZE = 10;

export function FeedContent() {
  const user = useAuthStore((s) => s.user);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const postsRef = useRef<Map<string, CommunityPost>>(new Map());
  const sentinelRef = useRef<HTMLDivElement>(null);

  const fetchPosts = useCallback(
    async (isAppend = false) => {
      if (isAppend) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set('tab', 'discover');
        params.set('sort', 'newest');
        params.set('limit', PAGE_SIZE.toString());
        if (isAppend && cursor) {
          params.set('cursor', cursor);
        }

        const res = await fetch(`/api/community?${params.toString()}`);
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.error || 'Failed to load posts');
        }

        const newPosts = json.data?.posts || [];
        const nextCursor = json.data?.nextCursor || null;

        if (isAppend) {
          const merged = [...posts, ...newPosts];
          setPosts(merged);
          newPosts.forEach((post: CommunityPost) => postsRef.current.set(post.id, post));
        } else {
          setPosts(newPosts);
          postsRef.current.clear();
          newPosts.forEach((post: CommunityPost) => postsRef.current.set(post.id, post));
        }

        setHasMore(!!nextCursor && newPosts.length === PAGE_SIZE);
        setCursor(nextCursor);
      } catch (err) {
        if (!isAppend) {
          setError(err instanceof Error ? err.message : 'Failed to load community feed');
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [cursor, posts]
  );

  useEffect(() => {
    fetchPosts(false);
  }, []);

  // Infinite scroll using native Intersection Observer
  useEffect(() => {
    if (!sentinelRef.current || loadingMore || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          fetchPosts(true);
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(sentinelRef.current);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, loadingMore, loading, fetchPosts]);

  const updatePostInList = useCallback((postId: string, updater: (post: CommunityPost) => CommunityPost) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const updated = updater(p);
          postsRef.current.set(postId, updated);
          return updated;
        }
        return p;
      })
    );
  }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Create Post Composer */}
      <CreatePostComposer onSuccess={() => fetchPosts(false)} />

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
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-primary"
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
            onClick={() => fetchPosts(false)}
            className="bg-gradient-to-r from-orange-400 to-rose-400 hover:from-orange-500 hover:to-rose-500 text-white px-6 py-2.5 rounded-full font-bold shadow-elevation-2 transition-all"
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
          <p className="text-xl font-bold text-on-surface mb-2">No designs yet</p>
          <p className="text-secondary mb-6 font-medium">Be the first to share your quilt!</p>
          {user && (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-400 to-rose-400 hover:from-orange-500 hover:to-rose-500 text-white px-6 py-2.5 rounded-full font-bold shadow-elevation-2 transition-all"
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
            <PostCard key={post.id} post={post} onUpdate={updatePostInList} />
          ))}
          {/* Sentinel element for infinite scroll */}
          <div ref={sentinelRef} className="py-4 flex justify-center">
            {loadingMore && (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            )}
          </div>
          {!hasMore && posts.length > 0 && (
            <div className="text-center py-4 text-sm text-secondary font-medium">
              You've reached the end of the feed
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PostCard({
  post,
  onUpdate,
}: {
  post: CommunityPost;
  onUpdate: (id: string, updater: (p: CommunityPost) => CommunityPost) => void;
}) {
  const { open } = useSocialQuickView();
  const user = useAuthStore((s) => s.user);
  const [liked, setLiked] = useState(post.isLikedByUser);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const previousLiked = liked;
    const previousCount = likeCount;
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);
    try {
      const response = await fetch(`/api/community/${post.id}/like`, { method: 'POST' });
      if (!response.ok) {
        throw new Error('Failed to like');
      }
      onUpdate(post.id, (p) => ({ ...p, isLikedByUser: !previousLiked, likeCount: previousLiked ? previousCount - 1 : previousCount + 1 }));
    } catch {
      setLiked(previousLiked);
      setLikeCount(previousCount);
    }
  };

  const openModal = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (post.templateId) {
      setShowTemplateModal(true);
      return;
    }

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

  const timeAgo = (date: string) => formatRelativeTime(date);

  const authorHandle =
    post.creatorUsername || `@${post.creatorName.toLowerCase().replace(/\s/g, '')}`;

  return (
    <article className="glass-panel feed-post-hover rounded-[1.5rem] p-6">
      <div className="flex items-center justify-between mb-3">
        <Link href={`/socialthreads/${post.id}`} className="flex items-center gap-3 group">
          <div className="w-12 h-12 rounded-full border-2 border-white bg-primary-golden/10 flex items-center justify-center shadow-elevation-1">
            <span className="text-sm font-bold text-primary-golden">
              {post.creatorName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h4 className="font-bold text-on-surface text-base group-hover:text-primary transition-colors">
              {post.creatorName}
            </h4>
            <p className="text-xs text-secondary font-medium">
              {authorHandle} • {timeAgo(post.createdAt)}
            </p>
          </div>
        </Link>
        {user && (
          <button
            type="button"
            onClick={() => setShowReport(true)}
            className="p-1.5 text-secondary hover:text-on-surface transition-colors rounded-lg"
            title="Report post"
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
        )}
      </div>

      <p className="text-on-surface/80 mb-3 text-[15px] leading-relaxed">
        {post.description || post.title}
      </p>

      {/* Clicking the image opens the quick-view modal */}
      {post.thumbnailUrl && (
        <button
          onClick={openModal}
          className="w-full rounded-2xl overflow-hidden shadow-elevation-1 border border-white/50 mb-3 block cursor-zoom-in"
        >
          <img
            src={post.thumbnailUrl}
            alt={post.title}
            className="w-full h-auto max-h-96 object-cover"
          />
        </button>
      )}

      {/* Attached Project Card */}
      {post.projectId && post.projectName && (
        <div className="mb-4">
          <ProjectCard
            id={post.projectId}
            name={post.projectName}
            thumbnailUrl={post.projectThumbnailUrl || null}
            unitSystem="imperial"
            updatedAt={post.createdAt}
            onDelete={() => {}}
            onRename={() => {}}
          />
        </div>
      )}

      {/* Attached Pattern Card */}
      {post.patternId && (
        <div className="mb-4">
          <PatternCard
            pattern={{
              id: post.patternId,
              name: post.title,
              thumbnailUrl: post.thumbnailUrl,
              skillLevel: 'beginner',
              finishedWidth: 12,
              finishedHeight: 12,
              blockCount: 1,
              fabricCount: 3,
            }}
            onPreview={() => {}}
          />
        </div>
      )}

      <div className="flex gap-2 border-t border-white/40 pt-4">
        <button
          onClick={handleLike}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold transition-colors ${
            liked ? 'text-primary bg-primary/10' : 'text-secondary hover:bg-white/50'
          }`}
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

      {showTemplateModal && post.templateId && (
        <TemplateDetailModal
          templateId={post.templateId}
          onClose={() => setShowTemplateModal(false)}
        />
      )}
      {showReport && <ReportModal postId={post.id} onClose={() => setShowReport(false)} />}
    </article>
  );
}
