/** Pixels per inch used for the studio canvas */
export const PIXELS_PER_INCH = 8;

/**
 * Convert a measurement in inches to canvas pixels.
 */
export function inchesToPixels(inches: number): number {
  return Math.round(inches * PIXELS_PER_INCH);
}

/**
 * Convert canvas pixels back to inches.
 */
export function pixelsToInches(pixels: number): number {
  return pixels / PIXELS_PER_INCH;
}

/**
 * Returns the aspect ratio (width / height) rounded to 2 decimal places.
 */
export function aspectRatio(widthIn: number, heightIn: number): number {
  return Math.round((widthIn / heightIn) * 100) / 100;
}
