'use client';

import { useState } from 'react';
import { useCartStore } from '@/stores/cartStore';

interface ReorderButtonProps {
  lineItems: Array<{
    fabricId: string;
    fabricName: string;
    quantityInYards: number;
    pricePerYard: number;
    imageUrl: string | null;
    shopifyVariantId?: string;
  }>;
  className?: string;
}

export default function ReorderButton({ lineItems, className }: ReorderButtonProps) {
  const [loading, setLoading] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const setDrawerOpen = useCartStore((s) => s.setDrawerOpen);

  const handleReorder = async () => {
    setLoading(true);

    try {
      // Add all items to cart
      for (const item of lineItems) {
        if (item.shopifyVariantId) {
          addItem({
            fabricId: item.fabricId,
            shopifyVariantId: item.shopifyVariantId,
            quantityInYards: item.quantityInYards,
            pricePerYard: item.pricePerYard,
            fabricName: item.fabricName,
            fabricImageUrl: item.imageUrl,
          });
        }
      }

      // Open cart drawer
      setDrawerOpen(true);
    } catch (error) {
      console.error('Failed to reorder:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleReorder}
      disabled={loading}
      className={`bg-[#ff8d49] text-[#1a1a1a] px-6 py-2 rounded-full font-['Inter'] transition-colors duration-150 ease-out hover:bg-[#e67d3f] disabled:opacity-50 disabled:cursor-not-allowed ${className || ''}`}
    >
      {loading ? 'Adding to cart...' : 'Reorder'}
    </button>
  );
}
