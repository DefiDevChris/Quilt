'use client';

import { COLORS, darkenHex } from '@/lib/design-system';

interface Fabric {
  id: string;
  name: string;
  imageUrl: string;
  hex: string | null;
  collection: string | null;
  manufacturer: string | null;
  pricePerYard: string | null;
  shopifyVariantId: string | null;
  inStock: boolean;
  thumbnailUrl: string | null;
  colorFamily: string | null;
  value: string | null;
  description: string | null;
}

interface QuiltKitsProps {
  fabrics: Fabric[];
  onAddToCart: (fabric: Fabric) => void;
}

export default function QuiltKits({ fabrics, onAddToCart }: QuiltKitsProps) {
  const kits = fabrics.slice(6, 10);

  return (
    <section id="kits" className="py-16 border-t" style={{ backgroundColor: COLORS.surface, borderColor: `${COLORS.text}1a` }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-end mb-10 border-b pb-4" style={{ borderColor: `${COLORS.text}1a` }}>
          <div>
            <h2
              className="text-3xl mb-2"
              style={{
                fontFamily: 'var(--font-display)',
                color: COLORS.text,
              }}
            >
              Shop New Quilt Kits
            </h2>
            <p style={{ color: COLORS.textDim }}>
              Discover the latest and greatest quilt kits, curated for your next masterpiece.
            </p>
          </div>
          <a
            href="/shop/catalog"
            className="text-sm font-bold tracking-wider uppercase transition-colors pb-1"
            style={{ color: COLORS.text }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = COLORS.primary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = COLORS.text;
            }}
          >
            Shop All &rarr;
          </a>
        </div>

        {/* Kit Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
          {kits.map((kit) => {
            const price = kit.pricePerYard ? `$${Number(kit.pricePerYard).toFixed(2)}` : '';
            return (
              <div
                key={kit.id}
                className="group flex flex-col text-center"
              >
                <a href="#" className="block flex-grow">
                  <div
                    className="relative aspect-[4/5] mb-4 border rounded-lg overflow-hidden"
                    style={{ borderColor: `${COLORS.text}1a`, backgroundColor: COLORS.bg }}
                  >
                    {kit.imageUrl?.startsWith('/') ? (
                      <img
                        src={kit.imageUrl}
                        alt={kit.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : kit.hex ? (
                      <div
                        className="w-full h-full group-hover:scale-105 transition-transform duration-700"
                        style={{ backgroundColor: kit.hex }}
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{ backgroundColor: `${COLORS.primary}10` }}
                      />
                    )}
                  </div>
                  <h3
                    className="font-medium leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-2 px-2"
                    style={{ color: COLORS.text }}
                  >
                    {kit.name}
                  </h3>
                </a>
                <div className="mt-auto pt-2">
                  {price && (
                    <p className="font-bold mb-4" style={{ color: COLORS.text }}>
                      {price}
                    </p>
                  )}
                  {kit.shopifyVariantId && kit.inStock && (
                    <button
                      onClick={() => onAddToCart(kit)}
                      className="w-full rounded-full py-2.5 text-sm font-bold tracking-wide transition-colors"
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
                      ADD TO CART
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
