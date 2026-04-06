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

export class FppNotImplementedError extends Error {
  constructor() {
    super('Foundation Paper Piecing PDF export is not yet available.');
    this.name = 'FppNotImplementedError';
  }
}

export async function generateFppPdf(_config: FppPdfConfig): Promise<Uint8Array> {
  throw new FppNotImplementedError();
}
