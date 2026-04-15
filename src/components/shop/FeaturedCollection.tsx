'use client';

import { COLORS, darkenHex } from '@/lib/design-system';

export default function FeaturedCollection() {
  return (
    <section className="py-24" style={{ backgroundColor: COLORS.bg }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="rounded-lg overflow-hidden flex flex-col md:flex-row items-center border"
          style={{
            backgroundColor: `${COLORS.secondary}33`,
            borderColor: `${COLORS.secondary}4d`,
          }}
        >
          <div className="w-full md:w-1/2 p-12 lg:p-20 flex flex-col justify-center">
            <p
              className="text-sm font-bold tracking-widest uppercase mb-4"
              style={{ color: COLORS.primary }}
            >
              QuiltCorgi Exclusives
            </p>
            <h2
              className="text-4xl md:text-5xl mb-6 leading-tight"
              style={{
                fontFamily: 'var(--font-display)',
                color: COLORS.text,
              }}
            >
              New Fabric Collections
            </h2>
            <p className="text-lg mb-8 leading-relaxed" style={{ color: COLORS.textDim }}>
              Shop our latest original designs, created with love for your next quilting project.
              High-quality cottons in exclusive, vibrant prints.
            </p>
            <div>
              <a
                href="#fabrics"
                className="inline-block px-8 py-3.5 rounded-full font-bold tracking-wide transition-colors shadow-sm"
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
                SHOP EXCLUSIVES
              </a>
            </div>
          </div>
          <div className="w-full md:w-1/2 relative" style={{ minHeight: '700px' }}>
            <img
              src="/images/shop/fabric-shop-shelves.jpg"
              alt="Colorful fabric patterns"
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.parentElement!.style.backgroundColor = `${COLORS.primary}20`;
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
