'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useYardageStore } from '@/stores/yardageStore';
import { useCanvasStore } from '@/stores/canvasStore';
import { STANDARD_WOFS, type WOF } from '@/lib/yardage-utils';

export function YardagePanel() {
  const isPanelOpen = useYardageStore((s) => s.isPanelOpen);
  const togglePanel = useYardageStore((s) => s.togglePanel);
  const wof = useYardageStore((s) => s.wof);
  const setWof = useYardageStore((s) => s.setWof);
  const wasteMargin = useYardageStore((s) => s.wasteMargin);
  const setWasteMargin = useYardageStore((s) => s.setWasteMargin);
  const results = useYardageStore((s) => s.results);
  const unitSystem = useCanvasStore((s) => s.unitSystem);

  const wastePercent = Math.round(wasteMargin * 100);

  const totalYards = results.reduce((sum, r) => sum + r.yardsRequired, 0);
  const totalFatQuarters = results.reduce((sum, r) => sum + r.fatQuartersRequired, 0);

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
                <div className="flex justify-between text-[10px] text-secondary">
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

            {/* Footer Totals */}
            {results.length > 0 && (
              <div className="px-4 py-3 border-t border-outline-variant bg-background">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <div className="font-medium text-on-surface">Total Yardage</div>
                  <div className="text-on-surface font-mono text-right font-semibold">
                    {totalYards.toFixed(3)} yd
                  </div>
                  <div className="font-medium text-on-surface">Total Fat Quarters</div>
                  <div className="text-on-surface font-mono text-right font-semibold">
                    {totalFatQuarters}
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
