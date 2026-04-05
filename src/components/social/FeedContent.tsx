'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useCommunityStore } from '@/stores/communityStore';
import { useInView } from 'react-intersection-observer';
import Link from 'next/link';
import Mascot from '@/components/landing/Mascot';
import { Heart, MessageCircle, Share2, Loader2 } from 'lucide-react';
import { useSocialQuickView } from '@/stores/socialQuickViewStore';
import { formatRelativeTime } from '@/lib/format-time';
import { CreatePostComposer } from './CreatePostComposer';
import { TemplateDetailModal } from '@/components/studio/TemplateDetailModal';
import { ReportModal } from './ReportModal';

// We now import CommunityPost from the store to ensure type matching
import type { CommunityPost } from '@/stores/communityStore';

export function FeedContent() {
  const user = useAuthStore((s) => s.user);

  // Use community store for state
  const { posts, isLoading, error, fetchPosts, loadMore, hasNextPage, reset } = useCommunityStore();

  // Setup intersection observer for infinite scroll
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '400px',
  });

  useEffect(() => {
    // Initial fetch
    fetchPosts();
    return () => reset();
  }, [fetchPosts, reset]);

  useEffect(() => {
    // Load more when scrolled to bottom
    if (inView && !isLoading && hasNextPage) {
      loadMore();
    }
  }, [inView, isLoading, hasNextPage, loadMore]);

  const handlePostCreated = useCallback(() => {
    // Refresh feed when a new post is created
    reset();
    fetchPosts();
  }, [reset, fetchPosts]);

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Create Post Composer */}
      <CreatePostComposer onSuccess={handlePostCreated} />

      {/* Initial Loading State */}
      {isLoading && posts.length === 0 && (
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
      {!isLoading && error && posts.length === 0 && (
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
            onClick={() => fetchPosts()}
            className="bg-gradient-to-r from-orange-400 to-rose-400 hover:from-orange-500 hover:to-rose-500 text-white px-6 py-2.5 rounded-full font-bold shadow-elevation-2 transition-all"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && posts.length === 0 && (
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
      {posts.length > 0 && (
        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}

          {/* Infinite Scroll trigger and Loading indicator */}
          {hasNextPage && (
            <div ref={ref} className="py-8 flex justify-center">
              {isLoading && (
                <div className="flex items-center gap-2 text-secondary">
                  <Loader2 className="animate-spin" size={20} />
                  <span className="font-medium text-sm">Loading more designs...</span>
                </div>
              )}
            </div>
          )}

          {!isLoading && !hasNextPage && posts.length > 0 && (
            <div className="py-8 text-center text-secondary font-medium">
              You've reached the end of the feed!
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PostCard({ post }: { post: CommunityPost & { templateId?: string | null } }) {
  const { open } = useSocialQuickView();
  const user = useAuthStore((s) => s.user);
  const [liked, setLiked] = useState(post.isLikedByUser);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showReport, setShowReport] = useState(false);

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

    // If post has a template, open template modal instead
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
      {post.thumbnailUrl && !post.projectId && (
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

      {/* Attached project read-only preview */}
      {post.projectId && post.projectName && (
        <Link
          href={`/studio/${post.projectId}`}
          className="block mb-4 rounded-xl overflow-hidden border border-white/50 shadow-elevation-1 hover:shadow-elevation-2 transition-shadow"
        >
          <div className="aspect-video bg-background flex items-center justify-center overflow-hidden">
            {post.projectThumbnailUrl || post.thumbnailUrl ? (
              <img
                src={post.projectThumbnailUrl || post.thumbnailUrl}
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
      )}

      <div className="flex gap-2 border-t border-white/40 pt-4">
        <button
          onClick={handleLike}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold transition-colors ${liked ? 'text-primary bg-primary/10' : 'text-secondary hover:bg-white/50'}`}
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
