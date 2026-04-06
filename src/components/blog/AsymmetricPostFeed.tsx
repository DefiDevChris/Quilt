'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import type { BlogPost } from './FeaturedCarousel';

const FALLBACK_IMAGES = [
  '/images/quilts/simple_quilt_one_1775442292809.png',
  '/images/quilts/simple_quilt_three_1775442334013.png',
  '/images/quilts/studio_quilt_eight_1775440844687.png',
  '/images/quilts/studio_quilt_four_1775440582256.png',
  '/images/quilts/studio_quilt_ten_1775440971119.png',
  '/images/quilts/studio_quilt_two_1775440552376.png',
];

interface AsymmetricPostFeedProps {
  posts: BlogPost[];
}

const formatDate = (date: Date | null) => {
  if (!date) return '';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const getLayoutForIndex = (index: number) => {
  const pattern = index % 6;
  switch (pattern) {
    case 0:
      return 'md:col-span-2 md:row-span-2';
    case 1:
      return 'md:col-span-1 md:row-span-2';
    case 2:
      return 'md:col-span-1 md:row-span-1';
    case 3:
      return 'md:col-span-1 md:row-span-1';
    case 4:
      return 'md:col-span-2 md:row-span-1';
    case 5:
      return 'md:col-span-1 md:row-span-1';
    default:
      return 'md:col-span-1 md:row-span-1';
  }
};

export default function AsymmetricPostFeed({ posts }: AsymmetricPostFeedProps) {
  if (!posts || posts.length === 0) return null;

  return (
    <div className="max-w-6xl mx-auto px-6 pb-16" style={{ backgroundColor: '#FAFAF7' }}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {posts.map((post, index) => {
          const layoutClass = getLayoutForIndex(index);
          const imageUrl = post.featuredImageUrl || FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
          const isLarge = index % 6 === 0;

          return (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-20px' }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className={`group ${layoutClass}`}
            >
              <Link href={`/blog/${post.slug}`} className="block w-full h-full">
                <article className="w-full h-full flex flex-col">
                  <div
                    className="relative overflow-hidden"
                    style={{
                      borderRadius: 2,
                      flex: isLarge ? 'none' : '1 0 auto',
                      minHeight: isLarge ? '280px' : '200px',
                    }}
                  >
                    <img
                      src={imageUrl}
                      alt={post.title}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500"
                      style={{ transform: 'scale(1)' }}
                    />
                  </div>

                  <div className="pt-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="text-[10px] font-medium uppercase tracking-[0.15em]"
                        style={{ color: '#888' }}
                      >
                        {post.category}
                      </span>
                      <span className="w-4 h-px" style={{ backgroundColor: '#E67E22' }} />
                      <span className="text-[10px] text-[#888]">{formatDate(post.createdAt)}</span>
                    </div>

                    <h3
                      className="text-[#1a1a1a] font-normal leading-tight font-serif"
                      style={{
                        fontFamily: 'Cormorant Garamond, Georgia, serif',
                        fontSize: isLarge ? '1.5rem' : '1.1rem',
                      }}
                    >
                      {post.title}
                    </h3>
                  </div>
                </article>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
