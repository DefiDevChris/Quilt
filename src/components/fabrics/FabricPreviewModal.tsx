'use client';

import { useState } from 'react';
import { X, ExternalLink, ShoppingBag, Plus, Minus } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { useShopEnabled } from '@/hooks/useShopEnabled';
import type { FabricListItem } from '@/types/fabric';

interface FabricPreviewModalProps {
  fabric: FabricListItem;
  onClose: () => void;
}

/**
 * Preview modal for any fabric in the studio.
 * Shows large swatch, metadata, and if purchasable: price + shop actions.
 */
export function FabricPreviewModal({ fabric, onClose }: FabricPreviewModalProps) {
  const addItem = useCartStore((s) => s.addItem);
  const setDrawerOpen = useCartStore((s) => s.setDrawerOpen);
  const shopEnabled = useShopEnabled();
  const [quantity, setQuantity] = useState(0.5);

  const isPurchasable = fabric.isPurchasable && shopEnabled;
  const price = fabric.pricePerYard ? `$${Number(fabric.pricePerYard).toFixed(2)}/yd` : null;

  const handleAddToCart = () => {
    if (!fabric.shopifyVariantId || !fabric.inStock) return;
    addItem({
      fabricId: fabric.id,
      shopifyVariantId: fabric.shopifyVariantId,
      quantityInYards: quantity,
      pricePerYard: fabric.pricePerYard ?? 0,
      fabricName: fabric.name,
      fabricImageUrl: fabric.thumbnailUrl ?? fabric.imageUrl,
    });
    setDrawerOpen(true);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-[var(--color-text)]/40" onClick={onClose} />
      <div className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg overflow-hidden shadow-[0_1px_2px_rgba(45,42,38,0.08)]">
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-[var(--color-bg)] text-[var(--color-text-dim)] hover:bg-[#ff8d49]/10 transition-colors duration-150 focus:outline-2 focus:outline-[#ff8d49]"
          aria-label="Close preview"
        >
          <X size={16} />
        </button>

        {/* Large Swatch */}
        <div className="aspect-square w-full">
          {fabric.hex ? (
            <div className="w-full h-full" style={{ backgroundColor: fabric.hex }} />
          ) : (
            <img
              src={fabric.thumbnailUrl ?? fabric.imageUrl}
              alt={fabric.name}
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {/* Info */}
        <div className="p-5 space-y-3">
          <div>
            <h3 className="text-lg font-semibold text-[var(--color-text)]">{fabric.name}</h3>
            {fabric.manufacturer && <p className="text-sm text-[var(--color-text-dim)]">{fabric.manufacturer}</p>}
            {fabric.collection && <p className="text-xs text-[var(--color-text-dim)]">{fabric.collection}</p>}
          </div>

          {/* Price + Stock (purchasable only) */}
          {isPurchasable && (
            <div className="flex items-center gap-3">
              {price && <span className="text-xl font-bold text-[var(--color-text)]">{price}</span>}
            </div>
          )}

          {/* Quantity selector (purchasable + in stock) */}
          {isPurchasable && fabric.inStock && fabric.shopifyVariantId && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-[var(--color-text-dim)]">Quantity:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(0.25, quantity - 0.25))}
                  disabled={quantity <= 0.25}
                  className="w-7 h-7 rounded-full bg-[var(--color-bg)] flex items-center justify-center text-[var(--color-text-dim)] hover:bg-[#ff8d49]/10 disabled:opacity-30 transition-colors duration-150 focus:outline-2 focus:outline-[#ff8d49]"
                >
                  <Minus size={14} />
                </button>
                <span className="text-sm font-medium text-[var(--color-text)] min-w-[3.5rem] text-center">
                  {quantity} yd{quantity !== 1 ? 's' : ''}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 0.25)}
                  className="w-7 h-7 rounded-full bg-[var(--color-bg)] flex items-center justify-center text-[var(--color-text-dim)] hover:bg-[#ff8d49]/10 transition-colors duration-150 focus:outline-2 focus:outline-[#ff8d49]"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            {isPurchasable && (
              <a
                href="/shop"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full bg-[var(--color-bg)] text-sm font-medium text-[var(--color-text-dim)] hover:bg-[#ff8d49]/10 transition-colors duration-150"
              >
                <ExternalLink size={14} />
                View in Store
              </a>
            )}
            {isPurchasable && fabric.inStock && fabric.shopifyVariantId ? (
              <button
                type="button"
                onClick={handleAddToCart}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full bg-[#ff8d49] text-[var(--color-text)] text-[16px] leading-[24px] hover:bg-[#e67d3f] transition-colors duration-150 shadow-[0_1px_2px_rgba(45,42,38,0.08)]"
              >
                <ShoppingBag size={14} />
                Add to Shopping List
              </button>
            ) : !isPurchasable ? (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-full bg-[var(--color-bg)] text-[16px] leading-[24px] text-[var(--color-text-dim)] hover:bg-[#ff8d49]/10 transition-colors duration-150"
              >
                Close
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
