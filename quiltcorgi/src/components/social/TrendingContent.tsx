'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Heart, TrendingUp } from 'lucide-react';

interface QuiltPin {
  image: string;
  title: string;
  creator: string;
  handle: string;
  likes: number;
  tag: string;
  aspect: string;
}

const QUILT_PINS: QuiltPin[] = [
  {
    image: '/images/quilts/quilt_06_wall_art.png',
    title: 'Mountain Sunrise',
    creator: 'Sarah Stitches',
    handle: '@sarahstitches',
    likes: 234,
    tag: '#SpringQuilts',
    aspect: 'aspect-[3/4]',
  },
  {
    image: '/images/quilts/quilt_01_bed_geometric.png',
    title: 'Geometric Dreams',
    creator: 'Modern Quilter',
    handle: '@modernquilter',
    likes: 189,
    tag: '#ModernQuilting',
    aspect: 'aspect-[4/5]',
  },
  {
    image: '/images/quilts/quilt_22_porch_railing.png',
    title: 'Summer Porch Vibes',
    creator: 'Patchwork Pam',
    handle: '@patchworkpam',
    likes: 156,
    tag: '#Patchwork',
    aspect: 'aspect-[2/3]',
  },
  {
    image: '/images/quilts/quilt_02_bed_hexagon.png',
    title: 'Hexagon Heaven',
    creator: 'Quilt Addict',
    handle: '@quiltaddict',
    likes: 142,
    tag: '#QuiltBlockDesign',
    aspect: 'aspect-[4/3]',
  },
  {
    image: '/images/quilts/quilt_03_closeup_scrappy.png',
    title: 'Scrappy Medley',
    creator: 'Sarah Stitches',
    handle: '@sarahstitches',
    likes: 98,
    tag: '#FabricLove',
    aspect: 'aspect-square',
  },
  {
    image: '/images/quilts/quilt_07_ladder_ring.png',
    title: 'Rings & Ladders',
    creator: 'Modern Quilter',
    handle: '@modernquilter',
    likes: 87,
    tag: '#HandQuilting',
    aspect: 'aspect-[3/4]',
  },
  {
    image: '/images/quilts/quilt_23_nursery_floor.png',
    title: 'Nursery Floor Art',
    creator: 'Patchwork Pam',
    handle: '@patchworkpam',
    likes: 76,
    tag: '#SpringQuilts',
    aspect: 'aspect-[4/5]',
  },
  {
    image: '/images/quilts/quilt_08_rack_cabin.png',
    title: 'Log Cabin Classic',
    creator: 'Quilt Addict',
    handle: '@quiltaddict',
    likes: 65,
    tag: '#Traditional',
    aspect: 'aspect-[4/3]',
  },
  {
    image: '/images/quilts/quilt_03_bed_modern.png',
    title: 'Modern Lines',
    creator: 'Sarah Stitches',
    handle: '@sarahstitches',
    likes: 54,
    tag: '#ModernQuilting',
    aspect: 'aspect-[4/5]',
  },
  {
    image: '/images/quilts/quilt_21_bed_unmade.png',
    title: 'Sunday Morning',
    creator: 'Quilt Addict',
    handle: '@quiltaddict',
    likes: 43,
    tag: '#Cozy',
    aspect: 'aspect-[3/4]',
  },
];

const TRENDING_TOPICS = [
  { tag: '#SpringQuilts', posts: 234 },
  { tag: '#ModernQuilting', posts: 189 },
  { tag: '#Patchwork', posts: 156 },
  { tag: '#QuiltBlockDesign', posts: 142 },
  { tag: '#FabricLove', posts: 98 },
  { tag: '#HandQuilting', posts: 87 },
];

const TRENDING_CREATORS = [
  { name: 'Sarah Stitches', handle: '@sarahstitches', followers: '12.5k' },
  { name: 'Modern Quilter', handle: '@modernquilter', followers: '8.2k' },
  { name: 'Patchwork Pam', handle: '@patchworkpam', followers: '6.7k' },
  { name: 'Quilt Addict', handle: '@quiltaddict', followers: '5.1k' },
];

function PinCard({ pin }: { pin: QuiltPin }) {
  return (
    <div className="break-inside-avoid mb-4">
      <Link
        href={`/socialthreads?tag=${encodeURIComponent(pin.tag)}`}
        className="block glass-panel-social rounded-[1.5rem] overflow-hidden glass-panel-social-hover group cursor-pointer"
      >
        <div className={`${pin.aspect} overflow-hidden`}>
          <Image src={pin.image} alt={pin.title} width={400} height={400} className="w-full h-full object-cover" />
        </div>
        <div className="p-3">
          <span className="text-[10px] font-extrabold text-orange-500 uppercase tracking-wide">
            {pin.tag}
          </span>
          <p className="text-sm font-bold text-slate-800 leading-tight mt-0.5">{pin.title}</p>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-5 h-5 rounded-full bg-gradient-to-r from-orange-300 to-rose-300 flex items-center justify-center text-white text-[8px] font-bold shrink-0">
              {pin.creator[0]}
            </div>
            <span className="text-[10px] text-slate-500 font-medium truncate">{pin.handle}</span>
            <span className="ml-auto text-[10px] text-slate-400 font-medium flex items-center gap-0.5 shrink-0">
              <Heart size={9} className="text-rose-400 fill-rose-400" /> {pin.likes}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}

function TrendingTagsCard() {
  return (
    <div className="break-inside-avoid mb-4">
      <div className="glass-panel-social rounded-[1.5rem] p-4">
        <h4 className="text-sm font-extrabold text-slate-800 mb-3 flex items-center gap-1.5">
          <span className="text-orange-400 font-black">#</span> Trending Tags
        </h4>
        <div className="space-y-2">
          {TRENDING_TOPICS.map((topic, rank) => (
            <Link
              key={topic.tag}
              href={`/socialthreads?tag=${encodeURIComponent(topic.tag)}`}
              className="flex items-center gap-2 group py-0.5"
            >
              <span className="text-xs font-black text-orange-200 group-hover:text-orange-400 transition-colors w-5 text-right shrink-0">
                #{rank + 1}
              </span>
              <span className="text-xs font-bold text-slate-700 group-hover:text-orange-500 transition-colors flex-1 truncate">
                {topic.tag}
              </span>
              <span className="text-[10px] text-slate-400 shrink-0">{topic.posts}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function TrendingCreatorsCard() {
  return (
    <div className="break-inside-avoid mb-4">
      <div className="glass-panel-social rounded-[1.5rem] p-4">
        <h4 className="text-sm font-extrabold text-slate-800 mb-3">Top Creators</h4>
        <div className="space-y-3">
          {TRENDING_CREATORS.map((creator) => (
            <div key={creator.handle} className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-300 to-rose-300 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {creator.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate">{creator.name}</p>
                <p className="text-[10px] text-orange-500 font-medium">
                  {creator.followers} followers
                </p>
              </div>
              <button className="text-[10px] font-bold bg-gradient-to-r from-orange-400 to-rose-400 text-white px-2.5 py-1 rounded-full shrink-0 hover:from-orange-500 hover:to-rose-500 transition-all">
                Follow
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CategoriesCard() {
  return (
    <div className="break-inside-avoid mb-4">
      <div className="glass-panel-social rounded-[1.5rem] p-4">
        <h4 className="text-sm font-extrabold text-slate-800 mb-3">Browse</h4>
        <div className="flex flex-wrap gap-1.5">
          {['Show & Tell', 'WIP', 'Help', 'Inspiration', 'Modern', 'Traditional', 'Art Quilts'].map(
            (cat) => (
              <Link
                key={cat}
                href={`/socialthreads?category=${encodeURIComponent(cat.toLowerCase().replace(/ /g, '-'))}`}
                className="bg-white/50 hover:bg-white/80 border border-white/60 hover:border-orange-300 px-2.5 py-1 rounded-full text-[10px] font-bold text-slate-700 hover:text-orange-600 transition-all"
              >
                {cat}
              </Link>
            )
          )}
        </div>
      </div>
    </div>
  );
}

// Builds the interleaved masonry item list
type MasonryItem = { type: 'quilt'; pin: QuiltPin } | { type: 'tags' | 'creators' | 'categories' };

function buildMasonryItems(): MasonryItem[] {
  const items: MasonryItem[] = [];
  QUILT_PINS.forEach((pin, i) => {
    items.push({ type: 'quilt', pin });
    if (i === 1) items.push({ type: 'tags' });
    if (i === 4) items.push({ type: 'creators' });
    if (i === 7) items.push({ type: 'categories' });
  });
  return items;
}

export function TrendingContent() {
  const items = buildMasonryItems();

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-full bg-gradient-to-r from-orange-400 to-rose-400 text-white shadow-md">
            <TrendingUp size={16} />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-800 tracking-tight leading-tight">
              Trending Now
            </h3>
            <p className="text-xs text-slate-500 font-medium">What the community is pinning</p>
          </div>
        </div>
        <Link
          href="/socialthreads"
          className="text-xs font-bold text-orange-500 hover:text-orange-600 bg-white/50 px-3 py-1.5 rounded-full shadow-sm transition-colors border border-white/60"
        >
          View All
        </Link>
      </div>

      {/* Pinterest Masonry Grid */}
      <div className="columns-2 gap-4">
        {items.map((item, i) => {
          if (item.type === 'quilt') return <PinCard key={i} pin={item.pin} />;
          if (item.type === 'tags') return <TrendingTagsCard key={i} />;
          if (item.type === 'creators') return <TrendingCreatorsCard key={i} />;
          if (item.type === 'categories') return <CategoriesCard key={i} />;
          return null;
        })}
      </div>
    </div>
  );
}
