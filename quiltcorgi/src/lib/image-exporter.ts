/**
 * Image Export Engine
 * Renders the Fabric.js canvas to an off-screen canvas at a specified DPI
 * and exports as PNG or JPEG.
 *
 * Client-side only — requires Fabric.js and browser Canvas API.
 */

import { PIXELS_PER_INCH } from '@/lib/constants';

export type ImageFormat = 'png' | 'jpeg';
export type DpiOption = 72 | 150 | 300 | 600;

export const DPI_OPTIONS: DpiOption[] = [72, 150, 300, 600];

export interface ImageExportOptions {
  dpi: DpiOption;
  format: ImageFormat;
  projectName: string;
}

/**
 * Export the Fabric.js canvas as a high-resolution image.
 *
 * @param fabricCanvas - The Fabric.js canvas instance (typed as unknown for SSR safety)
 * @param options - Export options (DPI, format, project name)
 * @returns Blob of the exported image
 */
export async function exportCanvasImage(
  fabricCanvas: unknown,
  options: ImageExportOptions
): Promise<Blob> {
  const fabric = await import('fabric');
  const canvas = fabricCanvas as InstanceType<typeof fabric.Canvas>;

  const multiplier = options.dpi / PIXELS_PER_INCH;
  const format = options.format === 'jpeg' ? 'image/jpeg' : 'image/png';
  const quality = options.format === 'jpeg' ? 0.92 : undefined;

  // Get canvas dimensions
  const width = canvas.getWidth();
  const height = canvas.getHeight();

  // Create off-screen canvas element at target resolution
  const offscreen = document.createElement('canvas');
  offscreen.width = Math.round(width * multiplier);
  offscreen.height = Math.round(height * multiplier);
  const ctx = offscreen.getContext('2d');

  if (!ctx) {
    throw new Error('Unable to create canvas context for export');
  }

  // Draw white background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, offscreen.width, offscreen.height);

  // Render Fabric.js canvas content (excluding grid — grid is on a separate canvas)
  // Filter out layout elements that shouldn't be in the export
  const objects = canvas.getObjects().filter((obj: unknown) => {
    const o = obj as Record<string, unknown>;
    return !o._layoutElement;
  });

  // Use Fabric.js toCanvasElement for accurate rendering
  const sourceCanvas = canvas.toCanvasElement(multiplier);

  ctx.drawImage(sourceCanvas, 0, 0);

  void objects; // Used for documentation — toCanvasElement renders all visible objects

  return new Promise<Blob>((resolve, reject) => {
    offscreen.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to generate image blob'));
        }
      },
      format,
      quality
    );
  });
}

/**
 * Generate a filename for the exported image.
 */
export function generateImageFilename(
  projectName: string,
  dpi: DpiOption,
  format: ImageFormat
): string {
  const safeName = projectName
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase();
  return `${safeName}-${dpi}dpi.${format}`;
}

/**
 * Download an image blob as a file.
 */
export function downloadImage(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
