'use client';

import { COLORS } from '@/lib/design-system';

const categories = [
  { id: 1, name: 'Fabric', href: '#fabrics', image: '/images/shop/fabric-by-yard.jpg' },
  { id: 2, name: 'Precuts', href: '#categories', image: '/images/shop/fabric-collection.jpg' },
  { id: 3, name: 'Quilt Kits', href: '#kits', image: '/images/shop/featured-store.jpg' },
  { id: 4, name: 'Thread', href: '#categories', image: '/images/shop/quilting-thread.jpg' },
  { id: 5, name: 'Batting', href: '#categories', image: '/images/shop/fabric-collection.jpg' },
  { id: 6, name: 'Notions', href: '#categories', image: '/images/shop/quilting-thread.jpg' },
];

export default function Categories() {
  return (
    <section id="categories" className="py-20" style={{ backgroundColor: COLORS.bg }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2
            className="text-3xl md:text-4xl mb-3"
            style={{
              fontFamily: 'var(--font-display)',
              color: COLORS.text,
            }}
          >
            Shop by category
          </h2>
          <p className="text-base" style={{ color: COLORS.textDim }}>
            Fabric, thread, kits, and every tool in between.
          </p>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-6 md:gap-8">
          {categories.map((category) => (
            <a
              key={category.id}
              href={category.href}
              className="group flex flex-col items-center text-center"
            >
              <div
                className="relative w-full aspect-square rounded-full overflow-hidden mb-4 transition-colors duration-150"
                style={{
                  backgroundColor: COLORS.surface,
                  boxShadow: '0 1px 2px rgba(26,26,26,0.08)',
                }}
              >
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).parentElement!.style.backgroundColor =
                      `${COLORS.primary}20`;
                  }}
                />
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 rounded-full"
                  style={{
                    boxShadow: `inset 0 0 0 3px ${COLORS.primary}`,
                  }}
                />
              </div>
              <h3
                className="font-bold uppercase tracking-wider text-xs group-hover:text-primary transition-colors duration-150"
                style={{ color: COLORS.text }}
              >
                {category.name}
              </h3>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
