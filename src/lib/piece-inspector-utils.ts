/**
 * Piece Inspector Engine
 *
 * Extracts geometry from SVG data, computes finished and cut dimensions,
 * formats measurements as fractional inches, generates SVG previews,
 * and produces 1:1 PDF cutting templates for individual pieces.
 *
 * Pure computation — no React, DOM, or Fabric.js dependency.
 */

import { PDFDocument, rgb, StandardFonts, LineCapStyle } from 'pdf-lib';
import {
  svgPathToPolyline,
  extractPathFromSvg,
  computeSeamOffset,
  type Point,
} from '@/lib/seam-allowance';
import { classifyPatchShape, type PatchShape } from '@/lib/cutting-chart-generator';
import { decimalToFraction, toMixedNumberString } from '@/lib/fraction-math';
import { PIXELS_PER_INCH, PDF_POINTS_PER_INCH } from '@/lib/constants';
import { polylineBoundingBox } from '@/lib/bin-packer';

// ── Types ──────────────────────────────────────────────────────────

export interface PieceGeometry {
  readonly vertices: readonly Point[];
  readonly boundingBox: {
    readonly width: number;
    readonly height: number;
    readonly minX: number;
    readonly minY: number;
  };
  readonly shapeType: PatchShape;
  readonly svgPathData: string;
  readonly isCurved: boolean;
  /** Original SVG data for classification caching */
  readonly _originalSvgData?: string;
}

export interface PieceDimensions {
  readonly finishedWidth: number;
  readonly finishedHeight: number;
  readonly cutWidth: number;
  readonly cutHeight: number;
  readonly seamAllowance: number;
  readonly specialInstructions: string | null;
}

export interface FormattedDimensions {
  readonly finishedWidth: string;
  readonly finishedHeight: string;
  readonly cutWidth: string;
  readonly cutHeight: string;
  readonly seamAllowance: string;
}

export interface PreviewOptions {
  readonly viewBoxPadding?: number;
  readonly showSeamLine?: boolean;
  readonly showDimensions?: boolean;
  readonly showGrainLine?: boolean;
}

// ── Internal Helpers ──────────────────────────────────────────────

const CURVE_COMMANDS = /[CcSsQqTtAa]/;

function detectCurves(pathData: string): boolean {
  return CURVE_COMMANDS.test(pathData);
}

/**
 * Extract polygon points from SVG polygon element.
 */
function extractPolygonVertices(svgData: string): Point[] | null {
  const polygonMatch = svgData.match(/points="([^"]+)"/);
  if (!polygonMatch) return null;
  const pairs = polygonMatch[1].trim().split(/\s+/);
  return pairs.map((pair) => {
    const [x, y] = pair.split(',').map(Number);
    return { x, y };
  });
}

/**
 * Remove duplicate closing vertex from a polyline (Z command adds it).
 */
function removeDuplicateClose(pts: Point[]): Point[] {
  if (
    pts.length > 1 &&
    Math.abs(pts[0].x - pts[pts.length - 1].x) < 0.001 &&
    Math.abs(pts[0].y - pts[pts.length - 1].y) < 0.001
  ) {
    return pts.slice(0, -1);
  }
  return pts;
}

/**
 * Convert an SVG path data string to vertices, scaling from pixels to inches.
 */
function pathToVertices(pathData: string, pxPerUnit: number): Point[] {
  const rawPts = svgPathToPolyline(pathData);
  const scaled = rawPts.map((p) => ({
    x: p.x / pxPerUnit,
    y: p.y / pxPerUnit,
  }));
  return removeDuplicateClose(scaled);
}

import { boundingBoxWithMinMax } from '@/lib/geometry-utils';

/**
 * Build the bounding box for a set of vertices (in inches).
 */
function computeBoundingBox(vertices: readonly Point[]): PieceGeometry['boundingBox'] {
  return boundingBoxWithMinMax(vertices);
}

/**
 * Format a decimal inch value as a fractional string with inch mark.
 * e.g. 3.5 -> '3 1/2"', 0.25 -> '1/4"'
 */
function formatInches(value: number): string {
  const frac = decimalToFraction(value);
  return `${toMixedNumberString(frac)}"`;
}

// ── Public API ────────────────────────────────────────────────────

/**
 * Extract geometry from SVG path data (e.g., from a Fabric.js object exported to SVG).
 *
 * @param svgData - SVG string (full element or bare path d attribute)
 * @param pxPerUnit - Pixels per unit (typically PIXELS_PER_INCH = 96)
 * @returns Piece geometry or null if extraction fails
 */
export function extractPieceGeometry(
  svgData: string,
  pxPerUnit: number = PIXELS_PER_INCH
): PieceGeometry | null {
  // Try polygon points first
  const polygonVerts = extractPolygonVertices(svgData);
  if (polygonVerts && polygonVerts.length >= 3) {
    const scaled = polygonVerts.map((p) => ({
      x: p.x / pxPerUnit,
      y: p.y / pxPerUnit,
    }));
    const bbox = computeBoundingBox(scaled);
    const classification = classifyPatchShape(svgData, 0);
    // Reconstruct polygon as path data for SVG rendering
    const pathData =
      `M ${scaled[0].x} ${scaled[0].y} ` +
      scaled
        .slice(1)
        .map((p) => `L ${p.x} ${p.y}`)
        .join(' ') +
      ' Z';
    return {
      vertices: scaled,
      boundingBox: bbox,
      shapeType: classification.shape,
      svgPathData: pathData,
      isCurved: false,
      _originalSvgData: svgData,
    };
  }

  // Try path d attribute
  const pathD = extractPathFromSvg(svgData);
  if (!pathD) {
    // Maybe svgData IS the path data itself (bare d string)
    if (svgData.trim().match(/^[MmLlHhVvCcSsQqTtAaZz]/)) {
      const vertices = pathToVertices(svgData.trim(), pxPerUnit);
      if (vertices.length < 3) return null;
      const bbox = computeBoundingBox(vertices);
      const classification = classifyPatchShape(`<path d="${svgData.trim()}"/>`, 0);
      return {
        vertices,
        boundingBox: bbox,
        shapeType: classification.shape,
        svgPathData: svgData.trim(),
        isCurved: detectCurves(svgData.trim()),
        _originalSvgData: `<path d="${svgData.trim()}"/>`,
      };
    }
    return null;
  }

  const vertices = pathToVertices(pathD, pxPerUnit);
  if (vertices.length < 3) return null;

  const bbox = computeBoundingBox(vertices);
  const classification = classifyPatchShape(svgData, 0);

  return {
    vertices,
    boundingBox: bbox,
    shapeType: classification.shape,
    svgPathData: pathD,
    isCurved: detectCurves(pathD),
    _originalSvgData: svgData,
  };
}

/**
 * Compute finished and cut dimensions with seam allowance.
 * Reuses classifyPatchShape for shape-specific cut calculations
 * (e.g., HST adds 7/8" instead of simple seam allowance doubling).
 *
 * @param geometry - Piece geometry from extractPieceGeometry
 * @param seamAllowance - Seam allowance in inches (typically 0.25)
 * @returns Piece dimensions with finished, cut, and special instructions
 */
export function computePieceDimensions(
  geometry: PieceGeometry,
  seamAllowance: number
): PieceDimensions {
  // Use cached SVG data if available to avoid redundant reconstruction
  const svgData = geometry._originalSvgData ?? `<path d="${geometry.svgPathData}"/>`;

  const classification = classifyPatchShape(svgData, seamAllowance);

  return {
    finishedWidth: classification.finishedWidth,
    finishedHeight: classification.finishedHeight,
    cutWidth: classification.cutWidth,
    cutHeight: classification.cutHeight,
    seamAllowance,
    specialInstructions: classification.specialInstructions,
  };
}

/**
 * Format dimensions as fractional inch strings.
 *
 * @param dims - Piece dimensions from computePieceDimensions
 * @returns Formatted dimension strings with inch marks
 */
export function formatPieceDimensions(dims: PieceDimensions): FormattedDimensions {
  return {
    finishedWidth: formatInches(dims.finishedWidth),
    finishedHeight: formatInches(dims.finishedHeight),
    cutWidth: formatInches(dims.cutWidth),
    cutHeight: formatInches(dims.cutHeight),
    seamAllowance: formatInches(dims.seamAllowance),
  };
}

/**
 * Generate an SVG string showing the piece with cut line (solid),
 * seam line (dashed), dimensions, and optional grain line.
 *
 * @param geometry - Piece geometry from extractPieceGeometry
 * @param seamAllowance - Seam allowance in inches
 * @param options - Preview rendering options
 * @returns SVG markup string
 */
export function generatePieceSvgPreview(
  geometry: PieceGeometry,
  seamAllowance: number,
  options: PreviewOptions = {}
): string {
  const {
    viewBoxPadding = 0.5,
    showSeamLine = true,
    showDimensions = true,
    showGrainLine = false,
  } = options;

  const { vertices, boundingBox: bbox } = geometry;
  const verticesMutable = vertices.map((v) => ({ x: v.x, y: v.y }));

  // Compute seam offset line
  const seamVertices = showSeamLine ? computeSeamOffset(verticesMutable, seamAllowance) : [];
  const seamBbox = seamVertices.length > 0 ? polylineBoundingBox(seamVertices) : bbox;

  // Use the larger of the two bounding boxes for viewBox
  const effectiveBbox =
    seamVertices.length > 0
      ? {
          minX: Math.min(bbox.minX, seamBbox.minX),
          minY: Math.min(bbox.minY, seamBbox.minY),
          width:
            Math.max(bbox.minX + bbox.width, seamBbox.minX + seamBbox.width) -
            Math.min(bbox.minX, seamBbox.minX),
          height:
            Math.max(bbox.minY + bbox.height, seamBbox.minY + seamBbox.height) -
            Math.min(bbox.minY, seamBbox.minY),
        }
      : bbox;

  const vbX = effectiveBbox.minX - viewBoxPadding;
  const vbY = effectiveBbox.minY - viewBoxPadding;
  const vbW = effectiveBbox.width + viewBoxPadding * 2;
  const vbH = effectiveBbox.height + viewBoxPadding * 2;

  // Dimension labels text
  const dims = computePieceDimensions(geometry, seamAllowance);
  const formatted = formatPieceDimensions(dims);

  const lines: string[] = [];
  lines.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vbX} ${vbY} ${vbW} ${vbH}">`);

  // Background
  lines.push(`  <rect x="${vbX}" y="${vbY}" width="${vbW}" height="${vbH}" fill="white"/>`);

  // Seam line (dashed, gray) — outer cut line
  if (showSeamLine && seamVertices.length >= 3) {
    const seamPath =
      `M ${seamVertices[0].x} ${seamVertices[0].y} ` +
      seamVertices
        .slice(1)
        .map((p) => `L ${p.x} ${p.y}`)
        .join(' ') +
      ' Z';
    lines.push(
      `  <path d="${seamPath}" fill="none" stroke="#999" stroke-width="0.02" stroke-dasharray="0.08 0.04"/>`
    );
  }

  // Finished piece line (solid, black)
  const finishedPath =
    `M ${vertices[0].x} ${vertices[0].y} ` +
    vertices
      .slice(1)
      .map((p) => `L ${p.x} ${p.y}`)
      .join(' ') +
    ' Z';
  lines.push(`  <path d="${finishedPath}" fill="none" stroke="#333" stroke-width="0.02"/>`);

  // Grain line (vertical arrow in center)
  if (showGrainLine) {
    const cx = bbox.minX + bbox.width / 2;
    const grainTop = bbox.minY + bbox.height * 0.2;
    const grainBottom = bbox.minY + bbox.height * 0.8;
    const arrowSize = Math.min(bbox.width, bbox.height) * 0.06;

    lines.push(
      `  <line x1="${cx}" y1="${grainTop}" x2="${cx}" y2="${grainBottom}" ` +
        `stroke="#666" stroke-width="0.015"/>`
    );
    // Arrow head
    lines.push(
      `  <polygon points="${cx},${grainTop} ${cx - arrowSize},${grainTop + arrowSize * 2} ` +
        `${cx + arrowSize},${grainTop + arrowSize * 2}" fill="#666"/>`
    );
  }

  // Dimension labels
  if (showDimensions) {
    const fontSize = Math.min(vbW, vbH) * 0.06;
    const widthLabel = `Cut: ${formatted.cutWidth} x ${formatted.cutHeight}`;
    const finLabel = `Fin: ${formatted.finishedWidth} x ${formatted.finishedHeight}`;
    const labelX = vbX + vbW * 0.05;
    const labelY = vbY + vbH - fontSize * 0.5;

    lines.push(
      `  <text x="${labelX}" y="${labelY - fontSize * 1.2}" ` +
        `font-family="sans-serif" font-size="${fontSize}" fill="#333">${finLabel}</text>`
    );
    lines.push(
      `  <text x="${labelX}" y="${labelY}" ` +
        `font-family="sans-serif" font-size="${fontSize}" fill="#666">${widthLabel}</text>`
    );
  }

  lines.push('</svg>');
  return lines.join('\n');
}

/**
 * Generate a 1:1 PDF of a single piece for printing as a cutting template.
 * Includes the finished piece line (dashed), cut line (solid with seam allowance),
 * a 1" validation square, and dimension labels.
 *
 * @param geometry - Piece geometry from extractPieceGeometry
 * @param seamAllowance - Seam allowance in inches
 * @param paperSize - Paper size ('letter' or 'a4')
 * @returns PDF as Uint8Array
 */
export async function generateSinglePiecePdf(
  geometry: PieceGeometry,
  seamAllowance: number,
  paperSize: 'letter' | 'a4'
): Promise<Uint8Array> {
  const PAGE_SIZES = {
    letter: { width: 8.5, height: 11, margin: 0.5 },
    a4: { width: 8.268, height: 11.693, margin: 0.5 },
  } as const;

  const pageDims = PAGE_SIZES[paperSize];
  const pts = PDF_POINTS_PER_INCH;

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const page = pdfDoc.addPage([pageDims.width * pts, pageDims.height * pts]);

  const pageHeight = page.getHeight();
  const verticesMutable = geometry.vertices.map((v) => ({ x: v.x, y: v.y }));

  // Compute seam (cut) line via Clipper offset
  const seamVertices = computeSeamOffset(verticesMutable, seamAllowance);
  const seamBbox = polylineBoundingBox(seamVertices);
  const finBbox = geometry.boundingBox;

  // Origin for drawing (use seam bbox as reference)
  const drawOriginX = seamBbox.minX;
  const drawOriginY = seamBbox.minY;

  // Position piece centered on page (within margins)
  const usableW = pageDims.width - 2 * pageDims.margin;
  const usableH = pageDims.height - 2 * pageDims.margin;
  const validationReserve = 1.6; // Space for validation square + label

  const offsetX = pageDims.margin + Math.max(0, (usableW - seamBbox.width) / 2);
  const offsetY =
    pageDims.margin +
    validationReserve +
    Math.max(0, (usableH - validationReserve - seamBbox.height - 0.5) / 2);

  // Helper: convert inches to PDF page coordinates
  const toPageX = (x: number) => (offsetX + (x - drawOriginX)) * pts;
  const toPageY = (y: number) => pageHeight - (offsetY + (y - drawOriginY)) * pts;

  // Draw 1" validation square
  const vSquareX = pageDims.margin * pts;
  const vSquareY = pageHeight - pageDims.margin * pts - 1 * pts;
  page.drawRectangle({
    x: vSquareX,
    y: vSquareY,
    width: 1 * pts,
    height: 1 * pts,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
    color: rgb(1, 1, 1),
  });
  page.drawText('This square should measure exactly 1 inch.', {
    x: vSquareX + 1 * pts + 6,
    y: vSquareY + 1 * pts - 9,
    size: 7,
    font,
    color: rgb(0.3, 0.3, 0.3),
  });

  // Draw seam/cut line (solid, black) — the outer line quilters cut on
  drawPolylineOnPdf(page, seamVertices, toPageX, toPageY, {
    r: 0,
    g: 0,
    b: 0,
    lineWidth: 1.2,
  });

  // Draw finished piece line (dashed, gray) — the sewing line
  drawPolylineOnPdf(page, verticesMutable, toPageX, toPageY, {
    r: 0.5,
    g: 0.5,
    b: 0.5,
    lineWidth: 0.6,
    dashArray: [3, 3],
    dashPhase: 0,
  });

  // Dimension labels below the piece
  const dims = computePieceDimensions(geometry, seamAllowance);
  const formatted = formatPieceDimensions(dims);

  const labelX = offsetX * pts;
  const labelBaseY = pageHeight - (offsetY + seamBbox.height + 0.3) * pts;

  page.drawText(`Shape: ${geometry.shapeType}`, {
    x: labelX,
    y: labelBaseY,
    size: 9,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  page.drawText(
    `Finished: ${formatted.finishedWidth} x ${formatted.finishedHeight}    ` +
      `Cut: ${formatted.cutWidth} x ${formatted.cutHeight}    ` +
      `Seam: ${formatted.seamAllowance}`,
    {
      x: labelX,
      y: labelBaseY - 14,
      size: 8,
      font,
      color: rgb(0.3, 0.3, 0.3),
    }
  );

  if (dims.specialInstructions) {
    page.drawText(dims.specialInstructions, {
      x: labelX,
      y: labelBaseY - 26,
      size: 8,
      font,
      color: rgb(0.4, 0.2, 0.0),
    });
  }

  // Grain line (vertical arrow)
  const grainCx = toPageX(finBbox.minX + finBbox.width / 2);
  const grainTop = toPageY(finBbox.minY + finBbox.height * 0.2);
  const grainBottom = toPageY(finBbox.minY + finBbox.height * 0.8);

  page.drawLine({
    start: { x: grainCx, y: grainTop },
    end: { x: grainCx, y: grainBottom },
    thickness: 0.5,
    color: rgb(0.4, 0.4, 0.4),
    lineCap: LineCapStyle.Round,
  });

  // Arrow head at top (grainTop has higher PDF y since y is flipped)
  const arrowPts = 3;
  page.drawLine({
    start: { x: grainCx, y: grainTop },
    end: { x: grainCx - arrowPts, y: grainTop - arrowPts * 2 },
    thickness: 0.5,
    color: rgb(0.4, 0.4, 0.4),
  });
  page.drawLine({
    start: { x: grainCx, y: grainTop },
    end: { x: grainCx + arrowPts, y: grainTop - arrowPts * 2 },
    thickness: 0.5,
    color: rgb(0.4, 0.4, 0.4),
  });

  return pdfDoc.save();
}

// ── Internal PDF Drawing ──────────────────────────────────────────

interface PdfLineOptions {
  readonly r: number;
  readonly g: number;
  readonly b: number;
  readonly lineWidth: number;
  readonly dashArray?: number[];
  readonly dashPhase?: number;
}

function drawPolylineOnPdf(
  page: ReturnType<PDFDocument['addPage']>,
  points: Point[],
  toPageX: (x: number) => number,
  toPageY: (y: number) => number,
  opts: PdfLineOptions
): void {
  if (points.length < 2) return;

  const color = rgb(opts.r, opts.g, opts.b);

  for (let i = 0; i < points.length; i++) {
    const next = (i + 1) % points.length;
    page.drawLine({
      start: { x: toPageX(points[i].x), y: toPageY(points[i].y) },
      end: { x: toPageX(points[next].x), y: toPageY(points[next].y) },
      thickness: opts.lineWidth,
      color,
      lineCap: LineCapStyle.Round,
      dashArray: opts.dashArray,
      dashPhase: opts.dashPhase,
    });
  }
}
