'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

const FALLBACK_IMAGES = [
  '/images/quilts/gallery_quilt_one_1775440540412.png',
  '/images/quilts/gallery_quilt_five_1775440598069.png',
  '/images/quilts/gallery_quilt_nine_1775440876043.png',
  '/images/quilts/gallery_quilt_seven_1775440703829.png',
];

interface FeaturedCarouselProps {
  posts: BlogPost[];
}

export default function FeaturedCarousel({ posts }: FeaturedCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const nextSlide = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % posts.length);
  }, [posts.length]);

  const prevSlide = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + posts.length) % posts.length);
  }, [posts.length]);

  useEffect(() => {
    if (!isHovered) {
      const timer = setInterval(nextSlide, 8000);
      return () => clearInterval(timer);
    }
  }, [isHovered, nextSlide]);

  if (!posts || posts.length === 0) return null;

  const currentPost = posts[currentIndex];
  const imageUrl =
    currentPost.featuredImageUrl || FALLBACK_IMAGES[currentIndex % FALLBACK_IMAGES.length];

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div
      className="relative w-full h-[70vh] min-h-[500px] flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: '#FAFAF7' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0"
        >
          <div className="absolute inset-0">
            <img
              src={imageUrl}
              alt=""
              className="w-full h-full object-cover"
              style={{ filter: 'grayscale(20%) brightness(0.9)' }}
            />
          </div>
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to right, rgba(250,250,247,0.95) 0%, rgba(250,250,247,0.6) 50%, rgba(250,250,247,0.3) 100%)',
            }}
          />
        </motion.div>
      </AnimatePresence>

      <AnimatePresence initial={false}>
        <motion.div
          key={`content-${currentIndex}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative z-10 max-w-3xl mx-auto px-8 text-center"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <span
              className="text-xs font-medium uppercase tracking-[0.2em]"
              style={{ color: '#666' }}
            >
              {currentPost.category}
            </span>
            <span className="w-6 h-px" style={{ backgroundColor: '#E67E22' }} />
            <span className="text-xs text-[#666]">{formatDate(currentPost.createdAt)}</span>
          </div>

          <Link href={`/blog/${currentPost.slug}`}>
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-normal text-[#1a1a1a] mb-4 leading-[1.15]"
              style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}
            >
              {currentPost.title}
            </h1>
          </Link>

          {currentPost.excerpt && (
            <p className="text-base text-[#555] max-w-xl mx-auto leading-relaxed">
              {currentPost.excerpt}
            </p>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-1.5">
        {posts.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              setDirection(i > currentIndex ? 1 : -1);
              setCurrentIndex(i);
            }}
            className="h-px transition-all duration-500"
            style={{
              width: i === currentIndex ? 32 : 8,
              backgroundColor: i === currentIndex ? '#1a1a1a' : '#ccc',
            }}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
