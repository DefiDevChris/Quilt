/**
 * Cut List PDF — one page per unique shape with dimensions and seam allowance.
 */

import { PDFDocument, type PDFPage, type PDFFont } from 'pdf-lib';
import { createPdfDocument, embedLogo, drawContentPageHeader, drawBrandedFooter } from './index';
import { drawValidationSquare, drawGrainLine, drawPolylinePoints } from './templates';
import {
  PDF_PAGE_SIZES,
  PDF_POINTS_PER_INCH,
  type CutlistPdfConfig,
  type BlockSnapshot,
  type PdfFonts,
  type PdfBranding,
} from './types';
import { extractShapePolyline } from './shapes';
import { calculateEdgeDimensions } from '@/lib/edge-dimension-utils';
import { deduplicateBy } from '@/lib/dedup-utils';
import { PDF_SEMANTIC } from '@/lib/pdf-colors';

export async function generateCutListPdf(config: CutlistPdfConfig): Promise<Uint8Array> {
  const pageDims = PDF_PAGE_SIZES[config.paperSize];
  const pts = PDF_POINTS_PER_INCH;
  const pageW = pageDims.width * pts;
  const pageH = pageDims.height * pts;
  const margin = pageDims.margin;
  const mx = margin * pts;

  const { pdfDoc, fonts } = await createPdfDocument();

  const logoImage = await embedLogo(pdfDoc, config.logoPng);
  const branding: PdfBranding = { logoImage };

  const pages: PDFPage[] = [];

  const addPage = () => {
    const p = pdfDoc.addPage([pageW, pageH]);
    pages.push(p);
    return p;
  };

  // Page 1: Key Block Diagram
  const keyPage = addPage();
  buildKeyBlockPage(keyPage, config.items, config.blocks, fonts, margin, branding);

  // Template Pages
  const uniqueShapes = deduplicateBy(
    config.items,
    (item) => item.svgData,
    (item) => item.quantity
  );
  let isFirstTemplate = true;

  for (const { item, count: totalQuantity, label } of uniqueShapes) {
    const shapeResult = extractShapePolyline(
      item.svgData,
      item.seamAllowanceEnabled !== false ? item.seamAllowance : 0
    );
    if (!shapeResult) continue;

    const { cutLine, seamLine, cutBbox, seamBbox } = shapeResult;
    const outerBbox = seamBbox;

    const shapeW = outerBbox.width * pts;
    const shapeH = outerBbox.height * pts;
    const usableW = pageW - 2 * mx;
    const usableH = pageH - 2 * mx - 100;

    if (shapeW > usableW || shapeH > usableH) continue;

    const page = addPage();
    let y = drawContentPageHeader(page, 'Cutting Template', fonts, margin, branding);

    if (isFirstTemplate) {
      drawValidationSquare(page, fonts.regular, mx, y);
      y -= 1 * pts + 20;
      isFirstTemplate = false;
    }

    page.drawText(`Piece ${label} — Cut ${totalQuantity}`, {
      x: mx,
      y,
      size: 12,
      font: fonts.bold,
      color: PDF_SEMANTIC.black,
    });
    page.drawText(item.shapeName, {
      x: mx,
      y: y - 14,
      size: 8,
      font: fonts.regular,
      color: PDF_SEMANTIC.midGray,
    });

    const dimText = `Finished: ${cutBbox.width.toFixed(2)}" x ${cutBbox.height.toFixed(2)}"`;
    page.drawText(dimText, {
      x: mx + fonts.regular.widthOfTextAtSize(item.shapeName, 8) + 12,
      y: y - 14,
      size: 8,
      font: fonts.regular,
      color: PDF_SEMANTIC.midGray,
    });
    y -= 32;

    const centerX = pageW / 2;
    const drawOriginX = centerX - (outerBbox.width * pts) / 2;
    const drawOriginY = y - outerBbox.height * pts;

    if (seamLine) {
      const seamPts = seamLine.map((p) => ({
        x: drawOriginX + (p.x - outerBbox.minX) * pts,
        y: drawOriginY + (outerBbox.height - (p.y - outerBbox.minY)) * pts,
      }));
      drawPolylinePoints(page, seamPts, {
        color: PDF_SEMANTIC.sewLine,
        lineWidth: 0.5,
        dashArray: [3, 3],
      });
    }

    const cutPts = cutLine.map((p) => ({
      x: drawOriginX + (p.x - outerBbox.minX) * pts,
      y: drawOriginY + (outerBbox.height - (p.y - outerBbox.minY)) * pts,
    }));
    drawPolylinePoints(page, cutPts, { color: PDF_SEMANTIC.cutLine, lineWidth: 1 });

    const edges = calculateEdgeDimensions(cutLine, config.unitSystem);
    for (const edge of edges) {
      const midPdfX = drawOriginX + (edge.midpoint.x - outerBbox.minX) * pts;
      const midPdfY = drawOriginY + (outerBbox.height - (edge.midpoint.y - outerBbox.minY)) * pts;
      const perpAngle = edge.angle - Math.PI / 2;
      const offset = 14;
      const labelX = midPdfX + offset * Math.cos(perpAngle);
      const labelY = midPdfY + offset * Math.sin(perpAngle);
      const labelW = fonts.regular.widthOfTextAtSize(edge.formattedLength, 7);
      page.drawText(edge.formattedLength, {
        x: labelX - labelW / 2,
        y: labelY - 3,
        size: 7,
        font: fonts.regular,
        color: PDF_SEMANTIC.darkGray,
      });
    }

    const grainX = centerX;
    const grainTopY = drawOriginY + outerBbox.height * pts * 0.2;
    const grainLen = outerBbox.height * pts * 0.6;
    drawGrainLine(page, fonts.regular, grainX, grainTopY, grainLen, Math.PI / 2);

    // Legend
    const legendY = drawOriginY - 16;
    page.drawLine({
      start: { x: mx, y: legendY + 4 },
      end: { x: mx + 20, y: legendY + 4 },
      thickness: 1,
      color: PDF_SEMANTIC.black,
    });
    page.drawText('= Cut line', {
      x: mx + 24,
      y: legendY,
      size: 7,
      font: fonts.regular,
      color: PDF_SEMANTIC.mediumGray,
    });
    page.drawLine({
      start: { x: mx + 80, y: legendY + 4 },
      end: { x: mx + 100, y: legendY + 4 },
      thickness: 0.5,
      color: PDF_SEMANTIC.lightGray,
      dashArray: [3, 3],
    });
    page.drawText('= Sew line (¼" seam allowance)', {
      x: mx + 104,
      y: legendY,
      size: 7,
      font: fonts.regular,
      color: PDF_SEMANTIC.mediumGray,
    });
  }

  const totalPages = pages.length;
  for (let i = 0; i < totalPages; i++) {
    drawBrandedFooter(pages[i], fonts.regular, i + 1, totalPages, margin);
  }

  return pdfDoc.save();
}

function buildKeyBlockPage(
  page: PDFPage,
  items: CutlistPdfConfig['items'],
  _blocks: BlockSnapshot[],
  fonts: PdfFonts,
  margin: number,
  branding: PdfBranding
): void {
  const pts = PDF_POINTS_PER_INCH;
  const mx = margin * pts;

  let y = drawContentPageHeader(page, 'Cut List — Shape Key', fonts, margin, branding);

  page.drawText('All measurements include seam allowance. Print at 100% / Actual Size.', {
    x: mx,
    y,
    size: 8,
    font: fonts.regular,
    color: PDF_SEMANTIC.midGray,
  });
  y -= 20;

  const uniqueShapes = deduplicateBy(
    items,
    (item) => item.svgData,
    (item) => item.quantity
  );

  for (const { item, count: totalQuantity, label } of uniqueShapes) {
    if (y < mx + 30) break;
    page.drawText(`Piece ${label}`, {
      x: mx,
      y,
      size: 9,
      font: fonts.bold,
      color: PDF_SEMANTIC.black,
    });
    const desc = `${item.shapeName} — Cut ${totalQuantity}`;
    page.drawText(desc, {
      x: mx + 60,
      y,
      size: 8,
      font: fonts.regular,
      color: PDF_SEMANTIC.darkGray,
    });
    y -= 14;
  }
}
