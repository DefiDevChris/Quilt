import { db } from '@/lib/db';
import { fabrics } from '@/db/schema/fabrics';
import { eq } from 'drizzle-orm';
import Image from 'next/image';
import { Fabric } from '@/types/fabric';

export const metadata = {
  title: 'Shop - QuiltCorgi',
  description: 'Purchase physical fabrics for your next quilt project.',
};

export const dynamic = 'force-dynamic';

export default async function ShopPage() {
  const shopEnabled = process.env.NEXT_PUBLIC_ENABLE_SHOP === 'true';

  if (!shopEnabled) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold text-on-surface mb-4">Fabric Shop</h1>
        <p className="text-secondary">The shop is currently closed. Check back soon!</p>
      </div>
    );
  }

  // Fetch only purchasable fabrics
  const purchasableFabrics = await db.query.fabrics.findMany({
    where: eq(fabrics.isPurchasable, true),
    orderBy: (fabrics: any, { desc }: any) => [desc(fabrics.createdAt)],
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-on-surface mb-8">Fabric Shop</h1>

      {purchasableFabrics.length === 0 ? (
        <p className="text-secondary text-center py-12">No fabrics are currently available for purchase.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {purchasableFabrics.map((fabric: Fabric) => (
            <div key={fabric.id} className="border border-outline-variant rounded-lg overflow-hidden bg-surface shadow-elevation-1 hover:shadow-elevation-2 transition-shadow">
              <div className="aspect-square relative bg-background border-b border-outline-variant">
                <Image
                  src={fabric.imageUrl}
                  alt={fabric.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
              <div className="p-4">
                <h2 className="font-semibold text-on-surface mb-1 truncate">{fabric.name}</h2>
                {fabric.manufacturer && (
                  <p className="text-xs text-secondary mb-2">{fabric.manufacturer}</p>
                )}
                <div className="flex items-center justify-between mt-4">
                  <span className="font-bold text-on-surface">
                    {fabric.pricePerYard ? `$${(fabric.pricePerYard / 100).toFixed(2)} / yd` : 'Pricing Unavailable'}
                  </span>

                  <button
                    className="px-3 py-1.5 bg-primary text-on-primary text-sm font-medium rounded hover:bg-primary-hover transition-colors"
                    disabled={!fabric.inStock}
                  >
                    {fabric.inStock ? 'Add to Cart' : 'Out of Stock'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
