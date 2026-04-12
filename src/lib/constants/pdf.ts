/** Points per inch for PDF coordinate system */
export const PDF_POINTS_PER_INCH = 72;

export type PaperSize = 'letter' | 'a4';

export interface PdfPageDims {
  readonly width: number;
  readonly height: number;
  readonly margin: number;
}

/** Standard PDF page dimensions (inches) with 0.75" margins for pattern documents */
export const PDF_PAGE_SIZES: Record<PaperSize, PdfPageDims> = {
  letter: { width: 8.5, height: 11, margin: 0.75 },
  a4: { width: 8.268, height: 11.693, margin: 0.75 },
};
