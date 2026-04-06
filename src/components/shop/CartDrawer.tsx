'use client';

import { useEffect } from 'react';
import { useCartStore, type CartItem } from '@/stores/cartStore';
import { X, Minus, Plus, Trash2, ShoppingBag, Copy } from 'lucide-react';

const CART_STORAGE_KEY = 'quiltcorgi_cart';

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

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
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

  // Save cart to localStorage when items change
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
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
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
        onClick={() => setDrawerOpen(false)}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md glass-elevated border-l border-white/40 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/40">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} className="text-on-surface" />
            <h2 className="text-lg font-semibold text-on-surface">Shopping Cart</h2>
            <span className="text-xs text-secondary">
              ({items.length} item{items.length !== 1 ? 's' : ''})
            </span>
          </div>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="p-1.5 text-secondary hover:text-on-surface transition-colors"
            aria-label="Close cart"
          >
            <X size={20} />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-5 mt-3 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
            {error}
          </div>
        )}

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-full bg-primary-container/40 flex items-center justify-center mb-3">
                <ShoppingBag size={24} className="text-secondary" />
              </div>
              <p className="text-sm font-medium text-on-surface mb-1">Your cart is empty</p>
              <p className="text-xs text-secondary">Add fabrics from the shop to get started.</p>
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
          <div className="border-t border-white/40 px-5 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-secondary">Subtotal</span>
              <span className="text-lg font-bold text-on-surface">${subtotal.toFixed(2)}</span>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCopyList}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full bg-white/50 text-sm font-medium text-secondary hover:bg-white/70 transition-colors"
              >
                <Copy size={14} />
                Copy List
              </button>
              {checkoutUrl ? (
                <a
                  href={checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full bg-gradient-to-r from-orange-500 to-rose-400 text-white text-sm font-semibold hover:opacity-90 transition-all shadow-elevation-1"
                >
                  {isLoading ? 'Loading...' : 'Checkout'}
                </a>
              ) : (
                <button
                  type="button"
                  onClick={handleCopyList}
                  className="flex-1 py-2.5 rounded-full bg-gradient-to-r from-orange-500 to-rose-400 text-white text-sm font-semibold hover:opacity-90 transition-all shadow-elevation-1"
                >
                  Copy Shopping List
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={clearCart}
              className="w-full text-center text-xs text-secondary hover:text-error transition-colors"
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
    <div className="flex gap-3 p-3 glass-panel rounded-xl">
      {/* Swatch */}
      <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 border border-white/40">
        {item.fabricImageUrl ? (
          <img
            src={item.fabricImageUrl}
            alt={item.fabricName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-primary-container/40 flex items-center justify-center">
            <span className="text-lg">🧵</span>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-on-surface truncate">{item.fabricName}</h4>
        <p className="text-xs text-secondary">${item.pricePerYard.toFixed(2)}/yd</p>

        {/* Quantity controls */}
        <div className="flex items-center gap-2 mt-1.5">
          <button
            type="button"
            onClick={() => onQuantityChange(item.fabricId, -0.25)}
            disabled={item.quantityInYards <= 0.25}
            className="w-6 h-6 rounded-full bg-white/60 flex items-center justify-center text-secondary hover:bg-white/80 disabled:opacity-30 transition-colors"
          >
            <Minus size={12} />
          </button>
          <span className="text-xs font-medium text-on-surface min-w-[3rem] text-center">
            {item.quantityInYards} yd{item.quantityInYards !== 1 ? 's' : ''}
          </span>
          <button
            type="button"
            onClick={() => onQuantityChange(item.fabricId, 0.25)}
            className="w-6 h-6 rounded-full bg-white/60 flex items-center justify-center text-secondary hover:bg-white/80 transition-colors"
          >
            <Plus size={12} />
          </button>
        </div>
      </div>

      {/* Line total + remove */}
      <div className="flex flex-col items-end justify-between">
        <span className="text-sm font-semibold text-on-surface">${lineTotal.toFixed(2)}</span>
        <button
          type="button"
          onClick={() => onRemove(item.fabricId)}
          className="p-1 text-secondary hover:text-error transition-colors"
          aria-label={`Remove ${item.fabricName}`}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
