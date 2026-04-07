'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { usePrintlistStore } from '@/stores/printlistStore';
import { useProjectStore } from '@/stores/projectStore';
import { useCanvasStore } from '@/stores/canvasStore';
import { generatePatternPdf, type PaperSize } from '@/lib/pdf-generator';
import { downloadPdf } from '@/lib/dom-utils';
import { generateCutListPdf } from '@/lib/cutlist-pdf-engine';
import { generateProjectPdf, type ProjectPdfConfig } from '@/lib/project-pdf-engine';
import { captureCanvasPng, extractBlocksFromCanvas } from '@/lib/canvas-snapshot';
import { sanitizeFilename } from '@/lib/string-utils';

type ExportMode = 'pattern-pieces' | 'cut-list' | 'print-project';

interface PdfExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const MODE_INFO: Record<ExportMode, { label: string; description: string }> = {
  'pattern-pieces': {
    label: 'Pattern Pieces',
    description: 'Bin-packed shapes at scale for cutting templates.',
  },
  'cut-list': {
    label: 'Cut List',
    description: 'One page per shape with per-edge dimensions and seam allowance.',
  },
  'print-project': {
    label: 'Print Project',
    description: 'Full quilt overview, block diagrams, and totals table.',
  },
};

export function PdfExportDialog({ isOpen, onClose }: PdfExportDialogProps) {
  const items = usePrintlistStore((s) => s.items);
  const paperSize = usePrintlistStore((s) => s.paperSize);
  const setPaperSize = usePrintlistStore((s) => s.setPaperSize);
  const projectName = useProjectStore((s) => s.projectName);
  const canvasWidth = useProjectStore((s) => s.canvasWidth);
  const canvasHeight = useProjectStore((s) => s.canvasHeight);
  const printScale = useCanvasStore((s) => s.printScale);
  const unitSystem = useCanvasStore((s) => s.unitSystem);
  const fabricCanvas = useCanvasStore((s) => s.fabricCanvas);

  const [exportMode, setExportMode] = useState<ExportMode>('pattern-pieces');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  // Fetch logo PNG bytes once for PDF branding
  const logoRef = useRef<Uint8Array | null>(null);
  useEffect(() => {
    if (isOpen && !logoRef.current) {
      fetch('/logo.png')
        .then((res) => res.arrayBuffer())
        .then((buf) => {
          logoRef.current = new Uint8Array(buf);
        })
        .catch(() => {
          logoRef.current = null;
        });
    }
  }, [isOpen]);

  const safeName = sanitizeFilename(projectName ?? 'quilt');

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setError('');

    try {
      const logoPng = logoRef.current;
      let pdfBytes: Uint8Array;
      let filename: string;

      switch (exportMode) {
        case 'pattern-pieces': {
          if (items.length === 0) {
            setError('Add shapes to the printlist first.');
            return;
          }
          pdfBytes = await generatePatternPdf(items, paperSize, printScale, logoPng);
          filename = `${safeName}-pattern.pdf`;
          break;
        }

        case 'cut-list': {
          if (items.length === 0) {
            setError('Add shapes to the printlist first.');
            return;
          }
          // Extract blocks for key block page labels
          const cutlistBlocks = await extractBlocksFromCanvas(fabricCanvas);
          pdfBytes = await generateCutListPdf(items, paperSize, unitSystem, logoPng, cutlistBlocks);
          filename = `${safeName}-cutlist.pdf`;
          break;
        }

        case 'print-project': {
          // Capture canvas overview image
          const overviewPng = await captureCanvasPng(fabricCanvas);

          // Extract blocks from canvas
          const blocks = await extractBlocksFromCanvas(fabricCanvas);

          // Collect all pieces from blocks
          const allPieces = blocks.flatMap((b) => b.pieces);

          const config: ProjectPdfConfig = {
            projectName: projectName ?? 'Untitled Quilt',
            quiltWidth: canvasWidth ?? 48,
            quiltHeight: canvasHeight ?? 48,
            quiltOverviewPng: overviewPng,
            blocks,
            allPieces,
            unitSystem,
            paperSize,
            date: new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }),
            logoPngBytes: logoPng,
          };

          pdfBytes = await generateProjectPdf(config);
          filename = `${safeName}-project.pdf`;
          break;
        }

        default:
          throw new Error('Unknown export mode');
      }

      downloadPdf(pdfBytes, filename);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate PDF');
    } finally {
      setIsGenerating(false);
    }
  }, [
    exportMode,
    items,
    paperSize,
    printScale,
    unitSystem,
    fabricCanvas,
    projectName,
    canvasWidth,
    canvasHeight,
    safeName,
    onClose,
  ]);

  if (!isOpen) return null;

  const needsPrintlist = exportMode === 'pattern-pieces' || exportMode === 'cut-list';
  const isDisabled = isGenerating || (needsPrintlist && items.length === 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[440px] rounded-xl bg-surface p-6 shadow-elevation-3">
        <h2 className="mb-4 text-lg font-semibold text-on-surface">Export PDF</h2>

        {/* Mode selector */}
        <div className="mb-4">
          <label className="mb-1 block text-xs font-medium text-on-surface">Export Type</label>
          <div className="grid grid-cols-4 gap-2">
            {(Object.keys(MODE_INFO) as ExportMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setExportMode(mode)}
                className={`rounded-md border px-2 py-2 text-xs font-medium transition-colors ${
                  exportMode === mode
                    ? 'border-primary bg-gradient-to-r from-orange-500 to-rose-400 text-white'
                    : 'border-outline-variant bg-white text-on-surface hover:bg-background'
                }`}
              >
                {MODE_INFO[mode].label}
              </button>
            ))}
          </div>
          <p className="mt-1 text-[10px] text-secondary">{MODE_INFO[exportMode].description}</p>
        </div>

        {/* Printlist summary — for pattern-pieces and cut-list modes */}
        {needsPrintlist && (
          <div className="mb-4 rounded-lg border border-outline-variant bg-white p-3">
            <p className="mb-1 text-xs text-secondary">
              {items.length} shape{items.length !== 1 ? 's' : ''} in printlist
            </p>
            <p className="text-xs text-secondary">
              Total pieces: {items.reduce((sum, i) => sum + i.quantity, 0)}
            </p>
          </div>
        )}

        {/* Paper size */}
        <div className="mb-4">
          <label className="mb-1 block text-xs font-medium text-on-surface">Paper Size</label>
          <select
            value={paperSize}
            onChange={(e) => setPaperSize(e.target.value as PaperSize)}
            className="w-full rounded-sm border border-outline-variant bg-white px-3 py-2 text-sm text-on-surface"
          >
            <option value="letter">US Letter (8.5&quot; x 11&quot;)</option>
            <option value="a4">A4 (210mm x 297mm)</option>
          </select>
        </div>

        {/* Mode-specific options */}
        {exportMode === 'pattern-pieces' && (
          <div className="mb-4 rounded-lg bg-background p-3">
            <p className="text-[11px] leading-relaxed text-secondary">
              Shapes are printed at {printScale.toFixed(1)}x scale. A 1&quot; validation square is
              included on page 1. Print at &quot;Actual Size&quot; or &quot;100%&quot; — do not use
              &quot;Fit to Page&quot;.
            </p>
          </div>
        )}

        {exportMode === 'cut-list' && (
          <div className="mb-4 rounded-lg bg-background p-3">
            <p className="text-[11px] leading-relaxed text-secondary">
              One page per shape with edge dimensions in{' '}
              {unitSystem === 'imperial' ? 'inches (fractions)' : 'millimeters'}. Includes finished
              piece line, seam allowance, and grain line.
            </p>
          </div>
        )}

        {exportMode === 'print-project' && (
          <div className="mb-4 rounded-lg bg-background p-3">
            <p className="text-[11px] leading-relaxed text-secondary">
              Generates a complete pattern document: quilt overview image, block diagrams with piece
              labels, and a totals summary table.
            </p>
          </div>
        )}

        {/* Error */}
        {error && <p className="mb-3 text-xs text-error">{error}</p>}

        {/* Actions */}
        <div className="flex justify-end gap-2">
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
            disabled={isDisabled}
            className="flex items-center gap-2 rounded-md bg-gradient-to-r from-orange-500 to-rose-400 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isGenerating ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
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
