'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import type { BlogPost } from './FeaturedCarousel';

const FALLBACK = [
  '/images/quilts/simple_quilt_one_1775442292809.png',
  '/images/quilts/simple_quilt_three_1775442334013.png',
  '/images/quilts/studio_quilt_eight_1775440844687.png',
  '/images/quilts/studio_quilt_four_1775440582256.png',
  '/images/quilts/studio_quilt_ten_1775440971119.png',
  '/images/quilts/studio_quilt_two_1775440552376.png',
];

// Clean asymmetric grid - varied sizes without messy overlaps
const GRID_CONFIG: Array<{
  col: string;
  row: string;
  h: string;
  mobileH: string;
}> = [
    { col: 'md:col-span-2', row: 'md:row-span-2', h: 'md:h-[520px]', mobileH: 'h-[300px]' },
    { col: 'md:col-span-1', row: 'md:row-span-1', h: 'md:h-[250px]', mobileH: 'h-[250px]' },
    { col: 'md:col-span-1', row: 'md:row-span-2', h: 'md:h-[520px]', mobileH: 'h-[350px]' },
    { col: 'md:col-span-1', row: 'md:row-span-1', h: 'md:h-[250px]', mobileH: 'h-[250px]' },
    { col: 'md:col-span-2', row: 'md:row-span-1', h: 'md:h-[250px]', mobileH: 'h-[250px]' },
    { col: 'md:col-span-1', row: 'md:row-span-1', h: 'md:h-[250px]', mobileH: 'h-[250px]' },
    { col: 'md:col-span-1', row: 'md:row-span-2', h: 'md:h-[520px]', mobileH: 'h-[350px]' },
    { col: 'md:col-span-1', row: 'md:row-span-1', h: 'md:h-[250px]', mobileH: 'h-[250px]' },
    { col: 'md:col-span-1', row: 'md:row-span-1', h: 'md:h-[250px]', mobileH: 'h-[250px]' },
    { col: 'md:col-span-3', row: 'md:row-span-1', h: 'md:h-[280px]', mobileH: 'h-[280px]' },
    { col: 'md:col-span-1', row: 'md:row-span-1', h: 'md:h-[250px]', mobileH: 'h-[250px]' },
    { col: 'md:col-span-2', row: 'md:row-span-1', h: 'md:h-[250px]', mobileH: 'h-[250px]' },
  ];

export default function AsymmetricPostFeed({ posts }: { posts: BlogPost[] }) {
  if (!posts?.length) return null;

  return (
    <section className="relative w-full py-16 md:py-24">
      <motion.header
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-[1400px] mx-auto px-6 md:px-12 mb-12 md:mb-16"
      >
        <div className="flex items-center gap-4 mb-4">
          <span className="w-12 h-px bg-primary-golden" />
          <span className="text-[10px] uppercase tracking-[0.25em] text-warm-text-muted font-medium">
            Stories
          </span>
        </div>
        <h2
          className="text-4xl md:text-5xl lg:text-6xl text-on-surface tracking-[-0.02em]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Recent Explorations
        </h2>
      </motion.header>

      <div className="max-w-[1400px] mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 auto-rows-auto">
          {posts.map((post, i) => {
            const layout = GRID_CONFIG[i % GRID_CONFIG.length];
            const img = post.featuredImageUrl || FALLBACK[i % FALLBACK.length];
            return <PostCard key={post.id} post={post} img={img} layout={layout} index={i} />;
          })}
        </div>
      </div>
    </section>
  );
}

function PostCard({
  post,
  img,
  layout,
  index,
}: {
  post: BlogPost;
  img: string;
  layout: (typeof GRID_CONFIG)[number];
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: 0.6,
        delay: index * 0.05,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={`${layout.col} ${layout.row} group`}
    >
      <Link href={`/blog/${post.slug}`} className="block h-full">
        <article className={`h-full flex flex-col ${layout.mobileH} ${layout.h}`}>
          {/* Image container - shadow intensifies on hover only */}
          <div className="relative overflow-hidden flex-1 rounded-2xl transition-shadow duration-300 group-hover:shadow-elevation-2 shadow-elevation-1">
            <img src={img} alt={post.title} loading="lazy" className="w-full h-full object-cover" />
          </div>

          {/* Content */}
          <div className="pt-4 md:pt-5">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[9px] uppercase tracking-[0.2em] text-primary-golden font-medium">
                {post.category}
              </span>
              <span className="w-4 h-px bg-outline-variant" />
              <time className="text-[9px] uppercase tracking-[0.15em] text-warm-text-muted">
                {post.createdAt?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </time>
            </div>

            <h3
              className="text-on-surface leading-[1.15] tracking-[-0.01em] group-hover:text-primary-golden transition-colors duration-300"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize:
                  layout.col.includes('col-span-2') || layout.col.includes('col-span-3')
                    ? 'clamp(1.5rem, 2.5vw, 2rem)'
                    : 'clamp(1.125rem, 1.5vw, 1.375rem)',
              }}
            >
              {post.title}
            </h3>
          </div>
        </article>
      </Link>
    </motion.div>
  );
}
