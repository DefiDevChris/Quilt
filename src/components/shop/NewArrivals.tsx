'use client';

import { COLORS } from '@/lib/design-system';

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

interface NewArrivalsProps {
  fabrics: Fabric[];
  onAddToCart: (fabric: Fabric) => void;
}

export default function NewArrivals({ fabrics, onAddToCart }: NewArrivalsProps) {
  const newArrivals = fabrics.slice(3, 7);

  return (
    <section
      id="new"
      className="py-24"
      style={{
        backgroundColor: COLORS.bg,
        borderTop: `3px solid ${COLORS.primary}`,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div
          className="flex justify-between items-end mb-10 border-b pb-4"
          style={{ borderColor: `${COLORS.text}1a` }}
        >
          <div>
            <h2
              className="text-3xl mb-2"
              style={{
                fontFamily: 'var(--font-display)',
                color: COLORS.text,
              }}
            >
              New Arrivals
            </h2>
            <p style={{ color: COLORS.textDim }}>
              Fresh fabrics just landed.
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

        {/* Fabric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
          {newArrivals.map((fabric) => {
            const price = fabric.pricePerYard ? `$${Number(fabric.pricePerYard).toFixed(2)}` : '';
            return (
              <div
                key={fabric.id}
                className="group flex flex-col"
              >
                <a href="#" className="block flex-grow">
                  <div
                    className="relative mb-2 border rounded overflow-hidden transition-shadow duration-300"
                    style={{
                      height: '180px',
                      borderColor: `${COLORS.text}1a`,
                      backgroundColor: COLORS.surface,
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                    }}
                  >
                    {fabric.imageUrl?.startsWith('/') ? (
                      <img
                        src={fabric.imageUrl}
                        alt={fabric.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : fabric.hex ? (
                      <div
                        className="w-full h-full group-hover:scale-105 transition-transform duration-700"
                        style={{ backgroundColor: fabric.hex }}
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{ backgroundColor: `${COLORS.primary}10` }}
                      />
                    )}
                    {fabric.collection && (
                      <div
                        className="absolute top-3 left-3 text-xs font-bold px-3 py-1 rounded-full tracking-wider"
                        style={{ backgroundColor: `${COLORS.primary}15`, color: COLORS.primary }}
                      >
                        New
                      </div>
                    )}
                  </div>
                  {fabric.collection && (
                    <p
                      className="text-[10px] uppercase tracking-widest mb-1"
                      style={{ color: COLORS.textDim }}
                    >
                      {fabric.collection}
                    </p>
                  )}
                  <h3
                    className="font-medium leading-snug mb-1 group-hover:text-primary transition-colors line-clamp-2"
                    style={{ color: COLORS.text }}
                  >
                    {fabric.name}
                  </h3>
                </a>
                <div className="mt-auto pt-2 flex items-center justify-between">
                  {price && (
                    <p className="font-bold" style={{ color: COLORS.primary }}>
                      {price}/yd
                    </p>
                  )}
                  {fabric.shopifyVariantId && fabric.inStock && (
                    <button
                      onClick={() => onAddToCart(fabric)}
                      className="text-sm font-bold px-5 py-1.5 rounded-full transition-all duration-200 border-2 opacity-0 group-hover:opacity-100"
                      style={{
                        color: COLORS.primary,
                        borderColor: COLORS.primary,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = COLORS.primary;
                        e.currentTarget.style.color = COLORS.surface;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = COLORS.primary;
                      }}
                    >
                      Add
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
