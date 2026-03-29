'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSocialQuickView, type QuickViewItem } from '@/stores/socialQuickViewStore';

interface CommunityPost {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  likeCount: number;
  commentCount: number;
  category: string;
  createdAt: string;
  creatorName: string;
  creatorUsername: string | null;
  creatorAvatarUrl: string | null;
  isLikedByUser: boolean;
  isSavedByUser: boolean;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featuredImageUrl: string | null;
  category: string;
  authorName: string;
  authorAvatarUrl: string | null;
  readTimeMinutes: number;
  publishedAt: string | null;
}

type FeaturedItem = ({ kind: 'post' } & CommunityPost) | ({ kind: 'blog' } & BlogPost);

function SpotlightCard({ item, onOpen }: { item: FeaturedItem; onOpen: () => void }) {
  const image =
    item.kind === 'post'
      ? (item.thumbnailUrl ?? '/images/quilts/quilt_06_wall_art.png')
      : (item.featuredImageUrl ?? '/images/quilts/quilt_06_wall_art.png');
  const description = item.kind === 'post' ? item.description : item.excerpt;
  const creator = item.kind === 'post' ? item.creatorName : item.authorName;

  return (
    <button
      onClick={onOpen}
      className="w-full relative rounded-[2rem] overflow-hidden group cursor-pointer text-left"
      style={{ minHeight: 380 }}
    >
      <img src={image} alt={item.title} className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-8 z-10">
        <div className="mb-3">
          <span className="text-white/55 text-xs font-medium">Editor&apos;s Pick</span>
        </div>
        <h2 className="text-3xl font-extrabold text-white leading-tight mb-3 tracking-tight">
          {item.title}
        </h2>
        {description && (
          <p className="text-white/70 text-sm line-clamp-2 mb-4 leading-relaxed max-w-xl">
            {description}
          </p>
        )}
        <p className="text-white/65 text-sm font-semibold">{creator}</p>
      </div>
    </button>
  );
}

function MediumCard({ item, onOpen }: { item: FeaturedItem; onOpen: () => void }) {
  const image =
    item.kind === 'post'
      ? (item.thumbnailUrl ?? '/images/quilts/quilt_01_bed_geometric.png')
      : (item.featuredImageUrl ?? '/images/quilts/quilt_01_bed_geometric.png');
  const creator = item.kind === 'post' ? item.creatorName : item.authorName;

  return (
    <button
      onClick={onOpen}
      className="w-full glass-panel-social rounded-[1.5rem] overflow-hidden group cursor-pointer flex flex-col text-left h-full"
    >
      <div className="h-44 overflow-hidden shrink-0">
        <img src={image} alt={item.title} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 p-4 flex flex-col">
        <h4 className="font-extrabold text-slate-800 text-sm leading-snug mb-2 line-clamp-2">
          {item.title}
        </h4>
        <p className="text-xs text-slate-500 font-medium mt-auto">{creator}</p>
      </div>
    </button>
  );
}

function WideCard({ item, onOpen }: { item: FeaturedItem; onOpen: () => void }) {
  const image =
    item.kind === 'post'
      ? (item.thumbnailUrl ?? '/images/quilts/quilt_02_bed_hexagon.png')
      : (item.featuredImageUrl ?? '/images/quilts/quilt_02_bed_hexagon.png');
  const description = item.kind === 'post' ? item.description : item.excerpt;
  const creator = item.kind === 'post' ? item.creatorName : item.authorName;

  return (
    <button
      onClick={onOpen}
      className="w-full glass-panel-social rounded-[1.5rem] overflow-hidden group cursor-pointer flex text-left"
    >
      <div className="w-56 shrink-0 overflow-hidden">
        <img src={image} alt={item.title} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 p-5 flex flex-col justify-between">
        <div>
          <h4 className="font-extrabold text-slate-800 text-base mb-1.5 leading-snug line-clamp-2">
            {item.title}
          </h4>
          {description && (
            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{description}</p>
          )}
        </div>
        <p className="text-xs text-slate-500 font-semibold">{creator}</p>
      </div>
    </button>
  );
}

function SmallCard({ item, onOpen }: { item: FeaturedItem; onOpen: () => void }) {
  const image =
    item.kind === 'post'
      ? (item.thumbnailUrl ?? '/images/quilts/quilt_22_porch_railing.png')
      : (item.featuredImageUrl ?? '/images/quilts/quilt_22_porch_railing.png');

  return (
    <button
      onClick={onOpen}
      className="w-full glass-panel-social rounded-[1.5rem] overflow-hidden group cursor-pointer flex items-center gap-3 p-3 text-left"
    >
      <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0">
        <img src={image} alt={item.title} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <h5 className="font-extrabold text-slate-800 text-xs line-clamp-2 leading-snug">
          {item.title}
        </h5>
      </div>
    </button>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">{title}</h3>
      {subtitle && <p className="text-xs text-slate-500 font-medium mt-0.5">{subtitle}</p>}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="rounded-[2rem] bg-white/40 h-[380px]" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-[1.5rem] bg-white/40 h-52" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-[1.5rem] bg-white/40 h-32" />
        ))}
      </div>
    </div>
  );
}

export function FeaturedContent() {
  const { open } = useSocialQuickView();
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [postsRes, blogRes] = await Promise.all([
        fetch('/api/community?tab=discover&sort=newest&limit=12'),
        fetch('/api/blog?page=1&limit=6'),
      ]);
      if (postsRes.ok) {
        const data = await postsRes.json();
        setCommunityPosts(data.data?.posts ?? []);
      }
      if (blogRes.ok) {
        const data = await blogRes.json();
        setBlogPosts(data.data?.posts ?? data.posts ?? []);
      }
    } catch {
      /* non-critical */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  if (loading) return <Skeleton />;

  // Interleave community posts and blog posts
  const items: FeaturedItem[] = [];
  let pi = 0;
  let bi = 0;
  while (pi < communityPosts.length || bi < blogPosts.length) {
    if (communityPosts[pi]) items.push({ kind: 'post', ...communityPosts[pi++] });
    if (communityPosts[pi]) items.push({ kind: 'post', ...communityPosts[pi++] });
    if (blogPosts[bi]) items.push({ kind: 'blog', ...blogPosts[bi++] });
    if (communityPosts[pi]) items.push({ kind: 'post', ...communityPosts[pi++] });
  }

  const openItem = (item: FeaturedItem) => {
    if (item.kind === 'post') {
      open({
        type: 'post',
        id: item.id,
        title: item.title,
        imageUrl: item.thumbnailUrl,
        creatorName: item.creatorName,
        creatorUsername: item.creatorUsername,
        creatorAvatarUrl: item.creatorAvatarUrl,
        likeCount: item.likeCount,
        commentCount: item.commentCount,
        isSavedByUser: item.isSavedByUser,
        isLikedByUser: item.isLikedByUser,
        description: item.description,
        category: item.category,
      } satisfies QuickViewItem);
    } else {
      open({
        type: 'blog',
        slug: item.slug,
        title: item.title,
        imageUrl: item.featuredImageUrl,
        authorName: item.authorName,
        authorAvatarUrl: item.authorAvatarUrl,
        excerpt: item.excerpt,
        category: item.category,
        readTimeMinutes: item.readTimeMinutes,
        publishedAt: item.publishedAt,
      } satisfies QuickViewItem);
    }
  };

  const spotlight = items[0];
  const topFour = items.slice(1, 5);
  const widePair = items.slice(5, 7);
  const smalls = items.slice(7, 13);
  const rest = items.slice(13);

  if (!spotlight) {
    return (
      <div className="glass-panel-social rounded-[2rem] p-12 text-center">
        <p className="text-slate-600 font-medium">Nothing featured yet.</p>
        <p className="text-sm text-slate-400 mt-1">
          Check back soon for curated picks from the community.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">
            Curated Collections
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-0.5">
            The best from the community, blog, and beyond — tap to preview
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-3 text-xs font-bold text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-orange-400" />
            Community
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
            Blog
          </span>
        </div>
      </div>

      {/* Hero spotlight */}
      <SpotlightCard item={spotlight} onOpen={() => openItem(spotlight)} />

      {/* 4-up grid */}
      {topFour.length > 0 && (
        <section>
          <SectionHeader title="Editor's Picks" subtitle="Handpicked for you this week" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {topFour.map((item, i) => (
              <MediumCard key={i} item={item} onOpen={() => openItem(item)} />
            ))}
          </div>
        </section>
      )}

      {/* Wide pair */}
      {widePair.length > 0 && (
        <section>
          <SectionHeader title="From the Community" subtitle="Latest shared designs" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {widePair.map((item, i) => (
              <WideCard key={i} item={item} onOpen={() => openItem(item)} />
            ))}
          </div>
        </section>
      )}

      {/* Small cards */}
      {smalls.length > 0 && (
        <section>
          <SectionHeader title="More to Discover" />
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {smalls.map((item, i) => (
              <SmallCard key={i} item={item} onOpen={() => openItem(item)} />
            ))}
          </div>
        </section>
      )}

      {/* Rest */}
      {rest.length > 0 && (
        <section>
          <SectionHeader title="Keep Exploring" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rest.map((item, i) => (
              <MediumCard key={i} item={item} onOpen={() => openItem(item)} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
