'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type { BlogPostListItem } from '@/types/community';
import { SUPPORT_EMAIL } from '@/lib/constants';

function formatDate(date: Date | string | null): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

type BentoStyle = 'hero' | 'side' | 'compact' | 'wide' | 'tall';

function AuthorRow({ post, dark = false }: { post: BlogPostListItem; dark?: boolean }) {
  const textClass = dark ? 'text-white/75' : 'text-secondary/80';
  const nameClass = dark ? 'font-bold text-white' : 'font-bold text-on-surface';
  return (
    <div className={`flex items-center gap-2 text-xs ${textClass}`}>
      {post.authorAvatarUrl ? (
        <img
          src={post.authorAvatarUrl}
          alt={post.authorName}
          className="w-5 h-5 rounded-full object-cover border border-white/60 shrink-0"
        />
      ) : (
        <div className="w-5 h-5 rounded-full bg-orange-100 border border-white flex items-center justify-center shrink-0">
          <span className="text-[9px] font-bold text-orange-500">
            {post.authorName.charAt(0).toUpperCase()}
          </span>
        </div>
      )}
      <span className={nameClass}>{post.authorName}</span>
      <span aria-hidden>·</span>
      <span>{post.readTimeMinutes} min</span>
    </div>
  );
}

function BentoCard({ post, bentoStyle }: { post: BlogPostListItem; bentoStyle: BentoStyle }) {
  const image = post.featuredImageUrl || '/images/quilts/quilt_01_bed_geometric.png';

  if (bentoStyle === 'hero') {
    return (
      <Link
        href={`/blog/${post.slug}`}
        className="relative w-full h-full rounded-[1.5rem] overflow-hidden group cursor-pointer text-left block"
      >
        <img src={image} alt={post.title} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
          <h3 className="text-2xl font-extrabold text-white leading-tight mb-3 line-clamp-2 tracking-tight">
            {post.title}
          </h3>
          {post.excerpt && (
            <p className="text-white/75 text-sm line-clamp-2 mb-3 leading-relaxed">
              {post.excerpt}
            </p>
          )}
          <AuthorRow post={post} dark />
        </div>
      </Link>
    );
  }

  if (bentoStyle === 'wide') {
    return (
      <Link
        href={`/blog/${post.slug}`}
        className="w-full h-full glass-panel-social rounded-[1.5rem] overflow-hidden group cursor-pointer flex text-left"
      >
        <div className="w-2/5 shrink-0 overflow-hidden">
          <img src={image} alt={post.title} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 p-5 flex flex-col justify-between">
          <div>
            <h4 className="text-base font-extrabold text-on-surface mb-1.5 line-clamp-2 leading-snug">
              {post.title}
            </h4>
            {post.excerpt && (
              <p className="text-xs text-secondary/80 line-clamp-2 leading-relaxed">
                {post.excerpt}
              </p>
            )}
          </div>
          <AuthorRow post={post} />
        </div>
      </Link>
    );
  }

  if (bentoStyle === 'tall') {
    return (
      <Link
        href={`/blog/${post.slug}`}
        className="w-full h-full glass-panel-social rounded-[1.5rem] overflow-hidden group cursor-pointer flex flex-col text-left"
      >
        <div className="flex-1 min-h-0 overflow-hidden">
          <img src={image} alt={post.title} className="w-full h-full object-cover" />
        </div>
        <div className="shrink-0 p-5">
          <h4 className="text-base font-extrabold text-on-surface mb-3 line-clamp-3 leading-snug">
            {post.title}
          </h4>
          <AuthorRow post={post} />
        </div>
      </Link>
    );
  }

  if (bentoStyle === 'side') {
    return (
      <Link
        href={`/blog/${post.slug}`}
        className="w-full h-full glass-panel-social rounded-[1.5rem] overflow-hidden group cursor-pointer flex flex-col text-left"
      >
        <div className="flex-1 min-h-0 overflow-hidden">
          <img src={image} alt={post.title} className="w-full h-full object-cover" />
        </div>
        <div className="shrink-0 p-4">
          <h4 className="text-sm font-extrabold text-on-surface line-clamp-2 leading-snug">
            {post.title}
          </h4>
        </div>
      </Link>
    );
  }

  // compact
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="w-full h-full glass-panel-social rounded-[1.5rem] overflow-hidden group cursor-pointer flex flex-col text-left"
    >
      <div className="h-[55%] overflow-hidden">
        <img src={image} alt={post.title} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 p-4 flex flex-col justify-between">
        <div>
          <h4 className="text-sm font-extrabold text-on-surface line-clamp-2 leading-snug">
            {post.title}
          </h4>
        </div>
        <p className="text-[10px] text-secondary/80 font-medium mt-1">
          {formatDate(post.publishedAt)}
        </p>
      </div>
    </Link>
  );
}

interface BlogContentProps {
  initialPosts?: BlogPostListItem[];
  initialTotal?: number;
}

export function BlogContent({ initialPosts = [], initialTotal = 0 }: BlogContentProps) {
  const [posts, setPosts] = useState<BlogPostListItem[]>(initialPosts);
  const [loading, setLoading] = useState(initialPosts.length === 0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialPosts.length < initialTotal);

  const fetchPosts = useCallback(async (pageNum: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/blog?page=${pageNum}&limit=18`);
      if (res.ok) {
        const data = await res.json();
        const incoming: BlogPostListItem[] = data.data?.posts ?? data.posts ?? [];
        setPosts((prev) => (pageNum === 1 ? incoming : [...prev, ...incoming]));
        const total: number = data.data?.pagination?.total ?? data.total ?? 0;
        setHasMore(incoming.length === 18 && pageNum * 18 < total);
      }
    } catch {
      /* non-critical */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (posts.length === 0) fetchPosts(1);
  }, [fetchPosts, posts.length]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchPosts(next);
  };

  if (loading && posts.length === 0) {
    return (
      <div className="space-y-6">
        <div className="rounded-[1.5rem] bg-white/40 animate-pulse" style={{ height: '460px' }} />
        <div className="flex gap-6">
          <div
            className="flex-1 rounded-[1.5rem] bg-white/40 animate-pulse"
            style={{ height: '320px' }}
          />
          <div
            className="flex-1 rounded-[1.5rem] bg-white/40 animate-pulse"
            style={{ height: '320px' }}
          />
        </div>
        <div className="flex gap-6">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="flex-1 rounded-[1.5rem] bg-white/40 animate-pulse"
              style={{ height: '240px' }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!loading && posts.length === 0) {
    return (
      <div className="glass-panel-social rounded-[2rem] p-12 text-center">
        <p className="text-secondary font-medium">No posts yet</p>
        <p className="text-sm text-secondary mt-1">
          Check back soon for quilt design tips and tutorials.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-extrabold text-on-surface tracking-tight">From the Blog</h2>
        <span className="text-xs font-medium text-secondary hidden sm:block">
          Tap any post to preview
        </span>
      </div>

      {/* Bento layout */}
      <div className="space-y-6">
        {/* Row 1: Full-width hero */}
        {posts.length > 0 && (
          <div style={{ height: '460px' }}>
            <BentoCard post={posts[0]} bentoStyle="hero" />
          </div>
        )}

        {/* Row 2: Two equal tall cards */}
        {posts.length > 1 && (
          <div className="flex gap-6">
            {posts.slice(1, 3).map((post) => (
              <div key={post.id} className="flex-1" style={{ height: '320px' }}>
                <BentoCard post={post} bentoStyle="tall" />
              </div>
            ))}
          </div>
        )}

        {/* Row 3: Three equal compact cards */}
        {posts.length > 3 && (
          <div className="flex gap-6">
            {posts.slice(3, 6).map((post) => (
              <div key={post.id} className="flex-1" style={{ height: '240px' }}>
                <BentoCard post={post} bentoStyle="compact" />
              </div>
            ))}
          </div>
        )}

        {/* Row 4: Wide (3/5) + tall (2/5) */}
        {posts.length > 6 && (
          <div className="flex gap-6">
            <div className="flex-[3]" style={{ height: '300px' }}>
              <BentoCard post={posts[6]} bentoStyle="wide" />
            </div>
            {posts[7] && (
              <div className="flex-[2]" style={{ height: '300px' }}>
                <BentoCard post={posts[7]} bentoStyle="tall" />
              </div>
            )}
          </div>
        )}

        {/* Row 5: Tall (2/5) + wide (3/5) */}
        {posts.length > 8 && (
          <div className="flex gap-6">
            {posts[8] && (
              <div className="flex-[2]" style={{ height: '300px' }}>
                <BentoCard post={posts[8]} bentoStyle="tall" />
              </div>
            )}
            {posts[9] && (
              <div className="flex-[3]" style={{ height: '300px' }}>
                <BentoCard post={posts[9]} bentoStyle="wide" />
              </div>
            )}
          </div>
        )}

        {/* Remaining: 4-column grid */}
        {posts.length > 10 && (
          <div className="grid grid-cols-4 gap-6">
            {posts.slice(10).map((post) => (
              <div key={post.id} style={{ height: '200px' }}>
                <BentoCard post={post} bentoStyle="compact" />
              </div>
            ))}
          </div>
        )}
      </div>

      {hasMore && !loading && (
        <div className="flex justify-center pt-2">
          <button
            onClick={loadMore}
            className="glass-panel-social px-8 py-3 rounded-full font-bold text-on-surface hover:bg-white/80 transition-all text-sm"
          >
            Load more posts
          </button>
        </div>
      )}

      {/* Submit your story CTA */}
      <div className="glass-card p-10 text-center mt-16 rounded-2xl">
        <h3 className="text-lg font-semibold text-on-surface mb-2">Got a story to share?</h3>
        <p className="text-secondary mb-4 max-w-md mx-auto">
          We love hearing about your quilting journey — a finished project, a lesson learned, a
          technique you swear by. Submit your story and we might feature it here.
        </p>
        <a
          href={`mailto:${SUPPORT_EMAIL}?subject=Blog%20Submission`}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary text-on-primary font-medium hover:opacity-90 transition-opacity"
        >
          Submit Your Story
        </a>
      </div>
    </div>
  );
}
