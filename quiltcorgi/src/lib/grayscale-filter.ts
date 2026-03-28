/**
 * Grayscale Filter — Convert canvas colors to grayscale for value contrast checking.
 *
 * Applies luminance-based grayscale conversion to all canvas objects.
 * Stores original colors for restoration. Pure utility functions.
 */

export interface GrayscaleState {
  originalColors: Map<string, string>;
  isActive: boolean;
}

export interface CanvasObject {
  id?: string | number;
  fill?: string | null;
  stroke?: string | null;
  set: (property: string, value: string) => void;
}

/**
 * Convert RGB color to grayscale using luminance formula.
 * L = 0.299*R + 0.587*G + 0.114*B
 */
export function rgbToGrayscale(r: number, g: number, b: number): string {
  const luminance = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  return `rgb(${luminance}, ${luminance}, ${luminance})`;
}

/**
 * Convert hex color to grayscale.
 */
export function hexToGrayscale(hex: string): string {
  // Normalize hex color
  const normalized = hex.startsWith('#') ? hex : `#${hex}`;
  const cleanHex =
    normalized.length === 4
      ? `#${normalized[1]}${normalized[1]}${normalized[2]}${normalized[2]}${normalized[3]}${normalized[3]}`
      : normalized;

  // Extract RGB values
  const r = parseInt(cleanHex.slice(1, 3), 16);
  const g = parseInt(cleanHex.slice(3, 5), 16);
  const b = parseInt(cleanHex.slice(5, 7), 16);

  // Convert to grayscale
  const luminance = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  const grayHex = luminance.toString(16).padStart(2, '0');

  return `#${grayHex}${grayHex}${grayHex}`;
}

/**
 * Convert any color format to grayscale.
 */
export function colorToGrayscale(color: string): string {
  if (!color) return color;

  // Handle hex colors
  if (color.startsWith('#')) {
    return hexToGrayscale(color);
  }

  // Handle rgb() colors
  const rgbMatch = color.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1], 10);
    const g = parseInt(rgbMatch[2], 10);
    const b = parseInt(rgbMatch[3], 10);
    return rgbToGrayscale(r, g, b);
  }

  // Handle rgba() colors
  const rgbaMatch = color.match(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/);
  if (rgbaMatch) {
    const r = parseInt(rgbaMatch[1], 10);
    const g = parseInt(rgbaMatch[2], 10);
    const b = parseInt(rgbaMatch[3], 10);
    const a = rgbaMatch[4];
    const luminance = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    return `rgba(${luminance}, ${luminance}, ${luminance}, ${a})`;
  }

  // Handle named colors (basic set)
  const namedColors: Record<string, string> = {
    red: '#ff0000',
    green: '#008000',
    blue: '#0000ff',
    yellow: '#ffff00',
    orange: '#ffa500',
    purple: '#800080',
    pink: '#ffc0cb',
    brown: '#a52a2a',
    black: '#000000',
    white: '#ffffff',
    gray: '#808080',
    grey: '#808080',
  };

  const lowerColor = color.toLowerCase();
  if (namedColors[lowerColor]) {
    return hexToGrayscale(namedColors[lowerColor]);
  }

  // Return original if can't parse
  return color;
}

/**
 * Apply grayscale filter to Fabric.js canvas.
 * This is a mock implementation - actual implementation would use fabric.Canvas
 */
export function applyGrayscaleFilter(
  canvasObjects: CanvasObject[],
  state: GrayscaleState
): GrayscaleState {
  if (state.isActive) return state; // Already applied

  const originalColors = new Map<string, string>();

  // Store original colors and apply grayscale
  canvasObjects.forEach((obj, index) => {
    if (obj.fill) {
      const objectId = String(obj.id || `object_${index}`);
      originalColors.set(objectId, obj.fill);
      obj.set('fill', colorToGrayscale(obj.fill));
    }

    if (obj.stroke) {
      const strokeId = `${obj.id || `object_${index}`}_stroke`;
      originalColors.set(strokeId, obj.stroke);
      obj.set('stroke', colorToGrayscale(obj.stroke));
    }
  });

  return {
    originalColors,
    isActive: true,
  };
}

/**
 * Remove grayscale filter and restore original colors.
 */
export function removeGrayscaleFilter(
  canvasObjects: CanvasObject[],
  state: GrayscaleState
): GrayscaleState {
  if (!state.isActive) return state; // Not applied

  // Restore original colors
  canvasObjects.forEach((obj, index) => {
    const objectId = String(obj.id || `object_${index}`);
    const strokeId = `${objectId}_stroke`;

    const originalFill = state.originalColors.get(objectId);
    if (originalFill !== undefined) {
      obj.set('fill', originalFill);
    }

    const originalStroke = state.originalColors.get(strokeId);
    if (originalStroke !== undefined) {
      obj.set('stroke', originalStroke);
    }
  });

  return {
    originalColors: new Map(),
    isActive: false,
  };
}

/**
 * Toggle grayscale filter on/off.
 */
export function toggleGrayscaleFilter(
  canvasObjects: CanvasObject[],
  currentState: GrayscaleState
): GrayscaleState {
  if (currentState.isActive) {
    return removeGrayscaleFilter(canvasObjects, currentState);
  } else {
    return applyGrayscaleFilter(canvasObjects, currentState);
  }
}

/**
 * Create initial grayscale state.
 */
export function createGrayscaleState(): GrayscaleState {
  return {
    originalColors: new Map(),
    isActive: false,
  };
}
