'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { COLORS, darkenHex } from '@/lib/design-system';

const slides = [
  {
    id: 1,
    image: '/images/hero-collection-1.jpg',
    title: 'Spring Collection',
    subtitle: 'Fresh fabrics for your next project',
    cta: 'Explore Now',
    href: '#new',
  },
  {
    id: 2,
    image: '/images/hero-collection-2.jpg',
    title: 'Stitch Your Story',
    subtitle: 'Curated cottons, precuts, and patterns',
    cta: 'Shop New Arrivals',
    href: '#new',
  },
  {
    id: 3,
    image: '/images/hero-collection-3.jpg',
    title: 'Cozy Creations',
    subtitle: 'From our studio to your sewing table',
    cta: 'Browse Kits',
    href: '#kits',
  },
];

export default function ShopHeroSlideshow() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, []);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(nextSlide, 6000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, nextSlide]);

  return (
    <section className="relative w-full h-screen overflow-hidden">
      {/* Slides */}
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          {/* Background Image */}
          <div className="absolute inset-0">
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover"
            />
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(to right, ${COLORS.text}66, ${COLORS.text}33, transparent)`,
              }}
            />
          </div>

          {/* Content */}
          <div className="relative z-20 h-full flex items-center">
            <div className="w-full px-6 lg:px-12">
              <div className="max-w-xl">
                <span
                  className="inline-block px-4 py-1.5 mb-6 text-xs uppercase tracking-widest rounded-full"
                  style={{
                    backgroundColor: COLORS.primary,
                    color: COLORS.surface,
                    fontFamily: 'var(--font-display)',
                  }}
                >
                  New Collection
                </span>
                <h1
                  className="text-5xl lg:text-7xl leading-tight mb-4"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 300,
                    color: COLORS.surface,
                    fontStyle: 'italic',
                  }}
                >
                  {slide.title}
                </h1>
                <p
                  className="text-lg lg:text-xl mb-8"
                  style={{ color: `${COLORS.surface}e6`, fontWeight: 300 }}
                >
                  {slide.subtitle}
                </p>
                <a
                  href={slide.href}
                  className="inline-flex items-center px-8 py-3.5 text-sm font-medium rounded-full transition-colors duration-200"
                  style={{
                    backgroundColor: COLORS.primary,
                    color: COLORS.text,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = darkenHex(COLORS.primary, 0.1);
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = COLORS.primary;
                  }}
                >
                  {slide.cta}
                </a>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full text-white hover:bg-white/30 transition-colors"
        style={{
          backgroundColor: `${COLORS.surface}20`,
          backdropFilter: 'blur(8px)',
        }}
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-6 h-6" strokeWidth={1.5} />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full text-white hover:bg-white/30 transition-colors"
        style={{
          backgroundColor: `${COLORS.surface}20`,
          backdropFilter: 'blur(8px)',
        }}
        aria-label="Next slide"
      >
        <ChevronRight className="w-6 h-6" strokeWidth={1.5} />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex space-x-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className="rounded-full transition-all duration-300"
            style={{
              height: '10px',
              width: index === currentSlide ? '32px' : '10px',
              backgroundColor: index === currentSlide ? COLORS.surface : `${COLORS.surface}80`,
            }}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 right-8 z-30 hidden lg:block">
        <span
          className="text-xs uppercase tracking-widest"
          style={{ color: `${COLORS.surface}b3`, fontFamily: 'var(--font-display)' }}
        >
          Scroll to explore
        </span>
      </div>
    </section>
  );
}
