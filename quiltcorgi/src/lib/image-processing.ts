import { THUMBNAIL_SIZE, FABRIC_IMAGE_MAX_SIZE } from '@/lib/constants';

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ProcessingParams {
  crop: CropRect | null;
  scale: number;
  rotation: number;
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

export function processImage(
  img: HTMLImageElement,
  params: ProcessingParams
): HTMLCanvasElement {
  const { crop, scale, rotation } = params;

  const srcX = crop?.x ?? 0;
  const srcY = crop?.y ?? 0;
  const srcW = crop?.width ?? img.naturalWidth;
  const srcH = crop?.height ?? img.naturalHeight;

  const scaledW = Math.round(srcW * scale);
  const scaledH = Math.round(srcH * scale);

  const radians = (rotation * Math.PI) / 180;
  const cos = Math.abs(Math.cos(radians));
  const sin = Math.abs(Math.sin(radians));
  const outW = Math.round(scaledW * cos + scaledH * sin);
  const outH = Math.round(scaledW * sin + scaledH * cos);

  const finalW = Math.min(outW, FABRIC_IMAGE_MAX_SIZE);
  const finalH = Math.min(outH, FABRIC_IMAGE_MAX_SIZE);

  const canvas = document.createElement('canvas');
  canvas.width = finalW;
  canvas.height = finalH;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  ctx.translate(finalW / 2, finalH / 2);
  ctx.rotate(radians);

  const drawScale = Math.min(finalW / outW, finalH / outH, 1);
  const drawW = scaledW * drawScale;
  const drawH = scaledH * drawScale;

  ctx.drawImage(img, srcX, srcY, srcW, srcH, -drawW / 2, -drawH / 2, drawW, drawH);

  return canvas;
}

export function generateThumbnail(img: HTMLImageElement | HTMLCanvasElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = THUMBNAIL_SIZE;
  canvas.height = THUMBNAIL_SIZE;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  const srcW = 'naturalWidth' in img ? img.naturalWidth : img.width;
  const srcH = 'naturalHeight' in img ? img.naturalHeight : img.height;

  const cropSize = Math.min(srcW, srcH);
  const offsetX = (srcW - cropSize) / 2;
  const offsetY = (srcH - cropSize) / 2;

  ctx.drawImage(img, offsetX, offsetY, cropSize, cropSize, 0, 0, THUMBNAIL_SIZE, THUMBNAIL_SIZE);

  return canvas;
}

export function canvasToBlob(canvas: HTMLCanvasElement, type = 'image/jpeg', quality = 0.85): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to create blob from canvas'));
      },
      type,
      quality
    );
  });
}

export async function uploadToS3(uploadUrl: string, blob: Blob, contentType: string): Promise<void> {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    body: blob,
    headers: { 'Content-Type': contentType },
  });
  if (!res.ok) {
    throw new Error(`S3 upload failed: ${res.status}`);
  }
}
