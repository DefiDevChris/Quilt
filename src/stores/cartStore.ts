'use client';

import { create } from 'zustand';
import type { YardageResult } from '@/lib/yardage-utils';
import type { FabricListItem } from '@/types/fabric';
import { isShopifyEnabled, createCart, addToCart, type ShopifyCartLineInput } from '@/lib/shopify';

/**
 * Cart Item representing a fabric yardage selection
 * Syncs local fabric data with Shopify cart data
 */
export interface CartItem {
  /** Local fabric ID for reference */
  fabricId: string;
  /** Shopify variant ID (required for cart operations) */
  shopifyVariantId: string;
  /** Quantity in yards (can be decimal) */
  quantityInYards: number;
  /** Price per yard in cents (for quick UI rendering) */
  pricePerYard: number;
  /** Fabric name for display */
  fabricName: string;
  /** Fabric image URL for display */
  fabricImageUrl: string | null;
}

interface CartState {
  /** Shopify cart ID (persisted across sessions) */
  shopifyCartId: string | null;
  /** Shopify checkout URL for redirect */
  checkoutUrl: string | null;
  /** Array of cart items syncing local and Shopify data */
  items: CartItem[];
  /** Whether the cart drawer is open */
  isDrawerOpen: boolean;
  /** Loading state for async operations */
  isLoading: boolean;
  /** Error message if any operation failed */
  error: string | null;

  // Actions
  setShopifyCartId: (cartId: string | null) => void;
  setCheckoutUrl: (url: string | null) => void;
  addItem: (item: CartItem) => void;
  removeItem: (fabricId: string) => void;
  updateItemQuantity: (fabricId: string, quantityInYards: number) => void;
  clearCart: () => void;
  toggleDrawer: () => void;
  setDrawerOpen: (open: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  /**
   * Add project yardage to cart
   * Maps yardage calculation results to cart items
   * Filters out fabrics that are not purchasable or lack shopifyVariantId
   */
  addProjectYardageToCart: (
    yardageData: YardageResult[],
    availableFabrics: FabricListItem[]
  ) => Promise<void>;

  /**
   * Sync local cart with Shopify
   * Creates a new cart or updates existing one
   */
  syncWithShopify: () => Promise<void>;
}

const INITIAL_STATE = {
  shopifyCartId: null,
  checkoutUrl: null,
  items: [] as CartItem[],
  isDrawerOpen: false,
  isLoading: false,
  error: null,
};

export const useCartStore = create<CartState>((set, get) => ({
  ...INITIAL_STATE,

  setShopifyCartId: (shopifyCartId) => set({ shopifyCartId }),
  setCheckoutUrl: (checkoutUrl) => set({ checkoutUrl }),

  addItem: (item) =>
    set((state) => {
      const existingIndex = state.items.findIndex((i) => i.fabricId === item.fabricId);
      if (existingIndex >= 0) {
        // Update existing item
        const updatedItems = [...state.items];
        updatedItems[existingIndex] = {
          ...updatedItems[existingIndex],
          quantityInYards: updatedItems[existingIndex].quantityInYards + item.quantityInYards,
        };
        return { items: updatedItems };
      }
      // Add new item
      return { items: [...state.items, item] };
    }),

  removeItem: (fabricId) =>
    set((state) => ({
      items: state.items.filter((item) => item.fabricId !== fabricId),
    })),

  updateItemQuantity: (fabricId, quantityInYards) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.fabricId === fabricId ? { ...item, quantityInYards } : item
      ),
    })),

  clearCart: () =>
    set({
      shopifyCartId: null,
      checkoutUrl: null,
      items: [],
      error: null,
    }),

  toggleDrawer: () => set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),
  setDrawerOpen: (isDrawerOpen) => set({ isDrawerOpen }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  addProjectYardageToCart: async (
    yardageData: YardageResult[],
    availableFabrics: FabricListItem[]
  ) => {
    // Check if Shopify is enabled
    if (!isShopifyEnabled()) {
      set({ error: 'Shopify integration is not enabled' });
      return;
    }

    set({ isLoading: true, error: null });

    try {
      // Create a fabric lookup map for quick access
      const fabricMap = new Map<string, FabricListItem>();
      availableFabrics.forEach((fabric) => {
        fabricMap.set(fabric.id, fabric);
      });

      // Map yardage results to cart items
      // Filter out:
      // - User-uploaded fabrics that are not purchasable (isPurchasable: false)
      // - Fabrics without a shopifyVariantId
      const cartItems = yardageData
        .map((yardage): CartItem | null => {
          if (!yardage.fabricId) {
            // This is a color fill, not a fabric - skip
            return null;
          }

          const fabric = fabricMap.get(yardage.fabricId);
          if (!fabric) {
            // Fabric not found in available fabrics - skip
            return null;
          }

          if (!fabric.isPurchasable) {
            // Fabric is not marked as purchasable - skip
            return null;
          }

          if (!fabric.shopifyVariantId) {
            // No Shopify variant ID configured - skip
            return null;
          }

          if (!fabric.inStock) {
            // Fabric is out of stock - skip
            return null;
          }

          return {
            fabricId: fabric.id,
            shopifyVariantId: fabric.shopifyVariantId,
            quantityInYards: yardage.yardsRequired,
            pricePerYard: fabric.pricePerYard || 0,
            fabricName: fabric.name,
            fabricImageUrl: fabric.imageUrl as string | null,
          };
        })
        .filter((item): item is CartItem => item !== null);

      if (cartItems.length === 0) {
        set({
          error: 'No purchasable fabrics found in your design',
          isLoading: false,
          isDrawerOpen: true,
        });
        return;
      }

      // Add items to local cart state
      cartItems.forEach((item) => {
        get().addItem(item);
      });

      // Sync with Shopify
      await get().syncWithShopify();

      set({
        isLoading: false,
        isDrawerOpen: true,
      });
    } catch (error) {
      console.error('Failed to add yardage to cart:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to add to cart',
        isLoading: false,
      });
    }
  },

  syncWithShopify: async () => {
    const state = get();

    if (!isShopifyEnabled()) {
      throw new Error('Shopify integration is not enabled');
    }

    set({ isLoading: true, error: null });

    try {
      let cartId = state.shopifyCartId;
      let checkoutUrl = state.checkoutUrl;

      // Create a new cart if we don't have one
      if (!cartId) {
        const result = await createCart();
        cartId = result.cartId;
        checkoutUrl = result.checkoutUrl;
        set({ shopifyCartId: cartId, checkoutUrl });
      }

      // Prepare cart lines from local items
      const lines: ShopifyCartLineInput[] = state.items.map((item) => ({
        variantId: item.shopifyVariantId,
        quantity: item.quantityInYards,
        // Add custom attributes for yardage info
        attributes: [
          { key: 'Fabric Type', value: 'Quilting Cotton' },
          { key: 'Quantity Unit', value: 'Yards' },
        ],
      }));

      if (lines.length > 0 && cartId) {
        // Add/update items in Shopify cart
        await addToCart(cartId, lines);
      }

      set({ isLoading: false });
    } catch (error) {
      console.error('Failed to sync with Shopify:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to sync cart',
        isLoading: false,
      });
      throw error;
    }
  },
}));
