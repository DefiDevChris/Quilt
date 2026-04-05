import { db } from '@/lib/db';
import { fabrics } from '@/db/schema/fabrics';
import { eq } from 'drizzle-orm';
import { Suspense } from 'react';
import { isShopifyEnabled } from '@/lib/shopify';

/**
 * Shop Page
 *
 * A basic grid layout showing purchasable fabrics.
 * Feature-flagged behind NEXT_PUBLIC_ENABLE_SHOP
 */
export default async function ShopPage() {
  const shopEnabled = isShopifyEnabled();

  // Fetch purchasable fabrics from the database
  let purchasableFabrics: Array<{
    id: string;
    name: string;
    imageUrl: string;
    thumbnailUrl: string | null;
    manufacturer: string | null;
    collection: string | null;
    colorFamily: string | null;
    pricePerYard: number | null;
    inStock: boolean;
    shopifyProductId: string | null;
    shopifyVariantId: string | null;
  }> = [];

  if (shopEnabled) {
    try {
      const result = await db
        .select({
          id: fabrics.id,
          name: fabrics.name,
          imageUrl: fabrics.imageUrl,
          thumbnailUrl: fabrics.thumbnailUrl,
          manufacturer: fabrics.manufacturer,
          collection: fabrics.collection,
          colorFamily: fabrics.colorFamily,
          pricePerYard: fabrics.pricePerYard,
          inStock: fabrics.inStock,
          shopifyProductId: fabrics.shopifyProductId,
          shopifyVariantId: fabrics.shopifyVariantId,
        })
        .from(fabrics)
        .where(eq(fabrics.isPurchasable, true));

      purchasableFabrics = result;
    } catch (error) {
      console.error('Failed to fetch purchasable fabrics:', error);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-outline-variant bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-on-surface">Fabric Shop</h1>
          <p className="mt-2 text-secondary">
            Purchase high-quality fabrics for your quilting projects
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!shopEnabled ? (
          <div className="text-center py-16">
            <h2 className="text-xl font-semibold text-on-surface mb-2">Shop Coming Soon</h2>
            <p className="text-secondary">
              Our fabric shop is currently being set up. Check back soon!
            </p>
          </div>
        ) : purchasableFabrics.length === 0 ? (
          <div className="text-center py-16">
            <h2 className="text-xl font-semibold text-on-surface mb-2">No Fabrics Available</h2>
            <p className="text-secondary">
              We&apos;re working on adding purchasable fabrics to our collection.
            </p>
          </div>
        ) : (
          <Suspense fallback={<GridSkeleton />}>
            <FabricGrid fabrics={purchasableFabrics} />
          </Suspense>
        )}
      </main>
    </div>
  );
}

async function FabricGrid({
  fabrics,
}: {
  fabrics: Array<{
    id: string;
    name: string;
    imageUrl: string;
    thumbnailUrl: string | null;
    manufacturer: string | null;
    collection: string | null;
    colorFamily: string | null;
    pricePerYard: number | null;
    inStock: boolean;
    shopifyProductId: string | null;
    shopifyVariantId: string | null;
  }>;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {fabrics.map((fabric) => (
        <FabricCard key={fabric.id} fabric={fabric} />
      ))}
    </div>
  );
}

function FabricCard({
  fabric,
}: {
  fabric: {
    id: string;
    name: string;
    imageUrl: string;
    thumbnailUrl: string | null;
    manufacturer: string | null;
    collection: string | null;
    colorFamily: string | null;
    pricePerYard: number | null;
    inStock: boolean;
    shopifyProductId: string | null;
    shopifyVariantId: string | null;
  };
}) {
  const displayPrice = fabric.pricePerYard
    ? `$${(fabric.pricePerYard / 100).toFixed(2)} per yard`
    : 'Price TBD';

  return (
    <div className="group bg-surface rounded-lg border border-outline-variant overflow-hidden hover:shadow-elevation-2 transition-shadow">
      {/* Image */}
      <div className="aspect-square overflow-hidden bg-background">
        <img
          src={fabric.imageUrl}
          alt={fabric.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-medium text-on-surface truncate">{fabric.name}</h3>

        {/* Metadata */}
        <div className="mt-2 space-y-1 text-sm text-secondary">
          {fabric.manufacturer && <p className="truncate">{fabric.manufacturer}</p>}
          {fabric.collection && <p className="truncate">{fabric.collection}</p>}
          {fabric.colorFamily && <p className="capitalize">{fabric.colorFamily}</p>}
        </div>

        {/* Price and Stock */}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-lg font-semibold text-on-surface">{displayPrice}</span>
          {fabric.inStock ? (
            <span className="text-xs font-medium text-success bg-success-container px-2 py-1 rounded">
              In Stock
            </span>
          ) : (
            <span className="text-xs font-medium text-error bg-error-container px-2 py-1 rounded">
              Out of Stock
            </span>
          )}
        </div>

        {/* Action Button */}
        <button
          type="button"
          disabled={!fabric.inStock || !fabric.shopifyVariantId}
          className="mt-4 w-full py-2.5 px-4 bg-primary text-on-primary rounded-lg 
                   font-medium text-sm hover:bg-primary-hover 
                   disabled:opacity-50 disabled:cursor-not-allowed
                   transition-colors"
        >
          {fabric.shopifyVariantId ? 'Add to Cart' : 'Not Available'}
        </button>
      </div>
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="bg-surface rounded-lg border border-outline-variant overflow-hidden animate-pulse"
        >
          <div className="aspect-square bg-background" />
          <div className="p-4 space-y-3">
            <div className="h-5 bg-background rounded w-3/4" />
            <div className="h-4 bg-background rounded w-1/2" />
            <div className="h-4 bg-background rounded w-1/3" />
            <div className="flex justify-between">
              <div className="h-6 bg-background rounded w-1/4" />
              <div className="h-6 bg-background rounded w-1/4" />
            </div>
            <div className="h-10 bg-background rounded w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
