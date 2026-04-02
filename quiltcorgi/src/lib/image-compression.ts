/**
 * Mobile image compression utility.
 *
 * Handles HEIC/HEIF conversion and canvas-based downscaling
 * before S3 upload to prevent slow uploads and desktop rendering failures.
 */

const MAX_DIMENSION = 2048;
const WEBP_QUALITY = 0.8;

/**
 * Checks if a file is an HEIC/HEIF image based on MIME type or extension.
 */
function isHeicFile(file: File): boolean {
  const heicTypes = ['image/heic', 'image/heif', 'image/heic-sequence', 'image/heif-sequence'];
  if (heicTypes.includes(file.type)) return true;
  const ext = file.name.split('.').pop()?.toLowerCase();
  return ext === 'heic' || ext === 'heif';
}

/**
 * Loads a File or Blob into an HTMLImageElement.
 */
function loadImageFromFile(file: File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image from file'));
    };
    img.src = url;
  });
}

/**
 * Draws an image to an offscreen canvas, downscaling so the maximum
 * dimension does not exceed MAX_DIMENSION (2048px).
 */
function downscaleToCanvas(
  img: HTMLImageElement,
  maxDim: number = MAX_DIMENSION
): HTMLCanvasElement {
  const srcW = img.naturalWidth;
  const srcH = img.naturalHeight;
  const longest = Math.max(srcW, srcH);

  let dstW = srcW;
  let dstH = srcH;

  if (longest > maxDim) {
    const ratio = maxDim / longest;
    dstW = Math.round(srcW * ratio);
    dstH = Math.round(srcH * ratio);
  }

  const canvas = document.createElement('canvas');
  canvas.width = dstW;
  canvas.height = dstH;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context unavailable for compression');
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, dstW, dstH);

  return canvas;
}

/**
 * Converts a canvas to a compressed Blob (WebP preferred, JPEG fallback).
 */
function canvasToCompressedBlob(
  canvas: HTMLCanvasElement,
  quality: number = WEBP_QUALITY
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // Check WebP support
    const supportsWebP = canvas.toDataURL('image/webp').startsWith('data:image/webp');
    const mimeType = supportsWebP ? 'image/webp' : 'image/jpeg';

    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas toBlob returned null'));
      },
      mimeType,
      quality
    );
  });
}

/**
 * Compresses an image File for upload.
 *
 * Pipeline:
 * 1. If HEIC/HEIF, convert to JPEG via heic2any
 * 2. Draw to offscreen canvas, downscale to max 2048px
 * 3. Export as 0.8 quality WebP (or JPEG fallback)
 * 4. Return compressed Blob with correct MIME type
 *
 * If any step fails, returns the original file as a fallback.
 */
export async function compressImageForUpload(file: File): Promise<{
  blob: Blob;
  contentType: string;
  originalSize: number;
  compressedSize: number;
}> {
  const originalSize = file.size;

  try {
    let sourceBlob: Blob = file;

    // Step 1: HEIC/HEIF conversion
    if (isHeicFile(file)) {
      try {
        const heic2any = (await import('heic2any')).default;
        const converted = await heic2any({
          blob: file,
          toType: 'image/jpeg',
          quality: 0.9,
        });
        sourceBlob = Array.isArray(converted) ? converted[0] : converted;
      } catch (heicError) {
        console.warn('HEIC conversion failed, falling back to raw file:', heicError);
        sourceBlob = file;
      }
    }

    // Step 2: Load image and downscale
    const img = await loadImageFromFile(sourceBlob);
    const canvas = downscaleToCanvas(img);

    // Step 3: Export as compressed WebP/JPEG
    const compressedBlob = await canvasToCompressedBlob(canvas);
    const contentType = compressedBlob.type || 'image/webp';

    return {
      blob: compressedBlob,
      contentType,
      originalSize,
      compressedSize: compressedBlob.size,
    };
  } catch (error) {
    // Fallback: return the original file if compression fails entirely
    console.warn('Image compression failed, uploading original:', error);
    return {
      blob: file,
      contentType: file.type || 'image/jpeg',
      originalSize,
      compressedSize: file.size,
    };
  }
}
