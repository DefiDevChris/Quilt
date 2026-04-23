'use client';

import { useState, useEffect, useCallback } from 'react';
import { COLORS, darkenHex } from '@/lib/design-system';
import { SHOP_IMAGERY } from '@/lib/shop-imagery';

const slides = [
  {
    id: 1,
    image: SHOP_IMAGERY.fabricByYard,
    title: 'Spring Collection',
    subtitle: 'New this season',
    description: 'Fresh prints for fresh projects.',
    cta: 'Shop the collection',
    href: '#new',
  },
  {
    id: 2,
    image: SHOP_IMAGERY.featuredStore,
    title: 'Design Your Own Quilt',
    subtitle: 'The Design Studio',
    description: 'Sketch it, swap fabrics, take home a pattern.',
    cta: 'Open the studio',
    href: '/design-studio',
  },
  {
    id: 3,
    image: SHOP_IMAGERY.fabricShopShelves,
    title: 'Fresh Arrivals',
    subtitle: 'Just in',
    description: 'New bolts from the designers we love.',
    cta: 'Browse new fabrics',
    href: '#new',
  },
  {
    id: 4,
    image: SHOP_IMAGERY.fabricCollection,
    title: 'Essential Solids',
    subtitle: 'Do yourself a solid',
    description: 'Timeless basics that play well with everything.',
    cta: 'Shop the basics',
    href: '#kits',
  },
];

export default function ShopHeroSlideshow() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
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
    <section
      className="relative w-full overflow-hidden"
      style={{ height: '85vh', minHeight: '600px' }}
    >
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          {/* Right side — image */}
          <div className="absolute top-0 right-0 bottom-0 w-full md:w-[60%]">
            <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" />
          </div>

          {/* Left fade overlay — soft blend from solid bg to transparent */}
          <div
            className="absolute inset-0 z-10 pointer-events-none hidden md:block"
            style={{
              background: `linear-gradient(to right, ${COLORS.bg} 30%, ${COLORS.bg}f0 40%, ${COLORS.bg}b0 48%, ${COLORS.bg}66 55%, ${COLORS.bg}1a 62%, transparent 72%)`,
            }}
          />

          {/* Mobile overlay */}
          <div
            className="absolute inset-0 z-10 pointer-events-none md:hidden"
            style={{
              background: `linear-gradient(to right, ${COLORS.bg}f5 0%, ${COLORS.bg}dd 40%, ${COLORS.bg}88 70%, transparent 100%)`,
            }}
          />

          {/* Text content — left side */}
          <div className="absolute inset-0 z-20 flex items-center">
            <div className="max-w-7xl mx-auto px-8 sm:px-12 lg:px-16 w-full">
              <div className="max-w-md">
                <p
                  className="text-lg italic mb-4"
                  style={{
                    color: COLORS.primary,
                    fontFamily: 'var(--font-display)',
                  }}
                >
                  {slide.subtitle}
                </p>
                <h2
                  className="text-5xl md:text-6xl lg:text-7xl mb-6 leading-tight"
                  style={{
                    fontFamily: 'var(--font-display)',
                    color: COLORS.text,
                  }}
                >
                  {slide.title}
                </h2>
                <p className="text-lg mb-8" style={{ color: COLORS.textDim }}>
                  {slide.description}
                </p>
                <a
                  href={slide.href}
                  className="inline-block px-10 py-3.5 rounded-full font-semibold transition-colors shadow-sm text-base"
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
        </div>
      ))}

      {/* Dots indicator — positioned above promo strip with clear padding */}
      <div className="absolute bottom-16 left-0 right-0 flex justify-center space-x-3 z-30">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className="rounded-full transition-all duration-300"
            style={{
              height: '8px',
              width: index === currentSlide ? '28px' : '8px',
              backgroundColor: index === currentSlide ? COLORS.primary : `${COLORS.text}33`,
            }}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Promo strip — fully opaque to remove hard edge with image behind */}
      <div
        className="absolute bottom-0 left-0 right-0 px-4 py-3 text-center text-sm font-medium z-30"
        style={{
          backgroundColor: COLORS.surface,
          color: COLORS.primary,
          borderTop: `1px solid ${COLORS.text}14`,
        }}
      >
        Free shipping on orders over $50
      </div>
    </section>
  );
}
