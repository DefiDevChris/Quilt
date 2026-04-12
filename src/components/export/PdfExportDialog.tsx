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
import { ExportDialogShell } from './ExportDialogShell';

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
    <ExportDialogShell
      title="Export PDF"
      onExport={handleGenerate}
      onClose={onClose}
      isExporting={isGenerating}
      isDisabled={isDisabled}
      exportLabel="Generate & Download"
      error={error}
    >
      {/* Mode selector */}
      <div className="mb-4">
        <label id="pdf-export-type-label" className="mb-1 block text-xs font-medium text-[var(--color-text)]">Export Type</label>
        <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-labelledby="pdf-export-type-label">
          {(Object.keys(MODE_INFO) as ExportMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              role="radio"
              aria-checked={exportMode === mode}
              onClick={() => setExportMode(mode)}
              className={`rounded-lg border px-2 py-2 text-xs font-medium transition-colors ${exportMode === mode
                ? 'border-primary bg-primary text-white'
                : 'border-[var(--color-border)] bg-white text-[var(--color-text)] hover:bg-[var(--color-primary)]/10'
                }`}
            >
              {MODE_INFO[mode].label}
            </button>
          ))}
        </div>
        <p className="mt-1 text-[10px] text-[var(--color-text-dim)]">{MODE_INFO[exportMode].description}</p>
      </div>

      {/* Printlist summary — for pattern-pieces and cut-list modes */}
      {needsPrintlist && (
        <div className="mb-4 rounded-lg border border-[var(--color-border)] bg-white p-3">
          <p className="mb-1 text-xs text-[var(--color-text-dim)]">
            {items.length} shape{items.length !== 1 ? 's' : ''} in printlist
          </p>
          <p className="text-xs text-[var(--color-text-dim)]">
            Total pieces: {items.reduce((sum, i) => sum + i.quantity, 0)}
          </p>
        </div>
      )}

      {/* Paper size */}
      <div className="mb-4">
        <label htmlFor="pdf-paper-size" className="mb-1 block text-xs font-medium text-[var(--color-text)]">Paper Size</label>
        <select
          id="pdf-paper-size"
          value={paperSize}
          onChange={(e) => setPaperSize(e.target.value as PaperSize)}
          className="w-full rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-text)]"
        >
          <option value="letter">US Letter (8.5&quot; x 11&quot;)</option>
          <option value="a4">A4 (210mm x 297mm)</option>
        </select>
      </div>

      {/* Mode-specific options */}
      {exportMode === 'pattern-pieces' && (
        <div className="mb-4 rounded-lg bg-[var(--color-bg)] p-3">
          <p className="text-[11px] leading-relaxed text-[var(--color-text-dim)]">
            Shapes are printed at {printScale.toFixed(1)}x scale. A 1&quot; validation square is
            included on page 1. Print at &quot;Actual Size&quot; or &quot;100%&quot; — do not use
            &quot;Fit to Page&quot;.
          </p>
        </div>
      )}

      {exportMode === 'cut-list' && (
        <div className="mb-4 rounded-lg bg-[var(--color-bg)] p-3">
          <p className="text-[11px] leading-relaxed text-[var(--color-text-dim)]">
            One page per shape with edge dimensions in{' '}
            {unitSystem === 'imperial' ? 'inches (fractions)' : 'millimeters'}. Includes finished
            piece line, seam allowance, and grain line.
          </p>
        </div>
      )}

      {exportMode === 'print-project' && (
        <div className="mb-4 rounded-lg bg-[var(--color-bg)] p-3">
          <p className="text-[11px] leading-relaxed text-[var(--color-text-dim)]">
            Generates a complete pattern document: quilt overview image, block diagrams with piece
            labels, and a totals summary table.
          </p>
        </div>
      )}
    </ExportDialogShell>
  );
}
