import { create } from 'zustand';
import type { YardageResult } from '@/lib/yardage-utils';
import type { FabricListItem } from '@/types/fabric';
import {
  isShopifyEnabled,
  createCart,
  addToCart,
  getCart,
  cartLinesUpdate,
  cartLinesRemove,
  cartBuyerIdentityUpdate,
  type ShopifyCartLineInput,
  type ShopifyCart,
} from '@/lib/shopify';

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
  syncWithShopify: (buyerEmail?: string) => Promise<void>;

  /**
   * Restore cart from Shopify on app initialization
   */
  restoreFromShopify: () => Promise<void>;

  /** Reset cart to initial state */
  reset: () => void;
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

  clearCart: async () => {
    const state = get();

    // Clear Shopify cart lines if cart exists
    if (state.shopifyCartId && isShopifyEnabled()) {
      try {
        const shopifyCart = await getCart(state.shopifyCartId);
        if (shopifyCart && shopifyCart.lines.length > 0) {
          const lineIds = shopifyCart.lines.map((line) => line.id);
          await cartLinesRemove(state.shopifyCartId, lineIds);
        }
      } catch (error) {
        console.warn('Failed to clear Shopify cart:', error);
      }
    }

    set({
      shopifyCartId: null,
      checkoutUrl: null,
      items: [],
      error: null,
    });
  },

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
      // Filter out non-purchasable, missing variant, out-of-stock
      const projectItems = yardageData
        .map((yardage): CartItem | null => {
          if (!yardage.fabricId) return null;

          const fabric = fabricMap.get(yardage.fabricId);
          if (!fabric) return null;
          if (!fabric.isPurchasable) return null;
          if (!fabric.shopifyVariantId) return null;
          if (!fabric.inStock) return null;

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

      if (projectItems.length === 0) {
        set({
          error: 'No purchasable fabrics found in your design',
          isLoading: false,
          isDrawerOpen: true,
        });
        return;
      }

      // Replace cart with exact project quantities (no excess accumulation).
      // For each project fabric: set quantity to the project amount,
      // replacing any previous quantity for that fabric.
      set((state) => {
        const existingNonProject = state.items.filter(
          (item) => !projectItems.some((pi) => pi.fabricId === item.fabricId)
        );
        return { items: [...existingNonProject, ...projectItems] };
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

  reset: () => set(INITIAL_STATE),

  syncWithShopify: async (buyerEmail?: string) => {
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

      // Fetch current Shopify cart to compare
      const shopifyCart = cartId ? await getCart(cartId) : null;
      const shopifyLines = shopifyCart?.lines || [];

      // Build lookup maps
      const localByVariant = new Map<string, CartItem>();
      state.items.forEach((item) => {
        localByVariant.set(item.shopifyVariantId, item);
      });

      const shopifyByVariant = new Map<string, ShopifyCart['lines'][number]>();
      shopifyLines.forEach((line) => {
        shopifyByVariant.set(line.merchandise.id, line);
      });

      const linesToAdd: ShopifyCartLineInput[] = [];
      const linesToUpdate: { id: string; quantity: number }[] = [];
      const lineIdsToRemove: string[] = [];

      // Find new items and changed quantities
      for (const localItem of state.items) {
        const shopifyLine = shopifyByVariant.get(localItem.shopifyVariantId);
        if (!shopifyLine) {
          // New item - add to cart
          linesToAdd.push({
            variantId: localItem.shopifyVariantId,
            quantity: localItem.quantityInYards,
            attributes: [
              { key: 'Fabric Type', value: 'Quilting Cotton' },
              { key: 'Quantity Unit', value: 'Yards' },
            ],
          });
        } else if (shopifyLine.quantity !== localItem.quantityInYards) {
          // Quantity changed - update line
          linesToUpdate.push({
            id: shopifyLine.id,
            quantity: localItem.quantityInYards,
          });
        }
      }

      // Find items in Shopify but not in local (removed)
      for (const [variantId, shopifyLine] of shopifyByVariant) {
        if (!localByVariant.has(variantId)) {
          lineIdsToRemove.push(shopifyLine.id);
        }
      }

      // Execute operations
      if (linesToAdd.length > 0 && cartId) {
        await addToCart(cartId, linesToAdd);
      }

      if (linesToUpdate.length > 0 && cartId) {
        await cartLinesUpdate(cartId, linesToUpdate);
      }

      if (lineIdsToRemove.length > 0 && cartId) {
        await cartLinesRemove(cartId, lineIdsToRemove);
      }

      // Update buyer identity if email provided
      if (buyerEmail && cartId) {
        try {
          const result = await cartBuyerIdentityUpdate(cartId, buyerEmail);
          checkoutUrl = result.checkoutUrl;
          set({ checkoutUrl });
        } catch (error) {
          console.warn('Failed to update buyer identity:', error);
        }
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

  restoreFromShopify: async () => {
    if (!isShopifyEnabled()) {
      return;
    }

    const state = get();

    // Only restore if we have a cart ID (from localStorage persistence)
    if (!state.shopifyCartId) {
      return;
    }

    try {
      const shopifyCart = await getCart(state.shopifyCartId);

      if (!shopifyCart || !shopifyCart.checkoutUrl) {
        // Cart expired or invalid - clear local state
        set({ shopifyCartId: null, checkoutUrl: null, items: [] });
        return;
      }

      // Restore cart items from Shopify
      // Note: We can only restore if the variant IDs map back to local fabrics
      // For now, we restore the cart ID and checkout URL
      // Items will be synced on next addProjectYardageToCart call
      set({
        checkoutUrl: shopifyCart.checkoutUrl,
      });
    } catch (error) {
      console.warn('Failed to restore cart from Shopify:', error);
    }
  },
}));
