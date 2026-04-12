/**
 * Project PDF Engine
 * Generates a complete quilt pattern document matching commercial format.
 *
 * Page structure:
 * 1. Cover page — branding, project name, quilt size, overview image
 * 2. Fabric requirements — yardage table grouped by role
 * 3. Cutting directions — organized by fabric
 * 4. Block assembly — one section per unique block with diagram
 * 5. Quilt diagram — full layout overview
 * 6. Cutting templates — 1:1 scale shapes with seam allowance
 *
 * Pure computation — no React or Fabric.js dependency.
 */

import { PDFDocument, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import type { PaperSize } from './pdf-generator';
import type { UnitSystem } from '@/types/canvas';
import type { BlockSnapshot, PieceSnapshot } from './canvas-snapshot';
import {
  PDF_POINTS_PER_INCH,
  PIXELS_PER_INCH,
  DEFAULT_SEAM_ALLOWANCE_INCHES,
  DEFAULT_WOF,
  DEFAULT_WASTE_MARGIN,
  PDF_PAGE_SIZES,
} from '@/lib/constants';
import {
  drawFullCoverPage,
  drawContentPageHeader,
  drawTable,
  createPdfDocument,
  drawBrandedFooter,
  drawValidationSquare,
  drawGrainLine,
  drawPolylinePoints,
  drawColorSwatch,
  drawSectionHeader,
  type PdfBranding,
} from '@/lib/pdf-drawing-utils';
import { embedLogo } from '@/lib/pdf-drawing-utils';
import { PDF_COLOR, PDF_SEMANTIC } from './pdf-colors';
import { generateCuttingChart } from '@/lib/cutting-chart-generator';
import {
  groupShapesByFabric,
  calculateTotalArea,
  calculateYardage,
  calculateFatQuarters,
  calculateBackingYardage,
  calculateBindingYardage,
  type CanvasShapeData,
} from '@/lib/yardage-utils';
import { extractShapePolyline } from '@/lib/seam-allowance';
import { polylineBoundingBox } from '@/lib/bin-packer';
import { calculateEdgeDimensions } from '@/lib/edge-dimension-utils';
import { deduplicateBy } from '@/lib/dedup-utils';
import { toMixedNumberString, decimalToFraction } from '@/lib/fraction-math';

// ── Types ──────────────────────────────────────────────────────────

export interface ProjectPdfConfig {
  projectName: string;
  quiltWidth: number;
  quiltHeight: number;
  quiltOverviewPng: Uint8Array | null;
  blocks: BlockSnapshot[];
  allPieces: PieceSnapshot[];
  unitSystem: UnitSystem;
  paperSize: PaperSize;
  date: string;
  logoPngBytes: Uint8Array | null;
}

// ── Main Generator ─────────────────────────────────────────────────

export async function generateProjectPdf(config: ProjectPdfConfig): Promise<Uint8Array> {
  const pageDims = PDF_PAGE_SIZES[config.paperSize];
  const pts = PDF_POINTS_PER_INCH;
  const pageW = pageDims.width * pts;
  const pageH = pageDims.height * pts;
  const margin = pageDims.margin;

  const { pdfDoc, fonts: pdfFonts } = await createPdfDocument();
  const fonts = { titleFont: pdfFonts.bold, bodyFont: pdfFonts.regular };

  // Embed assets
  const logoImage = await embedLogo(pdfDoc, config.logoPngBytes);
  const branding: PdfBranding = { logoImage };

  let overviewImage = null;
  if (config.quiltOverviewPng) {
    try {
      overviewImage = await pdfDoc.embedPng(config.quiltOverviewPng);
    } catch {
      overviewImage = null;
    }
  }

  // Track pages for numbering (we add all pages, then number them at the end)
  const pages: ReturnType<typeof pdfDoc.addPage>[] = [];

  const addPage = () => {
    const p = pdfDoc.addPage([pageW, pageH]);
    pages.push(p);
    return p;
  };

  // Format quilt size
  const quiltSize = formatQuiltSize(config.quiltWidth, config.quiltHeight);

  // ── Page 1: Cover ──────────────────────────────────────────────

  const coverPage = addPage();
  drawFullCoverPage(coverPage, {
    branding,
    titleFont: fonts.titleFont,
    bodyFont: fonts.bodyFont,
    projectName: config.projectName,
    quiltSize,
    date: config.date,
    overviewImage,
  });

  // ── Page 2: Fabric Requirements ────────────────────────────────

  const fabricPage = addPage();
  buildFabricRequirementsPage(fabricPage, config, fonts, margin, branding);

  // ── Page 3: Cutting Directions ─────────────────────────────────

  buildCuttingDirectionsPages(pdfDoc, config, fonts, margin, pageW, pageH, pages, branding);
  // Pages already added to `pages` array inside the function

  // ── Page 4+: Block Assembly ────────────────────────────────────

  buildBlockAssemblyPages(pdfDoc, config, fonts, margin, pageW, pageH, pages, branding);

  // ── Quilt Diagram Page ─────────────────────────────────────────

  if (overviewImage) {
    const diagramPage = addPage();
    buildQuiltDiagramPage(diagramPage, overviewImage, fonts, margin, branding);
  }

  // ── Cutting Templates Pages ────────────────────────────────────

  buildCuttingTemplatePages(pdfDoc, config, fonts, margin, pageW, pageH, pages, branding);

  // ── Page Numbers ───────────────────────────────────────────────

  const totalPages = pages.length;
  for (let i = 0; i < totalPages; i++) {
    drawBrandedFooter(pages[i], fonts.bodyFont, i + 1, totalPages, margin);
  }

  return pdfDoc.save();
}

// ── Fabric Requirements Page ───────────────────────────────────────

function buildFabricRequirementsPage(
  page: PDFPage,
  config: ProjectPdfConfig,
  fonts: { titleFont: PDFFont; bodyFont: PDFFont },
  margin: number,
  branding: PdfBranding
): void {
  const pts = PDF_POINTS_PER_INCH;
  let y = drawContentPageHeader(
    page,
    'Fabric Requirements',
    0,
    0, // placeholder — numbered at the end
    fonts,
    margin,
    branding
  );

  // Seam allowance note
  page.drawText('All measurements include \u00BC" seam allowance unless noted.', {
    x: margin * pts,
    y,
    size: 8,
    font: fonts.bodyFont,
    color: PDF_SEMANTIC.midGray,
  });
  y -= 20;

  // Convert pieces to CanvasShapeData for yardage calculation
  const shapeData = piecesToShapeData(config.allPieces);
  const groups = groupShapesByFabric(shapeData);

  // Build table rows
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

    y = drawTable(
      page,
      headers,
      rows,
      y,
      { headerFont: fonts.titleFont, bodyFont: fonts.bodyFont },
      {
        columnWidths: colWidths,
        startX: margin * pts,
        tableWidth: tableW,
      }
    );
  } else {
    page.drawText('No fabric data available.', {
      x: margin * pts,
      y,
      size: 9,
      font: fonts.bodyFont,
      color: PDF_SEMANTIC.midGray,
    });
    y -= 16;
  }

  y -= 16;

  // Backing & Binding section
  y = drawSectionHeader(page, 'Backing & Binding', y, fonts.titleFont, margin);

  const backing = calculateBackingYardage(config.quiltWidth, config.quiltHeight, DEFAULT_WOF);
  const binding = calculateBindingYardage(config.quiltWidth, config.quiltHeight, DEFAULT_WOF);

  const backingText = `Backing: ${toMixedNumberString(decimalToFraction(backing.yardsRequired))} yards (${backing.panelsNeeded} panel${backing.panelsNeeded !== 1 ? 's' : ''})`;
  const bindingText = `Binding: ${toMixedNumberString(decimalToFraction(binding.yardsRequired))} yards (${binding.stripCount} strips at ${toMixedNumberString(decimalToFraction(binding.stripWidthInches))}" x WOF)`;

  page.drawText(backingText, {
    x: margin * pts,
    y,
    size: 9,
    font: fonts.bodyFont,
    color: PDF_SEMANTIC.charcoal,
  });
  y -= 14;

  page.drawText(bindingText, {
    x: margin * pts,
    y,
    size: 9,
    font: fonts.bodyFont,
    color: PDF_SEMANTIC.charcoal,
  });
}

// ── Cutting Directions Pages ───────────────────────────────────────

function buildCuttingDirectionsPages(
  pdfDoc: PDFDocument,
  config: ProjectPdfConfig,
  fonts: { titleFont: PDFFont; bodyFont: PDFFont },
  margin: number,
  pageW: number,
  pageH: number,
  pages: PDFPage[],
  branding: PdfBranding
): void {
  const pts = PDF_POINTS_PER_INCH;

  // Generate cutting chart from all pieces
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
  let y = drawContentPageHeader(page, 'Cutting Directions', 0, 0, fonts, margin, branding);

  // Seam allowance note
  page.drawText(
    'Note: All measurements include \u00BC" seam allowance. WOF = Width of Fabric (~42" wide).',
    {
      x: margin * pts,
      y,
      size: 8,
      font: fonts.bodyFont,
      color: PDF_SEMANTIC.midGray,
    }
  );
  y -= 20;

  for (const entry of cuttingChart) {
    // Check if we need a new page
    if (y < margin * pts + 80) {
      page = pdfDoc.addPage([pageW, pageH]);
      pages.push(page);
      y = drawContentPageHeader(page, 'Cutting Directions (cont.)', 0, 0, fonts, margin, branding);
    }

    // Fabric header with color swatch
    drawColorSwatch(page, margin * pts, y - 10, 10, entry.fillColor);

    page.drawText(`From ${entry.fabricDisplayName}:`, {
      x: margin * pts + 16,
      y: y - 8,
      size: 10,
      font: fonts.titleFont,
      color: PDF_SEMANTIC.charcoal,
    });
    y -= 22;

    // List each patch
    for (const patch of entry.patches) {
      if (y < margin * pts + 40) {
        page = pdfDoc.addPage([pageW, pageH]);
        pages.push(page);
        y = drawContentPageHeader(
          page,
          'Cutting Directions (cont.)',
          0,
          0,
          fonts,
          margin,
          branding
        );
      }

      const cutW = toMixedNumberString(decimalToFraction(patch.cutWidth));
      const cutH = toMixedNumberString(decimalToFraction(patch.cutHeight));
      const sizeStr =
        patch.cutWidth === patch.cutHeight ? `${cutW}" square` : `${cutW}" x ${cutH}"`;

      let line = `    Cut (${patch.quantity}) ${patch.shape === 'square' ? 'squares' : patch.shape === 'rectangle' ? 'rectangles' : 'pieces'} ${sizeStr}`;

      if (patch.specialInstructions) {
        line += ` \u2014 ${patch.specialInstructions}`;
      }

      page.drawText(line, {
        x: margin * pts + 12,
        y,
        size: 8,
        font: fonts.bodyFont,
        color: PDF_SEMANTIC.darkGray,
      });
      y -= 13;
    }

    y -= 8;
  }
}

// ── Block Assembly Pages ───────────────────────────────────────────

function buildBlockAssemblyPages(
  pdfDoc: PDFDocument,
  config: ProjectPdfConfig,
  fonts: { titleFont: PDFFont; bodyFont: PDFFont },
  margin: number,
  pageW: number,
  pageH: number,
  pages: PDFPage[],
  branding: PdfBranding
): void {
  const pts = PDF_POINTS_PER_INCH;
  const namedBlocks = config.blocks.filter((b) => b.pieces.length > 0);
  if (namedBlocks.length === 0) return;

  // Deduplicate blocks by name
  const uniqueBlocks = new Map<string, { block: BlockSnapshot; count: number }>();
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
  let y = drawContentPageHeader(page, 'Block Assembly', 0, 0, fonts, margin, branding);

  let blockLabel = 'A';
  for (const [name, { block, count }] of uniqueBlocks) {
    if (y < margin * pts + 120) {
      page = pdfDoc.addPage([pageW, pageH]);
      pages.push(page);
      y = drawContentPageHeader(page, 'Block Assembly (cont.)', 0, 0, fonts, margin, branding);
    }

    const displayName = name || 'Unnamed Block';
    page.drawText(`${displayName} \u2014 Make ${count}`, {
      x: margin * pts,
      y,
      size: 11,
      font: fonts.titleFont,
      color: PDF_SEMANTIC.charcoal,
    });
    y -= 18;

    // Draw piece list with labels (A, B, C...)
    let pieceIdx = 0;
    for (const piece of block.pieces) {
      if (y < margin * pts + 30) {
        page = pdfDoc.addPage([pageW, pageH]);
        pages.push(page);
        y = drawContentPageHeader(page, 'Block Assembly (cont.)', 0, 0, fonts, margin, branding);
      }

      const label = String.fromCharCode(65 + (pieceIdx % 26));
      const dimW = (piece.dimensions.width / PIXELS_PER_INCH).toFixed(1);
      const dimH = (piece.dimensions.height / PIXELS_PER_INCH).toFixed(1);

      // Color swatch
      drawColorSwatch(page, margin * pts + 8, y - 8, 8, piece.fill);

      page.drawText(`Piece ${label}: ${piece.shapeType} (${dimW}" x ${dimH}")`, {
        x: margin * pts + 22,
        y: y - 6,
        size: 8,
        font: fonts.bodyFont,
        color: PDF_SEMANTIC.darkGray,
      });
      y -= 14;
      pieceIdx++;
    }

    y -= 10;
    blockLabel = String.fromCharCode(blockLabel.charCodeAt(0) + 1);
  }
}

// ── Quilt Diagram Page ─────────────────────────────────────────────

function buildQuiltDiagramPage(
  page: PDFPage,
  overviewImage: Awaited<ReturnType<typeof PDFDocument.prototype.embedPng>>,
  fonts: { titleFont: PDFFont; bodyFont: PDFFont },
  margin: number,
  branding: PdfBranding
): void {
  const pts = PDF_POINTS_PER_INCH;
  const pageWidth = page.getWidth();
  const mx = margin * pts;

  const y = drawContentPageHeader(page, 'Quilt Diagram', 0, 0, fonts, margin, branding);

  // Center the overview image
  const availW = pageWidth - 2 * mx;
  const availH = y - mx - 20;

  const imgW = overviewImage.width;
  const imgH = overviewImage.height;
  const scale = Math.min(availW / imgW, availH / imgH, 1);
  const drawW = imgW * scale;
  const drawH = imgH * scale;
  const drawX = mx + (availW - drawW) / 2;
  const drawY = y - drawH;

  page.drawImage(overviewImage, {
    x: drawX,
    y: drawY,
    width: drawW,
    height: drawH,
  });

  // Caption
  page.drawText('Quilt Diagram', {
    x: mx + (availW - fonts.titleFont.widthOfTextAtSize('Quilt Diagram', 10)) / 2,
    y: drawY - 14,
    size: 10,
    font: fonts.titleFont,
    color: PDF_SEMANTIC.mediumGray,
  });
}

// ── Cutting Templates Pages ────────────────────────────────────────

function buildCuttingTemplatePages(
  pdfDoc: PDFDocument,
  config: ProjectPdfConfig,
  fonts: { titleFont: PDFFont; bodyFont: PDFFont },
  margin: number,
  pageW: number,
  pageH: number,
  pages: PDFPage[],
  branding: PdfBranding
): void {
  const pts = PDF_POINTS_PER_INCH;
  const mx = margin * pts;

  // Collect unique piece shapes by SVG data
  const uniquePieces = deduplicateBy(config.allPieces, (piece) => piece.svgData);
  if (uniquePieces.length === 0) return;

  let isFirstTemplatePage = true;

  for (const { item: piece, count, label } of uniquePieces) {
    const shapeResult = extractShapePolyline(piece.svgData, DEFAULT_SEAM_ALLOWANCE_INCHES);
    if (!shapeResult) continue;

    const { cutLine, seamLine } = shapeResult;
    const cutBbox = polylineBoundingBox(cutLine);
    const seamBbox = seamLine ? polylineBoundingBox(seamLine) : cutBbox;

    // Check if shape fits on a page
    const shapeW = seamBbox.width * pts;
    const shapeH = seamBbox.height * pts;
    const usableW = pageW - 2 * mx;
    const usableH = pageH - 2 * mx - 80; // reserve for header and footer

    if (shapeW > usableW || shapeH > usableH) {
      // Shape too large — skip (user should print at reduced scale)
      continue;
    }

    const page = pdfDoc.addPage([pageW, pageH]);
    pages.push(page);

    let y = drawContentPageHeader(page, 'Cutting Template', 0, 0, fonts, margin, branding);

    // Validation square on first template page
    if (isFirstTemplatePage) {
      drawValidationSquare(page, fonts.bodyFont, mx, y);
      y -= 1 * pts + 20;
      isFirstTemplatePage = false;
    }

    // Piece label
    page.drawText(`Piece ${label} \u2014 Cut ${count}`, {
      x: mx,
      y,
      size: 12,
      font: fonts.titleFont,
      color: PDF_SEMANTIC.black,
    });
    y -= 20;

    // Draw the shape centered on the page at 1:1 scale
    const centerX = pageW / 2;
    const drawOriginX = centerX - (seamBbox.width * pts) / 2;
    const drawOriginY = y - seamBbox.height * pts;

    // Draw seam line (dashed, gray) if present
    if (seamLine) {
      const seamPts = seamLine.map((p) => ({
        x: drawOriginX + (p.x - seamBbox.minX) * pts,
        y: drawOriginY + (seamBbox.height - (p.y - seamBbox.minY)) * pts,
      }));
      drawPolylinePoints(page, seamPts, {
        color: PDF_SEMANTIC.sewLine,
        lineWidth: 0.5,
        dashArray: [3, 3],
        dashPhase: 0,
      });
    }

    // Draw cut line (solid, black)
    const cutPts = cutLine.map((p) => ({
      x: drawOriginX + (p.x - seamBbox.minX) * pts,
      y: drawOriginY + (seamBbox.height - (p.y - seamBbox.minY)) * pts,
    }));
    drawPolylinePoints(page, cutPts, {
      color: PDF_SEMANTIC.cutLine,
      lineWidth: 1,
    });

    // Edge dimensions
    const edges = calculateEdgeDimensions(cutLine, config.unitSystem);
    for (const edge of edges) {
      const midPdfX = drawOriginX + (edge.midpoint.x - seamBbox.minX) * pts;
      const midPdfY = drawOriginY + (seamBbox.height - (edge.midpoint.y - seamBbox.minY)) * pts;

      // Offset label perpendicular to edge
      const perpAngle = edge.angle - Math.PI / 2;
      const offset = 12;
      const labelX = midPdfX + offset * Math.cos(perpAngle);
      const labelY = midPdfY + offset * Math.sin(perpAngle);

      const labelW = fonts.bodyFont.widthOfTextAtSize(edge.formattedLength, 7);
      page.drawText(edge.formattedLength, {
        x: labelX - labelW / 2,
        y: labelY - 3,
        size: 7,
        font: fonts.bodyFont,
        color: PDF_SEMANTIC.darkGray,
      });
    }

    // Grain line — vertical, centered in shape
    const grainX = centerX;
    const grainTopY = drawOriginY + seamBbox.height * pts * 0.2;
    const grainLen = seamBbox.height * pts * 0.6;
    drawGrainLine(page, fonts.bodyFont, grainX, grainTopY, grainLen, Math.PI / 2);
  }
}

// ── Helpers ────────────────────────────────────────────────────────

function formatQuiltSize(widthInches: number, heightInches: number): string {
  const w = toMixedNumberString(decimalToFraction(widthInches));
  const h = toMixedNumberString(decimalToFraction(heightInches));
  return `${w}" x ${h}"`;
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
