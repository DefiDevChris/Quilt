'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePieceInspectorStore } from '@/stores/pieceInspectorStore';
import {
  generatePieceSvgPreview,
  generateSinglePiecePdf,
  formatPieceDimensions,
  computePieceDimensions,
  type PieceGeometry,
  type FormattedDimensions,
} from '@/lib/piece-inspector-utils';
import { sanitizeSvg } from '@/lib/sanitize-svg';

// ── Constants ────────────────────────────────────────────────────

const SEAM_MIN = 0;
const SEAM_MAX = 1;
const SEAM_STEP = 0.125; // 1/8" increments
const PANEL_WIDTH_PX = 280;

// ── Shape Label Map ──────────────────────────────────────────────

const SHAPE_LABELS: Record<string, string> = {
  'half-square-triangle': 'Half-Square Triangle',
  'quarter-square-triangle': 'Quarter-Square Triangle',
  rectangle: 'Rectangle',
  square: 'Square',
  diamond: 'Diamond',
  hexagon: 'Hexagon',
  irregular: 'Irregular',
};

function getShapeLabel(shapeType: string): string {
  return SHAPE_LABELS[shapeType] ?? shapeType;
}

// ── Seam Allowance Formatter ─────────────────────────────────────

function formatSeamLabel(value: number): string {
  const eighths = Math.round(value * 8);
  const whole = Math.floor(eighths / 8);
  const remainder = eighths % 8;

  if (remainder === 0) {
    return whole === 0 ? '0"' : `${whole}"`;
  }

  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const d = gcd(remainder, 8);
  const num = remainder / d;
  const den = 8 / d;

  return whole > 0 ? `${whole} ${num}/${den}"` : `${num}/${den}"`;
}

// ── Sub-Components ───────────────────────────────────────────────

function PanelHeader({ onClose }: { readonly onClose: () => void }) {
  return (
    <div className="flex items-center justify-between px-4 h-12 flex-shrink-0">
      <span className="font-semibold text-[1.125rem] text-on-surface">Piece Inspector</span>
      <button
        type="button"
        onClick={onClose}
        className="w-8 h-8 flex items-center justify-center rounded-md text-secondary hover:text-on-surface hover:bg-surface-container transition-colors"
        aria-label="Close piece inspector"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <path
            d="M4 4L14 14M14 4L4 14"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}

function SvgPreviewSection({
  geometry,
  seamAllowance,
}: {
  readonly geometry: PieceGeometry;
  readonly seamAllowance: number;
}) {
  const svgHtml = useMemo(
    () =>
      sanitizeSvg(
        generatePieceSvgPreview(geometry, seamAllowance, {
          showSeamLine: true,
          showDimensions: true,
        })
      ),
    [geometry, seamAllowance]
  );

  return (
    <section className="px-4 mb-4">
      <div
        className="bg-surface-canvas rounded-lg p-3 flex items-center justify-center"
        dangerouslySetInnerHTML={{ __html: svgHtml }}
      />
    </section>
  );
}

function ShapeInfoSection({
  shapeType,
  formatted,
}: {
  readonly shapeType: string;
  readonly formatted: FormattedDimensions;
}) {
  return (
    <section className="px-4 mb-4">
      <div className="bg-surface-container rounded-lg p-3">
        <div className="mb-2">
          <span className="inline-block text-body-sm font-medium text-on-surface bg-surface-container-high px-2 py-0.5 rounded-sm">
            {getShapeLabel(shapeType)}
          </span>
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-body-sm text-secondary">Finished size</span>
            <span className="font-mono text-body-sm text-on-surface">
              {formatted.finishedWidth} x {formatted.finishedHeight}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-body-sm text-secondary">Cut size (with seam)</span>
            <span className="font-mono text-body-sm text-on-surface">
              {formatted.cutWidth} x {formatted.cutHeight}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function SeamAllowanceSlider({
  value,
  onChange,
}: {
  readonly value: number;
  readonly onChange: (v: number) => void;
}) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(parseFloat(e.target.value));
    },
    [onChange]
  );

  return (
    <section className="px-4 mb-4">
      <div className="bg-surface-container rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-body-sm text-secondary">Seam allowance</span>
          <span className="font-mono text-body-sm text-on-surface">{formatSeamLabel(value)}</span>
        </div>
        <input
          type="range"
          min={SEAM_MIN}
          max={SEAM_MAX}
          step={SEAM_STEP}
          value={value}
          onChange={handleChange}
          className="w-full accent-primary h-1.5 rounded-full appearance-none bg-surface-container-high cursor-pointer"
          aria-label="Seam allowance"
        />
        <div className="flex justify-between mt-1">
          <span className="text-caption text-secondary">0&quot;</span>
          <span className="text-caption text-secondary">1&quot;</span>
        </div>
      </div>
    </section>
  );
}

function SpecialInstructionsSection({ instructions }: { readonly instructions: string }) {
  return (
    <section className="px-4 mb-4">
      <div className="bg-surface-container rounded-lg p-3">
        <span className="text-body-sm text-secondary block mb-1.5">Special instructions</span>
        <p className="text-body-sm text-on-surface leading-relaxed">{instructions}</p>
      </div>
    </section>
  );
}

function ActionsSection({
  geometry,
  seamAllowance,
  svgPreview,
}: {
  readonly geometry: PieceGeometry;
  readonly seamAllowance: number;
  readonly svgPreview: string;
}) {
  const [isPrinting, setIsPrinting] = useState(false);
  const [copyLabel, setCopyLabel] = useState('Copy SVG');

  const handlePrintTemplate = useCallback(async () => {
    setIsPrinting(true);
    try {
      const pdfBytes = await generateSinglePiecePdf(geometry, seamAllowance, 'letter');
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `piece-template-${geometry.shapeType}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      // Silently handle — user can retry
    } finally {
      setIsPrinting(false);
    }
  }, [geometry, seamAllowance]);

  const handleCopySvg = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(svgPreview);
      setCopyLabel('Copied');
      setTimeout(() => setCopyLabel('Copy SVG'), 2000);
    } catch {
      // Clipboard API may not be available
    }
  }, [svgPreview]);

  return (
    <section className="px-4 mb-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handlePrintTemplate}
          disabled={isPrinting}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-body-sm font-medium text-on-surface bg-surface-container hover:bg-surface-container-high rounded-lg transition-colors disabled:opacity-50"
        >
          <span aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect
                x="3"
                y="7"
                width="10"
                height="5"
                rx="0.5"
                stroke="currentColor"
                strokeWidth="1.2"
              />
              <path d="M5 7V3H11V7" stroke="currentColor" strokeWidth="1.2" />
              <path d="M1 7H15V11H1V7Z" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          </span>
          {isPrinting ? 'Generating...' : 'Print Template'}
        </button>
        <button
          type="button"
          onClick={handleCopySvg}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-body-sm font-medium text-on-surface bg-surface-container hover:bg-surface-container-high rounded-lg transition-colors"
        >
          <span aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect
                x="5"
                y="5"
                width="8"
                height="8"
                rx="1"
                stroke="currentColor"
                strokeWidth="1.2"
              />
              <path
                d="M11 3H4C3.44772 3 3 3.44772 3 4V11"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>
          </span>
          {copyLabel}
        </button>
      </div>
    </section>
  );
}

// ── Main Panel ───────────────────────────────────────────────────

export function PieceInspectorPanel() {
  const isOpen = usePieceInspectorStore((s) => s.isOpen);
  const pieceGeometry = usePieceInspectorStore((s) => s.pieceGeometry);
  const pieceDimensions = usePieceInspectorStore((s) => s.pieceDimensions);
  const seamAllowance = usePieceInspectorStore((s) => s.seamAllowance);
  const setSeamAllowance = usePieceInspectorStore((s) => s.setSeamAllowance);
  const clearSelection = usePieceInspectorStore((s) => s.clearSelection);

  // Recompute dimensions when seam allowance changes
  const computedDimensions = useMemo(() => {
    if (!pieceGeometry) return pieceDimensions;
    return computePieceDimensions(pieceGeometry, seamAllowance);
  }, [pieceGeometry, seamAllowance, pieceDimensions]);

  const formatted = useMemo(() => {
    if (!computedDimensions) return null;
    return formatPieceDimensions(computedDimensions);
  }, [computedDimensions]);

  const svgPreview = useMemo(() => {
    if (!pieceGeometry) return '';
    return generatePieceSvgPreview(pieceGeometry, seamAllowance, {
      showSeamLine: true,
      showDimensions: true,
    });
  }, [pieceGeometry, seamAllowance]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        clearSelection();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, clearSelection]);

  const handleClose = useCallback(() => {
    clearSelection();
  }, [clearSelection]);

  const handleSeamChange = useCallback(
    (value: number) => {
      setSeamAllowance(value);
    },
    [setSeamAllowance]
  );

  return (
    <AnimatePresence>
      {isOpen && pieceGeometry && formatted && computedDimensions && (
        <motion.div
          initial={{ x: PANEL_WIDTH_PX }}
          animate={{ x: 0 }}
          exit={{ x: PANEL_WIDTH_PX }}
          transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
          className="absolute top-0 right-0 bottom-0 w-70 bg-surface shadow-elevation-3 z-40 flex flex-col overflow-hidden"
        >
          <PanelHeader onClose={handleClose} />

          <div className="flex-1 overflow-y-auto pb-4">
            <SvgPreviewSection geometry={pieceGeometry} seamAllowance={seamAllowance} />

            <ShapeInfoSection shapeType={pieceGeometry.shapeType} formatted={formatted} />

            <SeamAllowanceSlider value={seamAllowance} onChange={handleSeamChange} />

            {computedDimensions.specialInstructions && (
              <SpecialInstructionsSection instructions={computedDimensions.specialInstructions} />
            )}

            <ActionsSection
              geometry={pieceGeometry}
              seamAllowance={seamAllowance}
              svgPreview={svgPreview}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
