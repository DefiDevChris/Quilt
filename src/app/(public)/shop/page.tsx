'use client';

import { useState, useEffect, useCallback } from 'react';
import { ShoppingBag } from 'lucide-react';
import { COLORS } from '@/lib/design-system';
import { useCartStore } from '@/stores/cartStore';
import ShopHeader from '@/components/shop/ShopHeader';
import ShopHeroSlideshow from '@/components/shop/ShopHeroSlideshow';
import Categories from '@/components/shop/Categories';
import CuratedPicks from '@/components/shop/CuratedPicks';
import NewArrivals from '@/components/shop/NewArrivals';
import FeaturedCollection from '@/components/shop/FeaturedCollection';
import FeaturedCollections from '@/components/shop/FeaturedCollections';
import QuiltKits from '@/components/shop/QuiltKits';
import Testimonial from '@/components/shop/Testimonial';
import ShopFooter from '@/components/shop/ShopFooter';
import { CartDrawer } from '@/components/shop/CartDrawer';

interface ShopFabric {
  id: string;
  name: string;
  imageUrl: string;
  thumbnailUrl: string | null;
  manufacturer: string | null;
  collection: string | null;
  colorFamily: string | null;
  value: string | null;
  hex: string | null;
  pricePerYard: string | null;
  description: string | null;
  inStock: boolean;
  shopifyVariantId: string | null;
}

export default function ShopPage() {
  const [fabrics, setFabrics] = useState<ShopFabric[]>([]);
  const [loading, setLoading] = useState(true);
  const [shopEnabled, setShopEnabled] = useState<boolean | null>(null);

  const addItem = useCartStore((s) => s.addItem);
  const toggleDrawer = useCartStore((s) => s.toggleDrawer);

  useEffect(() => {
    fetch('/api/shop/settings')
      .then((res) => (res.ok ? res.json() : { data: { enabled: false } }))
      .then((json) => setShopEnabled(json.data?.enabled === true))
      .catch(() => setShopEnabled(false));
  }, []);

  const fetchFabrics = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('sort', 'newest');
      params.set('page', '1');
      params.set('limit', '24');

      const res = await fetch(`/api/shop/fabrics?${params.toString()}`);
      if (!res.ok) {
        setFabrics([]);
        return;
      }

      const json = await res.json();
      setFabrics(json.data.fabrics);
    } catch {
      setFabrics([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (shopEnabled) fetchFabrics();
  }, [shopEnabled, fetchFabrics]);

  const handleAddToCart = (fabric: ShopFabric) => {
    if (!fabric.shopifyVariantId || !fabric.inStock) return;
    addItem({
      fabricId: fabric.id,
      shopifyVariantId: fabric.shopifyVariantId,
      quantityInYards: 0.25,
      pricePerYard: fabric.pricePerYard ? Number(fabric.pricePerYard) : 0,
      fabricName: fabric.name,
      fabricImageUrl: fabric.thumbnailUrl ?? fabric.imageUrl,
    });
    toggleDrawer();
  };

  // ─── Loading ────────────────────────────────────────────────────

  if (shopEnabled === null) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: COLORS.bg }}
      >
        <div
          className="w-8 h-8 rounded-full animate-pulse"
          style={{ backgroundColor: `${COLORS.primary}33` }}
        />
      </div>
    );
  }

  if (!shopEnabled) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: COLORS.bg }}
      >
        <div className="text-center">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: `${COLORS.primary}10` }}
          >
            <ShoppingBag size={24} style={{ color: COLORS.primary }} />
          </div>
          <h1
            className="text-[28px] font-semibold mb-2"
            style={{ fontFamily: 'var(--font-display)', color: COLORS.text }}
          >
            Shop Coming Soon
          </h1>
          <p style={{ color: COLORS.textDim }}>
            We are curating our fabric collection. Check back soon.
          </p>
        </div>
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.bg }}>
      <ShopHeader />
      <main>
        <ShopHeroSlideshow />
        <Categories />
        {loading ? (
          <div
            className="py-20 flex items-center justify-center"
            style={{ backgroundColor: COLORS.bg }}
          >
            <div
              className="w-8 h-8 rounded-full animate-pulse"
              style={{ backgroundColor: `${COLORS.primary}33` }}
            />
          </div>
        ) : (
          <>
            <CuratedPicks fabrics={fabrics} onAddToCart={handleAddToCart} />
            <FeaturedCollections fabrics={fabrics} onAddToCart={handleAddToCart} />
            <NewArrivals fabrics={fabrics} onAddToCart={handleAddToCart} />
            <FeaturedCollection />
            <QuiltKits fabrics={fabrics} onAddToCart={handleAddToCart} />
            <Testimonial />
          </>
        )}
      </main>
      <ShopFooter />
      <CartDrawer />
    </div>
  );
}
