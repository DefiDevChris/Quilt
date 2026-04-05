'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '@/stores/cartStore';
import { useState } from 'react';

export function CartDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const items = useCartStore((s) => s.items);
  const checkoutUrl = useCartStore((s) => s.checkoutUrl);

  // Hidden behind feature flag
  if (process.env.NEXT_PUBLIC_ENABLE_SHOP !== 'true') {
    return null;
  }

  // Hide entirely if empty (optional based on UX needs, but good for now)
  if (items.length === 0) {
    return null;
  }

  const toggleDrawer = () => setIsOpen((prev) => !prev);

  const totalCents = items.reduce(
    (sum, item) => sum + item.pricePerYard * item.quantityInYards,
    0
  );
  const totalDollars = (totalCents / 100).toFixed(2);

  return (
    <>
      <button
        onClick={toggleDrawer}
        className="fixed bottom-4 right-4 z-50 bg-primary text-on-primary px-4 py-2 rounded-full shadow-elevation-3 font-semibold hover:bg-primary-hover transition-colors"
      >
        Cart ({items.length})
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={toggleDrawer}
              className="fixed inset-0 bg-black z-50"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-[350px] bg-surface shadow-elevation-4 z-50 flex flex-col"
            >
              <div className="flex items-center justify-between px-4 py-4 border-b border-outline-variant">
                <h2 className="text-lg font-semibold text-on-surface">Your Cart</h2>
                <button
                  onClick={toggleDrawer}
                  className="w-8 h-8 flex items-center justify-center rounded text-secondary hover:bg-background hover:text-on-surface transition-colors"
                >
                  &times;
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {items.map((item, index) => (
                  <div
                    key={`${item.fabricId}-${index}`}
                    className="flex justify-between items-start border-b border-outline-variant pb-4"
                  >
                    <div>
                      <h3 className="text-sm font-medium text-on-surface">
                        Fabric ID: {item.fabricId?.substring(0, 8)}...
                      </h3>
                      <p className="text-xs text-secondary mt-1">
                        Variant: {item.shopifyVariantId}
                      </p>
                      <p className="text-xs text-secondary">
                        Quantity: {item.quantityInYards.toFixed(3)} yds
                      </p>
                    </div>
                    <div className="text-sm font-semibold text-on-surface">
                      ${((item.pricePerYard * item.quantityInYards) / 100).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-outline-variant bg-background">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-medium text-on-surface">Total</span>
                  <span className="font-semibold text-lg text-on-surface">
                    ${totalDollars}
                  </span>
                </div>

                {checkoutUrl ? (
                  <a
                    href={checkoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full py-3 bg-primary text-on-primary text-center rounded font-semibold hover:bg-primary-hover transition-colors"
                  >
                    Proceed to Checkout
                  </a>
                ) : (
                  <button
                    disabled
                    className="w-full py-3 bg-surface text-secondary text-center rounded font-semibold border border-outline-variant opacity-50 cursor-not-allowed"
                  >
                    Syncing with Shopify...
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
