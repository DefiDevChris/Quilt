'use client';

import { ArrowRight } from 'lucide-react';
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

const difficulties = ['Beginner-friendly', 'Easy', 'Intermediate'];

export default function QuiltKits({ fabrics, onAddToCart }: QuiltKitsProps) {
  const kits = fabrics.slice(6, 9);

  return (
    <section id="kits" className="py-20 lg:py-28" style={{ backgroundColor: COLORS.surface }}>
      <div className="w-full px-6 lg:px-12">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between mb-12">
          <div>
            <span
              className="text-xs uppercase tracking-widest mb-3 block"
              style={{ color: COLORS.textDim, fontFamily: 'var(--font-display)' }}
            >
              Bestselling Kits
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
              Everything you need to start
            </h2>
          </div>
          <a
            href="/shop/catalog"
            className="inline-flex items-center mt-4 lg:mt-0 text-sm font-medium transition-colors group"
            style={{ color: COLORS.text }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = COLORS.primary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = COLORS.text;
            }}
          >
            Browse all kits
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" strokeWidth={1.5} />
          </a>
        </div>

        {/* Kit Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {kits.map((kit, index) => {
            const price = kit.pricePerYard ? `$${Number(kit.pricePerYard).toFixed(2)}` : '';
            const difficulty = difficulties[index % difficulties.length];
            return (
              <article
                key={kit.id}
                className="group bg-white rounded-[28px] overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300"
              >
                <div className="aspect-[4/5] overflow-hidden">
                  {kit.imageUrl?.startsWith('/') ? (
                    <img
                      src={kit.imageUrl}
                      alt={kit.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : kit.hex ? (
                    <div
                      className="w-full h-full group-hover:scale-105 transition-transform duration-500"
                      style={{ backgroundColor: kit.hex }}
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{ backgroundColor: `${COLORS.primary}10` }}
                    />
                  )}
                </div>
                <div className="p-6">
                  <h3
                    className="text-xl font-light mb-3"
                    style={{
                      fontFamily: 'var(--font-display)',
                      color: COLORS.text,
                    }}
                  >
                    {kit.name}
                  </h3>
                  <span
                    className="inline-block px-3 py-1 text-xs uppercase tracking-wider rounded-full border"
                    style={{
                      borderColor: `${COLORS.text}20`,
                      color: COLORS.textDim,
                      fontFamily: 'var(--font-display)',
                    }}
                  >
                    {difficulty}
                  </span>
                  {price && (
                    <p className="text-base font-medium mt-3" style={{ color: COLORS.text }}>
                      {price}
                    </p>
                  )}
                  {kit.shopifyVariantId && kit.inStock && (
                    <button
                      onClick={() => onAddToCart(kit)}
                      className="mt-4 w-full py-2.5 text-sm font-medium rounded-full transition-colors duration-200"
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
                      Add to Cart
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
