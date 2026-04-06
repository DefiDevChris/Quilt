// TODO: Implement FPP (Foundation Paper Piecing) PDF generation
import type { PaperSize } from './pdf-generator';

export interface FppPdfConfig {
  blockName: string;
  patches: unknown[];
  blockWidth: number;
  blockHeight: number;
  paperSize: PaperSize;
  seamAllowance: number;
  showColors: boolean;
  showNumbers: boolean;
  logoPngBytes: Uint8Array | null;
}

export async function generateFppPdf(_config: FppPdfConfig): Promise<Uint8Array> {
  throw new Error('FPP PDF engine not yet implemented');
}
