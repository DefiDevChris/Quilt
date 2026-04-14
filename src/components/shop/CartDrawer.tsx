'use client';

import { useEffect, useRef } from 'react';
import { useCartStore, type CartItem } from '@/stores/cartStore';
import { isShopifyEnabled } from '@/lib/shopify';
import { X, Minus, Plus, Trash2, ShoppingBag, Copy } from 'lucide-react';
import { COLORS, COLORS_HOVER, SHADOW } from '@/lib/design-system';

const CART_ITEMS_STORAGE_KEY = 'quilt-studio-cart-items';

/**
 * Slide-out cart drawer. Persists items in localStorage.
 */
export function CartDrawer() {
  const isDrawerOpen = useCartStore((s) => s.isDrawerOpen);
  const items = useCartStore((s) => s.items);
  const isLoading = useCartStore((s) => s.isLoading);
  const error = useCartStore((s) => s.error);
  const checkoutUrl = useCartStore((s) => s.checkoutUrl);
  const setDrawerOpen = useCartStore((s) => s.setDrawerOpen);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateItemQuantity = useCartStore((s) => s.updateItemQuantity);
  const clearCart = useCartStore((s) => s.clearCart);
  const setError = useCartStore((s) => s.setError);
  const restoreCartIdFromStorage = useCartStore((s) => s.restoreCartIdFromStorage);
  const restoreFromShopify = useCartStore((s) => s.restoreFromShopify);
  const initialized = useRef(false);

  // Initialize cart once on mount: restore cart ID from localStorage, then fetch from Shopify
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    restoreCartIdFromStorage();

    // Restore cart from Shopify if we have a cart ID
    const tryRestore = async () => {
      const store = useCartStore.getState();
      if (store.shopifyCartId && isShopifyEnabled()) {
        try {
          await restoreFromShopify();
        } catch {
          // Cart restore failed — ignore, user can still add items
        }
      }
    };
    tryRestore();
  }, [restoreCartIdFromStorage, restoreFromShopify]);

  // Load cart items from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_ITEMS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as CartItem[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          const store = useCartStore.getState();
          parsed.forEach((item) => store.addItem(item));
        }
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Save cart items to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem(CART_ITEMS_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage full or unavailable
    }
  }, [items]);

  const subtotal = items.reduce((sum, item) => sum + item.pricePerYard * item.quantityInYards, 0);

  const handleQuantityChange = (fabricId: string, delta: number) => {
    const item = items.find((i) => i.fabricId === fabricId);
    if (!item) return;
    const newQty = Math.max(0.25, item.quantityInYards + delta);
    updateItemQuantity(fabricId, newQty);
  };

  const handleCopyList = () => {
    const lines = items.map(
      (item) =>
        `${item.fabricName} — ${item.quantityInYards} yd${item.quantityInYards !== 1 ? 's' : ''} @ $${item.pricePerYard.toFixed(2)}/yd`
    );
    lines.push('', `Subtotal: $${subtotal.toFixed(2)}`);
    navigator.clipboard.writeText(lines.join('\n'));
    setError(null);
  };

  if (!isDrawerOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ backgroundColor: 'rgba(26, 26, 26, 0.3)' }}
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md flex flex-col overflow-hidden"
        style={{
          backgroundColor: COLORS.surface,
          borderColor: COLORS.border,
          borderLeftWidth: '1px',
          boxShadow: SHADOW.elevated,
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottomWidth: '1px', borderColor: COLORS.border }}
        >
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} style={{ color: COLORS.textDim }} />
            <h2 className="text-[16px] leading-[24px] font-semibold" style={{ color: COLORS.text }}>
              Shopping Cart
            </h2>
            <span className="text-[14px] leading-[20px]" style={{ color: COLORS.textDim }}>
              ({items.length} item{items.length !== 1 ? 's' : ''})
            </span>
          </div>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="p-1.5 rounded-full transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2"
            style={{ color: COLORS.textDim }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = `${COLORS.primary}1a`)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            aria-label="Close cart"
          >
            <X size={20} />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div
            className="mx-5 mt-3 px-3 py-2 rounded-lg text-xs"
            style={{
              backgroundColor: `${COLORS.error}0d`,
              borderColor: `${COLORS.error}33`,
              borderStyle: 'solid',
              borderWidth: '1px',
              color: COLORS.error,
            }}
          >
            {error}
          </div>
        )}

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mb-3"
                style={{ backgroundColor: `${COLORS.primary}40` }}
              >
                <ShoppingBag size={24} style={{ color: COLORS.textDim }} />
              </div>
              <p
                className="text-[14px] leading-[20px] font-medium mb-1"
                style={{ color: COLORS.text }}
              >
                Your cart is empty
              </p>
              <p className="text-[14px] leading-[20px]" style={{ color: COLORS.textDim }}>
                Add fabrics from the shop to get started.
              </p>
            </div>
          ) : (
            items.map((item) => (
              <CartItemRow
                key={item.fabricId}
                item={item}
                onQuantityChange={handleQuantityChange}
                onRemove={removeItem}
              />
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div
            className="px-5 py-4 space-y-3"
            style={{ borderTopWidth: '1px', borderColor: COLORS.border, borderTopStyle: 'solid' }}
          >
            <div className="flex items-center justify-between">
              <span
                className="text-[14px] leading-[20px] font-medium"
                style={{ color: COLORS.textDim }}
              >
                Subtotal
              </span>
              <span className="text-[16px] leading-[24px] font-bold" style={{ color: COLORS.text }}>
                ${subtotal.toFixed(2)}
              </span>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCopyList}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full border-2 text-[14px] leading-[20px] font-medium transition-colors duration-150"
                style={{ borderColor: COLORS.border, color: COLORS.textDim }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = COLORS.bg)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <Copy size={14} />
                Copy List
              </button>
              {checkoutUrl ? (
                <a
                  href={checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-[16px] leading-[24px] transition-colors duration-150"
                  style={{
                    backgroundColor: COLORS.primary,
                    color: COLORS.text,
                    boxShadow: SHADOW.brand,
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = COLORS_HOVER.primary)
                  }
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = COLORS.primary)}
                >
                  {isLoading ? 'Loading...' : 'Checkout'}
                </a>
              ) : (
                <button
                  type="button"
                  onClick={handleCopyList}
                  className="flex-1 py-2.5 rounded-full text-[16px] leading-[24px] transition-colors duration-150"
                  style={{
                    backgroundColor: COLORS.primary,
                    color: COLORS.text,
                    boxShadow: SHADOW.brand,
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = COLORS_HOVER.primary)
                  }
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = COLORS.primary)}
                >
                  Copy Shopping List
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={clearCart}
              className="w-full text-center text-[14px] leading-[20px] transition-colors duration-150"
              style={{ color: COLORS.textDim }}
              onMouseEnter={(e) => (e.currentTarget.style.color = COLORS.primary)}
              onMouseLeave={(e) => (e.currentTarget.style.color = COLORS.textDim)}
            >
              Clear Cart
            </button>
          </div>
        )}
      </div>
    </>
  );
}

function CartItemRow({
  item,
  onQuantityChange,
  onRemove,
}: {
  item: CartItem;
  onQuantityChange: (fabricId: string, delta: number) => void;
  onRemove: (fabricId: string) => void;
}) {
  const lineTotal = item.pricePerYard * item.quantityInYards;

  return (
    <div
      className="flex gap-3 p-3 rounded-lg"
      style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border, borderWidth: '1px' }}
    >
      {/* Swatch */}
      <div
        className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0"
        style={{ borderColor: COLORS.border, borderWidth: '1px' }}
      >
        {item.fabricImageUrl ? (
          <img
            src={item.fabricImageUrl}
            alt={item.fabricName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: `${COLORS.primary}40` }}
          >
            <span className="text-lg">🧵</span>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <h4
          className="text-[14px] leading-[20px] font-medium truncate"
          style={{ color: COLORS.text }}
        >
          {item.fabricName}
        </h4>
        <p className="text-[14px] leading-[20px]" style={{ color: COLORS.textDim }}>
          ${item.pricePerYard.toFixed(2)}/yd
        </p>

        {/* Quantity controls */}
        <div className="flex items-center gap-2 mt-1.5">
          <button
            type="button"
            onClick={() => onQuantityChange(item.fabricId, -0.25)}
            disabled={item.quantityInYards <= 0.25}
            className="w-6 h-6 rounded-full flex items-center justify-center transition-colors duration-150 disabled:opacity-50"
            style={{ borderColor: COLORS.border, borderWidth: '1px', color: COLORS.textDim }}
            onMouseEnter={(e) => {
              if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = COLORS.bg;
            }}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            aria-label={`Decrease quantity of ${item.fabricName}`}
          >
            <Minus size={12} />
          </button>
          <span
            className="text-[14px] leading-[20px] font-medium min-w-[3rem] text-center"
            style={{ color: COLORS.text }}
          >
            {item.quantityInYards} yd{item.quantityInYards !== 1 ? 's' : ''}
          </span>
          <button
            type="button"
            onClick={() => onQuantityChange(item.fabricId, 0.25)}
            className="w-6 h-6 rounded-full flex items-center justify-center transition-colors duration-150"
            style={{ borderColor: COLORS.border, borderWidth: '1px', color: COLORS.textDim }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = COLORS.bg)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            aria-label={`Increase quantity of ${item.fabricName}`}
          >
            <Plus size={12} />
          </button>
        </div>
      </div>

      {/* Line total + remove */}
      <div className="flex flex-col items-end justify-between">
        <span className="text-[14px] leading-[20px] font-semibold" style={{ color: COLORS.text }}>
          ${lineTotal.toFixed(2)}
        </span>
        <button
          type="button"
          onClick={() => onRemove(item.fabricId)}
          className="p-1 rounded-full transition-colors duration-150"
          style={{ color: COLORS.textDim }}
          onMouseEnter={(e) => (e.currentTarget.style.color = COLORS.primary)}
          onMouseLeave={(e) => (e.currentTarget.style.color = COLORS.textDim)}
          aria-label={`Remove ${item.fabricName}`}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
