/**
 * PDF Drawing Utilities
 * Shared branding, tables, polylines, grain lines, and validation square
 * used by all PDF export engines.
 *
 * Pure computation — no React or Fabric.js dependency.
 */

import {
  PDFDocument,
  PDFPage,
  PDFFont,
  PDFImage,
  rgb,
  LineCapStyle,
  StandardFonts,
  type RGB,
} from 'pdf-lib';
import { PDF_POINTS_PER_INCH } from '@/lib/constants';
import { PDF_COLOR, PDF_SEMANTIC } from './pdf-colors';

// ── Types ──────────────────────────────────────────────────────────

export interface PdfBranding {
  logoImage: PDFImage | null;
}

export interface TableOptions {
  /** Column widths in points. If omitted, columns split evenly. */
  columnWidths?: number[];
  /** Font size for header row (default 9) */
  headerFontSize?: number;
  /** Font size for body rows (default 8) */
  bodyFontSize?: number;
  /** Row height in points (default 16) */
  rowHeight?: number;
  /** Header font override */
  headerFont?: PDFFont;
  /** Body font override */
  bodyFont?: PDFFont;
  /** Table width in points (default: page width minus margins) */
  tableWidth?: number;
  /** Left X position in points */
  startX?: number;
}

export interface LineOptions {
  color?: RGB;
  lineWidth?: number;
  dashArray?: number[];
  dashPhase?: number;
}

// ── Logo Embedding ─────────────────────────────────────────────────

/**
 * Embed a PNG logo into a PDF document.
 * Returns null if the bytes are null or embedding fails.
 */
export async function embedLogo(
  pdfDoc: PDFDocument,
  logoPngBytes: Uint8Array | null
): Promise<PDFImage | null> {
  if (!logoPngBytes || logoPngBytes.length === 0) return null;
  try {
    return await pdfDoc.embedPng(logoPngBytes);
  } catch {
    return null;
  }
}

// ── Page Branding ──────────────────────────────────────────────────

/**
 * Draw cover branding on page 1 of pattern-pieces PDF.
 * Shows logo (if available) + "Quilt Studio" text in top-left.
 */
export function drawCoverBranding(
  page: PDFPage,
  branding: PdfBranding,
  font: PDFFont,
  margin: number
): void {
  const pts = PDF_POINTS_PER_INCH;
  const pageHeight = page.getHeight();
  const x = margin * pts;
  const y = pageHeight - margin * pts;

  if (branding.logoImage) {
    const logoHeight = 24;
    const logoWidth = (branding.logoImage.width / branding.logoImage.height) * logoHeight;
    page.drawImage(branding.logoImage, {
      x,
      y: y - logoHeight,
      width: logoWidth,
      height: logoHeight,
    });
  }

  page.drawText('Quilt Studio', {
    x: branding.logoImage ? x + 30 : x,
    y: y - 16,
    size: 12,
    font,
    color: PDF_COLOR.primary,
  });
}

/**
 * Draw a small header on non-cover pages of pattern-pieces PDF.
 * Shows logo (if available) + "Quilt Studio" in top-left.
 */
export function drawPageHeader(
  page: PDFPage,
  branding: PdfBranding,
  font: PDFFont,
  margin: number
): void {
  const pts = PDF_POINTS_PER_INCH;
  const pageHeight = page.getHeight();
  const x = margin * pts;
  const y = pageHeight - margin * pts;

  if (branding.logoImage) {
    const logoHeight = 16;
    const logoWidth = (branding.logoImage.width / branding.logoImage.height) * logoHeight;
    page.drawImage(branding.logoImage, {
      x,
      y: y - logoHeight,
      width: logoWidth,
      height: logoHeight,
    });
  }

  page.drawText('Quilt Studio', {
    x: branding.logoImage ? x + 22 : x,
    y: y - 12,
    size: 9,
    font,
    color: PDF_COLOR.primary,
  });
}

/**
 * Draw a branded footer: website bottom-left, page number bottom-right.
 */
export function drawBrandedFooter(
  page: PDFPage,
  font: PDFFont,
  pageNum: number,
  totalPages: number,
  margin: number
): void {
  const pts = PDF_POINTS_PER_INCH;
  const pageWidth = page.getWidth();
  const mx = margin * pts;
  const y = (margin * pts) / 2;

  // Website — bottom-left
  page.drawText('quilt.studio', {
    x: mx,
    y,
    size: 7,
    font,
    color: PDF_SEMANTIC.mediumGray,
  });

  // Page number — bottom-right
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

// ── Full Cover Page ────────────────────────────────────────────────

/**
 * Draw a full cover page for project/cutlist PDFs.
 * Modeled after the Andover Stargazer cover: large title, quilt size,
 * overview image, date, and branding.
 */
export function drawFullCoverPage(
  page: PDFPage,
  options: {
    branding: PdfBranding;
    titleFont: PDFFont;
    bodyFont: PDFFont;
    projectName: string;
    quiltSize: string;
    date: string;
    overviewImage?: PDFImage | null;
  }
): void {
  const pts = PDF_POINTS_PER_INCH;
  const pageWidth = page.getWidth();
  const pageHeight = page.getHeight();
  const margin = 0.75 * pts;

  // Top branding bar
  if (options.branding.logoImage) {
    const logoH = 32;
    const logoW = (options.branding.logoImage.width / options.branding.logoImage.height) * logoH;
    page.drawImage(options.branding.logoImage, {
      x: margin,
      y: pageHeight - margin - logoH,
      width: logoW,
      height: logoH,
    });
  }

  page.drawText('Quilt Studio', {
    x: options.branding.logoImage ? margin + 40 : margin,
    y: pageHeight - margin - 22,
    size: 14,
    font: options.titleFont,
    color: PDF_COLOR.primary,
  });

  // Horizontal rule under branding
  const ruleY = pageHeight - margin - 44;
  page.drawLine({
    start: { x: margin, y: ruleY },
    end: { x: pageWidth - margin, y: ruleY },
    thickness: 1,
    color: PDF_COLOR.primary,
  });

  // Project name — large title
  let cursorY = ruleY - 36;
  page.drawText(options.projectName, {
    x: margin,
    y: cursorY,
    size: 28,
    font: options.titleFont,
    color: PDF_SEMANTIC.charcoal,
  });

  cursorY -= 8;

  // Quilt Pattern subtitle
  page.drawText('Quilt Pattern', {
    x: margin,
    y: cursorY,
    size: 12,
    font: options.bodyFont,
    color: PDF_SEMANTIC.mediumGray,
  });

  cursorY -= 22;

  // Quilt size
  page.drawText(`Finished Size: ${options.quiltSize}`, {
    x: margin,
    y: cursorY,
    size: 11,
    font: options.titleFont,
    color: PDF_SEMANTIC.charcoal,
  });

  cursorY -= 30;

  // Overview image — fill available space
  if (options.overviewImage) {
    const imgNativeW = options.overviewImage.width;
    const imgNativeH = options.overviewImage.height;
    const availW = pageWidth - 2 * margin;
    const availH = cursorY - margin - 60; // leave room for footer area
    const scale = Math.min(availW / imgNativeW, availH / imgNativeH, 1);
    const imgW = imgNativeW * scale;
    const imgH = imgNativeH * scale;
    const imgX = margin + (availW - imgW) / 2;
    const imgY = cursorY - imgH;

    page.drawImage(options.overviewImage, {
      x: imgX,
      y: imgY,
      width: imgW,
      height: imgH,
    });

    cursorY = imgY - 16;
  }

  // Date
  page.drawText(options.date, {
    x: margin,
    y: Math.max(cursorY, margin + 30),
    size: 9,
    font: options.bodyFont,
    color: PDF_SEMANTIC.mediumGray,
  });

  // Footer rule
  page.drawLine({
    start: { x: margin, y: margin + 20 },
    end: { x: pageWidth - margin, y: margin + 20 },
    thickness: 0.5,
    color: PDF_SEMANTIC.mediumGray,
  });

  // Website — bottom-left
  page.drawText('quilt.studio', {
    x: margin,
    y: margin + 8,
    size: 7,
    font: options.bodyFont,
    color: PDF_SEMANTIC.mediumGray,
  });

  // Page 1 — bottom-right
  const pageText = 'Page 1';
  const pageTextW = options.bodyFont.widthOfTextAtSize(pageText, 7);
  page.drawText(pageText, {
    x: pageWidth - margin - pageTextW,
    y: margin + 8,
    size: 7,
    font: options.bodyFont,
    color: PDF_SEMANTIC.mediumGray,
  });
}

// ── Section Header ─────────────────────────────────────────────────

/**
 * Draw a section header with horizontal rule.
 * Returns the Y position after the header (ready for content below).
 */
export function drawSectionHeader(
  page: PDFPage,
  title: string,
  y: number,
  font: PDFFont,
  margin: number
): number {
  const pts = PDF_POINTS_PER_INCH;
  const pageWidth = page.getWidth();
  const mx = margin * pts;

  page.drawText(title, {
    x: mx,
    y,
    size: 14,
    font,
    color: PDF_SEMANTIC.charcoal,
  });

  const ruleY = y - 4;
  page.drawLine({
    start: { x: mx, y: ruleY },
    end: { x: pageWidth - mx, y: ruleY },
    thickness: 0.5,
    color: PDF_SEMANTIC.mediumGray,
  });

  return ruleY - 16;
}

// ── Tables ─────────────────────────────────────────────────────────

/**
 * Draw a table on a PDF page. Returns the Y position below the table.
 */
export function drawTable(
  page: PDFPage,
  headers: string[],
  rows: string[][],
  startY: number,
  fonts: { headerFont: PDFFont; bodyFont: PDFFont },
  options?: TableOptions
): number {
  const pts = PDF_POINTS_PER_INCH;
  const pageWidth = page.getWidth();
  const margin = 0.5 * pts;
  const headerSize = options?.headerFontSize ?? 9;
  const bodySize = options?.bodyFontSize ?? 8;
  const rowH = options?.rowHeight ?? 16;
  const startX = options?.startX ?? margin;
  const tableW = options?.tableWidth ?? pageWidth - 2 * margin;

  const colCount = headers.length;
  const colWidths = options?.columnWidths ?? Array(colCount).fill(tableW / colCount);

  let y = startY;

  // Header background
  page.drawRectangle({
    x: startX,
    y: y - rowH,
    width: tableW,
    height: rowH,
    color: PDF_COLOR.border,
  });

  // Header text
  let colX = startX + 4;
  for (let c = 0; c < colCount; c++) {
    page.drawText(headers[c], {
      x: colX,
      y: y - rowH + 4,
      size: headerSize,
      font: fonts.headerFont,
      color: PDF_SEMANTIC.charcoal,
    });
    colX += colWidths[c];
  }

  y -= rowH;

  // Rows
  for (const row of rows) {
    // Alternate row shading
    colX = startX + 4;
    for (let c = 0; c < Math.min(row.length, colCount); c++) {
      page.drawText(row[c], {
        x: colX,
        y: y - rowH + 4,
        size: bodySize,
        font: fonts.bodyFont,
        color: PDF_SEMANTIC.charcoal,
      });
      colX += colWidths[c];
    }
    y -= rowH;
  }

  // Bottom border
  page.drawLine({
    start: { x: startX, y },
    end: { x: startX + tableW, y },
    thickness: 0.5,
    color: PDF_SEMANTIC.mediumGray,
  });

  return y - 8;
}

// ── Drawing Primitives ─────────────────────────────────────────────

/**
 * Draw a closed polyline on a PDF page.
 * Points are in PDF points (72 per inch), positioned directly.
 */
export function drawPolylinePoints(
  page: PDFPage,
  points: { x: number; y: number }[],
  options?: LineOptions
): void {
  if (points.length < 2) return;

  const color = options?.color ?? PDF_SEMANTIC.black;
  const lineWidth = options?.lineWidth ?? 1;

  for (let i = 0; i < points.length; i++) {
    const next = (i + 1) % points.length;
    page.drawLine({
      start: { x: points[i].x, y: points[i].y },
      end: { x: points[next].x, y: points[next].y },
      thickness: lineWidth,
      color,
      lineCap: LineCapStyle.Round,
      dashArray: options?.dashArray,
      dashPhase: options?.dashPhase,
    });
  }
}

/**
 * Draw a 1" x 1" validation square with instructions.
 * The square lets quilters verify their printer is printing at 100% (no scaling).
 */
export function drawValidationSquare(page: PDFPage, font: PDFFont, x: number, y: number): void {
  const pts = PDF_POINTS_PER_INCH;
  const size = 1 * pts; // exactly 1 inch

  page.drawRectangle({
    x,
    y: y - size,
    width: size,
    height: size,
    borderColor: PDF_SEMANTIC.black,
    borderWidth: 1,
    color: PDF_SEMANTIC.white,
  });

  const labelSize = 7;
  const line1 = "This square should measure exactly 1 inch. If it doesn't, check your";
  const line2 = "printer settings \u2014 ensure 'Actual Size' or '100%' is selected.";

  page.drawText(line1, {
    x: x + size + 6,
    y: y - labelSize - 2,
    size: labelSize,
    font,
    color: PDF_SEMANTIC.mediumGray,
  });

  page.drawText(line2, {
    x: x + size + 6,
    y: y - labelSize * 2 - 5,
    size: labelSize,
    font,
    color: PDF_SEMANTIC.mediumGray,
  });
}

/**
 * Draw a grain line arrow with "GRAIN" label.
 * Used on cutting templates to show fabric grain direction.
 */
export function drawGrainLine(
  page: PDFPage,
  font: PDFFont,
  x: number,
  y: number,
  length: number,
  angle: number = 0
): void {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const endX = x + length * cos;
  const endY = y + length * sin;

  // Main line
  page.drawLine({
    start: { x, y },
    end: { x: endX, y: endY },
    thickness: 0.75,
    color: PDF_SEMANTIC.black,
    lineCap: LineCapStyle.Round,
  });

  // Arrowhead at end
  const arrowLen = 6;
  const arrowAngle = Math.PI / 6;
  page.drawLine({
    start: { x: endX, y: endY },
    end: {
      x: endX - arrowLen * Math.cos(angle - arrowAngle),
      y: endY - arrowLen * Math.sin(angle - arrowAngle),
    },
    thickness: 0.75,
    color: PDF_SEMANTIC.black,
  });
  page.drawLine({
    start: { x: endX, y: endY },
    end: {
      x: endX - arrowLen * Math.cos(angle + arrowAngle),
      y: endY - arrowLen * Math.sin(angle + arrowAngle),
    },
    thickness: 0.75,
    color: PDF_SEMANTIC.black,
  });

  // Arrowhead at start (reversed)
  page.drawLine({
    start: { x, y },
    end: {
      x: x + arrowLen * Math.cos(angle - arrowAngle),
      y: y + arrowLen * Math.sin(angle - arrowAngle),
    },
    thickness: 0.75,
    color: PDF_SEMANTIC.black,
  });
  page.drawLine({
    start: { x, y },
    end: {
      x: x + arrowLen * Math.cos(angle + arrowAngle),
      y: y + arrowLen * Math.sin(angle + arrowAngle),
    },
    thickness: 0.75,
    color: PDF_SEMANTIC.black,
  });

  // "GRAIN" text — centered along the line
  const midX = (x + endX) / 2;
  const midY = (y + endY) / 2;
  const labelText = 'GRAIN';
  const labelWidth = font.widthOfTextAtSize(labelText, 7);
  page.drawText(labelText, {
    x: midX - labelWidth / 2,
    y: midY + 4,
    size: 7,
    font,
    color: PDF_SEMANTIC.black,
  });
}

// ── Content Page Header ────────────────────────────────────────────

/**
 * Draw a standard content page header.
 * Top-left: logo + "Quilt Studio" branding. Below that: section title + rule.
 * Returns Y position ready for content.
 */
export function drawContentPageHeader(
  page: PDFPage,
  title: string,
  pageNum: number,
  totalPages: number,
  fonts: { titleFont: PDFFont; bodyFont: PDFFont },
  margin: number,
  branding?: PdfBranding
): number {
  const pts = PDF_POINTS_PER_INCH;
  const pageWidth = page.getWidth();
  const pageHeight = page.getHeight();
  const mx = margin * pts;

  let cursorY = pageHeight - mx;

  // Top-left branding: logo + "Quilt Studio"
  if (branding?.logoImage) {
    const logoH = 16;
    const logoW = (branding.logoImage.width / branding.logoImage.height) * logoH;
    page.drawImage(branding.logoImage, {
      x: mx,
      y: cursorY - logoH,
      width: logoW,
      height: logoH,
    });
    page.drawText('Quilt Studio', {
      x: mx + logoW + 6,
      y: cursorY - 12,
      size: 9,
      font: fonts.bodyFont,
      color: PDF_COLOR.primary,
    });
  } else {
    page.drawText('Quilt Studio', {
      x: mx,
      y: cursorY - 12,
      size: 9,
      font: fonts.bodyFont,
      color: PDF_COLOR.primary,
    });
  }

  cursorY -= 24;

  // Section title
  page.drawText(title, {
    x: mx,
    y: cursorY,
    size: 16,
    font: fonts.titleFont,
    color: PDF_SEMANTIC.charcoal,
  });

  // Horizontal rule
  const ruleY = cursorY - 6;
  page.drawLine({
    start: { x: mx, y: ruleY },
    end: { x: pageWidth - mx, y: ruleY },
    thickness: 0.75,
    color: PDF_COLOR.primary,
  });

  // Footer
  drawBrandedFooter(page, fonts.bodyFont, pageNum, totalPages, margin);

  return ruleY - 16;
}

/**
 * Draw a color swatch rectangle (used in fabric tables).
 */
export function drawColorSwatch(
  page: PDFPage,
  x: number,
  y: number,
  size: number,
  hexColor: string
): void {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  page.drawRectangle({
    x,
    y,
    width: size,
    height: size,
    color: rgb(r, g, b),
    borderColor: PDF_SEMANTIC.borderGray,
    borderWidth: 0.5,
  });
}

// ── PDF Initialization ───────────────────────────────────────────────

export interface PdfFonts {
  regular: PDFFont;
  bold: PDFFont;
}

/**
 * Initialize a new PDF document with standard fonts.
 * Used by all PDF generation engines.
 */
export async function createPdfDocument(): Promise<{ pdfDoc: PDFDocument; fonts: PdfFonts }> {
  const pdfDoc = await PDFDocument.create();
  const fonts: PdfFonts = {
    regular: await pdfDoc.embedFont(StandardFonts.Helvetica),
    bold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
  };
  return { pdfDoc, fonts };
}
