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
import FeaturedCollections from '@/components/shop/FeaturedCollections';
import QuiltKits from '@/components/shop/QuiltKits';
import Testimonial from '@/components/shop/Testimonial';
import ShopFooter from '@/components/shop/ShopFooter';
import SectionDivider from '@/components/shop/SectionDivider';
import DesignStudioFeature from '@/components/shop/DesignStudioFeature';
import { CartDrawer } from '@/components/shop/CartDrawer';
import type { ShopFabric } from '@/types/fabric';

interface ShopClientProps {
  initialFabrics: ShopFabric[];
  shopEnabled: boolean;
}

export default function ShopClient({ initialFabrics, shopEnabled }: ShopClientProps) {
  const [fabrics, setFabrics] = useState<ShopFabric[]>(initialFabrics);
  const [clientLoading, setClientLoading] = useState(false);

  const addItemAndSync = useCartStore((s) => s.addItemAndSync);
  const setDrawerOpen = useCartStore((s) => s.setDrawerOpen);

  const fetchFabrics = useCallback(async () => {
    setClientLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('sort', 'newest');
      params.set('page', '1');
      params.set('limit', '24');

      const res = await fetch(`/api/shop/fabrics?${params.toString()}`);
      if (!res.ok) {
        return;
      }

      const json = await res.json();
      setFabrics(json.data.fabrics);
    } catch {
      // Keep existing fabrics on error
    } finally {
      setClientLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!shopEnabled) return;

    const hasInitialFabrics = initialFabrics.length > 0;
    if (!hasInitialFabrics) {
      fetchFabrics();
    }
  }, [shopEnabled, initialFabrics.length, fetchFabrics]);

  const handleAddToCart = async (fabric: ShopFabric) => {
    if (!fabric.shopifyVariantId || !fabric.inStock) return;
    setDrawerOpen(true);
    await addItemAndSync({
      fabricId: fabric.id,
      shopifyVariantId: fabric.shopifyVariantId,
      quantityInYards: 0.25,
      pricePerYard: fabric.pricePerYard ? Number(fabric.pricePerYard) : 0,
      fabricName: fabric.name,
      fabricImageUrl: fabric.thumbnailUrl ?? fabric.imageUrl,
    });
  };

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

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.bg }}>
      <ShopHeader />
      <main>
        <ShopHeroSlideshow />
        <Categories />
        {clientLoading ? (
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
            <SectionDivider icon="scissors" background={COLORS.surface} />
            <FeaturedCollections fabrics={fabrics} onAddToCart={handleAddToCart} />
            <NewArrivals fabrics={fabrics} onAddToCart={handleAddToCart} />
            <SectionDivider icon="spool" background={COLORS.surface} />
            <DesignStudioFeature />
            <QuiltKits fabrics={fabrics} onAddToCart={handleAddToCart} />
            <SectionDivider icon="needle" background={COLORS.surface} />
            <Testimonial />
          </>
        )}
      </main>
      <ShopFooter />
      <CartDrawer />
    </div>
  );
}
