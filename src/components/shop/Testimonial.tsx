'use client';

import { useState, useEffect } from 'react';
import { COLORS } from '@/lib/design-system';
import { SHOP_IMAGERY } from '@/lib/shop-imagery';

const TESTIMONIALS = [
  {
    id: 1,
    quote:
      "The quality of the precuts made piecing so much faster—and the colors are even prettier in person. I get compliments on my quilts everywhere I go!",
    author: 'Amber R.',
    subtext: 'Quilter since 2019',
    image: SHOP_IMAGERY.fabricByYard,
    bgColor: `${COLORS.secondary}33`,
  },
  {
    id: 2,
    quote:
      "QuiltCorgi's collections have completely transformed my quilting process. The colors are always perfectly curated, and I love showing them off.",
    author: 'Eleanor H.',
    subtext: 'Master Quilter',
    image: SHOP_IMAGERY.fabricCollection,
    bgColor: `${COLORS.primary}20`,
  },
  {
    id: 3,
    quote:
      "I've never felt so inspired. The moment I unboxed my fabric, I had to fire up the sewing machine. The quality is simply unmatched.",
    author: 'Sarah M.',
    subtext: 'Quilter since 2021',
    image: SHOP_IMAGERY.quiltingThread,
    bgColor: '#e8f4f8',
  },
];

export default function Testimonial() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((current) => (current + 1) % TESTIMONIALS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const activeTestimonial = TESTIMONIALS[activeIndex];

  return (
    <section 
      className="py-24 transition-colors duration-1000 ease-in-out" 
      style={{ backgroundColor: activeTestimonial.bgColor }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center gap-12 lg:gap-20">
          <div className="w-full md:w-1/2">
            {/* Stars */}
            <div className="flex space-x-1 mb-6">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className="w-5 h-5 fill-current"
                  style={{ color: COLORS.primary }}
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            
            <div className="relative min-h-[160px] flex items-center">
              {TESTIMONIALS.map((t, i) => (
                <p
                  key={t.id}
                  className="text-2xl md:text-3xl leading-relaxed absolute inset-0 transition-opacity duration-1000 ease-in-out flex items-center"
                  style={{
                    fontFamily: 'var(--font-heading)',
                    color: COLORS.text,
                    opacity: i === activeIndex ? 1 : 0,
                    pointerEvents: i === activeIndex ? 'auto' : 'none',
                  }}
                >
                  &ldquo;{t.quote}&rdquo;
                </p>
              ))}
            </div>

            <div className="relative min-h-[30px] mt-8 mb-8">
              {TESTIMONIALS.map((t, i) => (
                <p 
                  key={`author-${t.id}`}
                  className="text-base absolute inset-0 transition-opacity duration-1000 ease-in-out" 
                  style={{ 
                    color: COLORS.textDim,
                    opacity: i === activeIndex ? 1 : 0,
                  }}
                >
                  <span className="font-semibold" style={{ color: COLORS.text }}>
                    {t.author}
                  </span>
                  <span className="mx-2">·</span>
                  {t.subtext}
                </p>
              ))}
            </div>

            <div className="flex items-center gap-6 mt-8">
              <a
                href="#fabrics"
                className="inline-block px-8 py-3 rounded-full font-semibold transition-colors shadow-sm text-base"
                style={{
                  backgroundColor: COLORS.text,
                  color: COLORS.surface,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.primary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.text;
                }}
              >
                Shop the collection
              </a>

              {/* Indicators */}
              <div className="flex gap-2">
                {TESTIMONIALS.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveIndex(idx)}
                    className="w-2.5 h-2.5 rounded-full transition-all duration-300"
                    style={{
                      backgroundColor: idx === activeIndex ? COLORS.primary : `${COLORS.primary}40`,
                      transform: idx === activeIndex ? 'scale(1.2)' : 'scale(1)',
                    }}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="w-full md:w-1/2">
            <div
              className="relative aspect-square rounded-lg overflow-hidden shadow-sm"
              style={{ backgroundColor: `${COLORS.primary}10` }}
            >
              {TESTIMONIALS.map((t, idx) => (
                <img
                  key={t.id}
                  src={t.image}
                  alt={`Testimonial from ${t.author}`}
                  className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out"
                  style={{
                    opacity: idx === activeIndex ? 1 : 0,
                  }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
