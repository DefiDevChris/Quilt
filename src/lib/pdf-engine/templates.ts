/**
 * PDF Template Pages — validation square, grain line, shape drawing.
 */

import { PDFPage, PDFFont, LineCapStyle, rgb, type RGB } from 'pdf-lib';
import { PDF_POINTS_PER_INCH, type BoundingBox, type Point } from './types';
import { PDF_SEMANTIC } from '@/lib/pdf-colors';

/**
 * Draw a 1" x 1" validation square with instructions.
 */
export function drawValidationSquare(page: PDFPage, font: PDFFont, x: number, y: number): void {
  const pts = PDF_POINTS_PER_INCH;
  const size = 1 * pts;

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
  const line2 = "printer settings — ensure 'Actual Size' or '100%' is selected.";

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

  page.drawLine({
    start: { x, y },
    end: { x: endX, y: endY },
    thickness: 0.75,
    color: PDF_SEMANTIC.black,
    lineCap: LineCapStyle.Round,
  });

  const arrowLen = 6;
  const arrowAngle = Math.PI / 6;

  // End arrowhead
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

  // Start arrowhead
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

/**
 * Draw a closed polyline on a PDF page.
 */
export function drawPolylinePoints(
  page: PDFPage,
  points: Point[],
  options?: { color?: RGB; lineWidth?: number; dashArray?: number[]; dashPhase?: number }
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
 * Draw a color swatch rectangle.
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
