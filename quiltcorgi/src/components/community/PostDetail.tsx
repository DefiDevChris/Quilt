'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { LikeButton } from '@/components/community/LikeButton';
import { useCommunityStore } from '@/stores/communityStore';
import type { CommunityPost } from '@/stores/communityStore';

interface PostDetailProps {
  postId: string;
}

export function PostDetail({ postId }: PostDetailProps) {
  const storePosts = useCommunityStore((s) => s.posts);
  const [post, setPost] = useState<CommunityPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPost = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    // Check store first
    const fromStore = storePosts.find((p) => p.id === postId);
    if (fromStore) {
      setPost(fromStore);
      setIsLoading(false);
      return;
    }

    // Fetch from API
    try {
      const params = new URLSearchParams();
      params.set('limit', '100');
      params.set('sort', 'newest');

      const res = await fetch(`/api/community?${params.toString()}`);
      const json = await res.json();

      if (!res.ok) {
        setError('Failed to load design');
        setIsLoading(false);
        return;
      }

      const found = json.data?.posts?.find((p: CommunityPost) => p.id === postId);
      if (found) {
        setPost(found);
      } else {
        setError('not_found');
      }
    } catch {
      setError('Failed to load design');
    } finally {
      setIsLoading(false);
    }
  }, [postId, storePosts]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  // Keep in sync with store updates (optimistic like/unlike)
  useEffect(() => {
    const fromStore = storePosts.find((p) => p.id === postId);
    if (fromStore && post) {
      setPost(fromStore);
    }
  }, [storePosts, postId, post]);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto animate-pulse">
        <div className="h-4 w-32 bg-surface-container-high rounded mb-6" />
        <div className="aspect-[4/3] bg-surface-container-high rounded-lg mb-4" />
        <div className="h-6 w-64 bg-surface-container-high rounded mb-2" />
        <div className="h-4 w-40 bg-surface-container-high rounded mb-4" />
        <div className="h-20 bg-surface-container-high rounded" />
      </div>
    );
  }

  if (error === 'not_found') {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <p className="text-secondary mb-4">This design was not found.</p>
        <Link href="/community" className="text-sm text-primary hover:underline">
          Back to Community
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
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

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/community"
        className="inline-flex items-center gap-1 text-sm text-secondary hover:text-on-surface transition-colors mb-6"
      >
        <span>&larr;</span> Back to Community
      </Link>

      <div className="max-w-2xl mx-auto rounded-lg overflow-hidden bg-surface-container shadow-elevation-1">
        {post.thumbnailUrl ? (
          <Image
            src={post.thumbnailUrl}
            alt={post.title}
            width={800}
            height={600}
            className="w-full h-auto object-cover"
            unoptimized
          />
        ) : (
          <div className="w-full aspect-[4/3] bg-primary-container flex items-center justify-center">
            <span className="text-6xl text-primary/30">&#9632;</span>
          </div>
        )}
      </div>

      <h1 className="text-2xl font-bold text-on-surface mt-4">{post.title}</h1>

      <div className="flex items-center gap-3 mt-2">
        <p className="text-sm text-secondary">by {post.creatorName}</p>
        <span className="text-outline-variant">|</span>
        <p className="text-sm text-secondary">{new Date(post.createdAt).toLocaleDateString()}</p>
      </div>

      {post.description && (
        <p className="text-secondary whitespace-pre-wrap mt-4">{post.description}</p>
      )}

      <div className="mt-6">
        <LikeButton
          postId={post.id}
          likeCount={post.likeCount}
          isLikedByUser={post.isLikedByUser}
          size="lg"
        />
      </div>
    </div>
  );
}
