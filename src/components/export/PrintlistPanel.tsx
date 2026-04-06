'use client';

import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePrintlistStore } from '@/stores/printlistStore';
import { useProjectStore } from '@/stores/projectStore';
import { sanitizeSvg } from '@/lib/sanitize-svg';

interface PrintlistPanelProps {
  onGeneratePdf: () => void;
  onExportImage: () => void;
}

export function PrintlistPanel({ onGeneratePdf, onExportImage }: PrintlistPanelProps) {
  const isPanelOpen = usePrintlistStore((s) => s.isPanelOpen);
  const items = usePrintlistStore((s) => s.items);
  const paperSize = usePrintlistStore((s) => s.paperSize);
  const isLoading = usePrintlistStore((s) => s.isLoading);
  const removeItem = usePrintlistStore((s) => s.removeItem);
  const updateQuantity = usePrintlistStore((s) => s.updateQuantity);
  const updateSeamAllowance = usePrintlistStore((s) => s.updateSeamAllowance);
  const toggleSeamAllowance = usePrintlistStore((s) => s.toggleSeamAllowance);
  const setPaperSize = usePrintlistStore((s) => s.setPaperSize);
  const loadFromServer = usePrintlistStore((s) => s.loadFromServer);
  const saveToServer = usePrintlistStore((s) => s.saveToServer);

  const projectId = useProjectStore((s) => s.projectId);
  useEffect(() => {
    if (isPanelOpen && projectId) {
      loadFromServer(projectId);
    }
  }, [isPanelOpen, projectId, loadFromServer]);

  // Auto-save printlist when items change (debounced)
  useEffect(() => {
    if (!projectId || items.length === 0) return;

    const timer = setTimeout(() => {
      saveToServer(projectId);
    }, 2000);

    return () => clearTimeout(timer);
  }, [items, paperSize, projectId, saveToServer]);

  const handleRemove = useCallback(
    (shapeId: string) => {
      removeItem(shapeId);
    },
    [removeItem]
  );

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
          <div className="w-[300px] h-full bg-surface flex flex-col shadow-elevation-2">
            {/* Header */}
            <div className="px-4 py-3 border-b border-outline-variant">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-on-surface">Printlist</h3>
                <span className="text-xs text-secondary">
                  {items.length} item{items.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : items.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm text-secondary">No items in printlist.</p>
                  <p className="text-xs text-secondary mt-1">
                    Right-click a shape and select &quot;Add to Printlist&quot;
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-outline-variant">
                  {items.map((item) => (
                    <div key={item.shapeId} className="px-4 py-3">
                      {/* Shape name + remove */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-on-surface truncate max-w-[180px]">
                          {item.shapeName}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemove(item.shapeId)}
                          className="text-xs text-secondary hover:text-error transition-colors"
                          title="Remove from printlist"
                        >
                          &times;
                        </button>
                      </div>

                      {/* SVG Thumbnail */}
                      <div
                        className="w-full h-16 bg-white border border-outline-variant rounded mb-2 flex items-center justify-center overflow-hidden"
                        dangerouslySetInnerHTML={{
                          __html: item.svgData
                            ? sanitizeSvg(
                                `<svg viewBox="0 0 100 100" width="56" height="56" xmlns="http://www.w3.org/2000/svg">${item.svgData}</svg>`
                              )
                            : '',
                        }}
                      />

                      {/* Quantity + Seam Allowance */}
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="text-caption text-secondary block mb-0.5">Qty</label>
                          <input
                            type="number"
                            min={1}
                            max={999}
                            value={item.quantity}
                            onChange={(e) =>
                              updateQuantity(
                                item.shapeId,
                                Math.max(1, parseInt(e.target.value) || 1)
                              )
                            }
                            className="w-full rounded border border-outline-variant bg-white px-2 py-1 text-xs text-on-surface"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-0.5">
                            <label className="text-caption text-secondary">
                              Seam ({item.unitSystem === 'metric' ? 'cm' : 'in'})
                            </label>
                            <button
                              type="button"
                              role="switch"
                              aria-checked={item.seamAllowanceEnabled}
                              onClick={() => toggleSeamAllowance(item.shapeId)}
                              className={`relative inline-flex h-3.5 w-6 shrink-0 cursor-pointer rounded-full transition-colors ${
                                item.seamAllowanceEnabled ? 'bg-primary' : 'bg-outline-variant'
                              }`}
                            >
                              <span
                                className={`inline-block h-2.5 w-2.5 mt-[1px] rounded-full bg-white shadow-elevation-1 transition-transform ${
                                  item.seamAllowanceEnabled ? 'translate-x-3' : 'translate-x-0.5'
                                }`}
                              />
                            </button>
                          </div>
                          <input
                            type="number"
                            min={0}
                            max={1}
                            step={0.0625}
                            value={item.seamAllowance}
                            disabled={!item.seamAllowanceEnabled}
                            onChange={(e) =>
                              updateSeamAllowance(item.shapeId, parseFloat(e.target.value) || 0.25)
                            }
                            className="w-full rounded border border-outline-variant bg-white px-2 py-1 text-xs text-on-surface disabled:opacity-40 disabled:cursor-not-allowed"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-outline-variant space-y-2">
              {/* Paper size selector */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-secondary">Paper:</label>
                <select
                  value={paperSize}
                  onChange={(e) => setPaperSize(e.target.value as 'letter' | 'a4')}
                  className="flex-1 rounded border border-outline-variant bg-white px-2 py-1 text-xs text-on-surface"
                >
                  <option value="letter">US Letter (8.5&quot; x 11&quot;)</option>
                  <option value="a4">A4 (210mm x 297mm)</option>
                </select>
              </div>

              {/* Action buttons */}
              <button
                type="button"
                onClick={onGeneratePdf}
                disabled={items.length === 0}
                className="w-full rounded-md bg-gradient-to-r from-orange-500 to-rose-400 px-3 py-2 text-xs font-medium text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
              >
                Generate PDF Pattern
              </button>

              <button
                type="button"
                onClick={onExportImage}
                className="w-full rounded-md border border-outline-variant bg-white px-3 py-2 text-xs font-medium text-on-surface hover:bg-background transition-colors"
              >
                Export Image
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
