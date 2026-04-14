/**
 * PDF Engine — unified entry point for all PDF generation.
 *
 * Consolidates three previous engines:
 * - pdf-generator.ts (pattern pieces, bin-packed)
 * - cutlist-pdf-engine.ts (one page per shape)
 * - project-pdf-engine.ts (full project document)
 */

import { PDFDocument, StandardFonts, rgb, type PDFPage } from 'pdf-lib';
import {
  PDF_PAGE_SIZES,
  PDF_POINTS_PER_INCH,
  type PaperSize,
  type PdfBranding,
  type PdfFonts,
} from './types';
import { PDF_COLOR, PDF_SEMANTIC } from '@/lib/pdf-colors';

// Re-export for backward compatibility
export { generatePatternPdf } from './pattern-pdf';
export { generateCutListPdf } from './cutlist-pdf';
export { generateProjectPdf } from './project-pdf';
export * from './types';
export * from './templates';

// ── Shared Utilities ─────────────────────────────────────────────────────

export async function createPdfDocument(): Promise<{ pdfDoc: PDFDocument; fonts: PdfFonts }> {
  const pdfDoc = await PDFDocument.create();
  const fonts: PdfFonts = {
    regular: await pdfDoc.embedFont(StandardFonts.Helvetica),
    bold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
  };
  return { pdfDoc, fonts };
}

export async function embedLogo(
  pdfDoc: PDFDocument,
  logoPngBytes: Uint8Array | null
): Promise<PdfBranding['logoImage']> {
  if (!logoPngBytes || logoPngBytes.length === 0) return null;
  try {
    return await pdfDoc.embedPng(logoPngBytes);
  } catch {
    return null;
  }
}

export function drawBrandedFooter(
  page: PDFPage,
  font: PdfFonts['regular'],
  pageNum: number,
  totalPages: number,
  margin: number
): void {
  const pts = PDF_POINTS_PER_INCH;
  const pageWidth = page.getWidth();
  const mx = margin * pts;
  const y = (margin * pts) / 2;

  page.drawText('quilt.studio', { x: mx, y, size: 7, font, color: PDF_SEMANTIC.mediumGray });

  const pageText = `Page ${pageNum} of ${totalPages}`;
  const pageTextWidth = font.widthOfTextAtSize(pageText, 7);
  page.drawText(pageText, {
    x: pageWidth - mx - pageTextWidth,
    y,
    size: 7,
    font,
    color: PDF_SEMANTIC.mediumGray,
  });
}

export function drawContentPageHeader(
  page: PDFPage,
  title: string,
  fonts: PdfFonts,
  margin: number,
  branding?: PdfBranding
): number {
  const pts = PDF_POINTS_PER_INCH;
  const pageWidth = page.getWidth();
  const pageHeight = page.getHeight();
  const mx = margin * pts;

  let cursorY = pageHeight - mx;

  if (branding?.logoImage) {
    const logoH = 16;
    const logoW = (branding.logoImage.width / branding.logoImage.height) * logoH;
    page.drawImage(branding.logoImage, { x: mx, y: cursorY - logoH, width: logoW, height: logoH });
    page.drawText('Quilt Studio', {
      x: mx + logoW + 6,
      y: cursorY - 12,
      size: 9,
      font: fonts.regular,
      color: PDF_COLOR.primary,
    });
  } else {
    page.drawText('Quilt Studio', {
      x: mx,
      y: cursorY - 12,
      size: 9,
      font: fonts.regular,
      color: PDF_COLOR.primary,
    });
  }

  cursorY -= 24;
  page.drawText(title, {
    x: mx,
    y: cursorY,
    size: 16,
    font: fonts.bold,
    color: PDF_SEMANTIC.charcoal,
  });

  const ruleY = cursorY - 6;
  page.drawLine({
    start: { x: mx, y: ruleY },
    end: { x: pageWidth - mx, y: ruleY },
    thickness: 0.75,
    color: PDF_COLOR.primary,
  });

  return ruleY - 16;
}

export function drawSectionHeader(
  page: PDFPage,
  title: string,
  y: number,
  font: PdfFonts['bold'],
  margin: number
): number {
  const pts = PDF_POINTS_PER_INCH;
  const pageWidth = page.getWidth();
  const mx = margin * pts;

  page.drawText(title, { x: mx, y, size: 14, font, color: PDF_SEMANTIC.charcoal });

  const ruleY = y - 4;
  page.drawLine({
    start: { x: mx, y: ruleY },
    end: { x: pageWidth - mx, y: ruleY },
    thickness: 0.5,
    color: PDF_SEMANTIC.mediumGray,
  });

  return ruleY - 16;
}

export function drawTable(
  page: PDFPage,
  headers: string[],
  rows: string[][],
  startY: number,
  fonts: PdfFonts,
  options?: { columnWidths?: number[]; startX?: number; tableWidth?: number }
): number {
  const pts = PDF_POINTS_PER_INCH;
  const pageWidth = page.getWidth();
  const margin = 0.5 * pts;
  const headerSize = 9;
  const bodySize = 8;
  const rowH = 16;
  const startX = options?.startX ?? margin;
  const tableW = options?.tableWidth ?? pageWidth - 2 * margin;

  const colCount = headers.length;
  const colWidths = options?.columnWidths ?? Array(colCount).fill(tableW / colCount);

  let y = startY;

  page.drawRectangle({
    x: startX,
    y: y - rowH,
    width: tableW,
    height: rowH,
    color: PDF_COLOR.border,
  });

  let colX = startX + 4;
  for (let c = 0; c < colCount; c++) {
    page.drawText(headers[c], {
      x: colX,
      y: y - rowH + 4,
      size: headerSize,
      font: fonts.bold,
      color: PDF_SEMANTIC.charcoal,
    });
    colX += colWidths[c];
  }

  y -= rowH;

  for (const row of rows) {
    colX = startX + 4;
    for (let c = 0; c < Math.min(row.length, colCount); c++) {
      page.drawText(row[c], {
        x: colX,
        y: y - rowH + 4,
        size: bodySize,
        font: fonts.regular,
        color: PDF_SEMANTIC.charcoal,
      });
      colX += colWidths[c];
    }
    y -= rowH;
  }

  page.drawLine({
    start: { x: startX, y },
    end: { x: startX + tableW, y },
    thickness: 0.5,
    color: PDF_SEMANTIC.mediumGray,
  });

  return y - 8;
}
