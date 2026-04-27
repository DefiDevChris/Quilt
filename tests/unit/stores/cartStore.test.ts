import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCartStore } from '@/stores/cartStore';

// Mock Shopify integration
vi.mock('@/lib/shopify', () => ({
  isShopifyEnabled: () => true,
  createCart: vi.fn(() => Promise.resolve({ cartId: 'test-cart-id', checkoutUrl: 'https://checkout.shopify.com/test' })),
  addToCart: vi.fn(() => Promise.resolve()),
  getCart: vi.fn(() => Promise.resolve({
    id: 'test-cart-id',
    checkoutUrl: 'https://checkout.shopify.com/test',
    lines: [],
  })),
  cartLinesUpdate: vi.fn(() => Promise.resolve()),
  cartLinesRemove: vi.fn(() => Promise.resolve()),
  cartBuyerIdentityUpdate: vi.fn(() => Promise.resolve({ checkoutUrl: 'https://checkout.shopify.com/test' })),
}));

describe('cartStore', () => {
  beforeEach(() => {
    useCartStore.setState({
      shopifyCartId: null,
      checkoutUrl: null,
      items: [],
      isDrawerOpen: false,
      isLoading: false,
      error: null,
    });
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = useCartStore.getState();
      expect(state.shopifyCartId).toBeNull();
      expect(state.checkoutUrl).toBeNull();
      expect(state.items).toEqual([]);
      expect(state.isDrawerOpen).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('setShopifyCartId', () => {
    it('should set shopify cart ID', () => {
      useCartStore.getState().setShopifyCartId('cart-123');
      expect(useCartStore.getState().shopifyCartId).toBe('cart-123');
    });

    it('should set shopify cart ID to null', () => {
      useCartStore.getState().setShopifyCartId('cart-123');
      useCartStore.getState().setShopifyCartId(null);
      expect(useCartStore.getState().shopifyCartId).toBeNull();
    });
  });

  describe('setCheckoutUrl', () => {
    it('should set checkout URL', () => {
      useCartStore.getState().setCheckoutUrl('https://checkout.example.com');
      expect(useCartStore.getState().checkoutUrl).toBe('https://checkout.example.com');
    });
  });

  describe('addItem', () => {
    it('should add a new item to empty cart', () => {
      const item = {
        fabricId: 'fabric-1',
        shopifyVariantId: 'variant-1',
        quantityInYards: 1.5,
        pricePerYard: 1200,
        fabricName: 'Test Fabric',
        fabricImageUrl: 'https://example.com/fabric.jpg',
      };
      useCartStore.getState().addItem(item);
      const state = useCartStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0]).toEqual(item);
    });

    it('should update existing item quantity when adding same fabric', () => {
      const item1 = {
        fabricId: 'fabric-1',
        shopifyVariantId: 'variant-1',
        quantityInYards: 1.0,
        pricePerYard: 1200,
        fabricName: 'Test Fabric',
        fabricImageUrl: 'https://example.com/fabric.jpg',
      };
      const item2 = {
        ...item1,
        quantityInYards: 0.5,
      };
      useCartStore.getState().addItem(item1);
      useCartStore.getState().addItem(item2);
      const state = useCartStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0].quantityInYards).toBe(1.5);
    });

    it('should reject item without shopifyVariantId', () => {
      const item = {
        fabricId: 'fabric-1',
        shopifyVariantId: '',
        quantityInYards: 1.5,
        pricePerYard: 1200,
        fabricName: 'Test Fabric',
        fabricImageUrl: 'https://example.com/fabric.jpg',
      };
      useCartStore.getState().addItem(item);
      const state = useCartStore.getState();
      expect(state.items).toHaveLength(0);
      expect(state.error).toBe('Invalid item: missing Shopify variant ID');
    });

    it('should reject item with zero or negative price', () => {
      const item = {
        fabricId: 'fabric-1',
        shopifyVariantId: 'variant-1',
        quantityInYards: 1.5,
        pricePerYard: 0,
        fabricName: 'Test Fabric',
        fabricImageUrl: 'https://example.com/fabric.jpg',
      };
      useCartStore.getState().addItem(item);
      const state = useCartStore.getState();
      expect(state.items).toHaveLength(0);
      expect(state.error).toBe('Invalid item: price must be greater than 0');
    });

    it('should clamp quantity to minimum increment', () => {
      const item = {
        fabricId: 'fabric-1',
        shopifyVariantId: 'variant-1',
        quantityInYards: 0.1,
        pricePerYard: 1200,
        fabricName: 'Test Fabric',
        fabricImageUrl: 'https://example.com/fabric.jpg',
      };
      useCartStore.getState().addItem(item);
      const state = useCartStore.getState();
      expect(state.items[0].quantityInYards).toBe(0.25);
    });

    it('should clamp quantity to maximum', () => {
      const item = {
        fabricId: 'fabric-1',
        shopifyVariantId: 'variant-1',
        quantityInYards: 150,
        pricePerYard: 1200,
        fabricName: 'Test Fabric',
        fabricImageUrl: 'https://example.com/fabric.jpg',
      };
      useCartStore.getState().addItem(item);
      const state = useCartStore.getState();
      expect(state.items[0].quantityInYards).toBe(100);
    });
  });

  describe('removeItem', () => {
    it('should remove item by fabric ID', () => {
      const item1 = {
        fabricId: 'fabric-1',
        shopifyVariantId: 'variant-1',
        quantityInYards: 1.0,
        pricePerYard: 1200,
        fabricName: 'Fabric 1',
        fabricImageUrl: null,
      };
      const item2 = {
        fabricId: 'fabric-2',
        shopifyVariantId: 'variant-2',
        quantityInYards: 2.0,
        pricePerYard: 1500,
        fabricName: 'Fabric 2',
        fabricImageUrl: null,
      };
      useCartStore.getState().addItem(item1);
      useCartStore.getState().addItem(item2);
      useCartStore.getState().removeItem('fabric-1');
      const state = useCartStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0].fabricId).toBe('fabric-2');
    });

    it('should do nothing if fabric ID not found', () => {
      const item = {
        fabricId: 'fabric-1',
        shopifyVariantId: 'variant-1',
        quantityInYards: 1.0,
        pricePerYard: 1200,
        fabricName: 'Fabric 1',
        fabricImageUrl: null,
      };
      useCartStore.getState().addItem(item);
      useCartStore.getState().removeItem('fabric-999');
      const state = useCartStore.getState();
      expect(state.items).toHaveLength(1);
    });
  });

  describe('updateItemQuantity', () => {
    it('should update item quantity', () => {
      const item = {
        fabricId: 'fabric-1',
        shopifyVariantId: 'variant-1',
        quantityInYards: 1.0,
        pricePerYard: 1200,
        fabricName: 'Test Fabric',
        fabricImageUrl: null,
      };
      useCartStore.getState().addItem(item);
      useCartStore.getState().updateItemQuantity('fabric-1', 2.5);
      const state = useCartStore.getState();
      expect(state.items[0].quantityInYards).toBe(2.5);
    });

    it('should reject quantity below minimum', () => {
      const item = {
        fabricId: 'fabric-1',
        shopifyVariantId: 'variant-1',
        quantityInYards: 1.0,
        pricePerYard: 1200,
        fabricName: 'Test Fabric',
        fabricImageUrl: null,
      };
      useCartStore.getState().addItem(item);
      useCartStore.getState().updateItemQuantity('fabric-1', 0.1);
      const state = useCartStore.getState();
      expect(state.items[0].quantityInYards).toBe(1.0);
      expect(state.error).toBe('Minimum quantity is 0.25 yards');
    });

    it('should reject quantity above maximum', () => {
      const item = {
        fabricId: 'fabric-1',
        shopifyVariantId: 'variant-1',
        quantityInYards: 1.0,
        pricePerYard: 1200,
        fabricName: 'Test Fabric',
        fabricImageUrl: null,
      };
      useCartStore.getState().addItem(item);
      useCartStore.getState().updateItemQuantity('fabric-1', 150);
      const state = useCartStore.getState();
      expect(state.items[0].quantityInYards).toBe(1.0);
      expect(state.error).toBe('Maximum quantity is 100 yards');
    });
  });

  describe('toggleDrawer', () => {
    it('should toggle drawer open state', () => {
      expect(useCartStore.getState().isDrawerOpen).toBe(false);
      useCartStore.getState().toggleDrawer();
      expect(useCartStore.getState().isDrawerOpen).toBe(true);
      useCartStore.getState().toggleDrawer();
      expect(useCartStore.getState().isDrawerOpen).toBe(false);
    });
  });

  describe('setDrawerOpen', () => {
    it('should set drawer open state explicitly', () => {
      useCartStore.getState().setDrawerOpen(true);
      expect(useCartStore.getState().isDrawerOpen).toBe(true);
      useCartStore.getState().setDrawerOpen(false);
      expect(useCartStore.getState().isDrawerOpen).toBe(false);
    });
  });

  describe('setLoading', () => {
    it('should set loading state', () => {
      useCartStore.getState().setLoading(true);
      expect(useCartStore.getState().isLoading).toBe(true);
      useCartStore.getState().setLoading(false);
      expect(useCartStore.getState().isLoading).toBe(false);
    });
  });

  describe('setError', () => {
    it('should set error message', () => {
      useCartStore.getState().setError('Test error');
      expect(useCartStore.getState().error).toBe('Test error');
      useCartStore.getState().setError(null);
      expect(useCartStore.getState().error).toBeNull();
    });
  });

  describe('clearCart', () => {
    it('should clear all cart items', async () => {
      const item = {
        fabricId: 'fabric-1',
        shopifyVariantId: 'variant-1',
        quantityInYards: 1.0,
        pricePerYard: 1200,
        fabricName: 'Test Fabric',
        fabricImageUrl: null,
      };
      useCartStore.getState().addItem(item);
      await useCartStore.getState().clearCart();
      const state = useCartStore.getState();
      expect(state.items).toHaveLength(0);
      expect(state.shopifyCartId).toBeNull();
      expect(state.checkoutUrl).toBeNull();
    });
  });

  describe('reset', () => {
    it('should reset to initial state', () => {
      const item = {
        fabricId: 'fabric-1',
        shopifyVariantId: 'variant-1',
        quantityInYards: 1.0,
        pricePerYard: 1200,
        fabricName: 'Test Fabric',
        fabricImageUrl: null,
      };
      useCartStore.getState().addItem(item);
      useCartStore.getState().setDrawerOpen(true);
      useCartStore.getState().setError('Test error');
      useCartStore.getState().reset();
      const state = useCartStore.getState();
      expect(state.items).toHaveLength(0);
      expect(state.isDrawerOpen).toBe(false);
      expect(state.error).toBeNull();
    });
  });
});
