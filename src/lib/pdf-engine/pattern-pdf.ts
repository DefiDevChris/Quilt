/**
 * Pattern Pieces PDF — bin-packed shapes at scale for cutting templates.
 */

import { PDFDocument, LineCapStyle } from 'pdf-lib';
import { createPdfDocument, embedLogo, drawBrandedFooter } from './index';
import { drawValidationSquare, drawPolylinePoints } from './templates';
import {
  PDF_PAGE_SIZES,
  PDF_POINTS_PER_INCH,
  PIXELS_PER_INCH,
  type PatternPdfConfig,
  type Point,
  type PdfBranding,
  type PdfFonts,
} from './types';
import { extractShapePolyline } from './shapes';
import { packItems, PAPER_LETTER, PAPER_A4, type PaperConfig } from '@/lib/bin-packer';
import { PDF_COLOR, PDF_SEMANTIC } from '@/lib/pdf-colors';

const VALIDATION_BLOCK_HEIGHT = 1.6;

interface ShapeData {
  cutLine: Point[];
  seamLine: Point[] | null;
  bbox: { width: number; height: number; minX: number; minY: number };
  seamBbox: { width: number; height: number; minX: number; minY: number };
  name: string;
  itemIndex: number;
}

export async function generatePatternPdf(config: PatternPdfConfig): Promise<Uint8Array> {
  const pageDims = PDF_PAGE_SIZES[config.paperSize];
  const paper: PaperConfig = config.paperSize === 'letter' ? PAPER_LETTER : PAPER_A4;

  const { pdfDoc, fonts } = await createPdfDocument();

  const logoImage = await embedLogo(pdfDoc, config.logoPngBytes);
  const branding: PdfBranding = { logoImage };

  const shapes: ShapeData[] = [];
  for (let idx = 0; idx < config.items.length; idx++) {
    const item = config.items[idx];
    const result = extractShapePolyline(
      item.svgData,
      item.seamAllowanceEnabled !== false ? item.seamAllowance : 0
    );
    if (!result) continue;

    shapes.push({
      cutLine: result.cutLine,
      seamLine: result.seamLine,
      bbox: result.cutBbox,
      seamBbox: result.seamBbox,
      name: item.shapeName,
      itemIndex: idx,
    });
  }

  if (shapes.length === 0) {
    const page = pdfDoc.addPage([
      pageDims.width * PDF_POINTS_PER_INCH,
      pageDims.height * PDF_POINTS_PER_INCH,
    ]);
    drawCoverBranding(page, branding, fonts.bold, pageDims.margin);
    drawValidationSquareAtMargin(page, fonts.regular, pageDims.margin);
    drawBrandedFooter(page, fonts.regular, 1, 1, pageDims.margin);
    return pdfDoc.save();
  }

  const packInput = shapes.map((s, i) => ({
    width: s.seamBbox.width,
    height: s.seamBbox.height + 0.25,
    quantity: config.items[s.itemIndex].quantity,
    itemIndex: i,
  }));

  const packed = packItems(packInput, paper, VALIDATION_BLOCK_HEIGHT);

  const pages: ReturnType<typeof pdfDoc.addPage>[] = [];
  for (let p = 0; p < packed.totalPages; p++) {
    pages.push(
      pdfDoc.addPage([pageDims.width * PDF_POINTS_PER_INCH, pageDims.height * PDF_POINTS_PER_INCH])
    );
  }

  drawCoverBranding(pages[0], branding, fonts.bold, pageDims.margin);
  drawValidationSquareAtMargin(pages[0], fonts.regular, pageDims.margin);
  for (let p = 1; p < pages.length; p++) {
    drawPageHeader(pages[p], branding, fonts.bold, pageDims.margin);
  }

  for (const packedItem of packed.items) {
    const shape = shapes[packedItem.itemIndex];
    const page = pages[packedItem.page];

    const drawX = pageDims.margin + packedItem.x;
    const drawY =
      pageDims.margin + packedItem.y + (packedItem.page === 0 ? VALIDATION_BLOCK_HEIGHT : 0);

    if (shape.seamLine) {
      drawPolylineOnPage(
        page,
        shape.seamLine,
        drawX,
        drawY,
        shape.seamBbox.minX,
        shape.seamBbox.minY,
        config.scale,
        {
          color: PDF_SEMANTIC.sewLine,
          lineWidth: 0.5,
          dashArray: [3, 3],
        }
      );
    }

    drawPolylineOnPage(
      page,
      shape.cutLine,
      drawX,
      drawY,
      shape.seamBbox.minX,
      shape.seamBbox.minY,
      config.scale,
      {
        color: PDF_SEMANTIC.cutLine,
        lineWidth: 1,
      }
    );

    const pts = PDF_POINTS_PER_INCH;
    const pageHeight = page.getHeight();
    const labelX = drawX * pts;
    const labelY = pageHeight - (drawY + shape.seamBbox.height + 0.18) * pts;
    const dimText = `${shape.bbox.width.toFixed(2)}" x ${shape.bbox.height.toFixed(2)}"`;

    page.drawText(shape.name, {
      x: labelX,
      y: labelY,
      size: 7,
      font: fonts.bold,
      color: PDF_SEMANTIC.black,
    });
    page.drawText(dimText, {
      x: labelX + fonts.regular.widthOfTextAtSize(shape.name, 7) + 4,
      y: labelY,
      size: 6,
      font: fonts.regular,
      color: PDF_SEMANTIC.midGray,
    });
  }

  for (let p = 0; p < pages.length; p++) {
    drawBrandedFooter(pages[p], fonts.regular, p + 1, pages.length, pageDims.margin);
  }

  return pdfDoc.save();
}

function drawPolylineOnPage(
  page: ReturnType<PDFDocument['addPage']>,
  points: Point[],
  offsetX: number,
  offsetY: number,
  originX: number,
  originY: number,
  scale: number,
  options: {
    color: Parameters<typeof page.drawLine>[0]['color'];
    lineWidth: number;
    dashArray?: number[];
  }
) {
  if (points.length < 2) return;

  const pts = PDF_POINTS_PER_INCH;
  const pageHeight = page.getHeight();

  const toX = (x: number) => (offsetX + (x - originX) * scale) * pts;
  const toY = (y: number) => pageHeight - (offsetY + (y - originY) * scale) * pts;

  for (let i = 0; i < points.length; i++) {
    const next = i + 1 < points.length ? points[i + 1] : points[0];
    page.drawLine({
      start: { x: toX(points[i].x), y: toY(points[i].y) },
      end: { x: toX(next.x), y: toY(next.y) },
      thickness: options.lineWidth,
      color: options.color,
      lineCap: LineCapStyle.Round,
      dashArray: options.dashArray,
    });
  }
}

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

function drawCoverBranding(
  page: ReturnType<PDFDocument['addPage']>,
  branding: PdfBranding,
  font: PdfFonts['bold'],
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

function drawPageHeader(
  page: ReturnType<PDFDocument['addPage']>,
  branding: PdfBranding,
  font: PdfFonts['regular'],
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
