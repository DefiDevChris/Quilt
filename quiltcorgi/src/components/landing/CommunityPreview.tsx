'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface CommunityPost {
  id: string;
  title: string;
  thumbnailUrl: string;
  creatorName: string;
  likeCount: number;
}

interface CommunityResponse {
  success: boolean;
  data: {
    posts: CommunityPost[];
  };
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-[var(--radius-lg)] bg-surface-container h-48" />
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

function PostCard({ post }: { post: CommunityPost }) {
  return (
    <div className="rounded-[var(--radius-lg)] overflow-hidden">
      <div className="aspect-video bg-surface-container relative">
        {post.thumbnailUrl ? (
          <div
            className="w-full h-full bg-center bg-cover"
            style={{ backgroundImage: `url(${post.thumbnailUrl})` }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-secondary">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 15l4-4 4 4 4-4 5 5" />
            </svg>
          </div>
        )}
      </div>
      <div className="pt-3">
        <h3 className="text-[length:var(--font-size-body-sm)] font-medium text-on-surface truncate">
          {post.title}
        </h3>
        <div className="flex items-center gap-1 mt-1 text-secondary">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <span className="text-[length:var(--font-size-body-sm)]">
            {post.likeCount}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function CommunityPreview() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchPosts() {
      try {
        const response = await fetch('/api/community?limit=6&sort=newest');
        if (!response.ok) {
          setHasError(true);
          setIsLoading(false);
          return;
        }
        const json: CommunityResponse = await response.json();
        if (!cancelled && json.success) {
          setPosts(json.data.posts);
        }
      } catch {
        if (!cancelled) {
          setHasError(true);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchPosts();

    return () => {
      cancelled = true;
    };
  }, []);

  if (hasError) {
    return null;
  }

  if (isLoading) {
    return <SkeletonGrid />;
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-secondary text-lg">Be the first to share a design!</p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
      <div className="text-center mt-8">
        <Link
          href="/community"
          className="inline-block bg-surface-container text-on-surface font-medium px-8 py-4 rounded-full shadow-[var(--shadow-elevation-1)] hover:shadow-[var(--shadow-elevation-2)] transition-shadow"
        >
          Browse Community
        </Link>
      </div>
    </div>
  );
}
