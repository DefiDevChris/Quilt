/**
 * PDF Generator Engine
 * Creates 1:1 scale PDF pattern pieces using pdf-lib.
 * 72 PDF points = 1 physical inch.
 *
 * Pure computation — no React or Fabric.js dependency.
 * Runs client-side in the browser.
 */

import { PDFDocument, rgb, StandardFonts, LineCapStyle } from 'pdf-lib';
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

export type PaperSize = 'letter' | 'a4';

interface PageDimensions {
  width: number;
  height: number;
  margin: number;
}

const PAGE_SIZES: Record<PaperSize, PageDimensions> = {
  letter: { width: 8.5, height: 11, margin: 0.5 },
  a4: { width: 8.268, height: 11.693, margin: 0.5 },
};

const VALIDATION_SQUARE_SIZE = 1; // 1 inch
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
function extractShapePoints(item: PrintlistItem): { cutLine: Point[]; seamLine: Point[] | null } | null {
  const pathD = extractPathFromSvg(item.svgData);
  if (!pathD) return null;

  const rawPoints = svgPathToPolyline(pathD);
  if (rawPoints.length < 3) return null;

  // Convert from canvas pixels to inches
  const scale = 1 / PIXELS_PER_INCH;
  const cutLine = rawPoints.map((p) => ({ x: p.x * scale, y: p.y * scale }));
  const seamLine = item.seamAllowanceEnabled !== false
    ? computeSeamOffset(cutLine, item.seamAllowance)
    : null;

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
  options: {
    color: { r: number; g: number; b: number };
    lineWidth: number;
    dashArray?: number[];
    dashPhase?: number;
  }
) {
  if (points.length < 2) return;

  const pts = PDF_POINTS_PER_INCH;

  // PDF y-axis is bottom-up, so we flip
  const pageHeight = page.getHeight();

  const toX = (x: number) => (offsetX + (x - originX)) * pts;
  const toY = (y: number) => pageHeight - (offsetY + (y - originY)) * pts;

  page.drawLine({
    start: { x: toX(points[0].x), y: toY(points[0].y) },
    end: { x: toX(points[1].x), y: toY(points[1].y) },
    thickness: options.lineWidth,
    color: rgb(options.color.r, options.color.g, options.color.b),
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
      color: rgb(options.color.r, options.color.g, options.color.b),
      lineCap: LineCapStyle.Round,
      dashArray: options.dashArray,
      dashPhase: options.dashPhase,
    });
  }
}

/**
 * Draw the 1"x1" validation square on page 1.
 */
function drawValidationSquare(
  page: ReturnType<PDFDocument['addPage']>,
  font: Awaited<ReturnType<PDFDocument['embedFont']>>,
  margin: number
) {
  const pts = PDF_POINTS_PER_INCH;
  const pageHeight = page.getHeight();
  const squareSize = VALIDATION_SQUARE_SIZE * pts;
  const x = margin * pts;
  const y = pageHeight - margin * pts - squareSize;

  // Draw the square
  page.drawRectangle({
    x,
    y,
    width: squareSize,
    height: squareSize,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
    color: rgb(1, 1, 1),
  });

  // Label
  const labelSize = 7;
  const label = "This square should measure exactly 1 inch. If it doesn't, check your";
  const label2 = "printer settings — ensure 'Actual Size' or '100%' is selected.";

  page.drawText(label, {
    x: x + squareSize + 6,
    y: y + squareSize - labelSize - 2,
    size: labelSize,
    font,
    color: rgb(0.3, 0.3, 0.3),
  });

  page.drawText(label2, {
    x: x + squareSize + 6,
    y: y + squareSize - labelSize * 2 - 5,
    size: labelSize,
    font,
    color: rgb(0.3, 0.3, 0.3),
  });
}

/**
 * Generate a 1:1 scale PDF with pattern pieces from the printlist.
 *
 * @param items - Printlist items with SVG data and quantities
 * @param paperSize - Paper size ('letter' or 'a4')
 * @returns PDF as Uint8Array
 */
export async function generatePatternPdf(
  items: PrintlistItem[],
  paperSize: PaperSize
): Promise<Uint8Array> {
  const pageDims = PAGE_SIZES[paperSize];
  const paper: PaperConfig = paperSize === 'letter' ? PAPER_LETTER : PAPER_A4;

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Process all shapes
  const shapes: ShapeData[] = [];
  for (let idx = 0; idx < items.length; idx++) {
    const item = items[idx];
    const result = extractShapePoints(item);
    if (!result) continue;

    const bbox = polylineBoundingBox(result.cutLine);
    const seamBbox = result.seamLine
      ? polylineBoundingBox(result.seamLine)
      : bbox;

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
    drawValidationSquare(page, font, pageDims.margin);
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

  // Draw validation square on page 1
  drawValidationSquare(pages[0], font, pageDims.margin);

  // Draw each packed item
  for (const packedItem of packed.items) {
    const shape = shapes[packedItem.itemIndex];
    const page = pages[packedItem.page];

    const drawX = pageDims.margin + packedItem.x;
    const drawY =
      pageDims.margin + packedItem.y + (packedItem.page === 0 ? VALIDATION_BLOCK_HEIGHT : 0);

    // Draw seam line (dashed, gray) — only if enabled
    if (shape.seamLine) {
      drawPolyline(page, shape.seamLine, drawX, drawY, shape.seamBbox.minX, shape.seamBbox.minY, {
        color: { r: 0.5, g: 0.5, b: 0.5 },
        lineWidth: 0.5,
        dashArray: [3, 3],
        dashPhase: 0,
      });
    }

    // Draw cut line (solid, black) — same origin as seam line
    drawPolyline(page, shape.cutLine, drawX, drawY, shape.seamBbox.minX, shape.seamBbox.minY, {
      color: { r: 0, g: 0, b: 0 },
      lineWidth: 1,
    });

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
      color: rgb(0, 0, 0),
    });

    page.drawText(dimText, {
      x: labelX + font.widthOfTextAtSize(shape.name, 7) + 4,
      y: labelY,
      size: 6,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });
  }

  // Add page numbers
  for (let p = 0; p < pages.length; p++) {
    const page = pages[p];
    const pageText = `Page ${p + 1} of ${pages.length}`;
    const textWidth = font.widthOfTextAtSize(pageText, 8);
    page.drawText(pageText, {
      x: page.getWidth() - pageDims.margin * PDF_POINTS_PER_INCH - textWidth,
      y: 18,
      size: 8,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });
  }

  return pdfDoc.save();
}

/**
 * Helper to download a PDF blob.
 */
export function downloadPdf(pdfBytes: Uint8Array, filename: string) {
  const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
