'use client';

import { COLORS } from '@/lib/design-system';

const categories = [
  { id: 1, name: 'Fabric', href: '#fabrics', image: '/images/shop/fabric-by-yard.jpg' },
  { id: 2, name: 'Precuts', href: '#categories', image: '/images/shop/fabric-collection.jpg' },
  { id: 3, name: 'Quilt Kits', href: '#kits', image: '/images/shop/quilt-patterns.jpg' },
  { id: 4, name: 'Thread', href: '#categories', image: '/images/shop/quilting-thread.jpg' },
  { id: 5, name: 'Batting', href: '#categories', image: '/images/shop/batting-backing.jpg' },
  { id: 6, name: 'Notions', href: '#categories', image: '/images/shop/quilting-notions.jpg' },
];

export default function Categories() {
  return (
    <section id="categories" className="py-16" style={{ backgroundColor: COLORS.bg }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-3 md:grid-cols-6 gap-8">
          {categories.map((category) => (
            <a
              key={category.id}
              href={category.href}
              className="group flex flex-col items-center text-center"
            >
              <div
                className="relative w-full aspect-square rounded-full overflow-hidden shadow-sm mb-4 border-4 border-transparent group-hover:border-secondary transition-all duration-300"
                style={{ backgroundColor: COLORS.surface }}
              >
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).parentElement!.style.backgroundColor = `${COLORS.primary}20`;
                  }}
                />
              </div>
              <h3
                className="font-bold uppercase tracking-wider text-sm group-hover:text-primary transition-colors"
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
