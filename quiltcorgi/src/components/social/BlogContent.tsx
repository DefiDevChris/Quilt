'use client';

import { useState, useEffect, useCallback } from 'react';
import type { BlogPostListItem } from '@/types/community';
import { useSocialQuickView } from '@/stores/socialQuickViewStore';

function formatDate(date: Date | string | null): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Bento grid size pattern — repeats every 9 posts
const BENTO_PATTERN = [
  { col: 'md:col-span-2', row: 'md:row-span-2', style: 'hero' as const },
  { col: 'md:col-span-1', row: 'md:row-span-1', style: 'side' as const },
  { col: 'md:col-span-1', row: 'md:row-span-1', style: 'side' as const },
  { col: 'md:col-span-1', row: 'md:row-span-1', style: 'compact' as const },
  { col: 'md:col-span-1', row: 'md:row-span-1', style: 'compact' as const },
  { col: 'md:col-span-1', row: 'md:row-span-1', style: 'compact' as const },
  { col: 'md:col-span-2', row: 'md:row-span-1', style: 'wide' as const },
  { col: 'md:col-span-1', row: 'md:row-span-2', style: 'tall' as const },
  { col: 'md:col-span-2', row: 'md:row-span-1', style: 'wide' as const },
];

type BentoStyle = 'hero' | 'side' | 'compact' | 'wide' | 'tall';

function AuthorRow({ post, dark = false }: { post: BlogPostListItem; dark?: boolean }) {
  const textClass = dark ? 'text-white/75' : 'text-slate-500';
  const nameClass = dark ? 'font-bold text-white' : 'font-bold text-slate-700';
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

function BentoCard({
  post,
  bentoStyle,
  onOpen,
}: {
  post: BlogPostListItem;
  bentoStyle: BentoStyle;
  onOpen: () => void;
}) {
  const image = post.featuredImageUrl || '/images/quilts/quilt_01_bed_geometric.png';

  if (bentoStyle === 'hero') {
    return (
      <button
        onClick={onOpen}
        className="relative w-full h-full rounded-[1.5rem] overflow-hidden group cursor-pointer text-left"
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
      </button>
    );
  }

  if (bentoStyle === 'wide') {
    return (
      <button
        onClick={onOpen}
        className="w-full h-full glass-panel-social rounded-[1.5rem] overflow-hidden group cursor-pointer flex text-left"
      >
        <div className="w-2/5 shrink-0 overflow-hidden">
          <img src={image} alt={post.title} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 p-5 flex flex-col justify-between">
          <div>
            <h4 className="text-base font-extrabold text-slate-800 mb-1.5 line-clamp-2 leading-snug">
              {post.title}
            </h4>
            {post.excerpt && (
              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{post.excerpt}</p>
            )}
          </div>
          <AuthorRow post={post} />
        </div>
      </button>
    );
  }

  if (bentoStyle === 'tall') {
    return (
      <button
        onClick={onOpen}
        className="w-full h-full glass-panel-social rounded-[1.5rem] overflow-hidden group cursor-pointer flex flex-col text-left"
      >
        <div className="flex-1 min-h-0 overflow-hidden">
          <img src={image} alt={post.title} className="w-full h-full object-cover" />
        </div>
        <div className="shrink-0 p-5">
          <h4 className="text-base font-extrabold text-slate-800 mb-3 line-clamp-3 leading-snug">
            {post.title}
          </h4>
          <AuthorRow post={post} />
        </div>
      </button>
    );
  }

  if (bentoStyle === 'side') {
    return (
      <button
        onClick={onOpen}
        className="w-full h-full glass-panel-social rounded-[1.5rem] overflow-hidden group cursor-pointer flex flex-col text-left"
      >
        <div className="flex-1 min-h-0 overflow-hidden">
          <img src={image} alt={post.title} className="w-full h-full object-cover" />
        </div>
        <div className="shrink-0 p-4">
          <h4 className="text-sm font-extrabold text-slate-800 line-clamp-2 leading-snug">
            {post.title}
          </h4>
        </div>
      </button>
    );
  }

  // compact
  return (
    <button
      onClick={onOpen}
      className="w-full h-full glass-panel-social rounded-[1.5rem] overflow-hidden group cursor-pointer flex flex-col text-left"
    >
      <div className="h-[55%] overflow-hidden">
        <img src={image} alt={post.title} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 p-4 flex flex-col justify-between">
        <div>
          <h4 className="text-sm font-extrabold text-slate-800 line-clamp-2 leading-snug">
            {post.title}
          </h4>
        </div>
        <p className="text-[10px] text-slate-500 font-medium mt-1">
          {formatDate(post.publishedAt)}
        </p>
      </div>
    </button>
  );
}

interface BlogContentProps {
  initialPosts?: BlogPostListItem[];
  initialTotal?: number;
}

export function BlogContent({ initialPosts = [], initialTotal = 0 }: BlogContentProps) {
  const { open } = useSocialQuickView();
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchPosts(next);
  };

  const openModal = (post: BlogPostListItem) =>
    open({
      type: 'blog',
      slug: post.slug,
      title: post.title,
      imageUrl: post.featuredImageUrl,
      authorName: post.authorName,
      authorAvatarUrl: post.authorAvatarUrl ?? null,
      excerpt: post.excerpt,
      category: post.category,
      readTimeMinutes: post.readTimeMinutes,
      publishedAt: post.publishedAt,
    });

  if (loading && posts.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 md:[grid-auto-rows:220px] gap-4">
        {BENTO_PATTERN.map((p, i) => (
          <div
            key={i}
            className={`${p.col} ${p.row} rounded-[1.5rem] bg-white/40 animate-pulse min-h-[180px] md:min-h-0`}
          />
        ))}
      </div>
    );
  }

  if (!loading && posts.length === 0) {
    return (
      <div className="glass-panel-social rounded-[2rem] p-12 text-center">
        <p className="text-slate-600 font-medium">No posts yet</p>
        <p className="text-sm text-slate-400 mt-1">
          Check back soon for quilt design tips and tutorials.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">From the Blog</h2>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider hidden sm:block">
          Tap any post to preview
        </span>
      </div>

      {/* Asymmetric bento grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 md:[grid-auto-rows:220px] gap-4">
        {posts.map((post, idx) => {
          const pattern = BENTO_PATTERN[idx % BENTO_PATTERN.length];
          return (
            <div key={post.id} className={`${pattern.col} ${pattern.row} min-h-[200px] md:min-h-0`}>
              <BentoCard post={post} bentoStyle={pattern.style} onOpen={() => openModal(post)} />
            </div>
          );
        })}
        {loading &&
          BENTO_PATTERN.slice(0, 3).map((p, i) => (
            <div
              key={`sk-${i}`}
              className={`${p.col} ${p.row} rounded-[1.5rem] bg-white/40 animate-pulse min-h-[180px] md:min-h-0`}
            />
          ))}
      </div>

      {hasMore && !loading && (
        <div className="flex justify-center pt-2">
          <button
            onClick={loadMore}
            className="glass-panel-social px-8 py-3 rounded-full font-bold text-slate-700 hover:bg-white/80 transition-all text-sm"
          >
            Load more posts
          </button>
        </div>
      )}
    </div>
  );
}
