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

function PostCard({ post }: { post: CommunityPost }) {
  return (
    <div className="aspect-square rounded-xl bg-gradient-to-br from-warm-peach to-warm-golden flex items-center justify-center overflow-hidden">
      {post.thumbnailUrl ? (
        <div
          className="w-full h-full bg-center bg-cover"
          style={{ backgroundImage: `url(${post.thumbnailUrl})` }}
        />
      ) : (
        <div className="w-3/4 h-3/4 grid grid-cols-2 gap-1">
          {[...Array(4)].map((_, j) => (
            <div key={j} className="rounded-sm bg-white/40" />
          ))}
        </div>
      )}
    </div>
  );
}

function PlaceholderGrid() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="aspect-square rounded-xl bg-gradient-to-br from-warm-peach to-warm-golden flex items-center justify-center"
        >
          <div className="w-3/4 h-3/4 grid grid-cols-2 gap-1">
            {[...Array(4)].map((_, j) => (
              <div key={j} className="rounded-sm bg-white/40" />
            ))}
          </div>
        </div>
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
            <div className="glass-panel rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3
                  className="font-bold text-warm-text"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Community Gallery
                </h3>
                <span className="text-sm text-warm-text-muted">Latest designs</span>
              </div>
              {hasPosts ? (
                <div className="grid grid-cols-3 gap-3">
                  {posts.slice(0, 6).map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              ) : (
                <PlaceholderGrid />
              )}
            </div>

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
              className="inline-block bg-warm-surface text-warm-text font-semibold px-8 py-4 rounded-full shadow-sm hover:shadow-md transition-shadow"
            >
              See the Gallery
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
