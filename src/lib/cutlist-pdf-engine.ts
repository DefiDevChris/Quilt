/**
 * Cut List PDF Engine
 * Generates cutting templates — one page per unique shape with:
 * - Solid cut line (outer)
 * - Dashed sew line (seam allowance, inner)
 * - Per-edge dimensions
 * - Grain line arrow
 * - Piece label and cut count
 * - 1" validation square on the first page
 *
 * Pure computation — no React or Fabric.js dependency.
 */

import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import type { PaperSize } from './pdf-generator';
import type { UnitSystem } from '@/types/canvas';
import type { PrintlistItem } from '@/types/printlist';
import { PDF_POINTS_PER_INCH, PDF_PAGE_SIZES } from '@/lib/constants';
import {
  embedLogo,
  drawContentPageHeader,
  drawBrandedFooter,
  drawValidationSquare,
  drawGrainLine,
  drawPolylinePoints,
  createPdfDocument,
  type PdfBranding,
} from '@/lib/pdf-drawing-utils';
import { extractShapePolyline } from '@/lib/seam-allowance';
import { polylineBoundingBox } from '@/lib/bin-packer';
import { calculateEdgeDimensions } from '@/lib/edge-dimension-utils';
import { deduplicateBy } from '@/lib/dedup-utils';

// ── Types ──────────────────────────────────────────────────────────

export interface BlockInfo {
  blockName?: string | null;
  pieces: Array<{ svgData: string }>;
}

// ── Main Generator ─────────────────────────────────────────────────

/**
 * Generate a cut list PDF with one page per unique shape.
 *
 * @param items - Printlist items with SVG data and quantities
 * @param paperSize - Paper size
 * @param unitSystem - Imperial (fractional inches) or metric (mm)
 * @param logoPng - Logo PNG bytes for branding
 * @param blocks - Block data for the key block diagram page
 */
export async function generateCutListPdf(
  items: PrintlistItem[],
  paperSize: PaperSize,
  unitSystem: UnitSystem,
  logoPng: Uint8Array | null,
  blocks: BlockInfo[]
): Promise<Uint8Array> {
  const pageDims = PDF_PAGE_SIZES[paperSize];
  const pts = PDF_POINTS_PER_INCH;
  const pageW = pageDims.width * pts;
  const pageH = pageDims.height * pts;
  const margin = pageDims.margin;
  const mx = margin * pts;

  const { pdfDoc, fonts: pdfFonts } = await createPdfDocument();
  const fonts = { titleFont: pdfFonts.bold, bodyFont: pdfFonts.regular };

  const logoImage = await embedLogo(pdfDoc, logoPng);
  const branding: PdfBranding = { logoImage };

  const pages: PDFPage[] = [];

  const addPage = () => {
    const p = pdfDoc.addPage([pageW, pageH]);
    pages.push(p);
    return p;
  };

  // ── Page 1: Key Block Diagram ──────────────────────────────────

  const keyPage = addPage();
  buildKeyBlockPage(keyPage, items, blocks, fonts, margin, unitSystem, branding);

  // ── Template Pages: One Per Unique Shape ───────────────────────

  const uniqueShapes = deduplicateBy(items, (item) => item.svgData, (item) => item.quantity);
  let isFirstTemplate = true;

  for (const { item: item, count: totalQuantity, label } of uniqueShapes) {
    const shapeResult = extractShapePolyline(
      item.svgData,
      item.seamAllowanceEnabled !== false ? item.seamAllowance : 0
    );
    if (!shapeResult) continue;

    const { cutLine, seamLine } = shapeResult;
    const cutBbox = polylineBoundingBox(cutLine);
    const outerBbox = seamLine ? polylineBoundingBox(seamLine) : cutBbox;

    // Check if shape fits on a page
    const shapeW = outerBbox.width * pts;
    const shapeH = outerBbox.height * pts;
    const usableW = pageW - 2 * mx;
    const usableH = pageH - 2 * mx - 100;

    if (shapeW > usableW || shapeH > usableH) continue;

    const page = addPage();
    let y = drawContentPageHeader(page, 'Cutting Template', 0, 0, fonts, margin, branding);

    // Validation square on first template page
    if (isFirstTemplate) {
      drawValidationSquare(page, fonts.bodyFont, mx, y);
      y -= 1 * pts + 20;
      isFirstTemplate = false;
    }

    // Piece label
    page.drawText(`Piece ${label} \u2014 Cut ${totalQuantity}`, {
      x: mx,
      y,
      size: 12,
      font: fonts.titleFont,
      color: rgb(0, 0, 0),
    });

    // Shape name
    const nameText = item.shapeName;
    page.drawText(nameText, {
      x: mx,
      y: y - 14,
      size: 8,
      font: fonts.bodyFont,
      color: rgb(0.4, 0.4, 0.4),
    });

    // Dimensions text
    const dimText = `Finished: ${cutBbox.width.toFixed(2)}" x ${cutBbox.height.toFixed(2)}"`;
    page.drawText(dimText, {
      x: mx + fonts.bodyFont.widthOfTextAtSize(nameText, 8) + 12,
      y: y - 14,
      size: 8,
      font: fonts.bodyFont,
      color: rgb(0.4, 0.4, 0.4),
    });
    y -= 32;

    // Draw the shape centered at 1:1 scale
    const centerX = pageW / 2;
    const drawOriginX = centerX - (outerBbox.width * pts) / 2;
    const drawOriginY = y - outerBbox.height * pts;

    // Seam line (dashed, gray)
    if (seamLine) {
      const seamPts = seamLine.map((p) => ({
        x: drawOriginX + (p.x - outerBbox.minX) * pts,
        y: drawOriginY + (outerBbox.height - (p.y - outerBbox.minY)) * pts,
      }));
      drawPolylinePoints(page, seamPts, {
        color: { r: 0.5, g: 0.5, b: 0.5 },
        lineWidth: 0.5,
        dashArray: [3, 3],
        dashPhase: 0,
      });
    }

    // Cut line (solid, black)
    const cutPts = cutLine.map((p) => ({
      x: drawOriginX + (p.x - outerBbox.minX) * pts,
      y: drawOriginY + (outerBbox.height - (p.y - outerBbox.minY)) * pts,
    }));
    drawPolylinePoints(page, cutPts, {
      color: { r: 0, g: 0, b: 0 },
      lineWidth: 1,
    });

    // Edge dimensions
    const edges = calculateEdgeDimensions(cutLine, unitSystem);
    for (const edge of edges) {
      const midPdfX = drawOriginX + (edge.midpoint.x - outerBbox.minX) * pts;
      const midPdfY = drawOriginY + (outerBbox.height - (edge.midpoint.y - outerBbox.minY)) * pts;

      const perpAngle = edge.angle - Math.PI / 2;
      const offset = 14;
      const labelX = midPdfX + offset * Math.cos(perpAngle);
      const labelY = midPdfY + offset * Math.sin(perpAngle);

      const labelW = fonts.bodyFont.widthOfTextAtSize(edge.formattedLength, 7);
      page.drawText(edge.formattedLength, {
        x: labelX - labelW / 2,
        y: labelY - 3,
        size: 7,
        font: fonts.bodyFont,
        color: rgb(0.2, 0.2, 0.2),
      });
    }

    // Grain line — vertical, centered in the shape
    const grainX = centerX;
    const grainTopY = drawOriginY + outerBbox.height * pts * 0.2;
    const grainLen = outerBbox.height * pts * 0.6;
    drawGrainLine(page, fonts.bodyFont, grainX, grainTopY, grainLen, Math.PI / 2);

    // Legend below shape
    const legendY = drawOriginY - 16;
    page.drawLine({
      start: { x: mx, y: legendY + 4 },
      end: { x: mx + 20, y: legendY + 4 },
      thickness: 1,
      color: rgb(0, 0, 0),
    });
    page.drawText('= Cut line', {
      x: mx + 24,
      y: legendY,
      size: 7,
      font: fonts.bodyFont,
      color: rgb(0.3, 0.3, 0.3),
    });

    page.drawLine({
      start: { x: mx + 80, y: legendY + 4 },
      end: { x: mx + 100, y: legendY + 4 },
      thickness: 0.5,
      color: rgb(0.5, 0.5, 0.5),
      dashArray: [3, 3],
    });
    page.drawText('= Sew line (\u00BC" seam allowance)', {
      x: mx + 104,
      y: legendY,
      size: 7,
      font: fonts.bodyFont,
      color: rgb(0.3, 0.3, 0.3),
    });
  }

  // ── Page Numbers ───────────────────────────────────────────────

  const totalPages = pages.length;
  for (let i = 0; i < totalPages; i++) {
    drawBrandedFooter(pages[i], fonts.bodyFont, i + 1, totalPages, margin);
  }

  return pdfDoc.save();
}

// ── Key Block Diagram Page ─────────────────────────────────────────

function buildKeyBlockPage(
  page: PDFPage,
  items: PrintlistItem[],
  _blocks: BlockInfo[],
  fonts: { titleFont: PDFFont; bodyFont: PDFFont },
  margin: number,
  _unitSystem: UnitSystem,
  branding: PdfBranding
): void {
  const pts = PDF_POINTS_PER_INCH;
  const mx = margin * pts;

  let y = drawContentPageHeader(page, 'Cut List — Shape Key', 0, 0, fonts, margin, branding);

  // Seam allowance note
  page.drawText('All measurements include seam allowance. Print at 100% / Actual Size.', {
    x: mx,
    y,
    size: 8,
    font: fonts.bodyFont,
    color: rgb(0.4, 0.4, 0.4),
  });
  y -= 20;

  // List all shapes with labels
  const uniqueShapes = deduplicateBy(items, (item) => item.svgData, (item) => item.quantity);

  for (const { item, count: totalQuantity, label } of uniqueShapes) {
    if (y < mx + 30) break; // stop if page is full

    page.drawText(`Piece ${label}`, {
      x: mx,
      y,
      size: 9,
      font: fonts.titleFont,
      color: rgb(0, 0, 0),
    });

    const desc = `${item.shapeName} \u2014 Cut ${totalQuantity}`;
    page.drawText(desc, {
      x: mx + 60,
      y,
      size: 8,
      font: fonts.bodyFont,
      color: rgb(0.2, 0.2, 0.2),
    });
    y -= 14;
  }
}
