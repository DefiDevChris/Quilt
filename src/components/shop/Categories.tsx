'use client';

import { COLORS } from '@/lib/design-system';
import { SHOP_IMAGERY } from '@/lib/shop-imagery';

const categories = [
  { id: 1, name: 'Quilt Kits', href: '/shop/catalog?category=kits', image: SHOP_IMAGERY.fabricCollection },
  { id: 2, name: 'Wide Backing', href: '/shop/catalog?category=by-the-yard', image: SHOP_IMAGERY.fabricByYard },
  { id: 3, name: 'Fabric', href: '/shop/catalog', image: SHOP_IMAGERY.featuredStore },
  { id: 4, name: 'Precuts', href: '/shop/catalog?category=jelly-rolls', image: SHOP_IMAGERY.charmPacks },
  { id: 5, name: 'Thread & Bobbins', href: '/shop/catalog?category=thread', image: SHOP_IMAGERY.quiltingThread },
  { id: 6, name: 'Notions', href: '/shop/catalog?category=notions', image: SHOP_IMAGERY.jellyRolls },
];

export default function Categories() {
  return (
    <section id="categories" className="py-20" style={{ backgroundColor: COLORS.bg }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2
            className="text-3xl md:text-4xl mb-3"
            style={{
              fontFamily: 'var(--font-heading)',
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
                  className="h-full w-full object-cover"
                  style={{ objectPosition: 'right center' }}
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
                className="text-xs font-semibold transitions-colors duration-150 group-hover:text-primary"
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
