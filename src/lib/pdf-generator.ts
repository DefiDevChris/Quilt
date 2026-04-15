/**
 * PDF Generator Engine
 * Creates 1:1 scale PDF pattern pieces using pdf-lib.
 * 72 PDF points = 1 physical inch.
 *
 * Pure computation — no React or Fabric.js dependency.
 * Runs client-side in the browser.
 */

import { PDFDocument, LineCapStyle, type RGB } from 'pdf-lib';
import type { PrintlistItem } from '@/types/printlist';
import { PDF_POINTS_PER_INCH, PIXELS_PER_INCH } from '@/lib/constants';
import {
  svgPathToPolyline,
  extractPathFromSvg,
  computeSeamOffset,
  type Point,
} from '@/lib/seam-allowance';
import {
  packItems,
  polylineBoundingBox,
  PAPER_LETTER,
  PAPER_A4,
  type PaperConfig,
} from '@/lib/bin-packer';
import {
  drawCoverBranding,
  drawPageHeader,
  drawValidationSquare,
  type PdfFonts,
  type PdfBranding,
} from '@/lib/pdf-drawing-utils';
import { createPdfDocument, embedLogo, drawBrandedFooter } from '@/lib/pdf-engine';
import { PDF_COLOR, PDF_SEMANTIC } from './pdf-colors';

export type PaperSize = 'letter' | 'a4';

interface PageDimensions {
  width: number;
  height: number;
  margin: number;
}

/**
 * Bin-packed pattern pieces PDF — uses 0.5" margins (tighter than pattern docs)
 * because pieces are densely packed with labels.
 * For project/cutlist PDFs, see PDF_PAGE_SIZES in constants.ts (0.75" margins).
 */
const PAGE_SIZES: Record<PaperSize, PageDimensions> = {
  letter: { width: 8.5, height: 11, margin: 0.5 },
  a4: { width: 8.268, height: 11.693, margin: 0.5 },
};

const VALIDATION_BLOCK_HEIGHT = 1.6; // Total height including label

interface ShapeData {
  cutLine: Point[];
  seamLine: Point[] | null;
  bbox: { width: number; height: number; minX: number; minY: number };
  seamBbox: { width: number; height: number; minX: number; minY: number };
  name: string;
  itemIndex: number;
}

/**
 * Extract polyline points from a printlist item's SVG data.
 * Converts from canvas pixels to inches.
 */
function extractShapePoints(
  item: PrintlistItem
): { cutLine: Point[]; seamLine: Point[] | null } | null {
  const pathD = extractPathFromSvg(item.svgData);
  if (!pathD) return null;

  const rawPoints = svgPathToPolyline(pathD);
  if (rawPoints.length < 3) return null;

  // Convert from canvas pixels to inches, then apply print scale
  const pixelToInch = 1 / PIXELS_PER_INCH;
  const cutLine = rawPoints.map((p) => ({ x: p.x * pixelToInch, y: p.y * pixelToInch }));
  const seamLine =
    item.seamAllowanceEnabled !== false ? computeSeamOffset(cutLine, item.seamAllowance) : null;

  return { cutLine, seamLine };
}

/**
 * Draw a polyline path on a PDF page.
 */
function drawPolyline(
  page: ReturnType<PDFDocument['addPage']>,
  points: Point[],
  offsetX: number,
  offsetY: number,
  originX: number,
  originY: number,
  scale: number,
  options: {
    color: RGB;
    lineWidth: number;
    dashArray?: number[];
    dashPhase?: number;
  }
) {
  if (points.length < 2) return;

  const pts = PDF_POINTS_PER_INCH;

  // PDF y-axis is bottom-up, so we flip
  const pageHeight = page.getHeight();

  const toX = (x: number) => (offsetX + (x - originX) * scale) * pts;
  const toY = (y: number) => pageHeight - (offsetY + (y - originY) * scale) * pts;

  page.drawLine({
    start: { x: toX(points[0].x), y: toY(points[0].y) },
    end: { x: toX(points[1].x), y: toY(points[1].y) },
    thickness: options.lineWidth,
    color: options.color,
    lineCap: LineCapStyle.Round,
    dashArray: options.dashArray,
    dashPhase: options.dashPhase,
  });

  for (let i = 1; i < points.length; i++) {
    const next = i + 1 < points.length ? points[i + 1] : points[0];
    page.drawLine({
      start: { x: toX(points[i].x), y: toY(points[i].y) },
      end: { x: toX(next.x), y: toY(next.y) },
      thickness: options.lineWidth,
      color: options.color,
      lineCap: LineCapStyle.Round,
      dashArray: options.dashArray,
      dashPhase: options.dashPhase,
    });
  }
}

/**
 * Draw the 1"x1" validation square on page 1.
 */
function drawValidationSquareAtMargin(
  page: ReturnType<PDFDocument['addPage']>,
  font: Awaited<ReturnType<PDFDocument['embedFont']>>,
  margin: number
) {
  const pts = PDF_POINTS_PER_INCH;
  const pageHeight = page.getHeight();
  const x = margin * pts;
  const y = pageHeight - margin * pts;
  drawValidationSquare(page, font, x, y);
}

/**
 * Generate a scaled PDF with pattern pieces from the printlist.
 *
 * @param items - Printlist items with SVG data and quantities
 * @param paperSize - Paper size ('letter' or 'a4')
 * @param scale - Scale factor (0.5 to 2.0, where 1.0 = 1:1)
 * @returns PDF as Uint8Array
 */
export async function generatePatternPdf(
  items: PrintlistItem[],
  paperSize: PaperSize,
  scale: number = 1.0,
  logoPngBytes?: Uint8Array | null
): Promise<Uint8Array> {
  const pageDims = PAGE_SIZES[paperSize];
  const paper: PaperConfig = paperSize === 'letter' ? PAPER_LETTER : PAPER_A4;

  const { pdfDoc, fonts } = await createPdfDocument();
  const { regular: font, bold: boldFont } = fonts;

  // Embed logo for branding
  const logoImage = await embedLogo(pdfDoc, logoPngBytes ?? null);
  const branding: PdfBranding = { logoImage };

  // Process all shapes
  const shapes: ShapeData[] = [];
  for (let idx = 0; idx < items.length; idx++) {
    const item = items[idx];
    const result = extractShapePoints(item);
    if (!result) continue;

    const bbox = polylineBoundingBox(result.cutLine);
    const seamBbox = result.seamLine ? polylineBoundingBox(result.seamLine) : bbox;

    shapes.push({
      cutLine: result.cutLine,
      seamLine: result.seamLine,
      bbox,
      seamBbox,
      name: item.shapeName,
      itemIndex: idx,
    });
  }

  if (shapes.length === 0) {
    // Empty printlist — create a single page with just the validation square
    const page = pdfDoc.addPage([
      pageDims.width * PDF_POINTS_PER_INCH,
      pageDims.height * PDF_POINTS_PER_INCH,
    ]);
    drawCoverBranding(page, branding, boldFont, pageDims.margin);
    drawValidationSquareAtMargin(page, font, pageDims.margin);
    drawBrandedFooter(page, font, 1, 1, pageDims.margin);
    return pdfDoc.save();
  }

  // Prepare items for bin packing (use seam line bbox for space allocation)
  const packInput = shapes.map((s, i) => ({
    width: s.seamBbox.width,
    height: s.seamBbox.height + 0.25, // Extra space for label
    quantity: items[s.itemIndex].quantity,
    itemIndex: i,
  }));

  const packed = packItems(packInput, paper, VALIDATION_BLOCK_HEIGHT);

  // Create pages
  const pages: ReturnType<typeof pdfDoc.addPage>[] = [];
  for (let p = 0; p < packed.totalPages; p++) {
    pages.push(
      pdfDoc.addPage([pageDims.width * PDF_POINTS_PER_INCH, pageDims.height * PDF_POINTS_PER_INCH])
    );
  }

  // Page 1: cover branding + validation square. Other pages: small header.
  drawCoverBranding(pages[0], branding, boldFont, pageDims.margin);
  drawValidationSquareAtMargin(pages[0], font, pageDims.margin);
  for (let p = 1; p < pages.length; p++) {
    drawPageHeader(pages[p], branding, boldFont, pageDims.margin);
  }

  // Draw each packed item
  for (const packedItem of packed.items) {
    const shape = shapes[packedItem.itemIndex];
    const page = pages[packedItem.page];

    const drawX = pageDims.margin + packedItem.x;
    const drawY =
      pageDims.margin + packedItem.y + (packedItem.page === 0 ? VALIDATION_BLOCK_HEIGHT : 0);

    // Draw seam line (dashed, gray) — only if enabled
    if (shape.seamLine) {
      drawPolyline(
        page,
        shape.seamLine,
        drawX,
        drawY,
        shape.seamBbox.minX,
        shape.seamBbox.minY,
        scale,
        {
          color: PDF_SEMANTIC.sewLine,
          lineWidth: 0.5,
          dashArray: [3, 3],
          dashPhase: 0,
        }
      );
    }

    // Draw cut line (solid, black) — same origin as seam line
    drawPolyline(
      page,
      shape.cutLine,
      drawX,
      drawY,
      shape.seamBbox.minX,
      shape.seamBbox.minY,
      scale,
      {
        color: PDF_SEMANTIC.cutLine,
        lineWidth: 1,
      }
    );

    // Shape label
    const pts = PDF_POINTS_PER_INCH;
    const pageHeight = page.getHeight();
    const labelX = drawX * pts;
    const labelY = pageHeight - (drawY + shape.seamBbox.height + 0.18) * pts;
    const dimText = `${shape.bbox.width.toFixed(2)}" x ${shape.bbox.height.toFixed(2)}"`;

    page.drawText(shape.name, {
      x: labelX,
      y: labelY,
      size: 7,
      font: boldFont,
      color: PDF_SEMANTIC.black,
    });

    page.drawText(dimText, {
      x: labelX + font.widthOfTextAtSize(shape.name, 7) + 4,
      y: labelY,
      size: 6,
      font,
      color: PDF_SEMANTIC.midGray,
    });
  }

  // Branded footers: website URL + page numbers
  for (let p = 0; p < pages.length; p++) {
    drawBrandedFooter(pages[p], font, p + 1, pages.length, pageDims.margin);
  }

  return pdfDoc.save();
}
