'use client';

import { useEffect, useState, useCallback } from 'react';
import { COLORS, SHADOW } from '@/lib/design-system';
import { QuiltPieceRow } from '@/components/decorative/QuiltPiece';

const HERO_IMAGES = [
  { src: '/images/shop/hero-fabric-drapes.jpg', alt: 'Flowing fabric drapes' },
  { src: '/images/shop/fabric-shop-shelves.jpg', alt: 'Fabric shop shelves' },
  { src: '/images/shop/fabric-collection.jpg', alt: 'Fabric collection display' },
];

const CYCLE_INTERVAL = 8000;
const FADE_DURATION = 1200;

export default function ShopHeroSlideshow({
  onBrowseClick,
  onCategoryClick,
}: {
  onBrowseClick: () => void;
  onCategoryClick: () => void;
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  const advance = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % HERO_IMAGES.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(advance, CYCLE_INTERVAL);
    return () => clearInterval(timer);
  }, [advance]);

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ height: 'calc(100vh - 200px)', minHeight: '500px', maxHeight: '800px' }}
    >
      {/* Background slides */}
      {HERO_IMAGES.map((image, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-opacity"
          style={{
            opacity: i === activeIndex ? 1 : 0,
            transitionDuration: `${FADE_DURATION}ms`,
            transitionTimingFunction: 'ease-in-out',
          }}
        >
          <img src={image.src} alt={image.alt} className="w-full h-full object-cover" />
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0" style={{ backgroundColor: 'rgba(26, 26, 26, 0.35)' }} />
        </div>
      ))}

      {/* Content overlay */}
      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <div className="text-center px-6 max-w-4xl">
          <div className="flex items-center justify-center gap-3 mb-8">
            <QuiltPieceRow count={3} size={12} gap={5} />
          </div>
          <h1
            className="text-[48px] sm:text-[56px] md:text-[64px] leading-[1.1] font-semibold mb-6"
            style={{ fontFamily: 'var(--font-display)', color: '#ffffff' }}
          >
            Fabric Shop
          </h1>
          <p
            className="text-xl mb-10 max-w-2xl mx-auto leading-relaxed"
            style={{ color: 'rgba(255, 255, 255, 0.9)' }}
          >
            Discover our curated collection of premium quilting fabrics, pre-cuts, and notions
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button
              onClick={onBrowseClick}
              className="px-8 py-3 rounded-full font-semibold transition-colors duration-150"
              style={{
                backgroundColor: '#ffffff',
                color: COLORS.primary,
                boxShadow: SHADOW.brand,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = COLORS.bg)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
            >
              Browse Fabrics
            </button>
            <button
              onClick={onCategoryClick}
              className="px-8 py-3 rounded-full font-semibold transition-colors duration-150 border-2"
              style={{ borderColor: '#ffffff', color: '#ffffff' }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)')
              }
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              Shop by Category
            </button>
          </div>
        </div>
      </div>

      {/* Slide indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3">
        {HERO_IMAGES.map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === activeIndex ? '32px' : '10px',
              height: '10px',
              backgroundColor: i === activeIndex ? '#ffffff' : 'rgba(255,255,255,0.5)',
            }}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
