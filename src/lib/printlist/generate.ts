import { PDFDocument, rgb, StandardFonts, PDFPage, RGB, Color } from 'pdf-lib';
import { ComputedYardage } from '@/lib/yardage-calculator';
import { toMixedNumberString, decimalToFraction } from '@/lib/fraction-math';

type PaletteSwatch = { hex: string; name?: string };

type CutListItem = {
  fabricName: string;
  hex: string;
  cutInstructions: string[];
  totalYardage: number;
  strips: number;
  wof: number;
};

type BlockCell = {
  color: string;
  hstColor?: string;
  hstOrientation?: 'tl-br' | 'tr-bl' | null;
};

type BlockData = {
  bx: number;
  by: number;
  cells: BlockCell[][]; // 3x3 grid
};

type PrintListPdfInput = {
  projectName: string;
  finishedSize: { width: number; height: number };
  palette: PaletteSwatch[];
  yardage: ComputedYardage;
  cutList: CutListItem[];
  blocks: BlockData[];
  quiltLayout: { rows: number; cols: number };
  paperSize: 'letter' | 'a4';
};

function hexToRgb(hex: string): RGB {
  const cleaned = hex.replace('#', '');
  const r = parseInt(cleaned.substring(0, 2), 16) / 255;
  const g = parseInt(cleaned.substring(2, 4), 16) / 255;
  const b = parseInt(cleaned.substring(4, 6), 16) / 255;
  return rgb(r, g, b);
}

function getPageDimensions(paperSize: 'letter' | 'a4') {
  if (paperSize === 'a4') {
    return { width: 595.28, height: 841.89 };
  }
  return { width: 612, height: 792 };
}

// Helper to sanitize text for PDF standard fonts (replace ″ with ")
function sanitizeText(text: string): string {
  return text.replace(/″/g, '"');
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

  // Title
  page.drawText(sanitizeText(input.projectName), {
    x: margin,
    y,
    size: 24,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  y -= 40;

  // Finished size
  const sizeText = sanitizeText(`Finished size: ${toMixedNumberString(decimalToFraction(input.finishedSize.width))} × ${toMixedNumberString(decimalToFraction(input.finishedSize.height))}`);
  page.drawText(sizeText, { x: margin, y, size: fontSize, font, color: rgb(0, 0, 0) });
  y -= 30;

  // Palette swatches
  page.drawText(sanitizeText('Palette:'), { x: margin, y, size: fontSize, font: boldFont, color: rgb(0, 0, 0) });
  y -= 25;
  const swatchSize = 20;
  const swatchGap = 10;
  let x = margin;
  for (const swatch of input.palette) {
    page.drawRectangle({
      x,
      y,
      width: swatchSize,
      height: swatchSize,
      color: hexToRgb(swatch.hex),
    });
    page.drawText(sanitizeText(swatch.hex), {
      x: x + swatchSize + 5,
      y: y + 5,
      size: 10,
      font,
      color: rgb(0, 0, 0),
    });
    x += swatchSize + 60;
    if (x > width - margin) {
      x = margin;
      y -= swatchSize + 10;
    }
  }
  y -= swatchSize + 30;

  // Total yardage summary
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
    // Check if we need a new page
    if (y < margin + 100) {
      currentPage = pdf.addPage([width, height]);
      pages.push(currentPage);
      y = height - margin;
    }

    // Swatch
    currentPage.drawRectangle({
      x: margin,
      y: y - 15,
      width: 20,
      height: 20,
      color: hexToRgb(item.hex),
    });

    // Fabric name
    currentPage.drawText(sanitizeText(item.fabricName), {
      x: margin + 30,
      y,
      size: fontSize + 2,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    y -= 20;

    // Cut instructions
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

    // Total yardage
    currentPage.drawText(
      sanitizeText(`Total: ${toMixedNumberString(decimalToFraction(item.totalYardage))} yd | ${item.strips} strips × ${item.wof}" WOF`),
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
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold);
  const fontSize = 10;
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

  const cellSize = 20; // 1:1 scale for cells
  const blockGap = 30;
  const blocksPerRow = Math.floor((pageWidth - 2 * margin) / (3 * cellSize + blockGap));

  for (let i = 0; i < input.blocks.length; i++) {
    const block = input.blocks[i];
    const blockWidth = 3 * cellSize;
    const blockHeight = 3 * cellSize;

    // Check if block fits on current page
    if (y - blockHeight < margin) {
      currentPage = pdf.addPage([pageWidth, pageHeight]);
      pages.push(currentPage);
      y = pageHeight - margin;
    }

    // Draw block coordinates
    currentPage.drawText(sanitizeText(`Block (${block.bx}, ${block.by})`), {
      x: margin,
      y,
      size: fontSize + 2,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    y -= 20;

    // Draw 3x3 grid
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const cell = block.cells[row]?.[col];
        if (!cell) continue;

        const x = margin + col * cellSize;
        const cellY = y - (row + 1) * cellSize; // inverted y for PDF

        // Draw cell background
        currentPage.drawRectangle({
          x,
          y: cellY,
          width: cellSize,
          height: cellSize,
          color: hexToRgb(cell.color),
        });

        // Draw HST orientation if present
        if (cell.hstOrientation) {
          const orientation = cell.hstOrientation;
          const midX = x + cellSize / 2;
          const midY = cellY + cellSize / 2;
          if (orientation === 'tl-br') {
            // Top-left to bottom-right diagonal
            currentPage.drawLine({
              start: { x, y: cellY + cellSize },
              end: { x: x + cellSize, y: cellY },
              thickness: 1,
              color: rgb(0, 0, 0),
            });
          } else if (orientation === 'tr-bl') {
            // Top-right to bottom-left diagonal
            currentPage.drawLine({
              start: { x, y: cellY },
              end: { x: x + cellSize, y: cellY + cellSize },
              thickness: 1,
              color: rgb(0, 0, 0),
            });
          }
        }

        // Draw HST overlay triangle if hstColor is present
        if (cell.hstColor && cell.hstOrientation) {
          const orientation = cell.hstOrientation;
          const points = orientation === 'tl-br'
            ? [
                { x, y: cellY + cellSize },
                { x: x + cellSize, y: cellY },
                { x: x + cellSize, y: cellY + cellSize },
              ]
            : [
                { x, y: cellY },
                { x: x + cellSize, y: cellY },
                { x, y: cellY + cellSize },
              ];
          currentPage.drawPolygon(points.map(p => ({ x: p.x, y: p.y })), {
            color: hexToRgb(cell.hstColor!),
          });
        }

        // Draw cell coordinates
        currentPage.drawText(sanitizeText(`${col},${row}`), {
          x: x + 2,
          y: cellY + cellSize - 12,
          size: 8,
          font,
          color: rgb(1, 1, 1),
        });
      }
    }

    y -= blockHeight + 20;

    // Draw scale legend if needed (stub for now)
    if (cellSize !== 20) { // if scaled
      currentPage.drawText(sanitizeText('Scale: 1:N'), {
        x: margin,
        y,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      });
      y -= 15;
    }

    y -= blockGap;
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
  const fontSize = 10;
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

  // Calculate quilt dimensions (simplified: rows * block height, cols * block width)
  const quiltWidth = input.quiltLayout.cols * 3 * 20; // 3 cells per block, 20px per cell
  const quiltHeight = input.quiltLayout.rows * 3 * 20;
  const scale = Math.min(
    (pageWidth - 2 * margin) / quiltWidth,
    (y - margin) / quiltHeight
  );

  const drawWidth = quiltWidth * scale;
  const drawHeight = quiltHeight * scale;
  const startX = margin;
  const startY = y - drawHeight;

  // Draw quilt grid
  for (let row = 0; row <= input.quiltLayout.rows; row++) {
    const lineY = startY + (row / input.quiltLayout.rows) * drawHeight;
    page.drawLine({
      start: { x: startX, y: lineY },
      end: { x: startX + drawWidth, y: lineY },
      thickness: 1,
      color: rgb(0, 0, 0),
    });
    // Row label
    if (row < input.quiltLayout.rows) {
      page.drawText(sanitizeText(`R${row}`), {
        x: startX - 20,
        y: lineY + drawHeight / input.quiltLayout.rows / 2 - 5,
        size: 8,
        font,
        color: rgb(0, 0, 0),
      });
    }
  }

  for (let col = 0; col <= input.quiltLayout.cols; col++) {
    const lineX = startX + (col / input.quiltLayout.cols) * drawWidth;
    page.drawLine({
      start: { x: lineX, y: startY },
      end: { x: lineX, y: startY + drawHeight },
      thickness: 1,
      color: rgb(0, 0, 0),
    });
    // Column label
    if (col < input.quiltLayout.cols) {
      page.drawText(sanitizeText(`C${col}`), {
        x: lineX + drawWidth / input.quiltLayout.cols / 2 - 5,
        y: startY - 10,
        size: 8,
        font,
        color: rgb(0, 0, 0),
      });
    }
  }

  // Fill blocks with color (simplified: use first block's color)
  if (input.blocks.length > 0) {
    const blockSize = 3 * 20 * scale;
    for (let row = 0; row < input.quiltLayout.rows; row++) {
      for (let col = 0; col < input.quiltLayout.cols; col++) {
        const blockIdx = row * input.quiltLayout.cols + col;
        const block = input.blocks[blockIdx] || input.blocks[0];
        if (!block) continue;

        const x = startX + col * blockSize;
        const blockY = startY + (input.quiltLayout.rows - row - 1) * blockSize; // inverted y

        // Fill block background with first cell color
        const firstCell = block.cells[0]?.[0];
        if (firstCell) {
          page.drawRectangle({
            x,
            y: blockY,
            width: blockSize,
            height: blockSize,
            color: hexToRgb(firstCell.color),
          });
        }
      }
    }
  }

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
