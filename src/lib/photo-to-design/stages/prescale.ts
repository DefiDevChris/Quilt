// ============================================================================
// Stage: Pre-scale
//
// Downscales incoming images to maxDim ≤ 1024 using OffscreenCanvas before
// they ever touch a SAM tensor or `cv.Mat`. This is the single most important
// memory safeguard in the pipeline — the WASM heap budget is ~2 GB total, and
// SAM2 + OpenCV operations can easily blow past that on a 4000×3000 phone photo.
//
// The `scale` factor in the result lets downstream stages map coordinates back
// into original pixel space when needed (e.g. for user-visible overlays).
// ============================================================================

export const MAX_SCALED_DIMENSION = 1024;

export interface PrescaleResult {
  /** RGBA pixel data at the scaled dimensions. Fresh buffer — safe to transfer. */
  imageData: ImageData;
  /** originalDim / scaledDim. Multiply scaled coords by this to get original coords. */
  scale: number;
  originalWidth: number;
  originalHeight: number;
}

/**
 * Downscale the image to at most MAX_SCALED_DIMENSION on the longest side.
 * Returns the original dimensions untouched if it already fits. Always returns
 * a fresh Uint8ClampedArray (never aliases the input buffer).
 */
export function prescaleImage(
  pixels: Uint8ClampedArray,
  width: number,
  height: number
): PrescaleResult {
  const maxOrig = Math.max(width, height);

  if (maxOrig <= MAX_SCALED_DIMENSION) {
    return {
      imageData: new ImageData(new Uint8ClampedArray(pixels), width, height),
      scale: 1,
      originalWidth: width,
      originalHeight: height,
    };
  }

  const scale = maxOrig / MAX_SCALED_DIMENSION;
  const scaledW = Math.max(1, Math.round(width / scale));
  const scaledH = Math.max(1, Math.round(height / scale));

  // OffscreenCanvas keeps the whole op off the main thread (required — this
  // runs inside a worker). `drawImage` with `imageSmoothingQuality: 'high'`
  // gives us a bicubic-ish downsample without the allocation cost of a manual
  // resample loop.
  const source = new OffscreenCanvas(width, height);
  const sourceCtx = source.getContext('2d');
  if (!sourceCtx) throw new Error('OffscreenCanvas 2d context unavailable.');
  sourceCtx.putImageData(new ImageData(new Uint8ClampedArray(pixels), width, height), 0, 0);

  const target = new OffscreenCanvas(scaledW, scaledH);
  const targetCtx = target.getContext('2d');
  if (!targetCtx) throw new Error('OffscreenCanvas 2d context unavailable.');
  targetCtx.imageSmoothingEnabled = true;
  targetCtx.imageSmoothingQuality = 'high';
  targetCtx.drawImage(source, 0, 0, scaledW, scaledH);

  const imageData = targetCtx.getImageData(0, 0, scaledW, scaledH);

  return {
    imageData,
    scale,
    originalWidth: width,
    originalHeight: height,
  };
}
