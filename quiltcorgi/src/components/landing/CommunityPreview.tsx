'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Mascot from './Mascot';

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

function PostCard({ post, index }: { post: CommunityPost; index: number }) {
  return (
    <div className="aspect-square rounded-xl bg-white border border-warm-border/60 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {post.thumbnailUrl ? (
        <div
          className="w-full h-full bg-center bg-cover"
          style={{ backgroundImage: `url(${post.thumbnailUrl})` }}
        />
      ) : (
        <QuiltThumbnail quilt={GALLERY_QUILTS[index % GALLERY_QUILTS.length]} />
      )}
    </div>
  );
}

/* Mini quilt patterns for the placeholder gallery — each is a unique design */
const GALLERY_QUILTS: { name: string; grid: string[][]; cols: number }[] = [
  {
    name: 'Ohio Star',
    cols: 3,
    grid: [
      ['#FFF5E6', '#C67B5C', '#FFF5E6'],
      ['#C67B5C', '#FFB085', '#C67B5C'],
      ['#FFF5E6', '#C67B5C', '#FFF5E6'],
    ],
  },
  {
    name: 'Log Cabin',
    cols: 4,
    grid: [
      ['#8B5E3C', '#8B5E3C', '#D4A574', '#D4A574'],
      ['#8B5E3C', '#C67B5C', '#C67B5C', '#D4A574'],
      ['#FFF5E6', '#C67B5C', '#C67B5C', '#8B5E3C'],
      ['#FFF5E6', '#FFF5E6', '#8B5E3C', '#8B5E3C'],
    ],
  },
  {
    name: 'Irish Chain',
    cols: 5,
    grid: [
      ['#5B7F5B', '#FFF5E6', '#5B7F5B', '#FFF5E6', '#5B7F5B'],
      ['#FFF5E6', '#5B7F5B', '#FFF5E6', '#5B7F5B', '#FFF5E6'],
      ['#5B7F5B', '#FFF5E6', '#5B7F5B', '#FFF5E6', '#5B7F5B'],
      ['#FFF5E6', '#5B7F5B', '#FFF5E6', '#5B7F5B', '#FFF5E6'],
      ['#5B7F5B', '#FFF5E6', '#5B7F5B', '#FFF5E6', '#5B7F5B'],
    ],
  },
  {
    name: 'Nine Patch',
    cols: 3,
    grid: [
      ['#7EB5D6', '#FFF5E6', '#7EB5D6'],
      ['#FFF5E6', '#7EB5D6', '#FFF5E6'],
      ['#7EB5D6', '#FFF5E6', '#7EB5D6'],
    ],
  },
  {
    name: 'Rail Fence',
    cols: 4,
    grid: [
      ['#9B4F5A', '#D4A574', '#FFF5E6', '#9B4F5A'],
      ['#FFF5E6', '#9B4F5A', '#D4A574', '#FFF5E6'],
      ['#D4A574', '#FFF5E6', '#9B4F5A', '#D4A574'],
      ['#9B4F5A', '#D4A574', '#FFF5E6', '#9B4F5A'],
    ],
  },
  {
    name: 'Pinwheel',
    cols: 4,
    grid: [
      ['#E8B84B', '#FFF5E6', '#FFF5E6', '#E8B84B'],
      ['#FFF5E6', '#E8B84B', '#E8B84B', '#FFF5E6'],
      ['#FFF5E6', '#E8B84B', '#E8B84B', '#FFF5E6'],
      ['#E8B84B', '#FFF5E6', '#FFF5E6', '#E8B84B'],
    ],
  },
];

function QuiltThumbnail({ quilt }: { quilt: (typeof GALLERY_QUILTS)[number] }) {
  return (
    <div className="aspect-square rounded-xl bg-white border border-warm-border/60 p-2 shadow-sm hover:shadow-md transition-shadow">
      <div
        className="w-full h-full grid gap-[1px] rounded-md overflow-hidden"
        style={{ gridTemplateColumns: `repeat(${quilt.cols}, 1fr)` }}
      >
        {quilt.grid.flat().map((color, i) => (
          <div key={i} className="aspect-square" style={{ backgroundColor: color }} />
        ))}
      </div>
    </div>
  );
}

function PlaceholderGrid() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {GALLERY_QUILTS.map((quilt) => (
        <QuiltThumbnail key={quilt.name} quilt={quilt} />
      ))}
    </div>
  );
}

export default function CommunityPreview() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    async function fetchPosts() {
      try {
        const response = await fetch('/api/community?limit=6&sort=newest', {
          signal: controller.signal,
        });
        if (!response.ok) {
          setIsLoading(false);
          return;
        }
        const json: CommunityResponse = await response.json();
        if (!cancelled && json.success) {
          setPosts(json.data.posts);
        }
      } catch {
        // Silently fall back to placeholder grid
      } finally {
        clearTimeout(timeoutId);
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchPosts();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  const hasPosts = !isLoading && posts.length > 0;

  return (
    <section className="px-6 lg:px-12 py-16 lg:py-24 bg-gradient-to-b from-warm-surface/50 to-transparent">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left - Community preview */}
          <div className="relative order-2 lg:order-1">
            <div className="flex items-center justify-between mb-4">
              <h3
                className="font-bold text-warm-text"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Community Gallery
              </h3>
              <span className="text-sm text-warm-text-muted">Latest designs</span>
            </div>
            {hasPosts ? (
              <div className="grid grid-cols-3 gap-4">
                {posts.slice(0, 6).map((post, i) => (
                  <PostCard key={post.id} post={post} index={i} />
                ))}
              </div>
            ) : (
              <PlaceholderGrid />
            )}

            {/* Mascots around community section */}
            <div className="absolute -top-12 -right-8 hidden lg:block">
              <Mascot pose="wagging" size="lg" />
            </div>
            <div className="absolute -bottom-8 -left-8 hidden lg:block">
              <Mascot pose="sleeping" size="lg" />
            </div>
          </div>

          {/* Right - Text */}
          <div className="space-y-6 order-1 lg:order-2">
            <div className="flex items-center gap-4">
              <Mascot pose="begging" size="lg" />
              <h2
                className="text-3xl md:text-4xl font-bold text-warm-text"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Quilters Who Get It
              </h2>
            </div>
            <p className="text-lg text-warm-text-secondary leading-relaxed">
              Share your latest designs, discover inspiration from fellow quilters, and pick up new
              techniques along the way. Whether it&apos;s your first quilt or your fiftieth,
              there&apos;s always something new to learn and someone to cheer you on.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="glass-panel rounded-xl p-4 flex items-center gap-3">
                <Image
                  src="/icons/quilt-13-dashed-squares-Photoroom.png"
                  alt="Quilt blocks"
                  width={36}
                  height={36}
                  className="object-contain flex-shrink-0"
                />
                <div>
                  <div
                    className="text-2xl font-bold text-warm-peach"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    659+
                  </div>
                  <div className="text-sm text-warm-text-secondary">Quilt blocks</div>
                </div>
              </div>
              <div className="glass-panel rounded-xl p-4 flex items-center gap-3">
                <Image
                  src="/icons/quilt-12-ruler-Photoroom.png"
                  alt="Layout ruler"
                  width={36}
                  height={36}
                  className="object-contain flex-shrink-0"
                />
                <div>
                  <div
                    className="text-2xl font-bold text-warm-peach"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    6
                  </div>
                  <div className="text-sm text-warm-text-secondary">Layout modes</div>
                </div>
              </div>
              <div className="glass-panel rounded-xl p-4 flex items-center gap-3">
                <Image
                  src="/icons/quilt-02-needle-Photoroom.png"
                  alt="Needle"
                  width={36}
                  height={36}
                  className="object-contain flex-shrink-0"
                />
                <div>
                  <div
                    className="text-2xl font-bold text-warm-peach"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    10+
                  </div>
                  <div className="text-sm text-warm-text-secondary">Tutorials</div>
                </div>
              </div>
              <div className="glass-panel rounded-xl p-4 flex items-center gap-3">
                <Image
                  src="/icons/quilt-10-pincushion-Photoroom.png"
                  alt="Pincushion"
                  width={36}
                  height={36}
                  className="object-contain flex-shrink-0"
                />
                <div>
                  <div
                    className="text-2xl font-bold text-warm-peach"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    4
                  </div>
                  <div className="text-sm text-warm-text-secondary">Worktables</div>
                </div>
              </div>
            </div>

            <Link
              href="/socialthreads"
              className="inline-block bg-[var(--color-primary)] text-[var(--color-primary-on)] font-bold px-8 py-4 rounded-full shadow-lg hover:bg-[var(--color-primary-dark)] transition-all"
            >
              See the Gallery
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
