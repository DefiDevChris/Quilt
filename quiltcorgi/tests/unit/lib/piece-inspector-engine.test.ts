import { describe, it, expect } from 'vitest';
import {
  extractPieceGeometry,
  computePieceDimensions,
  formatPieceDimensions,
  generatePieceSvgPreview,
  generateSinglePiecePdf,
  type PieceGeometry,
  type PieceDimensions,
} from '@/lib/piece-inspector-utils';
import { PIXELS_PER_INCH } from '@/lib/constants';

// ── Helpers ────────────────────────────────────────────────────────

/**
 * Build a simple rectangle SVG polygon at the given pixel dimensions.
 */
function rectPolygonSvg(w: number, h: number): string {
  return `<polygon points="0,0 ${w},0 ${w},${h} 0,${h}"/>`;
}

/**
 * Build a triangle SVG polygon at the given pixel dimensions.
 */
function trianglePolygonSvg(w: number, h: number): string {
  return `<polygon points="0,${h} ${w},${h} ${w / 2},0"/>`;
}

/**
 * Build an isosceles right triangle SVG polygon (HST - Half Square Triangle).
 * This is a right triangle with two equal legs, suitable for HST classification.
 * The triangle fits in a w x w square with the right angle at the bottom right.
 */
function hstPolygonSvg(w: number): string {
  // Points: bottom-left, bottom-right, top-right - forms a right triangle
  // with right angle at (w, w) and equal legs of length w
  return `<polygon points="0,${w} ${w},${w} ${w},0"/>`;
}

/**
 * Build a rectangle as bare path data (no SVG element wrapper).
 */
function rectPathData(w: number, h: number): string {
  return `M 0 0 L ${w} 0 L ${w} ${h} L 0 ${h} Z`;
}

// ── extractPieceGeometry ──────────────────────────────────────────

describe('piece-inspector-utils', () => {
  describe('extractPieceGeometry', () => {
    it('extracts geometry from a simple rectangle polygon at 96 pxPerUnit', () => {
      const svg = rectPolygonSvg(96, 96);
      const result = extractPieceGeometry(svg, PIXELS_PER_INCH);

      expect(result).not.toBeNull();
      expect(result!.vertices).toHaveLength(4);
      expect(result!.boundingBox.width).toBeCloseTo(1, 2);
      expect(result!.boundingBox.height).toBeCloseTo(1, 2);
      expect(result!.isCurved).toBe(false);
    });

    it('computes correct bounding box for a 2x3 inch rectangle', () => {
      const svg = rectPolygonSvg(192, 288);
      const result = extractPieceGeometry(svg, PIXELS_PER_INCH);

      expect(result).not.toBeNull();
      expect(result!.boundingBox.width).toBeCloseTo(2, 2);
      expect(result!.boundingBox.height).toBeCloseTo(3, 2);
    });

    it('extracts geometry from a triangle SVG (3 vertices)', () => {
      const svg = trianglePolygonSvg(96, 96);
      const result = extractPieceGeometry(svg, PIXELS_PER_INCH);

      expect(result).not.toBeNull();
      expect(result!.vertices).toHaveLength(3);
      expect(result!.boundingBox.width).toBeCloseTo(1, 2);
      expect(result!.boundingBox.height).toBeCloseTo(1, 2);
    });

    it('classifies isosceles right triangle shape as hst', () => {
      const svg = hstPolygonSvg(96);
      const result = extractPieceGeometry(svg, PIXELS_PER_INCH);

      expect(result).not.toBeNull();
      expect(result!.shapeType).toBe('hst');
    });

    it('classifies non-right isosceles triangle as irregular', () => {
      // This triangle is isosceles but not a right triangle
      const svg = trianglePolygonSvg(96, 96);
      const result = extractPieceGeometry(svg, PIXELS_PER_INCH);

      expect(result).not.toBeNull();
      expect(result!.shapeType).toBe('irregular');
    });

    it('extracts geometry from a bare path data string', () => {
      const pathData = rectPathData(96, 96);
      const result = extractPieceGeometry(pathData, PIXELS_PER_INCH);

      expect(result).not.toBeNull();
      expect(result!.vertices.length).toBeGreaterThanOrEqual(4);
      expect(result!.boundingBox.width).toBeCloseTo(1, 2);
      expect(result!.boundingBox.height).toBeCloseTo(1, 2);
    });

    it('extracts geometry from a path element within SVG', () => {
      const svg = `<svg viewBox="0 0 96 96"><path d="M 0 0 L 96 0 L 96 96 L 0 96 Z"/></svg>`;
      const result = extractPieceGeometry(svg, PIXELS_PER_INCH);

      expect(result).not.toBeNull();
      expect(result!.boundingBox.width).toBeCloseTo(1, 2);
      expect(result!.boundingBox.height).toBeCloseTo(1, 2);
    });

    it('returns null for invalid SVG data', () => {
      expect(extractPieceGeometry('', PIXELS_PER_INCH)).toBeNull();
    });

    it('returns null for non-SVG string', () => {
      expect(extractPieceGeometry('hello world', PIXELS_PER_INCH)).toBeNull();
    });

    it('returns null for SVG with too few vertices', () => {
      // A path with only 2 points cannot form a polygon
      const svg = `<svg><path d="M 0 0 L 96 0"/></svg>`;
      const result = extractPieceGeometry(svg, PIXELS_PER_INCH);
      expect(result).toBeNull();
    });

    it('reports isCurved true for path data with curve commands', () => {
      const curvedPath = 'M 0 0 C 30 0 60 30 96 96 L 0 96 Z';
      const result = extractPieceGeometry(curvedPath, PIXELS_PER_INCH);

      expect(result).not.toBeNull();
      expect(result!.isCurved).toBe(true);
    });

    it('reports isCurved false for straight-line path data', () => {
      const straightPath = rectPathData(96, 96);
      const result = extractPieceGeometry(straightPath, PIXELS_PER_INCH);

      expect(result).not.toBeNull();
      expect(result!.isCurved).toBe(false);
    });

    it('generates svgPathData for polygon input', () => {
      const svg = rectPolygonSvg(96, 96);
      const result = extractPieceGeometry(svg, PIXELS_PER_INCH);

      expect(result).not.toBeNull();
      expect(result!.svgPathData).toContain('M');
      expect(result!.svgPathData).toContain('Z');
    });

    it('scales vertices by the given pxPerUnit', () => {
      // Using 48 px per unit means 96px = 2 units
      const svg = rectPolygonSvg(96, 96);
      const result = extractPieceGeometry(svg, 48);

      expect(result).not.toBeNull();
      expect(result!.boundingBox.width).toBeCloseTo(2, 2);
      expect(result!.boundingBox.height).toBeCloseTo(2, 2);
    });
  });

  // ── computePieceDimensions ────────────────────────────────────────

  describe('computePieceDimensions', () => {
    it('computes correct cut dimensions for a 1x1 inch square with 0.25 seam', () => {
      const svg = rectPolygonSvg(96, 96);
      const geometry = extractPieceGeometry(svg, PIXELS_PER_INCH)!;
      const dims = computePieceDimensions(geometry, 0.25);

      expect(dims.finishedWidth).toBeCloseTo(1, 2);
      expect(dims.finishedHeight).toBeCloseTo(1, 2);
      // Square: cut = finished + 2 * seamAllowance
      expect(dims.cutWidth).toBeCloseTo(1.5, 2);
      expect(dims.cutHeight).toBeCloseTo(1.5, 2);
      expect(dims.seamAllowance).toBe(0.25);
      expect(dims.specialInstructions).toBeNull();
    });

    it('computes correct cut dimensions for a rectangle', () => {
      const svg = rectPolygonSvg(192, 96);
      const geometry = extractPieceGeometry(svg, PIXELS_PER_INCH)!;
      const dims = computePieceDimensions(geometry, 0.25);

      expect(dims.finishedWidth).toBeCloseTo(2, 2);
      expect(dims.finishedHeight).toBeCloseTo(1, 2);
      expect(dims.cutWidth).toBeCloseTo(2.5, 2);
      expect(dims.cutHeight).toBeCloseTo(1.5, 2);
    });

    it('computes HST dimensions with special instructions mentioning diagonal', () => {
      const svg = hstPolygonSvg(96);
      const geometry = extractPieceGeometry(svg, PIXELS_PER_INCH)!;
      const dims = computePieceDimensions(geometry, 0.25);

      expect(dims.specialInstructions).toBeTruthy();
      expect(dims.specialInstructions).toContain('diagonally');
    });

    it('includes HST 7/8 inch addition for isosceles right triangles', () => {
      const svg = hstPolygonSvg(96);
      const geometry = extractPieceGeometry(svg, PIXELS_PER_INCH)!;
      const dims = computePieceDimensions(geometry, 0.25);

      // HST cut size = finished size + 7/8 (0.875)
      const finishedSize = Math.max(dims.finishedWidth, dims.finishedHeight);
      expect(dims.cutWidth).toBeCloseTo(finishedSize + 0.875, 2);
    });

    it('stores seamAllowance in the result', () => {
      const svg = rectPolygonSvg(96, 96);
      const geometry = extractPieceGeometry(svg, PIXELS_PER_INCH)!;
      const dims = computePieceDimensions(geometry, 0.375);

      expect(dims.seamAllowance).toBe(0.375);
    });
  });

  // ── formatPieceDimensions ─────────────────────────────────────────

  describe('formatPieceDimensions', () => {
    it('formats whole numbers without fractions', () => {
      const dims: PieceDimensions = {
        finishedWidth: 2,
        finishedHeight: 3,
        cutWidth: 2.5,
        cutHeight: 3.5,
        seamAllowance: 0.25,
        specialInstructions: null,
      };
      const formatted = formatPieceDimensions(dims);

      expect(formatted.finishedWidth).toBe('2"');
      expect(formatted.finishedHeight).toBe('3"');
    });

    it('formats 2.5 as 2 1/2"', () => {
      const dims: PieceDimensions = {
        finishedWidth: 2.5,
        finishedHeight: 2.5,
        cutWidth: 3,
        cutHeight: 3,
        seamAllowance: 0.25,
        specialInstructions: null,
      };
      const formatted = formatPieceDimensions(dims);

      expect(formatted.finishedWidth).toBe('2 1/2"');
    });

    it('formats 2.25 as 2 1/4"', () => {
      const dims: PieceDimensions = {
        finishedWidth: 2.25,
        finishedHeight: 2.25,
        cutWidth: 2.75,
        cutHeight: 2.75,
        seamAllowance: 0.25,
        specialInstructions: null,
      };
      const formatted = formatPieceDimensions(dims);

      expect(formatted.finishedWidth).toBe('2 1/4"');
    });

    it('formats seam allowance 0.25 as 1/4"', () => {
      const dims: PieceDimensions = {
        finishedWidth: 1,
        finishedHeight: 1,
        cutWidth: 1.5,
        cutHeight: 1.5,
        seamAllowance: 0.25,
        specialInstructions: null,
      };
      const formatted = formatPieceDimensions(dims);

      expect(formatted.seamAllowance).toBe('1/4"');
    });

    it('formats seam allowance 0.375 as 3/8"', () => {
      const dims: PieceDimensions = {
        finishedWidth: 1,
        finishedHeight: 1,
        cutWidth: 1.75,
        cutHeight: 1.75,
        seamAllowance: 0.375,
        specialInstructions: null,
      };
      const formatted = formatPieceDimensions(dims);

      expect(formatted.seamAllowance).toBe('3/8"');
    });

    it('formats seam allowance 0.5 as 1/2"', () => {
      const dims: PieceDimensions = {
        finishedWidth: 1,
        finishedHeight: 1,
        cutWidth: 2,
        cutHeight: 2,
        seamAllowance: 0.5,
        specialInstructions: null,
      };
      const formatted = formatPieceDimensions(dims);

      expect(formatted.seamAllowance).toBe('1/2"');
    });

    it('formats cut dimensions with fractions', () => {
      const dims: PieceDimensions = {
        finishedWidth: 3,
        finishedHeight: 3,
        cutWidth: 3.5,
        cutHeight: 3.5,
        seamAllowance: 0.25,
        specialInstructions: null,
      };
      const formatted = formatPieceDimensions(dims);

      expect(formatted.cutWidth).toBe('3 1/2"');
      expect(formatted.cutHeight).toBe('3 1/2"');
    });
  });

  // ── generatePieceSvgPreview ───────────────────────────────────────

  describe('generatePieceSvgPreview', () => {
    function makeSquareGeometry(): PieceGeometry {
      return extractPieceGeometry(rectPolygonSvg(96, 96), PIXELS_PER_INCH)!;
    }

    it('returns a valid SVG string for a simple square', () => {
      const geometry = makeSquareGeometry();
      const svg = generatePieceSvgPreview(geometry, 0.25);

      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
      expect(svg).toContain('viewBox=');
    });

    it('includes dashed stroke when showSeamLine is true', () => {
      const geometry = makeSquareGeometry();
      const svg = generatePieceSvgPreview(geometry, 0.25, { showSeamLine: true });

      expect(svg).toContain('stroke-dasharray');
    });

    it('does not include dashed stroke when showSeamLine is false', () => {
      const geometry = makeSquareGeometry();
      const svg = generatePieceSvgPreview(geometry, 0.25, { showSeamLine: false });

      expect(svg).not.toContain('stroke-dasharray');
    });

    it('includes text elements when showDimensions is true', () => {
      const geometry = makeSquareGeometry();
      const svg = generatePieceSvgPreview(geometry, 0.25, { showDimensions: true });

      expect(svg).toContain('<text');
      expect(svg).toContain('</text>');
    });

    it('does not include text elements when showDimensions is false', () => {
      const geometry = makeSquareGeometry();
      const svg = generatePieceSvgPreview(geometry, 0.25, { showDimensions: false });

      expect(svg).not.toContain('<text');
    });

    it('includes grain line when showGrainLine is true', () => {
      const geometry = makeSquareGeometry();
      const svg = generatePieceSvgPreview(geometry, 0.25, { showGrainLine: true });

      expect(svg).toContain('<line');
      expect(svg).toContain('<polygon');
    });

    it('does not include grain line by default', () => {
      const geometry = makeSquareGeometry();
      const svg = generatePieceSvgPreview(geometry, 0.25);

      // Default showGrainLine is false, but <polygon> may appear from the piece itself
      // Check for line element which is unique to grain line
      expect(svg).not.toContain('<line');
    });

    it('includes finished piece path (solid stroke)', () => {
      const geometry = makeSquareGeometry();
      const svg = generatePieceSvgPreview(geometry, 0.25);

      // There should be a solid path for the finished piece
      expect(svg).toContain('stroke="#333"');
    });

    it('uses default options when none provided', () => {
      const geometry = makeSquareGeometry();
      const svg = generatePieceSvgPreview(geometry, 0.25);

      // Defaults: showSeamLine=true, showDimensions=true, showGrainLine=false
      expect(svg).toContain('stroke-dasharray');
      expect(svg).toContain('<text');
      expect(svg).not.toContain('<line');
    });
  });

  // ── generateSinglePiecePdf ────────────────────────────────────────

  describe('generateSinglePiecePdf', () => {
    it('returns a non-empty Uint8Array for a square on letter paper', async () => {
      const geometry = extractPieceGeometry(rectPolygonSvg(96, 96), PIXELS_PER_INCH)!;
      const pdf = await generateSinglePiecePdf(geometry, 0.25, 'letter');

      expect(pdf).toBeInstanceOf(Uint8Array);
      expect(pdf.length).toBeGreaterThan(0);
    });

    it('starts with PDF header (%PDF)', async () => {
      const geometry = extractPieceGeometry(rectPolygonSvg(96, 96), PIXELS_PER_INCH)!;
      const pdf = await generateSinglePiecePdf(geometry, 0.25, 'letter');

      const header = new TextDecoder().decode(pdf.slice(0, 5));
      expect(header).toBe('%PDF-');
    });

    it('generates PDF for a4 paper size', async () => {
      const geometry = extractPieceGeometry(rectPolygonSvg(96, 96), PIXELS_PER_INCH)!;
      const pdf = await generateSinglePiecePdf(geometry, 0.25, 'a4');

      expect(pdf).toBeInstanceOf(Uint8Array);
      expect(pdf.length).toBeGreaterThan(0);
    });

    it('generates PDF for a triangle shape', async () => {
      const geometry = extractPieceGeometry(hstPolygonSvg(96), PIXELS_PER_INCH)!;
      const pdf = await generateSinglePiecePdf(geometry, 0.25, 'letter');

      expect(pdf).toBeInstanceOf(Uint8Array);
      const header = new TextDecoder().decode(pdf.slice(0, 5));
      expect(header).toBe('%PDF-');
    });

    it('generates PDF with different seam allowance', async () => {
      const geometry = extractPieceGeometry(rectPolygonSvg(96, 96), PIXELS_PER_INCH)!;
      const pdf = await generateSinglePiecePdf(geometry, 0.5, 'letter');

      expect(pdf).toBeInstanceOf(Uint8Array);
      expect(pdf.length).toBeGreaterThan(0);
    });
  });
});
