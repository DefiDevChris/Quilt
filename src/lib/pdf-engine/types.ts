/**
 * PDF Engine Types — shared across all PDF generation modes.
 */

import type { PDFFont, PDFImage } from 'pdf-lib';
import type { UnitSystem } from '@/types/canvas';

export type { Point } from '@/types/geometry';

export type PaperSize = 'letter' | 'a4';

export interface PdfPageDims {
  readonly width: number;
  readonly height: number;
  readonly margin: number;
}

export const PDF_PAGE_SIZES: Record<PaperSize, PdfPageDims> = {
  letter: { width: 8.5, height: 11, margin: 0.75 },
  a4: { width: 8.268, height: 11.693, margin: 0.75 },
};

export const PDF_POINTS_PER_INCH = 72;
export const PIXELS_PER_INCH = 96;

export interface PdfBranding {
  logoImage: PDFImage | null;
}

export interface PdfFonts {
  regular: PDFFont;
  bold: PDFFont;
}

// For function parameters that accept fonts
export type PdfFontsParam = PdfFonts;

export interface ShapePolyline {
  cutLine: Point[];
  seamLine: Point[] | null;
  cutBbox: BoundingBox;
  seamBbox: BoundingBox;
}

export interface BoundingBox {
  width: number;
  height: number;
  minX: number;
  minY: number;
}

export interface PrintlistItem {
  svgData: string;
  shapeName: string;
  quantity: number;
  seamAllowance: number;
  seamAllowanceEnabled?: boolean;
}

export interface BlockSnapshot {
  blockName?: string | null;
  pieces: PieceSnapshot[];
}

export interface PieceSnapshot {
  svgData: string;
  shapeType: string;
  dimensions: { width: number; height: number };
  fabricId?: string | null;
  fill: string;
}

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

export interface CutlistPdfConfig {
  items: PrintlistItem[];
  paperSize: PaperSize;
  unitSystem: UnitSystem;
  logoPng: Uint8Array | null;
  blocks: BlockSnapshot[];
}

export interface PatternPdfConfig {
  items: PrintlistItem[];
  paperSize: PaperSize;
  scale: number;
  logoPngBytes: Uint8Array | null;
}
