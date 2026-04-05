'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore, type CartItem } from '@/stores/cartStore';
import { isShopifyEnabled } from '@/lib/shopify';

/**
 * CartDrawer Component
 *
 * A slide-out drawer that displays the current cart contents.
 * Reads from the cartStore and provides a "Proceed to Checkout" button
 * that redirects to the Shopify checkout URL.
 *
 * Feature-flagged behind NEXT_PUBLIC_ENABLE_SHOP
 */
export function CartDrawer() {
  const {
    isDrawerOpen,
    toggleDrawer,
    items,
    checkoutUrl,
    isLoading,
    error,
    removeItem,
    updateItemQuantity,
    clearCart,
  } = useCartStore();

  // Don't render if Shopify is not enabled
  if (!isShopifyEnabled()) {
    return null;
  }

  // Calculate totals
  const totalItems = items.length;
  const totalYards = items.reduce((sum, item) => sum + item.quantityInYards, 0);
  const totalPriceCents = items.reduce(
    (sum, item) => sum + item.pricePerYard * item.quantityInYards,
    0
  );
  const totalPriceDollars = (totalPriceCents / 100).toFixed(2);

  const handleCheckout = () => {
    if (checkoutUrl) {
      window.location.href = checkoutUrl;
    }
  };

  const handleClearCart = () => {
    if (confirm('Are you sure you want to clear your cart?')) {
      clearCart();
    }
  };

  return (
    <AnimatePresence>
      {isDrawerOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleDrawer}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-surface shadow-elevation-4 z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant">
              <h2 className="text-lg font-semibold text-on-surface">Your Fabric Cart</h2>
              <button
                type="button"
                onClick={toggleDrawer}
                className="w-8 h-8 flex items-center justify-center rounded-full text-secondary hover:text-on-surface hover:bg-background transition-colors"
                title="Close"
              >
                &times;
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mx-6 mt-4 p-3 bg-error-container text-on-error-container rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {items.length === 0 ? (
                <div className="text-center py-12 text-secondary">
                  <p className="text-lg mb-2">Your cart is empty</p>
                  <p className="text-sm">Add fabrics from the Yardage Panel to get started.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <CartItemCard
                      key={item.fabricId}
                      item={item}
                      onRemove={() => removeItem(item.fabricId)}
                      onQuantityChange={(qty) => updateItemQuantity(item.fabricId, qty)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Footer with Totals and Checkout */}
            {items.length > 0 && (
              <div className="border-t border-outline-variant px-6 py-4 bg-background">
                {/* Summary */}
                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex justify-between text-secondary">
                    <span>Total Items</span>
                    <span className="text-on-surface font-mono">{totalItems}</span>
                  </div>
                  <div className="flex justify-between text-secondary">
                    <span>Total Yardage</span>
                    <span className="text-on-surface font-mono">{totalYards.toFixed(3)} yd</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold">
                    <span className="text-on-surface">Estimated Total</span>
                    <span className="text-on-surface font-mono">${totalPriceDollars}</span>
                  </div>
                  <p className="text-xs text-secondary">
                    * Final price calculated at checkout based on actual yardage
                  </p>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleCheckout}
                    disabled={isLoading || !checkoutUrl}
                    className="btn-primary-sm w-full disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Processing...' : 'Proceed to Checkout'}
                  </button>

                  <button
                    type="button"
                    onClick={handleClearCart}
                    disabled={isLoading}
                    className="w-full py-2 px-4 text-secondary hover:text-on-surface 
                             disabled:opacity-50 disabled:cursor-not-allowed
                             transition-colors text-sm"
                  >
                    Clear Cart
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * Individual Cart Item Card
 */
function CartItemCard({
  item,
  onRemove,
  onQuantityChange,
}: {
  item: CartItem;
  onRemove: () => void;
  onQuantityChange: (qty: number) => void;
}) {
  const itemTotal = ((item.pricePerYard * item.quantityInYards) / 100).toFixed(2);

  return (
    <div className="relative flex gap-3 p-3 bg-background rounded-lg border border-outline-variant">
      {/* Fabric Image */}
      <div className="w-16 h-16 flex-shrink-0 rounded overflow-hidden bg-surface">
        {item.fabricImageUrl ? (
          <img
            src={item.fabricImageUrl}
            alt={item.fabricName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-secondary">
            No Image
          </div>
        )}
      </div>

      {/* Item Details */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-on-surface truncate">{item.fabricName}</h3>
        <p className="text-xs text-secondary mt-1">
          ${(item.pricePerYard / 100).toFixed(2)} per yard
        </p>

        {/* Quantity Controls */}
        <div className="flex items-center gap-2 mt-2">
          <label className="text-xs text-secondary">Qty:</label>
          <input
            type="number"
            min="0"
            step="0.125"
            value={item.quantityInYards.toFixed(3)}
            onChange={(e) => {
              const value = parseFloat(e.target.value) || 0;
              if (value >= 0) {
                onQuantityChange(value);
              }
            }}
            className="w-20 px-2 py-1 text-sm border border-outline-variant rounded bg-surface 
                     text-on-surface focus:outline-none focus:border-primary"
          />
          <span className="text-xs text-secondary">yd</span>
        </div>
      </div>

      {/* Remove Button */}
      <button
        type="button"
        onClick={onRemove}
        className="self-start text-secondary hover:text-error transition-colors p-1"
        title="Remove item"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      {/* Item Total */}
      <div className="absolute bottom-3 right-6 text-sm font-semibold text-on-surface">
        ${itemTotal}
      </div>
    </div>
  );
}
