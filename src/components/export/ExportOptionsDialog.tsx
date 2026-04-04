'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useYardageStore } from '@/stores/yardageStore';

interface ExportOptionsDialogProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onOpenPdfExport: () => void;
  readonly onOpenImageExport: () => void;
}

function YardageSummary() {
  const results = useYardageStore((s) => s.results);
  const wof = useYardageStore((s) => s.wof);

  if (results.length === 0) {
    return (
      <p className="text-sm text-secondary">
        No fabric usage data yet. Add fabrics to your quilt to see yardage estimates.
      </p>
    );
  }

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ backgroundColor: 'var(--color-surface-container)' }}
    >
      <div
        className="grid grid-cols-[1fr_auto_auto] gap-x-4 px-4 py-2 text-xs font-semibold"
        style={{ color: 'var(--color-secondary)' }}
      >
        <span>Fabric</span>
        <span>WOF</span>
        <span className="text-right">Yardage</span>
      </div>
      {results.map((r, i) => (
        <div
          key={r.fabricId ?? i}
          className="grid grid-cols-[1fr_auto_auto] gap-x-4 px-4 py-2 text-sm items-center"
          style={{
            backgroundColor:
              i % 2 === 0
                ? 'var(--color-surface-container)'
                : 'var(--color-surface-container-high)',
            color: 'var(--color-on-surface)',
          }}
        >
          <span className="truncate font-medium">{r.displayName ?? `Fabric ${i + 1}`}</span>
          <span className="text-xs tabular-nums" style={{ color: 'var(--color-secondary)' }}>
            {wof}&Prime;
          </span>
          <span className="text-right font-medium tabular-nums">
            {r.yardsRequired.toFixed(2)} yd
          </span>
        </div>
      ))}
    </div>
  );
}

export function ExportOptionsDialog({
  isOpen,
  onClose,
  onOpenPdfExport,
  onOpenImageExport,
}: ExportOptionsDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-on-surface/30 z-50"
            style={{ backdropFilter: 'blur(4px)' }}
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Export Options"
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: 'tween', duration: 0.2, ease: 'easeOut' }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md max-h-[85vh] overflow-y-auto rounded-xl bg-surface shadow-elevation-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/[0.08]">
              <h2 className="text-lg font-semibold text-on-surface">Export</h2>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-md text-secondary hover:text-on-surface hover:bg-surface-container transition-colors"
                aria-label="Close"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path
                    d="M4 4L14 14M14 4L4 14"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* PDF Cutting List */}
              <div>
                <h3 className="text-sm font-semibold text-on-surface mb-2">PDF Cutting List</h3>
                <p className="text-xs text-secondary mb-3">
                  Generate a printable PDF with block diagrams, cutting charts, and yardage
                  estimates.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenPdfExport();
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: 'var(--color-primary)',
                    color: 'var(--color-primary-on)',
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  Generate PDF
                </button>
              </div>

              {/* Image Export */}
              <div>
                <h3 className="text-sm font-semibold text-on-surface mb-2">Image Export</h3>
                <p className="text-xs text-secondary mb-3">
                  Save your quilt design as a high-resolution PNG or JPEG image.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenImageExport();
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                  Export Image
                </button>
              </div>

              {/* Fabric Requirements */}
              <div>
                <h3 className="text-sm font-semibold text-on-surface mb-2">Fabric Requirements</h3>
                <p className="text-xs text-secondary mb-3">
                  Estimated yardage based on your current quilt layout.
                </p>
                <YardageSummary />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
