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

interface FeaturedCollectionsProps {
  fabrics: Fabric[];
  onAddToCart: (fabric: Fabric) => void;
}

interface CollectionGroup {
  name: string;
  description: string;
  fabrics: Fabric[];
}

export default function FeaturedCollections({ fabrics, onAddToCart }: FeaturedCollectionsProps) {
  // Group fabrics by collection
  const collectionMap = new Map<string, Fabric[]>();
  fabrics.forEach((fabric) => {
    const collName = fabric.collection || 'Featured';
    if (!collectionMap.has(collName)) {
      collectionMap.set(collName, []);
    }
    collectionMap.get(collName)!.push(fabric);
  });

  // Take top 3 collections with most fabrics
  const collections: CollectionGroup[] = Array.from(collectionMap.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 3)
    .map(([name, collFabrics]) => ({
      name,
      description: getCollectionDescription(name),
      fabrics: collFabrics.slice(0, 6),
    }));

  if (collections.length === 0) return null;

  return (
    <section className="py-32" style={{ backgroundColor: `${COLORS.secondary}20` }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2
            className="text-4xl md:text-5xl mb-6"
            style={{
              fontFamily: 'var(--font-display)',
              color: COLORS.text,
            }}
          >
            Fabric Collection Spotlight
          </h2>
          <p className="text-lg" style={{ color: COLORS.textDim }}>
            Discover our carefully curated selections. Each collection is designed to inspire your
            creativity and bring warmth to your quilting projects.
          </p>
        </div>

        <div className="space-y-16 md:space-y-24">
          {collections.map((collection, index) => (
            <div
              key={collection.name}
              className={`flex flex-col md:flex-row gap-8 md:gap-12 items-center ${
                index % 2 === 1 ? 'md:flex-row-reverse' : ''
              }`}
            >
              {/* Collection Hero Image */}
              <div className="w-full md:w-1/2">
                <div
                  className="aspect-[16/10] md:aspect-[16/9] lg:aspect-[3/2] rounded-lg overflow-hidden shadow-lg"
                  style={{ backgroundColor: `${COLORS.primary}10` }}
                >
                  {collection.fabrics[0]?.imageUrl?.startsWith('/') ? (
                    <img
                      src={collection.fabrics[0].imageUrl}
                      alt={collection.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{ backgroundColor: `${COLORS.primary}15` }}
                    />
                  )}
                </div>
              </div>

              {/* Collection Info + Fabric Swatches */}
              <div className="w-full md:w-1/2 flex flex-col justify-center space-y-6 px-4 md:px-8">
                <h3
                  className="text-3xl md:text-4xl"
                  style={{
                    fontFamily: 'var(--font-display)',
                    color: COLORS.text,
                  }}
                >
                  {collection.name}
                </h3>
                <p className="text-lg leading-relaxed" style={{ color: COLORS.textDim }}>
                  {collection.description}
                </p>

                {/* Fabric Swatches Grid */}
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-4">
                  {collection.fabrics.map((fabric) => {
                    const price = fabric.pricePerYard
                      ? `$${Number(fabric.pricePerYard).toFixed(2)}`
                      : '';
                    return (
                      <div key={fabric.id} className="group/swatch flex flex-col">
                        <div
                          className="relative mb-1 border rounded overflow-hidden transition-shadow duration-300"
                          style={{
                            height: '100px',
                            borderColor: `${COLORS.text}1a`,
                            backgroundColor: COLORS.surface,
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLDivElement).style.boxShadow =
                              '0 1px 3px rgba(0,0,0,0.06)';
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                          }}
                        >
                          {fabric.imageUrl?.startsWith('/') ? (
                            <img
                              src={fabric.imageUrl}
                              alt={fabric.name}
                              className="w-full h-full object-cover group-hover/swatch:scale-110 transition-transform duration-500"
                            />
                          ) : fabric.hex ? (
                            <div
                              className="w-full h-full group-hover/swatch:scale-110 transition-transform duration-500"
                              style={{ backgroundColor: fabric.hex }}
                            />
                          ) : (
                            <div
                              className="w-full h-full flex items-center justify-center"
                              style={{ backgroundColor: `${COLORS.primary}10` }}
                            />
                          )}
                        </div>
                        <p
                          className="text-[10px] uppercase tracking-widest leading-tight line-clamp-2 mb-1"
                          style={{ color: COLORS.textDim }}
                        >
                          {fabric.name}
                        </p>
                        {fabric.shopifyVariantId && fabric.inStock && price && (
                          <p
                            className="text-[11px] font-bold mb-1"
                            style={{ color: COLORS.primary }}
                          >
                            {price}
                          </p>
                        )}
                        {fabric.shopifyVariantId && fabric.inStock && (
                          <button
                            onClick={() => onAddToCart(fabric)}
                            className="text-[10px] font-bold px-2 py-1 rounded-full transition-all duration-200 border opacity-0 group-hover/swatch:opacity-100"
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
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function getCollectionDescription(name: string): string {
  const descriptions: Record<string, string> = {
    'Sunrise Blossoms':
      'Welcome the new season with warm peaches and bright florals. Soft pinks, gentle greens, and golden yellows create quilts that radiate joy.',
    'Modern Basics':
      'Clean lines and timeless patterns for the contemporary quilter. Crisp geometrics, subtle textures, and versatile solids.',
    'Cottage Garden':
      'Romantic florals and vintage-inspired prints that evoke memories of sunlit afternoons spent in the garden.',
    'Coastal Breeze':
      'Ocean-inspired blues, sandy neutrals, and weathered whites that bring the serenity of the shore to your quilting.',
    'Autumn Harvest':
      'Rich burgundies, warm oranges, and golden browns that capture the essence of fall foliage and harvest celebrations.',
    'Winter Wonderland':
      'Icy blues, crisp whites, and silver accents that evoke the quiet beauty of a snow-covered landscape.',
  };

  return (
    descriptions[name] ||
    `A beautifully curated collection of coordinating fabrics, designed to work together in perfect harmony. Mix and match to create your perfect quilt.`
  );
}
