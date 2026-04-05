import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { YardageResult } from '@/lib/yardage-utils';

export interface CartItem {
  fabricId: string | null;
  shopifyVariantId: string;
  quantityInYards: number;
  pricePerYard: number;
}

interface CartState {
  shopifyCartId: string | null;
  checkoutUrl: string | null;
  items: CartItem[];

  // Actions
  setShopifyCart: (cartId: string, checkoutUrl: string) => void;
  setItems: (items: CartItem[]) => void;
  addProjectYardageToCart: (yardageData: YardageResult[], purchasableFabricsMap: Map<string, any>) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      shopifyCartId: null,
      checkoutUrl: null,
      items: [],

      setShopifyCart: (shopifyCartId, checkoutUrl) =>
        set({ shopifyCartId, checkoutUrl }),

      setItems: (items) => set({ items }),

      addProjectYardageToCart: (yardageData, purchasableFabricsMap) =>
        set((state) => {
          const newItems: CartItem[] = [];

          yardageData.forEach((result) => {
            if (result.fabricId) {
              const fabricData = purchasableFabricsMap.get(result.fabricId);

              if (
                fabricData &&
                fabricData.isPurchasable &&
                fabricData.shopifyVariantId &&
                fabricData.pricePerYard != null
              ) {
                newItems.push({
                  fabricId: result.fabricId,
                  shopifyVariantId: fabricData.shopifyVariantId,
                  quantityInYards: result.yardsRequired,
                  pricePerYard: fabricData.pricePerYard,
                });
              }
            }
          });

          return { items: newItems };
        }),

      clearCart: () =>
        set({ shopifyCartId: null, checkoutUrl: null, items: [] }),
    }),
    {
      name: 'quiltcorgi-cart',
    }
  )
);
