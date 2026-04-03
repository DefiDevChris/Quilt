'use client';

import { useState, useCallback } from 'react';
import { usePrintlistStore } from '@/stores/printlistStore';
import { useProjectStore } from '@/stores/projectStore';
import { useCanvasStore } from '@/stores/canvasStore';
import { generatePatternPdf, downloadPdf, type PaperSize } from '@/lib/pdf-generator';

interface PdfExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PdfExportDialog({ isOpen, onClose }: PdfExportDialogProps) {
  const items = usePrintlistStore((s) => s.items);
  const paperSize = usePrintlistStore((s) => s.paperSize);
  const setPaperSize = usePrintlistStore((s) => s.setPaperSize);
  const projectName = useProjectStore((s) => s.projectName);
  const printScale = useCanvasStore((s) => s.printScale);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = useCallback(async () => {
    if (items.length === 0) return;

    setIsGenerating(true);
    setError('');

    try {
      const pdfBytes = await generatePatternPdf(items, paperSize, printScale);
      const safeName = (projectName ?? 'quilt')
        .replace(/[^a-zA-Z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .toLowerCase();
      downloadPdf(pdfBytes, `${safeName}-pattern.pdf`);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate PDF');
    } finally {
      setIsGenerating(false);
    }
  }, [items, paperSize, projectName, printScale, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[400px] rounded-xl bg-surface p-6 shadow-elevation-3">
        <h2 className="text-lg font-semibold text-on-surface mb-4">Export PDF Pattern</h2>

        {/* Summary */}
        <div className="rounded-lg border border-outline-variant bg-white p-3 mb-4">
          <p className="text-xs text-secondary mb-1">
            {items.length} shape{items.length !== 1 ? 's' : ''} in printlist
          </p>
          <p className="text-xs text-secondary">
            Total pieces: {items.reduce((sum, i) => sum + i.quantity, 0)}
          </p>
        </div>

        {/* Paper size */}
        <div className="mb-4">
          <label className="text-xs font-medium text-on-surface block mb-1">Paper Size</label>
          <select
            value={paperSize}
            onChange={(e) => setPaperSize(e.target.value as PaperSize)}
            className="w-full rounded-sm border border-outline-variant bg-white px-3 py-2 text-sm text-on-surface"
          >
            <option value="letter">US Letter (8.5&quot; x 11&quot;)</option>
            <option value="a4">A4 (210mm x 297mm)</option>
          </select>
        </div>

        {/* Info */}
        <div className="rounded-lg bg-background p-3 mb-4">
          <p className="text-[11px] text-secondary leading-relaxed">
            Shapes are printed at {printScale.toFixed(1)}x scale. A 1&quot; validation square is included on page
            1. Print at &quot;Actual Size&quot; or &quot;100%&quot; — do not use &quot;Fit to
            Page&quot;.
          </p>
        </div>

        {/* Error */}
        {error && <p className="text-xs text-error mb-3">{error}</p>}

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="rounded-md border border-outline-variant bg-white px-4 py-2 text-sm text-on-surface hover:bg-background"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating || items.length === 0}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              'Generate & Download'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
