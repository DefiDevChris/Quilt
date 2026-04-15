'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { COLORS, darkenHex } from '@/lib/design-system';

const slides = [
  {
    id: 1,
    image: '/images/shop/hero-fabric-drapes.jpg',
    title: 'Spring Collection',
    subtitle: 'NEW COLLECTION',
    cta: 'SHOP NOW',
    href: '#new',
  },
  {
    id: 2,
    image: '/images/shop/fabric-shop-shelves.jpg',
    title: 'Fresh Arrivals',
    subtitle: 'FRESH ARRIVALS',
    cta: 'SHOP NOW',
    href: '#new',
  },
  {
    id: 3,
    image: '/images/shop/fabric-collection.jpg',
    title: 'Essential Solids',
    subtitle: 'ESSENTIAL SOLIDS',
    cta: 'BROWSE KITS',
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
    <section className="relative w-full overflow-hidden border-b" style={{ borderColor: `${COLORS.text}1a` }}>
      {/* Slides */}
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`transition-opacity duration-1000 ${
            index === currentSlide ? 'opacity-100' : 'opacity-0 hidden'
          }`}
          style={{ height: '400px' }}
        >
          <div className="relative w-full h-full">
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover"
            />
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(to right, ${COLORS.surface}f2, ${COLORS.surface}cc, transparent)`,
              }}
            />
          </div>

          {/* Content */}
          <div className="absolute inset-0 flex items-center max-w-7xl mx-auto px-8 sm:px-12 lg:px-16">
            <div className="max-w-lg">
              <p
                className="font-bold tracking-widest uppercase text-sm mb-4"
                style={{ color: COLORS.primary }}
              >
                {slide.subtitle}
              </p>
              <h2
                className="text-5xl md:text-6xl mb-6 leading-tight"
                style={{
                  fontFamily: 'var(--font-display)',
                  color: COLORS.text,
                }}
              >
                {slide.title}
              </h2>
              <a
                href={slide.href}
                className="inline-block px-10 py-3.5 rounded-full font-bold tracking-wide transition-colors shadow-sm"
                style={{
                  backgroundColor: COLORS.primary,
                  color: COLORS.surface,
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
      ))}

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full text-white hover:bg-white/30 transition-colors"
        style={{
          backgroundColor: `${COLORS.surface}33`,
          backdropFilter: 'blur(8px)',
        }}
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-6 h-6" strokeWidth={1.5} />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full text-white hover:bg-white/30 transition-colors"
        style={{
          backgroundColor: `${COLORS.surface}33`,
          backdropFilter: 'blur(8px)',
        }}
        aria-label="Next slide"
      >
        <ChevronRight className="w-6 h-6" strokeWidth={1.5} />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center space-x-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className="rounded-full transition-all duration-300"
            style={{
              height: '12px',
              width: index === currentSlide ? '32px' : '12px',
              backgroundColor: index === currentSlide ? COLORS.primary : `${COLORS.surface}cc`,
            }}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
