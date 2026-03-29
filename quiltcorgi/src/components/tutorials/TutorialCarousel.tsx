'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import type { TutorialFrontmatter } from '@/lib/mdx-schemas';

interface TutorialCarouselProps {
  readonly tutorials: readonly TutorialFrontmatter[];
}

export function TutorialCarousel({ tutorials }: TutorialCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % tutorials.length);
  }, [tutorials.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + tutorials.length) % tutorials.length);
  }, [tutorials.length]);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
  }, []);

  // Auto-advance slides
  useEffect(() => {
    if (!isAutoPlaying || tutorials.length <= 1) return;

    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, nextSlide, tutorials.length]);

  if (tutorials.length === 0) return null;

  const currentTutorial = tutorials[currentIndex];

  return (
    <div
      className="relative w-full"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      {/* Featured Label */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-2 h-2 rounded-full bg-warm-peach animate-pulse"></div>
        <span className="text-label-lg font-semibold text-primary uppercase tracking-wider">
          Featured Tutorial
        </span>
        <div className="flex-1 h-px bg-gradient-to-r from-outline-variant to-transparent"></div>
      </div>

      {/* Main Carousel Card */}
      <Link href={`/tutorials/${currentTutorial.slug}`} className="group block">
        <div
          className="relative flex flex-col lg:flex-row bg-surface-container rounded-3xl overflow-hidden 
                       hover:bg-surface-container-high transition-all duration-500 
                       hover:shadow-elevation-4 border border-outline-variant/50
                       hover:border-outline-variant"
          style={{ minHeight: '420px' }}
        >
          {/* Left side — warm gradient with decorative quilt grid */}
          <div className="relative w-full lg:w-[40%] h-64 lg:h-auto overflow-hidden bg-gradient-to-br from-warm-peach to-warm-golden flex items-center justify-center">
            <div className="w-24 h-24 grid grid-cols-3 gap-1">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="rounded-sm bg-white/40" />
              ))}
            </div>

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent lg:bg-gradient-to-r"></div>
          </div>

          {/* Right side - Content */}
          <div className="flex-1 flex flex-col justify-center p-8 lg:p-12">
            {/* Time estimate */}
            <div className="flex items-center gap-2 mb-4">
              <svg
                className="w-5 h-5 text-warm-peach"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-body-md text-secondary font-semibold">
                {currentTutorial.estimatedTime} read
              </span>
            </div>

            {/* Title */}
            <h2
              className="text-headline-md lg:text-headline-lg font-bold text-on-surface 
                          group-hover:text-primary transition-colors mb-4"
            >
              {currentTutorial.title}
            </h2>

            {/* Description */}
            <p className="text-body-lg text-secondary leading-relaxed mb-6">
              {currentTutorial.description}
            </p>

            {/* CTA Button */}
            <div className="flex items-center gap-3">
              <span
                className="inline-flex items-center px-6 py-3 bg-primary text-primary-on 
                              rounded-full font-semibold group-hover:bg-primary-dark transition-colors"
              >
                Start Learning
                <svg
                  className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </Link>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        {/* Dots */}
        <div className="flex items-center gap-2">
          {tutorials.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`transition-all duration-300 rounded-full
                ${
                  index === currentIndex
                    ? 'w-8 h-2 bg-primary'
                    : 'w-2 h-2 bg-outline-variant hover:bg-secondary'
                }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Arrow buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={prevSlide}
            className="w-12 h-12 rounded-full bg-surface-container border border-outline-variant/50
                     flex items-center justify-center hover:bg-surface-container-high 
                     hover:border-outline-variant transition-all"
            aria-label="Previous tutorial"
          >
            <svg
              className="w-5 h-5 text-secondary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            onClick={nextSlide}
            className="w-12 h-12 rounded-full bg-primary text-primary-on
                     flex items-center justify-center hover:bg-primary-dark transition-all"
            aria-label="Next tutorial"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="mt-4 h-1 bg-surface-container-high rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${((currentIndex + 1) / tutorials.length) * 100}%` }}
        />
      </div>
    </div>
  );
}
