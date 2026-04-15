import { Metadata } from 'next';
import ShopClient from './ShopClient';
import { getShopSettings, getShopFabrics } from '@/lib/shop';
import type { ShopFabric } from '@/types/fabric';

const HERO_IMAGE = '/images/shop/fabric-by-yard.jpg';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://quiltcorgi.com';

export async function generateMetadata(): Promise<Metadata> {
  const title = 'Shop Premium Quilting Fabrics | QuiltCorgi';
  const description =
    'Discover premium cotton fabrics from top designers. Hand-picked for quilters who care about every stitch. Shop charm packs, jelly rolls, layer cakes, and fabric by the yard.';
  const url = `${SITE_URL}/shop`;

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
          alt: 'QuiltCorgi Fabric Shop - Premium Quilting Fabrics',
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

export default async function ShopPage() {
  const [{ enabled }, initialFabrics] = await Promise.all([
    getShopSettings(),
    getShopFabrics({ sort: 'newest', limit: 24 }),
  ]);

  return <ShopClient initialFabrics={initialFabrics as ShopFabric[]} shopEnabled={enabled} />;
}
