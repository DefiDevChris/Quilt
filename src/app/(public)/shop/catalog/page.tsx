import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import CatalogClient from './CatalogClient';
import { getShopSettings } from '@/lib/shop';
import { db } from '@/lib/db';
import { fabrics } from '@/db/schema';
import { eq, count, asc } from 'drizzle-orm';
import type { ShopFabric } from '@/types/fabric';

const HERO_IMAGE = '/images/shop/fabric-by-yard.jpg';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://quiltcorgi.com';

export async function generateMetadata(): Promise<Metadata> {
  const title = 'Fabric Catalog | QuiltCorgi Shop';
  const description =
    'Browse our complete catalog of premium cotton fabrics. Filter by color, theme, manufacturer, and more to find the perfect match for your next quilt.';
  const url = `${SITE_URL}/shop/catalog`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: 'QuiltCorgi',
      type: 'website',
      images: [
        {
          url: HERO_IMAGE,
          width: 1200,
          height: 630,
          alt: 'QuiltCorgi Fabric Catalog',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [HERO_IMAGE],
    },
  };
}

export default async function CatalogPage() {
  const [{ enabled }, initialFabrics, [{ total }]] = await Promise.all([
    getShopSettings(),
    db
      .select({
        id: fabrics.id,
        name: fabrics.name,
        imageUrl: fabrics.imageUrl,
        thumbnailUrl: fabrics.thumbnailUrl,
        manufacturer: fabrics.manufacturer,
        collection: fabrics.collection,
        colorFamily: fabrics.colorFamily,
        value: fabrics.value,
        hex: fabrics.hex,
        pricePerYard: fabrics.pricePerYard,
        description: fabrics.description,
        inStock: fabrics.inStock,
        shopifyVariantId: fabrics.shopifyVariantId,
      })
      .from(fabrics)
      .where(eq(fabrics.isPurchasable, true))
      .orderBy(asc(fabrics.name))
      .limit(24),
    db.select({ total: count() }).from(fabrics).where(eq(fabrics.isPurchasable, true)),
  ]);

  const formattedFabrics = initialFabrics.map((f) => ({
    ...f,
    pricePerYard: f.pricePerYard ?? null,
  }));

  return (
    <CatalogClient
      initialFabrics={formattedFabrics as ShopFabric[]}
      initialTotal={total}
      initialPage={1}
      initialLimit={24}
      initialSort="name"
      initialCategory=""
    />
  );
}
