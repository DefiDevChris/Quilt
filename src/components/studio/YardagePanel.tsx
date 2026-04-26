'use client';

/**
 * YardagePanel — quilter-facing fabric requirements summary.
 *
 * Shown as a centered modal overlay (mirrors the CommandPalette pattern).
 * Opened from the Command Palette ("Yardage Calculator" command). The
 * panel scans the live canvas every time it opens, groups every shape by
 * fabric, and renders a per-fabric breakdown with yardage, area, and a
 * copy-to-clipboard shopping-list button.
 *
 * Per-fabric yardage uses the WOF + waste-margin already configured in
 * `useYardageStore`, defaulting to 44″ WOF / 10 % waste — the values the
 * PDF engine assumes too, so the panel agrees with the printed pattern.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, Copy, Check } from 'lucide-react';
import { useYardageStore } from '@/stores/yardageStore';
import { useProjectStore } from '@/stores/projectStore';
import { useFabricStore } from '@/stores/fabricStore';
import { useCanvasContext } from '@/contexts/CanvasContext';
import {
  computeCanvasYardage,
  formatShoppingList,
  type ComputedYardage,
  type FabricLookup,
} from '@/lib/yardage-calculator';
import { decimalToFraction, toMixedNumberString } from '@/lib/fraction-math';
import { STANDARD_WOFS } from '@/lib/yardage-utils';

export function YardagePanel() {
  const isPanelOpen = useYardageStore((s) => s.isPanelOpen);
  const setPanelOpen = useYardageStore((s) => s.setPanelOpen);
  const wof = useYardageStore((s) => s.wof);
  const setWof = useYardageStore((s) => s.setWof);
  const wasteMargin = useYardageStore((s) => s.wasteMargin);
  const setWasteMargin = useYardageStore((s) => s.setWasteMargin);

  const projectName = useProjectStore((s) => s.projectName);
  const canvasWidth = useProjectStore((s) => s.canvasWidth);
  const canvasHeight = useProjectStore((s) => s.canvasHeight);

  const fabrics = useFabricStore((s) => s.fabrics);
  const userFabrics = useFabricStore((s) => s.userFabrics);
  const uploadedFabrics = useFabricStore((s) => s.uploadedFabrics);

  const { getCanvas } = useCanvasContext();

  // Build a fabricId → display info lookup over every fabric source we
  // know about. Falls through to undefined if we can't find the fabric
  // (it might be a quick-apply hex swatch or an unsynced library).
  const lookupFabric = useMemo<FabricLookup>(() => {
    const allFabrics = [...fabrics, ...userFabrics, ...uploadedFabrics];
    const byId = new Map<string, { name: string; thumbnailUrl: string | null }>();
    for (const f of allFabrics) {
      byId.set(f.id, { name: f.name, thumbnailUrl: f.thumbnailUrl ?? f.imageUrl ?? null });
    }
    return (id: string) => byId.get(id);
  }, [fabrics, userFabrics, uploadedFabrics]);

  const [result, setResult] = useState<ComputedYardage | null>(null);
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle');

  // Recompute whenever the panel opens or the inputs change. We do this
  // inside an effect (not during render) because reading from the live
  // Fabric.js canvas is a side-effect.
  useEffect(() => {
    if (!isPanelOpen) {
      setResult(null);
      return;
    }
    const canvas = getCanvas();
    const computed = computeCanvasYardage({
      canvas: canvas as Parameters<typeof computeCanvasYardage>[0]['canvas'],
      quiltWidth: canvasWidth,
      quiltHeight: canvasHeight,
      wof,
      wasteMargin,
      lookupFabric,
    });
    setResult(computed);
  }, [isPanelOpen, canvasWidth, canvasHeight, wof, wasteMargin, getCanvas, lookupFabric]);

  // Reset the copy-confirmation chip a second after success
  useEffect(() => {
    if (copyState !== 'copied') return;
    const id = setTimeout(() => setCopyState('idle'), 1500);
    return () => clearTimeout(id);
  }, [copyState]);

  const handleCopy = useCallback(async () => {
    if (!result) return;
    const text = formatShoppingList(result, {
      quiltSize: { width: canvasWidth, height: canvasHeight },
      projectName,
    });
    try {
      await navigator.clipboard.writeText(text);
      setCopyState('copied');
    } catch {
      // Clipboard can fail on insecure origins or denied permissions —
      // fall back to a textarea selection so the user can copy manually.
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        setCopyState('copied');
      } finally {
        document.body.removeChild(ta);
      }
    }
  }, [result, canvasWidth, canvasHeight, projectName]);

  const handleClose = useCallback(() => {
    setPanelOpen(false);
  }, [setPanelOpen]);

  return (
    <AnimatePresence>
      {isPanelOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-[var(--color-text)]/40 z-50"
            onClick={handleClose}
            aria-hidden="true"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="yardage-title"
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(680px,calc(100vw-32px))] max-h-[80vh] z-50 flex flex-col bg-[var(--color-bg)] border border-[var(--color-border)]/40 rounded-lg shadow-elevated overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]/30">
              <div className="flex items-center gap-2">
                <span className="text-[var(--color-primary)]">
                  <Calculator size={18} />
                </span>
                <h2
                  id="yardage-title"
                  className="text-[16px] font-semibold text-[var(--color-text)]"
                >
                  Yardage Calculator
                </h2>
              </div>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Close yardage calculator"
                className="w-8 h-8 flex items-center justify-center rounded-full text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:bg-[var(--color-border)]/40 transition-colors duration-150"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M3 3L13 13M13 3L3 13"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            {/* Settings row */}
            <div className="flex flex-wrap items-center gap-4 px-5 py-3 border-b border-[var(--color-border)]/30 bg-[var(--color-surface)]">
              <label className="flex items-center gap-2 text-[12px] text-[var(--color-text)]">
                <span className="text-[var(--color-text-dim)]">Width of fabric</span>
                <select
                  value={wof}
                  onChange={(e) => setWof(Number(e.target.value) as typeof wof)}
                  className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1 text-[12px] text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
                >
                  {STANDARD_WOFS.map((w) => (
                    <option key={w} value={w}>
                      {w}″
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex items-center gap-2 text-[12px] text-[var(--color-text)]">
                <span className="text-[var(--color-text-dim)]">Waste margin</span>
                <span className="font-mono text-[var(--color-text)]">
                  {Math.round(wasteMargin * 100)}%
                </span>
                <input
                  type="range"
                  min={5}
                  max={25}
                  step={1}
                  value={Math.round(wasteMargin * 100)}
                  onChange={(e) => setWasteMargin(Number(e.target.value) / 100)}
                  className="w-28 accent-[var(--color-primary)]"
                  aria-label="Waste margin percentage"
                />
              </label>

              <div className="text-[12px] text-[var(--color-text-dim)] ml-auto tabular-nums">
                Quilt {canvasWidth}″ × {canvasHeight}″
              </div>
            </div>

            {/* Body — scrollable per-fabric breakdown */}
            <div className="flex-1 overflow-y-auto px-5 py-3">
              {!result || result.fabrics.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-[14px] text-[var(--color-text)] font-semibold mb-1">
                    No fabrics applied yet
                  </p>
                  <p className="text-[12px] text-[var(--color-text-dim)] max-w-sm mx-auto">
                    Drag a fabric onto a shape on the canvas, then re-open this panel to
                    see how much yardage you&apos;ll need to buy.
                  </p>
                </div>
              ) : (
                <table className="w-full text-[13px]">
                  <thead className="text-[10px] uppercase tracking-[0.08em] text-[var(--color-text-dim)] font-semibold">
                    <tr className="border-b border-[var(--color-border)]/30">
                      <th className="text-left py-2 pl-1 font-semibold">Fabric</th>
                      <th className="text-right py-2 font-semibold">Pieces</th>
                      <th className="text-right py-2 font-semibold">Area</th>
                      <th className="text-right py-2 pr-1 font-semibold">Yards</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.fabrics.map((row) => {
                      const yardsLabel =
                        row.yardsRequired > 0
                          ? `${toMixedNumberString(decimalToFraction(row.yardsRequired))} yd`
                          : '—';
                      return (
                        <tr
                          key={row.groupKey}
                          className="border-b border-[var(--color-border)]/15 last:border-b-0"
                        >
                          <td className="py-2 pl-1">
                            <div className="flex items-center gap-2.5 min-w-0">
                              {row.thumbnailUrl ? (
                                <span
                                  className="w-7 h-7 rounded-lg flex-shrink-0 bg-cover bg-center border border-[var(--color-border)]/30"
                                  style={{ backgroundImage: `url(${row.thumbnailUrl})` }}
                                  aria-hidden="true"
                                />
                              ) : (
                                <span
                                  className="w-7 h-7 rounded-lg flex-shrink-0 border border-[var(--color-border)]/30"
                                  style={{ backgroundColor: row.fillColor }}
                                  aria-hidden="true"
                                />
                              )}
                              <span className="truncate text-[var(--color-text)]">
                                {row.displayName}
                              </span>
                            </div>
                          </td>
                          <td className="py-2 text-right text-[var(--color-text-dim)] tabular-nums">
                            {row.shapeCount}
                          </td>
                          <td className="py-2 text-right text-[var(--color-text-dim)] tabular-nums">
                            {row.totalAreaSqIn.toFixed(0)} sq in
                          </td>
                          <td className="py-2 pr-1 text-right font-mono text-[var(--color-text)]">
                            {yardsLabel}
                            {row.fatQuartersRequired > 0 && (
                              <div className="text-[10px] text-[var(--color-text-dim)] font-sans">
                                or {row.fatQuartersRequired} FQ
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

              {result?.backing && result.fabrics.length > 0 && (
                <div className="mt-4 pt-3 border-t border-[var(--color-border)]/30">
                  <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--color-text-dim)] font-semibold mb-2">
                    Project backing &amp; binding
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-[12px]">
                    <div className="rounded-lg border border-[var(--color-border)]/30 bg-[var(--color-surface)] p-3">
                      <div className="text-[10px] uppercase text-[var(--color-text-dim)] mb-0.5">
                        Backing
                      </div>
                      <div className="font-mono text-[14px] text-[var(--color-text)]">
                        {toMixedNumberString(decimalToFraction(result.backing.yardsRequired))} yd
                      </div>
                      <div className="text-[10px] text-[var(--color-text-dim)] mt-1">
                        {result.backing.panelsNeeded} panel
                        {result.backing.panelsNeeded !== 1 ? 's' : ''} at {wof}″ WOF
                      </div>
                    </div>
                    {result.binding && (
                      <div className="rounded-lg border border-[var(--color-border)]/30 bg-[var(--color-surface)] p-3">
                        <div className="text-[10px] uppercase text-[var(--color-text-dim)] mb-0.5">
                          Binding
                        </div>
                        <div className="font-mono text-[14px] text-[var(--color-text)]">
                          {toMixedNumberString(decimalToFraction(result.binding.yardsRequired))} yd
                        </div>
                        <div className="text-[10px] text-[var(--color-text-dim)] mt-1">
                          {result.binding.stripCount} strips at{' '}
                          {toMixedNumberString(decimalToFraction(result.binding.stripWidthInches))}
                          ″ × WOF
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-[var(--color-border)]/30 bg-[var(--color-surface)]">
              <p className="text-[11px] text-[var(--color-text-dim)]">
                Estimates include {Math.round(wasteMargin * 100)}% waste.
                Buy a little extra for safety.
              </p>
              <button
                type="button"
                onClick={handleCopy}
                disabled={!result || result.fabrics.length === 0}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold bg-[var(--color-primary)] text-[var(--color-text-on-primary)] hover:bg-[var(--color-primary-hover)] transition-colors duration-150 disabled:opacity-50"
              >
                {copyState === 'copied' ? (
                  <>
                    <Check size={14} />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    Copy shopping list
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
