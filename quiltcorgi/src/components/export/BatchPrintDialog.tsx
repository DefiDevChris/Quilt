'use client';

import { useState, useCallback, useMemo } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import {
  generateBatchPrintResult,
  PAPER_CONFIGS,
  type PaperSize,
  type FabricJSON,
} from '@/lib/batch-print-engine';

interface BatchPrintDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BatchPrintDialog({ isOpen, onClose }: BatchPrintDialogProps) {
  const [seamAllowance, setSeamAllowance] = useState(0.25);
  const [paperSize, setPaperSize] = useState<PaperSize>('LETTER');
  const [isGenerating, setIsGenerating] = useState(false);

  const fabricCanvas = useCanvasStore((s) => s.fabricCanvas);

  const canvasData = useMemo((): FabricJSON => {
    if (!fabricCanvas) return { objects: [] };
    const canvas = fabricCanvas as unknown as {
      getObjects: () => { toObject: () => Record<string, unknown> }[];
    };
    return {
      objects: canvas.getObjects().map((obj) => obj.toObject()),
    } as FabricJSON;
  }, [fabricCanvas]);

  const batchResult = useMemo(() => {
    return generateBatchPrintResult(canvasData, PAPER_CONFIGS[paperSize], seamAllowance);
  }, [canvasData, paperSize, seamAllowance]);

  const [pdfMessage, setPdfMessage] = useState<string | null>(null);

  const handleGeneratePDF = useCallback(async () => {
    if (!fabricCanvas || batchResult.totalBlocks === 0) return;

    setIsGenerating(true);
    setPdfMessage(null);

    try {
      const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');

      const POINTS_PER_INCH = 72;
      const MARGIN = 36; // 0.5 inch

      const PAGE_SIZES: Record<string, { width: number; height: number }> = {
        LETTER: { width: 612, height: 792 },
        A4: { width: 595.28, height: 841.89 },
      };

      const pageSize = PAGE_SIZES[paperSize] ?? PAGE_SIZES.LETTER;
      const totalPages = batchResult.pages.length;

      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      for (const packedPage of batchResult.pages) {
        const page = pdfDoc.addPage([pageSize.width, pageSize.height]);

        // Header
        const headerText = `QuiltCorgi — Batch Cutting Templates — Page ${packedPage.pageNumber} of ${totalPages}`;
        page.drawText(headerText, {
          x: MARGIN,
          y: pageSize.height - MARGIN + 8,
          size: 10,
          font,
          color: rgb(0.3, 0.3, 0.3),
        });

        // Footer
        const footerText = 'Print at 100% — Do not scale';
        const footerWidth = font.widthOfTextAtSize(footerText, 9);
        page.drawText(footerText, {
          x: (pageSize.width - footerWidth) / 2,
          y: MARGIN - 20,
          size: 9,
          font,
          color: rgb(0.4, 0.4, 0.4),
        });

        for (const packed of packedPage.templates) {
          const rectX = MARGIN + packed.x * POINTS_PER_INCH;
          const rectWidth = packed.width * POINTS_PER_INCH;
          const rectHeight = packed.height * POINTS_PER_INCH;
          const rectY = pageSize.height - MARGIN - packed.y * POINTS_PER_INCH - rectHeight;

          // Template rectangle
          page.drawRectangle({
            x: rectX,
            y: rectY,
            width: rectWidth,
            height: rectHeight,
            borderColor: rgb(0, 0, 0),
            borderWidth: 1.5,
            color: rgb(1, 1, 1),
          });

          // Seam allowance dashed line
          const sa = packed.template.seamAllowance * POINTS_PER_INCH;
          if (sa > 0 && rectWidth > sa * 2 && rectHeight > sa * 2) {
            const innerX = rectX + sa;
            const innerY = rectY + sa;
            const innerW = rectWidth - sa * 2;
            const innerH = rectHeight - sa * 2;
            const dashLength = 4;
            const gapLength = 3;

            // Draw dashed rectangle (top, bottom, left, right)
            const drawDashedLine = (x1: number, y1: number, x2: number, y2: number) => {
              const dx = x2 - x1;
              const dy = y2 - y1;
              const length = Math.sqrt(dx * dx + dy * dy);
              const unitX = dx / length;
              const unitY = dy / length;
              let cursor = 0;

              while (cursor < length) {
                const segEnd = Math.min(cursor + dashLength, length);
                page.drawLine({
                  start: {
                    x: x1 + unitX * cursor,
                    y: y1 + unitY * cursor,
                  },
                  end: {
                    x: x1 + unitX * segEnd,
                    y: y1 + unitY * segEnd,
                  },
                  thickness: 0.5,
                  color: rgb(0.5, 0.5, 0.5),
                });
                cursor = segEnd + gapLength;
              }
            };

            drawDashedLine(innerX, innerY + innerH, innerX + innerW, innerY + innerH); // top
            drawDashedLine(innerX, innerY, innerX + innerW, innerY); // bottom
            drawDashedLine(innerX, innerY, innerX, innerY + innerH); // left
            drawDashedLine(innerX + innerW, innerY, innerX + innerW, innerY + innerH); // right
          }

          // Block name and copy number
          const labelText = `${packed.template.blockName} (#${packed.copyIndex + 1})`;
          const labelSize = Math.min(9, rectWidth / (labelText.length * 0.5));
          page.drawText(labelText, {
            x: rectX + 4,
            y: rectY + rectHeight - labelSize - 4,
            size: labelSize,
            font: fontBold,
            color: rgb(0, 0, 0),
          });

          // Dimensions text
          const dimText = `${packed.template.width.toFixed(2)}" × ${packed.template.height.toFixed(2)}" (incl. ${packed.template.seamAllowance}" SA)`;
          const dimSize = Math.min(7, rectWidth / (dimText.length * 0.45));
          page.drawText(dimText, {
            x: rectX + 4,
            y: rectY + rectHeight - labelSize - dimSize - 8,
            size: dimSize,
            font,
            color: rgb(0.3, 0.3, 0.3),
          });

          // Cutting guide text
          const cuttingLines = packed.template.patches[0]?.cuttingLines ?? [];
          const cutSize = Math.min(7, labelSize - 1);
          let cutY = rectY + 4 + cuttingLines.length * (cutSize + 2);

          for (const line of cuttingLines) {
            if (cutY > rectY + rectHeight - labelSize - dimSize - 16) break;
            page.drawText(line, {
              x: rectX + 4,
              y: cutY,
              size: cutSize,
              font,
              color: rgb(0.2, 0.2, 0.2),
            });
            cutY = cutY - (cutSize + 2);
          }
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = 'quiltcorgi-cutting-templates.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setPdfMessage(`PDF generated — ${totalPages} page${totalPages === 1 ? '' : 's'} downloaded.`);
      setTimeout(() => setPdfMessage(null), 5000);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setPdfMessage(`Failed to generate PDF: ${message}`);
      setTimeout(() => setPdfMessage(null), 8000);
    } finally {
      setIsGenerating(false);
    }
  }, [fabricCanvas, batchResult, paperSize]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-surface rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-outline-variant/10">
          <h2 className="text-xl font-semibold text-on-surface">Batch Print All Blocks</h2>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface transition-colors"
            aria-label="Close batch print dialog"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-on-surface mb-2">
                Seam Allowance
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0.125"
                  max="0.5"
                  step="0.125"
                  value={seamAllowance}
                  onChange={(e) => setSeamAllowance(parseFloat(e.target.value))}
                  className="flex-1 h-2 bg-outline-variant rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-sm text-on-surface-variant w-12">{seamAllowance}&quot;</span>
              </div>
              <div className="flex justify-between text-xs text-on-surface-variant mt-1">
                <span>1/8&quot;</span>
                <span>1/2&quot;</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-on-surface mb-2">Paper Size</label>
              <select
                value={paperSize}
                onChange={(e) => setPaperSize(e.target.value as PaperSize)}
                className="w-full px-3 py-2 border border-outline-variant rounded-md bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="LETTER">US Letter (8.5&quot; × 11&quot;)</option>
                <option value="A4">A4 (210mm × 297mm)</option>
              </select>
            </div>
          </div>

          {/* Block Summary */}
          <div>
            <h3 className="text-lg font-medium text-on-surface mb-3">Block Summary</h3>
            <div className="bg-surface-variant/10 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{batchResult.totalBlocks}</div>
                  <div className="text-sm text-on-surface-variant">Total Blocks</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{batchResult.totalPages}</div>
                  <div className="text-sm text-on-surface-variant">Pages Required</div>
                </div>
              </div>

              <div className="space-y-2">
                {batchResult.summary.map((block, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center py-2 border-b border-outline-variant/10 last:border-b-0"
                  >
                    <div>
                      <div className="font-medium text-on-surface">{block.blockName}</div>
                      <div className="text-sm text-on-surface-variant">{block.size}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-on-surface">×{block.quantity}</div>
                      <div className="text-xs text-on-surface-variant">copies</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Page Layout Preview */}
          <div>
            <h3 className="text-lg font-medium text-on-surface mb-3">Layout Preview</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {batchResult.pages.slice(0, 6).map((page) => (
                <div
                  key={page.pageNumber}
                  className="border border-outline-variant rounded-lg p-3 bg-surface-variant/5"
                >
                  <div className="text-sm font-medium text-on-surface mb-2">
                    Page {page.pageNumber}
                  </div>
                  <div className="aspect-[8.5/11] bg-white border border-outline-variant/20 rounded relative overflow-hidden">
                    {page.templates.map((template, index) => (
                      <div
                        key={index}
                        className="absolute bg-primary/20 border border-primary/40 rounded-sm"
                        style={{
                          left: `${(template.x / page.paperConfig.usableWidth) * 100}%`,
                          top: `${(template.y / page.paperConfig.usableHeight) * 100}%`,
                          width: `${(template.width / page.paperConfig.usableWidth) * 100}%`,
                          height: `${(template.height / page.paperConfig.usableHeight) * 100}%`,
                        }}
                        title={`${template.template.blockName} (${template.copyIndex + 1})`}
                      />
                    ))}
                  </div>
                  <div className="text-xs text-on-surface-variant mt-1">
                    {page.templates.length} templates
                  </div>
                </div>
              ))}
              {batchResult.totalPages > 6 && (
                <div className="border border-outline-variant rounded-lg p-3 bg-surface-variant/5 flex items-center justify-center">
                  <div className="text-sm text-on-surface-variant text-center">
                    +{batchResult.totalPages - 6} more pages
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-surface-variant/10 rounded-lg p-4">
            <h4 className="text-sm font-medium text-on-surface mb-2">Printing Instructions</h4>
            <ul className="text-sm text-on-surface-variant space-y-1">
              <li>• Print at 100% scale (no scaling)</li>
              <li>• Use high-quality paper for accurate templates</li>
              <li>• Cut on solid lines, stitch on dashed lines</li>
              <li>• Seam allowance is included in all templates</li>
            </ul>
          </div>
        </div>

        {pdfMessage && (
          <div className="mx-6 mb-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2 text-sm font-medium text-primary">
            {pdfMessage}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 p-6 border-t border-outline-variant/10">
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="px-4 py-2 text-on-surface-variant hover:text-on-surface transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleGeneratePDF}
            disabled={batchResult.totalBlocks === 0 || isGenerating}
            className="px-6 py-2 bg-primary text-on-primary rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isGenerating ? 'Generating...' : 'Generate PDF'}
          </button>
        </div>
      </div>
    </div>
  );
}
