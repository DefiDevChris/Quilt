'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, animate, PanInfo } from 'framer-motion';
import Link from 'next/link';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featuredImageUrl: string | null;
  category: string;
  createdAt: Date | null;
  authorName: string | null;
  authorAvatarUrl: string | null;
}

const FALLBACK = [
  '/images/quilts/gallery_quilt_one_1775440540412.png',
  '/images/quilts/gallery_quilt_five_1775440598069.png',
  '/images/quilts/gallery_quilt_nine_1775440876043.png',
  '/images/quilts/gallery_quilt_seven_1775440703829.png',
];

export default function FeaturedCarousel({ posts }: { posts: BlogPost[] }) {
  const [active, setActive] = useState(0);
  const [isInteracting, setIsInteracting] = useState(false);
  const x = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  const slides = posts.slice(0, 4);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!slides.length) return null;

  const snapTo = (index: number) => {
    animate(x, -index * width, { type: 'spring', stiffness: 280, damping: 32 });
    setActive(index);
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const threshold = width / 4;
    const velocity = info.velocity.x;
    const offset = info.offset.x;

    if (Math.abs(velocity) > 400 || Math.abs(offset) > threshold) {
      const dir = offset > 0 ? -1 : 1;
      const next = Math.max(0, Math.min(slides.length - 1, active + dir));
      snapTo(next);
    } else {
      snapTo(active);
    }
  };

  return (
    <section className="relative w-full h-screen overflow-hidden bg-surface">
      <motion.div
        ref={containerRef}
        drag="x"
        dragConstraints={{ left: -(slides.length - 1) * width, right: 0 }}
        dragElastic={0.15}
        onDragStart={() => setIsInteracting(true)}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className="flex h-full cursor-grab active:cursor-grabbing"
      >
        {slides.map((post, i) => {
          const img = post.featuredImageUrl || FALLBACK[i % FALLBACK.length];
          return <Slide key={post.id} post={post} img={img} index={i} x={x} width={width} />;
        })}
      </motion.div>

      {/* Indicators - only visible on interaction */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isInteracting ? 1 : 0 }}
        transition={{ duration: 0.4 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-end gap-3 z-20"
      >
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => snapTo(i)}
            className="h-px transition-all duration-500 ease-out"
            style={{
              width: i === active ? 48 : 20,
              backgroundColor: i === active ? 'var(--color-on-surface)' : 'rgba(58, 46, 38, 0.25)',
            }}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </motion.div>
    </section>
  );
}

function Slide({
  post,
  img,
  index,
  x,
  width,
}: {
  post: BlogPost;
  img: string;
  index: number;
  x: ReturnType<typeof useMotionValue<number>>;
  width: number;
}) {
  const imageX = useMotionValue(0);

  useEffect(() => {
    const unsubscribe = x.on('change', (latest) => {
      const slideOffset = -index * width;
      const progress = (latest - slideOffset) / width;
      imageX.set(progress * 30);
    });
    return unsubscribe;
  }, [x, index, width, imageX]);

  return (
    <article className="relative min-w-full h-full flex items-center">
      {/* Image layer with parallax */}
      <motion.div style={{ x: imageX }} className="absolute inset-0 will-change-transform">
        <img
          src={img}
          alt=""
          className="w-full h-full object-cover"
          loading={index === 0 ? 'eager' : 'lazy'}
        />
      </motion.div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-surface via-surface/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-surface/40 via-transparent to-transparent" />

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 + index * 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 px-8 md:px-16 lg:px-24 max-w-2xl"
      >
        <div className="flex items-center gap-4 mb-8">
          <span className="text-[10px] uppercase tracking-[0.25em] text-warm-text-muted font-medium">
            {post.category}
          </span>
          <span className="w-6 h-px bg-primary-golden" />
          <time className="text-[10px] uppercase tracking-[0.15em] text-warm-text-muted">
            {post.createdAt?.toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </time>
        </div>

        <Link href={`/blog/${post.slug}`} className="group block">
          <h2
            className="text-5xl md:text-6xl lg:text-7xl text-on-surface leading-[1.05] tracking-[-0.02em] mb-6 transition-opacity group-hover:opacity-70"
            style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
          >
            {post.title}
          </h2>
        </Link>

        {post.excerpt && (
          <p className="text-base md:text-lg text-secondary leading-relaxed max-w-md font-light">
            {post.excerpt}
          </p>
        )}
      </motion.div>
    </article>
  );
}
