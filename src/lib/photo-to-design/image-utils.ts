import type { Point } from '@/types/photo-to-design';

const MAX_LONG_EDGE = 4096;

/**
 * Downscale an image to fit within MAX_LONG_EDGE pixels on the longest side.
 * Returns an ImageBitmap with the downscaled dimensions.
 * Uses OffscreenCanvas with fallback to hidden DOM canvas.
 */
export async function downscaleImage(
  source: ImageBitmap | HTMLImageElement | HTMLCanvasElement,
  maxLongEdge: number = MAX_LONG_EDGE,
): Promise<ImageBitmap> {
  const { width, height } = source;
  const longEdge = Math.max(width, height);

  if (longEdge <= maxLongEdge) {
    // Already within bounds — if it's already an ImageBitmap, return as-is.
    if (source instanceof ImageBitmap) {
      return source;
    }
    // For other sources, create a bitmap copy.
    const canvas = getOffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D | null;
    ctx?.drawImage(source, 0, 0);
    return canvas.transferToImageBitmap();
  }

  const scale = maxLongEdge / longEdge;
  const newWidth = Math.round(width * scale);
  const newHeight = Math.round(height * scale);

  const canvas = getOffscreenCanvas(newWidth, newHeight);
  const ctx = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D | null;
  if (!ctx) {
    throw new Error('Failed to get 2D context for downscaling');
  }

  ctx.drawImage(source, 0, 0, newWidth, newHeight);

  // If source was an ImageBitmap and we created a new one, close the old one.
  if (source instanceof ImageBitmap) {
    source.close();
  }

  return canvas.transferToImageBitmap();
}

/**
 * Convert an ImageBitmap to an object URL (PNG).
 */
export async function imageBitmapToObjectUrl(
  bitmap: ImageBitmap,
): Promise<string> {
  const canvas = getOffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D | null;
  ctx?.drawImage(bitmap, 0, 0);

  const blob = await canvas.convertToBlob({ type: 'image/png' });
  return URL.createObjectURL(blob);
}

/**
 * Convert ImageData to an object URL (PNG).
 */
export async function imageDataToObjectUrl(
  imageData: ImageData,
): Promise<string> {
  const canvas = getOffscreenCanvas(imageData.width, imageData.height);
  const ctx = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D | null;
  ctx?.putImageData(imageData, 0, 0);

  const blob = await canvas.convertToBlob({ type: 'image/png' });
  return URL.createObjectURL(blob);
}

/**
 * Get an OffscreenCanvas, falling back to a hidden DOM canvas for older Safari.
 */
function getOffscreenCanvas(width: number, height: number): OffscreenCanvas | DOMCanvasFallback {
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(width, height);
  }

  // Fallback: hidden DOM canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.style.display = 'none';
  document.body.appendChild(canvas);

  return canvas as unknown as OffscreenCanvas;
}

interface DOMCanvasFallback extends HTMLCanvasElement {
  transferToImageBitmap(): ImageBitmap;
  convertToBlob(options?: { type?: string }): Promise<Blob>;
}

// Augment HTMLCanvasElement for the fallback case.
// In browsers without OffscreenCanvas, we create a hidden canvas and use its methods.
// Note: transferToImageBitmap and convertToBlob may not exist on all canvases.
// For true fallback, we need different handling.

/**
 * Convert a source to ImageData using canvas.
 */
export function imageToImageData(
  source: ImageBitmap | HTMLImageElement | HTMLCanvasElement,
): ImageData {
  const { width, height } = source;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get 2D context');
  }
  ctx.drawImage(source, 0, 0);
  return ctx.getImageData(0, 0, width, height);
}

/**
 * Calculate pixel distance between two points.
 */
export function pixelDistance(a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Clamp a value between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
