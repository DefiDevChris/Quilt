'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useYardageStore } from '@/stores/yardageStore';
import { useCanvasStore } from '@/stores/canvasStore';
import { useCartStore } from '@/stores/cartStore';
import { useFabricStore } from '@/stores/fabricStore';
import { STANDARD_WOFS, type WOF } from '@/lib/yardage-utils';
import { isShopifyEnabled } from '@/lib/shopify';

export function YardagePanel() {
  const isPanelOpen = useYardageStore((s) => s.isPanelOpen);
  const togglePanel = useYardageStore((s) => s.togglePanel);
  const wof = useYardageStore((s) => s.wof);
  const setWof = useYardageStore((s) => s.setWof);
  const wasteMargin = useYardageStore((s) => s.wasteMargin);
  const setWasteMargin = useYardageStore((s) => s.setWasteMargin);
  const results = useYardageStore((s) => s.results);
  const backingResult = useYardageStore((s) => s.backingResult);
  const bindingResult = useYardageStore((s) => s.bindingResult);
  const unitSystem = useCanvasStore((s) => s.unitSystem);
  
  // Cart integration
  const { addProjectYardageToCart, isLoading: isAddingToCart } = useCartStore();
  const fabrics = useFabricStore((s) => s.fabrics);

  const wastePercent = Math.round(wasteMargin * 100);

  const totalYards = results.reduce((sum, r) => sum + r.yardsRequired, 0);
  const totalFatQuarters = results.reduce((sum, r) => sum + r.fatQuartersRequired, 0);

  // Check if Shopify is enabled
  const shopEnabled = isShopifyEnabled();

  const handleAddToCart = async () => {
    await addProjectYardageToCart(results, fabrics);
  };

  return (
    <AnimatePresence>
      {isPanelOpen && (
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: 300 }}
          exit={{ width: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="flex-shrink-0 h-full overflow-hidden border-l border-outline-variant"
        >
          {/* Fixed-width inner so content doesn't squish during animation */}
          <div className="w-[300px] h-full bg-surface shadow-elevation-2 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant">
              <h3 className="text-sm font-semibold text-on-surface">Yardage Estimator</h3>
              <button
                type="button"
                onClick={togglePanel}
                className="w-6 h-6 flex items-center justify-center rounded text-secondary hover:text-on-surface hover:bg-background transition-colors"
                title="Close"
              >
                &times;
              </button>
            </div>

            {/* Controls */}
            <div className="px-4 py-3 border-b border-outline-variant space-y-3">
              {/* WOF Selector */}
              <div>
                <label className="text-xs font-medium text-secondary block mb-1">
                  Width of Fabric (WOF)
                </label>
                <select
                  value={wof}
                  onChange={(e) => setWof(Number(e.target.value) as WOF)}
                  className="w-full rounded-sm border border-outline-variant bg-surface px-2 py-1.5 text-sm text-on-surface focus:outline-none focus:border-primary"
                >
                  {STANDARD_WOFS.map((w) => (
                    <option key={w} value={w}>
                      {w}&quot;
                    </option>
                  ))}
                </select>
              </div>

              {/* Waste Margin Slider */}
              <div>
                <label className="text-xs font-medium text-secondary block mb-1">
                  Waste Margin: {wastePercent}%
                </label>
                <input
                  type="range"
                  min={5}
                  max={25}
                  step={1}
                  value={wastePercent}
                  onChange={(e) => setWasteMargin(Number(e.target.value) / 100)}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-caption text-secondary">
                  <span>5%</span>
                  <span>25%</span>
                </div>
              </div>
            </div>

            {/* Results Table */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {results.length === 0 ? (
                <div className="text-center py-8 text-sm text-secondary">
                  <p>No fabrics detected.</p>
                  <p className="mt-1 text-xs">
                    Add shapes with fabric or color fills to see yardage estimates.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {results.map((result) => (
                    <div
                      key={result.groupKey}
                      className="rounded-lg border border-outline-variant p-3 bg-background"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-4 h-4 rounded border border-outline-variant flex-shrink-0"
                          style={{ backgroundColor: result.fillColor }}
                        />
                        <span className="text-xs font-medium text-on-surface truncate">
                          {result.displayName}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        <div className="text-secondary">Pieces</div>
                        <div className="text-on-surface font-mono text-right">
                          {result.shapeCount}
                        </div>

                        <div className="text-secondary">Total Area</div>
                        <div className="text-on-surface font-mono text-right">
                          {unitSystem === 'imperial'
                            ? `${result.totalAreaSqIn.toFixed(1)} sq in`
                            : `${(result.totalAreaSqIn * 6.4516).toFixed(1)} sq cm`}
                        </div>

                        <div className="text-secondary">Yardage</div>
                        <div className="text-on-surface font-mono text-right font-semibold">
                          {result.yardsRequired.toFixed(3)} yd
                        </div>

                        <div className="text-secondary">Fat Quarters</div>
                        <div className="text-on-surface font-mono text-right">
                          {result.fatQuartersRequired}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Backing & Binding */}
            {(backingResult || bindingResult) && (
              <div className="px-4 py-3 border-t border-outline-variant">
                <h4 className="text-caption font-semibold uppercase tracking-wider text-on-surface/50 mb-2">
                  Finishing
                </h4>
                <div className="space-y-2">
                  {backingResult && (
                    <div className="rounded-lg border border-outline-variant p-3 bg-background">
                      <div className="text-xs font-medium text-on-surface mb-1">Backing</div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        <div className="text-secondary">Yardage</div>
                        <div className="text-on-surface font-mono text-right font-semibold">
                          {backingResult.yardsRequired.toFixed(3)} yd
                        </div>
                        <div className="text-secondary">Panels</div>
                        <div className="text-on-surface font-mono text-right">
                          {backingResult.panelsNeeded}
                        </div>
                        <div className="text-secondary">Panel length</div>
                        <div className="text-on-surface font-mono text-right">
                          {backingResult.panelLengthInches.toFixed(1)}&quot;
                        </div>
                      </div>
                    </div>
                  )}
                  {bindingResult && (
                    <div className="rounded-lg border border-outline-variant p-3 bg-background">
                      <div className="text-xs font-medium text-on-surface mb-1">Binding</div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        <div className="text-secondary">Yardage</div>
                        <div className="text-on-surface font-mono text-right font-semibold">
                          {bindingResult.yardsRequired.toFixed(3)} yd
                        </div>
                        <div className="text-secondary">
                          Strips ({bindingResult.stripWidthInches}&quot;)
                        </div>
                        <div className="text-on-surface font-mono text-right">
                          {bindingResult.stripCount}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Footer Totals */}
            {results.length > 0 && (
              <div className="px-4 py-3 border-t border-outline-variant bg-background">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <div className="font-medium text-on-surface">Quilt Top</div>
                  <div className="text-on-surface font-mono text-right font-semibold">
                    {totalYards.toFixed(3)} yd
                  </div>
                  {backingResult && (
                    <>
                      <div className="font-medium text-on-surface">+ Backing</div>
                      <div className="text-on-surface font-mono text-right font-semibold">
                        {backingResult.yardsRequired.toFixed(3)} yd
                      </div>
                    </>
                  )}
                  {bindingResult && (
                    <>
                      <div className="font-medium text-on-surface">+ Binding</div>
                      <div className="text-on-surface font-mono text-right font-semibold">
                        {bindingResult.yardsRequired.toFixed(3)} yd
                      </div>
                    </>
                  )}
                  <div className="col-span-2 border-t border-outline-variant/30 my-1" />
                  <div className="font-medium text-on-surface">Grand Total</div>
                  <div className="text-on-surface font-mono text-right font-semibold">
                    {(
                      totalYards +
                      (backingResult?.yardsRequired ?? 0) +
                      (bindingResult?.yardsRequired ?? 0)
                    ).toFixed(3)}{' '}
                    yd
                  </div>
                  <div className="font-medium text-on-surface">Total Fat Quarters</div>
                  <div className="text-on-surface font-mono text-right font-semibold">
                    {totalFatQuarters}
                  </div>
                </div>

                {/* Add to Cart Button (Shopify Integration) */}
                {shopEnabled && (
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={isAddingToCart}
                    className="w-full mt-3 py-2.5 px-4 bg-secondary text-on-secondary rounded-lg 
                             font-medium text-sm hover:bg-secondary-hover 
                             disabled:opacity-50 disabled:cursor-not-allowed
                             transition-colors flex items-center justify-center gap-2"
                  >
                    {isAddingToCart ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Adding...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Add Purchasable Fabrics to Cart
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
