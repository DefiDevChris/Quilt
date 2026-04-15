'use client';

import { ArrowRight } from 'lucide-react';
import { COLORS } from '@/lib/design-system';

const categories = [
  { id: 1, name: 'Quilt Kits', href: '#kits', image: '/images/shop/quilt-patterns.jpg', bgFallback: '#22c55e33' },
  { id: 2, name: 'Wide Backing', href: '#categories', image: '/images/shop/batting-backing.jpg', bgFallback: '#eab30833' },
  { id: 3, name: 'Fabric by the Yard', href: '#fabrics', image: '/images/shop/fabric-by-yard.jpg', bgFallback: '#3b82f633' },
  { id: 4, name: 'Precuts', href: '#categories', image: '/images/shop/fabric-collection.jpg', bgFallback: '#a855f733' },
  { id: 5, name: 'Thread & Bobbins', href: '#categories', image: '/images/shop/quilting-thread.jpg', bgFallback: '#22c55e33' },
  { id: 6, name: 'Notions', href: '#categories', image: '/images/shop/quilting-notions.jpg', bgFallback: '#eab30833' },
];

export default function Categories() {
  return (
    <section id="categories" className="py-20 lg:py-28" style={{ backgroundColor: COLORS.surface }}>
      <div className="w-full px-6 lg:px-12">
        {/* Header */}
        <div className="mb-12">
          <span
            className="text-xs uppercase tracking-widest mb-3 block"
            style={{ color: COLORS.textDim, fontFamily: 'var(--font-display)' }}
          >
            Shop by Category
          </span>
          <h2
            className="text-4xl lg:text-5xl"
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 300,
              color: COLORS.text,
              fontStyle: 'italic',
            }}
          >
            Find your next project
          </h2>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {categories.map((category) => (
            <a
              key={category.id}
              href={category.href}
              className="group relative rounded-[24px] overflow-hidden"
              style={{ aspectRatio: '16/10' }}
            >
              {/* Background Image */}
              <div className="absolute inset-0">
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).parentElement!.style.backgroundColor = category.bgFallback;
                  }}
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(to top, ${COLORS.text}99, ${COLORS.text}33, transparent)`,
                  }}
                />
              </div>

              {/* Content */}
              <div className="absolute inset-0 flex flex-col justify-end p-4 lg:p-6">
                <h3
                  className="text-lg lg:text-2xl font-light mb-2"
                  style={{
                    fontFamily: 'var(--font-display)',
                    color: COLORS.surface,
                  }}
                >
                  {category.name}
                </h3>
                <span
                  className="inline-flex items-center text-sm transition-colors"
                  style={{ color: `${COLORS.surface}cc` }}
                >
                  Shop now
                  <ArrowRight className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" strokeWidth={1.5} />
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
