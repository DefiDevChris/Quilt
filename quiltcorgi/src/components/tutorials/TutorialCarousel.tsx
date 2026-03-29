'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { TutorialFrontmatter } from '@/lib/mdx-schemas';

interface TutorialCarouselProps {
  readonly tutorials: readonly TutorialFrontmatter[];
}

const DIFFICULTY_STYLES = {
  beginner: 'bg-green-100/90 text-green-800 border-green-200',
  intermediate: 'bg-amber-100/90 text-amber-800 border-amber-200',
  advanced: 'bg-red-100/90 text-red-800 border-red-200',
} as const;

const DIFFICULTY_LABELS = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
} as const;

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
      <Link
        href={`/tutorials/${currentTutorial.slug}`}
        className="group block"
      >
        <div className="relative flex flex-col lg:flex-row bg-surface-container rounded-3xl overflow-hidden 
                       hover:bg-surface-container-high transition-all duration-500 
                       hover:shadow-elevation-4 border border-outline-variant/50
                       hover:border-outline-variant"
             style={{ minHeight: '420px' }}
        >
          {/* Left side - Large Image */}
          <div className="relative w-full lg:w-[60%] h-64 lg:h-auto overflow-hidden">
            {currentTutorial.featuredImage ? (
              <Image
                src={currentTutorial.featuredImage}
                alt={currentTutorial.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 1024px) 100vw, 60vw"
                priority
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-surface-container-high to-surface-container-highest 
                            flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <svg
                      className="w-10 h-10 text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            )}
            
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent lg:bg-gradient-to-r"></div>
            
            {/* Difficulty badge */}
            <div className="absolute top-6 left-6">
              <span
                className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold 
                           border shadow-lg backdrop-blur-sm bg-white/95
                           ${DIFFICULTY_STYLES[currentTutorial.difficulty]}`}
              >
                {DIFFICULTY_LABELS[currentTutorial.difficulty]}
              </span>
            </div>
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
            <h2 className="text-headline-md lg:text-headline-lg font-bold text-on-surface 
                          group-hover:text-primary transition-colors mb-4">
              {currentTutorial.title}
            </h2>

            {/* Description */}
            <p className="text-body-lg text-secondary leading-relaxed mb-6">
              {currentTutorial.description}
            </p>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-8">
              {currentTutorial.tags.slice(0, 5).map((tag) => (
                <span
                  key={tag}
                  className="text-body-sm text-secondary bg-surface-container-highest 
                            px-3 py-1.5 rounded-full border border-outline-variant/30"
                >
                  #{tag}
                </span>
              ))}
            </div>

            {/* CTA Button */}
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center px-6 py-3 bg-primary text-primary-on 
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
                ${index === currentIndex 
                  ? 'w-8 h-2 bg-primary' 
                  : 'w-2 h-2 bg-outline-variant hover:bg-secondary'}`}
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
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
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
