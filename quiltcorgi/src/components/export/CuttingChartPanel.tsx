'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  generateCuttingChart,
  optimizeStripCutting,
  formatFraction,
  type CuttingChartEntry,
  type CuttingChartItem,
} from '@/lib/cutting-chart-generator';
import type { WOF } from '@/lib/yardage-engine';

interface CuttingChartPanelProps {
  isOpen: boolean;
  onClose: () => void;
  items: CuttingChartItem[];
  seamAllowance: number;
}

const WOF_OPTIONS: WOF[] = [42, 44, 45, 54, 60];

export function CuttingChartPanel({
  isOpen,
  onClose,
  items,
  seamAllowance,
}: CuttingChartPanelProps) {
  const [wof, setWof] = useState<WOF>(42);

  const chart = useMemo(() => generateCuttingChart(items, seamAllowance), [items, seamAllowance]);

  const allPatches = useMemo(() => chart.flatMap((entry) => entry.patches), [chart]);

  const stripPlans = useMemo(() => optimizeStripCutting(allPatches, wof), [allPatches, wof]);

  const totalPieces = chart.reduce((sum, entry) => sum + entry.totalPieces, 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 300, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed right-0 top-12 bottom-0 z-40 w-[380px] bg-surface border-l border-outline-variant shadow-elevation-2 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant">
            <h3 className="text-sm font-semibold text-on-surface">
              Cutting Chart
              {totalPieces > 0 && (
                <span className="ml-1 text-xs text-secondary">({totalPieces} pieces)</span>
              )}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="text-secondary hover:text-on-surface text-sm"
            >
              Close
            </button>
          </div>

          {/* WOF Selector */}
          <div className="px-4 py-2 border-b border-outline-variant flex items-center gap-2">
            <label className="text-xs text-secondary">Width of Fabric:</label>
            <select
              value={wof}
              onChange={(e) => setWof(Number(e.target.value) as WOF)}
              className="rounded-sm border border-outline-variant bg-surface px-2 py-1 text-xs text-on-surface"
            >
              {WOF_OPTIONS.map((w) => (
                <option key={w} value={w}>
                  {w}&quot;
                </option>
              ))}
            </select>
          </div>

          {/* Chart Content */}
          <div className="flex-1 overflow-y-auto">
            {chart.length === 0 && (
              <div className="py-8 text-center text-xs text-secondary">
                No items in printlist. Add shapes to generate cutting chart.
              </div>
            )}

            {chart.map((entry: CuttingChartEntry) => (
              <div key={entry.fabricGroupKey} className="border-b border-outline-variant">
                {/* Fabric Header */}
                <div className="flex items-center gap-2 px-4 py-2 bg-background">
                  <div
                    className="w-3 h-3 rounded-sm border border-outline-variant"
                    style={{ backgroundColor: entry.fillColor }}
                  />
                  <span className="text-xs font-medium text-on-surface">
                    {entry.fabricDisplayName}
                  </span>
                  <span className="text-[10px] text-secondary">({entry.totalPieces} pieces)</span>
                </div>

                {/* Patches Table */}
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-secondary">
                      <th className="px-4 py-1 font-medium">Shape</th>
                      <th className="px-2 py-1 font-medium">Cut Size</th>
                      <th className="px-2 py-1 font-medium text-right">Qty</th>
                      <th className="px-2 py-1 font-medium">Instructions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entry.patches.map((patch, idx) => (
                      <tr key={idx} className="border-t border-outline-variant/50">
                        <td className="px-4 py-1.5 text-on-surface capitalize">{patch.shape}</td>
                        <td className="px-2 py-1.5 text-on-surface whitespace-nowrap">
                          {formatFraction(patch.cutWidth, '-')}&quot;
                          {patch.shape === 'rectangle' && (
                            <> x {formatFraction(patch.cutHeight, '-')}&quot;</>
                          )}
                        </td>
                        <td className="px-2 py-1.5 text-on-surface text-right">{patch.quantity}</td>
                        <td className="px-2 py-1.5 text-secondary text-[10px]">
                          {patch.specialInstructions ?? '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}

            {/* Strip Cutting Plans */}
            {stripPlans.length > 0 && (
              <div className="px-4 py-3">
                <h4 className="text-xs font-semibold text-on-surface mb-2">
                  Strip Cutting Plan ({wof}&quot; WOF)
                </h4>
                <div className="space-y-1">
                  {stripPlans.map((plan, idx) => (
                    <div key={idx} className="text-xs text-secondary">
                      Cut {plan.stripsNeeded} strip(s) at {formatFraction(plan.stripWidth, '-')}
                      &quot; ({plan.piecesPerStrip} per strip)
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-outline-variant">
            <button
              type="button"
              onClick={() => window.print()}
              className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Print Cutting Chart
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
