/**
 * Project PDF — full quilt pattern document with cover, fabric requirements, cutting directions.
 */

import { PDFDocument, type PDFPage } from 'pdf-lib';
import {
  createPdfDocument,
  embedLogo,
  drawContentPageHeader,
  drawBrandedFooter,
  drawSectionHeader,
  drawTable,
} from './index';
import {
  drawValidationSquare,
  drawGrainLine,
  drawPolylinePoints,
  drawColorSwatch,
} from './templates';
import {
  PDF_PAGE_SIZES,
  PDF_POINTS_PER_INCH,
  PIXELS_PER_INCH,
  type ProjectPdfConfig,
  type PieceSnapshot,
  type PdfFonts,
  type PdfBranding,
} from './types';
import { extractShapePolyline } from './shapes';
import { calculateEdgeDimensions } from '@/lib/edge-dimension-utils';
import { deduplicateBy } from '@/lib/dedup-utils';
import { toMixedNumberString, decimalToFraction } from '@/lib/fraction-math';
import {
  groupShapesByFabric,
  calculateTotalArea,
  calculateYardage,
  calculateFatQuarters,
  calculateBackingYardage,
  calculateBindingYardage,
  type CanvasShapeData,
} from '@/lib/yardage-utils';
import { generateCuttingChart } from '@/lib/cutting-chart-generator';
import { DEFAULT_SEAM_ALLOWANCE_INCHES, DEFAULT_WOF, DEFAULT_WASTE_MARGIN } from '@/lib/constants';
import { PDF_COLOR, PDF_SEMANTIC } from '@/lib/pdf-colors';

export async function generateProjectPdf(config: ProjectPdfConfig): Promise<Uint8Array> {
  const pageDims = PDF_PAGE_SIZES[config.paperSize];
  const pts = PDF_POINTS_PER_INCH;
  const pageW = pageDims.width * pts;
  const pageH = pageDims.height * pts;
  const margin = pageDims.margin;

  const { pdfDoc, fonts } = await createPdfDocument();

  const logoImage = await embedLogo(pdfDoc, config.logoPngBytes);
  const branding: PdfBranding = { logoImage };

  let overviewImage: Awaited<ReturnType<typeof pdfDoc.embedPng>> | null = null;
  if (config.quiltOverviewPng) {
    try {
      overviewImage = await pdfDoc.embedPng(config.quiltOverviewPng);
    } catch {}
  }

  const pages: ReturnType<typeof pdfDoc.addPage>[] = [];

  const addPage = () => {
    const p = pdfDoc.addPage([pageW, pageH]);
    pages.push(p);
    return p;
  };

  const quiltSize = formatQuiltSize(config.quiltWidth, config.quiltHeight);

  // Page 1: Cover
  const coverPage = addPage();
  drawFullCoverPage(coverPage, {
    branding,
    titleFont: fonts.bold,
    bodyFont: fonts.regular,
    projectName: config.projectName,
    quiltSize,
    date: config.date,
    overviewImage,
  });

  // Page 2: Fabric Requirements
  const fabricPage = addPage();
  buildFabricRequirementsPage(fabricPage, config, fonts, margin, branding);

  // Page 3+: Cutting Directions
  buildCuttingDirectionsPages(pdfDoc, config, fonts, margin, pageW, pageH, pages, branding);

  // Page 4+: Block Assembly
  buildBlockAssemblyPages(pdfDoc, config, fonts, margin, pageW, pageH, pages, branding);

  // Quilt Diagram Page
  if (overviewImage) {
    const diagramPage = addPage();
    buildQuiltDiagramPage(diagramPage, overviewImage, fonts, margin, branding);
  }

  // Cutting Templates Pages
  buildCuttingTemplatePages(pdfDoc, config, fonts, margin, pageW, pageH, pages, branding);

  // Page Numbers
  const totalPages = pages.length;
  for (let i = 0; i < totalPages; i++) {
    drawBrandedFooter(pages[i], fonts.regular, i + 1, totalPages, margin);
  }

  return pdfDoc.save();
}

function formatQuiltSize(widthInches: number, heightInches: number): string {
  const w = toMixedNumberString(decimalToFraction(widthInches));
  const h = toMixedNumberString(decimalToFraction(heightInches));
  return `${w}" x ${h}"`;
}

function drawFullCoverPage(
  page: PDFPage,
  options: {
    branding: PdfBranding;
    titleFont: PdfFonts['bold'];
    bodyFont: PdfFonts['regular'];
    projectName: string;
    quiltSize: string;
    date: string;
    overviewImage?: Awaited<ReturnType<PDFDocument['embedPng']>> | null;
  }
): void {
  const pts = PDF_POINTS_PER_INCH;
  const pageWidth = page.getWidth();
  const pageHeight = page.getHeight();
  const margin = 0.75 * pts;

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

  const ruleY = pageHeight - margin - 44;
  page.drawLine({
    start: { x: margin, y: ruleY },
    end: { x: pageWidth - margin, y: ruleY },
    thickness: 1,
    color: PDF_COLOR.primary,
  });

  let cursorY = ruleY - 36;
  page.drawText(options.projectName, {
    x: margin,
    y: cursorY,
    size: 28,
    font: options.titleFont,
    color: PDF_SEMANTIC.charcoal,
  });
  cursorY -= 8;
  page.drawText('Quilt Pattern', {
    x: margin,
    y: cursorY,
    size: 12,
    font: options.bodyFont,
    color: PDF_SEMANTIC.mediumGray,
  });
  cursorY -= 22;
  page.drawText(`Finished Size: ${options.quiltSize}`, {
    x: margin,
    y: cursorY,
    size: 11,
    font: options.titleFont,
    color: PDF_SEMANTIC.charcoal,
  });
  cursorY -= 30;

  if (options.overviewImage) {
    const imgNativeW = options.overviewImage.width;
    const imgNativeH = options.overviewImage.height;
    const availW = pageWidth - 2 * margin;
    const availH = cursorY - margin - 60;
    const scale = Math.min(availW / imgNativeW, availH / imgNativeH, 1);
    const imgW = imgNativeW * scale;
    const imgH = imgNativeH * scale;
    const imgX = margin + (availW - imgW) / 2;
    const imgY = cursorY - imgH;
    page.drawImage(options.overviewImage, { x: imgX, y: imgY, width: imgW, height: imgH });
    cursorY = imgY - 16;
  }

  page.drawText(options.date, {
    x: margin,
    y: Math.max(cursorY, margin + 30),
    size: 9,
    font: options.bodyFont,
    color: PDF_SEMANTIC.mediumGray,
  });
  page.drawLine({
    start: { x: margin, y: margin + 20 },
    end: { x: pageWidth - margin, y: margin + 20 },
    thickness: 0.5,
    color: PDF_SEMANTIC.mediumGray,
  });
  page.drawText('quilt.studio', {
    x: margin,
    y: margin + 8,
    size: 7,
    font: options.bodyFont,
    color: PDF_SEMANTIC.mediumGray,
  });
}

function buildFabricRequirementsPage(
  page: PDFPage,
  config: ProjectPdfConfig,
  fonts: PdfFonts,
  margin: number,
  branding: PdfBranding
): void {
  const pts = PDF_POINTS_PER_INCH;
  let y = drawContentPageHeader(page, 'Fabric Requirements', fonts, margin, branding);

  page.drawText('All measurements include ¼" seam allowance unless noted.', {
    x: margin * pts,
    y,
    size: 8,
    font: fonts.regular,
    color: PDF_SEMANTIC.midGray,
  });
  y -= 20;

  const shapeData = piecesToShapeData(config.allPieces);
  const groups = groupShapesByFabric(shapeData);

  const headers = ['Fabric', 'Color', 'Pieces', 'Yardage', 'Fat Quarters'];
  const rows: string[][] = [];

  for (const group of groups) {
    const totalArea = calculateTotalArea(group.shapes, PIXELS_PER_INCH);
    const yards = calculateYardage(totalArea, DEFAULT_WOF, DEFAULT_WASTE_MARGIN);
    const roundedYards = yards > 0 ? Math.ceil(yards * 8) / 8 : 0;
    const fatQuarters = calculateFatQuarters(totalArea, DEFAULT_WASTE_MARGIN);

    rows.push([
      group.displayName,
      group.fillColor,
      `${group.shapes.length}`,
      roundedYards > 0 ? `${toMixedNumberString(decimalToFraction(roundedYards))} yd` : '-',
      fatQuarters > 0 ? `${fatQuarters}` : '-',
    ]);
  }

  if (rows.length > 0) {
    const pageWidth = page.getWidth();
    const tableW = pageWidth - 2 * margin * pts;
    const colWidths = [tableW * 0.3, tableW * 0.15, tableW * 0.15, tableW * 0.2, tableW * 0.2];
    y = drawTable(page, headers, rows, y, fonts, {
      columnWidths: colWidths,
      startX: margin * pts,
      tableWidth: tableW,
    });
  } else {
    page.drawText('No fabric data available.', {
      x: margin * pts,
      y,
      size: 9,
      font: fonts.regular,
      color: PDF_SEMANTIC.midGray,
    });
    y -= 16;
  }

  y -= 16;
  y = drawSectionHeader(page, 'Backing & Binding', y, fonts.bold, margin);

  const backing = calculateBackingYardage(config.quiltWidth, config.quiltHeight, DEFAULT_WOF);
  const binding = calculateBindingYardage(config.quiltWidth, config.quiltHeight, DEFAULT_WOF);

  page.drawText(
    `Backing: ${toMixedNumberString(decimalToFraction(backing.yardsRequired))} yards (${backing.panelsNeeded} panel${backing.panelsNeeded !== 1 ? 's' : ''})`,
    { x: margin * pts, y, size: 9, font: fonts.regular, color: PDF_SEMANTIC.charcoal }
  );
  y -= 14;
  page.drawText(
    `Binding: ${toMixedNumberString(decimalToFraction(binding.yardsRequired))} yards (${binding.stripCount} strips at ${toMixedNumberString(decimalToFraction(binding.stripWidthInches))}" x WOF)`,
    { x: margin * pts, y, size: 9, font: fonts.regular, color: PDF_SEMANTIC.charcoal }
  );
}

function buildCuttingDirectionsPages(
  pdfDoc: PDFDocument,
  config: ProjectPdfConfig,
  fonts: PdfFonts,
  margin: number,
  pageW: number,
  pageH: number,
  pages: PDFPage[],
  branding: PdfBranding
): void {
  const pts = PDF_POINTS_PER_INCH;

  const chartItems = config.allPieces.map((piece, idx) => ({
    shapeId: `piece-${idx}`,
    shapeName: piece.shapeType,
    svgData: piece.svgData,
    quantity: 1,
    seamAllowance: DEFAULT_SEAM_ALLOWANCE_INCHES,
    unitSystem: config.unitSystem,
    fabricId: piece.fabricId ?? null,
    fabricName: undefined,
    fillColor: piece.fill,
  }));

  const cuttingChart = generateCuttingChart(chartItems, DEFAULT_SEAM_ALLOWANCE_INCHES);
  if (cuttingChart.length === 0) return;

  let page = pdfDoc.addPage([pageW, pageH]);
  pages.push(page);
  let y = drawContentPageHeader(page, 'Cutting Directions', fonts, margin, branding);

  page.drawText(
    'Note: All measurements include ¼" seam allowance. WOF = Width of Fabric (~42" wide).',
    { x: margin * pts, y, size: 8, font: fonts.regular, color: PDF_SEMANTIC.midGray }
  );
  y -= 20;

  for (const entry of cuttingChart) {
    if (y < margin * pts + 80) {
      page = pdfDoc.addPage([pageW, pageH]);
      pages.push(page);
      y = drawContentPageHeader(page, 'Cutting Directions (cont.)', fonts, margin, branding);
    }

    drawColorSwatch(page, margin * pts, y - 10, 10, entry.fillColor);
    page.drawText(`From ${entry.fabricDisplayName}:`, {
      x: margin * pts + 16,
      y: y - 8,
      size: 10,
      font: fonts.bold,
      color: PDF_SEMANTIC.charcoal,
    });
    y -= 22;

    for (const patch of entry.patches) {
      if (y < margin * pts + 40) {
        page = pdfDoc.addPage([pageW, pageH]);
        pages.push(page);
        y = drawContentPageHeader(page, 'Cutting Directions (cont.)', fonts, margin, branding);
      }

      const cutW = toMixedNumberString(decimalToFraction(patch.cutWidth));
      const cutH = toMixedNumberString(decimalToFraction(patch.cutHeight));
      const sizeStr =
        patch.cutWidth === patch.cutHeight ? `${cutW}" square` : `${cutW}" x ${cutH}"`;
      let line = `    Cut (${patch.quantity}) ${patch.shape === 'square' ? 'squares' : patch.shape === 'rectangle' ? 'rectangles' : 'pieces'} ${sizeStr}`;
      if (patch.specialInstructions) line += ` — ${patch.specialInstructions}`;

      page.drawText(line, {
        x: margin * pts + 12,
        y,
        size: 8,
        font: fonts.regular,
        color: PDF_SEMANTIC.darkGray,
      });
      y -= 13;
    }
    y -= 8;
  }
}

function buildBlockAssemblyPages(
  pdfDoc: PDFDocument,
  config: ProjectPdfConfig,
  fonts: PdfFonts,
  margin: number,
  pageW: number,
  pageH: number,
  pages: PDFPage[],
  branding: PdfBranding
): void {
  const pts = PDF_POINTS_PER_INCH;
  const namedBlocks = config.blocks.filter((b) => b.pieces.length > 0);
  if (namedBlocks.length === 0) return;

  const uniqueBlocks = new Map<string, { block: (typeof namedBlocks)[0]; count: number }>();
  for (const block of namedBlocks) {
    const key = block.blockName ?? `block-${uniqueBlocks.size}`;
    const existing = uniqueBlocks.get(key);
    if (existing) {
      uniqueBlocks.set(key, { ...existing, count: existing.count + 1 });
    } else {
      uniqueBlocks.set(key, { block, count: 1 });
    }
  }

  let page = pdfDoc.addPage([pageW, pageH]);
  pages.push(page);
  let y = drawContentPageHeader(page, 'Block Assembly', fonts, margin, branding);

  for (const [name, { block, count }] of uniqueBlocks) {
    if (y < margin * pts + 120) {
      page = pdfDoc.addPage([pageW, pageH]);
      pages.push(page);
      y = drawContentPageHeader(page, 'Block Assembly (cont.)', fonts, margin, branding);
    }

    const displayName = name || 'Unnamed Block';
    page.drawText(`${displayName} — Make ${count}`, {
      x: margin * pts,
      y,
      size: 11,
      font: fonts.bold,
      color: PDF_SEMANTIC.charcoal,
    });
    y -= 18;

    let pieceIdx = 0;
    for (const piece of block.pieces) {
      if (y < margin * pts + 30) {
        page = pdfDoc.addPage([pageW, pageH]);
        pages.push(page);
        y = drawContentPageHeader(page, 'Block Assembly (cont.)', fonts, margin, branding);
      }

      const label = String.fromCharCode(65 + (pieceIdx % 26));
      const dimW = (piece.dimensions.width / PIXELS_PER_INCH).toFixed(1);
      const dimH = (piece.dimensions.height / PIXELS_PER_INCH).toFixed(1);

      drawColorSwatch(page, margin * pts + 8, y - 8, 8, piece.fill);
      page.drawText(`Piece ${label}: ${piece.shapeType} (${dimW}" x ${dimH}")`, {
        x: margin * pts + 22,
        y: y - 6,
        size: 8,
        font: fonts.regular,
        color: PDF_SEMANTIC.darkGray,
      });
      y -= 14;
      pieceIdx++;
    }
    y -= 10;
  }
}

function buildQuiltDiagramPage(
  page: PDFPage,
  overviewImage: Awaited<ReturnType<PDFDocument['embedPng']>>,
  fonts: PdfFonts,
  margin: number,
  branding: PdfBranding
): void {
  const pts = PDF_POINTS_PER_INCH;
  const pageWidth = page.getWidth();
  const mx = margin * pts;

  const y = drawContentPageHeader(page, 'Quilt Diagram', fonts, margin, branding);

  const availW = pageWidth - 2 * mx;
  const availH = y - mx - 20;

  const imgW = overviewImage.width;
  const imgH = overviewImage.height;
  const scale = Math.min(availW / imgW, availH / imgH, 1);
  const drawW = imgW * scale;
  const drawH = imgH * scale;
  const drawX = mx + (availW - drawW) / 2;
  const drawY = y - drawH;

  page.drawImage(overviewImage, { x: drawX, y: drawY, width: drawW, height: drawH });
  page.drawText('Quilt Diagram', {
    x: mx + (availW - fonts.bold.widthOfTextAtSize('Quilt Diagram', 10)) / 2,
    y: drawY - 14,
    size: 10,
    font: fonts.bold,
    color: PDF_SEMANTIC.mediumGray,
  });
}

function buildCuttingTemplatePages(
  pdfDoc: PDFDocument,
  config: ProjectPdfConfig,
  fonts: PdfFonts,
  margin: number,
  pageW: number,
  pageH: number,
  pages: PDFPage[],
  branding: PdfBranding
): void {
  const pts = PDF_POINTS_PER_INCH;
  const mx = margin * pts;

  const uniquePieces = deduplicateBy(config.allPieces, (piece) => piece.svgData);
  if (uniquePieces.length === 0) return;

  let isFirstTemplatePage = true;

  for (const { item: piece, count, label } of uniquePieces) {
    const shapeResult = extractShapePolyline(piece.svgData, DEFAULT_SEAM_ALLOWANCE_INCHES);
    if (!shapeResult) continue;

    const { cutLine, seamLine, cutBbox, seamBbox } = shapeResult;

    const shapeW = seamBbox.width * pts;
    const shapeH = seamBbox.height * pts;
    const usableW = pageW - 2 * mx;
    const usableH = pageH - 2 * mx - 80;

    if (shapeW > usableW || shapeH > usableH) continue;

    const page = pdfDoc.addPage([pageW, pageH]);
    pages.push(page);

    let y = drawContentPageHeader(page, 'Cutting Template', fonts, margin, branding);

    if (isFirstTemplatePage) {
      drawValidationSquare(page, fonts.regular, mx, y);
      y -= 1 * pts + 20;
      isFirstTemplatePage = false;
    }

    page.drawText(`Piece ${label} — Cut ${count}`, {
      x: mx,
      y,
      size: 12,
      font: fonts.bold,
      color: PDF_SEMANTIC.black,
    });
    y -= 20;

    const centerX = pageW / 2;
    const drawOriginX = centerX - (seamBbox.width * pts) / 2;
    const drawOriginY = y - seamBbox.height * pts;

    if (seamLine) {
      const seamPts = seamLine.map((p) => ({
        x: drawOriginX + (p.x - seamBbox.minX) * pts,
        y: drawOriginY + (seamBbox.height - (p.y - seamBbox.minY)) * pts,
      }));
      drawPolylinePoints(page, seamPts, {
        color: PDF_SEMANTIC.sewLine,
        lineWidth: 0.5,
        dashArray: [3, 3],
      });
    }

    const cutPts = cutLine.map((p) => ({
      x: drawOriginX + (p.x - seamBbox.minX) * pts,
      y: drawOriginY + (seamBbox.height - (p.y - seamBbox.minY)) * pts,
    }));
    drawPolylinePoints(page, cutPts, { color: PDF_SEMANTIC.cutLine, lineWidth: 1 });

    const edges = calculateEdgeDimensions(cutLine, config.unitSystem);
    for (const edge of edges) {
      const midPdfX = drawOriginX + (edge.midpoint.x - seamBbox.minX) * pts;
      const midPdfY = drawOriginY + (seamBbox.height - (edge.midpoint.y - seamBbox.minY)) * pts;
      const perpAngle = edge.angle - Math.PI / 2;
      const offset = 12;
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
    const grainTopY = drawOriginY + seamBbox.height * pts * 0.2;
    const grainLen = seamBbox.height * pts * 0.6;
    drawGrainLine(page, fonts.regular, grainX, grainTopY, grainLen, Math.PI / 2);
  }
}

function piecesToShapeData(pieces: PieceSnapshot[]): CanvasShapeData[] {
  return pieces.map((piece, idx) => ({
    id: `piece-${idx}`,
    widthPx: piece.dimensions.width,
    heightPx: piece.dimensions.height,
    scaleX: 1,
    scaleY: 1,
    fabricId: piece.fabricId ?? null,
    fabricName: null,
    fillColor: piece.fill,
    type: piece.shapeType,
  }));
}
