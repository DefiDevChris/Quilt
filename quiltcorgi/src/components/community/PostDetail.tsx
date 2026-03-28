'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { LikeButton } from '@/components/community/LikeButton';
import { SaveButton } from '@/components/community/SaveButton';
import { CategoryBadge } from '@/components/community/CategoryBadge';
import { CommentThread } from '@/components/community/comments/CommentThread';
import { ReportModal } from '@/components/community/ReportModal';
import {
  AuthorSection,
  LinkedProjectCard,
  ShareButton,
  ReportButton,
  PostDetailSkeleton,
} from '@/components/community/PostDetailParts';
import { useAuthStore } from '@/stores/authStore';
import { useCommunityStore } from '@/stores/communityStore';
import { formatRelativeTime } from '@/lib/format-time';
import type { CommunityPost } from '@/stores/communityStore';

interface PostDetailProps {
  postId: string;
}

export function PostDetail({ postId }: PostDetailProps) {
  const user = useAuthStore((s) => s.user);
  const storePosts = useCommunityStore((s) => s.posts);
  const [post, setPost] = useState<CommunityPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const fetchPost = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const currentStorePosts = useCommunityStore.getState().posts;
    const fromStore = currentStorePosts.find((p) => p.id === postId);
    if (fromStore) {
      setPost(fromStore);
      setIsSaved(fromStore.isSavedByUser);
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/community/${encodeURIComponent(postId)}`);
      const json = await res.json();

      if (!res.ok) {
        if (res.status === 404) {
          setError('not_found');
        } else {
          setError('Failed to load design');
        }
        setIsLoading(false);
        return;
      }

      const found = json.data as CommunityPost | undefined;
      if (found) {
        setPost(found);
        setIsSaved(found.isSavedByUser);
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

  useEffect(() => {
    const fromStore = storePosts.find((p) => p.id === postId);
    if (fromStore && post) {
      setPost(fromStore);
    }
  }, [storePosts, postId, post]);

  const handleShareLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // Clipboard API not available
    }
  }, []);

  const handleSaveToggle = useCallback(() => {
    setIsSaved((prev) => !prev);
  }, []);

  const handleFollowToggle = useCallback(async () => {
    if (!post?.creatorId || !user) return;

    const nextState = !isFollowing;
    setIsFollowing(nextState);

    try {
      const res = await fetch(`/api/follows/${post.creatorId}`, {
        method: nextState ? 'POST' : 'DELETE',
      });
      if (!res.ok) {
        setIsFollowing(!nextState);
      }
    } catch {
      setIsFollowing(!nextState);
    }
  }, [post?.creatorId, user, isFollowing]);

  if (isLoading) {
    return <PostDetailSkeleton />;
  }

  if (error === 'not_found') {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <p className="text-secondary mb-4">This design was not found.</p>
        <Link href="/community" className="text-sm text-primary hover:underline">
          Back to Community
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <p className="text-secondary mb-4">{error}</p>
        <button
          type="button"
          onClick={fetchPost}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-on hover:opacity-90 transition-opacity"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!post) return null;

  const isOwnPost = user?.id === post.creatorId;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back link */}
      <Link
        href="/community"
        className="inline-flex items-center gap-1 text-sm text-secondary hover:text-on-surface transition-colors mb-6"
      >
        <span>&larr;</span> Back to Community
      </Link>

      {/* Hero image */}
      <div className="w-full rounded-lg overflow-hidden bg-surface-container shadow-elevation-1">
        {post.thumbnailUrl ? (
          <Image
            src={post.thumbnailUrl}
            alt={post.title}
            width={1200}
            height={600}
            className="w-full max-h-[600px] object-cover"
            unoptimized
            priority
          />
        ) : (
          <div className="w-full aspect-[2/1] bg-primary-container flex items-center justify-center">
            <span className="text-6xl text-primary/30">&#9632;</span>
          </div>
        )}
      </div>

      {/* Content section */}
      <div className="mt-6 space-y-6">
        {/* Title + meta */}
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-on-surface">{post.title}</h1>
            <CategoryBadge category={post.category} />
          </div>
          <p className="text-sm text-secondary">{formatRelativeTime(post.createdAt)}</p>
        </div>

        {/* Author card */}
        <AuthorSection
          creatorName={post.creatorName}
          creatorUsername={post.creatorUsername}
          creatorAvatarUrl={post.creatorAvatarUrl}
          creatorId={post.creatorId}
          isPro={post.isPro}
          isOwnPost={isOwnPost}
          isFollowing={isFollowing}
          onFollowToggle={handleFollowToggle}
        />

        {/* Description */}
        {post.description && (
          <p className="text-on-surface whitespace-pre-wrap leading-relaxed">{post.description}</p>
        )}

        {/* Linked project card */}
        {post.projectId && (
          <LinkedProjectCard
            projectId={post.projectId}
            projectName={post.projectName}
            projectThumbnailUrl={post.projectThumbnailUrl}
          />
        )}

        {/* Action bar */}
        <div className="flex items-center gap-4 py-3 border-t border-b border-outline-variant/30">
          <LikeButton
            postId={post.id}
            likeCount={post.likeCount}
            isLikedByUser={post.isLikedByUser}
            size="lg"
          />
          <SaveButton postId={post.id} isSaved={isSaved} onToggle={handleSaveToggle} />
          <ShareButton onShare={handleShareLink} copied={copiedLink} />
          {!isOwnPost && user && <ReportButton onClick={() => setShowReportModal(true)} />}
        </div>

        {/* Comments */}
        <CommentThread postId={post.id} currentUserId={user?.id} isAdmin={user?.role === 'admin'} />
      </div>

      {/* Report modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetType="post"
        targetId={post.id}
      />
    </div>
  );
}
