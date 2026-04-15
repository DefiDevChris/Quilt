'use client';

import { ArrowRight } from 'lucide-react';
import { COLORS, darkenHex } from '@/lib/design-system';

export default function FeaturedCollection() {
  return (
    <section className="py-20 lg:py-28" style={{ backgroundColor: COLORS.bg }}>
      <div className="w-full px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Image */}
          <div className="relative">
            <div className="aspect-[4/5] rounded-[32px] overflow-hidden">
              <img
                src="/images/shop/fabric-shop-shelves.jpg"
                alt="Featured Collection"
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement!.style.backgroundColor = `${COLORS.primary}20`;
                }}
              />
            </div>
            {/* Decorative element */}
            <div
              className="absolute -bottom-6 -right-6 w-32 h-32 rounded-full -z-10"
              style={{ backgroundColor: `${COLORS.primary}26`, filter: 'blur(40px)' }}
            />
          </div>

          {/* Content */}
          <div className="lg:pl-8">
            <span
              className="text-xs uppercase tracking-widest mb-4 block"
              style={{ color: COLORS.textDim, fontFamily: 'var(--font-display)' }}
            >
              Featured Collection
            </span>
            <h2
              className="text-4xl lg:text-6xl mb-6"
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 300,
                color: COLORS.text,
                fontStyle: 'italic',
              }}
            >
              Seaside Stitches
            </h2>
            <p
              className="text-lg leading-relaxed mb-8 max-w-md"
              style={{ color: COLORS.textDim }}
            >
              Soft denim blues, weathered stripes, and sun-bleached neutrals—designed
              for quilts that feel like vacation. Each fabric tells a story of
              coastal mornings and salty breezes.
            </p>
            <a
              href="#fabrics"
              className="inline-flex items-center px-8 py-3.5 text-sm font-medium rounded-full transition-colors duration-200 group"
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
              Explore the collection
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" strokeWidth={1.5} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
