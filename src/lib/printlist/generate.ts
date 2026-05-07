import { PDFDocument, rgb, StandardFonts, PDFPage, RGB } from 'pdf-lib';
import { ComputedYardage } from '@/lib/yardage-calculator';
import { toMixedNumberString, decimalToFraction } from '@/lib/fraction-math';
import type { BlockCell, BlockData } from '@/lib/photo-to-quilt/fabric-to-blocks';

type PaletteSwatch = { hex: string; name?: string };

type CutListItem = {
  fabricName: string;
  hex: string;
  cutInstructions: string[];
  totalYardage: number;
  wof: number;
};

type PrintListPdfInput = {
  projectName: string;
  finishedSize: { width: number; height: number };
  palette: PaletteSwatch[];
  yardage: ComputedYardage;
  cutList: CutListItem[];
  blocks: BlockData[];
  quiltLayout: { rows: number; cols: number };
  pieceSizeInches: number;
  paperSize: 'letter' | 'a4';
};

function hexToRgb(hex: string): RGB {
  const cleaned = hex.replace('#', '');
  let expanded: string;
  
  if (cleaned.length === 3 && /^[0-9a-fA-F]{3}$/.test(cleaned)) {
    expanded = cleaned[0] + cleaned[0] + cleaned[1] + cleaned[1] + cleaned[2] + cleaned[2];
  } else if (cleaned.length === 6 && /^[0-9a-fA-F]{6}$/.test(cleaned)) {
    expanded = cleaned;
  } else {
    return rgb(0, 0, 0);
  }
  
  const r = parseInt(expanded.substring(0, 2), 16) / 255;
  const g = parseInt(expanded.substring(2, 4), 16) / 255;
  const b = parseInt(expanded.substring(4, 6), 16) / 255;
  return rgb(r, g, b);
}

function getPageDimensions(paperSize: 'letter' | 'a4') {
  if (paperSize === 'a4') {
    return { width: 595.28, height: 841.89 };
  }
  return { width: 612, height: 792 };
}

function sanitizeText(text: string): string {
  return text.replace(/″/g, '"');
}

export function ulTrianglePath(x: number, y: number, cellSize: number): string {
  return `M ${x} ${y + cellSize} L ${x + cellSize} ${y + cellSize} L ${x} ${y} Z`;
}

export function lrTrianglePath(x: number, y: number, cellSize: number): string {
  return `M ${x + cellSize} ${y + cellSize} L ${x + cellSize} ${y} L ${x} ${y} Z`;
}

export function assemblySizeLabel(widthIn: number, heightIn: number): string {
  return `${toMixedNumberString(decimalToFraction(widthIn))}" × ${toMixedNumberString(decimalToFraction(heightIn))}"`;
}

export function coverFinishedSizeLine(widthIn: number, heightIn: number): string {
  return `Finished size: ${toMixedNumberString(decimalToFraction(widthIn))} × ${toMixedNumberString(decimalToFraction(heightIn))}`;
}

function drawCell(
  page: PDFPage,
  x: number,
  y: number,
  cellSize: number,
  cell: BlockCell,
): void {
  if (cell.kind === 'square') {
    page.drawRectangle({
      x,
      y,
      width: cellSize,
      height: cellSize,
      color: hexToRgb(cell.color),
    });
  } else if (cell.kind === 'hst') {
      if (cell.ulColor) {
        page.drawSvgPath(
          ulTrianglePath(x, y, cellSize),
          {
            color: hexToRgb(cell.ulColor),
            borderColor: undefined,
            borderWidth: 0,
          }
        );
      }
      if (cell.lrColor) {
        page.drawSvgPath(
          lrTrianglePath(x, y, cellSize),
          {
            color: hexToRgb(cell.lrColor),
            borderColor: undefined,
            borderWidth: 0,
        }
      );
    }
  }
}

async function addCoverPage(
  pdf: PDFDocument,
  input: PrintListPdfInput
): Promise<PDFPage> {
  const { width, height } = getPageDimensions(input.paperSize);
  const page = pdf.addPage([width, height]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold);
  const fontSize = 12;
  const margin = 50;
  let y = height - margin;

  page.drawText(sanitizeText(input.projectName), {
    x: margin,
    y,
    size: 24,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  y -= 40;

  const sizeText = sanitizeText(coverFinishedSizeLine(input.finishedSize.width, input.finishedSize.height));
  page.drawText(sizeText, { x: margin, y, size: fontSize, font, color: rgb(0, 0, 0) });
  y -= 30;

  page.drawText(sanitizeText('Palette:'), { x: margin, y, size: fontSize, font: boldFont, color: rgb(0, 0, 0) });
  y -= 25;
  const swatchSize = 20;
  let sx = margin;
  for (const swatch of input.palette) {
    page.drawRectangle({
      x: sx,
      y,
      width: swatchSize,
      height: swatchSize,
      color: hexToRgb(swatch.hex),
    });
    page.drawText(sanitizeText(swatch.hex), {
      x: sx + swatchSize + 5,
      y: y + 5,
      size: 10,
      font,
      color: rgb(0, 0, 0),
    });
    sx += swatchSize + 60;
    if (sx > width - margin) {
      sx = margin;
      y -= swatchSize + 10;
    }
  }
  y -= swatchSize + 30;

  page.drawText(sanitizeText('Total Yardage Summary:'), {
    x: margin,
    y,
    size: fontSize,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  y -= 25;
  const totalYards = input.yardage.totalYards;
  page.drawText(sanitizeText(`Total: ${toMixedNumberString(decimalToFraction(totalYards))} yd`), {
    x: margin,
    y,
    size: fontSize,
    font,
    color: rgb(0, 0, 0),
  });
  y -= 20;
  if (input.yardage.backing) {
    page.drawText(
      sanitizeText(`Backing: ${toMixedNumberString(decimalToFraction(input.yardage.backing.yardsRequired))} yd`),
      { x: margin, y, size: fontSize, font, color: rgb(0, 0, 0) }
    );
    y -= 20;
  }
  if (input.yardage.binding) {
    page.drawText(
      sanitizeText(`Binding: ${toMixedNumberString(decimalToFraction(input.yardage.binding.yardsRequired))} yd`),
      { x: margin, y, size: fontSize, font, color: rgb(0, 0, 0) }
    );
  }

  return page;
}

async function addCutListPages(
  pdf: PDFDocument,
  input: PrintListPdfInput
): Promise<PDFPage[]> {
  const { width, height } = getPageDimensions(input.paperSize);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold);
  const fontSize = 10;
  const margin = 50;
  const pages: PDFPage[] = [];
  let currentPage = pdf.addPage([width, height]);
  pages.push(currentPage);
  let y = height - margin;

  currentPage.drawText(sanitizeText('Cut List'), {
    x: margin,
    y,
    size: 16,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  y -= 30;

  for (const item of input.cutList) {
    if (y < margin + 100) {
      currentPage = pdf.addPage([width, height]);
      pages.push(currentPage);
      y = height - margin;
    }

    currentPage.drawRectangle({
      x: margin,
      y: y - 15,
      width: 20,
      height: 20,
      color: hexToRgb(item.hex),
    });

    currentPage.drawText(sanitizeText(item.fabricName), {
      x: margin + 30,
      y,
      size: fontSize + 2,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    y -= 20;

    for (const instruction of item.cutInstructions) {
      currentPage.drawText(sanitizeText(`• ${instruction}`), {
        x: margin + 10,
        y,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      });
      y -= 15;
    }

    currentPage.drawText(
      sanitizeText(`Total: ${toMixedNumberString(decimalToFraction(item.totalYardage))} yd`),
      { x: margin + 10, y, size: fontSize, font, color: rgb(0, 0, 0) }
    );
    y -= 30;
  }

  return pages;
}

async function addBlockDiagramPages(
  pdf: PDFDocument,
  input: PrintListPdfInput
): Promise<PDFPage[]> {
  const { width: pageWidth, height: pageHeight } = getPageDimensions(input.paperSize);
  const margin = 50;
  const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold);
  const pages: PDFPage[] = [];
  let currentPage = pdf.addPage([pageWidth, pageHeight]);
  pages.push(currentPage);
  let y = pageHeight - margin;

  currentPage.drawText(sanitizeText('Block Diagrams'), {
    x: margin,
    y,
    size: 16,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  y -= 30;

  const cellSize = 20;
  const blockGap = 30;

  for (let i = 0; i < input.blocks.length; i++) {
    const block = input.blocks[i];
    const blockWidth = 3 * cellSize;
    const blockHeight = 3 * cellSize;

    if (y - blockHeight < margin) {
      currentPage = pdf.addPage([pageWidth, pageHeight]);
      pages.push(currentPage);
      y = pageHeight - margin;
    }

    currentPage.drawText(sanitizeText(`Block (${block.bx}, ${block.by})`), {
      x: margin,
      y,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    y -= 20;

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const cell = block.cells[row]?.[col];
        if (!cell) continue;

        const x = margin + col * cellSize;
        const cellY = y - (row + 1) * cellSize;

        if (cell.kind === 'empty') continue;

        drawCell(currentPage, x, cellY, cellSize, cell);
      }
    }

    y -= blockHeight + blockGap;
  }

  return pages;
}

async function addAssemblyDiagramPage(
  pdf: PDFDocument,
  input: PrintListPdfInput
): Promise<PDFPage> {
  const { width: pageWidth, height: pageHeight } = getPageDimensions(input.paperSize);
  const margin = 50;
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold);
  const page = pdf.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  page.drawText(sanitizeText('Assembly Diagram'), {
    x: margin,
    y,
    size: 16,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  y -= 30;

  const totalCols = input.quiltLayout.cols * 3;
  const totalRows = input.quiltLayout.rows * 3;
  const quiltWidthIn = totalCols * input.pieceSizeInches;
  const quiltHeightIn = totalRows * input.pieceSizeInches;
  const availW = pageWidth - 2 * margin;
  const availH = y - margin;
  const scale = Math.min(availW / quiltWidthIn, availH / quiltHeightIn);
  const drawWidth = quiltWidthIn * scale;
  const drawHeight = quiltHeightIn * scale;
  const cellW = input.pieceSizeInches * scale;
  const cellH = input.pieceSizeInches * scale;
  const startX = margin;
  const startY = y - drawHeight;

  const blockMap = new Map<string, BlockData>();
  for (const block of input.blocks) {
    blockMap.set(`${block.by}-${block.bx}`, block);
  }

  for (let by = 0; by < input.quiltLayout.rows; by++) {
    for (let bx = 0; bx < input.quiltLayout.cols; bx++) {
      const block = blockMap.get(`${by}-${bx}`);
      if (!block) continue;

      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          const cell = block.cells[row]?.[col];
          if (!cell) continue;
          if (cell.kind === 'empty') continue;

          const globalRow = by * 3 + row;
          const globalCol = bx * 3 + col;
          const cx = startX + globalCol * cellW;
          const cy = startY + (totalRows - globalRow - 1) * cellH;

          drawCell(page, cx, cy, cellW, cell);
        }
      }
    }
  }

  for (let row = 0; row <= totalRows; row++) {
    const lineY = startY + (row / totalRows) * drawHeight;
    page.drawLine({
      start: { x: startX, y: lineY },
      end: { x: startX + drawWidth, y: lineY },
      thickness: 0.5,
      color: rgb(0, 0, 0),
    });
  }

  for (let col = 0; col <= totalCols; col++) {
    const lineX = startX + (col / totalCols) * drawWidth;
    page.drawLine({
      start: { x: lineX, y: startY },
      end: { x: lineX, y: startY + drawHeight },
      thickness: 0.5,
      color: rgb(0, 0, 0),
    });
  }

  for (let by = 0; by <= input.quiltLayout.rows; by++) {
    const lineY = startY + (by * 3 / totalRows) * drawHeight;
    page.drawLine({
      start: { x: startX, y: lineY },
      end: { x: startX + drawWidth, y: lineY },
      thickness: 1.5,
      color: rgb(0, 0, 0),
    });
  }

  for (let bx = 0; bx <= input.quiltLayout.cols; bx++) {
    const lineX = startX + (bx * 3 / totalCols) * drawWidth;
    page.drawLine({
      start: { x: lineX, y: startY },
      end: { x: lineX, y: startY + drawHeight },
      thickness: 1.5,
      color: rgb(0, 0, 0),
    });
  }

  const scaleRatio = quiltWidthIn / drawWidth * 96;
  page.drawText(sanitizeText(`Scale 1:${scaleRatio.toFixed(2)}`), {
    x: margin,
    y: margin - 15,
    size: 10,
    font,
    color: rgb(0, 0, 0),
  });

  const sizeLabel = sanitizeText(assemblySizeLabel(quiltWidthIn, quiltHeightIn));
  page.drawText(sizeLabel, {
    x: margin + 120,
    y: margin - 15,
    size: 10,
    font,
    color: rgb(0, 0, 0),
  });

  return page;
}

export async function generatePrintListPdf(input: PrintListPdfInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  await addCoverPage(pdf, input);
  await addCutListPages(pdf, input);
  await addBlockDiagramPages(pdf, input);
  await addAssemblyDiagramPage(pdf, input);
  return pdf.save();
}

export type { PrintListPdfInput, BlockCell, BlockData };
